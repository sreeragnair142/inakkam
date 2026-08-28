import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, CheckCircle2, RotateCcw, AlertCircle, Video } from 'lucide-react';

const Step4Facial = ({ data, onChange }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [camState, setCamState] = useState('idle'); // idle | active | captured | error
  const [permError, setPermError] = useState('');

  const startCamera = useCallback(async () => {
    setPermError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamState('active');
    } catch (err) {
      setPermError(err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : 'Unable to access camera. Please ensure your device has a camera.');
      setCamState('error');
    }
  }, []);

  // Auto-start camera when component mounts (if no selfie taken yet)
  useEffect(() => {
    if (!data.selfieImage) {
      startCamera();
    }
    return () => {
      // Cleanup: stop camera stream when leaving this step
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCamState('idle');
  }, []);

  const captureSelfie = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    onChange({ ...data, selfieImage: dataUrl });
    setCamState('captured');
  }, [data, onChange, stopCamera]);

  const retake = () => {
    onChange({ ...data, selfieImage: null });
    setCamState('idle');
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div className="text-xs text-purple-300 space-y-1">
            <p className="font-bold">Please ensure your face is clearly visible.</p>
            <p className="text-purple-300/70">Good lighting · Face the camera directly · No sunglasses or masks</p>
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto space-y-4">
        {/* Camera / preview area */}
        <div className="relative rounded-3xl overflow-hidden bg-black/40 border border-white/10 aspect-[4/3]">
          {camState === 'active' && (
            <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline autoPlay muted />
          )}
          {(camState === 'captured' && data.selfieImage) && (
            <img src={data.selfieImage} alt="Selfie" className="w-full h-full object-cover scale-x-[-1]" />
          )}
          {(camState === 'idle' || camState === 'error') && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6">
              <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-dashed border-white/15 flex items-center justify-center">
                <Video className="w-8 h-8 text-white/25" />
              </div>
              <p className="text-xs text-white/30 text-center">Camera preview will appear here</p>
              {permError && <p className="text-xs text-red-400 text-center font-medium">{permError}</p>}
            </div>
          )}

          {/* Live indicator */}
          {camState === 'active' && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wide">Live</span>
            </div>
          )}

          {/* Captured badge */}
          {camState === 'captured' && (
            <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="flex gap-3">
          {camState === 'idle' || camState === 'error' ? (
            <button onClick={startCamera}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
              <Camera className="w-4 h-4" /> Open Camera
            </button>
          ) : camState === 'active' ? (
            <>
              <button onClick={stopCamera}
                className="py-3 px-5 rounded-2xl bg-white/10 border border-white/10 text-white text-sm font-bold hover:bg-white/15 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={captureSelfie}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
                <Camera className="w-4 h-4" /> Capture Selfie
              </button>
            </>
          ) : (
            <button onClick={retake}
              className="flex-1 py-3 rounded-2xl bg-white/10 border border-white/10 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/15 transition-colors cursor-pointer">
              <RotateCcw className="w-4 h-4" /> Retake Photo
            </button>
          )}
        </div>

        {camState === 'captured' && (
          <p className="text-center text-xs text-green-400 font-bold">✓ Selfie captured successfully</p>
        )}
      </div>
    </div>
  );
};

export default Step4Facial;
