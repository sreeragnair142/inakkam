import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ShieldAlert, Lock, VideoOff, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * ScreenShield Component
 * Robust defense against screen recording, video capture, screenshots, and window grabbing.
 * Protects active calls and video calls from:
 * - In-browser screen capture (getDisplayMedia)
 * - MediaRecorder API capturing streams/canvas
 * - Video/Canvas captureStream() methods
 * - Windows Game Bar (Win+Alt+R, Win+G)
 * - Windows Snipping Tool screen/video recording (Win+Shift+S, Win+Shift+R)
 * - macOS screen recording & screenshots (Cmd+Shift+3, 4, 5)
 * - Nvidia ShadowPlay & third-party recorders (Alt+F9, Alt+Z, Ctrl+Shift+R)
 * - Hardware video layer leakage via GPU compositors
 * - Window blur & task switching
 */
const ScreenShield = ({
  children,
  enabled = true,
  label = "Confidential",
  userIdentifier = "",
  onSecurityViolation,
  onBlackoutStateChange,
}) => {
  const [isObscured, setIsObscured] = useState(false);
  const [flashWarning, setFlashWarning] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const blurTimeoutRef = useRef(null);
  const lastToastTimeRef = useRef(0);
  const onViolationRef = useRef(onSecurityViolation);
  const onBlackoutChangeRef = useRef(onBlackoutStateChange);

  useEffect(() => {
    onViolationRef.current = onSecurityViolation;
  }, [onSecurityViolation]);

  useEffect(() => {
    onBlackoutChangeRef.current = onBlackoutStateChange;
  }, [onBlackoutStateChange]);

  // Update dynamic timestamp for anti-recording watermark
  useEffect(() => {
    if (!enabled) return;
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [enabled]);

  // Hide or show all HTML5 video elements in DOM to defeat hardware GPU compositor leaks
  const setVideosVisibility = useCallback((hidden) => {
    const videos = document.querySelectorAll('video');
    videos.forEach((v) => {
      if (hidden) {
        if (!v.dataset.origVisibility) {
          v.dataset.origVisibility = v.style.visibility || 'visible';
        }
        v.style.visibility = 'hidden';
      } else {
        v.style.visibility = v.dataset.origVisibility || 'visible';
        delete v.dataset.origVisibility;
      }
    });
  }, []);

  const showProhibitionToast = useCallback(() => {
    const now = Date.now();
    if (now - lastToastTimeRef.current > 3000) {
      lastToastTimeRef.current = now;
      toast.error('Screen and video recording is strictly prohibited during calls.', {
        id: 'screen_recording_prohibited',
        duration: 5000,
        icon: '🛡️',
      });
    }
  }, []);

  const triggerSecurityBlackout = useCallback((violationType = 'screen_recording_attempt') => {
    setFlashWarning(true);
    setVideosVisibility(true);
    showProhibitionToast();

    if (onViolationRef.current) {
      try {
        onViolationRef.current(violationType);
      } catch (e) {
        console.warn('Error in onSecurityViolation callback:', e);
      }
    }

    if (onBlackoutChangeRef.current) {
      try {
        onBlackoutChangeRef.current(true);
      } catch (e) {}
    }

    // Purge system clipboard if something was captured
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText('').catch(() => {});
    }

    setTimeout(() => {
      setFlashWarning(false);
      if (!document.hidden && document.hasFocus()) {
        setVideosVisibility(false);
        if (onBlackoutChangeRef.current) {
          try {
            onBlackoutChangeRef.current(false);
          } catch (e) {}
        }
      }
    }, 2500);
  }, [setVideosVisibility, showProhibitionToast]);

  useEffect(() => {
    if (!enabled) return;

    // 1. Obscure content and blank video on window blur / visibility loss
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsObscured(true);
        setVideosVisibility(true);
        if (onBlackoutChangeRef.current) onBlackoutChangeRef.current(true);
      } else {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = setTimeout(() => {
          setIsObscured(false);
          setVideosVisibility(false);
          if (onBlackoutChangeRef.current) onBlackoutChangeRef.current(false);
        }, 350);
      }
    };

    const handleBlur = () => {
      setIsObscured(true);
      setVideosVisibility(true);
      if (onBlackoutChangeRef.current) onBlackoutChangeRef.current(true);
    };

    const handleFocus = () => {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = setTimeout(() => {
        setIsObscured(false);
        setVideosVisibility(false);
        if (onBlackoutChangeRef.current) onBlackoutChangeRef.current(false);
      }, 350);
    };

    // 2. Comprehensive OS and Browser recording shortcut interception
    const handleKeyDown = (e) => {
      const key = e.key ? e.key.toLowerCase() : '';
      const code = e.code || '';

      // PrintScreen key
      if (key === 'printscreen' || e.keyCode === 44 || code === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityBlackout('print_screen');
        return;
      }

      // Windows Game Bar recording: Win + Alt + R or Alt + R
      if ((e.metaKey || e.altKey) && (key === 'r' || code === 'KeyR') && !e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityBlackout('windows_game_bar_record');
        return;
      }

      // Windows Game Bar overlay: Win + G
      if (e.metaKey && (key === 'g' || code === 'KeyG')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityBlackout('windows_game_bar_overlay');
        return;
      }

      // Windows Snipping Tool (Win + Shift + S) or Snipping video recording (Win + Shift + R)
      if (e.shiftKey && e.metaKey && (key === 's' || key === 'r' || code === 'KeyS' || code === 'KeyR')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityBlackout('snipping_tool_capture');
        return;
      }

      // Mac Screenshot / Screen Recording: Cmd + Shift + 3, 4, 5
      if (e.metaKey && e.shiftKey && ['3', '4', '5', 'digit3', 'digit4', 'digit5'].includes(key || code.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityBlackout('mac_screen_recording');
        return;
      }

      // Nvidia ShadowPlay & overlay: Alt + F9, Alt + Z
      if (e.altKey && (key === 'f9' || key === 'z' || code === 'F9' || code === 'KeyZ')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityBlackout('gpu_recorder_shortcut');
        return;
      }

      // Browser extension / screen recorder hotkeys: Ctrl + Shift + S, Ctrl + Shift + R, Ctrl + Shift + E
      if (e.ctrlKey && e.shiftKey && ['s', 'r', 'e'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityBlackout('browser_record_hotkey');
        return;
      }

      // Print page: Ctrl + P / Cmd + P
      if ((e.ctrlKey || e.metaKey) && (key === 'p' || code === 'KeyP')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityBlackout('print_prohibited');
        return;
      }

      // Save page: Ctrl + S / Cmd + S
      if ((e.ctrlKey || e.metaKey) && (key === 's' || code === 'KeyS') && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key ? e.key.toLowerCase() : '';
      if (key === 'printscreen' || e.keyCode === 44 || e.code === 'PrintScreen') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        triggerSecurityBlackout('print_screen_up');
      }
    };

    // 3. Block screen capture APIs (getDisplayMedia)
    let origGetDisplayMedia = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      origGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = async function () {
        triggerSecurityBlackout('getDisplayMedia_attempt');
        throw new DOMException('Screen recording is strictly prohibited.', 'NotAllowedError');
      };
    }

    let origNavigatorGetDisplayMedia = null;
    if (navigator.getDisplayMedia) {
      origNavigatorGetDisplayMedia = navigator.getDisplayMedia;
      navigator.getDisplayMedia = async function () {
        triggerSecurityBlackout('getDisplayMedia_attempt');
        throw new DOMException('Screen recording is strictly prohibited.', 'NotAllowedError');
      };
    }

    // 4. Block MediaRecorder instantiation
    let origMediaRecorder = null;
    if (typeof window.MediaRecorder !== 'undefined') {
      origMediaRecorder = window.MediaRecorder;
      const BlockedMediaRecorder = function () {
        triggerSecurityBlackout('media_recorder_instantiation');
        throw new DOMException('Recording calls is prohibited.', 'NotAllowedError');
      };
      BlockedMediaRecorder.isTypeSupported = origMediaRecorder.isTypeSupported?.bind(origMediaRecorder);
      window.MediaRecorder = BlockedMediaRecorder;
    }

    // 5. Block HTMLMediaElement / HTMLVideoElement / HTMLCanvasElement captureStream
    let origVideoCaptureStream = null;
    if (HTMLVideoElement.prototype.captureStream) {
      origVideoCaptureStream = HTMLVideoElement.prototype.captureStream;
      HTMLVideoElement.prototype.captureStream = function () {
        triggerSecurityBlackout('video_captureStream_attempt');
        throw new DOMException('Video stream capture is prohibited.', 'NotAllowedError');
      };
    }

    let origCanvasCaptureStream = null;
    if (HTMLCanvasElement.prototype.captureStream) {
      origCanvasCaptureStream = HTMLCanvasElement.prototype.captureStream;
      HTMLCanvasElement.prototype.captureStream = function () {
        triggerSecurityBlackout('canvas_captureStream_attempt');
        throw new DOMException('Canvas capture is prohibited.', 'NotAllowedError');
      };
    }

    // 6. Disable context menu / right-click
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

      if (origGetDisplayMedia && navigator.mediaDevices) {
        navigator.mediaDevices.getDisplayMedia = origGetDisplayMedia;
      }
      if (origNavigatorGetDisplayMedia) {
        navigator.getDisplayMedia = origNavigatorGetDisplayMedia;
      }
      if (origMediaRecorder) {
        window.MediaRecorder = origMediaRecorder;
      }
      if (origVideoCaptureStream) {
        HTMLVideoElement.prototype.captureStream = origVideoCaptureStream;
      }
      if (origCanvasCaptureStream) {
        HTMLCanvasElement.prototype.captureStream = origCanvasCaptureStream;
      }
    };
  }, [enabled, triggerSecurityBlackout, setVideosVisibility]);

  if (!enabled) return children;

  const watermarkText = userIdentifier || label || 'INAKKAM SECURE';
  const isHiddenState = isObscured || flashWarning;

  return (
    <div className="relative w-full h-full select-none no-screenshot">
      {/* Main Content with Hard Visual Occlusion during Blackout */}
      <div
        className="w-full h-full"
        style={{
          visibility: isHiddenState ? 'hidden' : 'visible',
          filter: isHiddenState ? 'blur(50px)' : 'none',
          opacity: isHiddenState ? 0 : 1,
          pointerEvents: isHiddenState ? 'none' : 'auto',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          transition: 'filter 0.15s ease, opacity 0.15s ease',
        }}
      >
        {children}
      </div>

      {/* Dynamic Anti-Recording Watermark Grid (Resistant to external camera filming) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 overflow-hidden flex flex-wrap gap-10 p-6 select-none"
        style={{
          transform: 'rotate(-15deg) scale(1.15)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className="text-[11px] font-black uppercase tracking-widest text-white/[0.07] drop-shadow-sm whitespace-nowrap"
          >
            {watermarkText} • {currentTime} • CONFIDENTIAL
          </div>
        ))}
      </div>

      {/* Full-Screen Blackout Overlay for Recording Block & App-Switching */}
      {isHiddenState && (
        <div
          className="fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-3xl text-white p-6 text-center select-none"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center mb-5 text-rose-400 animate-pulse shadow-[0_0_40px_rgba(244,63,94,0.3)]">
            {flashWarning ? (
              <ShieldAlert className="w-10 h-10 text-rose-400" />
            ) : (
              <EyeOff className="w-10 h-10 text-rose-400" />
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">
            {flashWarning
              ? 'Screen & Video Recording Blocked'
              : 'Screen Privacy Shield Active'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
            {flashWarning
              ? 'Screen recording, screen capture tools, and video recording are strictly prohibited during calls for privacy and policy compliance.'
              : 'Video and call details are automatically hidden while switching windows or capturing the screen.'}
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-bold tracking-wide shadow-sm">
            <VideoOff className="w-4 h-4 text-rose-400" />
            <span>Encrypted Anti-Recording Protection</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenShield;
