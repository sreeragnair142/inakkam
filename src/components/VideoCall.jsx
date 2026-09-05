import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import api from "../utils/api";
import toast from "react-hot-toast";
import { fetchMe } from "../redux/slices/authSlice";
import { getSocket } from "../utils/socket";
import ScreenShield from "./ScreenShield";

const VideoCall = ({
  roomId,
  remoteUserName,
  remoteUserPhoto,
  callType = "video",
  onEndCall,
  currentUser,
  targetUserId,
  isCaller = true,
}) => {
  const dispatch = useDispatch();
  const [callStatus, setCallStatus] = useState("connecting"); // connecting | connected | disconnected
  const [duration, setDuration] = useState(0);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(callType === "video");
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isMutedSound, setIsMutedSound] = useState(false);
  const [remoteStreamActive, setRemoteStreamActive] = useState(false);
  const [noRemoteVideoCountdown, setNoRemoteVideoCountdown] = useState(null);

  // Normalize targetUserId
  const targetUid = String(
    targetUserId?._id || targetUserId?.id || targetUserId || "",
  );

  // EnableX Refs
  const roomRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const playedLocalContainerRef = useRef("");
  const playedRemoteContainerRef = useRef("");
  const isDisconnectedRef = useRef(false);
  const isMountedRef = useRef(true);

  const reconnectAttemptsRef = useRef(0);
  const intentionalDisconnectRef = useRef(false);
  const tokenRef = useRef(null);

  // Used to force a complete EnableX re-initialization
  // after an invalid/expired token.
  const [reconnectKey, setReconnectKey] = useState(0);

  const reconnectingRef = useRef(false);
  const remoteDisconnectTimerRef = useRef(null);
  const currentUserNameRef = useRef(currentUser?.name || "Inakkam User");
  // MutationObserver to catch EnableX-injected <video>/<audio> elements
  // and force playsinline + play() — critical for iOS Safari and mobile PWA.
  const mediaObserverRef = useRef(null);

  useEffect(() => {
    currentUserNameRef.current = currentUser?.name || "Inakkam User";
  }, [currentUser?.name]);

  // ─── Format call duration ───────────────────────────────
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ─── Unmount tracker ────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ─── Call timer ─────────────────────────────────────────
  useEffect(() => {
    if (callStatus !== "connected") return;
    const timer = setInterval(() => {
      if (isMountedRef.current) setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callStatus]);

  // ─── Core Disconnect / Hang Up Handler ───────────────────
  // (Declared above the coin-deduction effect below, since that
  // effect now calls handleDisconnect() and needs it defined
  // first — referencing a later `const` in the same component
  // scope throws "Cannot access before initialization".)
  const onEndCallRef = useRef(onEndCall);
  useEffect(() => {
    onEndCallRef.current = onEndCall;
  }, [onEndCall]);

  const finishCall = useCallback(
    ({ notifyRemote = true } = {}) => {
      if (isDisconnectedRef.current) return;

      isDisconnectedRef.current = true;
      intentionalDisconnectRef.current = true;

      if (remoteDisconnectTimerRef.current) {
        clearTimeout(remoteDisconnectTimerRef.current);
        remoteDisconnectTimerRef.current = null;
      }

      const room = roomRef.current;
      roomRef.current = null;
      if (room) {
        try {
          room.disconnect();
        } catch (e) {
          console.warn("Error disconnecting EnableX room:", e);
        }
      }

      const localStream = localStreamRef.current;
      localStreamRef.current = null;
      remoteStreamRef.current = null;

      if (localStream) {
        try {
          localStream.close();
        } catch (e) {
          console.warn("Error closing local stream:", e);
        }
      }

      if (notifyRemote) {
        const socket = getSocket();
        if (socket && targetUid) {
          socket.emit("end_call", {
            targetUserId: targetUid,
            conversationId: roomId,
          });
        }
      }

      if (isMountedRef.current) {
        setRemoteStreamActive(false);
        setCallStatus("disconnected");
      }

      if (onEndCallRef.current) {
        setTimeout(() => onEndCallRef.current(), 50);
      }
    },
    [roomId, targetUid],
  );

  const handleDisconnect = useCallback(() => {
    finishCall({ notifyRemote: true });
  }, [finishCall]);

  // ─── 10-Second No-Opponent-Video / Face Auto-Disconnect (Video Calls Only) ─
  const noRemoteVideoDurationRef = useRef(0);
  useEffect(() => {
    // Only enforce on connected video calls
    if (callStatus !== "connected" || callType !== "video") {
      noRemoteVideoDurationRef.current = 0;
      setNoRemoteVideoCountdown(null);
      return;
    }

    const checkRemoteVideoInterval = setInterval(() => {
      if (!isMountedRef.current || isDisconnectedRef.current) return;

      const container = document.getElementById("remote_video_player");
      const videoEl = container?.querySelector("video");

      // Check if remote video element is actively rendering live video frames
      const isRendering = Boolean(
        remoteStreamActive &&
          videoEl &&
          videoEl.readyState >= 2 &&
          !videoEl.paused &&
          !videoEl.ended &&
          videoEl.videoWidth > 0 &&
          videoEl.videoHeight > 0,
      );

      if (!isRendering) {
        noRemoteVideoDurationRef.current += 1;
        const remaining = Math.max(0, 10 - noRemoteVideoDurationRef.current);
        setNoRemoteVideoCountdown(remaining);

        if (noRemoteVideoDurationRef.current >= 10) {
          console.warn(
            "[VideoCall] ❌ Opponent video/face not detected for 10s. Disconnecting call.",
          );
          toast.error(
            "Call ended: The other person did not show their camera/face within 10 seconds.",
            {
              duration: 6000,
              icon: "📹",
            },
          );
          handleDisconnect();
        }
      } else {
        if (noRemoteVideoDurationRef.current > 0) {
          noRemoteVideoDurationRef.current = 0;
          setNoRemoteVideoCountdown(null);
        }
      }
    }, 1000);

    return () => {
      clearInterval(checkRemoteVideoInterval);
      noRemoteVideoDurationRef.current = 0;
      setNoRemoteVideoCountdown(null);
    };
  }, [callStatus, callType, remoteStreamActive, handleDisconnect]);

  // ─── Periodic Coin Deduction (every 20s while connected - CALLER ONLY) ─
  useEffect(() => {
    if (callStatus !== "connected" || !isCaller) return;
    const coinDeductInterval = setInterval(async () => {
      try {
        const res = await api.post("/coins/deduct-call", {
          targetUserId: targetUid,
          callType,
          seconds: 20,
        });
        if (!res.data.success && res.data.insufficientCoins) {
          toast.error("Insufficient coin balance to continue call");
          if (isMountedRef.current) handleDisconnect();
        } else {
          dispatch(fetchMe());
        }
      } catch (err) {
        // Ignore API errors silently
      }
    }, 20000);
    return () => clearInterval(coinDeductInterval);
  }, [callStatus, callType, targetUid, dispatch, handleDisconnect, isCaller]);

  // ─── MutationObserver: auto-fix EnableX-injected media elements ────────
  // EnableX injects <video>/<audio> elements asynchronously into its
  // containers. On iOS/Safari and Android Chrome, these elements need
  // playsinline + an explicit play() call — otherwise they stay black/silent.
  // We watch all call containers and fix any injected element immediately.
  const startMediaObserver = useCallback(() => {
    // Disconnect any existing observer first
    if (mediaObserverRef.current) {
      mediaObserverRef.current.disconnect();
      mediaObserverRef.current = null;
    }

    const applyToEl = (el, muted = false) => {
      if (!el) return;
      el.setAttribute("playsinline", "true");
      el.setAttribute("webkit-playsinline", "true");
      el.setAttribute("disablePictureInPicture", "true");
      el.setAttribute("controlsList", "nodownload noplaybackrate nofullscreen");
      el.disablePictureInPicture = true;
      el.muted = muted;
      el.autoplay = true;
      el.playsInline = true;
      el.play().catch(() => {});
    };

    const fixContainer = (container, muted = false) => {
      if (!container) return;
      container
        .querySelectorAll("video, audio")
        .forEach((el) => applyToEl(el, muted));
    };

    const containerIds = [
      { id: "remote_video_player", muted: false },
      { id: "remote_audio_player", muted: false },
      { id: "local_pip_video", muted: true },
      { id: "connecting_local_video", muted: true },
    ];

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          // Find which container this node is in
          const entry = containerIds.find(({ id }) => {
            const c = document.getElementById(id);
            return c && (c === node || c.contains(node));
          });
          if (!entry) return;
          if (node.tagName === "VIDEO" || node.tagName === "AUDIO") {
            applyToEl(node, entry.muted);
          } else {
            node
              .querySelectorAll("video, audio")
              .forEach((el) => applyToEl(el, entry.muted));
          }
        });
      });
    });

    // Observe all containers that exist right now, and fix any existing elements
    containerIds.forEach(({ id, muted }) => {
      const container = document.getElementById(id);
      if (container) {
        fixContainer(container, muted);
        observer.observe(container, { childList: true, subtree: true });
      }
    });

    mediaObserverRef.current = observer;
    console.log("[EnableX] 🔭 MutationObserver started for media containers");
  }, []);

  const stopMediaObserver = useCallback(() => {
    if (mediaObserverRef.current) {
      mediaObserverRef.current.disconnect();
      mediaObserverRef.current = null;
      console.log("[EnableX] 🔭 MutationObserver stopped");
    }
  }, []);

  // Start observer when call begins; stop on unmount
  useEffect(() => {
    if (callStatus === "connecting" || callStatus === "connected") {
      // Small delay to ensure containers are in the DOM
      const t = setTimeout(startMediaObserver, 100);
      return () => clearTimeout(t);
    }
  }, [callStatus, startMediaObserver]);

  useEffect(() => {
    return () => stopMediaObserver();
  }, [stopMediaObserver]);

  // ─── Reliable local/remote playback helpers ─────────────────
  const playLocalPreview = useCallback(() => {
    if (callType !== "video") return;
    const stream = localStreamRef.current;
    if (!stream) return;

    const container =
      document.getElementById("local_pip_video") ||
      document.getElementById("connecting_local_video");

    if (!container) return;

    try {
      const streamId =
        (typeof stream.getID === "function" ? stream.getID() : "local") ||
        "local";
      const key = `${streamId}_${container.id}`;

      if (playedLocalContainerRef.current !== key) {
        playedLocalContainerRef.current = key;
        if (typeof stream.play === "function") {
          stream.play(container.id, {
            player: {
              width: "100%",
              height: "100%",
              autoplay: true,
              playsinline: true,
              muted: true,
            },
            toolbar: {
              displayMode: false,
              branding: { display: false },
            },
          });
          console.log("[EnableX] Local video attached to", container.id);
        }
      }

      // Force video element to play and track to be enabled after container swap
      setTimeout(() => {
        const vid = container.querySelector("video");
        if (vid) {
          vid.muted = true;
          vid.play().catch(() => {});
        }
        if (videoActive && typeof stream.unmuteVideo === "function") {
          try { stream.unmuteVideo(); } catch (e) {}
        } else if (!videoActive && typeof stream.muteVideo === "function") {
          try { stream.muteVideo(); } catch (e) {}
        }
      }, 500);
    } catch (error) {
      console.error("[EnableX] Local video playback failed:", error);
    }
  }, [callType, videoActive]);

  const isParticipantVideoStream = useCallback((stream) => {
    if (!stream) return false;

    const id = String(typeof stream.getID === "function" ? stream.getID() : "");

    const localId = String(
      localStreamRef.current &&
        typeof localStreamRef.current.getID === "function"
        ? localStreamRef.current.getID()
        : "",
    );

    // Never treat our own local stream as remote
    if (localId && id === localId) {
      return false;
    }

    // Never display screen-share as participant camera if screen-share is active
    if (typeof stream.ifScreen === "function" && stream.ifScreen()) {
      return false;
    }

    return true;
  }, []);

  const playRemoteAudio = useCallback((streamArg = null) => {
    const stream = streamArg || remoteStreamRef.current;
    if (!stream) {
      console.warn("[EnableX] ❌ No remote audio stream available");
      return;
    }

    const localId = String(
      localStreamRef.current && typeof localStreamRef.current.getID === "function"
        ? localStreamRef.current.getID()
        : ""
    );
    const streamId = String(
      typeof stream.getID === "function" ? stream.getID() : "remote_audio"
    );
    if (localId && streamId === localId) return;

    const containerId = "remote_audio_player";
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn("[EnableX] ❌ remote_audio_player container not found in DOM");
      return;
    }

    console.log("[EnableX] 🔊 Playing remote audio stream:", streamId);

    try {
      // 1. EnableX SDK stream.play
      if (typeof stream.play === "function") {
        stream.play(containerId, {
          player: {
            autoplay: true,
            playsinline: true,
            muted: false,
          },
          toolbar: {
            displayMode: false,
            branding: { display: false },
          },
        });
      }

      // 2. Direct HTML5 Audio fallback for native WebRTC MediaStream
      const nativeStream = stream.stream || (typeof stream.getMediaStream === 'function' ? stream.getMediaStream() : null);
      if (nativeStream && (nativeStream instanceof MediaStream || nativeStream.getAudioTracks)) {
        let audioEl = container.querySelector("audio.enx-audio-native-track");
        if (!audioEl) {
          audioEl = document.createElement("audio");
          audioEl.className = "enx-audio-native-track";
          audioEl.autoplay = true;
          audioEl.playsInline = true;
          audioEl.setAttribute("playsinline", "true");
          audioEl.setAttribute("webkit-playsinline", "true");
          container.appendChild(audioEl);
        }
        if (audioEl.srcObject !== nativeStream) {
          audioEl.srcObject = nativeStream;
        }
        audioEl.muted = false;
        audioEl.volume = 1.0;
        audioEl.play().catch((err) => {
          console.log("[EnableX] Audio play waiting for user interaction:", err?.message);
        });
      }

      // 3. Ensure any audio elements created inside container are unmuted & playing
      setTimeout(() => {
        container.querySelectorAll("audio, video").forEach((el) => {
          el.muted = false;
          el.volume = 1.0;
          el.setAttribute("playsinline", "true");
          el.play().catch(() => {});
        });
      }, 50);
    } catch (error) {
      console.error("[EnableX] ❌ Remote audio play failed:", error);
    }
  }, []);

  const playRemotePreview = useCallback((streamArg = null) => {
    const stream = streamArg || remoteStreamRef.current;

    if (!stream) {
      console.warn("[EnableX] ❌ No remote stream available");
      return;
    }

    if (callType === "audio") {
      playRemoteAudio(stream);
      return;
    }

    if (!isParticipantVideoStream(stream)) {
      console.warn(
        "[EnableX] ❌ Refusing to play non-camera stream:",
        stream.getID?.()
      );
      return;
    }

    const containerId = "remote_video_player";
    const container = document.getElementById(containerId);

    if (!container) {
      console.warn("[EnableX] ❌ remote_video_player not found in DOM");
      return;
    }

    const streamId =
      typeof stream.getID === "function"
        ? String(stream.getID())
        : "remote";

    const playKey = `${streamId}_${containerId}`;

    // ── Guard: skip only if the video is ACTUALLY rendering with data ─────
    // (readyState >= 2 = HAVE_CURRENT_DATA, meaning frames are flowing)
    const existingVideo = container.querySelector("video");
    const isActuallyRendering =
      existingVideo &&
      existingVideo.readyState >= 2 &&
      playedRemoteContainerRef.current === playKey;

    if (isActuallyRendering) {
      console.log("[EnableX] ⏭️ Video already rendering:", streamId);
      return;
    }

    // ── If switching to a different stream, clear the container ──────────
    if (
      playedRemoteContainerRef.current &&
      !playedRemoteContainerRef.current.startsWith(`${streamId}_`)
    ) {
      container.innerHTML = "";
    }

    console.log("[EnableX] 🎬 PLAYING PARTICIPANT VIDEO:", streamId);

    try {
      playedRemoteContainerRef.current = playKey;

      if (typeof stream.play === "function") {
        stream.play(containerId, {
          player: {
            width: "100%",
            height: "100%",
            minWidth: "100%",
            minHeight: "100%",
            autoplay: true,
            playsinline: true,
          },
          toolbar: {
            displayMode: false,
            branding: { display: false },
          },
        });

        console.log("[EnableX] ✅ Participant video attached:", streamId);
      }
    } catch (error) {
      console.error("[EnableX] ❌ Remote video play failed:", error);
      playedRemoteContainerRef.current = "";
    }
  }, [callType, isParticipantVideoStream, playRemoteAudio]);

  useEffect(() => {
    if (callStatus === "connecting" || callStatus === "connected") {
      const id = setTimeout(playLocalPreview, 50);
      return () => clearTimeout(id);
    }
  }, [callStatus, playLocalPreview]);

  useEffect(() => {
    if (remoteStreamActive || callStatus === "connected") {
      const t = setTimeout(() => {
        if (callType === "audio") {
          playRemoteAudio();
        } else {
          playRemotePreview();
        }
      }, 50);
      return () => clearTimeout(t);
    }
  }, [remoteStreamActive, callStatus, callType, playRemoteAudio, playRemotePreview]);

  // ─── EnableX SDK Initialization ─────────────────────────
  useEffect(() => {
    let activeLocalStream = null;
    let activeRoom = null;
    let cancelled = false;

    // Synchronize media access and room connection for reliable publishing
    let mediaReady = false;
    let roomConnected = false;
    let hasPublished = false;

    const tryPublish = () => {
      if (
        hasPublished ||
        !mediaReady ||
        !roomConnected ||
        !activeRoom ||
        !activeLocalStream
      ) {
        return;
      }
      hasPublished = true;
      console.log("[EnableX] 🚀 Publishing local stream now...");
      try {
        activeRoom.publish(activeLocalStream, {}, (publishResponse) => {
          console.log("[EnableX] Publish response:", publishResponse);

          if (
            publishResponse &&
            publishResponse.result !== undefined &&
            publishResponse.result !== 0
          ) {
            console.error("[EnableX] ❌ Publish failed:", publishResponse);
            hasPublished = false;
            return;
          }

          setTimeout(() => playLocalPreview(), 50);
        });
      } catch (publishError) {
        console.error("[EnableX] ❌ Publish exception:", publishError);
        hasPublished = false;
      }
    };

    // Every initialization/re-initialization starts as a live call.
    isDisconnectedRef.current = false;
    intentionalDisconnectRef.current = false;
    const startCall = async () => {
      try {
        const EnxRtc = window.EnxRtc;

        // --------------------------------------------------
        // 1. Check SDK
        // --------------------------------------------------
        if (!EnxRtc) {
          console.error("[EnableX] EnxRtc SDK not loaded");
          toast.error("Video service initialization failed.");
          handleDisconnect();
          return;
        }

        console.log("[EnableX] SDK loaded successfully");

        // Set SDK logging to warnings/errors only to prevent console spam
        try {
          if (EnxRtc.Logger?.setLogLevel) {
            EnxRtc.Logger.setLogLevel(3);
          }
        } catch (e) {
          console.warn("[EnableX] Could not set SDK log level:", e);
        }

        // --------------------------------------------------
        // 2. Get token
        // --------------------------------------------------
        let token = null;

        if (roomId) {
          console.log("[EnableX] Requesting fresh token for room:", roomId);

          try {
            // Pass name + user_ref — required fields in the EnableX token API.
            // Without these the EnableX REST call returns an error and the
            // backend may silently return null/undefined as the token.
            const tokenRes = await api.post("/enablex/get-token", {
              roomId,
              role: isCaller ? "moderator" : "participant",
              name: currentUserNameRef.current || "Inakkam User",
              userRef: currentUser?._id || currentUser?.id || "unknown",
            });

            console.log("[EnableX] Fresh token response:", tokenRes.data);

            if (tokenRes.data?.success && tokenRes.data?.token) {
              token = tokenRes.data.token;
              tokenRef.current = token;
            } else {
              throw new Error(
                tokenRes.data?.message || "EnableX token was not returned",
              );
            }
          } catch (tokenError) {
            console.error(
              "[EnableX] Token request failed:",
              tokenError?.response?.data || tokenError,
            );

            const isRateLimited =
              tokenError?.response?.status === 429 ||
              tokenError?.response?.data?.rateLimited === true;

            if (isRateLimited) {
              const retryAfterSeconds =
                tokenError?.response?.data?.retryAfterSeconds;

              toast.error(
                retryAfterSeconds
                  ? `Video service is busy. Please try again in ${retryAfterSeconds}s.`
                  : "Video service is busy. Please try again in a moment.",
              );
            } else {
              toast.error(
                tokenError?.response?.data?.message ||
                  "Unable to create video session token.",
              );
            }

            handleDisconnect();
            return;
          }
        }
        if (cancelled || isDisconnectedRef.current) {
          return;
        }

        // --------------------------------------------------
        // 3. Stream configuration (Detect camera presence)
        // --------------------------------------------------
        let hasCamera = false;
        try {
          if (
            navigator.mediaDevices &&
            typeof navigator.mediaDevices.enumerateDevices === "function"
          ) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            hasCamera = devices.some((device) => device.kind === "videoinput");
            console.log(
              "[EnableX] Camera check result:",
              hasCamera,
              "Devices:",
              devices,
            );
          }
        } catch (deviceError) {
          console.warn("[EnableX] Device enumeration failed:", deviceError);
        }

        if (callType === "video" && !hasCamera) {
          toast("No camera found. Starting call with audio only.", {
            icon: "🎙️",
          });
        }

        const streamOptions =
          callType === "audio"
            ? {
                audio: true,
                video: false,
                data: true,
                audioMuted: false,
                videoMuted: true,
                attributes: { name: currentUserNameRef.current },
              }
            : {
                audio: true,
                video: hasCamera,
                data: true,
                audioMuted: false,
                videoMuted: !hasCamera,
                // Required by EnableX SDK — without this, EnxRtc.js:661 throws
                // "Cannot read properties of undefined (reading '3')"
                videoSize: [320, 180, 1280, 720],
                maxVideoLayers: 1,
                attributes: { name: currentUserNameRef.current },
              };

        console.log("[EnableX] Creating local stream:", streamOptions);

        // --------------------------------------------------
        // 4. Create EnableX local stream
        // --------------------------------------------------
        activeLocalStream = EnxRtc.EnxStream(streamOptions);

        if (!activeLocalStream) {
          throw new Error("EnableX EnxStream() did not return a stream");
        }

        localStreamRef.current = activeLocalStream;

        // Media permission granted
        activeLocalStream.addEventListener("media-access-allowed", (event) => {
          console.log("[EnableX] ✅ Camera/microphone access granted", event);

          if (cancelled || isDisconnectedRef.current) return;

          mediaReady = true;
          setTimeout(() => playLocalPreview(), 0);
          tryPublish();
        });

        // Media permission denied
        activeLocalStream.addEventListener("media-access-denied", (event) => {
          console.error(
            "[EnableX] ❌ Camera/microphone permission denied:",
            event,
          );

          toast.error("Please allow camera and microphone access.");
          handleDisconnect();
        });

        // --------------------------------------------------
        // Initialize stream
        // --------------------------------------------------
        activeLocalStream.init();

        console.log("[EnableX] Local stream initialized:", activeLocalStream);

        // --------------------------------------------------
        // 5. Create EnableX room.
        // NOTE: EnxRtc.EnxRoom() for Web SDK v3.x expects a
        // CONFIG OBJECT with a `token` property — NOT the raw
        // JWT string directly. Passing the raw string causes the
        // SDK's internal JSON.parse to throw
        // "Unexpected end of JSON input".
        console.log("[EnableX] Token to pass to EnxRoom:", token);
        activeRoom = EnxRtc.EnxRoom({ token });

        if (!activeRoom) {
          throw new Error("EnableX EnxRoom() did not return a room");
        }

        roomRef.current = activeRoom;

        console.log("[EnableX] Room object created");

        // --------------------------------------------------
        // 6. Remote stream handler
        // --------------------------------------------------
        // Track only the one remote stream we are currently playing.
        // In a 2-person call there should only ever be one remote stream.
        const subscribedStreamIds = new Set();

        const subscribeToRemoteStream = (stream) => {
          if (!stream || !activeRoom) return;

          const remoteId =
            typeof stream.getID === "function" ? String(stream.getID()) : null;
          const localId =
            activeLocalStream && typeof activeLocalStream.getID === "function"
              ? String(activeLocalStream.getID())
              : null;

          // Skip own stream
          if (localId && remoteId && localId === remoteId) return;

          // Skip already-subscribed streams
          if (remoteId && subscribedStreamIds.has(remoteId)) {
            console.log("[EnableX] Already subscribed to stream:", remoteId);
            return;
          }

          if (remoteId) subscribedStreamIds.add(remoteId);

          console.log("[EnableX] 📹 Subscribing to remote stream:", remoteId);

          try {
            const hasRemoteAudio =
              typeof stream.ifAudio === "function" ? stream.ifAudio() : true;

            const hasRemoteVideo =
              typeof stream.ifVideo === "function"
                ? stream.ifVideo()
                : callType === "video";

            const subscribeOptions = {
              audio: hasRemoteAudio,
              video: hasRemoteVideo,
              data: true,
            };

            console.log("[EnableX] 🎧 Remote stream capabilities:", {
              streamId: remoteId,
              callType,
              hasRemoteAudio,
              hasRemoteVideo,
              subscribeOptions,
            });

            activeRoom.subscribe(
              stream,
              subscribeOptions,
              (response) => {
                const failed =
                  response === false ||
                  (response &&
                    typeof response === "object" &&
                    response.result !== undefined &&
                    response.result !== 0);

                if (failed) {
                  console.error(
                    "[EnableX] ❌ Subscribe failed:",
                    response,
                    subscribeOptions,
                  );
                  if (remoteId) subscribedStreamIds.delete(remoteId);
                  return;
                }

                console.log(
                  "[EnableX] ✅ Remote stream subscription acknowledged:",
                  remoteId,
                  subscribeOptions,
                );
              },
            );
          } catch (error) {
            console.error("[EnableX] ❌ Remote subscribe exception:", error);
            if (remoteId) subscribedStreamIds.delete(remoteId);
          }
        };

        // --------------------------------------------------
        // 7. Room connected
        // --------------------------------------------------
        activeRoom.addEventListener("room-connected", (event) => {
          console.log("[EnableX] ✅ ROOM CONNECTED:", event);

          if (cancelled || isDisconnectedRef.current) return;

          roomConnected = true;
          if (isMountedRef.current) setCallStatus("connected");

          tryPublish();

          // Subscribe to all pre-existing remote streams in the room
          if (event?.streams && Array.isArray(event.streams)) {
            event.streams.forEach((stream) => {
              subscribeToRemoteStream(stream);
            });
          }

          if (activeRoom.remoteStreams) {
            if (activeRoom.remoteStreams instanceof Map) {
              activeRoom.remoteStreams.forEach((stream) => {
                subscribeToRemoteStream(stream);
              });
            } else if (typeof activeRoom.remoteStreams.forEach === "function") {
              activeRoom.remoteStreams.forEach((stream) => {
                subscribeToRemoteStream(stream);
              });
            }
          }
        });

        // --------------------------------------------------
        // 8. Remote user connected
        // --------------------------------------------------
        activeRoom.addEventListener("user-connected", (event) => {
          console.log("[EnableX] 👤 Remote user connected:", event);
          if (remoteDisconnectTimerRef.current) {
            clearTimeout(remoteDisconnectTimerRef.current);
            remoteDisconnectTimerRef.current = null;
          }
        });

        // --------------------------------------------------
        // 9. Remote stream added — triggered when participant publishes
        // --------------------------------------------------
        activeRoom.addEventListener("stream-added", (event) => {
          console.log("[EnableX] 📹 STREAM ADDED:", event);
          const stream = event?.stream || event;
          if (remoteDisconnectTimerRef.current) {
            clearTimeout(remoteDisconnectTimerRef.current);
            remoteDisconnectTimerRef.current = null;
          }
          subscribeToRemoteStream(stream);
        });

        // --------------------------------------------------
        // 10. Stream subscribed — media is negotiated & ready to render
        // --------------------------------------------------
        activeRoom.addEventListener("stream-subscribed", (event) => {
          console.log("[EnableX] ✅ STREAM SUBSCRIBED:", event);
          const remoteStream = event?.stream;

          if (!remoteStream) {
            console.warn("[EnableX] stream-subscribed: no stream in event");
            return;
          }

          const localId =
            activeLocalStream && typeof activeLocalStream.getID === "function"
              ? String(activeLocalStream.getID())
              : null;
          const remoteId =
            typeof remoteStream.getID === "function"
              ? String(remoteStream.getID())
              : null;

          if (localId && remoteId && localId === remoteId) {
            console.log("[EnableX] Ignoring own stream in stream-subscribed");
            return;
          }

          if (remoteDisconnectTimerRef.current) {
            clearTimeout(remoteDisconnectTimerRef.current);
            remoteDisconnectTimerRef.current = null;
          }

          remoteStreamRef.current = remoteStream;

          if (isMountedRef.current) {
            setRemoteStreamActive(true);
            setCallStatus("connected");
          }

          // ── For VOICE CALLS: play audio stream with retries ──────────────
          if (callType === "audio") {
            setTimeout(() => playRemoteAudio(remoteStream), 50);
            setTimeout(() => playRemoteAudio(remoteStream), 300);
            setTimeout(() => playRemoteAudio(remoteStream), 1000);
            return;
          }

          // ── For VIDEO CALLS: only allow real participant camera streams ──
          if (!isParticipantVideoStream(remoteStream)) {
            console.log(
              "[EnableX] ⏭️ Ignoring non-camera remote stream:",
              remoteId
            );
            return;
          }

          console.log(
            "[EnableX] 🎥 PARTICIPANT CAMERA STREAM READY:",
            remoteId
          );

          // Reset tracking so this new stream can play fresh
          playedRemoteContainerRef.current = "";

          // ── Polling loop: retry every 500ms until the video element
          //    has actual frame data (readyState >= 2).
          //    This handles the common case where the EnableX SDK hasn't
          //    fully settled the WebRTC media at the moment stream-subscribed fires.
          let pollCount = 0;
          const MAX_POLLS = 20; // 20 × 500ms = 10 seconds

          const pollUntilPlaying = () => {
            pollCount++;
            if (pollCount > MAX_POLLS) {
              console.warn("[EnableX] ⏰ Gave up polling for remote video after 10s");
              return;
            }

            // Check if video is actually rendering already
            const container = document.getElementById("remote_video_player");
            const videoEl = container?.querySelector("video");
            if (videoEl && videoEl.readyState >= 2) {
              console.log("[EnableX] ✅ Remote video confirmed playing at poll", pollCount);
              return; // Done — video is rendering
            }

            // Look up the live stream from remoteStreams (more reliable than event.stream)
            let streamToPlay = remoteStream;
            if (activeRoom?.remoteStreams) {
              const fromRoom =
                (typeof activeRoom.remoteStreams.get === "function"
                  ? activeRoom.remoteStreams.get(remoteStream.getID?.()) ||
                    activeRoom.remoteStreams.get(remoteId)
                  : null) ||
                activeRoom.remoteStreams[remoteStream.getID?.()] ||
                activeRoom.remoteStreams[remoteId];
              if (fromRoom) streamToPlay = fromRoom;
            }

            // Reset key so this poll attempt can proceed
            playedRemoteContainerRef.current = "";
            playRemotePreview(streamToPlay);

            setTimeout(pollUntilPlaying, 500);
          };

          // First attempt after a short delay, then poll
          setTimeout(pollUntilPlaying, 200);
        });

        // --------------------------------------------------
        // Active talkers updated (EnableX Group Mode)
        // --------------------------------------------------
        activeRoom.addEventListener(
          "active-talkers-updated",
          (event) => {
            console.log(
              "[EnableX] 🗣️ ACTIVE TALKERS UPDATED:",
              event
            );

            const activeList =
              event?.message?.activeList ||
              event?.activeList ||
              [];

            if (!Array.isArray(activeList) || activeList.length === 0) return;

            const localId =
              activeLocalStream?.getID?.() != null
                ? String(activeLocalStream.getID())
                : null;

            // Find the first remote talker (skip own stream and screen-share)
            const talker = activeList.find((item) => {
              const streamId = String(
                item?.streamId ?? item?.id ?? ""
              );

              if (!streamId) return false;

              // Never choose screen share / canvas
              if (streamId === "101" || streamId === "102") {
                return false;
              }

              // Never choose our own stream
              if (localId && streamId === localId) {
                return false;
              }

              return true;
            });

            if (!talker) {
              return;
            }

            const streamId = String(talker.streamId);

            let stream = null;

            if (activeRoom.remoteStreams) {
              if (typeof activeRoom.remoteStreams.get === "function") {
                stream =
                  activeRoom.remoteStreams.get(
                    talker.streamId
                  ) ||
                  activeRoom.remoteStreams.get(streamId);
              }

              if (!stream) {
                stream =
                  activeRoom.remoteStreams[talker.streamId] ||
                  activeRoom.remoteStreams[streamId];
              }
            }

            if (!stream) {
              return;
            }

            remoteStreamRef.current = stream;

            if (isMountedRef.current) {
              setRemoteStreamActive(true);
            }

            if (callType === "audio") {
              setTimeout(() => {
                playRemoteAudio(stream);
              }, 50);
            } else if (isParticipantVideoStream(stream)) {
              setTimeout(() => {
                playRemotePreview(stream);
              }, 50);
            }
          }
        );

        // --------------------------------------------------
        // 11. Remote user disconnected
        // --------------------------------------------------
        activeRoom.addEventListener("user-disconnected", (event) => {
          console.warn("[EnableX] Remote user disconnected event:", event);

          if (remoteDisconnectTimerRef.current) {
            clearTimeout(remoteDisconnectTimerRef.current);
          }

          if (isMountedRef.current && !isDisconnectedRef.current) {
            setRemoteStreamActive(false);
            toast("Connection interrupted. Reconnecting...", {
              icon: "📞",
            });

            remoteDisconnectTimerRef.current = setTimeout(() => {
              remoteDisconnectTimerRef.current = null;
              if (isMountedRef.current && !isDisconnectedRef.current) {
                toast("The other person left the call", { icon: "📞" });
                finishCall({ notifyRemote: false });
              }
            }, 8000);
          }
        });

        // --------------------------------------------------
        // 12. Room errors + automatic token recovery
        // --------------------------------------------------
        activeRoom.addEventListener("room-error", async (error) => {
          console.error("[EnableX] ❌ ROOM ERROR (raw):", error);

          // Ignore errors from an old room that is already being
          // cleaned up during a reconnect.
          if (
            cancelled ||
            !isMountedRef.current ||
            intentionalDisconnectRef.current
          ) {
            return;
          }

          const errorText = String(
            error?.msg || error?.message || error?.desc || error?.error || "",
          ).toLowerCase();

          const enablexErrorCode = Number(
            error?.error ?? error?.code ?? error?.result,
          );

          console.error("[EnableX] Room error details:", {
            error,
            errorText,
            enablexErrorCode,
            roomId,
            reconnectAttempts: reconnectAttemptsRef.current,
          });

          // --------------------------------------------------
          // Detect "room deleted" (needs a brand new room)
          // --------------------------------------------------
          const isRoomDeletedError =
            enablexErrorCode === 4118 ||
            errorText.includes("room has been deleted") ||
            errorText.includes("room deleted");

          // --------------------------------------------------
          // Detect EnableX token/authentication errors.
          //
          // IMPORTANT: this used to include a bare
          // errorText.includes('token') check, which matched
          // almost any EnableX message that merely *mentions*
          // "token" (rate limit notices, ICE renegotiation
          // messages, etc). That falsely triggered a full
          // room/token rebuild mid-call, which looked like the
          // other person "left" even though nothing was
          // actually wrong. We now require a specific,
          // unambiguous phrase or a real auth-related HTTP/
          // EnableX status code.
          // --------------------------------------------------
          const isTokenError =
            errorText.includes("invalid token") ||
            errorText.includes("invalid_token") ||
            errorText.includes("token expired") ||
            errorText.includes("token has expired") ||
            errorText.includes("invalid token/param") ||
            errorText.includes("token/param") ||
            errorText.includes("token param") ||
            enablexErrorCode === 401 ||
            enablexErrorCode === 4011; // EnableX auth-failure code — verify against EnableX docs/logs for your account

          if (isRoomDeletedError) {
            console.warn("[EnableX] 🚨 ROOM 4118: room has been deleted");

            // Do NOT try to reconnect to the old room.
            // A completely NEW room is required.

            if (reconnectingRef.current) {
              console.warn("[EnableX] Room recreation already in progress");
              return;
            }

            reconnectingRef.current = true;

            if (isMountedRef.current) {
              setCallStatus("connecting");
              setRemoteStreamActive(false);
            }

            try {
              const response = await api.post("/enablex/create-room", {
                name: `Inakkam Call ${Date.now()}`,
              });

              const newRoomId =
                response.data?.roomId ||
                response.data?.room?.room_id ||
                response.data?.room?.roomId ||
                response.data?.room?._id;

              if (!response.data?.success || !newRoomId) {
                throw new Error(
                  response.data?.message || "Failed to create replacement room",
                );
              }

              console.log("[EnableX] ✅ Replacement room created:", newRoomId);

              const socket = getSocket();

              // Tell the other participant.
              if (socket && targetUid) {
                socket.emit("enablex_room_recreated", {
                  targetUserId: targetUid,
                  conversationId: roomId,
                  roomId: newRoomId,
                  callType,
                });
              }

              /*
               * IMPORTANT:
               *
               * We cannot simply change the local `roomId` prop.
               * The parent needs to pass the new roomId back
               * into VideoCall.
               *
               * So emit an event / callback to the parent here.
               */
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("enablex-room-recreated", {
                    detail: {
                      roomId: newRoomId,
                    },
                  }),
                );
              }
            } catch (recreateError) {
              console.error(
                "[EnableX] ❌ Failed to recreate room:",
                recreateError?.response?.data || recreateError,
              );

              // If EnableX is rate-limiting us (429), do NOT leave
              // the call sitting in "connecting" waiting for
              // another room-error to retry — that just fires
              // create-room again and deepens the rate limit.
              // End the call cleanly instead.
              const isRateLimited =
                recreateError?.response?.status === 429 ||
                recreateError?.response?.data?.rateLimited === true;

              if (isRateLimited) {
                const retryAfterSeconds =
                  recreateError?.response?.data?.retryAfterSeconds;

                toast.error(
                  retryAfterSeconds
                    ? `Video service is busy. Please try again in ${retryAfterSeconds}s.`
                    : "Video service is busy. Please try again in a moment.",
                );

                reconnectingRef.current = false;

                if (isMountedRef.current && !intentionalDisconnectRef.current) {
                  handleDisconnect();
                }

                return;
              }

              toast.error("Unable to reconnect the video call.");
            } finally {
              reconnectingRef.current = false;
            }

            return;
          }
          if (isTokenError) {
            // Prevent multiple room-error events from triggering
            // multiple simultaneous reconnects.
            if (reconnectingRef.current) {
              console.warn("[EnableX] Token recovery already in progress.");
              return;
            }

            reconnectingRef.current = true;

            console.warn(
              "[EnableX] 🔄 INVALID TOKEN DETECTED — starting full token recovery",
            );

            if (isMountedRef.current) {
              setCallStatus("connecting");
              setRemoteStreamActive(false);
            }

            toast.error("Video connection expired. Reconnecting...");

            // Allow the old room to finish disconnecting.
            try {
              if (activeRoom) {
                activeRoom.disconnect();
              }
            } catch (disconnectError) {
              console.warn(
                "[EnableX] Old room disconnect during token recovery:",
                disconnectError,
              );
            }

            // Close old local stream.
            try {
              if (activeLocalStream) {
                activeLocalStream.close();
              }
            } catch (streamError) {
              console.warn(
                "[EnableX] Old stream close during token recovery:",
                streamError,
              );
            }

            // Clear current references.
            if (roomRef.current === activeRoom) {
              roomRef.current = null;
            }

            if (localStreamRef.current === activeLocalStream) {
              localStreamRef.current = null;
            }

            remoteStreamRef.current = null;
            tokenRef.current = null;

            // Reset retry counter because we're doing a complete
            // token refresh rather than a normal reconnect.
            reconnectAttemptsRef.current = 0;

            // Force the EnableX initialization useEffect to run again.
            if (isMountedRef.current) {
              setTimeout(() => {
                if (!isMountedRef.current) return;

                reconnectingRef.current = false;

                setReconnectKey((prev) => prev + 1);
              }, 500);
            }

            return;
          }

          // --------------------------------------------------
          // Temporary connection errors — DO NOT tear the room
          // down for these; the SDK's own allow_reconnect logic
          // (see room.connect below) handles brief network blips.
          // --------------------------------------------------
          if (reconnectAttemptsRef.current < 3) {
            reconnectAttemptsRef.current += 1;

            console.warn(
              `[EnableX] Temporary room error. ` +
                `Reconnect attempt ${reconnectAttemptsRef.current}/3`,
            );

            toast(
              `Connection interrupted. Reconnecting ` +
                `(${reconnectAttemptsRef.current}/3)...`,
            );

            return;
          }

          // --------------------------------------------------
          // Final failure
          // --------------------------------------------------
          toast.error("Unable to reconnect the video call.");

          if (isMountedRef.current && !intentionalDisconnectRef.current) {
            handleDisconnect();
          }
        });

        // --------------------------------------------------
        // 12. Room disconnected
        // --------------------------------------------------
        activeRoom.addEventListener("room-disconnected", (event) => {
          console.log("[EnableX] Room disconnected:", event);

          // User intentionally ended the call.
          if (
            intentionalDisconnectRef.current ||
            isDisconnectedRef.current ||
            cancelled
          ) {
            console.log("[EnableX] Intentional/cleanup disconnect.");
            return;
          }

          // If token recovery / room recreation is already
          // happening, do not start another recovery — this
          // room-disconnected event almost certainly belongs to
          // the room we're already tearing down on purpose.
          if (reconnectingRef.current) {
            console.log(
              "[EnableX] Disconnect belongs to an in-progress recovery.",
            );
            return;
          }

          console.warn("[EnableX] Unexpected room disconnect.");

          if (isMountedRef.current) {
            setCallStatus("connecting");
            setRemoteStreamActive(false);
          }

          // Rebuild the EnableX session.
          reconnectingRef.current = true;

          setTimeout(() => {
            if (!isMountedRef.current) return;

            reconnectingRef.current = false;
            setReconnectKey((prev) => prev + 1);
          }, 500);
        });
        // --------------------------------------------------
        // 13. CONNECT TO ENABLEX
        // --------------------------------------------------
        console.log("[EnableX] 🚀 Connecting to room...");

        activeRoom.connect({
          allow_reconnect: true,
          number_of_attempts: 3,
          timeout_interval: 5000,
        });
      } catch (err) {
        console.error("[EnableX] ❌ Call Setup Exception:", err);

        if (isMountedRef.current) {
          toast.error(err?.message || "Call failed to start.");
        }

        handleDisconnect();
      }
    };

    // ------------------------------------------------------
    // Socket listener for remote hangup
    // ------------------------------------------------------
    const socket = getSocket();

    const handleRemoteCallEnded = () => {
      toast("Call ended by the other person", {
        icon: "📞",
      });

      if (isMountedRef.current && !isDisconnectedRef.current) {
        finishCall({ notifyRemote: false });
      }
    };

    if (socket) {
      socket.on("call_ended", handleRemoteCallEnded);
    }

    startCall();

    return () => {
      cancelled = true;
      if (remoteDisconnectTimerRef.current) {
        clearTimeout(remoteDisconnectTimerRef.current);
        remoteDisconnectTimerRef.current = null;
      }

      // Mark this room as being intentionally cleaned up by React.
      // This prevents room-error / room-disconnected from triggering
      // another recovery while the old room is being destroyed.
      const cleanupRoom = activeRoom;

      if (cleanupRoom) {
        try {
          cleanupRoom.disconnect();
        } catch (e) {
          console.warn("[EnableX] Room cleanup error:", e);
        }
      }

      if (activeLocalStream) {
        try {
          activeLocalStream.close();
        } catch (e) {
          console.warn("[EnableX] Stream cleanup error:", e);
        }
      }

      if (roomRef.current === activeRoom) {
        roomRef.current = null;
      }

      if (localStreamRef.current === activeLocalStream) {
        localStreamRef.current = null;
      }

      if (socket) {
        socket.off("call_ended", handleRemoteCallEnded);
      }
    };
  }, [roomId, callType, isCaller, handleDisconnect, finishCall, reconnectKey]);

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
        console.warn("EnableX muteAudio toggle error:", e);
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
        console.warn("EnableX muteVideo toggle error:", e);
      }
    }
  };

  // ─── Send In-Room Chat Message ───────────────────────────
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const isStaff = currentUser?.isStaff || currentUser?.isEliteAgent || currentUser?.role === 'staff' || currentUser?.role === 'admin';
    const isCustomer = !isStaff;

    if (isCustomer && chatInput.trim().length > 20) {
      toast.error('Messages are limited to 20 characters or less.');
      return;
    }

    const messageText = isCustomer && chatInput.trim().length > 20 ? chatInput.trim().slice(0, 20) : chatInput.trim();
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setChatMessages((prev) => [
      ...prev,
      {
        id: `my_msg_${Date.now()}`,
        sender: "me",
        senderName: currentUser?.name || "Me",
        text: messageText,
        time: timeStr,
      },
    ]);
    setChatInput("");

    const socket = getSocket();
    if (socket && targetUid) {
      socket.emit("webrtc_chat", {
        targetUserId: targetUid,
        message: messageText,
      });
    }
  };

  // ─── Receive In-Room Chat Messages ──────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleChatMsg = ({ senderId, message }) => {
      if (targetUid && senderId && String(senderId) !== targetUid) return;
      if (!isMountedRef.current) return;
      setChatMessages((prev) => [
        ...prev,
        {
          id: `remote_msg_${Date.now()}`,
          sender: "remote",
          senderName: remoteUserName,
          text: message,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    };

    socket.on("webrtc_chat", handleChatMsg);
    return () => socket.off("webrtc_chat", handleChatMsg);
  }, [targetUid, remoteUserName]);
  const handleUnlockAudio = useCallback(() => {
    const audioContainer = document.getElementById("remote_audio_player");
    if (audioContainer) {
      const mediaEls = audioContainer.querySelectorAll("video, audio");
      mediaEls.forEach((el) => {
        el.muted = false;
        el.volume = 1.0;
        el.play().catch(() => {});
      });
    }
    const videoContainer = document.getElementById("remote_video_player");
    if (videoContainer) {
      const mediaEls = videoContainer.querySelectorAll("video, audio");
      mediaEls.forEach((el) => {
        if (!isMutedSound) {
          el.muted = false;
          el.volume = 1.0;
        }
        el.play().catch(() => {});
      });
    }
  }, [isMutedSound]);

  return createPortal(
    <ScreenShield enabled={true} label="INAKKAM SECURE CALL" userIdentifier={currentUser?.name || currentUser?.phone || ''}>
      <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[99999] flex bg-[#0A0A0A] text-white overflow-hidden font-sans select-none h-[100dvh] w-screen">
        {/* Radial glow backgrounds */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#D51659]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#B44DDC]/10 blur-[120px] pointer-events-none" />

      {/* ─── Connecting screen ─────────────────────────────── */}
      {callStatus === "connecting" && (
        <div className="flex-1 h-full w-full relative flex flex-col justify-between overflow-hidden">
          {/* If video call, show live camera preview fullscreen */}
          {callType === "video" ? (
            <div className="absolute inset-0 z-0 bg-[#121212]">
              {/* EnableX Local Preview Container */}
              <div
                id="connecting_local_video"
                className="absolute inset-0 w-full h-full [&_*]:!w-full [&_*]:!h-full [&_video]:!object-cover [&_video]:scale-x-[-1]"
              />
              {/* Subtle dark vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80 pointer-events-none" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-[#150A1A] via-[#0A0A0A] to-[#1A0A15]" />
          )}

          {/* Top header on connecting screen */}
          <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 sm:px-3.5 py-1.5 rounded-full border border-white/10 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#D51659] animate-ping" />
              <span className="text-xs font-bold text-white tracking-wide">
                {isCaller ? "Calling..." : "Connecting..."}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-300 bg-black/40 backdrop-blur-md px-3 sm:px-3.5 py-1.5 rounded-full border border-white/10 shadow-sm">
              {callType === "video" ? "Video Call" : "Voice Call"}
            </span>
          </div>

          {/* Center Glass Card with Remote User Info & Status */}
          <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 my-auto">
            <div className="bg-black/50 backdrop-blur-2xl border border-white/15 p-6 sm:p-8 rounded-3xl sm:rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col items-center max-w-xs sm:max-w-sm w-full transition-all">
              {/* Pulsing Avatar */}
              <div className="relative mb-5 sm:mb-6 flex items-center justify-center">
                <span className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#D51659]/30 blur-2xl animate-pulse pointer-events-none" />
                <span
                  className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-[#D51659]/60 animate-ping pointer-events-none"
                  style={{ animationDuration: "2.5s" }}
                />
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-[#D51659] to-[#B44DDC] shadow-2xl relative z-10">
                  <img
                    src={remoteUserPhoto || "https://via.placeholder.com/150"}
                    alt={remoteUserName}
                    className="w-full h-full rounded-full object-cover border-2 border-black bg-black"
                  />
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white text-center drop-shadow-md px-2 truncate max-w-full">
                {remoteUserName}
              </h3>

              <div className="flex items-center gap-2 mt-3 text-slate-300 text-xs font-medium bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                <div className="w-3 h-3 border-2 border-[#D51659] border-t-transparent rounded-full animate-spin" />
                <span>
                  {isCaller
                    ? "Waiting for answer..."
                    : "Connecting to session..."}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Controls Bar on Connecting Screen */}
          <div className="relative z-10 p-4 sm:p-6 pb-8 sm:pb-10 flex items-center justify-center gap-4 sm:gap-6">
            {/* Mic toggle */}
            <button
              onClick={toggleMic}
              className={`p-3.5 sm:p-4 rounded-full transition-all duration-300 backdrop-blur-md ${
                micActive
                  ? "bg-black/60 text-white border border-white/15 hover:bg-black/80"
                  : "bg-[#D51659]/40 text-[#D51659] border border-[#D51659] hover:bg-[#D51659]/50"
              }`}
              title={micActive ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micActive ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </button>

            {/* Video toggle (for video call) */}
            {callType === "video" && (
              <button
                onClick={toggleVideo}
                className={`p-3.5 sm:p-4 rounded-full transition-all duration-300 backdrop-blur-md ${
                  videoActive
                    ? "bg-black/60 text-white border border-white/15 hover:bg-black/80"
                    : "bg-[#D51659]/40 text-[#D51659] border border-[#D51659] hover:bg-[#D51659]/50"
                }`}
                title={videoActive ? "Turn Camera Off" : "Turn Camera On"}
              >
                {videoActive ? (
                  <VideoIcon className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Cancel / End Call Button */}
            <button
              onClick={handleDisconnect}
              className="p-4 sm:p-4.5 rounded-full bg-[#D51659] hover:bg-[#D51659]/90 text-white hover:scale-105 active:scale-95 transition-all shadow-[0_4px_24px_rgba(213,22,89,0.5)] flex items-center justify-center cursor-pointer"
              title="Cancel Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Active Call Screen ─────────────────────────────── */}
      {callStatus === "connected" && (
        <div className="flex-1 flex relative h-full w-full overflow-hidden">
          {/* ── Main viewport ─────────────────────────── */}
          {callType === "audio" ? (
            /* ── Audio call UI ── */
            <div className="flex-1 h-full relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-[#150A1A] via-[#0A0A0A] to-[#1A0A15]">
              {/* Hidden audio player container for remote WebRTC stream */}
              <div
                id="remote_audio_player"
                className="absolute left-0 top-0 w-1 h-1 overflow-hidden pointer-events-none"
                style={{ opacity: 0.01 }}
              />

              {/* Main Center Profile Container — perfectly centered between top bar and bottom HUD */}
              <div className="flex flex-col items-center max-w-sm sm:max-w-md md:max-w-lg w-full z-10 my-auto pb-20 sm:pb-24">
                {/* Animated Multi-Ring Glowing Avatar */}
                <div className="relative mb-5 sm:mb-6 flex items-center justify-center">
                  {/* Ambient Glow */}
                  <div className="absolute w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 rounded-full bg-gradient-to-tr from-[#D51659]/30 to-[#B44DDC]/30 blur-3xl animate-pulse pointer-events-none" />

                  {/* Expanding Ping Ring */}
                  <div
                    className="absolute w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full border border-[#D51659]/40 animate-ping pointer-events-none"
                    style={{ animationDuration: "3.2s" }}
                  />

                  {/* Outer Gradient Border Ring & Avatar */}
                  <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full p-1.5 bg-gradient-to-tr from-[#D51659] via-[#EC3F7B] to-[#B44DDC] shadow-[0_0_60px_rgba(213,22,89,0.4)] relative z-10">
                    <img
                      src={remoteUserPhoto || "https://via.placeholder.com/150"}
                      alt={remoteUserName}
                      className="w-full h-full rounded-full object-cover border-2 border-black bg-black"
                    />
                  </div>
                </div>

                {/* User Name */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white text-center tracking-tight drop-shadow-lg px-4 truncate max-w-full">
                  {remoteUserName}
                </h2>

                {/* Live Call Duration Badge */}
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-xl text-emerald-400 text-xs sm:text-sm font-semibold shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Voice Call Connected ({formatTime(duration)})</span>
                </div>

                {/* Dynamic Responsive Soundwave Visualizer — placed directly below status pill */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-5 sm:mt-6 h-8 sm:h-10 w-full max-w-xs sm:max-w-sm px-4">
                  {[35, 70, 25, 85, 45, 95, 50, 75, 100, 60, 80, 30, 65, 40, 90, 55].map(
                    (h, i) => (
                      <span
                        key={i}
                        className="w-1.5 sm:w-2 bg-gradient-to-t from-[#D51659] via-[#EC3F7B] to-[#B44DDC] rounded-full transition-all duration-300 shadow-sm"
                        style={{
                          height: micActive ? `${h}%` : "15%",
                          opacity: micActive ? 0.95 : 0.25,
                          animation: micActive
                            ? `pulse 1.2s ease-in-out infinite`
                            : "none",
                          animationDelay: `${(i * 80) % 600}ms`,
                        }}
                      />
                    ),
                  )}
                </div>

                {/* Enable / Boost Sound Button */}
                <button
                  type="button"
                  onClick={handleUnlockAudio}
                  className="mt-4 px-4 py-1.5 rounded-full bg-white/5 hover:bg-[#D51659]/20 border border-white/10 hover:border-[#D51659]/40 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-md transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="Click if you cannot hear remote audio"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#D51659]" />
                  <span>Enable / Boost Sound</span>
                </button>
              </div>
            </div>
          ) : (
            /* ── Video call main UI ── */
            <div className="flex-1 h-full bg-[#121212] relative overflow-hidden">
              {/* EnableX Remote Video Container — fullscreen */}
              <div
                id="remote_video_player"
                className="absolute inset-0 w-full h-full overflow-hidden bg-black z-0"
              />

              {/* Waiting for remote placeholder */}
              {!remoteStreamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121212] z-10 pointer-events-none p-4 text-center">
                  <img
                    src={remoteUserPhoto || "https://via.placeholder.com/150"}
                    alt={remoteUserName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-white/10 mb-3 opacity-50 shadow-lg"
                  />
                  <p className="text-slate-400 text-xs sm:text-sm">
                    Connecting video stream with {remoteUserName}...
                  </p>
                  {noRemoteVideoCountdown !== null && (
                    <p className="text-rose-400 text-xs font-bold mt-2 animate-pulse bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                      ⚠️ Camera/face must be active in {noRemoteVideoCountdown}s
                    </p>
                  )}
                </div>
              )}

              {/* Warning banner when opponent face/video is not detected */}
              {noRemoteVideoCountdown !== null && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-rose-600/90 text-white px-4 py-1.5 rounded-full backdrop-blur-md shadow-2xl flex items-center gap-2 border border-rose-400/40 animate-pulse text-[11px] sm:text-xs font-bold pointer-events-auto">
                  <VideoOff className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>
                    Opponent camera/face not detected. Ending call in {noRemoteVideoCountdown}s...
                  </span>
                </div>
              )}

              {/* EnableX Local camera PiP — top-right corner */}
              <div
                className="absolute top-4 sm:top-6 right-4 sm:right-6 w-24 sm:w-32 md:w-40 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-[#1a1a1a] z-20"
                style={{ aspectRatio: "9/16" }}
              >
                <div
                  id="local_pip_video"
                  className="w-full h-full [&_*]:!w-full [&_*]:!h-full [&_video]:!object-cover [&_video]:scale-x-[-1]"
                />
                <div className="absolute bottom-2 left-2 text-[9px] font-semibold bg-black/70 px-1.5 py-0.5 rounded text-slate-200 backdrop-blur-sm">
                  You
                </div>
              </div>
            </div>
          )}

          {/* ── Top overlay ─── */}
          <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between pointer-events-none z-25">
            {callType === "video" ? (
              <div className="flex items-center gap-3 pointer-events-auto">
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-white drop-shadow-md">
                    {remoteUserName}
                  </h4>
                  <p className="text-[10px] sm:text-xs font-bold text-[#D51659] uppercase tracking-wider drop-shadow-sm flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live Call · {formatTime(duration)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 pointer-events-auto">
                <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 sm:px-3.5 py-1.5 rounded-full border border-white/10 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-300 tracking-wide">
                    Inakkam HD Voice
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setIsMutedSound((m) => !m)}
                className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all backdrop-blur-md"
                title={
                  isMutedSound ? "Unmute Remote Audio" : "Mute Remote Audio"
                }
              >
                {isMutedSound ? (
                  <VolumeX className="w-4 h-4 text-[#D51659]" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* ── Bottom controls HUD ──────────────────────── */}
          <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 px-4 sm:px-6 py-3 sm:py-3.5 bg-black/60 border border-white/15 backdrop-blur-2xl rounded-full flex items-center gap-3.5 sm:gap-6 md:gap-8 z-25 shadow-[0_16px_50px_rgba(0,0,0,0.6)] max-w-[calc(100vw-2rem)]">
            {/* Mic toggle */}
            <button
              onClick={toggleMic}
              className={`p-3 sm:p-3.5 rounded-full transition-all duration-300 backdrop-blur-md ${
                micActive
                  ? "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                  : "bg-[#D51659]/30 text-[#D51659] border border-[#D51659]/60 hover:bg-[#D51659]/40"
              }`}
              title={micActive ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micActive ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </button>

            {/* Video toggle (only for video calls) */}
            {callType === "video" && (
              <button
                onClick={toggleVideo}
                className={`p-3 sm:p-3.5 rounded-full transition-all duration-300 backdrop-blur-md ${
                  videoActive
                    ? "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                    : "bg-[#D51659]/30 text-[#D51659] border border-[#D51659]/60 hover:bg-[#D51659]/40"
                }`}
                title={videoActive ? "Turn Camera Off" : "Turn Camera On"}
              >
                {videoActive ? (
                  <VideoIcon className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </button>
            )}

            {/* In-call text chat */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-3 sm:p-3.5 rounded-full transition-all duration-300 relative backdrop-blur-md ${
                showChat
                  ? "bg-purple-500/30 text-purple-300 border border-purple-500/50 hover:bg-purple-500/40"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
              }`}
              title="Session Chat"
            >
              <MessageSquare className="w-5 h-5" />
              {!showChat &&
                chatMessages.filter((m) => m.sender === "remote").length >
                  0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#D51659] rounded-full border-2 border-black animate-pulse" />
                )}
            </button>

            <span className="w-[1px] h-6 bg-white/20" />

            {/* End call */}
            <button
              onClick={handleDisconnect}
              className="p-3.5 sm:p-4 rounded-full bg-[#D51659] hover:bg-[#D51659]/90 text-white hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(213,22,89,0.5)] flex items-center justify-center cursor-pointer"
              title="Hang Up"
            >
              <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* ── In-call text chat drawer ──────────────────── */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full sm:w-80 h-full bg-[#0F0F16]/95 border-l border-white/10 backdrop-blur-xl flex flex-col z-30 relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
              >
                {/* Chat header */}
                <div className="h-16 px-4 border-b border-white/5 flex items-center justify-between bg-black/30">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#D51659]" />
                    <span className="font-extrabold text-sm tracking-wider uppercase">
                      Session Chat
                    </span>
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
                    <p className="text-center text-slate-600 text-xs mt-8">
                      Say hi to {remoteUserName}!
                    </p>
                  )}
                  {chatMessages.map((msg) => {
                    const isSystem = msg.sender === "system";
                    const isMe = msg.sender === "me";
                    if (isSystem) {
                      return (
                        <div
                          key={msg.id}
                          className="text-center text-[10px] text-slate-500 uppercase tracking-widest py-1"
                        >
                          {msg.text}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[9px] text-slate-500 font-semibold mb-0.5 px-1">
                          {msg.senderName}
                        </span>
                        <div
                          className={`p-2.5 rounded-2xl text-xs max-w-[85%] break-words leading-relaxed ${
                            isMe
                              ? "bg-gradient-to-tr from-[#D51659] to-[#EC3F7B] text-white rounded-br-sm"
                              : "bg-white/10 text-white/90 rounded-bl-sm border border-white/10"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-slate-600 mt-0.5 px-1">
                          {msg.time}
                        </span>
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
                    maxLength={(!currentUser?.isStaff && !currentUser?.isEliteAgent && currentUser?.role !== 'staff' && currentUser?.role !== 'admin') ? 20 : 2000}
                    onChange={(e) => {
                      const isCustomer = !currentUser?.isStaff && !currentUser?.isEliteAgent && currentUser?.role !== 'staff' && currentUser?.role !== 'admin';
                      const val = e.target.value;
                      setChatInput(isCustomer && val.length > 20 ? val.slice(0, 20) : val);
                    }}
                    placeholder={(!currentUser?.isStaff && !currentUser?.isEliteAgent && currentUser?.role !== 'staff' && currentUser?.role !== 'admin') ? "Type a message... (max 20 chars)" : "Type a message..."}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-[#D51659]/40 transition-colors resize-none"
                  />
                  {(!currentUser?.isStaff && !currentUser?.isEliteAgent && currentUser?.role !== 'staff' && currentUser?.role !== 'admin') && (
                    <span className={`text-[10px] font-semibold px-1 py-1 rounded select-none shrink-0 ${chatInput.length >= 20 ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                      {chatInput.length}/20
                    </span>
                  )}
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
    </ScreenShield>,
    document.body,
  );
};

export default VideoCall;

