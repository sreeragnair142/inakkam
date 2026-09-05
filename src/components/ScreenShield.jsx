import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * ScreenShield Component
 * Protects confidential content (Chat, VideoCall) from screenshots, screen grabs,
 * screen recordings, print/PDF exports, and app-switcher previews.
 */
const ScreenShield = ({ children, enabled = true, label = "Confidential", userIdentifier = "" }) => {
  const [isObscured, setIsObscured] = useState(false);
  const [flashWarning, setFlashWarning] = useState(false);
  const blurTimeoutRef = useRef(null);
  const lastToastTimeRef = useRef(0);

  const showProhibitionToast = () => {
    const now = Date.now();
    if (now - lastToastTimeRef.current > 3000) {
      lastToastTimeRef.current = now;
      toast.error('Screenshots & screen recordings are strictly prohibited for privacy.', {
        id: 'screen_shield_warning',
        duration: 4000,
        icon: '🛡️',
      });
    }
  };

  const triggerSecurityBlackout = () => {
    setFlashWarning(true);
    showProhibitionToast();

    // Clear system clipboard if something was copied via PrintScreen
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText('').catch(() => {});
    }

    setTimeout(() => {
      setFlashWarning(false);
    }, 2000);
  };

  useEffect(() => {
    if (!enabled) return;

    // 1. Obscure content whenever window loses focus or page visibility changes
    // (Happens during OS screenshot tools like Snipping Tool, Win+Shift+S, Mac Cmd+Shift+4, screen recording overlays, or task switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsObscured(true);
      } else {
        // Small delay when returning so screenshot tools don't capture during window focus transition
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = setTimeout(() => {
          setIsObscured(false);
        }, 400);
      }
    };

    const handleBlur = () => {
      setIsObscured(true);
    };

    const handleFocus = () => {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = setTimeout(() => {
        setIsObscured(false);
      }, 400);
    };

    // 2. Keyboard shortcuts detection (PrintScreen, Mac screenshot, Print, Save)
    const handleKeyDown = (e) => {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.keyCode === 44 || e.code === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityBlackout();
        return;
      }

      // Windows Snipping Tool (Win + Shift + S) or Shift + Meta + S
      if (e.shiftKey && (e.metaKey || e.key === 'Meta') && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
        e.preventDefault();
        triggerSecurityBlackout();
        return;
      }

      // Mac Screenshot shortcuts: Cmd + Shift + 3, 4, 5
      if (e.metaKey && e.shiftKey && ['3', '4', '5', 'Digit3', 'Digit4', 'Digit5'].includes(e.code || e.key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityBlackout();
        return;
      }

      // Print page (Ctrl + P / Cmd + P)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.code === 'KeyP')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityBlackout();
        return;
      }

      // Save page (Ctrl + S / Cmd + S)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS') && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44 || e.code === 'PrintScreen') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        triggerSecurityBlackout();
      }
    };

    // 3. Block screen capture API if attempted in-browser
    let originalGetDisplayMedia = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = async function () {
        triggerSecurityBlackout();
        throw new DOMException('Screen recording is prohibited.', 'NotAllowedError');
      };
    }

    // 4. Disable context menu / right click
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('contextmenu', handleContextMenu);
      clearTimeout(blurTimeoutRef.current);

      if (originalGetDisplayMedia && navigator.mediaDevices) {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      }
    };
  }, [enabled]);

  if (!enabled) return children;

  const watermarkText = userIdentifier || label || 'INAKKAM SECURE';

  return (
    <div className="relative w-full h-full select-none no-screenshot">
      {/* Main Content */}
      <div
        className={`w-full h-full transition-filter duration-200 ${
          isObscured || flashWarning ? 'blur-2xl opacity-0 pointer-events-none' : ''
        }`}
        style={{
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      >
        {children}
      </div>

      {/* Faint Security Watermark Overlay across entire screen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden opacity-[0.035] flex flex-wrap gap-12 p-6 select-none"
        style={{
          transform: 'rotate(-18deg) scale(1.15)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="text-xs font-black uppercase tracking-widest text-slate-900 whitespace-nowrap">
            {watermarkText} • PROTECTED
          </div>
        ))}
      </div>

      {/* Obscure Shield Overlay (Shown on Window Blur / Screenshot attempt / App switch) */}
      {(isObscured || flashWarning) && (
        <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-3xl text-white p-6 text-center select-none animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4 text-rose-400 animate-pulse shadow-lg shadow-rose-500/20">
            {flashWarning ? <ShieldAlert className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
          </div>
          <h3 className="text-lg font-bold tracking-tight text-white mb-2">
            {flashWarning ? 'Screenshot & Recording Blocked' : 'Privacy Protection Active'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            {flashWarning
              ? 'Screenshots, screen recording, and print captures are strictly disabled for your privacy and safety.'
              : 'Screen content is hidden while switching apps or capturing the screen.'}
          </p>
          <div className="mt-5 px-3 py-1.5 rounded-full bg-white/10 text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            End-to-End Privacy Shield Enabled
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenShield;
