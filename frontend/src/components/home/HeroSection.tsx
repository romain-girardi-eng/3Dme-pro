import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui';
import { PromptBar } from '@/components/studio/PromptBar';
import { useSceneStore } from '@/stores/sceneStore';

export const HeroSection = () => {
  const navigate = useNavigate();
  const prompt = useSceneStore((s) => s.generation.prompt);
  const toHash = useSceneStore((s) => s.toHash);

  const launch = () => {
    const hash = toHash();
    navigate(`/studio${hash ? `#${hash}` : ''}`);
  };

  return (
    <section className="relative flex min-h-[92vh] items-center justify-center px-6">
      <div className="mx-auto w-full max-w-4xl space-y-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-3 py-1 text-xs text-white/70"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand-secondary animate-pulse" />
          Now with Gaussian Splats + FLUX.2 + Rodin Gen-2
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl lg:text-[72px]"
        >
          Imagine it.{' '}
          <span className="bg-gradient-to-r from-brand-primary via-fuchsia-400 to-brand-secondary bg-clip-text text-transparent">
            Sculpt it in 3D.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto max-w-2xl text-base text-white/60 md:text-lg"
        >
          Type a prompt or drop an image. We generate a photoreal scene, splat or particle, in seconds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="space-y-3"
        >
          <PromptBar size="lg" className="mx-auto max-w-xl" />
          <Button
            variant="ghost"
            size="md"
            onClick={launch}
            trailing={<ArrowUp className="h-3.5 w-3.5 -rotate-45" />}
            disabled={!prompt.trim()}
          >
            Open in Studio
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
