import { useState } from 'react';
import { Settings, Play, Download } from 'lucide-react';
import {
  Button, IconButton, Panel, Tabs, TabsList, TabsTrigger, TabsContent,
  Slider, NumberField, Input, Textarea, Tooltip, TooltipProvider, Kbd,
} from '@/components/ui';
import { useSceneStore } from '@/stores/sceneStore';
import { enhancePrompt } from '@/services/aiService';

export default function DevUIPage() {
  const [sliderVal, setSliderVal] = useState([50]);
  const [apiResult, setApiResult] = useState<string>('');
  const [apiLoading, setApiLoading] = useState(false);
  const prompt = useSceneStore((s) => s.generation.prompt);
  const setPrompt = useSceneStore((s) => s.setPrompt);
  const particles = useSceneStore((s) => s.scene.particles);
  const updateParticles = useSceneStore((s) => s.updateParticles);
  const toHash = useSceneStore((s) => s.toHash);

  const testEnhance = async () => {
    setApiLoading(true);
    setApiResult('');
    try {
      const r = await enhancePrompt({ prompt: prompt || 'a cat', style: 'photoreal' });
      setApiResult(r.enhanced);
    } catch (e) {
      setApiResult(`error: ${(e as Error).message}`);
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-surface-0 text-white p-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">3Dme — UI Preview</h1>
          <p className="text-sm text-white/50">Design system primitives and scene store demo.</p>
        </header>

        <Panel title="Buttons">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button leading={<Play className="w-3.5 h-3.5" />}>With icon</Button>
          </div>
        </Panel>

        <Panel title="Icon buttons">
          <div className="flex items-center gap-2">
            <Tooltip content="Settings">
              <IconButton icon={<Settings />} label="Settings" />
            </Tooltip>
            <Tooltip content="Export"><IconButton icon={<Download />} label="Export" variant="solid" /></Tooltip>
            <Tooltip content="Play"><IconButton icon={<Play />} label="Play" variant="primary" /></Tooltip>
          </div>
        </Panel>

        <Panel title="Tabs">
          <Tabs defaultValue="a">
            <TabsList>
              <TabsTrigger value="a">Particles</TabsTrigger>
              <TabsTrigger value="b">Material</TabsTrigger>
              <TabsTrigger value="c">Physics</TabsTrigger>
            </TabsList>
            <TabsContent value="a" className="pt-4 text-sm text-white/70">Particles tab content</TabsContent>
            <TabsContent value="b" className="pt-4 text-sm text-white/70">Material tab content</TabsContent>
            <TabsContent value="c" className="pt-4 text-sm text-white/70">Physics tab content</TabsContent>
          </Tabs>
        </Panel>

        <Panel title="Slider + NumberField">
          <div className="space-y-4 max-w-sm">
            <Slider value={sliderVal} onValueChange={setSliderVal} min={0} max={100} />
            <NumberField
              label="count"
              value={particles.count}
              onChange={(v) => updateParticles({ count: v })}
              min={1000}
              max={2_000_000}
              step={1000}
              suffix="pts"
            />
            <NumberField
              label="size"
              value={particles.size}
              onChange={(v) => updateParticles({ size: v })}
              min={0.1}
              max={10}
              step={0.1}
            />
          </div>
        </Panel>

        <Panel title="Inputs">
          <div className="space-y-3 max-w-md">
            <Input
              placeholder="Describe what you want to create…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Textarea placeholder="Longer prompt…" />
          </div>
        </Panel>

        <Panel title="Keyboard shortcuts">
          <div className="flex flex-wrap gap-3 text-sm text-white/70">
            <span className="flex items-center gap-1.5"><Kbd>⌘</Kbd><Kbd>K</Kbd> command palette</span>
            <span className="flex items-center gap-1.5"><Kbd>/</Kbd> focus prompt</span>
            <span className="flex items-center gap-1.5"><Kbd>G</Kbd> generate</span>
            <span className="flex items-center gap-1.5"><Kbd>M</Kbd> toggle mode</span>
          </div>
        </Panel>

        <Panel title="Store → URL hash">
          <div className="space-y-3 text-sm">
            <div className="text-white/70">Prompt in store: <span className="font-mono text-white">{prompt || '(empty)'}</span></div>
            <div className="text-white/70">Particles count: <span className="font-mono text-white">{particles.count.toLocaleString()}</span></div>
            <div className="text-white/70 break-all">
              Hash: <span className="font-mono text-2xs text-brand-secondary">{toHash().slice(0, 120)}…</span>
            </div>
          </div>
        </Panel>

        <Panel title="API test (requires vercel dev or deployed)">
          <div className="space-y-3 max-w-md">
            <Button onClick={testEnhance} disabled={apiLoading}>
              {apiLoading ? 'Enhancing…' : 'Enhance prompt'}
            </Button>
            {apiResult && (
              <div className="text-sm text-white/80 p-3 bg-surface-2 rounded-sm">{apiResult}</div>
            )}
          </div>
        </Panel>
      </div>
    </TooltipProvider>
  );
}
