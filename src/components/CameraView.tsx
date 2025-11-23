import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import { useAppStore } from '../store/appState';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

export const CameraView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isAligned, setIsAligned] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const { setCapturedImage, setStep } = useAppStore();
  
  // Face Detection Refs
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const requestRef = useRef<number>(0);
  const alignmentFramesRef = useRef<number>(0);
  const lastDetectionTimeRef = useRef<number>(0);

  // Initialize Face Detector
  useEffect(() => {
    const initializeDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
            delegate: "GPU"
          },
          runningMode: "VIDEO"
        });
      } catch (err) {
        console.error("Failed to initialize face detector:", err);
      }
    };
    initializeDetector();
  }, []);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      // Trigger Flash
      setFlash(true);
      setTimeout(() => setFlash(false), 150);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Flip horizontally for mirror effect
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/png');
        
        // Small delay to let flash finish before showing preview
        setTimeout(() => {
          setTempImage(imageData);
        }, 100);
        
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
      }
    }
  }, []);

  // Detection Loop
  const detectFace = useCallback(async () => {
    if (!faceDetectorRef.current || !videoRef.current || tempImage) return;

    const video = videoRef.current;
    const now = performance.now();

    // Throttle detection to ~10fps (every 100ms) to save battery
    if (now - lastDetectionTimeRef.current < 100) {
      requestRef.current = requestAnimationFrame(detectFace);
      return;
    }
    lastDetectionTimeRef.current = now;

    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      
      const detections = faceDetectorRef.current.detectForVideo(video, now);
      
      if (detections.detections.length > 0) {
        const face = detections.detections[0].boundingBox;
        
        const vWidth = video.videoWidth;
        const vHeight = video.videoHeight;
        
        if (vWidth > 0 && vHeight > 0 && face) {
          const faceCenterX = face.originX + face.width / 2;
          const faceCenterY = face.originY + face.height / 2;
          
          const frameCenterX = vWidth / 2;
          const frameCenterY = vHeight / 2;
          
          const xTol = vWidth * 0.15;
          const yTol = vHeight * 0.15;
          
          const isCenteredX = Math.abs(faceCenterX - frameCenterX) < xTol;
          const isCenteredY = Math.abs(faceCenterY - frameCenterY) < yTol;
          
          const faceRatio = face.width / vWidth;
          const isGoodSize = faceRatio > 0.2 && faceRatio < 0.8;

          if (isCenteredX && isCenteredY && isGoodSize) {
            setIsAligned(true);
            alignmentFramesRef.current += 1;
            
            // Auto-capture logic
            if (alignmentFramesRef.current === 30) { // ~3 seconds of alignment (at 10fps)
               setCountdown(3);
            } else if (alignmentFramesRef.current > 30) {
               const framesSinceTrigger = alignmentFramesRef.current - 30;
               if (framesSinceTrigger === 10) setCountdown(2);
               if (framesSinceTrigger === 20) setCountdown(1);
               if (framesSinceTrigger === 30) {
                 setCountdown(null);
                 captureImage();
                 alignmentFramesRef.current = 0;
               }
            }
          } else {
            setIsAligned(false);
            alignmentFramesRef.current = 0;
            setCountdown(null);
          }
        }
      } else {
        setIsAligned(false);
        alignmentFramesRef.current = 0;
        setCountdown(null);
      }
    }
    requestRef.current = requestAnimationFrame(detectFace);
  }, [captureImage, tempImage]);

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
          videoRef.current.addEventListener('loadeddata', () => {
             detectFace();
          });
        }
      } catch (err) {
        setError('Unable to access camera. Please ensure you have granted permission.');
        console.error("Camera error:", err);
      }
    };

    if (!tempImage) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [detectFace, tempImage]);

  const handleConfirm = () => {
    if (tempImage) {
      setCapturedImage(tempImage);
      setStep('analyzing');
    }
  };

  const handleRetake = () => {
    setTempImage(null);
    setIsAligned(false);
    setCountdown(null);
    alignmentFramesRef.current = 0;
  };

  const handleClose = () => {
    setStep('home');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden safe-area-inset">
      {/* Flash Overlay */}
      <div className={`absolute inset-0 bg-white z-[60] pointer-events-none transition-opacity duration-150 ${flash ? 'opacity-100' : 'opacity-0'}`} />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 pt-safe-top flex justify-between items-center z-10">
        <button 
          onClick={handleClose}
          className="glass-button p-3 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X size={24} />
        </button>
        <div className="glass-panel px-4 py-1.5 rounded-full text-white/90 text-xs font-semibold tracking-widest uppercase backdrop-blur-md border-white/5">
          {tempImage ? "Review" : "Align Face"}
        </div>
        <div className="w-10" />
      </div>

      {/* Camera Feed / Review Image */}
      <div className="relative w-full h-full">
        {error ? (
          <div className="flex items-center justify-center h-full text-white p-6 text-center">
            {error}
          </div>
        ) : tempImage ? (
          <img 
            src={tempImage} 
            alt="Captured" 
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            
            {/* Face Guide Overlay */}
            <div
              className={`absolute inset-0 pointer-events-none flex items-center justify-center transition-all duration-500 ${
                isAligned ? 'scale-105' : 'scale-100'
              }`}
            >
              <div className={`relative w-[85%] h-[65%] md:w-[40%] md:h-[50%] lg:w-[35%] lg:h-[45%] transition-all duration-500`}>
                {/* Corner Brackets */}
                <div className={`absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 rounded-tl-3xl transition-colors duration-300 ${isAligned ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]' : 'border-white/30'}`} />
                <div className={`absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 rounded-tr-3xl transition-colors duration-300 ${isAligned ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]' : 'border-white/30'}`} />
                <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 rounded-bl-3xl transition-colors duration-300 ${isAligned ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]' : 'border-white/30'}`} />
                <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 rounded-br-3xl transition-colors duration-300 ${isAligned ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]' : 'border-white/30'}`} />
                
                {/* Center Ellipse (Subtle) */}
                <div className={`absolute inset-4 border border-dashed rounded-[45%] transition-colors duration-300 ${isAligned ? 'border-cyan-400/30' : 'border-white/10'}`} />
              </div>
              
              {isAligned && !countdown && (
                 <div className="absolute mt-64 glass-panel px-6 py-2 rounded-full text-cyan-300 text-sm font-bold tracking-widest uppercase animate-pulse shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                    Hold Still
                 </div>
              )}
            </div>

            {/* Countdown Overlay */}
            {countdown && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 backdrop-blur-sm">
                <div className="text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/0 animate-ping">
                  {countdown}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 flex justify-center items-center pb-safe-bottom bg-gradient-to-t from-black via-black/80 to-transparent">
        {tempImage ? (
          <div className="flex gap-12 items-center">
             <button
              onClick={handleRetake}
              className="group flex flex-col items-center gap-3 text-white/60 hover:text-white transition-colors"
            >
              <div className="w-14 h-14 rounded-full glass-button flex items-center justify-center group-hover:bg-white/20">
                <RotateCcw size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Retake</span>
            </button>
            
            <button
              onClick={handleConfirm}
              className="group flex flex-col items-center gap-3 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <div className="w-20 h-20 rounded-full bg-cyan-500/20 backdrop-blur-xl flex items-center justify-center border border-cyan-500/50 shadow-[0_0_40px_rgba(34,211,238,0.3)] group-hover:scale-105 transition-all duration-300">
                <Check size={32} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Confirm</span>
            </button>
          </div>
        ) : (
          <button
            onClick={captureImage}
            className={`group relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isAligned ? 'scale-110' : 'scale-100'}`}
          >
            <div className={`absolute inset-0 rounded-full border-[6px] transition-colors duration-300 ${isAligned ? 'border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.4)]' : 'border-white/30'}`} />
            <div className={`w-18 h-18 rounded-full transition-all duration-300 ${isAligned ? 'bg-cyan-400 scale-90' : 'bg-white scale-75 group-hover:scale-90'}`} />
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
