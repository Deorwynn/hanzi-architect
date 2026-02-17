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

  if (!decomposition || (components.length === 0 && !loading)) return null;

  const ChipLeads = ({ side }: { side: 'left' | 'right' }) => (
    <div
      className={`absolute ${side === 'left' ? '-left-[10px]' : '-right-[10px]'} top-0 bottom-0 flex flex-col justify-around py-4 pointer-events-none`}
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-[10px] h-[2px] bg-current opacity-20 group-hover:opacity-100 transition-opacity"
        />
      ))}
    </div>
  );

  return (
    <div className="mt-12 border-t border-cyan-500/10 pt-8 animate-in fade-in duration-1000">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {components.map((comp) => {
          const isHsk = !!comp.hsk_level;
          const hskStyle = getHskStyle(comp.hsk_level);

          const buttonClasses = [
            'group relative flex flex-col items-center justify-center px-8 py-6',
            'bg-[#10171d] border-2 transition-all duration-300 outline-none cursor-pointer',
            hskStyle.textClass,
            hskStyle.borderClass,
            hskStyle.isRaw ? 'animate-flicker' : 'hover:border-current/60',
            'focus-visible:shadow-[0_0_25px_var(--focus-glow)]',
          ].join(' ');

          return (
            <button
              key={comp.id}
              onClick={() => onComponentClick?.(comp.character)}
              className={buttonClasses}
              style={{ '--focus-glow': hskStyle.glow } as React.CSSProperties}
            >
              {/* HARDWARE HUM */}
              {isHsk && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none z-0 bg-white opacity-[0.01] animate-hsk-hum"
                />
              )}

              {/* MICROCHIP LEADS */}
              <ChipLeads side="left" />
              <ChipLeads side="right" />

              {/* CHARACTER */}
              <span
                style={{
                  color: hskStyle.charColor,
                  filter: `drop-shadow(0 0 15px ${hskStyle.glow})`,
                }}
                className="relative z-10 text-5xl mb-3 font-hero transition-all duration-300 group-hover:scale-75 group-hover:opacity-10 group-focus-visible:opacity-10"
              >
                {comp.character}
              </span>

              {/* PINYIN */}
              <span
                className="relative z-10 text-[10px] font-mono uppercase tracking-[0.2em] transition-opacity duration-300 group-hover:opacity-0 group-focus-visible:opacity-0"
                style={{ color: hskStyle.charColor, opacity: 0.6 }}
              >
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
                <div className="text-center px-4">
                  <p className="text-[9px] text-cyan-500/60 font-mono mb-2 tracking-tighter uppercase">
                    Data_Stream
                  </p>
                  <p className="text-[12px] leading-tight text-white font-mono uppercase tracking-wide">
                    {comp.definition.split(';')[0]}
                  </p>
                  <div className="mt-3 h-px w-8 bg-current mx-auto opacity-50" />
                </div>
              </div>

              {/* HUD Corners */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-current opacity-20 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-current opacity-20 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-current opacity-20 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-current opacity-20 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
