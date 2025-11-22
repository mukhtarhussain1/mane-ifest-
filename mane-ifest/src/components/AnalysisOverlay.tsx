import React, { useEffect, useState } from 'react';
import { Scan, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/appState';
import { analyzeFaceWithGemini } from '../services/gemini';

export const AnalysisOverlay: React.FC = () => {
  const { capturedImage, setAnalysisResult, setStep } = useAppStore();
  const [statusText, setStatusText] = useState('Initializing AI...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analyze = async () => {
      if (!capturedImage) return;

      try {
        setStatusText('Uploading to Gemini...');
        await new Promise(r => setTimeout(r, 800)); // Small delay for UX

        setStatusText('Analyzing facial features...');
        const result = await analyzeFaceWithGemini(capturedImage);
        
        setStatusText('Generating recommendations...');
        await new Promise(r => setTimeout(r, 500));

        setAnalysisResult(result);
        setStep('results');
      } catch (err) {
        console.error(err);
        setError('Analysis failed. Please check your API key and try again.');
        setStatusText('Error');
      }
    };

    analyze();
  }, [capturedImage, setAnalysisResult, setStep]);

  if (!capturedImage) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 opacity-40">
        <img src={capturedImage} alt="Analysis" className="w-full h-full object-cover blur-sm" />
      </div>

      {/* Scanning Line Animation */}
      {!error && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="w-full h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 p-8 w-full max-w-md">
        <div className="relative">
          <div className={`absolute inset-0 ${error ? 'bg-red-500' : 'bg-cyan-500'} blur-xl opacity-20 animate-pulse`} />
          {error ? (
            <AlertCircle size={64} className="text-red-400" />
          ) : (
            <Scan size={64} className="text-cyan-400" />
          )}
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-wider uppercase">
            {error ? 'Analysis Failed' : 'AI Analysis'}
          </h2>
          <p className={`${error ? 'text-red-200' : 'text-cyan-200/80'} font-mono text-sm`}>
            {error || statusText}
          </p>
        </div>

        {error && (
          <button 
            onClick={() => setStep('camera')}
            className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
