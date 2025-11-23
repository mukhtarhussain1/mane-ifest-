import { useAppStore } from './store/appState';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CameraView } from './components/CameraView';
import { AnalysisOverlay } from './components/AnalysisOverlay';
import { ResultPreview } from './components/ResultPreview';
import { Smartphone } from 'lucide-react';

function App() {
  const { currentStep } = useAppStore();

  const renderScreen = () => {
    switch (currentStep) {
      case 'home': return <WelcomeScreen />;
      case 'camera': return <CameraView />;
      case 'analyzing': return <AnalysisOverlay />;
      case 'results': return <ResultPreview />;
      default: return <WelcomeScreen />;
    }
  };

  return (
    <div className="min-h-dvh bg-[#050505] text-white font-sans antialiased overflow-hidden flex items-center justify-center">
      {/* Desktop Background Effects */}
      <div className="fixed inset-0 hidden md:block pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[150px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
      </div>

      {/* Desktop Info Side Panel (Only visible on large screens) */}
      <div className="hidden lg:flex fixed left-12 top-1/2 -translate-y-1/2 flex-col gap-6 max-w-xs z-0">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
            Mane-ifest
          </h1>
          <p className="text-gray-400 text-lg font-light">
            AI-Powered Hairstyle Visualization
          </p>
        </div>
        <div className="flex flex-col gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10">
              <Smartphone size={20} className="text-cyan-400" />
            </div>
            <span>Designed for Mobile</span>
          </div>
          <p className="leading-relaxed">
            For the best experience, use your phone's camera to scan your face and get personalized recommendations.
          </p>
        </div>
      </div>

      {/* Mobile Frame Container */}
      <div className="relative w-full h-dvh md:h-[850px] md:w-[420px] md:rounded-[3rem] md:border-[8px] md:border-[#1a1a1a] md:shadow-2xl overflow-hidden bg-black transition-all duration-500 ease-in-out z-10">
        {/* Dynamic Island (Desktop only decoration) */}
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-50 pointer-events-none" />
        
        {/* Screen Content */}
        <div className="w-full h-full relative">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}

export default App;
