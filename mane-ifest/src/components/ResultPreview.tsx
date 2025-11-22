import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appState';
import { ArrowLeft, Share2, Download, Wand2, Sparkles, X } from 'lucide-react';
import { HairstyleSelector } from './HairstyleSelector';
import { generateHairstyleDetails } from '../services/gemini';

export const ResultPreview: React.FC = () => {
  const { capturedImage, setStep, selectedHairstyleId, analysisResult, generatedResult, setGeneratedResult } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Reset generated result when selection changes
  useEffect(() => {
    setGeneratedResult(null);
    setShowExplanation(false);
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
      setShowExplanation(true);
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
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-100">
        <button 
          onClick={() => setStep('camera')}
          className="p-3 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 text-white hover:bg-black/40 transition-all active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-3">
          <button className="p-3 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 text-white hover:bg-black/40 transition-all active:scale-95">
            <Download size={20} />
          </button>
          <button className="p-3 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 text-white hover:bg-black/40 transition-all active:scale-95">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="relative flex-1 overflow-hidden bg-gray-900">
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

        {/* Overlay Text for Demo Purpose if not generated yet */}
        {!generatedResult && !isGenerating && selectedStyleName && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
             <div className="absolute bottom-1/3 px-6 py-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 animate-bounce-slow">
                <p className="text-white text-sm font-medium flex items-center gap-2">
                  <Wand2 size={14} className="text-cyan-400" />
                  Tap "Generate" to see {selectedStyleName}
                </p>
             </div>
          </div>
        )}
        
        {/* Generation Button (Floating) */}
        {!isGenerating && !generatedResult && selectedHairstyleId && (
          <div className="absolute bottom-6 right-6 z-30">
            <button 
              onClick={handleGenerate}
              className="group flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-all active:scale-95"
            >
              <Wand2 size={20} className="group-hover:rotate-12 transition-transform" />
              <span className="tracking-wide">GENERATE LOOK</span>
            </button>
          </div>
        )}

        {/* Explanation Overlay */}
        {showExplanation && generatedResult && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              {/* Decorative Gradients */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10" />

              <button 
                onClick={() => setShowExplanation(false)}
                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <Sparkles size={20} className="text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Why this works</h3>
                </div>
                
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-gray-300 leading-relaxed text-sm">
                    {generatedResult.explanation}
                  </p>
                </div>

                <button 
                  onClick={() => setShowExplanation(false)}
                  className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors text-sm"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selector Sheet */}
      <div className="z-20">
        <HairstyleSelector />
      </div>
    </div>
  );
};
