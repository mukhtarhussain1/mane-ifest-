import React from 'react';
import { Construction, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/appState';

export const GenderRestrictionMessage: React.FC = () => {
  const { setStep, setCapturedImage, setAnalysisResult } = useAppStore();

  const handleTryAgain = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setStep('camera');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 text-center space-y-8 animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-pink-500 blur-3xl opacity-20 animate-pulse" />
        <div className="relative p-6 bg-white/5 rounded-full border border-pink-500/30 backdrop-blur-sm">
          <Construction size={64} className="text-pink-400" />
        </div>
      </div>

      <div className="space-y-4 max-w-xs">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
          Boys Only!
        </h2>
        <p className="text-gray-300 leading-relaxed">
          Oops! It looks like this feature is just for the boys right now.
        </p>
        <p className="text-gray-400 text-sm italic border-l-2 border-pink-500/30 pl-4 py-2 bg-white/5 rounded-r-lg">
          "Our lazy engineers are still working to make it for girls too! Please check back later."
        </p>
      </div>

      <button
        onClick={handleTryAgain}
        className="group flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full font-semibold transition-all duration-300 border border-white/10 hover:border-pink-500/30"
      >
        <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
        <span>Try Again</span>
      </button>
    </div>
  );
};
