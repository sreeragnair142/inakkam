import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  MessageSquare, 
  Send, 
  X, 
  Volume2, 
  VolumeX,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoCall = ({ 
  roomId, 
  token, 
  remoteUserName, 
  remoteUserPhoto, 
  callType = 'video', 
  onEndCall, 
  currentUser 
}) => {
  const [callStatus, setCallStatus] = useState('ringing'); // ringing | connecting | connected | disconnected
  const [duration, setDuration] = useState(0);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(callType === 'video');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isMutedSound, setIsMutedSound] = useState(false);
  const [isSimulation, setIsSimulation] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const roomInstanceRef = useRef(null);
  const localStreamRef = useRef(null);
  const simulationTimerRef = useRef(null);

  // 1. Call timer
  useEffect(() => {
    let timer = null;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  // 2. EnableX Web SDK Join Room
  useEffect(() => {
    const isMock = !token || token.startsWith('mock_') || typeof window.EnxRtc === 'undefined';

    if (isMock) {
      console.warn('⚡ Using Simulation Mode for this call.');
      setIsSimulation(true);
      // Simulate ringing phase, then connect after 3 seconds
      const connectTimeout = setTimeout(() => {
        setCallStatus('connected');
        // Add automatic welcome message in chat
        setChatMessages([
          {
            id: 'system',
            sender: 'system',
            text: `Connected to ${remoteUserName}`,
            time: formatTime(0)
          },
          {
            id: 'welcome',
            sender: 'remote',
            senderName: remoteUserName,
            text: "Hey! Glad we connected. How is it going? 😊",
            time: formatTime(0)
          }
        ]);
      }, 2500);

      return () => {
        clearTimeout(connectTimeout);
      };
    }

    // Real EnableX implementation
    setCallStatus('connecting');
    try {
      const publishOptions = {
        audio: true,
        video: callType === 'video',
        data: true
      };

      // Join room and publish local stream
      // EnxRtc.joinRoom returns the local stream, and callback receives room status
      const localStream = window.EnxRtc.joinRoom(token, publishOptions, (success, error) => {
        if (error) {
          console.error('[EnableX Join Room Failed]', error);
          setCallStatus('disconnected');
          onEndCall();
          return;
        }

        const room = success.room;
        roomInstanceRef.current = room;
        setCallStatus('connected');

        // Play local video stream
        if (callType === 'video' && localVideoRef.current) {
          localStream.play(localVideoRef.current.id);
        }

        // Subscribe to existing remote streams
        if (success.streams && success.streams.length > 0) {
          success.streams.forEach(stream => {
            room.subscribe(stream);
          });
        }

        // Event: Stream Added (Other participant published stream)
        room.addEventListener('stream-added', (event) => {
          room.subscribe(event.stream);
        });

        // Event: Stream Subscribed (Successfully receiving other user's stream)
        room.addEventListener('stream-subscribed', (event) => {
          const stream = event.stream;
          if (stream.hasVideo() && remoteVideoRef.current) {
            stream.play(remoteVideoRef.current.id);
          }
        });

        // Event: User Disconnected
        room.addEventListener('user-disconnected', () => {
          console.log('[EnableX User Disconnected]');
          handleDisconnect();
        });

        // Event: Message Received (In-room Chat)
        room.addEventListener('message-received', (event) => {
          setChatMessages(prev => [
            ...prev,
            {
              id: event.messageId || `msg_${Date.now()}`,
              sender: 'remote',
              senderName: remoteUserName,
              text: event.message,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        });
      });

      localStreamRef.current = localStream;
    } catch (err) {
      console.error('[EnableX Error]', err);
      // Fallback to Simulation Mode instead of failing
      setIsSimulation(true);
      setCallStatus('connected');
    }

    return () => {
      handleDisconnect();
    };
  }, [token, roomId, callType]);

  const handleDisconnect = () => {
    if (roomInstanceRef.current) {
      try {
        roomInstanceRef.current.disconnect();
      } catch (e) {
        console.error(e);
      }
      roomInstanceRef.current = null;
    }
    if (localStreamRef.current) {
      try {
        localStreamRef.current.close();
      } catch (e) {
        console.error(e);
      }
      localStreamRef.current = null;
    }
    setCallStatus('disconnected');
    onEndCall();
  };

  // Toggle Mic
  const toggleMic = () => {
    const nextState = !micActive;
    setMicActive(nextState);

    if (isSimulation) return;

    if (localStreamRef.current) {
      if (nextState) {
        localStreamRef.current.unmuteAudio();
      } else {
        localStreamRef.current.muteAudio();
      }
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    const nextState = !videoActive;
    setVideoActive(nextState);

    if (isSimulation) return;

    if (localStreamRef.current) {
      if (nextState) {
        localStreamRef.current.unmuteVideo();
        if (localVideoRef.current) {
          localStreamRef.current.play(localVideoRef.current.id);
        }
      } else {
        localStreamRef.current.muteVideo();
      }
    }
  };

  // Send In-Room Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const messageText = chatInput;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [
      ...prev,
      {
        id: `my_msg_${Date.now()}`,
        sender: 'me',
        senderName: currentUser?.name || 'Me',
        text: messageText,
        time: timeStr
      }
    ]);
    setChatInput('');

    if (isSimulation) {
      // Simulate reply
      setTimeout(() => {
        const responses = [
          "That's so awesome! 😄",
          "Yes, I totally agree with you.",
          "Tell me more about it!",
          "Haha that's funny!",
          "Let's catch up in person soon!",
          "Sorry, could you repeat that? Audio cut off for a sec."
        ];
        const randomReply = responses[Math.floor(Math.random() * responses.length)];
        setChatMessages(prev => [
          ...prev,
          {
            id: `sim_msg_${Date.now()}`,
            sender: 'remote',
            senderName: remoteUserName,
            text: randomReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 1500);
      return;
    }

    if (roomInstanceRef.current) {
      // room.sendMessage(Message, IsBroadcast, RecipientIDs, Callback)
      roomInstanceRef.current.sendMessage(messageText, true, [], (res) => {
        console.log('[EnableX message sent response]', res);
      });
    }
  };

  // Format call duration
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex bg-[#0A0A0A] text-white overflow-hidden font-sans select-none">
      
      {/* Radial glow backgrounds */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#D51659]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#B44DDC]/10 blur-[120px] pointer-events-none" />

      {/* Ringing / Calling screen */}
      {callStatus === 'ringing' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <div className="relative mb-6">
            {/* Animated Pulsing Circles */}
            <span className="absolute inset-[-15px] rounded-full border border-[#D51659]/30 animate-ping" style={{ animationDuration: '2s' }} />
            <span className="absolute inset-[-30px] rounded-full border border-purple-500/20 animate-ping" style={{ animationDuration: '3.5s' }} />
            <img 
              src={remoteUserPhoto || "https://via.placeholder.com/150"} 
              alt={remoteUserName} 
              className="w-32 h-32 rounded-full object-cover border-4 border-white/10 shadow-[0_8px_32px_rgba(213,22,89,0.3)]"
            />
          </div>
          <h2 className="text-xl font-bold tracking-wide">{remoteUserName}</h2>
          <p className="text-sm text-slate-400 mt-2 flex items-center gap-1.5 uppercase font-semibold tracking-widest text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-[#D51659] animate-pulse" />
            Calling...
          </p>
        </div>
      )}

      {/* Connecting screen */}
      {callStatus === 'connecting' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="relative w-16 h-16 border-4 border-purple-500/20 border-t-[#D51659] rounded-full animate-spin mb-6" />
          <h3 className="text-lg font-semibold">Establishing Connection...</h3>
          <p className="text-sm text-slate-400 mt-1.5">Joining EnableX secure server</p>
        </div>
      )}

      {/* Active Call screen */}
      {callStatus === 'connected' && (
        <div className="flex-1 flex relative">
          
          {/* Main viewport */}
          {callType === 'audio' ? (
            <div className="flex-1 h-full relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-[#150A1A] via-[#0A0A0A] to-[#1A0A15]">
              {/* Pulsing Glowing Aura */}
              <div className="relative mb-8 flex items-center justify-center">
                <span className="absolute w-52 h-52 rounded-full bg-[#D51659]/20 blur-2xl animate-pulse" />
                <span className="absolute w-40 h-40 rounded-full border border-[#D51659]/40 animate-ping" style={{ animationDuration: '3s' }} />
                <img 
                  src={remoteUserPhoto || "https://via.placeholder.com/150"} 
                  alt={remoteUserName} 
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/10 shadow-[0_0_50px_rgba(213,22,89,0.4)] relative z-10"
                />
              </div>

              <h2 className="text-2xl font-black text-white tracking-wide drop-shadow-md">{remoteUserName}</h2>
              <p className="text-xs font-bold text-[#D51659] uppercase tracking-widest mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Voice Call Connected ({formatTime(duration)})
              </p>

              {/* Animated Soundwave Equalizer */}
              <div className="flex items-center gap-1.5 mt-8 h-10">
                {[40, 75, 30, 90, 50, 85, 45, 65, 100, 55, 80, 35, 70, 45].map((h, i) => (
                  <span
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-[#D51659] to-[#B44DDC] rounded-full animate-pulse"
                    style={{
                      height: micActive ? `${h}%` : '20%',
                      animationDelay: `${(i * 120) % 600}ms`,
                      animationDuration: '1.2s'
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 h-full bg-[#121212] relative overflow-hidden flex items-center justify-center">
              {isSimulation ? (
                // Simulated Remote Screen
                videoActive ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr from-[#1A0C16] to-[#0F0F1A]">
                    <img 
                      src={remoteUserPhoto || "https://via.placeholder.com/150"} 
                      alt={remoteUserName} 
                      className="w-24 h-24 rounded-full object-cover border border-white/20 shadow-xl opacity-80 filter brightness-90 scale-[1.05]"
                    />
                    <div className="absolute bottom-6 left-6 text-sm font-semibold bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#D51659] animate-pulse" />
                      <span>{remoteUserName} (Camera Active)</span>
                    </div>
                    {/* Subtle vector grid/waves simulating active streaming */}
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-28 h-28 rounded-full bg-slate-800/40 border border-slate-700 flex items-center justify-center shadow-inner relative">
                      <img 
                        src={remoteUserPhoto || "https://via.placeholder.com/150"} 
                        alt={remoteUserName} 
                        className="w-24 h-24 rounded-full object-cover grayscale"
                      />
                      <VideoOff className="absolute bottom-1 right-1 w-6 h-6 text-slate-400 bg-black/60 p-1.5 rounded-full border border-slate-700" />
                    </div>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{remoteUserName} turned video off</p>
                  </div>
                )
              ) : (
                // Real EnableX Remote Div
                <div 
                  id="remote-video-container" 
                  ref={remoteVideoRef} 
                  className="w-full h-full object-cover" 
                />
              )}

              {/* Custom simulation mode watermark */}
              {isSimulation && (
                <div className="absolute top-4 left-4 bg-purple-500/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-purple-300 border border-purple-500/30">
                  Demo Simulation Mode
                </div>
              )}
            </div>
          )}

          {/* Floating Local Window (PiP) - Rendered for Video Call */}
          {callType === 'video' && (
            <div className="absolute top-6 right-6 w-28 h-40 md:w-36 md:h-52 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900 z-20 transition-all hover:scale-102">
              {isSimulation ? (
                videoActive ? (
                  <div className="w-full h-full bg-slate-800 relative flex items-center justify-center">
                    <img 
                      src={currentUser?.photos?.[0]?.url || "https://via.placeholder.com/150"} 
                      alt="Me" 
                      className="w-14 h-14 rounded-full object-cover border border-white/20 shadow-md"
                    />
                    <div className="absolute bottom-2 left-2 text-[9px] font-semibold bg-black/65 px-1.5 py-0.5 rounded text-slate-300">
                      Local Camera
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-2">
                    <img 
                      src={currentUser?.photos?.[0]?.url || "https://via.placeholder.com/150"} 
                      alt="Me" 
                      className="w-10 h-10 rounded-full object-cover grayscale"
                    />
                    <VideoOff className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                )
              ) : (
                // Real EnableX Local Div
                <div 
                  id="local-video-container" 
                  ref={localVideoRef} 
                  className="w-full h-full object-cover bg-slate-800" 
                />
              )}
            </div>
          )}

          {/* Top Panel (Overlay Details) */}
          <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
              <div>
                <h4 className="font-extrabold text-sm text-white drop-shadow-md">{remoteUserName}</h4>
                <p className="text-[10px] font-bold text-[#D51659] uppercase tracking-wider drop-shadow-sm flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live Call ({formatTime(duration)})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button 
                onClick={() => setIsMutedSound(!isMutedSound)}
                className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:bg-black/60 text-white transition-colors"
                title={isMutedSound ? "Unmute Call Sound" : "Mute Call Sound"}
              >
                {isMutedSound ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Floating HUD Controller (Bottom controls) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 bg-black/50 border border-white/10 backdrop-blur-xl rounded-3xl flex items-center gap-5 md:gap-7 z-25 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            
            {/* Audio Toggle */}
            <button 
              onClick={toggleMic}
              className={`p-3 rounded-2xl transition-all duration-300 ${
                micActive 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-[#D51659]/30 text-[#D51659] border border-[#D51659]/50 hover:bg-[#D51659]/40'
              }`}
              title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* Video Toggle */}
            <button 
              onClick={toggleVideo}
              className={`p-3 rounded-2xl transition-all duration-300 ${
                videoActive 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-[#D51659]/30 text-[#D51659] border border-[#D51659]/50 hover:bg-[#D51659]/40'
              }`}
              title={videoActive ? 'Turn Camera Off' : 'Turn Camera On'}
            >
              {videoActive ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* Text Chat Drawer Toggle */}
            <button 
              onClick={() => setShowChat(!showChat)}
              className={`p-3 rounded-2xl transition-all duration-300 relative ${
                showChat 
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50 hover:bg-purple-500/40' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title="Session Chat"
            >
              <MessageSquare className="w-5 h-5" />
              {!showChat && chatMessages.length > 2 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#D51659] rounded-full border border-black animate-pulse" />
              )}
            </button>

            <span className="w-[1px] h-6 bg-white/15" />

            {/* End Call Button */}
            <button 
              onClick={handleDisconnect}
              className="p-3.5 rounded-full bg-[#D51659] hover:bg-[#D51659]/90 text-white hover:scale-108 active:scale-95 transition-all shadow-[0_4px_16px_rgba(213,22,89,0.4)]"
              title="Hang Up"
            >
              <PhoneOff className="w-5.5 h-5.5" />
            </button>
          </div>

          {/* In-Call Text Chat Drawer (Right-aligned) */}
          <AnimatePresence>
            {showChat && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full sm:w-80 h-full bg-[#0F0F16]/95 border-l border-white/10 backdrop-blur-xl flex flex-col z-30 relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
              >
                {/* Chat Header */}
                <div className="h-16 px-4 border-b border-white/5 flex items-center justify-between bg-black/30">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#D51659]" />
                    <span className="font-extrabold text-sm tracking-wider uppercase">Session Chat</span>
                  </div>
                  <button 
                    onClick={() => setShowChat(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
                  {chatMessages.map((msg) => {
                    const isSystem = msg.sender === 'system';
                    const isMe = msg.sender === 'me';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center text-[10px] text-slate-500 uppercase tracking-widest py-1">
                          {msg.text}
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] text-slate-500 font-semibold mb-0.5 px-1">{msg.senderName}</span>
                        <div className={`p-2.5 rounded-2xl text-xs max-w-[85%] break-words leading-relaxed ${
                          isMe 
                            ? 'bg-[#D51659] text-white rounded-tr-none shadow-[0_2px_8px_rgba(213,22,89,0.25)]' 
                            : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'
                        }`}>
                          <p>{msg.text}</p>
                        </div>
                        <span className="text-[8px] text-slate-600 mt-0.5 px-1">{msg.time}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Input Area */}
                <form 
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-white/5 bg-black/40 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send message..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#D51659] transition-all"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-[#D51659] text-white hover:scale-105 active:scale-95 transition-all shadow-[0_2px_8px_rgba(213,22,89,0.3)]"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

    </div>
  );
};

export default VideoCall;
