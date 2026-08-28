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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { fetchMe } from '../redux/slices/authSlice';
import { getSocket } from '../utils/socket';

// ─── ICE / TURN Servers ──────────────────────────────────
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.services.mozilla.com' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelay',
    credential: 'openrelay',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelay',
    credential: 'openrelay',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelay',
    credential: 'openrelay',
  },
];

const VideoCall = ({
  roomId,
  token,
  remoteUserName,
  remoteUserPhoto,
  callType = 'video',
  onEndCall,
  currentUser,
  targetUserId,
  isCaller = true,
}) => {
  const dispatch = useDispatch();

  const [callStatus, setCallStatus] = useState('connecting');
  const [duration, setDuration] = useState(0);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(callType === 'video');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isMutedSound, setIsMutedSound] = useState(false);
  const [camError, setCamError] = useState('');
  // Track if remote stream has tracks so we can show/hide avatar
  const [hasRemoteStream, setHasRemoteStream] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const onEndCallRef = useRef(onEndCall);
  const endedRef = useRef(false);
  const callStatusRef = useRef('connecting');

  // Signal queues to handle race conditions
  const pendingOfferRef = useRef(null);
  const pendingAnswerRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const remoteDescSetRef = useRef(false);
  const disconnectTimerRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  // Prevent double-offer: only send offer once
  const offerSentRef = useRef(false);
  // Track whether media+PC are ready for signaling
  const pcReadyRef = useRef(false);

  useEffect(() => {
    onEndCallRef.current = onEndCall;
  }, [onEndCall]);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── Safely attach stream to a video element ─────────
  const attachStream = (videoEl, stream) => {
    if (!videoEl || !stream) return;
    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
    }
    // Always call play() – gracefully handle already-playing state
    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Ignore AbortError (happens when play is interrupted by a new call)
        if (err.name !== 'AbortError') {
          console.warn('[VideoCall] play() warning:', err);
        }
      });
    }
  };

  // ─── Teardown ─────────────────────────────────────────
  const teardown = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    if (pcRef.current) {
      try { pcRef.current.close(); } catch (_) { }
      pcRef.current = null;
    }

    setCallStatus('disconnected');
    callStatusRef.current = 'disconnected';

    onEndCallRef.current?.();
  }, []);

  // ─── Coin deduction timer ─────────────────────────────
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    const coinInterval = setInterval(async () => {
      try {
        const res = await api.post('/coins/deduct-call', { targetUserId, callType, seconds: 20 });
        if (!res.data.success && res.data.insufficientCoins) {
          toast.error('Insufficient coins to continue call');
          teardown();
        } else {
          dispatch(fetchMe());
        }
      } catch (_) { }
    }, 20000);

    return () => {
      clearInterval(timer);
      clearInterval(coinInterval);
    };
  }, [callStatus, callType, targetUserId, dispatch, teardown]);

  // ─── Flush queued ICE candidates ─────────────────────
  const flushIceCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !remoteDescSetRef.current) return;
    const candidates = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];
    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[WebRTC] Failed to add buffered ICE candidate', e);
      }
    }
  }, []);

  // ─── Create & Send Offer (guarded – only fires once) ──
  const createAndSendOffer = useCallback(async () => {
    // Prevent sending a second offer which breaks receiver SDP state machine
    if (offerSentRef.current) {
      console.log('[WebRTC] Offer already sent – ignoring duplicate request');
      return;
    }
    const pc = pcRef.current;
    const socket = getSocket();
    if (!pc || !socket || !targetUserId) {
      console.log('[WebRTC] PC not ready yet – will send offer once ready');
      return;
    }

    offerSentRef.current = true;
    try {
      console.log('[WebRTC] Creating offer for', targetUserId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video',
      });
      await pc.setLocalDescription(offer);
      socket.emit('webrtc_offer', { targetUserId: String(targetUserId), offer });
      console.log('[WebRTC] Offer sent to', targetUserId);
    } catch (e) {
      offerSentRef.current = false; // allow retry on error
      console.error('[WebRTC] createAndSendOffer error:', e);
    }
  }, [callType, targetUserId]);

  // ─── Handle Received Offer ────────────────────────────
  const handleOffer = useCallback(
    async (offer, senderId) => {
      const pc = pcRef.current;
      const socket = getSocket();
      if (!pc || !socket) {
        console.log('[WebRTC] PC not ready, queuing offer from', senderId);
        pendingOfferRef.current = { offer, senderId };
        return;
      }

      try {
        console.log('[WebRTC] Processing offer from', senderId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        remoteDescSetRef.current = true;
        await flushIceCandidates();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', {
          targetUserId: String(senderId || targetUserId),
          answer,
        });
        console.log('[WebRTC] Answer sent to', senderId || targetUserId);
      } catch (e) {
        console.error('[WebRTC] handleOffer error:', e);
      }
    },
    [flushIceCandidates, targetUserId]
  );

  // ─── Handle Received Answer ───────────────────────────
  const handleAnswer = useCallback(
    async (answer) => {
      const pc = pcRef.current;
      if (!pc) {
        pendingAnswerRef.current = answer;
        return;
      }
      try {
        console.log('[WebRTC] Processing answer');
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        remoteDescSetRef.current = true;
        await flushIceCandidates();
      } catch (e) {
        console.error('[WebRTC] handleAnswer error:', e);
      }
    },
    [flushIceCandidates]
  );

  // ─── Handle Received ICE Candidate ───────────────────
  const handleIceCandidate = useCallback(async (candidate) => {
    const pc = pcRef.current;
    if (!pc || !remoteDescSetRef.current) {
      pendingIceCandidatesRef.current.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn('[WebRTC] handleIceCandidate error:', e);
    }
  }, []);

  // ─── Socket Signaling Listeners ──────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onOffer = ({ senderId, offer }) => handleOffer(offer, senderId);
    const onAnswer = ({ answer }) => handleAnswer(answer);
    const onIce = ({ candidate }) => handleIceCandidate(candidate);
    const onReady = () => {
      console.log('[WebRTC] Peer is ready – sending offer (guarded)');
      // Only the caller sends the offer; offerSentRef guards against duplicates
      if (isCaller) createAndSendOffer();
    };

    socket.on('webrtc_offer', onOffer);
    socket.on('webrtc_answer', onAnswer);
    socket.on('webrtc_ice_candidate', onIce);
    socket.on('webrtc_ready', onReady);
    socket.on('call_accepted', onReady);

    return () => {
      socket.off('webrtc_offer', onOffer);
      socket.off('webrtc_answer', onAnswer);
      socket.off('webrtc_ice_candidate', onIce);
      socket.off('webrtc_ready', onReady);
      socket.off('call_accepted', onReady);
    };
  }, [handleOffer, handleAnswer, handleIceCandidate, createAndSendOffer, isCaller]);

  // ─── Main WebRTC Initialization ───────────────────────
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        // 1. Capture local media
        const constraints = {
          audio: true,
          video:
            callType === 'video'
              ? { width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 }, facingMode: 'user' }
              : false,
        };

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
          console.warn('[WebRTC] Fallback to audio-only:', err);
          setCamError('Camera unavailable. Continuing audio-only.');
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          } catch (audioErr) {
            console.error('[WebRTC] Failed audio capture:', audioErr);
            throw audioErr;
          }
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;

        // Attach local preview immediately
        if (localVideoRef.current) {
          attachStream(localVideoRef.current, stream);
        }

        // 2. Create PeerConnection
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS, iceCandidatePoolSize: 10 });
        pcRef.current = pc;

        // Add local tracks
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // 3. Remote track handler – KEY FIX: Directly assign srcObject to ref element
        pc.ontrack = (event) => {
          console.log('[WebRTC] ontrack fired:', event.track.kind, event.streams?.length);

          // Prefer the stream that came with the event
          let remoteStream;
          if (event.streams && event.streams[0]) {
            remoteStream = event.streams[0];
          } else {
            // Build our own MediaStream and add the track
            if (!remoteStreamRef.current) {
              remoteStreamRef.current = new MediaStream();
            }
            const existing = remoteStreamRef.current;
            if (!existing.getTracks().some((t) => t.id === event.track.id)) {
              existing.addTrack(event.track);
            }
            remoteStream = existing;
          }

          remoteStreamRef.current = remoteStream;

          // ── Directly assign to the DOM element (no React state) ──
          if (remoteVideoRef.current) {
            attachStream(remoteVideoRef.current, remoteStream);
          }

          // Trigger re-render so the avatar overlay hides and video shows
          setHasRemoteStream(true);
          setCallStatus('connected');
          callStatusRef.current = 'connected';

          // Cancel the fallback timer – we have a real stream
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
          }
        };

        // 4. ICE candidate emission
        const socket = getSocket();
        pc.onicecandidate = ({ candidate }) => {
          if (candidate && socket && targetUserId) {
            socket.emit('webrtc_ice_candidate', {
              targetUserId: String(targetUserId),
              candidate,
            });
          }
        };

        pc.onicegatheringstatechange = () => {
          console.log('[WebRTC] ICE gathering state:', pc.iceGatheringState);
        };

        // 5. Connection state changes
        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          console.log('[WebRTC] Connection state:', state);

          if (state === 'connected') {
            if (disconnectTimerRef.current) {
              clearTimeout(disconnectTimerRef.current);
              disconnectTimerRef.current = null;
            }
            setCallStatus('connected');
            callStatusRef.current = 'connected';
          } else if (state === 'disconnected') {
            // Give 8 s for ICE restart before tearing down
            if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
            disconnectTimerRef.current = setTimeout(() => {
              if (pcRef.current?.connectionState === 'disconnected' && !endedRef.current) {
                teardown();
              }
            }, 8000);
          } else if (state === 'failed' || state === 'closed') {
            if (!endedRef.current) teardown();
          }
        };

        // 6. Process any queued signals & initiate handshake
        pcReadyRef.current = true;

        if (isCaller) {
          // If we received an answer while waiting for media, process it now
          if (pendingAnswerRef.current) {
            const ans = pendingAnswerRef.current;
            pendingAnswerRef.current = null;
            await handleAnswer(ans);
          }
          // Send the offer (offerSentRef prevents a second send if
          // call_accepted / webrtc_ready already triggered it)
          console.log('[WebRTC] Caller: sending offer now');
          await createAndSendOffer();
        } else {
          // Receiver: if the offer arrived before media was ready, process it
          if (pendingOfferRef.current) {
            const { offer: qOffer, senderId: qSender } = pendingOfferRef.current;
            pendingOfferRef.current = null;
            await handleOffer(qOffer, qSender);
          } else {
            // No queued offer yet – tell the caller we are ready
            console.log('[WebRTC] Receiver: announcing readiness');
            if (socket && targetUserId) {
              socket.emit('webrtc_ready', { targetUserId: String(targetUserId) });
            }
          }
        }

        // 8. Fallback: if no ontrack fires within 20 s, still show the call UI
        fallbackTimerRef.current = setTimeout(() => {
          if (!cancelled && callStatusRef.current === 'connecting') {
            console.log('[WebRTC] Fallback timer fired – showing connected UI without remote stream');
            setCallStatus('connected');
            callStatusRef.current = 'connected';
          }
        }, 20000);

      } catch (err) {
        console.error('[WebRTC] Setup error:', err);
        setCamError(`Setup error: ${err.message}`);
        setCallStatus('connected');
        callStatusRef.current = 'connected';
      }
    };

    start();

    return () => {
      cancelled = true;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((t) => t.stop());
        remoteStreamRef.current = null;
      }
      if (pcRef.current) {
        try { pcRef.current.close(); } catch (_) { }
        pcRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // Run ONCE on mount – all refs are stable

  // ─── Re-attach remote stream whenever remoteVideoRef changes ──
  // (handles the case where the video DOM element re-mounts)
  const remoteVideoCallbackRef = useCallback((el) => {
    remoteVideoRef.current = el;
    if (el && remoteStreamRef.current) {
      attachStream(el, remoteStreamRef.current);
    }
  }, []);

  // ─── Re-attach local stream to local video ────────────
  const localVideoCallbackRef = useCallback((el) => {
    localVideoRef.current = el;
    if (el && localStreamRef.current) {
      attachStream(el, localStreamRef.current);
    }
  }, []);

  // ─── Controls ─────────────────────────────────────────
  const toggleMic = () => {
    const next = !micActive;
    setMicActive(next);
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = next; });
  };

  const toggleVideo = () => {
    const next = !videoActive;
    setVideoActive(next);
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = next; });
  };

  const handleEndCall = () => teardown();

  // ─── In-call Chat ─────────────────────────────────────
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [
      ...prev,
      {
        id: `my_${Date.now()}`,
        sender: 'me',
        senderName: currentUser?.name || 'Me',
        text: chatInput.trim(),
        time: timeStr,
      },
    ]);
    setChatInput('');
  };

  return (
    <div className="fixed inset-0 z-[1000] flex bg-[#0A0A0A] text-white overflow-hidden font-sans select-none">
      {/* Radial glow background */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#D51659]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#B44DDC]/10 blur-[120px] pointer-events-none" />

      {/* Main container */}
      <div className="flex-1 flex relative overflow-hidden">

        {/* ── Remote Video (full screen) ── */}
        <div className="absolute inset-0 bg-[#121212] flex items-center justify-center">
          {/* Video element is always rendered but hidden when no stream */}
          <video
            ref={remoteVideoCallbackRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{
              display: callType === 'video' && hasRemoteStream ? 'block' : 'none',
            }}
          />

          {/* Avatar: visible for audio calls OR when remote video stream not yet received */}
          {(callType === 'audio' || (callType === 'video' && !hasRemoteStream)) && (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative mb-8 flex items-center justify-center">
                <span className="absolute w-52 h-52 rounded-full bg-[#D51659]/20 blur-2xl animate-pulse" />
                <span
                  className="absolute w-40 h-40 rounded-full border border-[#D51659]/40 animate-ping"
                  style={{ animationDuration: '3s' }}
                />
                <img
                  src={remoteUserPhoto || 'https://via.placeholder.com/150'}
                  alt={remoteUserName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/10 shadow-[0_0_50px_rgba(213,22,89,0.4)] relative z-10"
                />
              </div>
              <h2 className="text-2xl font-black text-white tracking-wide drop-shadow-md">{remoteUserName}</h2>
              {callStatus === 'connected' ? (
                <p className="text-xs font-bold text-green-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {callType === 'audio' ? 'Voice Call Connected' : 'Connecting video...'} · {formatTime(duration)}
                </p>
              ) : (
                <p className="text-xs font-bold text-[#D51659] uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D51659] animate-pulse" />
                  Connecting...
                </p>
              )}
              {callType === 'audio' && (
                <div className="flex items-center gap-1.5 mt-8 h-10">
                  {[40, 75, 30, 90, 50, 85, 45, 65, 100, 55, 80, 35, 70, 45].map((h, i) => (
                    <span
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-[#D51659] to-[#B44DDC] rounded-full animate-pulse"
                      style={{
                        height: micActive ? `${h}%` : '20%',
                        animationDelay: `${(i * 120) % 600}ms`,
                        animationDuration: '1.2s',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Connecting Overlay ── */}
        <AnimatePresence>
          {callStatus === 'connecting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md flex flex-col items-center justify-center p-6"
            >
              <div className="relative mb-6">
                <span
                  className="absolute inset-[-15px] rounded-full border border-[#D51659]/30 animate-ping"
                  style={{ animationDuration: '2s' }}
                />
                <span
                  className="absolute inset-[-30px] rounded-full border border-purple-500/20 animate-ping"
                  style={{ animationDuration: '3.5s' }}
                />
                <img
                  src={remoteUserPhoto || 'https://via.placeholder.com/150'}
                  alt={remoteUserName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/10 shadow-[0_8px_32px_rgba(213,22,89,0.3)] relative z-10"
                />
              </div>
              <h2 className="text-xl font-bold tracking-wide text-white">{remoteUserName}</h2>
              <p className="text-sm text-slate-400 mt-2 flex items-center gap-1.5 uppercase font-semibold tracking-widest text-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-[#D51659] animate-pulse" />
                Connecting...
              </p>
              {camError && (
                <p className="mt-4 text-xs text-amber-400 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 max-w-xs text-center">
                  ⚠️ {camError}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera error banner */}
        {camError && callStatus === 'connected' && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold px-4 py-2 rounded-xl backdrop-blur-sm">
            ⚠️ {camError}
          </div>
        )}

        {/* ── Local PiP (Picture-in-Picture) ── */}
        {callType === 'video' && (
          <div className="absolute top-6 right-6 w-28 h-40 md:w-36 md:h-52 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900 z-30">
            {videoActive ? (
              <video
                ref={localVideoCallbackRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-2">
                <img
                  src={currentUser?.photos?.[0]?.url || 'https://via.placeholder.com/150'}
                  alt="Me"
                  className="w-10 h-10 rounded-full object-cover grayscale"
                />
                <VideoOff className="w-3.5 h-3.5 text-slate-500" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 text-[9px] font-semibold bg-black/65 px-1.5 py-0.5 rounded text-slate-300">
              You
            </div>
          </div>
        )}

        {/* ── Top Header ── */}
        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between pointer-events-none z-30">
          <div className="pointer-events-auto">
            <h4 className="font-extrabold text-sm text-white drop-shadow-md">{remoteUserName}</h4>
            <p className="text-[10px] font-bold text-[#D51659] uppercase tracking-wider flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {callStatus === 'connected' ? `Live · ${formatTime(duration)}` : 'Connecting...'}
            </p>
          </div>
          <button
            onClick={() => setIsMutedSound((m) => !m)}
            className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:bg-black/60 text-white transition-colors pointer-events-auto"
          >
            {isMutedSound ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* ── Bottom Controls ── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 bg-black/50 border border-white/10 backdrop-blur-xl rounded-3xl flex items-center gap-5 md:gap-7 z-30 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          <button
            onClick={toggleMic}
            className={`p-3 rounded-2xl transition-all duration-300 ${micActive
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-[#D51659]/30 text-[#D51659] border border-[#D51659]/50'
              }`}
            title={micActive ? 'Mute' : 'Unmute'}
          >
            {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-2xl transition-all duration-300 ${videoActive
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-[#D51659]/30 text-[#D51659] border border-[#D51659]/50'
                }`}
              title={videoActive ? 'Turn off camera' : 'Turn on camera'}
            >
              {videoActive ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={() => setShowChat((c) => !c)}
            className={`p-3 rounded-2xl transition-all duration-300 relative ${showChat
              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
              : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            title="Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {!showChat && chatMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#D51659] rounded-full border border-black animate-pulse" />
            )}
          </button>

          <span className="w-[1px] h-6 bg-white/15" />

          <button
            onClick={handleEndCall}
            className="p-3.5 rounded-full bg-[#D51659] hover:bg-[#D51659]/90 text-white hover:scale-110 active:scale-95 transition-all shadow-[0_4px_16px_rgba(213,22,89,0.4)]"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* ── In-Call Chat Drawer ── */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full sm:w-80 h-full bg-[#0F0F16]/95 border-l border-white/10 backdrop-blur-xl flex flex-col z-40 relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
            >
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

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
                {chatMessages.length === 0 && (
                  <p className="text-center text-xs text-white/20 py-6">No messages yet. Say hi! 👋</p>
                )}
                {chatMessages.map((msg) => {
                  const isMe = msg.sender === 'me';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] text-slate-500 font-semibold mb-0.5 px-1">{msg.senderName}</span>
                      <div
                        className={`p-2.5 rounded-2xl text-xs max-w-[85%] break-words leading-relaxed ${isMe
                          ? 'bg-[#D51659] text-white rounded-tr-none'
                          : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'
                          }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[8px] text-slate-600 mt-0.5 px-1">{msg.time}</span>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-black/40 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send message..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#D51659] transition-all"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-[#D51659] text-white hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VideoCall;
