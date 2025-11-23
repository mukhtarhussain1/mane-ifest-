import React from 'react';
import { Camera, Sparkles, Scissors, Zap } from 'lucide-react';
import { useAppStore } from '../store/appState';

export const WelcomeScreen: React.FC = () => {
  const { setStep } = useAppStore();

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden bg-black text-white">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-600/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-cyan-500/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center px-8 max-w-md w-full text-center space-y-12">
        
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 blur-2xl opacity-30 animate-pulse-slow" />
            <h1 className="relative text-6xl sm:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/60 drop-shadow-2xl">
              Mane-ifest
            </h1>
            <Sparkles className="absolute -top-6 -right-8 text-cyan-400 animate-bounce-slow" size={32} />
          </div>
          <p className="text-lg sm:text-xl text-white/70 font-light tracking-wide leading-relaxed max-w-xs mx-auto">
            Discover your perfect look with AI-powered hairstyle visualization.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {[
            { icon: Camera, label: "Scan", delay: "0s" },
            { icon: Zap, label: "Analyze", delay: "0.1s" },
            { icon: Scissors, label: "Style", delay: "0.2s" }
          ].map((feature, idx) => (
            <div 
              key={idx}
              className="glass-panel rounded-2xl p-4 flex flex-col items-center gap-3 transition-transform hover:scale-105 duration-300"
              style={{ animation: `float 6s ease-in-out ${feature.delay} infinite` }}
            >
              <div className="p-3 rounded-full bg-white/5 border border-white/10 text-cyan-300">
                <feature.icon size={24} />
              </div>
              <span className="text-xs font-medium tracking-wider uppercase text-white/60">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => setStep('camera')}
          className="group relative w-full max-w-xs"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500" />
          <div className="relative flex items-center justify-center gap-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full py-5 px-8 transition-all duration-300 group-hover:bg-black/60 group-active:scale-95">
            <span className="text-lg font-bold tracking-widest uppercase bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent group-hover:text-white transition-colors">
              Start Transformation
            </span>
            <Camera className="text-white/80 group-hover:text-cyan-400 transition-colors" size={20} />
          </div>
        </button>

        {/* Footer */}
        <p className="text-xs text-white/30 font-medium tracking-widest uppercase">
          Powered by Gemini & DALL-E 2
        </p>
      </div>
    </div>
  );
};
