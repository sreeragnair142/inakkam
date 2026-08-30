import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Sparkles,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { fetchMe } from '../redux/slices/authSlice';
import { getSocket } from '../utils/socket';

const VideoCall = ({
  roomId,
  token: initialToken,
  remoteUserName,
  remoteUserPhoto,
  callType = 'video',
  onEndCall,
  currentUser,
  targetUserId,
  isCaller = true
}) => {
  const dispatch = useDispatch();
  const [callStatus, setCallStatus] = useState('connecting'); // connecting | connected | disconnected
  const [duration, setDuration] = useState(0);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(callType === 'video');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isMutedSound, setIsMutedSound] = useState(false);
  const [remoteStreamActive, setRemoteStreamActive] = useState(false);

  // Normalize targetUserId
  const targetUid = String(targetUserId?._id || targetUserId?.id || targetUserId || '');

  // EnableX Refs
  const roomRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const isDisconnectedRef = useRef(false);
  const isMountedRef = useRef(true);

  // ─── Format call duration ───────────────────────────────
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── Unmount tracker ────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ─── Call timer ─────────────────────────────────────────
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const timer = setInterval(() => {
      if (isMountedRef.current) setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callStatus]);

  // ─── Periodic Coin Deduction (every 20s while connected) ─
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const coinDeductInterval = setInterval(async () => {
      try {
        const res = await api.post('/coins/deduct-call', {
          targetUserId: targetUid,
          callType,
          seconds: 20
        });
        if (!res.data.success && res.data.insufficientCoins) {
          toast.error('Insufficient coin balance to continue call');
          if (onEndCall && isMountedRef.current) onEndCall();
        } else {
          dispatch(fetchMe());
        }
      } catch (err) {
        // Ignore API errors silently
      }
    }, 20000);
    return () => clearInterval(coinDeductInterval);
  }, [callStatus, callType, targetUid, dispatch, onEndCall]);

  // ─── Core Disconnect / Hang Up Handler ───────────────────
  const onEndCallRef = useRef(onEndCall);
  useEffect(() => { onEndCallRef.current = onEndCall; }, [onEndCall]);

  const handleDisconnect = useCallback(() => {
    if (isDisconnectedRef.current) return;
    isDisconnectedRef.current = true;

    // Disconnect EnableX Room
    if (roomRef.current) {
      try {
        roomRef.current.disconnect();
      } catch (e) {
        console.warn('Error disconnecting EnableX room:', e);
      }
      roomRef.current = null;
    }

    // Stop and close local stream
    if (localStreamRef.current) {
      try {
        localStreamRef.current.close();
      } catch (e) {
        console.warn('Error closing local stream:', e);
      }
      localStreamRef.current = null;
    }

    // Notify socket of call end
    const socket = getSocket();
    if (socket && targetUid) {
      socket.emit('end_call', { targetUserId: targetUid, conversationId: roomId });
    }

    if (isMountedRef.current) {
      setCallStatus('disconnected');
    }

    if (onEndCallRef.current) {
      setTimeout(() => onEndCallRef.current(), 50);
    }
  }, [roomId, targetUid]);

  // ─── EnableX SDK Initialization ─────────────────────────
  // ─── EnableX SDK Initialization ─────────────────────────
