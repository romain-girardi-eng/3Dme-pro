const FAQS = [
  {
    q: 'Do I need to sign up?',
    a: 'No. 3Dme works without an account. Scenes are shareable via URL hash.',
  },
  {
    q: 'What does it cost?',
    a: 'Fast tier (Trellis + Flux Turbo) is ~$0.03 per scene. Pro tier (Rodin Gen-2) is ~$0.41. You see the price before every generation.',
  },
  {
    q: 'Which browsers work?',
    a: 'Chrome, Edge, and Firefox with WebGPU support. WebGL fallback included.',
  },
  {
    q: 'Can I export?',
    a: 'Yes. GLB mesh, PLY Gaussian splat, PNG image, and MP4 animation.',
  },
];

export const FAQSection = () => (
  <section className="px-6 py-24">
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-3 text-center">
        <span className="text-2xs uppercase tracking-[0.2em] text-brand-secondary">FAQ</span>
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Short answers.</h2>
      </header>
      <dl className="space-y-4">
        {FAQS.map((f) => (
          <div key={f.q} className="rounded-md border border-border-subtle bg-surface-1 p-5">
            <dt className="text-base font-semibold text-white">{f.q}</dt>
            <dd className="mt-1 text-sm text-white/60">{f.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  </section>
);
