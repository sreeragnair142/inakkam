import React, { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import loaderLogo from "./assets/loaderinakkam.png";
import { motion, AnimatePresence } from "framer-motion";
import { Provider, useSelector, useDispatch } from "react-redux";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { store } from "./redux/store";
import { fetchMe } from "./redux/slices/authSlice";
import { initiateSocketConnection, disconnectSocket } from "./utils/socket";
import { addMessage, setTyping, removeMessage, fetchConversations, setActiveChat } from "./redux/slices/chatSlice";
import { addNotification } from "./redux/slices/notificationSlice";
import { playNotificationSound } from "./utils/notificationSounds";
import AppRoutes from "./routes";

import { Toaster } from "react-hot-toast";
import { useRegisterSW } from 'virtual:pwa-register/react';
import PWAUpdatePrompt from "./components/PWAUpdatePrompt";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import GiftBoxClaimModal from "./components/GiftBoxClaimModal";

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
      if (r?.navigationPreload) {
        r.navigationPreload.disable().catch(() => {});
      }
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

  const navigate = useNavigate();

  // ─── Socket Integration ──────────────────────────────
  const currentUserId = user?._id || user?.id;
  useEffect(() => {
    if (isAuthenticated && currentUserId && token && !isGuest) {
      const socket = initiateSocketConnection(currentUserId, token);

      const handleNewMessage = (message) => {
        dispatch(addMessage(message));
        // Keep conversation list / previews in sync
        dispatch(fetchConversations());

        const senderId = message?.sender?._id || message?.sender?.id || message?.sender;
        const isFromOther = String(senderId) !== String(currentUserId);

        if (isFromOther) {
          // Play user's preferred notification sound
          const soundPref = localStorage.getItem('inakkam_notification_sound') || user?.notificationSound || 'default';
          playNotificationSound(soundPref);

          const senderName = message?.sender?.name || message?.senderName || 'New Message';
          const senderPhoto = message?.sender?.photos?.[0]?.url || message?.sender?.images?.[0] || '';
          const previewText = message?.text || (message?.imageUrl ? '📷 Sent a photo' : 'Sent an attachment');

          // Record notification in Redux store
          dispatch(addNotification({
            id: `msg_${message._id || Date.now()}`,
            type: 'message',
            title: senderName,
            message: previewText,
            avatar: senderPhoto,
            conversationId: message?.conversation || message?.conversationId,
            senderId,
            time: 'Just now',
          }));

          // Show rich toast notification everywhere (including on /chat)
          const convId = message?.conversation || message?.conversationId;
          toast.custom(
            (t) => (
              <div
                onClick={() => {
                  toast.dismiss(t.id);
                  if (convId) {
                    dispatch(setActiveChat(convId));
                  }
                  navigate('/chat');
                }}
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-sm w-full bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl p-3.5 flex items-center gap-3 border border-pink-200/70 cursor-pointer hover:scale-[1.02] active:scale-98 transition-all pointer-events-auto`}
              >
                <div className="relative shrink-0">
                  <img
                    src={senderPhoto || 'https://via.placeholder.com/40'}
                    alt={senderName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-black text-slate-900 truncate">{senderName}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{previewText}</p>
                </div>
                <span className="text-[10px] font-black text-[#D51659] bg-[#D51659]/10 px-2.5 py-1 rounded-full shrink-0">
                  Reply
                </span>
              </div>
            ),
            { duration: 4500, id: `toast_msg_${senderId}_${Date.now()}` }
          );
        }
      };

      const handleIncomingCall = (callData) => {
        const callerName = callData?.callerName || 'Someone';
        const callTypeLabel = callData?.callType === 'audio' ? 'Voice Call' : 'Video Call';
        const soundPref = localStorage.getItem('inakkam_notification_sound') || user?.notificationSound || 'bell';
        playNotificationSound(soundPref);

        dispatch(addNotification({
          id: `call_${callData?.roomId || Date.now()}`,
          type: 'call',
          title: callerName,
          message: `Incoming ${callTypeLabel}`,
          avatar: callData?.callerPhoto || '',
          roomId: callData?.roomId,
          callType: callData?.callType || 'video',
          callerId: callData?.callerId,
          conversationId: callData?.conversationId,
          time: 'Just now',
        }));
      };

      const handleCallEnded = (data) => {
        if (data?.missed) {
          dispatch(addNotification({
            id: `missed_${Date.now()}`,
            type: 'missed_call',
            title: data?.callerName || 'Missed Call',
            message: `Missed ${data?.callType === 'audio' ? 'voice' : 'video'} call`,
            avatar: data?.callerPhoto || '',
            time: 'Just now',
          }));
        }
      };

      socket.on('new_message', handleNewMessage);
      socket.on('incoming_call', handleIncomingCall);
      socket.on('call_ended', handleCallEnded);

      socket.on('message_deleted', ({ conversationId, messageId }) => {
        dispatch(removeMessage({ chatId: conversationId, messageId }));
      });

      socket.on('user_typing', () => {
        dispatch(setTyping(true));
      });

      socket.on('user_stop_typing', () => {
        dispatch(setTyping(false));
      });

      socket.on('new_notification', (notif) => {
        dispatch(addNotification(notif));
        const soundPref = localStorage.getItem('inakkam_notification_sound') || user?.notificationSound || 'default';
        playNotificationSound(soundPref);
      });

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('incoming_call', handleIncomingCall);
        socket.off('call_ended', handleCallEnded);
        socket.off('message_deleted');
        socket.off('user_typing');
        socket.off('user_stop_typing');
        socket.off('new_notification');
      };
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, currentUserId, token, isGuest, dispatch, navigate]);

  return (
    <>
      <AppRoutes />
      <GiftBoxClaimModal />
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
