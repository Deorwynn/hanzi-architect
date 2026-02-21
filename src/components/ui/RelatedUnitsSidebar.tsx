'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CharacterData } from '../../types/database';

interface RelatedUnitsSidebarProps {
  radical: string;
  pinyin: string;
  currentCharacter: string;
  onSelect: (char: string) => void;
  hskLevel?: number | null;
  mode: RelationshipMode;
  setMode: (mode: RelationshipMode) => void;
}

type RelationshipMode = 'Radical' | 'Sound' | 'HSK';

export default function RelatedUnitsSidebar({
  radical,
  pinyin,
  currentCharacter,
  onSelect,
  hskLevel,
  mode,
  setMode,
}: RelatedUnitsSidebarProps) {
  const [related, setRelated] = useState<CharacterData[]>([]);
  const [loading, setLoading] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentBoxSize
          ? entry.contentBoxSize[0].inlineSize
          : entry.contentRect.width;

        const cols = Math.floor((width + 12) / (60 + 12));
        setColumns(Math.max(1, cols));
      }
    });

    if (gridRef.current) observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);

  const { displayedRelated, placeholdersNeeded } = useMemo(() => {
    const ceiling = columns * 4;
    const sliced = related.slice(0, ceiling);
    const remainder = sliced.length % columns;
    return {
      displayedRelated: sliced,
      placeholdersNeeded: remainder === 0 ? 0 : columns - remainder,
    };
  }, [related, columns]);

  useEffect(() => {
    async function fetchRelated() {
      if (!radical) return;
      setLoading(true);
      try {
        const results = await invoke<CharacterData[]>(
          'get_related_characters',
          {
            radical,
            currentChar: currentCharacter,
            mode,
            pinyin,
          },
        );
        setRelated(results);
      } catch (err) {
        console.error('Failed to fetch related characters:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRelated();
  }, [radical, currentCharacter, mode]);

  return (
    <aside className="bg-[#161f27]/30 border border-cyan-500/10 rounded-lg p-5 order-3 lg:order-1 md:col-span-2 lg:col-span-1 lg:sticky lg:top-8">
      {/* HEADER WITH MODE TOGGLE */}
      <div className="mb-6">
        <h2 className="text-sm text-cyan-500/80 uppercase tracking-[0.2em] mb-3">
          <strong>Explore related characters by:</strong>
        </h2>
        <div className="flex bg-black/20 p-1 rounded border border-cyan-500/10">
          {(['Radical', 'Sound', 'HSK'] as RelationshipMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 text-[11px] py-1.5 rounded uppercase tracking-wider transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400/50 ${
                mode === m
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-cyan-500/50 hover:text-cyan-500/90 hover:border-cyan-500/10 border border-transparent'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-cyan-500/50 uppercase tracking-[0.2em] mt-3 min-h-[1.2em]">
          {mode === 'HSK' && `Characters at HSK (3.0) level ${hskLevel ?? '1'}`}
          {mode === 'Sound' && `Characters pronounced "${pinyin}"`}
          {mode === 'Radical' && `Characters with radical "${radical}"`}
        </p>
      </div>

      {/* GRID */}
      <div
        ref={gridRef}
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(60px, 1fr))`,
        }}
      >
        {loading ? (
          /* LOADING STATE */
          [...Array(columns * 2)].map((_, i) => (
            <div
              key={`loading-${i}`}
              className="aspect-square bg-cyan-500/5 animate-pulse rounded border border-cyan-500/5"
            />
          ))
        ) : displayedRelated.length > 0 ? (
          /* DATA FOUND STATE */
          <>
            {displayedRelated.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.character)}
                className="group aspect-square border border-dashed border-cyan-500/10 bg-cyan-500/[0.02] hover:border-cyan-500/40 hover:bg-cyan-500/10 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                title={`${item.character} (${item.pinyin}): ${item.definition}`}
              >
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                <span className="text-[10px] leading-none text-cyan-500/60 group-hover:text-cyan-400/80 transition-colors uppercase tracking-tighter mb-0.5 z-10">
                  {item.pinyin.replace(/[0-9]/g, '')}
                </span>
                <span className="text-2xl font-light text-cyan-100 group-hover:scale-110 transition-transform z-10">
                  {item.character}
                </span>
              </button>
            ))}

            {placeholdersNeeded > 0 &&
              [...Array(placeholdersNeeded)].map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square border border-cyan-500/5 flex items-center justify-center text-cyan-500/10 text-lg select-none"
                />
              ))}
          </>
        ) : (
          /* EMPTY STATE */
          <div className="col-span-full py-8 px-4 border border-dashed border-cyan-500/10 rounded bg-cyan-500/[0.01] flex flex-col items-center justify-center text-center">
            <span className="text-cyan-500/20 text-2xl mb-2">∅</span>
            <p className="text-cyan-500/50 text-[10px] uppercase tracking-widest leading-relaxed">
              No other characters found
              <br />
              in this category
            </p>
          </div>
        )}
      </div>

      {/* FOOTER WITH VIEW ALL BUTTON */}
      <button className="w-full mt-6 pt-3 border-t border-cyan-500/5 text-left group cursor-pointer">
        <span className="text-[10px] text-cyan-500/50 group-hover:text-cyan-400 transition-colors flex items-center justify-start uppercase tracking-wider">
          View all {mode} results ({related.length})
          <span
            aria-hidden="true"
            className="opacity-0 pl-2 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0"
          >
            →
          </span>
        </span>
      </button>
    </aside>
  );
}