useEffect(() => {
  let activeLocalStream = null;
  let activeRoom = null;
  let cancelled = false;

  const startCall = async () => {
    try {
      const EnxRtc = window.EnxRtc;

      // --------------------------------------------------
      // 1. Check SDK
      // --------------------------------------------------
      if (!EnxRtc) {
        console.error('[EnableX] EnxRtc SDK not loaded');
        toast.error('Video service initialization failed.');
        handleDisconnect();
        return;
      }

      console.log('[EnableX] SDK loaded successfully');

      // Enable verbose SDK logging during testing
      try {
        if (EnxRtc.Logger?.setLogLevel) {
          EnxRtc.Logger.setLogLevel(0);
        }
      } catch (e) {
        console.warn('[EnableX] Could not enable SDK debug logging:', e);
      }

      // --------------------------------------------------
      // 2. Get token
      // --------------------------------------------------
      let token = initialToken;

      if (!token && roomId) {
        console.log('[EnableX] Requesting token for room:', roomId);

        try {
          const tokenRes = await api.post('/enablex/get-token', {
            roomId,
            role: isCaller ? 'moderator' : 'participant'
          });

          console.log(
            '[EnableX] Token response:',
            tokenRes.data
          );

          if (tokenRes.data?.success && tokenRes.data?.token) {
            token = tokenRes.data.token;
          }
        } catch (tokenError) {
          console.error(
            '[EnableX] Token request failed:',
            tokenError?.response?.data || tokenError
          );
        }
      }

      if (!token) {
        console.error('[EnableX] No session token available');

        toast.error('Unable to retrieve video session token.');
        handleDisconnect();
        return;
      }

      if (cancelled || isDisconnectedRef.current) {
        return;
      }

      // --------------------------------------------------
      // 3. Stream configuration
      // --------------------------------------------------
      const streamOptions = {
        audio: true,
        video: callType === 'video',
        data: true,

        audioMuted: false,
        videoMuted: callType !== 'video',

        videoSize: [320, 180, 1280, 720],

        attributes: {
          name: currentUser?.name || 'Inakkam User'
        }
      };

      console.log(
        '[EnableX] Creating local stream:',
        streamOptions
      );

      // --------------------------------------------------
      // 4. Create EnableX local stream
      //
      // IMPORTANT:
      // v3.1.10 uses:
      // EnxRtc.EnxStream(options).init()
      //
      // NOT:
      // EnxRtc.setupStream()
      // --------------------------------------------------
      activeLocalStream = EnxRtc.EnxStream(streamOptions);

      if (!activeLocalStream) {
        throw new Error(
          'EnableX EnxStream() did not return a stream'
        );
      }

      localStreamRef.current = activeLocalStream;

      // Media permission granted
      activeLocalStream.addEventListener(
        'media-access-allowed',
        (event) => {
          console.log(
            '[EnableX] ✅ Camera/microphone access granted',
            event
          );

          if (cancelled) return;

          // Show local preview
          setTimeout(() => {
            try {
              const connectingContainer =
                document.getElementById(
                  'connecting_local_video'
                );

              if (
                connectingContainer &&
                activeLocalStream &&
                callType === 'video'
              ) {
                activeLocalStream.play(
                  'connecting_local_video',
                  {
                    player: {
                      autoplay: true,
                      playsinline: true,
                      muted: true
                    },
                    toolbar: {
                      displayMode: false,
                      branding: {
                        display: false
                      }
                    }
                  }
                );
              }
            } catch (previewError) {
              console.warn(
                '[EnableX] Local preview error:',
                previewError
              );
            }
          }, 300);
        }
      );

      // Media permission denied
      activeLocalStream.addEventListener(
        'media-access-denied',
        (event) => {
          console.error(
            '[EnableX] ❌ Camera/microphone permission denied:',
            event
          );

          toast.error(
            'Please allow camera and microphone access.'
          );

          handleDisconnect();
        }
      );

      // --------------------------------------------------
      // Initialize stream
      // --------------------------------------------------
      activeLocalStream.init();

      console.log(
        '[EnableX] Local stream initialized:',
        activeLocalStream
      );

      // --------------------------------------------------
      // 5. Create EnableX room
      // --------------------------------------------------
      activeRoom = EnxRtc.EnxRoom({
        token
      });

      if (!activeRoom) {
        throw new Error(
          'EnableX EnxRoom() did not return a room'
        );
      }

      roomRef.current = activeRoom;

      console.log(
        '[EnableX] Room object created'
      );

      // --------------------------------------------------
      // 6. Remote stream handler
      // --------------------------------------------------
      const subscribeToStream = (stream) => {
        if (!stream || !activeRoom) {
          console.warn(
            '[EnableX] Invalid remote stream'
          );
          return;
        }

        try {
          const streamId =
            typeof stream.getID === 'function'
              ? stream.getID()
              : 'unknown';

          console.log(
            '[EnableX] 📹 Remote stream detected:',
            streamId
          );

          activeRoom.subscribe(
            stream,
            {
              audio: true,
              video: callType === 'video',
              data: true
            },
            (response) => {
              console.log(
                '[EnableX] Subscribe response:',
                response
              );
            }
          );
        } catch (subscribeError) {
          console.error(
            '[EnableX] Subscribe error:',
            subscribeError
          );
        }
      };

      // --------------------------------------------------
      // 7. Room connected
      // --------------------------------------------------
      activeRoom.addEventListener(
        'room-connected',
        (event) => {
          console.log(
            '[EnableX] ✅ ROOM CONNECTED:',
            event
          );

          if (
            cancelled ||
            isDisconnectedRef.current
          ) {
            return;
          }

          // Publish our local stream
          try {
            activeRoom.publish(
              activeLocalStream,
              {},
              (publishResponse) => {
                console.log(
                  '[EnableX] Publish response:',
                  publishResponse
                );

                if (
                  publishResponse &&
                  publishResponse.result !== undefined &&
                  publishResponse.result !== 0
                ) {
                  console.error(
                    '[EnableX] Publish failed:',
                    publishResponse
                  );
                }
              }
            );
          } catch (publishError) {
            console.error(
              '[EnableX] ❌ Publish error:',
              publishError
            );
          }

          // Subscribe to streams already present
          if (
            event?.streams &&
            Array.isArray(event.streams)
          ) {
            event.streams.forEach(
              (stream) => {
                subscribeToStream(stream);
              }
            );
          }

          // Some SDK versions expose remoteStreams
          if (
            activeRoom.remoteStreams &&
            typeof activeRoom.remoteStreams.forEach ===
              'function'
          ) {
            activeRoom.remoteStreams.forEach(
              (stream) => {
                subscribeToStream(stream);
              }
            );
          }
        }
      );

      // --------------------------------------------------
      // 8. Remote stream added
      // --------------------------------------------------
      activeRoom.addEventListener(
        'stream-added',
        (event) => {
          console.log(
            '[EnableX] 📹 STREAM ADDED:',
            event
          );

          const stream =
            event?.stream || event;

          subscribeToStream(stream);
        }
      );

      // --------------------------------------------------
      // 9. Remote stream subscribed
      // --------------------------------------------------
      activeRoom.addEventListener(
        'stream-subscribed',
        (event) => {
          console.log(
            '[EnableX] ✅ STREAM SUBSCRIBED:',
            event
          );

          const remoteStream =
            event?.stream;

          if (!remoteStream) {
            console.warn(
              '[EnableX] stream-subscribed without stream'
            );
            return;
          }

          remoteStreamRef.current =
            remoteStream;

          if (isMountedRef.current) {
            setRemoteStreamActive(true);
            setCallStatus('connected');
          }

          // Play remote stream
          setTimeout(() => {
            try {
              if (callType === 'video') {
                const remoteContainer =
                  document.getElementById(
                    'remote_video_player'
                  );

                if (remoteContainer) {
                  remoteStream.play(
                    'remote_video_player',
                    {
                      player: {
                        autoplay: true,
                        playsinline: true
                      },
                      toolbar: {
                        displayMode: false,
                        branding: {
                          display: false
                        }
                      }
                    }
                  );
                }

                // Local PiP
                if (activeLocalStream) {
                  const localPip =
                    document.getElementById(
                      'local_pip_video'
                    );

                  if (localPip) {
                    activeLocalStream.play(
                      'local_pip_video',
                      {
                        player: {
                          autoplay: true,
                          playsinline: true,
                          muted: true
                        },
                        toolbar: {
                          displayMode: false,
                          branding: {
                            display: false
                          }
                        }
                      }
                    );
                  }
                }
              } else {
                // Audio call
                const audioContainer =
                  document.getElementById(
                    'remote_audio_player'
                  );

                if (audioContainer) {
                  remoteStream.play(
                    'remote_audio_player',
                    {
                      player: {
                        autoplay: true,
                        playsinline: true
                      }
                    }
                  );
                }
              }
            } catch (playError) {
              console.error(
                '[EnableX] Remote stream play error:',
                playError
              );
            }
          }, 200);
        }
      );

      // --------------------------------------------------
      // 10. Remote user disconnected
      // --------------------------------------------------
      activeRoom.addEventListener(
        'user-disconnected',
        (event) => {
          console.log(
            '[EnableX] User disconnected:',
            event
          );

          toast('User left the call', {
            icon: '📞'
          });

          if (
            isMountedRef.current &&
            !isDisconnectedRef.current
          ) {
            handleDisconnect();
          }
        }
      );

      // --------------------------------------------------
      // 11. Room errors
      // --------------------------------------------------
      activeRoom.addEventListener(
        'room-error',
        (error) => {
          console.error(
            '[EnableX] ❌ ROOM ERROR:',
            error
          );

          if (!isMountedRef.current) {
            return;
          }

          toast.error(
            error?.msg ||
            error?.message ||
            'EnableX video room connection failed.'
          );

          handleDisconnect();
        }
      );

      // --------------------------------------------------
      // 12. Room disconnected
      // --------------------------------------------------
      activeRoom.addEventListener(
        'room-disconnected',
        (event) => {
          console.log(
            '[EnableX] Room disconnected:',
            event
          );

          if (
            isMountedRef.current &&
            !isDisconnectedRef.current
          ) {
            setCallStatus('disconnected');
          }
        }
      );

      // --------------------------------------------------
      // 13. CONNECT TO ENABLEX
      // --------------------------------------------------
      console.log(
        '[EnableX] 🚀 Connecting to room...'
      );

      activeRoom.connect({
        allow_reconnect: true,
        number_of_attempts: 3,
        timeout_interval: 5000
      });

    } catch (err) {
      console.error(
        '[EnableX] ❌ Call Setup Exception:',
        err
      );

      if (isMountedRef.current) {
        toast.error(
          err?.message ||
          'Call failed to start.'
        );
      }

      handleDisconnect();
    }
  };

  // ------------------------------------------------------
  // Socket listener for remote hangup
  // ------------------------------------------------------
  const socket = getSocket();

  const handleRemoteCallEnded = () => {
    toast('Call ended by the other person', {
      icon: '📞'
    });

    if (
      isMountedRef.current &&
      !isDisconnectedRef.current
    ) {
      handleDisconnect();
    }
  };

  if (socket) {
    socket.on(
      'call_ended',
      handleRemoteCallEnded
    );
  }

  startCall();

  return () => {
    cancelled = true;

    if (socket) {
      socket.off(
        'call_ended',
        handleRemoteCallEnded
      );
    }

    if (activeRoom) {
      try {
        activeRoom.disconnect();
      } catch (e) {
        console.warn(
          '[EnableX] Room cleanup error:',
          e
        );
      }
    }

    if (activeLocalStream) {
      try {
        activeLocalStream.close();
      } catch (e) {
        console.warn(
          '[EnableX] Stream cleanup error:',
          e
        );
      }
    }

    if (roomRef.current === activeRoom) {
      roomRef.current = null;
    }

    if (
      localStreamRef.current ===
      activeLocalStream
    ) {
      localStreamRef.current = null;
    }
  };

}, [
  roomId,
  initialToken,
  callType,
  isCaller,
  currentUser,
  handleDisconnect
]);

  // ─── Toggle Mic ──────────────────────────────────────────
  const toggleMic = () => {
    const next = !micActive;
    setMicActive(next);
    if (localStreamRef.current) {
      try {
        if (next) {
          localStreamRef.current.unmuteAudio();
        } else {
          localStreamRef.current.muteAudio();
        }
      } catch (e) {
        console.warn('EnableX muteAudio toggle error:', e);
      }
    }
  };

  // ─── Toggle Video ────────────────────────────────────────
  const toggleVideo = () => {
    const next = !videoActive;
    setVideoActive(next);
    if (localStreamRef.current) {
      try {
        if (next) {
          localStreamRef.current.unmuteVideo();
        } else {
          localStreamRef.current.muteVideo();
        }
      } catch (e) {
        console.warn('EnableX muteVideo toggle error:', e);
      }
    }
  };

  // ─── Send In-Room Chat Message ───────────────────────────
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const messageText = chatInput.trim();
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

    const socket = getSocket();
    if (socket && targetUid) {
      socket.emit('webrtc_chat', { targetUserId: targetUid, message: messageText });
    }
  };

  // ─── Receive In-Room Chat Messages ──────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleChatMsg = ({ senderId, message }) => {
      if (targetUid && senderId && String(senderId) !== targetUid) return;
      if (!isMountedRef.current) return;
      setChatMessages(prev => [
        ...prev,
        {
          id: `remote_msg_${Date.now()}`,
          sender: 'remote',
          senderName: remoteUserName,
          text: message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    };

    socket.on('webrtc_chat', handleChatMsg);
    return () => socket.off('webrtc_chat', handleChatMsg);
  }, [targetUid, remoteUserName]);

  return (
    <div
      className="fixed inset-0 z-[1000] flex bg-[#0A0A0A] text-white overflow-hidden font-sans select-none"
    >
      {/* Radial glow backgrounds */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#D51659]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#B44DDC]/10 blur-[120px] pointer-events-none" />

      {/* ─── Connecting screen ─────────────────────────────── */}
      {callStatus === 'connecting' && (
        <div className="flex-1 h-full w-full relative flex flex-col justify-between overflow-hidden">
          {/* If video call, show live camera preview fullscreen */}
          {callType === 'video' ? (
            <div className="absolute inset-0 z-0 bg-[#121212]">
              {/* EnableX Local Preview Container */}
              <div
                id="connecting_local_video"
                className="w-full h-full object-cover scale-x-[-1] flex items-center justify-center [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:scale-x-[-1]"
              />
              {/* Subtle dark vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80 pointer-events-none" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-[#150A1A] via-[#0A0A0A] to-[#1A0A15]" />
          )}

          {/* Top header on connecting screen */}
          <div className="relative z-10 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#D51659] animate-ping" />
              <span className="text-xs font-bold text-white tracking-wide">
                {isCaller ? 'Calling...' : 'Connecting...'}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-300 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              {callType === 'video' ? 'Video Call' : 'Voice Call'}
            </span>
          </div>

          {/* Center Glass Card with Remote User Info & Status */}
          <div className="relative z-10 flex flex-col items-center justify-center px-6">
            <div className="bg-black/50 backdrop-blur-xl border border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full">
              {/* Pulsing Avatar */}
              <div className="relative mb-5 flex items-center justify-center">
                <span className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#D51659]/30 blur-xl animate-pulse" />
                <span className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-[#D51659]/60 animate-ping" style={{ animationDuration: '2.5s' }} />
                <img
                  src={remoteUserPhoto || "https://via.placeholder.com/150"}
                  alt={remoteUserName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/20 shadow-2xl relative z-10"
                />
              </div>

              <h3 className="text-xl font-black text-white text-center drop-shadow-md">
                {remoteUserName}
              </h3>
              
              <div className="flex items-center gap-2 mt-3 text-slate-300 text-xs font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <div className="w-3.5 h-3.5 border-2 border-[#D51659] border-t-transparent rounded-full animate-spin" />
                <span>{isCaller ? 'Waiting for answer...' : 'Connecting to session...'}</span>
              </div>
            </div>
          </div>

          {/* Bottom Controls Bar on Connecting Screen */}
          <div className="relative z-10 p-6 pb-10 flex items-center justify-center gap-6">
            {/* Mic toggle */}
            <button
              onClick={toggleMic}
              className={`p-3.5 rounded-full transition-all duration-300 backdrop-blur-md ${micActive
                ? 'bg-black/50 text-white border border-white/15 hover:bg-black/70'
                : 'bg-[#D51659]/40 text-[#D51659] border border-[#D51659] hover:bg-[#D51659]/50'
                }`}
              title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* Video toggle (for video call) */}
            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`p-3.5 rounded-full transition-all duration-300 backdrop-blur-md ${videoActive
                  ? 'bg-black/50 text-white border border-white/15 hover:bg-black/70'
                  : 'bg-[#D51659]/40 text-[#D51659] border border-[#D51659] hover:bg-[#D51659]/50'
                  }`}
                title={videoActive ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {videoActive ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            )}

            {/* Cancel / End Call Button */}
            <button
              onClick={handleDisconnect}
              className="p-4 rounded-full bg-[#D51659] hover:bg-[#D51659]/90 text-white hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(213,22,89,0.5)] flex items-center justify-center cursor-pointer"
              title="Cancel Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Active Call Screen ─────────────────────────────── */}
      {callStatus === 'connected' && (
        <div className="flex-1 flex relative">

          {/* ── Main viewport ─────────────────────────── */}
          {callType === 'audio' ? (
            /* ── Audio call UI ── */
            <div className="flex-1 h-full relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-[#150A1A] via-[#0A0A0A] to-[#1A0A15]">
              {/* Pulsing Aura */}
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
              {/* Hidden audio player for remote */}
              <div id="remote_audio_player" style={{ display: 'none' }} />
              {/* Animated Soundwave */}
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
            /* ── Video call main UI ── */
            <div className="flex-1 h-full bg-[#121212] relative overflow-hidden">
              {/* EnableX Remote Video Container — fullscreen */}
              <div
                id="remote_video_player"
                className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
                style={{ display: remoteStreamActive ? 'block' : 'none' }}
              />

              {/* Waiting for remote placeholder */}
              {!remoteStreamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121212]">
                  <img
                    src={remoteUserPhoto || "https://via.placeholder.com/150"}
                    alt={remoteUserName}
                    className="w-24 h-24 rounded-full object-cover border-2 border-white/10 mb-3 opacity-50"
                  />
                  <p className="text-slate-500 text-sm">Connecting video stream with {remoteUserName}...</p>
                </div>
              )}

              {/* EnableX Local camera PiP — top-right corner */}
              <div
                className="absolute top-6 right-6 w-28 md:w-36 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-[#1a1a1a] z-20"
                style={{ aspectRatio: '9/16' }}
              >
                <div
                  id="local_pip_video"
                  className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:scale-x-[-1]"
                />
                <div className="absolute bottom-2 left-2 text-[9px] font-semibold bg-black/65 px-1.5 py-0.5 rounded text-slate-300">
                  You
                </div>
              </div>
            </div>
          )}

          {/* ── Top overlay (name + timer + sound toggle) ─── */}
          <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between pointer-events-none z-25">
            <div className="flex items-center gap-3 pointer-events-auto">
              <div>
                <h4 className="font-extrabold text-sm text-white drop-shadow-md">{remoteUserName}</h4>
                <p className="text-[10px] font-bold text-[#D51659] uppercase tracking-wider drop-shadow-sm flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live Call · {formatTime(duration)}
                </p>
              </div>
            </div>
            {callType === 'video' && (
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={() => setIsMutedSound(m => !m)}
                  className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:bg-black/60 text-white transition-colors"
                  title={isMutedSound ? "Unmute Remote Audio" : "Mute Remote Audio"}
                >
                  {isMutedSound ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* ── Bottom controls HUD ──────────────────────── */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 bg-black/50 border border-white/10 backdrop-blur-xl rounded-3xl flex items-center gap-5 md:gap-7 z-25 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">

            {/* Mic toggle */}
            <button
              onClick={toggleMic}
              className={`p-3 rounded-2xl transition-all duration-300 ${micActive
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-[#D51659]/30 text-[#D51659] border border-[#D51659]/50 hover:bg-[#D51659]/40'
                }`}
              title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* Video toggle (only for video calls) */}
            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-2xl transition-all duration-300 ${videoActive
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-[#D51659]/30 text-[#D51659] border border-[#D51659]/50 hover:bg-[#D51659]/40'
                  }`}
                title={videoActive ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {videoActive ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            )}

            {/* In-call text chat */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-3 rounded-2xl transition-all duration-300 relative ${showChat
                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50 hover:bg-purple-500/40'
                : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              title="Session Chat"
            >
              <MessageSquare className="w-5 h-5" />
              {!showChat && chatMessages.filter(m => m.sender === 'remote').length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#D51659] rounded-full border border-black animate-pulse" />
              )}
            </button>

            <span className="w-[1px] h-6 bg-white/15" />

            {/* End call */}
            <button
              onClick={handleDisconnect}
              className="p-3.5 rounded-full bg-[#D51659] hover:bg-[#D51659]/90 text-white hover:scale-105 active:scale-95 transition-all shadow-[0_4px_16px_rgba(213,22,89,0.4)]"
              title="Hang Up"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>

          {/* ── In-call text chat drawer ──────────────────── */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full sm:w-80 h-full bg-[#0F0F16]/95 border-l border-white/10 backdrop-blur-xl flex flex-col z-30 relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
              >
                {/* Chat header */}
                <div className="h-16 px-4 border-b border-white/5 flex items-center justify-between bg-black/30">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#D51659]" />
                    <span className="font-extrabold text-sm tracking-wider uppercase">Session Chat</span>
                  </div>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
                  {chatMessages.length === 0 && (
                    <p className="text-center text-slate-600 text-xs mt-8">Say hi to {remoteUserName}!</p>
                  )}
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
                        <div className={`p-2.5 rounded-2xl text-xs max-w-[85%] break-words leading-relaxed ${isMe
                          ? 'bg-gradient-to-tr from-[#D51659] to-[#EC3F7B] text-white rounded-br-sm'
                          : 'bg-white/10 text-white/90 rounded-bl-sm border border-white/10'
                          }`}>
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-slate-600 mt-0.5 px-1">{msg.time}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Chat input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-white/5 flex gap-2 items-end bg-black/20"
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-[#D51659]/40 transition-colors resize-none"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-[#D51659] text-white hover:bg-[#D51659]/90 transition-colors shrink-0"
                  >
                    <Send className="w-4 h-4" />
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
