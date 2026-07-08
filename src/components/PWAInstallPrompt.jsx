import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Zap, WifiOff, Bell } from 'lucide-react';

/**
 * PWAInstallPrompt — A premium install banner that captures the
 * beforeinstallprompt event and shows a beautiful modal encouraging
 * users to install the app.
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed or previously dismissed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone;
    const dismissed = localStorage.getItem('inakkam_pwa_dismissed');

    if (isStandalone || dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after a delay so user has engaged first
      setTimeout(() => setShowPrompt(true), 15000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
    } catch {
      // Silently handle
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem('inakkam_pwa_dismissed', 'true');
  }, []);

  const features = [
    { icon: Zap, label: 'Lightning fast experience' },
    { icon: WifiOff, label: 'Works offline' },
    { icon: Bell, label: 'Instant notifications' },
  ];

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 z-[9997]"
            style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[9998] px-4 pb-6 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-sm sm:px-0"
          >
            <div
              className="relative overflow-hidden rounded-3xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(20, 15, 25, 0.95) 0%, rgba(30, 15, 30, 0.95) 100%)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(213, 22, 89, 0.1)',
              }}
            >
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-all z-10"
              >
                <X size={18} />
              </button>

              {/* Decorative gradient blob */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(213, 22, 89, 0.25) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                }}
              />

              {/* App icon */}
              <div className="flex justify-center mb-5">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: 'spring', damping: 15 }}
                  className="relative"
                >
                  <div
                    className="w-20 h-20 rounded-[22px] overflow-hidden flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #0A0A0A, #1a0a15)',
                      boxShadow: '0 8px 30px rgba(213, 22, 89, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <img
                      src="/icons/icon-192x192.png"
                      alt="Inakkam"
                      className="w-16 h-16 object-contain"
                    />
                  </div>

                  {/* Shine effect */}
                  <div
                    className="absolute inset-0 rounded-[22px] pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
                    }}
                  />
                </motion.div>
              </div>

              {/* Title */}
              <h2
                className="text-center text-xl font-bold mb-1"
                style={{
                  background: 'linear-gradient(135deg, #ffffff, rgba(255,255,255,0.8))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Install Inakkam
              </h2>
              <p className="text-center text-sm text-white/40 mb-6">
                Add to your home screen for the best experience
              </p>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {features.map(({ icon: Icon, label }, idx) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(213, 22, 89, 0.15), rgba(180, 77, 220, 0.15))',
                      }}
                    >
                      <Icon size={15} className="text-pink-400" />
                    </div>
                    <span className="text-sm text-white/70 font-medium">{label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Install button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleInstall}
                disabled={installing}
                className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #D51659 0%, #b44ddc 100%)',
                  boxShadow: '0 8px 25px rgba(213, 22, 89, 0.35)',
                }}
              >
                {installing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Installing…
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Install App
                  </>
                )}
              </motion.button>

              {/* Dismiss link */}
              <button
                onClick={handleDismiss}
                className="w-full mt-3 py-2 text-xs text-white/25 hover:text-white/40 transition-colors text-center"
              >
                Not now
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
