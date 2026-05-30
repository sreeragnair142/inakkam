import React, { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Provider, useSelector } from "react-redux";
import { BrowserRouter, useNavigate, useLocation } from "react-router-dom";
import { store } from "./redux/store";
import AppRoutes from "./routes";

import { Toaster } from "react-hot-toast";

function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const step = prev < 70 ? 3 : prev < 90 ? 1.5 : 4;
        return Math.min(prev + step, 100);
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => {
        onComplete();
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#F5C842" }}
    >
      {/* Subtle radial glow behind logo */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(245,200,66,0) 70%)",
        }}
      />

      {/* Logo icon with scale animation */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
        className="relative"
      >
        <div className="w-28 h-28 bg-[#1E1E1E] rounded-[2.2rem] flex items-center justify-center shadow-2xl shadow-black/25 relative">
          {/* Pulsing glow ring */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-[#1E1E1E] rounded-[2.2rem] blur-xl"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Flame className="w-14 h-14 text-[#F5C842] relative z-10" />
          </motion.div>
        </div>
      </motion.div>

      {/* App name with fade-in */}
      <motion.h1
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        className="text-5xl font-black text-[#1E1E1E] tracking-tight mt-6"
      >
        Inakkam
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-sm font-semibold text-[#1E1E1E]/60 mt-2 tracking-wide"
      >
        Infinite Match
      </motion.p>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="mt-10 w-48 h-1.5 bg-[#1E1E1E]/10 rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #1E1E1E 0%, #1E1E1E 100%)",
          }}
          transition={{ duration: 0.1 }}
        />
      </motion.div>
    </motion.div>
  );
}

/* Inner app component that has access to router context */
function AppContent() {
  return (
    <>
      <AppRoutes />
      <Toaster position="top-center" />
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
