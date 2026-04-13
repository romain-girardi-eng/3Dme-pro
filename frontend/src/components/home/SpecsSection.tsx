import { motion } from 'framer-motion';

const SPECS = [
  { label: 'particles rendered per frame', value: '1M', unit: '' },
  { label: 'image generation', value: '6.6', unit: 's' },
  { label: '3D conversion', value: '5–30', unit: 's' },
  { label: 'cost per scene', value: '0.02', unit: '$' },
];

export const SpecsSection = () => (
  <section className="border-y border-border-subtle bg-surface-1/40 px-6 py-24">
    <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
      {SPECS.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
          className="space-y-1"
        >
          <div className="text-3xl font-semibold tabular-nums text-white md:text-4xl">
            {s.unit === '$' && <span className="text-white/40">$</span>}
            {s.value}
            {s.unit !== '$' && <span className="text-brand-secondary">{s.unit}</span>}
          </div>
          <div className="text-2xs uppercase tracking-wider text-white/50">{s.label}</div>
        </motion.div>
      ))}
    </div>
  </section>
);
