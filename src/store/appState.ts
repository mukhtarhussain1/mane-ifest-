import { create } from 'zustand';
import type { AnalysisResult } from '../services/gemini';

export type AppStep = 'home' | 'camera' | 'analyzing' | 'results';

interface AppState {
  currentStep: AppStep;
  capturedImage: string | null;
  analysisResult: AnalysisResult | null;
  selectedHairstyleId: string | null;
  generatedResult: { image: string; explanation: string } | null;
  
  setStep: (step: AppStep) => void;
  setCapturedImage: (image: string | null) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setSelectedHairstyleId: (id: string | null) => void;
  setGeneratedResult: (result: { image: string; explanation: string } | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentStep: 'home',
  capturedImage: null,
  analysisResult: null,
  selectedHairstyleId: null,
  generatedResult: null,

  setStep: (step) => set({ currentStep: step }),
  setCapturedImage: (image) => set({ capturedImage: image }),
  setAnalysisResult: (result) => set({ analysisResult: result }),
  setSelectedHairstyleId: (id) => set({ selectedHairstyleId: id }),
  setGeneratedResult: (result) => set({ generatedResult: result }),
  reset: () => set({ 
    currentStep: 'home', 
    capturedImage: null, 
    analysisResult: null, 
    selectedHairstyleId: null,
    generatedResult: null
  }),
}));
