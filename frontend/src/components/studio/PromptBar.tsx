import { useRef } from 'react';
import { Sparkles, ArrowUp, Loader2 } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { Button, Input, Kbd, Tooltip } from '@/components/ui';
import { useGenerationFlow } from '@/hooks/useGenerationFlow';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { cn } from '@/lib/cn';

export interface PromptBarProps {
  size?: 'sm' | 'lg';
  className?: string;
}

export const PromptBar = ({ size = 'lg', className }: PromptBarProps) => {
  const prompt = useSceneStore((s) => s.generation.prompt);
  const setPrompt = useSceneStore((s) => s.setPrompt);
  const enhancerEnabled = useSceneStore((s) => s.generation.enhancerEnabled);
  const toggleEnhancer = useSceneStore((s) => s.toggleEnhancer);
  const status = useSceneStore((s) => s.generation.status);
  const setEnhancedPrompt = useSceneStore((s) => s.setEnhancedPrompt);
  const { runImageStage } = useGenerationFlow();
  const inputRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcut('/', () => inputRef.current?.focus());
  useKeyboardShortcut('g', () => void runImageStage());

  const busy = status === 'enhancing' || status === 'generating-image' || status === 'generating-3d';

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md bg-surface-1 backdrop-blur-md border border-border',
        size === 'lg' ? 'p-2 pl-4' : 'p-1.5 pl-3',
        className
      )}
    >
      <Tooltip content={enhancerEnabled ? 'Disable prompt enhancer' : 'Enable prompt enhancer'}>
        <button
          type="button"
          onClick={toggleEnhancer}
          aria-pressed={enhancerEnabled}
          className={cn(
            'flex items-center justify-center rounded-sm transition-colors duration-fast',
            size === 'lg' ? 'h-8 w-8' : 'h-7 w-7',
            enhancerEnabled ? 'bg-brand-primary/20 text-brand-primary' : 'text-white/40 hover:text-white/70'
          )}
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </Tooltip>
      <Input
        ref={inputRef}
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
          setEnhancedPrompt(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !busy) {
            e.preventDefault();
            void runImageStage();
          }
        }}
        placeholder={size === 'lg' ? 'Describe or drop an image…' : 'Prompt…'}
        className="flex-1 h-8 bg-transparent border-0 px-0 focus:ring-0"
        disabled={busy}
      />
      {!busy && (
        <span className="hidden md:flex items-center gap-1 text-2xs text-white/30">
          <Kbd>/</Kbd>
        </span>
      )}
      <Button
        variant="primary"
        size={size === 'lg' ? 'md' : 'sm'}
        onClick={() => void runImageStage()}
        disabled={busy || !prompt.trim()}
        leading={busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
      >
        {busy ? 'Working…' : 'Generate'}
      </Button>
    </div>
  );
};
