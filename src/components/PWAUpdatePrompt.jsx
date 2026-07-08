import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

/**
 * PWAUpdatePrompt — Shows a sleek toast when a new service worker is available.
 * Uses the `registerSW` callback from vite-plugin-pwa.
 */
export default function PWAUpdatePrompt({ updateSW }) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (updateSW) {
      setShowUpdate(true);
    }
  }, [updateSW]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await updateSW(true);
    } catch {
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9998] w-[92%] max-w-sm"
        >
          <div
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: 'rgba(20, 15, 25, 0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(213, 22, 89, 0.15)',
            }}
          >
            {/* Gradient accent line at top */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: 'linear-gradient(90deg, #D51659, #b44ddc, #D51659)',
                backgroundSize: '200% 100%',
                animation: 'gradient-x 3s ease infinite',
              }}
            />

            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(213, 22, 89, 0.2), rgba(180, 77, 220, 0.2))',
                }}
              >
                <RefreshCw
                  size={18}
                  className={`text-pink-400 ${updating ? 'animate-spin' : ''}`}
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">New Update Available</p>
                <p className="text-xs text-white/40 mt-0.5">Tap to get the latest features</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #D51659, #b44ddc)',
                    boxShadow: '0 4px 15px rgba(213, 22, 89, 0.3)',
                  }}
                >
                  {updating ? 'Updating…' : 'Update'}
                </button>

                <button
                  onClick={() => setShowUpdate(false)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
