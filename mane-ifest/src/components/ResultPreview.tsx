import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appState';
import { ArrowLeft, Share2, Download, Wand2, Sparkles, ChevronUp } from 'lucide-react';
import { HairstyleSelector } from './HairstyleSelector';
import { generateHairstyleDetails } from '../services/gemini';

export const ResultPreview: React.FC = () => {
  const { capturedImage, setStep, selectedHairstyleId, analysisResult, generatedResult, setGeneratedResult } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);

  // Reset generated result when selection changes
  useEffect(() => {
    setGeneratedResult(null);
    setShowDetailsSheet(false);
  }, [selectedHairstyleId, setGeneratedResult]);

  const handleGenerate = async () => {
    if (!capturedImage || !selectedHairstyleId || !analysisResult) return;

    const selectedStyle = analysisResult.recommendations.find(r => r.id === selectedHairstyleId);
    if (!selectedStyle) return;

    setIsGenerating(true);
    try {
      const result = await generateHairstyleDetails(
        capturedImage, 
        selectedStyle.name, 
        analysisResult
      );
      setGeneratedResult(result);
      setShowDetailsSheet(true);
    } catch (error) {
      console.error("Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!capturedImage) return null;

  const selectedStyleName = analysisResult?.recommendations.find(r => r.id === selectedHairstyleId)?.name;

  return (
    <div className="fixed inset-0 bg-black flex flex-col font-sans">
      {/* Header - Minimalist */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-12 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent">
        <button 
          onClick={() => setStep('camera')}
          className="p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-3">
          {generatedResult && (
            <>
              <button className="p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 transition-all">
                <Download size={24} />
              </button>
              <button className="p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 transition-all">
                <Share2 size={24} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Image Area - Full Screen */}
      <div className="relative flex-1 w-full h-full bg-gray-900">
        <img 
          src={generatedResult?.image || capturedImage} 
          alt="Result" 
          className={`w-full h-full object-cover transition-all duration-700 ${isGenerating ? 'scale-105 blur-lg opacity-50' : 'scale-100 opacity-100'}`}
        />
        
        {/* Loading State */}
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse" />
              <Sparkles size={48} className="text-cyan-400 animate-spin-slow" />
            </div>
            <div className="mt-6 text-center space-y-2">
              <div className="text-2xl font-bold text-white tracking-wider uppercase animate-pulse">Crafting Look</div>
              <div className="text-cyan-400/80 text-sm font-mono">Consulting AI Stylist...</div>
            </div>
          </div>
        )}

        {/* Call to Action Overlay */}
        {!generatedResult && !isGenerating && selectedStyleName && (
          <div className="absolute bottom-40 left-0 right-0 flex justify-center z-10 pointer-events-none">
             <div className="px-6 py-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 animate-bounce-slow">
                <p className="text-white text-sm font-medium flex items-center gap-2">
                  <Wand2 size={14} className="text-cyan-400" />
                  Tap "Generate" to see {selectedStyleName}
                </p>
             </div>
          </div>
        )}
        
        {/* Generation Button */}
        {!isGenerating && !generatedResult && selectedHairstyleId && (
          <div className="absolute bottom-24 left-0 right-0 flex justify-center z-30 px-6">
            <button 
              onClick={handleGenerate}
              className="w-full max-w-xs group flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-all active:scale-95"
            >
              <Wand2 size={20} className="group-hover:rotate-12 transition-transform" />
              <span className="tracking-wide">GENERATE LOOK</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Sheet for Details */}
      {generatedResult && (
        <div 
          className={`
            absolute bottom-0 left-0 right-0 z-40 bg-[#1a1a1a] rounded-t-[2rem] border-t border-white/10 shadow-[0_-10px_50px_rgba(0,0,0,0.8)]
            transition-transform duration-500 ease-out
            ${showDetailsSheet ? 'translate-y-0' : 'translate-y-[85%]'}
          `}
        >
          {/* Drag Handle / Header */}
          <div 
            className="w-full p-4 flex flex-col items-center cursor-pointer"
            onClick={() => setShowDetailsSheet(!showDetailsSheet)}
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mb-4" />
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <Sparkles size={18} className="text-cyan-400" />
              Why this works
              {!showDetailsSheet && <ChevronUp size={16} className="text-white/50 ml-2 animate-bounce" />}
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-12 pt-2 max-h-[60vh] overflow-y-auto">
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-gray-300 leading-relaxed text-base">
                {generatedResult.explanation}
              </p>
            </div>
            
            <button 
              onClick={() => setShowDetailsSheet(false)}
              className="mt-8 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* Selector Sheet - Only visible if not generating and no result yet (or minimized) */}
      {!generatedResult && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <HairstyleSelector />
        </div>
      )}
    </div>
  );
};
