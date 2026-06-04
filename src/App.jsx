import React, { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import loaderLogo from "./assets/loaderinakkam.png";
import { motion, AnimatePresence } from "framer-motion";
import { Provider, useSelector, useDispatch } from "react-redux";
import { BrowserRouter, useNavigate, useLocation } from "react-router-dom";
import { store } from "./redux/store";
import { fetchMe } from "./redux/slices/authSlice";
import { initiateSocketConnection, disconnectSocket } from "./utils/socket";
import { addMessage, setTyping } from "./redux/slices/chatSlice";
import { addNotification } from "./redux/slices/notificationSlice";
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
      style={{ background: "linear-gradient(135deg, #0A0A0A 0%, #1a0a15 30%, #15061a 60%, #0d0515 80%, #0A0A0A 100%)" }}
    >
      {/* Subtle radial glow behind logo */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(213,22,89,0.25) 0%, rgba(180,77,220,0.1) 40%, rgba(10,10,10,0) 70%)",
        }}
      />

      {/* Logo image with scale animation */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
        className="relative z-10"
      >
        <img
          src={loaderLogo}
          alt="Inakkam Loader"
          className="w-48 md:w-64 h-auto drop-shadow-[0_0_15px_rgba(213,22,89,0.3)] animate-pulse"
        />
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-sm font-semibold text-white/50 mt-2 tracking-wide"
      >
        Infinite Match
      </motion.p>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="mt-10 w-48 h-1.5 bg-white/10 rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #D51659 0%, #b44ddc 100%)",
          }}
          transition={{ duration: 0.1 }}
        />
      </motion.div>
    </motion.div>
  );
}

/* Inner app component that has access to router context */
function AppContent() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, isGuest } = useSelector((state) => state.auth);
  const token = localStorage.getItem('inakkam_token');

  // ─── App Initialization ─────────────────────────────
  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(fetchMe());
    }
  }, [dispatch, token, isAuthenticated]);

  // ─── Socket Integration ──────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user?._id && token && !isGuest) {
      const socket = initiateSocketConnection(user._id, token);

      socket.on('new_message', (message) => {
        dispatch(addMessage(message));
      });

      socket.on('user_typing', ({ userId, conversationId }) => {
        dispatch(setTyping(true));
      });

      socket.on('user_stop_typing', ({ userId, conversationId }) => {
        dispatch(setTyping(false));
      });

      socket.on('new_notification', (notif) => {
        dispatch(addNotification(notif));
      });

      return () => {
        disconnectSocket();
      };
    }
  }, [isAuthenticated, user, token, isGuest, dispatch]);

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
