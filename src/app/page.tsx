'use client';
import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CharacterData } from '../types/database';
import { getHskStyle } from '../utils/hskStyles';
import InfoCard from '@/components/ui/InfoCard';
import CharacterHero from '../components/ui/CharacterHero';
import HistoryBar from '../components/ui/HistoryBar';
import DecompositionGrid from '../components/ui/DecompositionGrid';
import AdminPanel from '@/components/AdminPanel';
import StatusBadge from '@/components/ui/StatusBadge';
import { useRandomCharacter } from '../hooks/useRandomCharacter';
import RelatedUnitsSidebar from '@/components/ui/RelatedUnitsSidebar';

type RelationshipMode = 'Radical' | 'Sound' | 'HSK';

export default function HanziArchitect() {
  const [searchQuery, setSearchQuery] = useState('');
  const [characterData, setCharacterData] = useState<CharacterData | null>(
    null,
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CharacterData[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<RelationshipMode>('Radical');

  /**
   * CENTRALIZED FETCH LOGIC
   */
  const performSearch = useCallback(async (target: string) => {
    if (!target.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await invoke<CharacterData>('get_character_details', {
        target: target.trim(),
      });

      setCharacterData(result);
      localStorage.setItem('hanzi_last_session', JSON.stringify(result));

      setHistory((prev) => {
        const filtered = prev.filter(
          (item) => item.character !== result.character,
        );
        const newHistory = [result, ...filtered].slice(0, 10);
        localStorage.setItem('hanzi_history', JSON.stringify(newHistory));
        return newHistory;
      });

      setSearchQuery('');
    } catch (err) {
      setError(`Character "${target}" not found in records.`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize Random Hook
  const { triggerShuffle, isShuffling } = useRandomCharacter((char) => {
    performSearch(char);
  });

  // Load Session and History on Mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('hanzi_history');
    const savedLast = localStorage.getItem('hanzi_last_session');

    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error(e);
      }
    }

    if (savedLast) {
      try {
        setCharacterData(JSON.parse(savedLast));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCharacterData(null);
    localStorage.removeItem('hanzi_history');
    localStorage.removeItem('hanzi_last_session');
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      const key = e.key.toLowerCase();

      if (key === 'r') triggerShuffle();
      if (key === 'v' && characterData?.variants) {
        performSearch(characterData.variants);
      }

      if (key === 'escape') clearHistory();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerShuffle, characterData, performSearch, clearHistory]);

  // Handlers
  const handleComponentClick = (char: string) => performSearch(char);

  return (
    <div className="min-h-screen bg-[#0f1419] text-white relative overflow-hidden font-sans">
      {/* Blueprint grid background */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, .5) 25%, rgba(6, 182, 212, .5) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .5) 75%, rgba(6, 182, 212, .5) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(6, 182, 212, .5) 25%, rgba(6, 182, 212, .5) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .5) 75%, rgba(6, 182, 212, .5) 76%, transparent 77%, transparent)`,
          backgroundSize: '50px 50px',
        }}
      />

      <main
        className={`relative z-10 max-w-[1600px] mx-auto px-6 py-8 ${isAdminOpen ? 'blur-sm transition-all' : ''}`}
      >
        {/* Compact Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 border-b border-cyan-500/10 pb-6">
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-widest text-cyan-400 uppercase">
              Hanzi Architect
            </h1>
            <p className="text-[10px] text-cyan-500/40 tracking-[0.2em] uppercase">
              Decomposition Analysis
            </p>
          </div>

          <div className="flex-1 max-w-xl w-full">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                performSearch(searchQuery);
              }}
              className="relative"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Search..."
                className="w-full bg-[#161f27] border border-cyan-500/20 px-4 py-2 rounded outline-none focus:border-cyan-500/50 text-cyan-100 transition-all"
              />
              <button
                type="submit"
                className="absolute right-3 top-2 opacity-50 hover:opacity-100"
              >
                🔍
              </button>
            </form>
          </div>

          <button
            onClick={triggerShuffle}
            disabled={isShuffling}
            className="text-[10px] border border-cyan-500/20 px-4 py-2 rounded hover:bg-cyan-500/10 transition-all text-cyan-400 uppercase tracking-widest w-32 flex items-center justify-center"
          >
            {isShuffling ? (
              <span className="animate-pulse">Syncing...</span>
            ) : (
              '🎲 Random'
            )}
          </button>
        </div>

        {/* Error Message HUD */}
        {error && (
          <div className="max-w-xl mx-auto mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded flex items-center gap-3">
            <span className="text-red-500 font-mono text-xs">
              ![CRITICAL_ERROR]
            </span>
            <p className="text-[10px] text-red-200 uppercase tracking-widest">
              {error}
            </p>
          </div>
        )}

        <HistoryBar
          history={history}
          onSelect={(item) => performSearch(item.character)}
          onClear={clearHistory}
        />

        {/* MAIN CONTENT */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
            <p className="text-[10px] text-cyan-500 uppercase tracking-[0.5em] animate-pulse">
              Analyzing_Structure...
            </p>
          </div>
        ) : characterData ? (
          <div
            className="
              grid mt-8 gap-8 xl:gap-12 items-start
              grid-cols-1 
              md:grid-cols-[0.8fr_1.2fr] 
              lg:grid-cols-[minmax(280px,350px)_minmax(400px,1fr)_minmax(280px,350px)]"
          >
            {/* CHARACTER HERO */}
            <section className="flex flex-col items-center w-full min-w-0 order-1 lg:order-2">
              <div className="w-full flex justify-center scale-90 md:scale-100 transition-transform">
                <CharacterHero
                  character={characterData.character}
                  hskLevel={characterData.hsk_level}
                  isRadical={characterData.is_radical}
                />
              </div>

              <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-xs mx-auto">
                <StatusBadge
                  label="HSK"
                  value={characterData.hsk_level ?? 'N/A'}
                  className={getHskStyle(characterData.hsk_level).badgeClass}
                />
                <StatusBadge
                  label="字体"
                  value={
                    characterData.script_type === 'S'
                      ? 'Simplified'
                      : characterData.script_type === 'T'
                        ? 'Traditional'
                        : 'Universal'
                  }
                  className="bg-blue-500/10 text-blue-400 border-blue-500/30"
                />
                {characterData.variants && (
                  <button
                    onClick={() => performSearch(characterData.variants!)}
                    className="group outline-none"
                  >
                    <StatusBadge
                      label={
                        <span className="flex items-center gap-1.5">
                          <span
                            aria-hidden="true"
                            className="opacity-50 group-hover:opacity-100 transition-opacity"
                          >
                            ⇄
                          </span>
                          {characterData.script_type === 'S'
                            ? 'Traditional'
                            : 'Simplified'}
                        </span>
                      }
                      value={characterData.variants}
                      className="bg-lime-500/10 text-lime-400 border-lime-500/30 hover:bg-lime-500/20 shadow-[0_0_10px_rgba(163,230,53,0.1)]"
                    />
                  </button>
                )}
              </div>
            </section>

            {/* TECHNICAL INFO */}
            <section className="order-2 lg:order-3 w-full">
              <div className="flex flex-col sm:flex-row lg:flex-col gap-6 items-start">
                {/* Info Card - Left Side on Tablet */}
                <InfoCard
                  pinyin={characterData.pinyin}
                  radical={characterData.radical}
                  definition={characterData.definition}
                />

                {/* DECOMPOSITION GRID */}
                <div className="w-full sm:w-auto lg:w-full">
                  <DecompositionGrid
                    decomposition={characterData.decomposition}
                    onComponentClick={handleComponentClick}
                  />
                </div>
              </div>
            </section>

            {/* RELATED CHARACTERS */}
            <RelatedUnitsSidebar
              radical={characterData.radical}
              pinyin={characterData.pinyin}
              currentCharacter={characterData.character}
              onSelect={performSearch}
              hskLevel={characterData.hsk_level}
              mode={sidebarMode}
              setMode={setSidebarMode}
            />
          </div>
        ) : (
          <div className="bg-[#161f27]/30 text-center py-40 border border-dashed border-cyan-500/10 rounded-2xl mt-10 px-8 md:px-20">
            <h2 className="text-l md:text-xl font-light text-cyan-200/30 italic tracking-widest uppercase">
              System Standby...
            </h2>
            <p className="text-[9px] text-cyan-500/30 mt-2 tracking-[0.3em]">
              SEARCH FOR A CHARACTER TO BEGIN ANALYSIS
            </p>
          </div>
        )}
      </main>

      {/* Admin Maintenance UI */}
      <button
        onClick={() => setIsAdminOpen(!isAdminOpen)}
        className="fixed bottom-6 right-6 z-[60] p-3 bg-[#161f27] border border-cyan-500/30 rounded-full text-cyan-400 shadow-lg hover:bg-cyan-500/20 transition-all"
      >
        {isAdminOpen ? '✕' : '⚙️'}
      </button>

      {isAdminOpen && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsAdminOpen(false)}
          />
          <div className="relative bg-[#0f1419] border border-cyan-500/40 p-8 rounded-xl max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.2)] animate-in zoom-in-95">
            <h3 className="text-cyan-400 font-bold mb-6 tracking-widest uppercase border-b border-cyan-500/20 pb-2">
              Maintenance Mode
            </h3>
            <AdminPanel />
          </div>
        </div>
      )}
    </div>
  );
}
