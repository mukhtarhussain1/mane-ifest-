import React, { useEffect, useState } from 'react';
import { Scan, AlertCircle, Sparkles, Zap } from 'lucide-react';
import { useAppStore } from '../store/appState';
import { analyzeFaceWithGemini } from '../services/gemini';

export const AnalysisOverlay: React.FC = () => {
  const { capturedImage, setAnalysisResult, setStep } = useAppStore();
  const [statusText, setStatusText] = useState('Initializing AI...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analyze = async () => {
      if (!capturedImage) return;

      try {
        setStatusText('Uploading to Gemini...');
        setProgress(20);
        await new Promise(r => setTimeout(r, 800));

        setStatusText('Analyzing facial features...');
        setProgress(40);
        const result = await analyzeFaceWithGemini(capturedImage);
        
        setStatusText('Processing AI insights...');
        setProgress(70);
        await new Promise(r => setTimeout(r, 500));

        setStatusText('Generating recommendations...');
        setProgress(90);
        await new Promise(r => setTimeout(r, 400));

        setProgress(100);
        setAnalysisResult(result);
        setStep('results');
      } catch (err) {
        console.error(err);
        setError('Analysis failed. Please check your API key and try again.');
        setStatusText('Error');
        setProgress(0);
      }
    };

    analyze();
  }, [capturedImage, setAnalysisResult, setStep]);

  if (!capturedImage) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 opacity-30">
        <img src={capturedImage} alt="Analysis" className="w-full h-full object-cover blur-md scale-110" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      </div>

      {/* Scanning Line Animation */}
      {!error && (
        <div className="absolute inset-0 overflow-hidden opacity-60">
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-[scan_3s_ease-in-out_infinite]" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 p-6 sm:p-8 w-full max-w-md">
        {/* Icon */}
        <div className="relative">
          <div className={`absolute inset-0 ${error ? 'bg-red-500' : 'bg-cyan-500'} blur-2xl opacity-30 animate-pulse`} />
          <div className={`relative p-6 rounded-full ${error ? 'bg-red-500/10' : 'bg-cyan-500/10'} backdrop-blur-sm border ${error ? 'border-red-500/30' : 'border-cyan-500/30'}`}>
            {error ? (
              <AlertCircle size={56} className="text-red-400" strokeWidth={1.5} />
            ) : (
              <div className="relative">
                <Scan size={56} className="text-cyan-400 animate-pulse" strokeWidth={1.5} />
                <Sparkles size={20} className="absolute -top-1 -right-1 text-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center space-y-3 sm:space-y-4">
          <h2 className={`text-2xl sm:text-3xl font-bold tracking-wider uppercase ${error ? 'text-red-400' : 'text-white'}`}>
            {error ? 'Analysis Failed' : 'AI Analysis'}
          </h2>
          <p className={`${error ? 'text-red-200' : 'text-cyan-200/90'} font-medium text-sm sm:text-base px-4`}>
            {error || statusText}
          </p>
          
          {/* Progress Bar */}
          {!error && (
            <div className="w-full max-w-xs mx-auto space-y-2">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-white/60">
                <Zap size={12} className="text-cyan-400" />
                <span>{progress}% Complete</span>
              </div>
            </div>
          )}
        </div>

        {/* Error Action */}
        {error && (
          <button 
            onClick={() => setStep('camera')}
            className="mt-2 px-6 py-3 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full text-white text-sm font-semibold transition-all duration-200 border border-white/20"
          >
            Try Again
          </button>
        )}

        {/* Loading Indicators */}
        {!error && (
          <div className="flex gap-1.5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
