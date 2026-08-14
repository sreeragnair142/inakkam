import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setActiveChat, 
  sendMessage, 
  receiveMessage, 
  setTyping, 
  addReaction,
  fetchConversations,
  fetchMessages
} from '../redux/slices/chatSlice';
import { 
  Send, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  CheckCircle2,
  Lock,
  ChevronRight,
  ArrowLeft,
  PhoneOff,
  Search,
  Plus,
  Mic,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { getSocket, joinConversation } from '../utils/socket';
import VideoCall from '../components/VideoCall';
import toast from 'react-hot-toast';

const Chat = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme.mode);
  
  // Redux chat slices
  const chats = useSelector((state) => state.chat.chats);
  const activeChatId = useSelector((state) => state.chat.activeChatId);
  const isTyping = useSelector((state) => state.chat.isTyping);
  const currentUser = useSelector((state) => state.auth.user);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const activeChatMessages = useSelector((state) => state.chat.activeChatMessages);
  const messagesEndRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Auto-select first active thread if none selected
  useEffect(() => {
    if (!activeChatId && chats && chats.length > 0) {
      dispatch(setActiveChat(chats[0].id));
    }
  }, [chats, activeChatId, dispatch]);

  // Load messages and join room when active chat changes
  useEffect(() => {
    if (activeChatId && !activeChatId.startsWith('temp_')) {
      dispatch(fetchMessages(activeChatId));
      joinConversation(activeChatId);
    }
  }, [dispatch, activeChatId]);

  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMsgForReaction, setSelectedMsgForReaction] = useState(null);

  // Call-related state
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const emojiList = ['❤️', '😂', '🔥', '🧗‍♂️', '👍', '✨'];

  // Socket signaling listener for calls
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleIncomingCall = (data) => {
      console.log('📞 Socket event: incoming_call', data);
      setIncomingCall(data);
    };

    const handleCallAccepted = (data) => {
      console.log('📞 Socket event: call_accepted', data);
      toast.success('Call accepted!');
    };

    const handleCallRejected = (data) => {
      console.log('📞 Socket event: call_rejected', data);
      toast.error('Call declined by user');
      setActiveCall(null);
    };

    const handleCallEnded = (data) => {
      console.log('📞 Socket event: call_ended', data);
      toast('Call ended', { icon: '📞' });
      setActiveCall(null);
      setIncomingCall(null);
    };

    const handleCallError = (data) => {
      toast.error(data.message || 'Call error occurred');
      setActiveCall(null);
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_error', handleCallError);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_error', handleCallError);
    };
  }, [activeChat, currentUser]);

  // Start a Call
  const handleStartCall = async (type) => {
    if (!activeChat) return;
    const targetUserId = activeChat.user?._id || activeChat.userId;
    if (!targetUserId) {
      toast.error('Cannot call this user');
      return;
    }

    try {
      toast.loading('Initializing call...', { id: 'call_init' });
      
      // 1. Create Room on EnableX
      const roomRes = await api.post('/enablex/create-room', {
        name: `Call with ${activeChat.userName}`
      });

      if (!roomRes.data.success) {
        throw new Error(roomRes.data.message || 'Failed to create room');
      }

      const roomId = roomRes.data.room.room_id;

      // 2. Generate Token for Caller (Moderator)
      const tokenRes = await api.post('/enablex/get-token', {
        roomId,
        role: 'moderator'
      });

      if (!tokenRes.data.success) {
        throw new Error(tokenRes.data.message || 'Failed to generate token');
      }

      const token = tokenRes.data.token;

      // 3. Emit socket event
      const socket = getSocket();
      if (socket) {
        socket.emit('call_user', {
          conversationId: activeChat.id,
          targetUserId,
          roomId,
          callerName: currentUser?.name || 'Inakkam User',
          callerPhoto: currentUser?.photos?.[0]?.url || '',
          callType: type
        });
      }

      toast.dismiss('call_init');

      // 4. Set Active Call State
      setActiveCall({
        roomId,
        token,
        remoteUserName: activeChat.userName,
        remoteUserPhoto: activeChat.userImage,
        callType: type,
        targetUserId
      });

    } catch (err) {
      toast.dismiss('call_init');
      toast.error(err.message || 'Failed to start call');
      console.error('[Start Call Error]', err);
    }
  };

  // Accept Incoming Call
  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    try {
      toast.loading('Connecting call...', { id: 'call_connect' });

      // 1. Generate Token for Receiver (Participant)
      const tokenRes = await api.post('/enablex/get-token', {
        roomId: incomingCall.roomId,
        role: 'participant'
      });

      if (!tokenRes.data.success) {
        throw new Error(tokenRes.data.message || 'Failed to join room');
      }

      const token = tokenRes.data.token;

      // 2. Emit socket accept
      const socket = getSocket();
      if (socket) {
        socket.emit('accept_call', {
          conversationId: incomingCall.conversationId,
          callerId: incomingCall.callerId
        });
      }

      toast.dismiss('call_connect');

      // 3. Set Active Call State
      setActiveCall({
        roomId: incomingCall.roomId,
        token,
        remoteUserName: incomingCall.callerName,
        remoteUserPhoto: incomingCall.callerPhoto,
        callType: incomingCall.callType,
        targetUserId: incomingCall.callerId
      });

      // Clear incoming call dialog
      setIncomingCall(null);

    } catch (err) {
      toast.dismiss('call_connect');
      toast.error(err.message || 'Failed to accept call');
      console.error('[Accept Call Error]', err);
    }
  };

  // Decline Incoming Call
  const handleDeclineCall = () => {
    if (!incomingCall) return;

    const socket = getSocket();
    if (socket) {
      socket.emit('reject_call', {
        conversationId: incomingCall.conversationId,
        callerId: incomingCall.callerId
      });
    }

    setIncomingCall(null);
  };

  // End Call Callback from VideoCall component
  const handleEndCall = () => {
    if (!activeCall) return;

    const socket = getSocket();
    if (socket) {
      socket.emit('end_call', {
        conversationId: activeChat?.id || activeCall.roomId,
        targetUserId: activeCall.targetUserId
      });
    }

    setActiveCall(null);
  };

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChatMessages, isTyping]);

  // Simulate automated chat responses
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const messageText = inputMessage;
    
    // Dispatch User Message
    dispatch(sendMessage({ chatId: activeChat.id, text: messageText }));
    setInputMessage('');
    setShowEmojiPicker(false);

    // Simulate Reply
    dispatch(setTyping(true));
    
    setTimeout(() => {
      dispatch(setTyping(false));
      
      const responses = [
        `That sounds amazing! Tell me more about it 😊`,
        `Oh wow, I totally agree! Let's do that next week.`,
        `Haha, you're hilarious! Honestly, I was thinking the exact same thing.`,
        `Nice! Let's meet up for coffee or bubble tea soon and talk more? ☕️✨`,
        `That is really cool. What got you into that?`
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      dispatch(receiveMessage({
        chatId: activeChat.id,
        senderId: activeChat.userId,
        text: randomResponse
      }));
    }, 2500);
  };

  const handleAddReaction = (msgId, emoji) => {
    dispatch(addReaction({ chatId: activeChat.id, messageId: msgId, emoji }));
    setSelectedMsgForReaction(null);
  };
  return (
    <div className="fixed inset-0 bottom-[64px] lg:bottom-0 flex overflow-hidden bg-[#FAF9F6] z-30">
      {/* Mesh gradients for premium glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#D51659]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#B44DDC]/5 blur-[120px] pointer-events-none" />

      {/* LEFT PANE: Conversations list */}
      <div className={`w-full md:w-80 border-r shrink-0 flex flex-col justify-between
        ${activeChatId && 'hidden md:flex'}
        border-slate-200/60 bg-white/95 backdrop-blur-xl z-10 shadow-[4px_0_24px_rgba(0,0,0,0.015)]`}
      >
        <div className="p-4 border-b border-slate-100/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/landing')}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors border border-transparent hover:border-slate-200/50"
                title="Return to Home"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-600">Messages</h3>
            </div>
            <span className="text-[10px] bg-[#D51659]/10 text-[#D51659] font-bold px-2 py-0.5 rounded-full border border-[#D51659]/20">
              {chats.length} active
            </span>
          </div>

          {/* Clean Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-100/60 focus:bg-white text-xs border border-transparent focus:border-slate-200 rounded-xl outline-none transition-all placeholder-slate-400 text-slate-700"
            />
          </div>
        </div>

        {/* Conversations Thread list */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-1">
          {chats.map((chat) => {
            const isSelected = activeChat && chat.id === activeChat.id;
            const lastMsgText = chat.lastMessage?.text || '';
            const lastMsgTime = chat.lastMessage?.createdAt 
              ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : '';
            
            return (
              <div
                key={chat.id}
                onClick={() => dispatch(setActiveChat(chat.id))}
                className={`mx-3 p-3 flex items-center gap-3 cursor-pointer rounded-2xl transition-all duration-300 border relative
                  ${isSelected 
                    ? 'bg-white border-[#D51659]/30 shadow-md shadow-[#D51659]/5' 
                    : 'bg-transparent border-transparent hover:bg-white/50 hover:border-slate-100/80 hover:shadow-sm'
                  }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-3.5 bottom-3.5 w-1 bg-[#D51659] rounded-r-full" />
                )}

                <div className="relative">
                  <img
                    src={chat.userImage}
                    alt={chat.userName}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-100 shadow-sm"
                  />
                  {chat.lastActive === 'Online' && (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-sm text-slate-800 truncate">{chat.userName}</span>
                    <span className="text-[9px] font-bold text-slate-400">{lastMsgTime}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{lastMsgText}</p>
                </div>

                {chat.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#D51659] text-white font-bold text-[9px] flex items-center justify-center shrink-0 shadow-lg shadow-[#D51659]/20">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Info footer */}
        <div className="p-3.5 bg-[#FCFAF7]/95 border-t border-slate-100/80 flex items-center gap-1.5 justify-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <Lock className="w-3.5 h-3.5 text-[#D51659]/60" />
          <span>End-to-End Encrypted</span>
        </div>
      </div>

      {/* RIGHT PANE: Message window */}
      <div className={`flex-1 flex flex-col min-w-0 bg-[#F4F3ED] relative z-10 shadow-inner
        ${!activeChat && 'hidden md:flex'}`}
      >
        {activeChat ? (
          <>
            {/* Pinned Floating Header */}
            <div className="mx-4 mt-4 px-4 py-3 bg-white/90 border border-slate-100/80 backdrop-blur-md flex items-center justify-between rounded-2xl shadow-sm z-15">
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <button 
                  onClick={() => dispatch(setActiveChat(null))}
                  className="md:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 mr-1"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>

                <div className="relative">
                  <img
                    src={activeChat.userImage}
                    alt={activeChat.userName}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm"
                  />
                  {activeChat.lastActive === 'Online' && (
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-sm text-slate-800">{activeChat.userName}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D51659] shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{activeChat.lastActive === 'Online' ? 'Online' : activeChat.lastActive}</span>
                </div>
              </div>

              {/* Call actions */}
              <div className="flex items-center gap-2 text-slate-400">
                <button 
                  onClick={() => handleStartCall('audio')}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-[#D51659]/5 hover:text-[#D51659] hover:border-[#D51659]/20 transition-all duration-300 cursor-pointer"
                  title="Voice Call"
                >
                  <Phone className="w-4.5 h-4.5" />
                </button>
                <button 
                  onClick={() => handleStartCall('video')}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-[#D51659]/5 hover:text-[#D51659] hover:border-[#D51659]/20 transition-all duration-300 cursor-pointer"
                  title="Video Call"
                >
                  <Video className="w-4.5 h-4.5" />
                </button>
                <button className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                  <Info className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Message logs section */}
            <div 
              className="flex-grow overflow-y-auto no-scrollbar px-6 py-6 space-y-4"
              style={{
                backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(213,22,89,0.06) 0%, transparent 45%), radial-gradient(circle at 100% 100%, rgba(180,77,220,0.06) 0%, transparent 45%), #F4F3ED'
              }}
            >
              {activeChatMessages.map((msg) => {
                const isMe = (msg.sender?._id || msg.sender) === currentUser?._id;
                const timestamp = msg.createdAt 
                  ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : msg.timestamp || '';
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, type: 'spring', damping: 25 }}
                    key={msg._id || msg.id} 
                    className={`flex items-end gap-2.5 group ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <img
                        src={activeChat.userImage}
                        alt={activeChat.userName}
                        className="w-7 h-7 rounded-lg object-cover border border-slate-100 shrink-0 shadow-sm"
                      />
                    )}
                    
                    <div className="max-w-[70%] space-y-1 relative">
                      
                      {/* Bubble */}
                      <div 
                        onClick={() => setSelectedMsgForReaction(selectedMsgForReaction === (msg._id || msg.id) ? null : (msg._id || msg.id))}
                        className={`px-4 py-2.5 rounded-[20px] text-xs sm:text-sm shadow-sm relative group cursor-pointer transition-transform hover:scale-[1.01]
                          ${isMe 
                            ? 'bg-gradient-to-tr from-[#D51659] to-[#EC3F7B] text-white font-medium rounded-br-[4px] shadow-[0_4px_16px_rgba(213,22,89,0.18)]' 
                            : 'bg-white text-slate-800 rounded-bl-[4px] border border-slate-150/60 shadow-[0_2px_8px_rgba(0,0,0,0.01)]'
                          }`}
                      >
                        <p className="leading-relaxed break-words text-left">{msg.text}</p>
                        
                        {/* Emoji Reactions row */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className={`absolute bottom-[-10px] flex gap-1 bg-white border border-slate-150 px-1.5 py-0.5 rounded-full text-[9px] shadow-sm
                            ${isMe ? 'right-2' : 'left-2'}`}
                          >
                            {msg.reactions.map((react, i) => (
                              <span key={i}>{react}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Timestamp & reaction trigger indicators */}
                      <div className={`flex items-center gap-2 text-[9px] text-slate-400 px-1
                        ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <span>{timestamp}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-slate-800 font-bold uppercase tracking-wider">
                          React
                        </span>
                      </div>

                      {/* Emoji overlays dropdown popup */}
                      <AnimatePresence>
                        {selectedMsgForReaction === (msg._id || msg.id) && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setSelectedMsgForReaction(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -10 }}
                              className={`absolute z-20 bg-white border border-slate-150 p-1.5 rounded-xl shadow-xl flex gap-1.5 bottom-12
                                ${isMe ? 'right-0' : 'left-0'}`}
                            >
                              {emojiList.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleAddReaction(msg._id || msg.id, emoji)}
                                  className="hover:scale-125 transition-transform text-sm p-1 rounded hover:bg-slate-50"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>

                    </div>
                  </motion.div>
                );
              })}

              {/* Typing indicator bubble */}
              {isTyping && (
                <div className="flex items-end gap-2.5 justify-start">
                  <img
                    src={activeChat.userImage}
                    alt={activeChat.userName}
                    className="w-7 h-7 rounded-lg object-cover border border-slate-100 shrink-0 shadow-sm"
                  />
                  <div className="p-3.5 rounded-[20px] rounded-bl-[4px] flex items-center gap-1 bg-white border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <span className="w-1.5 h-1.5 bg-[#D51659] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#D51659]/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#D51659]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Floating Glass Bar */}
            <form 
              onSubmit={handleSendMessage}
              className="mx-4 mb-4 p-2 bg-white/95 border border-slate-100 backdrop-blur-xl flex items-center gap-2 rounded-2xl shadow-xl shrink-0 relative z-10"
            >
              {/* Media Button */}
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all rounded-xl"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Inner Input Block */}
              <div className="flex-grow flex items-center bg-slate-50/60 focus-within:bg-white border border-slate-100 focus-within:border-slate-200/80 rounded-xl px-2.5 transition-all relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Message ${activeChat.userName}...`}
                  className="flex-grow py-2.5 text-sm bg-transparent text-slate-800 placeholder-slate-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Smile className="w-4.5 h-4.5" />
                </button>

                {/* Emoji selector drawer */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-14 right-0 bg-white border border-slate-150 p-2.5 rounded-2xl shadow-xl flex gap-2 z-20"
                      >
                        {emojiList.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setInputMessage(prev => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-base hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Mic Icon */}
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all rounded-xl"
              >
                <Mic className="w-4.5 h-4.5" />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-gradient-to-tr from-[#D51659] to-[#EC3F7B] text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md shadow-[#D51659]/15"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-slate-400 font-medium">
            <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
            <span>Select a conversation to start messaging.</span>
          </div>
        )}
      </div>

      {/* Video / Audio call active overlay */}
      {activeCall && (
        <VideoCall
          roomId={activeCall.roomId}
          token={activeCall.token}
          remoteUserName={activeCall.remoteUserName}
          remoteUserPhoto={activeCall.remoteUserPhoto}
          callType={activeCall.callType}
          onEndCall={handleEndCall}
          currentUser={currentUser}
        />
      )}

      {/* Incoming Call Popup Overlay */}
      <AnimatePresence>
        {incomingCall && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl border border-slate-100"
            >
              <div className="relative inline-block mb-4">
                <span className="absolute inset-[-10px] rounded-full border-2 border-[#D51659]/30 animate-ping" />
                <img 
                  src={incomingCall.callerPhoto || "https://via.placeholder.com/150"} 
                  alt={incomingCall.callerName} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 mx-auto animate-pulse"
                />
              </div>
              <h3 className="font-extrabold text-lg text-[#2D2D2D]">{incomingCall.callerName}</h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">Incoming {incomingCall.callType} call...</p>
              
              <div className="flex gap-4 mt-6">
                <button 
                  onClick={handleDeclineCall}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4 text-red-500" />
                  Decline
                </button>
                <button 
                  onClick={handleAcceptCall}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#D51659] hover:bg-[#D51659]/90 text-white font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D51659]/20 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  Accept
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
