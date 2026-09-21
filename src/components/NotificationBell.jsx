import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  MessageSquare,
  Phone,
  Video,
  PhoneOff,
  CheckCheck,
  Trash2
} from 'lucide-react';
import { markAsRead, markAllAsRead, clearAll } from '../redux/slices/notificationSlice';
import { setActiveChat } from '../redux/slices/chatSlice';

const NotificationBell = ({ align = 'right', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const notifications = useSelector((state) => state.notification?.items || []);
  const unreadCount = useSelector((state) => state.notification?.unreadCount ?? 0);

  // Handle clicking outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    // Use capture phase true so events are caught regardless of internal stopPropagation
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = (item) => {
    dispatch(markAsRead(item.id));
    setIsOpen(false);
    if (item.conversationId) {
      dispatch(setActiveChat(item.conversationId));
    }
    navigate('/chat');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-[#D51659] border border-slate-200/60 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center border-none"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 md:w-4.5 md:h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-gradient-to-r from-rose-500 to-[#D51659] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute ${
              align === 'left' ? 'left-0' : 'right-0'
            } mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] rounded-3xl shadow-2xl border bg-white/95 backdrop-blur-xl border-slate-100 z-[9999] p-3.5 text-left overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 px-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black bg-[#D51659]/10 text-[#D51659] px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => dispatch(markAllAsRead())}
                    className="text-[10px] font-bold text-[#D51659] hover:underline cursor-pointer border-none bg-transparent flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => dispatch(clearAll())}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent flex items-center gap-1"
                    title="Clear all notifications"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
                {/* Dedicated Close (X) button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent ml-1"
                  title="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification items list */}
            <div className="max-h-[380px] overflow-y-auto no-scrollbar py-2 space-y-1.5">
              {notifications.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No notifications yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    You will receive alerts here for messages and calls
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  const isMessage = item.type === 'message';
                  const isCall = item.type === 'call';
                  const isMissed = item.type === 'missed_call';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-2.5 rounded-2xl transition-all cursor-pointer flex items-start gap-3 border ${
                        !item.read
                          ? 'bg-rose-50/60 border-rose-100 hover:bg-rose-50'
                          : 'bg-transparent border-transparent hover:bg-slate-50'
                      }`}
                    >
                      {/* Avatar or Type Icon */}
                      <div className="relative shrink-0 mt-0.5">
                        {item.avatar ? (
                          <img
                            src={item.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isMissed
                                ? 'bg-rose-100 text-rose-600'
                                : isCall
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-purple-100 text-purple-600'
                            }`}
                          >
                            {isMissed ? (
                              <PhoneOff className="w-4.5 h-4.5" />
                            ) : isCall ? (
                              <Phone className="w-4.5 h-4.5" />
                            ) : (
                              <MessageSquare className="w-4.5 h-4.5" />
                            )}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white border-2 border-white ${
                            isMissed
                              ? 'bg-rose-500'
                              : isCall
                              ? 'bg-emerald-500'
                              : 'bg-[#D51659]'
                          }`}
                        >
                          {isMissed ? (
                            <PhoneOff className="w-2.5 h-2.5" />
                          ) : isCall ? (
                            <Phone className="w-2.5 h-2.5" />
                          ) : (
                            <MessageSquare className="w-2.5 h-2.5" />
                          )}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {item.title}
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {item.time || 'Recently'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.message}
                        </p>
                      </div>

                      {/* Unread Indicator Dot */}
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-[#D51659] shrink-0 mt-2" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
