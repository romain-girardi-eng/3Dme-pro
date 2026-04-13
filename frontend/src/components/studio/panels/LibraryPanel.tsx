import { Trash2 } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { PRESETS } from '@/lib/presets';

const formatAgo = (ms: number): string => {
  const diff = Date.now() - ms;
  const m = Math.round(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

export const LibraryPanel = () => {
  const setPrompt = useSceneStore((s) => s.setPrompt);
  const setTier = useSceneStore((s) => s.setTier);
  const history = useSceneStore((s) => s.history);
  const loadHistoryItem = useSceneStore((s) => s.loadHistoryItem);
  const removeHistoryItem = useSceneStore((s) => s.removeHistoryItem);

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="text-2xs uppercase tracking-[0.18em] font-medium text-white/40">
          Recent generations
        </h3>
        {history.length === 0 ? (
          <p className="text-2xs leading-relaxed text-white/40">
            Your generated and uploaded scenes appear here. Stored on this device only.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {history.map((item) => (
              <li key={item.id} className="group relative">
                <button
                  type="button"
                  onClick={() => loadHistoryItem(item.id)}
                  className="flex w-full items-center gap-2.5 rounded-sm border border-border-subtle bg-surface-2 p-1.5 text-left hover:border-border hover:bg-surface-3 transition-colors duration-fast"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-surface-1">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-mono text-white/40">
                        {item.source === 'uploaded' ? 'UPLD' : '3D'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-white/80">
                      {item.prompt || (item.source === 'uploaded' ? 'Uploaded asset' : '(no prompt)')}
                    </p>
                    <p className="text-2xs text-white/40">
                      {item.tier} · {formatAgo(item.createdAt)}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  aria-label="Remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHistoryItem(item.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-white/30 opacity-0 transition-opacity hover:text-signal-danger group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-2xs uppercase tracking-[0.18em] font-medium text-white/40">Starter prompts</h3>
        <ul className="space-y-1">
          {PRESETS.slice(0, 8).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  setPrompt(p.prompt);
                  setTier(p.tier);
                }}
                className="w-full rounded-sm px-2 py-1.5 text-left text-xs text-white/70 hover:bg-surface-2 hover:text-white transition-colors duration-fast"
              >
                {p.title}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
