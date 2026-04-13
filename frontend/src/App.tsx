import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { TooltipProvider, Toaster } from '@/components/ui';

// Lazy load pages for better initial bundle size
const HomePage = lazy(() => import('./pages/HomePage'));
const StudioPage = lazy(() => import('./pages/StudioPage'));
const DevUIPage = lazy(() => import('./pages/DevUIPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const EmbedPage = lazy(() => import('./pages/EmbedPage'));

// Loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-accent-purple mx-auto" />
        <p className="text-dark-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/studio" element={<StudioPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/embed" element={<EmbedPage />} />
            <Route path="/dev/ui" element={<DevUIPage />} />
          </Routes>
        </Suspense>
        <Toaster />
      </Router>
    </TooltipProvider>
  );
}

export default App;
