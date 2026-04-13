import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { TooltipProvider } from '@/components/ui';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';

export default function GalleryPage() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-surface-0 text-white">
        <header className="border-b border-border-subtle">
          <nav className="mx-auto flex h-12 max-w-6xl items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-brand-primary" /> 3Dme
            </Link>
            <Link to="/studio" className="text-xs text-white/60 hover:text-white">
              Launch Studio →
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
          <section className="space-y-3">
            <span className="text-2xs uppercase tracking-[0.2em] text-brand-secondary">Gallery</span>
            <h1 className="text-3xl font-semibold md:text-4xl">Curated scenes.</h1>
            <p className="max-w-xl text-sm text-white/60">
              Pick a preset to seed the studio, tweak to taste, and ship.
            </p>
          </section>
          <GalleryGrid />
        </main>
      </div>
    </TooltipProvider>
  );
}
