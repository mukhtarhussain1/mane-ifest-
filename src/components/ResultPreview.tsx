import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appState';
import { ArrowLeft, Share2, Download, Wand2, Sparkles, ChevronUp } from 'lucide-react';
import { HairstyleSelector } from './HairstyleSelector';
import { generateHairstyleDetails } from '../services/gemini';

import { LoadingMessages } from './LoadingMessages';

export const ResultPreview: React.FC = () => {
  const { capturedImage, setStep, selectedHairstyleId, analysisResult, generatedResult, setGeneratedResult } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false); // For comparison

  const [error, setError] = useState<string | null>(null);

  // Reset generated result when selection changes
  useEffect(() => {
    setGeneratedResult(null);
    setShowDetailsSheet(false);
    setError(null);
  }, [selectedHairstyleId, setGeneratedResult]);

  const handleGenerate = async () => {
    console.log("Generate button clicked");
    setError(null);

    if (!capturedImage) {
      console.error("No captured image");
      setError("Missing image data");
      return;
    }
    if (!selectedHairstyleId) {
      console.error("No hairstyle selected");
      setError("Please select a hairstyle");
      return;
    }
    if (!analysisResult) {
      console.error("No analysis result");
      setError("Analysis data missing");
      return;
    }

    const selectedStyle = analysisResult.recommendations.find(r => r.id === selectedHairstyleId);
    if (!selectedStyle) {
      console.error("Selected style not found in recommendations");
      setError("Invalid style selection");
      return;
    }

    console.log("Starting generation for:", selectedStyle.name);
    setIsGenerating(true);
    try {
      const result = await generateHairstyleDetails(
        capturedImage, 
        selectedStyle.name, 
        analysisResult
      );
      console.log("Generation result:", result);
      setGeneratedResult(result);
      setShowDetailsSheet(true);
    } catch (err) {
      console.error("Generation failed", err);
      setError("Failed to generate look. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!capturedImage) return null;

  const selectedStyleName = analysisResult?.recommendations.find(r => r.id === selectedHairstyleId)?.name;

  return (
    <div className="fixed inset-0 bg-black flex flex-col font-sans safe-area-inset">
      {/* Header - Minimalist with safe area */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe-top sm:pt-12 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm pointer-events-none">
        <button 
          onClick={() => setStep('camera')}
          className="p-3 sm:p-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white hover:bg-black/50 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center pointer-events-auto"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-3 pointer-events-auto">
          {generatedResult && (
            <>
              {/* Compare Button */}
              <button 
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className="p-3 sm:p-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white hover:bg-black/50 hover:scale-110 active:scale-95 transition-all duration-300 select-none min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Hold to Compare"
              >
                <span className="font-bold text-xs px-1">ORIG</span>
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
                className="p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 hover:scale-110 active:scale-95 transition-all duration-300"
                title="Download Image"
              >
                <Download size={24} />
              </button>
              <button 
                onClick={async () => {
                  if (generatedResult.image) {
                    try {
                      // Convert base64 to blob for sharing
                      const response = await fetch(generatedResult.image);
                      const blob = await response.blob();
                      const file = new File([blob], 'mane-ifest-style.png', { type: 'image/png' });

                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: 'My New Look with Mane-ifest',
                            text: `Check out this ${selectedStyleName} hairstyle!`,
                            files: [file]
                          });
                        } catch (shareError) {
                          if ((shareError as Error).name !== 'AbortError') {
                             console.error("Share failed:", shareError);
                          }
                        }
                      } else {
                        // Fallback: Copy to clipboard or just alert
                        alert("Image downloaded! You can share it from your gallery.");
                        // Trigger download as fallback
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
                className="p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 hover:scale-110 active:scale-95 transition-all duration-300"
                title="Share Look"
              >
                <Share2 size={24} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Image Area - Full Screen with Blurred Background for "Fit" effect */}
      <div className="relative flex-1 w-full h-full bg-gray-900 overflow-hidden">
        {/* Blurred Background Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-50 scale-110 transition-all duration-500"
          style={{ backgroundImage: `url(${showOriginal ? capturedImage : (generatedResult?.image || capturedImage)})` }}
        />
        
        {/* Main Image Container */}
        <div className="relative w-full h-full">
           {/* Original Image (Always rendered, z-index controlled or opacity) */}
           <img 
             src={capturedImage}
             alt="Original"
             className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${showOriginal || !generatedResult ? 'opacity-100 z-20' : 'opacity-0 z-10'}`}
           />
           
           {/* Generated Image */}
           {generatedResult && (
             <img 
               src={generatedResult.image}
               alt="Generated"
               className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${showOriginal ? 'opacity-0 z-10' : 'opacity-100 z-20'}`}
             />
           )}
        </div>
        
        {/* Loading State */}
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/60 backdrop-blur-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse" />
              <Sparkles size={48} className="text-cyan-400 animate-spin-slow" />
            </div>
            <div className="mt-6 text-center space-y-2">
              <div className="text-2xl font-bold text-white tracking-wider uppercase animate-pulse">Crafting Look</div>
              <LoadingMessages />
            </div>
          </div>
        )}

        {/* Call to Action Overlay */}
        {!generatedResult && !isGenerating && selectedStyleName && !error && (
          <div className="absolute bottom-40 left-0 right-0 flex justify-center z-10 pointer-events-none">
             <div className="px-6 py-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 animate-bounce-slow">
                <p className="text-white text-sm font-medium flex items-center gap-2">
                  <Wand2 size={14} className="text-cyan-400" />
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
        
        {/* Generation Button - Positioned higher to avoid overlap with selector */}
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

      {/* Selector Sheet - Only visible if not generating and no result yet */}
      {!generatedResult && !isGenerating && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <HairstyleSelector />
        </div>
      )}
    </div>
  );
};
