import React, { useState, useEffect, useRef, useCallback } from "react";
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

  // Normalize targetUserId
  const targetUid = String(
    targetUserId?._id || targetUserId?.id || targetUserId || "",
  );

  // EnableX Refs
  const roomRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
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

  const finishCall = useCallback(({ notifyRemote = true } = {}) => {
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
  }, [roomId, targetUid]);

  const handleDisconnect = useCallback(() => {
    finishCall({ notifyRemote: true });
  }, [finishCall]);

  // ─── Periodic Coin Deduction (every 20s while connected) ─
  useEffect(() => {
    if (callStatus !== "connected") return;
    const coinDeductInterval = setInterval(async () => {
      try {
        const res = await api.post("/coins/deduct-call", {
          targetUserId: targetUid,
          callType,
          seconds: 20,
        });
        if (!res.data.success && res.data.insufficientCoins) {
          toast.error("Insufficient coin balance to continue call");
          // Use handleDisconnect (not onEndCall directly) so the
          // EnableX room is closed cleanly and the other participant
          // gets a proper `end_call` socket event instead of their
          // SDK timing out and reporting a spurious "user left".
          if (isMountedRef.current) handleDisconnect();
        } else {
          dispatch(fetchMe());
        }
      } catch (err) {
        // Ignore API errors silently
      }
    }, 20000);
    return () => clearInterval(coinDeductInterval);
  }, [callStatus, callType, targetUid, dispatch, handleDisconnect]);

  // ─── Reliable local/remote playback helpers ─────────────────
  const playLocalPreview = useCallback(() => {
    if (callType !== "video") return;
    const stream = localStreamRef.current;
    if (!stream || typeof stream.play !== "function") return;

    const container =
      document.getElementById("local_pip_video") ||
      document.getElementById("connecting_local_video");

    if (!container) return;

    try {
      container.innerHTML = "";
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
      console.log("[EnableX] Local video playing in", container.id);
    } catch (error) {
      console.error("[EnableX] Local video playback failed:", error);
    }
  }, [callType]);

  const playRemotePreview = useCallback(() => {
    const stream = remoteStreamRef.current;
    if (!stream || typeof stream.play !== "function") return;

    const containerId =
      callType === "video" ? "remote_video_player" : "remote_audio_player";
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      container.innerHTML = "";
      stream.play(containerId, {
        player: {
          width: "100%",
          height: "100%",
          autoplay: true,
          playsinline: true,
        },
        toolbar: {
          displayMode: false,
          branding: { display: false },
        },
      });
      console.log("[EnableX] Remote media playing in", containerId);
    } catch (error) {
      console.error("[EnableX] Remote playback failed:", error);
    }
  }, [callType]);

  useEffect(() => {
    if (callStatus === "connecting" || callStatus === "connected") {
      const id = setTimeout(playLocalPreview, 50);
      return () => clearTimeout(id);
    }
  }, [callStatus, playLocalPreview]);

  useEffect(() => {
    if (!remoteStreamActive) return;
    const t1 = setTimeout(playRemotePreview, 50);
    const t2 = setTimeout(playRemotePreview, 250);
    const t3 = setTimeout(playRemotePreview, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [remoteStreamActive, playRemotePreview]);

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
      if (hasPublished || !mediaReady || !roomConnected || !activeRoom || !activeLocalStream) {
        return;
      }
      hasPublished = true;
      console.log("[EnableX] 🚀 Publishing local stream now...");
      try {
        activeRoom.publish(
          activeLocalStream,
          {
            minVideoBW: 150,
            maxVideoBW: 1200,
          },
          (publishResponse) => {
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
          },
        );
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

        // Enable verbose SDK logging during testing
        try {
          if (EnxRtc.Logger?.setLogLevel) {
            EnxRtc.Logger.setLogLevel(0);
          }
        } catch (e) {
          console.warn("[EnableX] Could not enable SDK debug logging:", e);
        }

        // --------------------------------------------------
        // 2. Get token
        // --------------------------------------------------
        let token = null;

        if (roomId) {
          console.log("[EnableX] Requesting fresh token for room:", roomId);

          try {
            const tokenRes = await api.post("/enablex/get-token", {
              roomId,
              role: isCaller ? "moderator" : "participant",
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
        // 3. Stream configuration
        // --------------------------------------------------
        const streamOptions = {
          audio: true,
          video: callType === "video",
          data: true,

          audioMuted: false,
          videoMuted: callType !== "video",

          videoSize: [320, 180, 1280, 720],

          attributes: {
            name: currentUserNameRef.current,
          },
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
        // 5. Create EnableX room
        // --------------------------------------------------
        activeRoom = EnxRtc.EnxRoom({
          token,
        });

        if (!activeRoom) {
          throw new Error("EnableX EnxRoom() did not return a room");
        }

        roomRef.current = activeRoom;

        console.log("[EnableX] Room object created");

        // --------------------------------------------------
        // 6. Remote stream handler
        // --------------------------------------------------
        const subscribeToRemoteStream = (stream) => {
          if (!stream || !activeRoom) {
            console.warn("[EnableX] Invalid stream received");
            return;
          }

          try {
            const localId =
              activeLocalStream && typeof activeLocalStream.getID === "function"
                ? activeLocalStream.getID()
                : null;

            const remoteId =
              typeof stream.getID === "function" ? stream.getID() : null;

            console.log("[EnableX] Stream check:", {
              localId,
              remoteId,
            });

            // Never subscribe to our own stream.
            if (localId && remoteId && localId === remoteId) {
              console.log("[EnableX] Ignoring own local stream:", remoteId);
              return;
            }

            console.log("[EnableX] 📹 Remote stream detected:", remoteId);

            activeRoom.subscribe(
              stream,
              {
                audio: true,
                video: callType === "video",
                data: true,
              },
              (response) => {
                console.log("[EnableX] Subscribe response:", response);

                if (
                  response &&
                  response.result !== undefined &&
                  response.result !== 0
                ) {
                  console.error("[EnableX] Subscribe failed:", response);
                }
              },
            );
          } catch (error) {
            console.error("[EnableX] Remote subscribe exception:", error);
          }
        };

        // --------------------------------------------------
        // 7. Room connected
        // --------------------------------------------------
        activeRoom.addEventListener("room-connected", (event) => {
          console.log("[EnableX] ✅ ROOM CONNECTED:", event);

          if (cancelled || isDisconnectedRef.current) {
            return;
          }

          roomConnected = true;

          if (isMountedRef.current) {
            setCallStatus("connected");
          }

          tryPublish();

          // Subscribe to streams already present
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
        // 9. Remote stream added
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
        // 10. Remote stream subscribed
        // --------------------------------------------------
        activeRoom.addEventListener("stream-subscribed", (event) => {
          console.log("[EnableX] ✅ STREAM SUBSCRIBED:", event);

          const remoteStream = event?.stream;

          if (!remoteStream) {
            console.warn("[EnableX] stream-subscribed without stream");
            return;
          }

          const localId =
            activeLocalStream && typeof activeLocalStream.getID === "function"
              ? activeLocalStream.getID()
              : null;

          const remoteId =
            typeof remoteStream.getID === "function"
              ? remoteStream.getID()
              : null;

          // Never display our own stream as remote.
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

          setTimeout(() => playRemotePreview(), 50);
          setTimeout(() => playRemotePreview(), 250);
          setTimeout(() => playRemotePreview(), 700);
        });

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
        activeRoom.addEventListener(
          'room-error',
          async (error) => {
            console.error('[EnableX] ❌ ROOM ERROR (raw):', error);

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
              error?.msg ||
              error?.message ||
              error?.desc ||
              error?.error ||
              ''
            ).toLowerCase();

            const enablexErrorCode = Number(
              error?.error ??
              error?.code ??
              error?.result
            );

            console.error('[EnableX] Room error details:', {
              error,
              errorText,
              enablexErrorCode,
              roomId,
              reconnectAttempts: reconnectAttemptsRef.current
            });

            // --------------------------------------------------
            // Detect "room deleted" (needs a brand new room)
            // --------------------------------------------------
            const isRoomDeletedError =
              enablexErrorCode === 4118 ||
              errorText.includes('room has been deleted') ||
              errorText.includes('room deleted');

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
              errorText.includes('invalid token') ||
              errorText.includes('invalid_token') ||
              errorText.includes('token expired') ||
              errorText.includes('token has expired') ||
              errorText.includes('invalid token/param') ||
              errorText.includes('token/param') ||
              errorText.includes('token param') ||
              enablexErrorCode === 401 ||
              enablexErrorCode === 4011; // EnableX auth-failure code — verify against EnableX docs/logs for your account

            if (isRoomDeletedError) {
              console.warn(
                '[EnableX] 🚨 ROOM 4118: room has been deleted'
              );

              // Do NOT try to reconnect to the old room.
              // A completely NEW room is required.

              if (reconnectingRef.current) {
                console.warn(
                  '[EnableX] Room recreation already in progress'
                );
                return;
              }

              reconnectingRef.current = true;

              if (isMountedRef.current) {
                setCallStatus('connecting');
                setRemoteStreamActive(false);
              }

              try {
                const response = await api.post(
                  '/enablex/create-room',
                  {
                    name:
                      `Inakkam Call ${Date.now()}`
                  }
                );

                if (
                  !response.data?.success ||
                  !response.data?.roomId
                ) {
                  throw new Error(
                    response.data?.message ||
                    'Failed to create replacement room'
                  );
                }

                const newRoomId =
                  response.data.roomId;

                console.log(
                  '[EnableX] ✅ Replacement room created:',
                  newRoomId
                );

                const socket = getSocket();

                // Tell the other participant.
                if (socket && targetUid) {
                  socket.emit(
                    'enablex_room_recreated',
                    {
                      targetUserId: targetUid,
                      conversationId: roomId,
                      roomId: newRoomId,
                      callType
                    }
                  );
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
                if (
                  typeof window !== 'undefined'
                ) {
                  window.dispatchEvent(
                    new CustomEvent(
                      'enablex-room-recreated',
                      {
                        detail: {
                          roomId: newRoomId
                        }
                      }
                    )
                  );
                }

              } catch (recreateError) {

                console.error(
                  '[EnableX] ❌ Failed to recreate room:',
                  recreateError?.response?.data ||
                  recreateError
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

                toast.error(
                  'Unable to reconnect the video call.'
                );

              } finally {
                reconnectingRef.current = false;
              }

              return;
            }
            if (isTokenError) {
              // Prevent multiple room-error events from triggering
              // multiple simultaneous reconnects.
              if (reconnectingRef.current) {
                console.warn(
                  '[EnableX] Token recovery already in progress.'
                );
                return;
              }

              reconnectingRef.current = true;

              console.warn(
                '[EnableX] 🔄 INVALID TOKEN DETECTED — starting full token recovery'
              );

              if (isMountedRef.current) {
                setCallStatus('connecting');
                setRemoteStreamActive(false);
              }

              toast.error(
                'Video connection expired. Reconnecting...'
              );

              // Allow the old room to finish disconnecting.
              try {
                if (activeRoom) {
                  activeRoom.disconnect();
                }
              } catch (disconnectError) {
                console.warn(
                  '[EnableX] Old room disconnect during token recovery:',
                  disconnectError
                );
              }

              // Close old local stream.
              try {
                if (activeLocalStream) {
                  activeLocalStream.close();
                }
              } catch (streamError) {
                console.warn(
                  '[EnableX] Old stream close during token recovery:',
                  streamError
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

                  setReconnectKey(prev => prev + 1);
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
                `Reconnect attempt ${reconnectAttemptsRef.current}/3`
              );

              toast(
                `Connection interrupted. Reconnecting ` +
                `(${reconnectAttemptsRef.current}/3)...`
              );

              return;
            }

            // --------------------------------------------------
            // Final failure
            // --------------------------------------------------
            toast.error(
              'Unable to reconnect the video call.'
            );

            if (
              isMountedRef.current &&
              !intentionalDisconnectRef.current
            ) {
              handleDisconnect();
            }
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

            // User intentionally ended the call.
            if (
              intentionalDisconnectRef.current ||
              isDisconnectedRef.current ||
              cancelled
            ) {
              console.log(
                '[EnableX] Intentional/cleanup disconnect.'
              );
              return;
            }

            // If token recovery / room recreation is already
            // happening, do not start another recovery — this
            // room-disconnected event almost certainly belongs to
            // the room we're already tearing down on purpose.
            if (reconnectingRef.current) {
              console.log(
                '[EnableX] Disconnect belongs to an in-progress recovery.'
              );
              return;
            }

            console.warn(
              '[EnableX] Unexpected room disconnect.'
            );

            if (isMountedRef.current) {
              setCallStatus('connecting');
              setRemoteStreamActive(false);
            }

            // Rebuild the EnableX session.
            reconnectingRef.current = true;

            setTimeout(() => {
              if (!isMountedRef.current) return;

              reconnectingRef.current = false;
              setReconnectKey(prev => prev + 1);
            }, 500);
          }
        );
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

    const messageText = chatInput.trim();
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

  return (
    <div className="fixed inset-0 z-[1000] flex bg-[#0A0A0A] text-white overflow-hidden font-sans select-none">
      {/* Radial glow backgrounds */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#D51659]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#B44DDC]/10 blur-[120px] pointer-events-none" />

      {/* ─── Connecting screen ─────────────────────────────── */}
      {callStatus === "connecting" && (
        <div className="flex-1 h-full w-full relative flex flex-col justify-between overflow-hidden">
          {/* If video call, show live camera preview fullscreen */}
          {callType === "video" ? (
            <div className="absolute inset-0 z-0 bg-[#121212]">
              {/* EnableX Local Preview Container.
                  NOTE: EnableX injects its own wrapper element(s)
                  here, not a bare <video>. The `[&_*]:!w-full
                  [&_*]:!h-full` rule (with !important) forces every
                  injected descendant to fill this container instead
                  of falling back to EnableX's own inline
                  width/height, which is what previously produced a
                  small fixed-size box instead of a fullscreen
                  preview. */}
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
          <div className="relative z-10 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#D51659] animate-ping" />
              <span className="text-xs font-bold text-white tracking-wide">
                {isCaller ? "Calling..." : "Connecting..."}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-300 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              {callType === "video" ? "Video Call" : "Voice Call"}
            </span>
          </div>

          {/* Center Glass Card with Remote User Info & Status */}
          <div className="relative z-10 flex flex-col items-center justify-center px-6">
            <div className="bg-black/50 backdrop-blur-xl border border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full">
              {/* Pulsing Avatar */}
              <div className="relative mb-5 flex items-center justify-center">
                <span className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#D51659]/30 blur-xl animate-pulse" />
                <span
                  className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-[#D51659]/60 animate-ping"
                  style={{ animationDuration: "2.5s" }}
                />
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
                <span>
                  {isCaller
                    ? "Waiting for answer..."
                    : "Connecting to session..."}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Controls Bar on Connecting Screen */}
          <div className="relative z-10 p-6 pb-10 flex items-center justify-center gap-6">
            {/* Mic toggle */}
            <button
              onClick={toggleMic}
              className={`p-3.5 rounded-full transition-all duration-300 backdrop-blur-md ${
                micActive
                  ? "bg-black/50 text-white border border-white/15 hover:bg-black/70"
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
                className={`p-3.5 rounded-full transition-all duration-300 backdrop-blur-md ${
                  videoActive
                    ? "bg-black/50 text-white border border-white/15 hover:bg-black/70"
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
              className="p-4 rounded-full bg-[#D51659] hover:bg-[#D51659]/90 text-white hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(213,22,89,0.5)] flex items-center justify-center cursor-pointer"
              title="Cancel Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Active Call Screen ─────────────────────────────── */}
      {callStatus === "connected" && (
        <div className="flex-1 flex relative">
          {/* ── Main viewport ─────────────────────────── */}
          {callType === "audio" ? (
            /* ── Audio call UI ── */
            <div className="flex-1 h-full relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-[#150A1A] via-[#0A0A0A] to-[#1A0A15]">
              {/* Pulsing Aura */}
              <div className="relative mb-8 flex items-center justify-center">
                <span className="absolute w-52 h-52 rounded-full bg-[#D51659]/20 blur-2xl animate-pulse" />
                <span
                  className="absolute w-40 h-40 rounded-full border border-[#D51659]/40 animate-ping"
                  style={{ animationDuration: "3s" }}
                />
                <img
                  src={remoteUserPhoto || "https://via.placeholder.com/150"}
                  alt={remoteUserName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/10 shadow-[0_0_50px_rgba(213,22,89,0.4)] relative z-10"
                />
              </div>
              <h2 className="text-2xl font-black text-white tracking-wide drop-shadow-md">
                {remoteUserName}
              </h2>
              <p className="text-xs font-bold text-[#D51659] uppercase tracking-widest mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Voice Call Connected ({formatTime(duration)})
              </p>
              {/* Hidden audio player for remote */}
              <div id="remote_audio_player" style={{ display: "none" }} />
              {/* Animated Soundwave */}
              <div className="flex items-center gap-1.5 mt-8 h-10">
                {[40, 75, 30, 90, 50, 85, 45, 65, 100, 55, 80, 35, 70, 45].map(
                  (h, i) => (
                    <span
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-[#D51659] to-[#B44DDC] rounded-full animate-pulse"
                      style={{
                        height: micActive ? `${h}%` : "20%",
                        animationDelay: `${(i * 120) % 600}ms`,
                        animationDuration: "1.2s",
                      }}
                    />
                  ),
                )}
              </div>
            </div>
          ) : (
            /* ── Video call main UI ── */
            <div className="flex-1 h-full bg-[#121212] relative overflow-hidden">
              {/* EnableX Remote Video Container — fullscreen */}
              <div
                id="remote_video_player"
                className="absolute inset-0 w-full h-full overflow-hidden bg-black [&_*]:!w-full [&_*]:!h-full [&_video]:!object-cover z-0"
              />

              {/* Waiting for remote placeholder */}
              {!remoteStreamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121212] z-10">
                  <img
                    src={remoteUserPhoto || "https://via.placeholder.com/150"}
                    alt={remoteUserName}
                    className="w-24 h-24 rounded-full object-cover border-2 border-white/10 mb-3 opacity-50"
                  />
                  <p className="text-slate-500 text-sm">
                    Connecting video stream with {remoteUserName}...
                  </p>
                </div>
              )}

              {/* EnableX Local camera PiP — top-right corner */}
              <div
                className="absolute top-6 right-6 w-28 md:w-36 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-[#1a1a1a] z-20"
                style={{ aspectRatio: "9/16" }}
              >
                <div
                  id="local_pip_video"
                  className="w-full h-full [&_*]:!w-full [&_*]:!h-full [&_video]:!object-cover [&_video]:scale-x-[-1]"
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
                <h4 className="font-extrabold text-sm text-white drop-shadow-md">
                  {remoteUserName}
                </h4>
                <p className="text-[10px] font-bold text-[#D51659] uppercase tracking-wider drop-shadow-sm flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live Call · {formatTime(duration)}
                </p>
              </div>
            </div>
            {callType === "video" && (
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={() => setIsMutedSound((m) => !m)}
                  className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:bg-black/60 text-white transition-colors"
                  title={
                    isMutedSound ? "Unmute Remote Audio" : "Mute Remote Audio"
                  }
                >
                  {isMutedSound ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ── Bottom controls HUD ──────────────────────── */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 bg-black/50 border border-white/10 backdrop-blur-xl rounded-3xl flex items-center gap-5 md:gap-7 z-25 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            {/* Mic toggle */}
            <button
              onClick={toggleMic}
              className={`p-3 rounded-2xl transition-all duration-300 ${
                micActive
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-[#D51659]/30 text-[#D51659] border border-[#D51659]/50 hover:bg-[#D51659]/40"
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
                className={`p-3 rounded-2xl transition-all duration-300 ${
                  videoActive
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-[#D51659]/30 text-[#D51659] border border-[#D51659]/50 hover:bg-[#D51659]/40"
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
              className={`p-3 rounded-2xl transition-all duration-300 relative ${
                showChat
                  ? "bg-purple-500/30 text-purple-300 border border-purple-500/50 hover:bg-purple-500/40"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title="Session Chat"
            >
              <MessageSquare className="w-5 h-5" />
              {!showChat &&
                chatMessages.filter((m) => m.sender === "remote").length >
                  0 && (
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