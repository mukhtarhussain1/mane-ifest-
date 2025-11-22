import React from 'react';
import { useAppStore } from '../store/appState';
import { Sparkles, Camera } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { setStep } = useAppStore();

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-between p-8 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-600/30 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-cyan-600/30 rounded-full blur-[120px] animate-pulse delay-1000" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center mt-20 text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 blur-lg opacity-50" />
          <div className="relative bg-black/50 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
            <Sparkles size={48} className="text-white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-purple-200 tracking-tight">
            Mane-ifest
          </h1>
          <p className="text-white/60 text-lg max-w-xs mx-auto leading-relaxed">
            Discover your perfect look with AI-powered hairstyle analysis.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="relative z-10 w-full max-w-xs mb-12">
        <button
          onClick={() => setStep('camera')}
          className="group relative w-full py-4 px-6 bg-white text-black rounded-full font-bold text-lg tracking-wide overflow-hidden transition-transform active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-center gap-3">
            <Camera size={24} />
            <span>Start Transformation</span>
          </div>
        </button>
        <p className="mt-4 text-center text-white/30 text-xs uppercase tracking-widest">
          Powered by Face Shape AI
        </p>
      </div>
    </div>
  );
};
