import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveChat, sendMessage, receiveMessage, setTyping, addReaction } from '../redux/slices/chatSlice';
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
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const messagesEndRef = useRef(null);

  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMsgForReaction, setSelectedMsgForReaction] = useState(null);

  const emojiList = ['❤️', '😂', '🔥', '🧗‍♂️', '👍', '✨'];

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isTyping]);

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

  const getContainerClass = () => {
    return themeMode === 'light' 
      ? 'glass-panel-light text-bumble-charcoal border-slate-200 shadow-md' 
      : 'glass-panel-light text-bumble-charcoal border-slate-200 shadow-md';
  };

  return (
    <div className="flex-1 flex overflow-hidden h-screen w-full" style={{ background: 'linear-gradient(135deg, #FFF5F6 0%, #FFFDFD 50%, #FFEBEF 100%)' }}>
      
      {/* LEFT PANE: Conversations list */}
      <div className={`w-full md:w-80 border-r shrink-0 flex flex-col justify-between
        ${activeChatId && 'hidden md:flex'}
        border-slate-200 bg-[#FCFAF2] backdrop-blur-xl`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/landing')}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors border border-transparent hover:border-slate-200"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500">Conversations</h3>
          </div>
          <span className="text-[10px] bg-[#D51659]/20 text-[#D51659] font-bold px-2 py-0.5 rounded-full border border-[#D51659]/30">
            {chats.length} active
          </span>
        </div>

        {/* Conversations Thread list */}
        <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100">
          {chats.map((chat) => {
            const isSelected = chat.id === activeChat.id;
            const lastMsg = chat.messages[chat.messages.length - 1];
            
            return (
              <div
                key={chat.id}
                onClick={() => dispatch(setActiveChat(chat.id))}
                className={`p-4 flex items-center gap-3 cursor-pointer transition-all duration-200
                  ${isSelected 
                    ? 'bg-purple-50 border-l-4 border-[#D51659]' 
                    : 'hover:bg-slate-100/50'
                  }`}
              >
                <div className="relative">
                  <img
                    src={chat.userImage}
                    alt={chat.userName}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                  />
                  {chat.lastActive === 'Online' && (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm truncate text-[#2D2D2D]">{chat.userName}</span>
                    <span className="text-[10px] text-slate-400">{lastMsg?.timestamp || ''}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{lastMsg?.text || ''}</p>
                </div>

                {chat.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#D51659] text-white font-bold text-[10px] flex items-center justify-center">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Info footer */}
        <div className="p-3 bg-[#FCFAF2] border-t border-slate-200 flex items-center gap-1.5 justify-center text-[10px] text-[#2D2D2D]/60 font-semibold uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5" />
          <span>End-to-End Encrypted</span>
        </div>
      </div>

      {/* RIGHT PANE: Message window */}
      <div className={`flex-1 flex flex-col min-w-0 bg-[#F1EFFF]
        ${!activeChat && 'hidden md:flex'}`}
      >
        {activeChat ? (
          <>
            {/* Message header */}
            <div className={`h-16 px-6 border-b flex items-center justify-between shrink-0
              border-slate-200 bg-[#FCFAF2] backdrop-blur-md`}
            >
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <button 
                  onClick={() => dispatch(setActiveChat(null))}
                  className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-[#2D2D2D] hover:bg-slate-100 mr-1"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>

                <div className="relative">
                  <img
                    src={activeChat.userImage}
                    alt={activeChat.userName}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                  />
                  {activeChat.lastActive === 'Online' && (
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-sm text-[#2D2D2D]">{activeChat.userName}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D51659] shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-500">{activeChat.lastActive === 'Online' ? 'Active now' : activeChat.lastActive}</span>
                </div>
              </div>

              {/* Call actions */}
              <div className="flex items-center gap-1.5 text-slate-400">
                <button className="p-2 rounded-xl hover:bg-slate-100 hover:text-[#2D2D2D] transition-colors">
                  <Phone className="w-4.5 h-4.5" />
                </button>
                <button className="p-2 rounded-xl hover:bg-slate-100 hover:text-[#2D2D2D] transition-colors">
                  <Video className="w-4.5 h-4.5" />
                </button>
                <button className="p-2 rounded-xl hover:bg-slate-100 hover:text-[#2D2D2D] transition-colors">
                  <Info className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Message logs section */}
            <div className="flex-grow overflow-y-auto no-scrollbar p-6 space-y-4">
              {activeChat.messages.map((msg) => {
                const isMe = msg.senderId === 'current';
                
                return (
                  <div 
                    key={msg.id} 
                    className={`flex items-end gap-2 group ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <img
                        src={activeChat.userImage}
                        alt={activeChat.userName}
                        className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    )}
                    
                    <div className="max-w-[70%] space-y-1 relative">
                      
                      {/* Bubble */}
                      <div 
                        onClick={() => setSelectedMsgForReaction(selectedMsgForReaction === msg.id ? null : msg.id)}
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm shadow-sm relative group cursor-pointer transition-transform hover:scale-[1.01]
                          ${isMe 
                            ? 'bg-[#D51659] text-white font-semibold rounded-br-none shadow-[0_2px_12px_rgba(213,22,89,0.3)]' 
                            : 'bg-white text-[#2D2D2D] rounded-bl-none border border-slate-200 shadow-sm'
                          }`}
                      >
                        <p className="leading-relaxed break-words">{msg.text}</p>
                        
                        {/* Emoji Reactions row */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className={`absolute bottom-[-10px] flex gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full text-[9px] shadow-sm
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
                        <span>{msg.timestamp}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-[#2D2D2D] font-bold uppercase tracking-wider">
                          React
                        </span>
                      </div>

                      {/* Emoji overlays dropdown popup */}
                      <AnimatePresence>
                        {selectedMsgForReaction === msg.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setSelectedMsgForReaction(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -10 }}
                              className={`absolute z-20 bg-white border border-slate-200 p-1.5 rounded-xl shadow-xl flex gap-1.5 bottom-12
                                ${isMe ? 'right-0' : 'left-0'}`}
                            >
                              {emojiList.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleAddReaction(msg.id, emoji)}
                                  className="hover:scale-125 transition-transform text-sm p-1 rounded hover:bg-slate-100"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>

                    </div>
                  </div>
                );
              })}

              {/* Typing indicator bubble */}
              {isTyping && (
                <div className="flex items-end gap-2 justify-start">
                  <img
                    src={activeChat.userImage}
                    alt={activeChat.userName}
                    className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className={`p-3.5 rounded-2xl rounded-bl-none flex items-center gap-1 bg-white border border-slate-200`}>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Send Area */}
            <form 
              onSubmit={handleSendMessage}
              className="p-4 border-t border-slate-200 bg-[#FCFAF2] backdrop-blur-md flex items-center gap-3 shrink-0 relative"
            >
              <div className="relative flex-grow flex items-center">
                
                {/* Emoji button */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute left-3.5 text-slate-400 hover:text-[#2D2D2D] transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Write a message to ${activeChat.userName}...`}
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-xs sm:text-sm bg-white border border-slate-200 text-[#2D2D2D] placeholder-slate-400 focus:border-[#D51659] focus:ring-2 focus:ring-[#D51659]/20 outline-none transition-all"
                />

                {/* Emoji selector drawer */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        className="absolute bottom-16 left-0 bg-white border border-slate-200 p-2.5 rounded-xl shadow-xl flex gap-2 z-20"
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

              {/* Send Button */}
              <button
                type="submit"
                className="p-3 rounded-xl bg-[#D51659] text-white font-bold hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-[0_2px_12px_rgba(213,22,89,0.4)]"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-[#2D2D2D]/60">
            Select a connection thread to start messaging.
          </div>
        )}
      </div>

    </div>
  );
};

export default Chat;
