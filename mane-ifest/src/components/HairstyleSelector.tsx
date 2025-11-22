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
        w-full bg-black/60 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
        transition-all duration-500 ease-in-out
        ${isExpanded ? 'rounded-t-[2.5rem] pb-10' : 'rounded-t-3xl pb-6'}
      `}
    >
      {/* Toggle Handle */}
      <div 
        className="flex justify-center pt-3 pb-1 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full" />
      </div>

      {/* Header Section */}
      <div className="px-6 mb-4 flex items-center justify-between" onClick={() => setIsExpanded(!isExpanded)}>
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-cyan-400" />
            <h3 className="text-white font-bold text-lg tracking-wide">
              {analysisResult.faceShape} <span className="text-white/50 font-normal">Shape</span>
            </h3>
          </div>
          {isExpanded && (
            <p className="text-white/60 text-xs font-medium max-w-xs leading-relaxed mt-1 animate-in fade-in duration-300">
              {analysisResult.description}
            </p>
          )}
        </div>
        <button className="p-2 text-white/40 hover:text-white transition-colors">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>
      
      {/* Content Area */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x px-6">
          {analysisResult.recommendations.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedHairstyleId(style.id)}
              className={`
                group relative flex-shrink-0 w-40 h-56 rounded-2xl overflow-hidden snap-center transition-all duration-300
                ${selectedHairstyleId === style.id 
                  ? 'ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] scale-105 translate-y-[-5px]' 
                  : 'opacity-70 hover:opacity-100 hover:scale-100'
                }
              `}
            >
              {/* Background Gradient / Image Placeholder */}
              <div className={`absolute inset-0 bg-gradient-to-br ${selectedHairstyleId === style.id ? 'from-gray-800 to-gray-900' : 'from-gray-900 to-black'} transition-colors duration-500`}>
                 <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
                    <span className="text-5xl filter drop-shadow-lg">💇‍♀️</span>
                 </div>
              </div>
              
              {/* Glass Overlay Content */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent pt-10">
                <div className="text-white text-base font-bold mb-0.5 leading-tight group-hover:text-cyan-300 transition-colors">{style.name}</div>
                <div className="text-white/60 text-[10px] leading-relaxed line-clamp-2 font-medium">{style.reason}</div>
              </div>

              {/* Selection Indicator */}
              {selectedHairstyleId === style.id && (
                <div className="absolute top-2 right-2 bg-cyan-400 rounded-full p-1 shadow-lg shadow-cyan-400/50 animate-in zoom-in duration-300">
                  <Check size={12} className="text-black stroke-[3]" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Mode Selection Display */}
      {!isExpanded && selectedStyleName && (
        <div className="px-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-white text-sm font-medium">Selected: <span className="text-cyan-400">{selectedStyleName}</span></span>
            <button 
              onClick={() => setIsExpanded(true)}
              className="text-xs text-white/60 hover:text-white uppercase tracking-wider font-bold"
            >
              Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
