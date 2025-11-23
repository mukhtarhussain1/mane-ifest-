import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/appState';
import { ArrowLeft, Share2, Download, Wand2, Sparkles, ChevronUp, SplitSquareHorizontal } from 'lucide-react';
import { HairstyleSelector } from './HairstyleSelector';
import { generateHairstyleDetails } from '../services/gemini';
import { LoadingMessages } from './LoadingMessages';

export const ResultPreview: React.FC = () => {
  const { capturedImage, setStep, selectedHairstyleId, analysisResult, generatedResult, setGeneratedResult } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<'hold' | 'slider'>('hold');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showOriginal, setShowOriginal] = useState(false); // For hold comparison
  const [error, setError] = useState<string | null>(null);
  
  const sliderRef = useRef<HTMLDivElement>(null);

  // Reset generated result when selection changes
  useEffect(() => {
    setGeneratedResult(null);
    setShowDetailsSheet(false);
    setError(null);
    setSliderPosition(50);
  }, [selectedHairstyleId, setGeneratedResult]);

  const handleGenerate = async () => {
    setError(null);

    if (!capturedImage || !selectedHairstyleId || !analysisResult) {
      setError("Missing data for generation");
      return;
    }

    const selectedStyle = analysisResult.recommendations.find(r => r.id === selectedHairstyleId);
    if (!selectedStyle) {
      setError("Invalid style selection");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateHairstyleDetails(
        capturedImage, 
        selectedStyle.name, 
        analysisResult
      );
      setGeneratedResult(result);
      setShowDetailsSheet(true);
    } catch (err) {
      console.error("Generation failed", err);
      setError("Failed to generate look. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  if (!capturedImage) return null;

  const selectedStyleName = analysisResult?.recommendations.find(r => r.id === selectedHairstyleId)?.name;

  return (
    <div className="fixed inset-0 bg-black flex flex-col font-sans safe-area-inset overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe-top flex justify-between items-center z-50 pointer-events-none">
        <button 
          onClick={() => setStep('camera')}
          className="glass-button p-3 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all pointer-events-auto"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-3 pointer-events-auto">
          {generatedResult && (
            <>
              {/* Comparison Toggle */}
              <button 
                onClick={() => setComparisonMode(prev => prev === 'hold' ? 'slider' : 'hold')}
                className={`glass-button p-3 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all ${comparisonMode === 'slider' ? 'bg-cyan-500/20 border-cyan-500/50' : ''}`}
                title="Toggle Comparison Mode"
              >
                <SplitSquareHorizontal size={20} />
              </button>

              <button 
                onClick={() => {
                  if (generatedResult.image) {
                    const link = document.createElement('a');
                    link.href = generatedResult.image;
                    link.download = `mane-ifest-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                className="glass-button p-3 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                <Download size={20} />
              </button>
              
              <button 
                onClick={async () => {
                  if (generatedResult.image) {
                    try {
                      const response = await fetch(generatedResult.image);
                      const blob = await response.blob();
                      const file = new File([blob], 'mane-ifest-style.png', { type: 'image/png' });
                      if (navigator.share) {
                        await navigator.share({
                          title: 'My New Look',
                          text: `Check out this ${selectedStyleName} hairstyle!`,
                          files: [file]
                        });
                      } else {
                        alert("Image downloaded! You can share it from your gallery.");
                        const link = document.createElement('a');
                        link.href = generatedResult.image;
                        link.download = `mane-ifest-${Date.now()}.png`;
                        link.click();
                      }
                    } catch (error) {
                      console.error("Error sharing:", error);
                    }
                  }
                }}
                className="glass-button p-3 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                <Share2 size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Image Area */}
      <div className="relative flex-1 w-full h-full bg-gray-900 overflow-hidden">
        {/* Blurred Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-40 scale-110 transition-all duration-700"
          style={{ backgroundImage: `url(${generatedResult?.image || capturedImage})` }}
        />
        
        {/* Image Container */}
        <div 
          className="relative w-full h-full flex items-center justify-center"
          onMouseDown={() => { setComparisonMode('hold'); setShowOriginal(true); }}
          onMouseUp={() => setShowOriginal(false)}
          onTouchStart={() => comparisonMode === 'hold' && setShowOriginal(true)}
          onTouchEnd={() => setShowOriginal(false)}
        >
           {/* Base Image (Original) */}
           <img 
             src={capturedImage}
             alt="Original"
             className="absolute inset-0 w-full h-full object-contain z-10"
           />
           
           {/* Generated Image Layer */}
           {generatedResult && (
             comparisonMode === 'slider' ? (
               <div 
                 className="absolute inset-0 z-20 overflow-hidden"
                 style={{ width: `${sliderPosition}%` }}
               >
                 <img 
                   src={generatedResult.image}
                   alt="Generated"
                   className="absolute top-0 left-0 w-[100vw] h-full object-contain max-w-none" 
                 />
                 {/* Slider Handle */}
                 <div className="absolute top-0 right-0 w-0.5 h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                   <div className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                     <div className="flex gap-0.5">
                       <div className="w-0.5 h-3 bg-gray-400" />
                       <div className="w-0.5 h-3 bg-gray-400" />
                     </div>
                   </div>
                 </div>
               </div>
             ) : (
               <img 
                 src={generatedResult.image}
                 alt="Generated"
                 className={`absolute inset-0 w-full h-full object-contain z-20 transition-opacity duration-200 ${showOriginal ? 'opacity-0' : 'opacity-100'}`}
               />
             )
           )}

           {/* Slider Interaction Layer */}
           {generatedResult && comparisonMode === 'slider' && (
             <div 
               ref={sliderRef}
               className="absolute inset-0 z-30 cursor-ew-resize touch-none"
               onMouseMove={handleSliderMove}
               onTouchMove={handleSliderMove}
             />
           )}
        </div>
        
        {/* Loading State */}
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black/60 backdrop-blur-md">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse" />
              <Sparkles size={48} className="text-cyan-400 animate-spin-slow relative z-10" />
            </div>
            <div className="mt-8 text-center space-y-3">
              <div className="text-2xl font-bold text-white tracking-widest uppercase animate-pulse">Crafting Look</div>
              <LoadingMessages />
            </div>
          </div>
        )}

        {/* CTA Overlay */}
        {!generatedResult && !isGenerating && selectedStyleName && !error && (
          <div className="absolute bottom-40 left-0 right-0 flex justify-center z-10 pointer-events-none">
             <div className="glass-panel px-6 py-3 rounded-full animate-bounce-slow flex items-center gap-2">
                <Wand2 size={14} className="text-cyan-400" />
                <p className="text-white text-sm font-medium">
                  Tap "Generate" to see {selectedStyleName}
                </p>
             </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute bottom-32 left-0 right-0 flex justify-center z-30 pointer-events-none">
            <div className="px-6 py-3 bg-red-500/80 backdrop-blur-md rounded-full border border-red-400/30 shadow-lg">
              <p className="text-white text-sm font-bold">{error}</p>
            </div>
          </div>
        )}
        
        {/* Generate Button */}
        {!isGenerating && !generatedResult && selectedHairstyleId && (
          <div className="absolute bottom-36 left-0 right-0 flex justify-center z-30 px-6 pointer-events-none">
            <button 
              onClick={handleGenerate}
              className="w-full max-w-xs group flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-all active:scale-95 pointer-events-auto"
            >
              <Wand2 size={20} className="group-hover:rotate-12 transition-transform" />
              <span className="tracking-wide">GENERATE LOOK</span>
            </button>
          </div>
        )}
      </div>

      {/* Details Bottom Sheet */}
      {generatedResult && (
        <div 
          className={`
            absolute bottom-0 left-0 right-0 z-40 glass-panel rounded-t-[2rem] border-t border-white/10 shadow-[0_-10px_50px_rgba(0,0,0,0.8)]
            transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1)
            ${showDetailsSheet ? 'translate-y-0' : 'translate-y-[85%]'}
          `}
        >
          <div 
            className="w-full p-4 flex flex-col items-center cursor-pointer"
            onClick={() => setShowDetailsSheet(!showDetailsSheet)}
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mb-4" />
            <div className="flex items-center gap-2 text-white font-bold text-lg tracking-wide">
              <Sparkles size={18} className="text-cyan-400" />
              Why this works
              {!showDetailsSheet && <ChevronUp size={16} className="text-white/50 ml-2 animate-bounce" />}
            </div>
          </div>

          <div className="px-8 pb-12 pt-2 max-h-[60vh] overflow-y-auto">
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-gray-300 leading-relaxed text-base">
                {generatedResult.explanation}
              </p>
            </div>
            
            <button 
              onClick={() => setShowDetailsSheet(false)}
              className="mt-8 w-full py-4 glass-button rounded-xl text-white font-bold transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* Hairstyle Selector */}
      {!generatedResult && !isGenerating && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <HairstyleSelector />
        </div>
      )}
    </div>
  );
};
