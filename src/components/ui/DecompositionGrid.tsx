'use client';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CharacterData } from '@/types/database';
import { getHskStyle } from '@/utils/hskStyles';

interface DecompositionGridProps {
  decomposition: string | null;
  onComponentClick?: (char: string) => void;
}

export default function DecompositionGrid({
  decomposition,
  onComponentClick,
}: DecompositionGridProps) {
  const [components, setComponents] = useState<CharacterData[]>([]);
  const [loading, setLoading] = useState(false);

  const hasNoData = !decomposition || decomposition === '？';

  useEffect(() => {
    const fetchComponents = async () => {
      if (hasNoData) {
        setComponents([]);
        return;
      }
      setLoading(true);
      try {
        const data = await invoke<CharacterData[]>('get_component_details', {
          decomp: decomposition,
        });
        setComponents(data);
      } catch (err) {
        console.error('Failed to fetch components:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComponents();
  }, [decomposition, hasNoData]);

  if (loading)
    return (
      <div className="flex justify-center py-6 opacity-30 animate-pulse text-[10px] uppercase tracking-widest">
        Scanning Components...
      </div>
    );

  // FALLBACK UI: When no decomposition exists
  if (hasNoData || (components.length === 0 && !loading)) {
    return (
      <div className="mt-4 p-4 border border-dashed border-cyan-500/10 rounded-lg bg-cyan-950/5 group/atomic transition-colors">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="text-cyan-400 font-mono text-xs animate-glitch-fast"
          >
            [!]
          </span>

          <div className="flex flex-col">
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-500 transition-colors">
              Atomic Unit Identified
            </p>
            <p className="text-[10px] text-cyan-500/40 uppercase tracking-[0.1em] mt-0.5">
              Structural analysis complete: no sub-components found
            </p>
          </div>
        </div>
      </div>
    );
  }

  const ChipLeads = ({ side }: { side: 'left' | 'right' }) => (
    <div
      className={`absolute ${side === 'left' ? '-left-[12px]' : '-right-[12px]'} top-0 bottom-0 flex flex-col justify-around py-6 pointer-events-none`}
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-[12px] h-[1.5px] bg-current opacity-30 group-hover:opacity-100 transition-opacity"
        />
      ))}
    </div>
  );

  return (
    <section
      aria-label="Character Decomposition"
      className="lg:mt-2 lg:pt-6 lg:border-t border-cyan-500/10 animate-in fade-in duration-1000"
    >
      <div
        className="
        grid justify-center 
        gap-x-0 lg:gap-x-4 
        gap-y-0 lg:gap-y-5
        grid-cols-[100px] 
        lg:grid-cols-[repeat(auto-fill,100px)]
        w-full max-w-full
      "
      >
        {components.map((comp, idx) => {
          const hskStyle = getHskStyle(comp.hsk_level);

          return (
            <div
              key={comp.id || `${comp.character}-${idx}`}
              className="w-[100px] relative flex flex-col items-center"
            >
              {/* VERTICAL WIRE */}
              {idx !== 0 && (
                <div
                  aria-hidden="true"
                  className="w-[1.5px] h-4 bg-cyan-500/30 lg:hidden"
                />
              )}

              <button
                onClick={() => onComponentClick?.(comp.character)}
                aria-label={`Inspect component: ${comp.character}`}
                className={`
                group relative flex flex-col items-center justify-center w-full 
                aspect-[4/3] p-2
                bg-[#10171d] border-2 transition-all duration-300 outline-none
                ${hskStyle.textClass} ${hskStyle.borderClass}
                ${hskStyle.isRaw ? 'animate-flicker' : 'hover:border-current/60'}
              `}
              >
                <ChipLeads side="left" />
                <ChipLeads side="right" />

                <span className="relative z-10 text-3xl leading-none font-hero">
                  {comp.character}
                </span>
                <span className="relative z-10 text-[9px] font-mono uppercase mt-1 opacity-60">
                  {comp.pinyin || '??'}
                </span>

                {/* HOVER OVERLAY */}
                <div
                  className={`
                    absolute 
                    -inset-[2px]
                    z-20 flex flex-col items-center justify-center 
                    bg-[#0f1419] rounded-sm
                    opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 
                    transition-all duration-200 
                    border-2 border-current
                  `}
                >
                  <div className="text-center px-3">
                    <p className="text-[10px] leading-tight text-white font-mono uppercase tracking-wide">
                      {comp.definition?.split(/[;/,]/)[0] || 'Unknown'}
                    </p>
                    <div className="mt-2 h-px w-8 bg-current mx-auto opacity-50" />
                  </div>
                </div>

                {/* HUD Corners */}
                <div
                  aria-hidden="true"
                  className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-20"
                />
                <div
                  aria-hidden="true"
                  className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-20"
                />
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-20"
                />
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-20"
                />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
