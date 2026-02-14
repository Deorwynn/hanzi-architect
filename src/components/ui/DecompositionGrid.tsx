'use client';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CharacterData } from '@/types/database';

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

  useEffect(() => {
    const fetchComponents = async () => {
      if (!decomposition) {
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
  }, [decomposition]);

  const getComponentColor = (hskLevel: number | null | undefined) => {
    if (!hskLevel) return '6, 182, 212'; // Cyan-500
    if (hskLevel <= 3) return '34, 211, 238'; // Cyan-400
    if (hskLevel <= 6) return '52, 211, 153'; // Emerald-400
    return '249, 115, 22'; // Orange-500
  };

  if (!decomposition || (components.length === 0 && !loading)) return null;

  return (
    <div className="mt-12 border-t border-cyan-500/10 pt-8 animate-in fade-in duration-1000">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {components.map((comp) => {
          const rgb = getComponentColor(comp.hsk_level);
          const hasHsk = !!comp.hsk_level;

          return (
            <button
              key={comp.id}
              onClick={() => onComponentClick?.(comp.character)}
              style={{ '--hsk-color': rgb } as React.CSSProperties}
              className={`
                group relative flex flex-col items-center justify-center p-8 bg-[#10171d] rounded-sm transition-all duration-300 outline-none border border-cyan-500/20 hover:border-[rgb(var(--hsk-color))] focus-visible:border-[rgb(var(--hsk-color))] hover:shadow-[0_0_25px_rgba(var(--hsk-color),0.4)] focus-visible:shadow-[0_0_25px_rgba(var(--hsk-color),0.4)]
                ${hasHsk ? 'animate-flicker' : ''}
                `}
            >
              {/* MICROCHIP LEADS */}
              <div className="absolute -left-[10px] top-0 bottom-0 flex flex-col justify-around py-4 pointer-events-none">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-[10px] h-[2px] bg-cyan-500/20 group-hover:bg-[rgb(var(--hsk-color))] group-focus-visible:bg-[rgb(var(--hsk-color))] transition-colors"
                  />
                ))}
              </div>
              <div className="absolute -right-[10px] top-0 bottom-0 flex flex-col justify-around py-4 pointer-events-none">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-[10px] h-[2px] bg-cyan-500/20 group-hover:bg-[rgb(var(--hsk-color))] group-focus-visible:bg-[rgb(var(--hsk-color))] transition-colors"
                  />
                ))}
              </div>

              {/* CHARACTER */}
              <span
                style={{
                  color: hasHsk ? `rgb(${rgb})` : 'rgba(165, 243, 252, 0.3)',
                  textShadow: hasHsk ? `0 0 12px rgba(${rgb}, 0.6)` : 'none',
                }}
                className="relative z-10 text-4xl mb-2 font-hero transition-all duration-300 group-hover:scale-75 group-hover:opacity-10 group-focus-visible:opacity-10"
              >
                {comp.character}
              </span>

              <span
                style={{
                  color: hasHsk ? `rgb(${rgb})` : 'rgba(165, 243, 252, 0.2)',
                }}
                className="relative z-10 text-[10px] font-mono uppercase tracking-[0.2em] opacity-60 group-hover:opacity-0 group-focus-visible:opacity-0 transition-opacity"
              >
                {comp.pinyin || '??'}
              </span>

              {/* HOVER OVERLAY */}
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0f1419] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-200 border border-[rgb(var(--hsk-color))]">
                <div className="text-center px-4">
                  <p className="text-[9px] text-cyan-500/60 font-mono mb-2 tracking-tighter uppercase">
                    Data_Stream
                  </p>
                  <p className="text-[12px] leading-tight text-white font-mono uppercase tracking-wide">
                    {comp.definition.split(';')[0]}
                  </p>
                  <div className="mt-3 h-px w-8 bg-[rgb(var(--hsk-color))] mx-auto opacity-50" />
                </div>
              </div>

              {/* HUD Corners */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500/10 group-hover:border-[rgb(var(--hsk-color))] group-focus-visible:border-[rgb(var(--hsk-color))] transition-all" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500/10 group-hover:border-[rgb(var(--hsk-color))] group-focus-visible:border-[rgb(var(--hsk-color))] transition-all" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500/10 group-hover:border-[rgb(var(--hsk-color))] group-focus-visible:border-[rgb(var(--hsk-color))] transition-all" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500/10 group-hover:border-[rgb(var(--hsk-color))] group-focus-visible:border-[rgb(var(--hsk-color))] transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
