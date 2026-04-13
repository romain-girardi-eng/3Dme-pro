import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PRESETS } from '@/lib/presets';
import { cn } from '@/lib/cn';

export const PresetShowcase = () => (
  <section className="px-6 py-24">
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="flex items-end justify-between">
        <div className="space-y-2">
          <span className="text-2xs uppercase tracking-[0.2em] text-brand-secondary">Gallery</span>
          <h2 className="text-3xl font-semibold text-white md:text-4xl">Start from a preset.</h2>
        </div>
        <Link to="/gallery" className="text-sm text-white/60 hover:text-white">
          View all →
        </Link>
      </header>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {PRESETS.slice(0, 4).map((p, i) => (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className={cn(
              'group relative aspect-[3/4] overflow-hidden rounded-md border border-border-subtle bg-gradient-to-br',
              p.gradient
            )}
          >
            <div className="absolute inset-0 bg-surface-0/40 backdrop-blur-sm" />
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              <span className="text-2xs uppercase tracking-wider text-white/60">{p.tag}</span>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">{p.title}</h3>
                <p className="text-2xs line-clamp-2 text-white/60">{p.prompt}</p>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);
