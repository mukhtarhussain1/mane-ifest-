import React, { useState } from 'react';
import { useAppStore } from '../store/appState';
import { Check, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

export const HairstyleSelector: React.FC = () => {
  const { analysisResult, selectedHairstyleId, setSelectedHairstyleId } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (!analysisResult) return null;

  const selectedStyleName = analysisResult.recommendations.find(r => r.id === selectedHairstyleId)?.name;

  return (
    <div 
      className={`
        w-full bg-gradient-to-t from-black via-black/95 to-black/80 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]
        transition-all duration-500 ease-in-out pb-16
        ${isExpanded ? 'rounded-t-[2.5rem] pb-safe-bottom' : 'rounded-t-3xl pb-safe-bottom'}
      `}
    >
      {/* Toggle Handle */}
      <div 
        className="flex z-10 justify-center pt-4 pb-2 cursor-pointer active:scale-95 transition-transform"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-1.5 bg-white/30 rounded-full hover:bg-white/40 transition-colors" />
      </div>

      {/* Header Section */}
      <div className="px-6 mb-4 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-cyan-400" />
            <h3 className="text-white font-bold text-lg sm:text-xl tracking-wide">
              {analysisResult.faceShape} <span className="text-white/50 font-normal text-base">Shape</span>
            </h3>
          </div>
          {isExpanded && (
            <p className="text-white/70 text-xs sm:text-sm font-medium max-w-sm leading-relaxed mt-2 animate-in fade-in duration-300">
              {analysisResult.description}
            </p>
          )}
        </div>
        <button className="p-2 text-white/50 hover:text-white transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center">
          {isExpanded ? <ChevronDown size={22} /> : <ChevronUp size={22} />}
        </button>
      </div>
      
      {/* Content Area */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[320px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-6 pt-10 scrollbar-hide snap-x snap-mandatory px-6 -mx-6 pl-6">
          {analysisResult.recommendations.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedHairstyleId(style.id)}
              className={`
                group relative flex-shrink-0 w-44 sm:w-48 h-60 sm:h-64 rounded-2xl overflow-hidden snap-center transition-all duration-300
                ${selectedHairstyleId === style.id 
                  ? 'ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.4)] scale-105 translate-y-[-8px]' 
                  : 'opacity-80 hover:opacity-100 hover:scale-102 active:scale-100'
                }
              `}
            >
              {/* Background Gradient / Image Placeholder */}
              <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${selectedHairstyleId === style.id ? 'from-gray-800 via-gray-850 to-gray-900' : 'from-gray-900 to-black'}`}>
                 <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 group-active:opacity-60 transition-opacity">
                    <span className="text-6xl filter drop-shadow-lg">💇‍♀️</span>
                 </div>
                 {/* Shimmer effect on hover */}
                 <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              </div>
              
              {/* Glass Overlay Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent pt-12">
                <div className="text-white text-base sm:text-lg font-bold mb-1 leading-tight group-hover:text-cyan-300 transition-colors">{style.name}</div>
                <div className="text-white/70 text-[11px] sm:text-xs leading-relaxed line-clamp-2 font-medium">{style.reason}</div>
              </div>

              {/* Selection Indicator */}
              {selectedHairstyleId === style.id && (
                <div className="absolute top-3 right-3 bg-cyan-400 rounded-full p-1.5 shadow-lg shadow-cyan-400/50 animate-in zoom-in duration-300">
                  <Check size={14} className="text-black stroke-[3]" />
                </div>
              )}
              
              {/* Pulse ring for selected */}
              {selectedHairstyleId === style.id && (
                <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/50 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Mode Selection Display */}
      {!isExpanded && selectedStyleName && (
        <div className="px-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
            <span className="text-white text-sm sm:text-base font-medium">Selected: <span className="text-cyan-400 font-semibold">{selectedStyleName}</span></span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="text-xs sm:text-sm text-white/70 hover:text-white uppercase tracking-wider font-bold transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center px-3"
            >
              Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
