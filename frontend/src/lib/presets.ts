export interface Preset {
  id: string;
  title: string;
  prompt: string;
  tag: 'Character' | 'Nature' | 'Object' | 'Abstract' | 'Sci-Fi';
  tier: 'fast' | 'balanced' | 'pro';
  gradient: string;
}

export const PRESETS: Preset[] = [
  {
    id: 'jellyfish',
    title: 'Crystal Jellyfish',
    prompt:
      'A translucent bioluminescent jellyfish drifting in deep dark water, rim light, subsurface scattering',
    tag: 'Nature',
    tier: 'balanced',
    gradient: 'from-cyan-500/30 to-violet-500/30',
  },
  {
    id: 'samurai',
    title: 'Neon Samurai',
    prompt:
      'Neon cyberpunk samurai in the rain, glowing katana, wet reflective street, rim light',
    tag: 'Character',
    tier: 'balanced',
    gradient: 'from-fuchsia-500/30 to-indigo-500/30',
  },
  {
    id: 'dragon',
    title: 'Obsidian Dragon',
    prompt:
      'An ancient ice dragon carved from blue obsidian, volumetric fog, dramatic lighting, photoreal',
    tag: 'Character',
    tier: 'pro',
    gradient: 'from-sky-500/30 to-slate-500/30',
  },
  {
    id: 'forest',
    title: 'Bioluminescent Forest',
    prompt:
      'Bioluminescent forest at twilight, glowing mushrooms, mist, fireflies, painterly',
    tag: 'Nature',
    tier: 'fast',
    gradient: 'from-emerald-500/30 to-teal-500/30',
  },
  {
    id: 'skull',
    title: 'Lava Skull',
    prompt:
      'Molten lava skull with glowing magma eyes, cracked obsidian surface, dramatic backlight',
    tag: 'Object',
    tier: 'balanced',
    gradient: 'from-orange-500/30 to-rose-500/30',
  },
  {
    id: 'phoenix',
    title: 'Origami Phoenix',
    prompt:
      'Origami phoenix made of gold foil, spread wings, studio lighting, macro detail',
    tag: 'Abstract',
    tier: 'fast',
    gradient: 'from-amber-500/30 to-yellow-500/30',
  },
  {
    id: 'mech',
    title: 'Battle Mech',
    prompt:
      'A battle-worn mecha with intricate armor, glowing reactor core, hangar lighting, photoreal',
    tag: 'Sci-Fi',
    tier: 'pro',
    gradient: 'from-zinc-500/30 to-blue-500/30',
  },
  {
    id: 'galaxy',
    title: 'Spiral Galaxy',
    prompt:
      'A realistic spiral galaxy with visible dust lanes and bright core, deep space background',
    tag: 'Abstract',
    tier: 'balanced',
    gradient: 'from-indigo-500/30 to-purple-500/30',
  },
];
