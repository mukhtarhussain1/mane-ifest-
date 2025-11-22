import React, { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../store/appState';

export const CameraView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setCapturedImage, setStep } = useAppStore();

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Unable to access camera. Please ensure you have granted permission.');
        console.error("Camera error:", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Flip horizontally for mirror effect if using front camera (usually default)
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/png');
        setCapturedImage(imageData);
        setStep('analyzing');
      }
    }
  };

  const handleClose = () => {
    setStep('home');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <button 
          onClick={handleClose}
          className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
        >
          <X size={24} />
        </button>
        <div className="text-white/80 text-sm font-medium tracking-wide uppercase">Align Your Face</div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Camera Feed */}
      <div className="relative w-full h-full">
        {error ? (
          <div className="flex items-center justify-center h-full text-white p-6 text-center">
            {error}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100" // Mirror effect
          />
        )}
        
        {/* Face Guide Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-[80%] h-[60%] opacity-50 stroke-white stroke-[0.5] fill-none">
            {/* Simple oval shape for face guide */}
            <ellipse cx="50" cy="50" rx="30" ry="40" strokeDasharray="4 2" />
            {/* Crosshair for eyes/nose alignment */}
            <line x1="50" y1="20" x2="50" y2="80" strokeDasharray="2 2" />
            <line x1="30" y1="45" x2="70" y2="45" strokeDasharray="2 2" />
          </svg>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-10 flex justify-center items-center pb-16 bg-gradient-to-t from-black/80 to-transparent">
        <button
          onClick={handleCapture}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-all active:scale-95"
        >
          <div className="w-16 h-16 rounded-full bg-white" />
        </button>
      </div>

      {/* Hidden Canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
