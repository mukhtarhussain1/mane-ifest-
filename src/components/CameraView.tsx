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
               // Countdown logic
               // Since we throttled to 10fps, 10 frames = 1 second
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
          className="p-3 sm:p-2 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X size={24} />
        </button>
        <div className="text-white/90 text-sm sm:text-base font-semibold tracking-wide uppercase">
          {tempImage ? "Review Photo" : "Align Your Face"}
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
              className={`absolute inset-0 pointer-events-none flex items-center justify-center transition-all duration-300 ${
                isAligned ? 'scale-105' : 'scale-100'
              }`}
            >
              <svg
                viewBox="0 0 100 100"
                className={`w-[85%] h-[65%] md:w-[40%] md:h-[50%] lg:w-[35%] lg:h-[45%] transition-all duration-300 ${
                  isAligned 
                    ? 'stroke-green-400 stroke-[1.5] drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]' 
                    : 'stroke-white/50 stroke-[0.5]'
                } fill-none`}
              >
                <ellipse cx="50" cy="50" rx="35" ry="45" strokeDasharray={isAligned ? "0" : "4 2"} />
                {!isAligned && (
                  <>
                    <line x1="50" y1="20" x2="50" y2="80" strokeDasharray="2 2" />
                    <line x1="30" y1="45" x2="70" y2="45" strokeDasharray="2 2" />
                  </>
                )}
              </svg>
              
              {isAligned && !countdown && (
                 <div className="absolute mt-64 bg-green-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-green-500/30 text-green-300 text-sm font-medium animate-pulse">
                    Hold Still
                 </div>
              )}
            </div>

            {/* Countdown Overlay */}
            {countdown && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/20 backdrop-blur-[2px]">
                <div className="text-9xl font-bold text-white animate-ping">
                  {countdown}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex justify-center items-center pb-safe-bottom bg-gradient-to-t from-black/90 to-transparent">
        {tempImage ? (
          <div className="flex gap-8">
             <button
              onClick={handleRetake}
              className="flex flex-col items-center gap-2 sm:gap-3 text-white/80 hover:text-white transition-colors active:scale-95 min-w-[80px]"
            >
              <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all">
                <RotateCcw size={24} />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider">Retake</span>
            </button>
            
            <button
              onClick={handleConfirm}
              className="flex flex-col items-center gap-2 sm:gap-3 text-cyan-400 hover:text-cyan-300 transition-colors active:scale-95 min-w-[80px]"
            >
              <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-cyan-500/20 backdrop-blur-md flex items-center justify-center border-2 border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] transition-all">
                <Check size={36} className="sm:size-32" />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider">Use Photo</span>
            </button>
          </div>
        ) : (
          <button
            onClick={captureImage}
            className={`w-20 h-20 sm:w-20 sm:h-20 rounded-full border-4 flex items-center justify-center backdrop-blur-sm transition-all active:scale-95 ${isAligned ? 'border-green-400 bg-green-400/20 shadow-[0_0_30px_rgba(74,222,128,0.4)]' : 'border-white bg-white/20 hover:bg-white/30'}`}
          >
            <div className={`w-16 h-16 rounded-full transition-colors ${isAligned ? 'bg-green-400' : 'bg-white'}`} />
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
