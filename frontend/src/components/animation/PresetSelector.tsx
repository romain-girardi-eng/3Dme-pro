/**
 * PresetSelector Component
 *
 * Dropdown/grid selector for animation presets organized by category.
 */

import { useState } from 'react';
import { ChevronDown, Sparkles, Repeat, Zap, Flame, Waves } from 'lucide-react';
import { type AnimationPreset, PRESETS_BY_CATEGORY } from '../../animation/presets';

interface PresetSelectorProps {
  onApply: (preset: AnimationPreset) => void;
  currentPresetId?: string;
}

const CATEGORY_ICONS = {
  intro: Sparkles,
  loop: Repeat,
  dramatic: Zap,
  psychedelic: Flame,
  ambient: Waves,
};

const CATEGORY_LABELS = {
  intro: 'Intro',
  loop: 'Loop',
  dramatic: 'Dramatic',
  psychedelic: 'Psychedelic',
  ambient: 'Ambient',
};

export function PresetSelector({ onApply, currentPresetId }: PresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof PRESETS_BY_CATEGORY>('intro');

  const categories = Object.keys(PRESETS_BY_CATEGORY) as (keyof typeof PRESETS_BY_CATEGORY)[];
  const presetsInCategory = PRESETS_BY_CATEGORY[selectedCategory];

  // Find current preset name
  const currentPreset = currentPresetId
    ? Object.values(PRESETS_BY_CATEGORY)
        .flat()
        .find((p) => p.id === currentPresetId)
    : null;

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
      >
        <span className="text-sm text-white/80">
          {currentPreset ? currentPreset.name : 'Select Preset...'}
        </span>
        <ChevronDown
          size={16}
          className={`text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Panel */}
          <div className="absolute z-50 w-72 mt-2 left-0 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            {/* Category tabs */}
            <div className="flex border-b border-white/10 overflow-x-auto">
              {categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] uppercase tracking-wider transition-colors ${
                      selectedCategory === cat
                        ? 'bg-orange-500/20 text-orange-400 border-b-2 border-orange-500'
                        : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <Icon size={14} />
                    <span className="truncate">{CATEGORY_LABELS[cat]}</span>
                  </button>
                );
              })}
            </div>

            {/* Presets grid */}
            <div className="p-2 max-h-64 overflow-y-auto">
              <div className="space-y-1">
                {presetsInCategory.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onApply(preset);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      currentPresetId === preset.id
                        ? 'bg-orange-500/20 border border-orange-500/50'
                        : 'hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{preset.name}</span>
                      <div className="flex items-center gap-1.5">
                        {preset.loop && (
                          <span title="Looping"><Repeat size={12} className="text-white/40" /></span>
                        )}
                        <span className="text-[10px] text-white/40">{preset.duration}s</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-white/50 mt-0.5">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 border-t border-white/10 text-[10px] text-white/40 text-center">
              Click preset to apply • Use Theatre.js Studio for custom keyframes
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PresetSelector;
