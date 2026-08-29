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
import { getSocket } from '../utils/socket';

// ─── ICE STUN servers ───────────────────────────────────────
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

const VideoCall = ({
  roomId,
  token,
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

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);              // RTCPeerConnection
  const localStreamRef = useRef(null);    // Local MediaStream
  const isDisconnectedRef = useRef(false);
  const isMountedRef = useRef(true);
  const iceCandidateQueueRef = useRef([]); // Queue ICE candidates until remote desc is set
  const hasRemoteDescRef = useRef(false);
  const offerSentRef = useRef(false);      // Guard against double-offer

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
        // Ignore API errors silently — don't kill the call
      }
    }, 20000);
    return () => clearInterval(coinDeductInterval);
  }, [callStatus, callType, targetUserId, dispatch, onEndCall]);

  // ─── Core disconnect handler ─────────────────────────────
  const onEndCallRef = useRef(onEndCall);
  useEffect(() => { onEndCallRef.current = onEndCall; }, [onEndCall]);

  const handleDisconnect = useCallback(() => {
    if (isDisconnectedRef.current) return;
    isDisconnectedRef.current = true;

    // Close peer connection
    if (pcRef.current) {
      try { pcRef.current.close(); } catch (e) { }
      pcRef.current = null;
    }
    // Stop all local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    if (isMountedRef.current) setCallStatus('disconnected');

    if (onEndCallRef.current) {
      setTimeout(() => onEndCallRef.current(), 50);
    }
  }, []);

  // ─── Attach ICE candidates from queue ───────────────────
  const flushIceCandidateQueue = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    while (iceCandidateQueueRef.current.length > 0) {
      const candidate = iceCandidateQueueRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[WebRTC] Failed to add queued ICE candidate', e);
      }
    }
  }, []);

  // ─── Create RTCPeerConnection ────────────────────────────
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Send ICE candidates to the remote peer via socket
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        if (socket) {
          socket.emit('webrtc_ice_candidate', {
            targetUserId,
            candidate: event.candidate
          });
        }
      }
    };

    // When remote adds tracks, display them
    pc.ontrack = (event) => {
      console.log('📹 Remote track received:', event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        if (isMountedRef.current) {
          setRemoteStreamActive(true);
          setCallStatus('connected');
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        if (isMountedRef.current) setCallStatus('connected');
      } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        if (isMountedRef.current && !isDisconnectedRef.current) {
          toast('Connection lost', { icon: '📞' });
          handleDisconnect();
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        if (isMountedRef.current) setCallStatus('connected');
      }
    };

    return pc;
  }, [targetUserId, handleDisconnect]);

  // ─── Main WebRTC Setup ───────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !targetUserId) {
      console.error('[VideoCall] No socket or targetUserId — cannot start call.');
      return;
    }

    // Refs for async state within this effect
    const pendingOfferRef = { current: null }; // Offer received before PC was ready
    const pcReadyRef = { current: false };       // PC and tracks are added
    let pc;

    // ── STEP 1: Register socket listeners IMMEDIATELY (before async getUserMedia) ──
    // This prevents race conditions where callee emits 'webrtc_ready' before
    // caller's async setup completes.

    const handleOffer = async ({ senderId, offer }) => {
      if (String(senderId) !== String(targetUserId)) return;
      console.log('[WebRTC] Received offer. PC ready:', pcReadyRef.current);

      if (!pcReadyRef.current) {
        // PC not ready yet — queue the offer to be processed after setup
        pendingOfferRef.current = offer;
        console.warn('[WebRTC] PC not ready — queuing offer for later processing');
        return;
      }
      await processOffer(offer);
    };

    const processOffer = async (offer) => {
      if (!pcRef.current) return;
      console.log('[WebRTC] Processing offer...');
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      hasRemoteDescRef.current = true;
      await flushIceCandidateQueue();

      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('webrtc_answer', { targetUserId, answer });
      console.log('[WebRTC] ✅ Sent answer');
    };

    const handleAnswer = async ({ senderId, answer }) => {
      if (String(senderId) !== String(targetUserId)) return;
      console.log('[WebRTC] Received answer');
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      hasRemoteDescRef.current = true;
      await flushIceCandidateQueue();
    };

    const handleIceCandidate = async ({ senderId, candidate }) => {
      if (String(senderId) !== String(targetUserId)) return;
      if (!hasRemoteDescRef.current || !pcRef.current) {
        iceCandidateQueueRef.current.push(candidate);
        return;
      }
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[WebRTC] Failed to add ICE candidate', e);
      }
    };

    const sendOffer = async () => {
      if (!isCaller || offerSentRef.current || !pcRef.current) return;
      offerSentRef.current = true;
      console.log('[WebRTC] Creating and sending offer...');
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socket.emit('webrtc_offer', { targetUserId, offer });
      console.log('[WebRTC] ✅ Sent offer');
    };

    const handleRemoteReady = async ({ senderId }) => {
      if (String(senderId) !== String(targetUserId)) return;
      console.log('[WebRTC] Remote is ready — isCaller:', isCaller, '| PC ready:', pcReadyRef.current);
      if (isCaller && !offerSentRef.current) {
        if (pcReadyRef.current) {
          await sendOffer();
        } else {
          // PC setup is still in progress (getUserMedia slow) — signal it to send offer when ready
          offerSentRef.current = false; // Will be set to true in sendOffer
          console.warn('[WebRTC] Got webrtc_ready before PC ready — will send offer once setup completes');
          // Set flag so setup completion knows to send the offer
          pendingOfferRef.current = 'SEND_OFFER_WHEN_READY';
        }
      }
    };

    const handleCallerReady = ({ senderId }) => {
      if (String(senderId) !== String(targetUserId)) return;
      console.log('[WebRTC] Received webrtc_caller_ready. isCaller:', isCaller);
      if (!isCaller) {
        socket.emit('webrtc_ready', { targetUserId });
        console.log('[WebRTC] Callee responding to webrtc_caller_ready with webrtc_ready');
      }
    };

    const handleCallEnded = () => {
      toast('Call ended by the other person', { icon: '📞' });
      if (isMountedRef.current && !isDisconnectedRef.current) handleDisconnect();
    };

    // Register listeners SYNCHRONOUSLY before any async work
    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);
    socket.on('webrtc_ready', handleRemoteReady);
    socket.on('webrtc_caller_ready', handleCallerReady);
    socket.on('call_ended', handleCallEnded);
    console.log('[WebRTC] 📡 Socket listeners registered. isCaller:', isCaller);

    // ── STEP 2: Get local media asynchronously ────────────
    const start = async () => {
      try {
        const constraints = {
          audio: true,
          video: callType === 'video'
            ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
            : false
        };

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (mediaErr) {
          console.error('[VideoCall] Camera/mic error:', mediaErr.name, mediaErr.message);
          // Try audio-only fallback for video calls
          if (callType === 'video') {
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
              console.warn('[VideoCall] Falling back to audio-only');
              if (isMountedRef.current) setVideoActive(false);
            } catch (audioErr) {
              toast.error('Camera/microphone access denied. Please allow in browser settings.');
              handleDisconnect();
              return;
            }
          } else {
            toast.error('Microphone access denied. Please allow in browser settings.');
            handleDisconnect();
            return;
          }
        }

        if (!isMountedRef.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;

        // Show local camera preview
        if (localVideoRef.current && stream.getVideoTracks().length > 0) {
          localVideoRef.current.srcObject = stream;
        }

        // 3. Create peer connection and add tracks
        pc = createPeerConnection();
        pcRef.current = pc;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        pcReadyRef.current = true;
        console.log('[WebRTC] ✅ PC ready with', stream.getTracks().length, 'tracks');

        // 4. Now that PC is ready, start signaling handshake
        if (isCaller) {
          // Check if we already received webrtc_ready before PC was ready
          if (pendingOfferRef.current === 'SEND_OFFER_WHEN_READY') {
            pendingOfferRef.current = null;
            await sendOffer();
          } else {
            // Caller waits for callee's webrtc_ready
            // Also emit a 'caller_ready' so callee knows to send webrtc_ready
            socket.emit('webrtc_caller_ready', { targetUserId });
            console.log('[WebRTC] Caller: PC ready, sent webrtc_caller_ready. Waiting for callee...');
            // Safety fallback: if we never get webrtc_ready within 4s, send offer anyway
            setTimeout(async () => {
              if (isMountedRef.current && !offerSentRef.current && pcRef.current) {
                console.warn('[WebRTC] Timeout: callee never sent webrtc_ready — sending offer anyway');
                await sendOffer();
              }
            }, 4000);
          }
        } else {
          // Callee: process any offer that arrived before PC was ready
          if (pendingOfferRef.current && pendingOfferRef.current !== 'SEND_OFFER_WHEN_READY') {
            const queuedOffer = pendingOfferRef.current;
            pendingOfferRef.current = null;
            await processOffer(queuedOffer);
          } else {
            // Send webrtc_ready — caller will respond with an offer
            socket.emit('webrtc_ready', { targetUserId });
            console.log('[WebRTC] Callee: sent webrtc_ready to caller');
            // Re-send after 2s in case caller's socket listener missed it
            setTimeout(() => {
              if (isMountedRef.current && !hasRemoteDescRef.current) {
                socket.emit('webrtc_ready', { targetUserId });
                console.log('[WebRTC] Callee: re-sent webrtc_ready (retry)');
              }
            }, 2500);
          }
        }

      } catch (err) {
        console.error('[VideoCall] Setup error:', err);
        if (isMountedRef.current) {
          toast.error('Failed to set up call. Please try again.');
          handleDisconnect();
        }
      }
    };

    start();

    return () => {
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      socket.off('webrtc_ready', handleRemoteReady);
      socket.off('webrtc_caller_ready', handleCallerReady);
      socket.off('call_ended', handleCallEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ─── Toggle Mic ──────────────────────────────────────────
  const toggleMic = () => {
    const next = !micActive;
    setMicActive(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = next; });
    }
  };

  // ─── Toggle Video ────────────────────────────────────────
  const toggleVideo = () => {
    const next = !videoActive;
    setVideoActive(next);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = next; });
    }
  };

  // ─── Send In-Room Chat Message (via socket data channel fallback) ─
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

    // Try sending via socket
    const socket = getSocket();
    if (socket) {
      socket.emit('webrtc_chat', { targetUserId, message: messageText });
    }
  };

  // ─── Receive in-call chat messages ──────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleChatMsg = ({ senderId, message }) => {
      if (String(senderId) !== String(targetUserId)) return;
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
  }, [targetUserId, remoteUserName]);

  return (
    <div
      className="fixed inset-0 z-[1000] flex bg-[#0A0A0A] text-white overflow-hidden font-sans select-none"
    >
      {/* Radial glow backgrounds */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#D51659]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#B44DDC]/10 blur-[120px] pointer-events-none" />

      {/* ─── Connecting screen ─────────────────────────────── */}
      {callStatus === 'connecting' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <div className="relative w-16 h-16 border-4 border-purple-500/20 border-t-[#D51659] rounded-full animate-spin mb-6" />
          <h3 className="text-lg font-semibold">Connecting...</h3>
          <p className="text-sm text-slate-400 mt-1.5">Waiting for the other person to join</p>
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
              <video ref={remoteVideoRef} autoPlay playsInline style={{ display: 'none' }} />
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
              {/* Remote video — fullscreen */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={isMutedSound}
                className="w-full h-full object-cover"
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
                  <p className="text-slate-500 text-sm">Waiting for {remoteUserName} camera...</p>
                </div>
              )}

              {/* Local camera PiP — top-right corner */}
              <div
                className="absolute top-6 right-6 w-28 md:w-36 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-[#1a1a1a] z-20"
                style={{ aspectRatio: '9/16' }}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
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
