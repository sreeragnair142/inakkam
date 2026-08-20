import React, { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import loaderLogo from "./assets/loaderinakkam.png";
import { motion, AnimatePresence } from "framer-motion";
import { Provider, useSelector, useDispatch } from "react-redux";
import { BrowserRouter, useNavigate, useLocation } from "react-router-dom";
import { store } from "./redux/store";
import { fetchMe } from "./redux/slices/authSlice";
import { initiateSocketConnection, disconnectSocket } from "./utils/socket";
import { addMessage, setTyping, removeMessage } from "./redux/slices/chatSlice";
import { addNotification } from "./redux/slices/notificationSlice";
import AppRoutes from "./routes";

import { Toaster } from "react-hot-toast";
import { useRegisterSW } from 'virtual:pwa-register/react';
import PWAUpdatePrompt from "./components/PWAUpdatePrompt";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

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
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none animate-pulse"
        style={{
          background: "radial-gradient(circle, rgba(213,22,89,0.15) 0%, rgba(180,77,220,0.08) 40%, rgba(10,10,10,0) 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-[#D51659] blur-3xl opacity-20 rounded-full scale-150 animate-pulse" />
          <img
            src={loaderLogo}
            alt="Inakkam"
            className="w-40 md:w-56 h-auto drop-shadow-[0_10px_30px_rgba(213,22,89,0.4)] relative z-10 hover:scale-105 transition-transform duration-700"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 flex flex-col items-center text-center"
        >
          <h2 className="text-xl md:text-2xl font-black text-white tracking-wide drop-shadow-md">
            Welcome to Inakkam
          </h2>
          <p className="text-[10px] md:text-xs font-bold text-[#D51659] mt-2 tracking-[0.3em] uppercase drop-shadow-sm">
            Infinite Match
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mt-12 w-48 md:w-64 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm shadow-inner relative"
        >
          <motion.div
            className="h-full rounded-full shadow-[0_0_12px_rgba(213,22,89,0.8)] relative"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #D51659 0%, #b44ddc 100%)",
            }}
            transition={{ duration: 0.15 }}
          >
            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/40 blur-[1px]" />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* Inner app component that has access to router context */
function AppContent() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, isGuest } = useSelector((state) => state.auth);
  const token = localStorage.getItem('inakkam_token');

  // PWA register and update hook
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error: ', error);
    },
  });

  // ─── App Initialization ─────────────────────────────
  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(fetchMe());
    }
  }, [dispatch, token, isAuthenticated]);

  // ─── Socket Integration ──────────────────────────────
  useEffect(() => {
    const currentUserId = user?._id || user?.id;
    if (isAuthenticated && currentUserId && token && !isGuest) {
      const socket = initiateSocketConnection(currentUserId, token);

      socket.on('new_message', (message) => {
        dispatch(addMessage(message));
      });

      socket.on('message_deleted', ({ conversationId, messageId }) => {
        dispatch(removeMessage({ chatId: conversationId, messageId }));
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
      <PWAInstallPrompt />
      {needRefresh && (
        <PWAUpdatePrompt updateSW={updateServiceWorker} />
      )}
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
