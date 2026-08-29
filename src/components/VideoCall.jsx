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
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useDispatch } from 'react-redux';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { fetchMe } from '../redux/slices/authSlice';


const VideoCall = ({ 
  roomId, 
  token, 
  remoteUserName, 
  remoteUserPhoto, 
  callType = 'video', 
  onEndCall, 
  currentUser,
  targetUserId
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
  const [isSimulation, setIsSimulation] = useState(false);

  // Refs
  const remoteAudioRef = useRef(null);
  const roomInstanceRef = useRef(null);
  const localStreamRef = useRef(null);
  // Flag to prevent double-disconnect (cleanup race condition)
  const isDisconnectedRef = useRef(false);
  // Track if component is still mounted
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
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ─── Unlock audio on user tap (browser autoplay policy) ─
  const unlockAudio = useCallback(() => {
    // Unlock dedicated audio element
    if (remoteAudioRef.current && remoteAudioRef.current.paused) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().catch(() => {});
    }
    // Unlock any EnableX-injected video/audio elements
    const remoteContainer = document.getElementById('remote-video-container');
    if (remoteContainer) {
      const mediaEls = remoteContainer.querySelectorAll('video, audio');
      mediaEls.forEach(el => {
        el.muted = false;
        el.volume = 1.0;
        el.play().catch(() => {});
      });
    }
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
          targetUserId,
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
        // Ignore API errors silently (don't kill the call)
      }
    }, 20000);
    return () => clearInterval(coinDeductInterval);
  }, [callStatus, callType, targetUserId, dispatch, onEndCall]);

  // ─── Core disconnect handler ────────────────────────────
  // Uses ref so it never stale-captures onEndCall
  const onEndCallRef = useRef(onEndCall);
  useEffect(() => { onEndCallRef.current = onEndCall; }, [onEndCall]);

  const handleDisconnect = useCallback(() => {
    // Guard: only disconnect once
    if (isDisconnectedRef.current) return;
    isDisconnectedRef.current = true;

    // Leave EnableX room
    if (roomInstanceRef.current) {
      try { roomInstanceRef.current.disconnect(); } catch (e) {}
      roomInstanceRef.current = null;
    }
    // Stop local media
    if (localStreamRef.current) {
      try { localStreamRef.current.close(); } catch (e) {}
      localStreamRef.current = null;
    }

    if (isMountedRef.current) setCallStatus('disconnected');

    // Notify parent to clean up activeCall state
    if (onEndCallRef.current) {
      setTimeout(() => onEndCallRef.current(), 50);
    }
  }, []);

  // ─── Function to attach and play a remote stream ─────────
  const playRemoteStream = useCallback((stream) => {
    if (!stream) return;
    const streamId = stream.getID ? stream.getID() : 'unknown';
    console.log('🔊 Playing remote media stream:', streamId);

    // 1. Let EnableX SDK inject video/audio into the container div
    try {
      stream.play('remote-video-container');
    } catch (err) {
      console.error('[EnableX Remote Stream Play Error]', err);
    }

    // 2. Apply CSS to injected elements and unmute them (after short delay for DOM injection)
    const applyStyles = () => {
      const container = document.getElementById('remote-video-container');
      if (container) {
        const mediaEls = container.querySelectorAll('video, audio');
        mediaEls.forEach(el => {
          el.muted = false;
          el.volume = 1.0;
          el.style.width = '100%';
          el.style.height = '100%';
          el.style.objectFit = 'cover';
          el.style.display = 'block';
          el.play().catch(() => {});
        });
      }
    };

    setTimeout(applyStyles, 300);
    setTimeout(applyStyles, 800);
    setTimeout(applyStyles, 1500);

    // 3. Direct MediaStream audio attachment to backup audio element
    const rawStream = stream.stream || (typeof stream.getMediaStream === 'function' ? stream.getMediaStream() : null);
    if (rawStream && remoteAudioRef.current) {
      try {
        console.log('🎙️ Attaching native WebRTC MediaStream to remoteAudioRef');
        remoteAudioRef.current.srcObject = rawStream;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.play().catch(e => {
          console.warn('[Remote Audio Autoplay Notice]', e);
        });
      } catch (err) {
        console.error('[Remote Audio Attach Error]', err);
      }
    }
  }, []);

  // ─── EnableX SDK Join Room ──────────────────────────────
  useEffect(() => {
    // Check for simulation mode
    const isMock = !token || token.startsWith('mock_');

    if (isMock) {
      console.warn('⚡ No real token — entering Simulation Mode.');
      setIsSimulation(true);
      setCallStatus('connected');
      setChatMessages([
        {
          id: 'system',
          sender: 'system',
          text: `Connected to ${remoteUserName} (Demo Mode)`,
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
      return;
    }

    // Wait for EnableX SDK to load (it's a CDN script — may need a moment)
    let sdkCheckAttempts = 0;
    const maxAttempts = 20; // 20 × 250ms = 5 seconds max wait

    const tryJoinRoom = () => {
      if (!isMountedRef.current) return;

      if (typeof window.EnxRtc === 'undefined') {
        sdkCheckAttempts++;
        if (sdkCheckAttempts < maxAttempts) {
          console.warn(`[EnableX] SDK not ready yet, retrying... (attempt ${sdkCheckAttempts}/${maxAttempts})`);
          setTimeout(tryJoinRoom, 250);
          return;
        }
        // SDK never loaded — fallback to simulation
        console.error('[EnableX] SDK failed to load. Falling back to Simulation Mode.');
        if (isMountedRef.current) {
          setIsSimulation(true);
          setCallStatus('connected');
          toast.error('Real-time call SDK unavailable. Running in demo mode.');
        }
        return;
      }

      console.log('[EnableX] SDK loaded. Joining room:', roomId);
      setCallStatus('connecting');

      const publishOptions = {
        audio: true,
        video: callType === 'video',
        data: true
      };

      try {
        const localStream = window.EnxRtc.joinRoom(token, publishOptions, (success, error) => {
          if (!isMountedRef.current) return;

          if (error) {
            console.error('[EnableX Join Room Failed]', JSON.stringify(error));

            // Check for media permission errors
            const errMsg = JSON.stringify(error).toLowerCase();
            const isMediaError =
              errMsg.includes('notallowederror') ||
              errMsg.includes('notfounderror') ||
              errMsg.includes('permissiondenied') ||
              errMsg.includes('1143') ||
              errMsg.includes('1144') ||
              error?.msg?.result === 1143 ||
              error?.msg?.result === 1144;

            if (isMediaError) {
              console.warn('⚠️ Camera/Mic denied — switching to Demo Mode.');
              setIsSimulation(true);
              setCallStatus('connected');
              const isHttps = window.isSecureContext;
              setChatMessages([{
                id: 'system_perm',
                sender: 'system',
                text: isHttps
                  ? 'Camera/Microphone access was denied. Please allow media access and retry.'
                  : 'WebRTC requires HTTPS. Running in Demo Mode.',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }]);
              toast.error('Camera/mic permission denied. Using demo mode.');
              return;
            }

            // Other errors → disconnect
            console.error('[EnableX] Fatal join error. Ending call.');
            toast.error('Failed to connect to call. Please try again.');
            handleDisconnect();
            return;
          }

          console.log('[EnableX] Joined room successfully!', success);
          const room = success.room;
          roomInstanceRef.current = room;

          if (isMountedRef.current) setCallStatus('connected');

          // ── Unmute local microphone ──────────────────────
          if (localStream) {
            try {
              localStream.unmuteAudio();
              console.log('🎙️ Local audio unmuted');
            } catch (e) {
              console.warn('[Unmute Audio]', e);
            }

            // ── Play local camera feed ───────────────────
            if (callType === 'video') {
              setTimeout(() => {
                if (!isMountedRef.current) return;
                try {
                  localStream.play('local-video-container');
                  console.log('📹 Local video playing');
                } catch (e) {
                  console.warn('[Play Local Video]', e);
                }
              }, 500);
            }
          }

          // ── Subscribe to existing remote streams ─────────
          if (success.streams && success.streams.length > 0) {
            success.streams.forEach(stream => {
              console.log('📡 Subscribing to existing stream:', stream.getID());
              room.subscribe(stream);
            });
          }

          // ── Event: New stream added (other user published) ─
          room.addEventListener('stream-added', (event) => {
            console.log('📡 stream-added:', event.stream.getID());
            room.subscribe(event.stream);
          });

          // ── Event: Stream received (ready to play) ────────
          room.addEventListener('stream-subscribed', (event) => {
            console.log('🎉 stream-subscribed:', event.stream.getID());
            if (!isMountedRef.current) return;
            // Short delay ensures React has rendered the container div
            setTimeout(() => playRemoteStream(event.stream), 200);
          });

          // ── Event: Active talker changed ──────────────────
          room.addEventListener('active-talkers-updated', (event) => {
            console.log('[EnableX] Active talker updated', event);
          });

          // ── Event: Remote user disconnected ───────────────
          room.addEventListener('user-disconnected', (event) => {
            console.log('[EnableX] Remote user disconnected:', event);
            if (isMountedRef.current) {
              toast('Other user left the call', { icon: '📞' });
              handleDisconnect();
            }
          });

          // ── Event: Room disconnected ──────────────────────
          room.addEventListener('room-disconnected', (event) => {
            console.log('[EnableX] Room disconnected:', event);
            if (isMountedRef.current) handleDisconnect();
          });

          // ── Event: In-room chat message ───────────────────
          room.addEventListener('message-received', (event) => {
            if (!isMountedRef.current) return;
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
        console.error('[EnableX joinRoom exception]', err);
        if (isMountedRef.current) {
          setIsSimulation(true);
          setCallStatus('connected');
          toast.error('Call SDK error — running in demo mode.');
        }
      }
    };

    // Start joining
    tryJoinRoom();

    // NOTE: We intentionally do NOT call handleDisconnect in the cleanup here.
    // Cleanup is only triggered by the user explicitly hanging up (handleDisconnect btn)
    // or by EnableX events (user-disconnected, room-disconnected).
    // Auto-cleanup on unmount uses the isMountedRef guard to avoid the loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← Empty deps: join room ONCE when component mounts. Token/roomId won't change.


  // ─── Toggle Mic ──────────────────────────────────────────
  const toggleMic = () => {
    const nextState = !micActive;
    setMicActive(nextState);
    if (isSimulation || !localStreamRef.current) return;
    try {
      if (nextState) localStreamRef.current.unmuteAudio();
      else localStreamRef.current.muteAudio();
    } catch (e) {}
  };

  // ─── Toggle Video ────────────────────────────────────────
  const toggleVideo = () => {
    const nextState = !videoActive;
    setVideoActive(nextState);
    if (isSimulation || !localStreamRef.current) return;
    try {
      if (nextState) {
        localStreamRef.current.unmuteVideo();
        setTimeout(() => {
          try { localStreamRef.current?.play('local-video-container'); } catch(e) {}
        }, 200);
      } else {
        localStreamRef.current.muteVideo();
      }
    } catch (e) {}
  };

  // ─── Send In-Room Chat Message ────────────────────────────
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
        if (isMountedRef.current) {
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
        }
      }, 1500);
      return;
    }

    if (roomInstanceRef.current) {
      roomInstanceRef.current.sendMessage(messageText, true, [], (res) => {
        console.log('[EnableX message sent]', res);
      });
    }
  };

  return (
    <div
      onClick={unlockAudio}
      onTouchStart={unlockAudio}
      className="fixed inset-0 z-[1000] flex bg-[#0A0A0A] text-white overflow-hidden font-sans select-none"
    >
      <style>{`
        #remote-video-container, #local-video-container {
          width: 100% !important;
          height: 100% !important;
          position: relative !important;
          overflow: hidden !important;
          background: #121212;
        }
        #remote-video-container video, #remote-video-container audio, #remote-video-container canvas,
        #local-video-container video, #local-video-container audio, #local-video-container canvas,
        .enx_stream, .enx_video_player, div[id*="stream_"] video,
        div[class*="enx"] video, div[class*="enx"] audio {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
          border-radius: inherit !important;
        }
      `}</style>

      {/* Hidden dedicated audio element for remote voice (backup for browser autoplay restrictions) */}
      <audio ref={remoteAudioRef} id="remote-audio-player" autoPlay playsInline style={{ display: 'none' }} />

      {/* Radial glow backgrounds */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#D51659]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#B44DDC]/10 blur-[120px] pointer-events-none" />

      {/* ─────────────────────────────────────────────────────────────────────
           CRITICAL: EnableX SDK containers — ALWAYS in DOM so SDK can find them.
           For VIDEO: remote-video-container is fullscreen, local is PiP top-right.
           For AUDIO: both containers are 1×1px hidden (SDK still injects audio track).
          ───────────────────────────────────────────────────────────────────── */}

      {/* Remote video/audio container */}
      <div
        id="remote-video-container"
        style={
          callType === 'video' && callStatus === 'connected' && !isSimulation
            ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: 'auto' }
            : { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, zIndex: -1, pointerEvents: 'none', top: 0, left: 0 }
        }
      />

      {/* Local camera PiP container */}
      <div
        id="local-video-container"
        style={
          callType === 'video' && callStatus === 'connected' && !isSimulation
            ? {
                position: 'absolute',
                top: 24, right: 24,
                width: 112, height: 160,
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                background: '#1a1a1a',
                zIndex: 20,
                pointerEvents: 'none',
              }
            : { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, zIndex: -1, pointerEvents: 'none', top: 0, left: 0 }
        }
      />


      {/* ─── Connecting screen ─────────────────────────────── */}
      {callStatus === 'connecting' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="relative w-16 h-16 border-4 border-purple-500/20 border-t-[#D51659] rounded-full animate-spin mb-6" />
          <h3 className="text-lg font-semibold">Establishing Connection...</h3>
          <p className="text-sm text-slate-400 mt-1.5">Joining EnableX secure server</p>
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
                {isSimulation ? 'Demo Mode' : 'Voice Call Connected'} ({formatTime(duration)})
              </p>
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
            /* ── Video call main UI (shows behind the EnableX container) ── */
            <div className="flex-1 h-full bg-[#121212] relative overflow-hidden flex items-center justify-center">
              {isSimulation && (
                /* Simulation fallback UI */
                <>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr from-[#1A0C16] to-[#0F0F1A]">
                    <img
                      src={remoteUserPhoto || "https://via.placeholder.com/150"}
                      alt={remoteUserName}
                      className="w-24 h-24 rounded-full object-cover border border-white/20 shadow-xl opacity-80"
                    />
                    <div className="absolute bottom-6 left-6 text-sm font-semibold bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#D51659] animate-pulse" />
                      <span>{remoteUserName} (Demo)</span>
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                  </div>
                  {/* Simulation local PiP */}
                  <div className="absolute top-6 right-6 w-28 h-40 md:w-36 md:h-52 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900 z-20">
                    <div className="w-full h-full bg-slate-800 relative flex items-center justify-center">
                      <img
                        src={currentUser?.photos?.[0]?.url || "https://via.placeholder.com/150"}
                        alt="Me"
                        className="w-14 h-14 rounded-full object-cover border border-white/20 shadow-md"
                      />
                      <div className="absolute bottom-2 left-2 text-[9px] font-semibold bg-black/65 px-1.5 py-0.5 rounded text-slate-300">
                        You (Demo)
                      </div>
                    </div>
                  </div>
                </>
              )}
              {!isSimulation && (
                /* Placeholder shown while waiting for remote stream (before black screen) */
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121212] z-0 pointer-events-none">
                  <img
                    src={remoteUserPhoto || "https://via.placeholder.com/150"}
                    alt={remoteUserName}
                    className="w-24 h-24 rounded-full object-cover border-2 border-white/10 mb-3 opacity-50"
                  />
                  <p className="text-slate-500 text-sm">Waiting for {remoteUserName}...</p>
                </div>
              )}
            </div>
          )}

          {/* ── Simulation mode badge ─────────────────────── */}
          {isSimulation && (
            <div className="absolute top-4 left-4 bg-purple-500/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-purple-300 border border-purple-500/30 z-30">
              Demo Mode
            </div>
          )}

          {/* ── Top overlay (name + timer + mute sound) ───── */}
          <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between pointer-events-none z-25">
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
                onClick={() => {
                  setIsMutedSound(!isMutedSound);
                  if (remoteAudioRef.current) {
                    remoteAudioRef.current.muted = !isMutedSound;
                  }
                  // Also mute/unmute EnableX injected elements
                  const container = document.getElementById('remote-video-container');
                  if (container) {
                    container.querySelectorAll('video, audio').forEach(el => {
                      el.muted = !isMutedSound;
                    });
                  }
                }}
                className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:bg-black/60 text-white transition-colors"
                title={isMutedSound ? "Unmute Call Sound" : "Mute Call Sound"}
              >
                {isMutedSound ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* ── Bottom controls HUD ──────────────────────── */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 bg-black/50 border border-white/10 backdrop-blur-xl rounded-3xl flex items-center gap-5 md:gap-7 z-25 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">

            {/* Mic toggle */}
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

            {/* Video toggle (only for video calls) */}
            {callType === 'video' && (
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
            )}

            {/* In-call text chat */}
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

                {/* Input */}
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
