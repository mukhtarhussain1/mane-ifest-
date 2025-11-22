import React from 'react';
import { useAppStore } from '../store/appState';
import { Sparkles, Camera, Zap } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { setStep } = useAppStore();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black flex flex-col items-center justify-between p-6 sm:p-8 overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-600/20 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-cyan-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-pink-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center mt-16 sm:mt-20 md:mt-24 text-center space-y-6 sm:space-y-8">
        {/* Icon with glow */}
        <div className="relative animate-float" style={{ animationDuration: '3s' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 blur-2xl opacity-60 animate-pulse" />
          <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/20 shadow-2xl">
            <Sparkles size={56} className="text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-400" strokeWidth={1.5} />
          </div>
        </div>
        
        {/* Title and Description */}
        <div className="space-y-3 sm:space-y-4 px-4">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-purple-200 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
            Mane-ifest
          </h1>
          <p className="text-white/70 text-base sm:text-lg md:text-xl max-w-md mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '100ms' }}>
            Discover your perfect look with AI-powered hairstyle analysis
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-2 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
              <Zap size={14} className="text-cyan-400" />
              <span className="text-xs text-white/60 font-medium">Instant Analysis</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
              <Sparkles size={14} className="text-purple-400" />
              <span className="text-xs text-white/60 font-medium">AI Powered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="relative z-10 w-full max-w-sm mb-8 sm:mb-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '300ms' }}>
        <button
          onClick={() => setStep('camera')}
          className="group relative w-full py-4 sm:py-5 px-6 bg-gradient-to-r from-white to-gray-100 text-black rounded-full font-bold text-base sm:text-lg tracking-wide overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          
          <div className="relative flex items-center justify-center gap-3">
            <Camera size={24} className="group-hover:rotate-12 transition-transform duration-300" />
            <span>Start Transformation</span>
          </div>
        </button>
        
        <p className="mt-4 text-center text-white/40 text-xs sm:text-sm uppercase tracking-widest font-semibold">
          Powered by Advanced AI
        </p>
      </div>
    </div>
  );
};
