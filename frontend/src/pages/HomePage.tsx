import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { MorphingParticles } from '@/components/particles/MorphingParticles';
import { Button, TooltipProvider } from '@/components/ui';
import { HeroSection } from '@/components/home/HeroSection';
import { PipelineSection } from '@/components/home/PipelineSection';
import { PresetShowcase } from '@/components/home/PresetShowcase';
import { SpecsSection } from '@/components/home/SpecsSection';
import { FAQSection } from '@/components/home/FAQSection';
import { Footer } from '@/components/home/Footer';

export default function HomePage() {
  return (
    <TooltipProvider>
      <div className="relative min-h-screen overflow-x-hidden bg-surface-0 text-white">
        <div className="pointer-events-none fixed inset-0 z-0 opacity-60">
          <MorphingParticles
            particleCount={40_000}
            colorScheme="rainbow"
            rotationSpeed={0.06}
            particleSize={1.3}
            enableBloom={false}
          />
        </div>
        <div className="relative z-10">
          <header className="sticky top-0 z-20 border-b border-border-subtle bg-surface-0/60 backdrop-blur-md">
            <nav className="mx-auto flex h-12 max-w-6xl items-center justify-between px-6">
              <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-brand-primary" />
                3Dme
              </Link>
              <div className="flex items-center gap-2">
                <Link to="/gallery" className="px-2 text-xs text-white/60 hover:text-white">
                  Gallery
                </Link>
                <Button asChild variant="primary" size="sm">
                  <Link to="/studio">Launch Studio</Link>
                </Button>
              </div>
            </nav>
          </header>
          <main>
            <HeroSection />
            <PipelineSection />
            <PresetShowcase />
            <SpecsSection />
            <FAQSection />
          </main>
          <Footer />
        </div>
      </div>
    </TooltipProvider>
  );
}
