import { motion } from 'framer-motion';
import { MessageSquare, ImageIcon, Box, Sparkles } from 'lucide-react';

const STEPS = [
  { icon: MessageSquare, title: 'Prompt', blurb: 'Describe the scene or drop an image.' },
  { icon: ImageIcon, title: 'Image', blurb: 'FLUX.2 Turbo generates 4 variants in seconds.' },
  { icon: Box, title: '3D', blurb: 'Rodin, Trellis, or Hunyuan3D lifts it into a mesh + splat.' },
  { icon: Sparkles, title: 'Render', blurb: 'WebGPU renders 1M particles or Gaussian splats live.' },
];

export const PipelineSection = () => (
  <section className="px-6 py-24">
    <div className="mx-auto max-w-5xl space-y-12">
      <header className="space-y-3 text-center">
        <span className="text-2xs uppercase tracking-[0.2em] text-brand-secondary">Pipeline</span>
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Four stages, fully automated.</h2>
      </header>
      <div className="grid gap-4 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3 rounded-md border border-border-subtle bg-surface-1 p-5"
          >
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-brand-primary/15 text-brand-primary">
              <s.icon className="h-4 w-4" />
            </div>
            <h3 className="text-base font-semibold text-white">
              {i + 1}. {s.title}
            </h3>
            <p className="text-xs leading-relaxed text-white/60">{s.blurb}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
