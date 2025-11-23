import { useAppStore } from './store/appState';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CameraView } from './components/CameraView';
import { AnalysisOverlay } from './components/AnalysisOverlay';
import { ResultPreview } from './components/ResultPreview';

function App() {
  const { currentStep } = useAppStore();

  return (
    <div className="min-h-dvh bg-black text-white font-sans antialiased overflow-hidden">
      {currentStep === 'home' && <WelcomeScreen />}
      {currentStep === 'camera' && <CameraView />}
      {currentStep === 'analyzing' && <AnalysisOverlay />}
      {currentStep === 'results' && <ResultPreview />}
    </div>
  );
}

export default App;
