import { Sparkles } from 'lucide-react';

export const Footer = () => (
  <footer className="border-t border-border-subtle px-6 py-10">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-primary" />
        <span className="text-sm text-white/70">3Dme — 2026</span>
      </div>
      <nav className="flex items-center gap-5 text-xs text-white/50">
        <a
          href="https://github.com/romain-girardi-eng/3Dme"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white"
        >
          GitHub
        </a>
        <a href="/gallery" className="hover:text-white">
          Gallery
        </a>
        <a href="/studio" className="hover:text-white">
          Studio
        </a>
      </nav>
    </div>
  </footer>
);
