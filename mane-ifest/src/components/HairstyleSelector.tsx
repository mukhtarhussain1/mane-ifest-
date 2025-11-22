import React from 'react';
import { useAppStore } from '../store/appState';
import { Check, Sparkles } from 'lucide-react';

export const HairstyleSelector: React.FC = () => {
  const { analysisResult, selectedHairstyleId, setSelectedHairstyleId } = useAppStore();
  
  if (!analysisResult) return null;

  return (
    <div className="w-full bg-black/40 backdrop-blur-2xl border-t border-white/10 p-6 pb-10 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-cyan-400" />
            <h3 className="text-white font-bold text-xl tracking-wide">
              {analysisResult.faceShape} <span className="text-white/50 font-normal">Detected</span>
            </h3>
          </div>
          <p className="text-white/60 text-xs font-medium max-w-xs leading-relaxed">
            {analysisResult.description}
          </p>
        </div>
      </div>
      
      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x px-2">
        {analysisResult.recommendations.map((style) => (
          <button
            key={style.id}
            onClick={() => setSelectedHairstyleId(style.id)}
            className={`
              group relative flex-shrink-0 w-44 h-60 rounded-2xl overflow-hidden snap-center transition-all duration-500
              ${selectedHairstyleId === style.id 
                ? 'ring-2 ring-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)] scale-105 translate-y-[-5px]' 
                : 'opacity-70 hover:opacity-100 hover:scale-100'
              }
            `}
          >
            {/* Background Gradient / Image Placeholder */}
            <div className={`absolute inset-0 bg-gradient-to-br ${selectedHairstyleId === style.id ? 'from-gray-800 to-gray-900' : 'from-gray-900 to-black'} transition-colors duration-500`}>
               <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
                  <span className="text-6xl filter drop-shadow-lg">💇‍♀️</span>
               </div>
            </div>
            
            {/* Glass Overlay Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent pt-12">
              <div className="text-white text-lg font-bold mb-1 leading-tight group-hover:text-cyan-300 transition-colors">{style.name}</div>
              <div className="text-white/60 text-[10px] leading-relaxed line-clamp-2 font-medium">{style.reason}</div>
            </div>

            {/* Selection Indicator */}
            {selectedHairstyleId === style.id && (
              <div className="absolute top-3 right-3 bg-cyan-400 rounded-full p-1 shadow-lg shadow-cyan-400/50 animate-in zoom-in duration-300">
                <Check size={14} className="text-black stroke-[3]" />
              </div>
            )}
            
            {/* Active Border Glow */}
            {selectedHairstyleId === style.id && (
              <div className="absolute inset-0 border-2 border-cyan-400/50 rounded-2xl pointer-events-none" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
