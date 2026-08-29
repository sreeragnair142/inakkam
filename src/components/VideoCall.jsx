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
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { fetchMe } from '../redux/slices/authSlice';

const ENABLEX_SDK_URL = 'https://developer.enablex.io/downloads/video/web/v3.1.10/EnxRtc.js';

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

  // ─── Call state ──────────────────────────────────────────
  const [callStatus, setCallStatus] = useState('requesting'); // requesting | connecting | connected | disconnected
  const [duration, setDuration] = useState(0);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(callType === 'video');
  const [isMutedSound, setIsMutedSound] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isSimulation, setIsSimulation] = useState(false);
  const [remoteVideoReady, setRemoteVideoReady] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  // ─── Refs ─────────────────────────────────────────────────
  // Native video elements — directly controlled, no EnableX DOM injection needed
  const localVideoRef  = useRef(null);  // <video> for local camera PiP
  const remoteVideoRef = useRef(null);  // <video> for remote camera
  const remoteAudioRef = useRef(null);  // <audio> backup for remote voice

  // EnableX SDK handles
  const roomRef          = useRef(null);
  const enxLocalStream   = useRef(null); // EnableX stream object
  const nativeLocalStream = useRef(null); // Raw getUserMedia MediaStream

  // Guards
  const isMountedRef      = useRef(true);
  const isDisconnectedRef = useRef(false);
  const onEndCallRef      = useRef(onEndCall);
  useEffect(() => { onEndCallRef.current = onEndCall; }, [onEndCall]);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ─── Helpers ──────────────────────────────────────────────
  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  };

  // ─── Timer ───────────────────────────────────────────────
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const t = setInterval(() => {
      if (isMountedRef.current) setDuration(p => p + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [callStatus]);

  // ─── Coin deduction ──────────────────────────────────────
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const iv = setInterval(async () => {
      try {
        const res = await api.post('/coins/deduct-call', { targetUserId, callType, seconds: 20 });
        if (!res.data.success && res.data.insufficientCoins) {
          toast.error('Insufficient coins to continue call');
          if (isMountedRef.current) handleDisconnect();
        } else {
          dispatch(fetchMe());
        }
      } catch (_) {}
    }, 20000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callStatus]);

  // ─── Disconnect ───────────────────────────────────────────
  const handleDisconnect = useCallback(() => {
    if (isDisconnectedRef.current) return;
    isDisconnectedRef.current = true;

    // Stop native camera stream
    if (nativeLocalStream.current) {
      nativeLocalStream.current.getTracks().forEach(t => t.stop());
      nativeLocalStream.current = null;
    }
    // Leave EnableX room
    if (roomRef.current) {
      try { roomRef.current.disconnect(); } catch (_) {}
      roomRef.current = null;
    }
    if (enxLocalStream.current) {
      try { enxLocalStream.current.close(); } catch (_) {}
      enxLocalStream.current = null;
    }
    if (isMountedRef.current) setCallStatus('disconnected');
    setTimeout(() => { if (onEndCallRef.current) onEndCallRef.current(); }, 60);
  }, []);

  // ─── Audio unlock on user interaction ────────────────────
  const unlockAudio = useCallback(() => {
    [remoteAudioRef.current].forEach(el => {
      if (el && el.paused) { el.muted = false; el.volume = 1; el.play().catch(() => {}); }
    });
    if (remoteVideoRef.current && remoteVideoRef.current.paused) {
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, []);

  // ─── Attach remote native MediaStream to video/audio elements ───
  const attachRemoteStream = useCallback((enxStream) => {
    const raw = enxStream.stream
      || (typeof enxStream.getMediaStream === 'function' ? enxStream.getMediaStream() : null);

    console.log('🎉 Remote stream received. Raw MediaStream:', raw);

    if (!raw) {
      console.warn('[VideoCall] No raw MediaStream found on remote stream object');
      return;
    }

    const videoTracks = raw.getVideoTracks();
    const audioTracks = raw.getAudioTracks();
    console.log(`📹 Remote video tracks: ${videoTracks.length}, 🎤 audio tracks: ${audioTracks.length}`);

    if (videoTracks.length > 0 && remoteVideoRef.current) {
      // Attach full stream to video element (has both audio+video)
      remoteVideoRef.current.srcObject = raw;
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.volume = 1;
      remoteVideoRef.current.play().catch(e => console.warn('[RemoteVideo play]', e));
      if (isMountedRef.current) setRemoteVideoReady(true);
    }

    if (audioTracks.length > 0 && remoteAudioRef.current) {
      // Backup: also attach to dedicated audio element
      const audioOnly = new MediaStream(audioTracks);
      remoteAudioRef.current.srcObject = audioOnly;
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1;
      remoteAudioRef.current.play().catch(e => console.warn('[RemoteAudio play]', e));
    }

    // Also let EnableX SDK inject its own player (fallback)
    try { enxStream.play('enx-remote-fallback'); } catch (_) {}
  }, []);

  // ─── MAIN: Request camera → Load SDK → Join Room ─────────
  useEffect(() => {
    const isMock = !token || token.startsWith('mock_');

    // ── Step 1: Request camera/mic permissions first ──────
    const requestMedia = async () => {
      if (isMock) {
        enterSimulation('No real token provided.');
        return;
      }

      let localStream = null;

      if (callType === 'video') {
        try {
          // Try HD first, fallback to any camera
          localStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          }).catch(() =>
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          );
        } catch (err) {
          console.error('[Camera] getUserMedia failed:', err.name, err.message);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionError('camera_denied');
          } else if (err.name === 'NotFoundError') {
            setPermissionError('no_camera');
          }
          // Try audio-only fallback
          try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            console.warn('[Camera] Falling back to audio-only.');
            if (isMountedRef.current) setVideoActive(false);
          } catch (audioErr) {
            console.error('[Audio] getUserMedia also failed:', audioErr);
            enterSimulation('Camera and microphone access denied.');
            return;
          }
        }
      } else {
        // Audio-only call
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          });
        } catch (err) {
          console.error('[Mic] getUserMedia failed:', err.name, err.message);
          enterSimulation('Microphone access denied.');
          return;
        }
      }

      // ── Show local camera in PiP immediately (before EnableX loads) ──
      nativeLocalStream.current = localStream;
      if (localVideoRef.current && localStream.getVideoTracks().length > 0) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch(() => {});
        console.log('📹 Local camera preview active');
      }

      // ── Step 2: Load EnableX SDK if needed ───────────────
      await loadEnxSdk();

      // ── Step 3: Join EnableX room ─────────────────────────
      joinEnxRoom();
    };

    const enterSimulation = (reason) => {
      console.warn('⚡ Simulation Mode:', reason);
      if (!isMountedRef.current) return;
      setIsSimulation(true);
      setCallStatus('connected');
      setChatMessages([
        { id: 'sys', sender: 'system', text: `Demo mode: ${reason}`, time: formatTime(0) },
        { id: 'welcome', sender: 'remote', senderName: remoteUserName, text: "Hey! Glad we connected 😊", time: formatTime(0) }
      ]);
    };

    const loadEnxSdk = () => new Promise((resolve) => {
      if (typeof window.EnxRtc !== 'undefined') { resolve(); return; }

      // Inject script if not present
      let script = document.querySelector(`script[src="${ENABLEX_SDK_URL}"]`);
      if (!script) {
        script = document.createElement('script');
        script.src = ENABLEX_SDK_URL;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
        console.log('[EnableX] SDK injected dynamically');
      }

      let attempts = 0;
      const check = setInterval(() => {
        attempts++;
        if (typeof window.EnxRtc !== 'undefined') {
          clearInterval(check);
          console.log('[EnableX] SDK ready ✓');
          resolve();
        } else if (attempts > 60) { // 15s max
          clearInterval(check);
          console.error('[EnableX] SDK failed to load after 15s');
          if (isMountedRef.current) enterSimulation('EnableX SDK unavailable.');
          resolve(); // resolve anyway to not block
        }
      }, 250);
    });

    const joinEnxRoom = () => {
      if (!isMountedRef.current || typeof window.EnxRtc === 'undefined') return;

      console.log('[EnableX] Joining room:', roomId, '| callType:', callType);
      if (isMountedRef.current) setCallStatus('connecting');

      const publishOptions = {
        audio: true,
        video: callType === 'video',
        data: true
      };

      try {
        const localEnxStream = window.EnxRtc.joinRoom(token, publishOptions, (success, error) => {
          if (!isMountedRef.current) return;

          if (error) {
            const errStr = JSON.stringify(error).toLowerCase();
            console.error('[EnableX] joinRoom error:', errStr);

            // If it's just a track-not-found warning (non-fatal), continue
            if (errStr.includes('not finding sender') || errStr.includes('track')) {
              console.warn('[EnableX] Track warning (non-fatal) — proceeding');
              // Continue — the room join likely still succeeded via the success callback later
              return;
            }

            const isMediaErr = errStr.includes('notallowed') || errStr.includes('notfound') || errStr.includes('permission');
            if (isMediaErr) {
              enterSimulation('Camera/mic permission denied.');
              return;
            }
            toast.error('Call connection failed. Please try again.');
            handleDisconnect();
            return;
          }

          // SUCCESS
          console.log('[EnableX] ✅ Joined room successfully');
          const room = success.room;
          roomRef.current = room;
          enxLocalStream.current = localEnxStream;

          if (isMountedRef.current) setCallStatus('connected');

          // Unmute local mic & video
          try {
            localEnxStream.unmuteAudio();
            console.log('🎙️ Mic unmuted');
          } catch (_) {}

          if (callType === 'video') {
            try {
              localEnxStream.unmuteVideo();
              console.log('📹 Video unmuted');
            } catch (_) {}
          }

          // Subscribe to any existing remote streams
          if (success.streams && success.streams.length > 0) {
            success.streams.forEach(s => {
              console.log('📡 Subscribing to existing stream:', s.getID?.());
              room.subscribe(s);
            });
          }

          // Stream events
          room.addEventListener('stream-added', (evt) => {
            console.log('📡 stream-added:', evt.stream.getID?.());
            room.subscribe(evt.stream);
          });

          room.addEventListener('stream-subscribed', (evt) => {
            console.log('🎉 stream-subscribed:', evt.stream.getID?.());
            if (!isMountedRef.current) return;
            attachRemoteStream(evt.stream);
          });

          room.addEventListener('user-disconnected', () => {
            console.log('[EnableX] Remote user disconnected');
            if (isMountedRef.current) {
              toast('Other user left the call', { icon: '📞' });
              handleDisconnect();
            }
          });

          room.addEventListener('room-disconnected', () => {
            if (isMountedRef.current) handleDisconnect();
          });

          room.addEventListener('message-received', (evt) => {
            if (!isMountedRef.current) return;
            setChatMessages(prev => [...prev, {
              id: evt.messageId || `r_${Date.now()}`,
              sender: 'remote',
              senderName: remoteUserName,
              text: evt.message,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
          });
        });

        enxLocalStream.current = localEnxStream;
      } catch (err) {
        console.error('[EnableX] joinRoom threw:', err);
        enterSimulation('SDK error.');
      }
    };

    requestMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // ─── Toggle mic ───────────────────────────────────────────
  const toggleMic = () => {
    const next = !micActive;
    setMicActive(next);
    // Mute native track
    if (nativeLocalStream.current) {
      nativeLocalStream.current.getAudioTracks().forEach(t => { t.enabled = next; });
    }
    // Mute EnableX stream
    if (!isSimulation && enxLocalStream.current) {
      try {
        if (next) enxLocalStream.current.unmuteAudio();
        else enxLocalStream.current.muteAudio();
      } catch (_) {}
    }
  };

  // ─── Toggle video ─────────────────────────────────────────
  const toggleVideo = () => {
    const next = !videoActive;
    setVideoActive(next);
    // Enable/disable native track
    if (nativeLocalStream.current) {
      nativeLocalStream.current.getVideoTracks().forEach(t => { t.enabled = next; });
    }
    // Enable/disable EnableX stream
    if (!isSimulation && enxLocalStream.current) {
      try {
        if (next) {
          enxLocalStream.current.unmuteVideo();
        } else {
          enxLocalStream.current.muteVideo();
        }
      } catch (_) {}
    }
  };

  // ─── In-call chat send ────────────────────────────────────
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { id: `me_${Date.now()}`, sender: 'me', senderName: currentUser?.name || 'Me', text, time }]);
    setChatInput('');

    if (isSimulation) {
      const replies = ["That's great! 😄", "Yes, I agree!", "Tell me more!", "Haha 😂", "Let's meet soon!", "Sorry, say that again?"];
      setTimeout(() => {
        if (isMountedRef.current) {
          setChatMessages(prev => [...prev, { id: `r_${Date.now()}`, sender: 'remote', senderName: remoteUserName, text: replies[Math.floor(Math.random() * replies.length)], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        }
      }, 1400);
      return;
    }
    if (roomRef.current) {
      roomRef.current.sendMessage(text, true, [], () => {});
    }
  };

  // ─── Mute remote sound ────────────────────────────────────
  const toggleRemoteSound = () => {
    const next = !isMutedSound;
    setIsMutedSound(next);
    if (remoteVideoRef.current) remoteVideoRef.current.muted = next;
    if (remoteAudioRef.current) remoteAudioRef.current.muted = next;
  };

  // ──────────────────────────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[1000] bg-[#0A0A0A] text-white overflow-hidden flex flex-col select-none"
      onClick={unlockAudio}
      onTouchStart={unlockAudio}
    >
      {/* CSS: ensure video elements fill their containers */}
      <style>{`
        .enx-local video, .enx-local canvas { width:100%!important; height:100%!important; object-fit:cover!important; display:block!important; }
        .enx-remote video, .enx-remote canvas { width:100%!important; height:100%!important; object-fit:cover!important; display:block!important; }
        #enx-remote-fallback, #enx-remote-fallback video { width:100%!important; height:100%!important; object-fit:cover!important; display:block!important; }
      `}</style>

      {/* Backup audio for remote voice */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#D51659]/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#B44DDC]/10 blur-[120px]" />
      </div>

      {/* ═══════════════════════════════════════════════════
          REQUESTING PERMISSION SCREEN
         ═══════════════════════════════════════════════════ */}
      {callStatus === 'requesting' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
          <div className="w-20 h-20 rounded-full bg-[#D51659]/15 border border-[#D51659]/30 flex items-center justify-center mb-2">
            {callType === 'video' ? <VideoIcon className="w-8 h-8 text-[#D51659]" /> : <Mic className="w-8 h-8 text-[#D51659]" />}
          </div>
          <h3 className="text-xl font-bold text-center">Allow {callType === 'video' ? 'Camera & Microphone' : 'Microphone'} Access</h3>
          <p className="text-sm text-slate-400 text-center max-w-xs">
            {permissionError === 'camera_denied'
              ? 'Camera access was denied. Please allow it in your browser settings and retry.'
              : permissionError === 'no_camera'
              ? 'No camera found on this device.'
              : `Your browser will ask for ${callType === 'video' ? 'camera and microphone' : 'microphone'} permission. Please click Allow.`}
          </p>
          <div className="flex items-center gap-2 text-slate-500 text-sm animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" /> Waiting for permission...
          </div>
          {permissionError && (
            <button
              onClick={handleDisconnect}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#D51659] text-white font-semibold text-sm"
            >
              Go Back
            </button>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          CONNECTING SCREEN
         ═══════════════════════════════════════════════════ */}
      {callStatus === 'connecting' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-[#D51659] rounded-full animate-spin" />
          <h3 className="text-lg font-semibold">Connecting to call...</h3>
          <p className="text-xs text-slate-400">Joining EnableX secure server</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          ACTIVE CALL SCREEN
         ═══════════════════════════════════════════════════ */}
      {(callStatus === 'connected') && (
        <div className="flex-1 relative flex overflow-hidden">

          {/* ────── MAIN REMOTE VIEW ────── */}
          {callType === 'video' ? (
            <div className="flex-1 relative bg-[#111] overflow-hidden">
              {/* Native <video> element for remote camera — controlled directly via ref */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ display: remoteVideoReady && !isSimulation ? 'block' : 'none' }}
              />

              {/* EnableX fallback injection container (hidden) */}
              <div id="enx-remote-fallback" className="absolute inset-0 pointer-events-none" style={{ opacity: 0, zIndex: -1 }} />

              {/* Waiting for remote video — shown until stream arrives */}
              {(!remoteVideoReady || isSimulation) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#150A1A] to-[#0A0A0A]">
                  <div className="relative mb-6">
                    <span className="absolute inset-[-20px] rounded-full border border-[#D51659]/20 animate-ping" style={{ animationDuration: '3s' }} />
                    <img
                      src={remoteUserPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteUserName)}&background=D51659&color=fff&size=200`}
                      alt={remoteUserName}
                      className="w-28 h-28 rounded-full object-cover border-4 border-white/10 shadow-2xl"
                    />
                  </div>
                  <h2 className="text-xl font-bold">{remoteUserName}</h2>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {isSimulation ? 'Demo Mode' : 'Connecting video...'}
                  </div>
                  {/* Soundwave */}
                  <div className="flex items-end gap-1.5 mt-8 h-8">
                    {[30, 70, 45, 90, 55, 80, 35, 65].map((h, i) => (
                      <span key={i} className="w-1.5 rounded-full bg-gradient-to-t from-[#D51659] to-[#B44DDC] animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 120}ms`, animationDuration: '1.1s' }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ────── AUDIO CALL UI ────── */
            <div className="flex-1 relative flex flex-col items-center justify-center bg-gradient-to-b from-[#150A1A] via-[#0A0A0A] to-[#1A0A15]">
              {/* Hidden audio stream container */}
              <div id="enx-remote-fallback" className="absolute" style={{ width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
              <video ref={remoteVideoRef} autoPlay playsInline style={{ display: 'none' }} />

              {/* Avatar glow */}
              <div className="relative mb-8 flex items-center justify-center">
                <span className="absolute w-56 h-56 rounded-full bg-[#D51659]/15 blur-3xl animate-pulse" />
                <span className="absolute w-44 h-44 rounded-full border border-[#D51659]/30 animate-ping" style={{ animationDuration: '3s' }} />
                <img
                  src={remoteUserPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteUserName)}&background=D51659&color=fff&size=200`}
                  alt={remoteUserName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/10 shadow-[0_0_60px_rgba(213,22,89,0.3)] relative z-10"
                />
              </div>
              <h2 className="text-2xl font-black tracking-wide">{remoteUserName}</h2>
              <p className="text-xs font-bold text-[#D51659] uppercase tracking-widest mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Voice Call · {formatTime(duration)}
              </p>
              {/* Equalizer bars */}
              <div className="flex items-end gap-1.5 mt-8 h-10">
                {[40, 75, 30, 90, 50, 85, 45, 65, 100, 55, 80, 35, 70, 45].map((h, i) => (
                  <span key={i} className="w-1.5 rounded-full bg-gradient-to-t from-[#D51659] to-[#B44DDC] animate-pulse"
                    style={{ height: micActive ? `${h}%` : '18%', animationDelay: `${(i * 110) % 550}ms`, animationDuration: '1.2s' }} />
                ))}
              </div>
            </div>
          )}

          {/* ────── LOCAL CAMERA PiP (top-right) ────── */}
          {callType === 'video' && (
            <div className="absolute top-5 right-5 w-28 h-40 md:w-36 md:h-52 rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl bg-slate-900 z-20">
              {/* Native <video> ref — shows local camera immediately after getUserMedia */}
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ display: videoActive ? 'block' : 'none', transform: 'scaleX(-1)' /* mirror */ }}
              />
              {!videoActive && (
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-2">
                  <img src={currentUser?.photos?.[0]?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name||'Me')}&background=333&color=fff&size=100`}
                    alt="Me" className="w-10 h-10 rounded-full object-cover grayscale" />
                  <VideoOff className="w-3.5 h-3.5 text-slate-500" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 px-2 py-0.5 rounded-full text-slate-300">
                You
              </div>
            </div>
          )}

          {/* ────── SIMULATION BADGE ────── */}
          {isSimulation && (
            <div className="absolute top-4 left-4 z-30 bg-purple-500/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-purple-300 border border-purple-500/30">
              Demo Mode
            </div>
          )}

          {/* ────── TOP OVERLAY ────── */}
          <div className="absolute top-0 left-0 right-0 px-5 pt-5 pb-8 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <p className="font-extrabold text-sm text-white drop-shadow">{remoteUserName}</p>
              <p className="text-[10px] font-bold text-[#D51659] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live Call · {formatTime(duration)}
              </p>
            </div>
            <button
              onClick={toggleRemoteSound}
              className="pointer-events-auto p-2.5 rounded-xl bg-black/40 border border-white/10 hover:bg-black/60 transition-colors"
            >
              {isMutedSound ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* ────── BOTTOM CONTROL HUD ────── */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-6 py-3.5 bg-black/55 border border-white/10 backdrop-blur-xl rounded-3xl flex items-center gap-5 shadow-2xl">
            {/* Mic */}
            <button onClick={toggleMic} className={`p-3 rounded-2xl transition-all ${micActive ? 'bg-white/10 hover:bg-white/20' : 'bg-[#D51659]/30 text-[#D51659] border border-[#D51659]/50'}`}>
              {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            {/* Camera (video calls only) */}
            {callType === 'video' && (
              <button onClick={toggleVideo} className={`p-3 rounded-2xl transition-all ${videoActive ? 'bg-white/10 hover:bg-white/20' : 'bg-[#D51659]/30 text-[#D51659] border border-[#D51659]/50'}`}>
                {videoActive ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            )}
            {/* Chat */}
            <button onClick={() => setShowChat(!showChat)} className={`p-3 rounded-2xl relative transition-all ${showChat ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' : 'bg-white/10 hover:bg-white/20'}`}>
              <MessageSquare className="w-5 h-5" />
              {!showChat && chatMessages.filter(m => m.sender === 'remote').length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#D51659] rounded-full border border-black animate-pulse" />
              )}
            </button>
            <span className="w-px h-6 bg-white/15" />
            {/* End call */}
            <button onClick={handleDisconnect} className="p-3.5 rounded-full bg-[#D51659] hover:bg-[#D51659]/90 text-white active:scale-95 transition-all shadow-lg shadow-[#D51659]/30">
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>

          {/* ────── IN-CALL TEXT CHAT DRAWER ────── */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-[#0F0F16]/95 border-l border-white/10 backdrop-blur-xl flex flex-col z-30 shadow-[-12px_0_40px_rgba(0,0,0,0.5)]"
              >
                <div className="h-16 px-4 border-b border-white/5 flex items-center justify-between bg-black/30">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#D51659]" />
                    <span className="font-extrabold text-sm uppercase tracking-wider">Session Chat</span>
                  </div>
                  <button onClick={() => setShowChat(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                  {chatMessages.map(msg => {
                    if (msg.sender === 'system') return (
                      <div key={msg.id} className="text-center text-[10px] text-slate-500 uppercase tracking-widest">{msg.text}</div>
                    );
                    const isMe = msg.sender === 'me';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] text-slate-500 font-semibold mb-0.5 px-1">{msg.senderName}</span>
                        <div className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words ${isMe ? 'bg-[#D51659] text-white rounded-tr-none' : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'}`}>
                          {msg.text}
                        </div>
                        <span className="text-[8px] text-slate-600 mt-0.5 px-1">{msg.time}</span>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-black/40 flex gap-2">
                  <input
                    value={chatInput} onChange={e => setChatInput(e.target.value)}
                    placeholder="Message..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#D51659] transition-all"
                  />
                  <button type="submit" className="p-2 rounded-xl bg-[#D51659] text-white active:scale-95 transition-all">
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
