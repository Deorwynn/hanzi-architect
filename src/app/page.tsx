'use client';
import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CharacterData } from '../types/database';
import { getHskStyle } from '../utils/hskStyles';
import MetadataCard from '../components/ui/MetadataCard';
import CharacterHero from '../components/ui/CharacterHero';
import HistoryBar from '../components/ui/HistoryBar';
import DecompositionGrid from '../components/ui/DecompositionGrid';
import AdminPanel from '@/components/AdminPanel';
import StatusBadge from '@/components/ui/StatusBadge';
import { useRandomCharacter } from '../hooks/useRandomCharacter';

export default function HanziArchitect() {
  const [searchQuery, setSearchQuery] = useState('');
  const [characterData, setCharacterData] = useState<CharacterData | null>(
    null,
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CharacterData[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

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

      // Update History List
      setHistory((prev) => {
        const filtered = prev.filter(
          (item) => item.character !== result.character,
        );
        return [result, ...filtered].slice(0, 10);
      });

      // Save to last session
      localStorage.setItem('hanzi_last_session', JSON.stringify(result));
      setSearchQuery('');
    } catch (err) {
      console.error('Search Error:', err);
      setError(`Character "${target}" not found in records.`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize Random Hook
  const { triggerShuffle, isShuffling } = useRandomCharacter((char) => {
    performSearch(char);
  });

  // Sync History to LocalStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('hanzi_history', JSON.stringify(history));
    }
  }, [history]);

  // Load Session and History on Mount
  useEffect(() => {
    const savedLast = localStorage.getItem('hanzi_last_session');
    if (savedLast) setCharacterData(JSON.parse(savedLast));

    const savedHistory = localStorage.getItem('hanzi_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'r' &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        triggerShuffle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerShuffle]);

  // Handlers
  const handleSelectHistory = (item: CharacterData) =>
    performSearch(item.character);
  const handleComponentClick = (char: string) => performSearch(char);
  const handleFormSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const clearHistory = () => {
    localStorage.removeItem('hanzi_history');
    setHistory([]);
  };

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
        className={`relative z-10 max-w-6xl mx-auto px-6 py-12 ${isAdminOpen ? 'blur-sm transition-all' : ''}`}
      >
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-widest text-cyan-400 uppercase mb-2">
            Hanzi Architect
          </h1>
          <p className="text-xs text-cyan-500/60 tracking-[0.2em] uppercase">
            Character Decomposition & Analysis System
          </p>
        </header>

        {/* Search Bar Area */}
        <div className="mb-8">
          <form onSubmit={handleFormSearch} className="relative group">
            <div className="absolute -inset-1 bg-cyan-500/20 rounded-lg blur opacity-25 group-focus-within:opacity-100 transition duration-500"></div>
            <div className="relative flex items-center bg-[#161f27] border border-cyan-500/30 rounded-lg overflow-hidden">
              <label htmlFor="char-search" className="sr-only">
                Search characters
              </label>
              <input
                id="char-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入汉字 / Enter a Chinese character..."
                className="w-full bg-transparent px-6 py-4 outline-none text-cyan-100 placeholder:text-cyan-900"
              />
              <button
                type="submit"
                className="px-6 py-4 bg-cyan-500/10 border-l border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
              >
                {loading ? '...' : '🔍'}
              </button>
            </div>
          </form>

          {error && (
            <p className="mt-4 text-red-400 text-sm text-center font-mono italic">
              {error}
            </p>
          )}

          <div className="mt-4 flex justify-center">
            <button
              onClick={triggerShuffle}
              disabled={isShuffling}
              aria-label="Randomize character"
              className={`flex items-center gap-2 px-4 py-2 rounded border border-cyan-500/30 text-xs tracking-[0.2em] uppercase transition-all ${isShuffling ? 'opacity-50 cursor-wait' : 'hover:bg-cyan-500/10 hover:border-cyan-500/60'} text-cyan-400`}
            >
              {isShuffling ? '⟳ Syncing...' : '🎲 Random Character'}
            </button>
          </div>

          <HistoryBar
            history={history}
            onSelect={handleSelectHistory}
            onClear={clearHistory}
          />
        </div>

        {/* Results Section */}
        {characterData && (
          <section
            className={`
              mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700
              transition-opacity duration-300 
              ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}
            `}
          >
            {/* BADGE ROW*/}
            <div className="flex flex-wrap justify-center items-center gap-3 mb-8">
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
                  className="hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/40 rounded"
                  title={`Search variant: ${characterData.variants}`}
                >
                  <StatusBadge
                    label={
                      characterData.script_type === 'S'
                        ? 'Traditional Form'
                        : 'Simplified Form'
                    }
                    value={characterData.variants}
                    className="bg-purple-500/10 text-purple-400 border-purple-500/30 cursor-pointer hover:bg-purple-500/20"
                  />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[292px_1fr] gap-8 mb-12 items-start">
              <div className="w-full lg:mx-0">
                <CharacterHero
                  character={characterData.character}
                  hskLevel={characterData.hsk_level}
                  isRadical={characterData.is_radical}
                />
              </div>

              <div className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MetadataCard
                    label="Pinyin"
                    value={characterData.pinyin}
                    icon={
                      <span className="text-[10px] opacity-50">PINYIN</span>
                    }
                  />
                  <MetadataCard
                    label="Radical"
                    value={characterData.radical}
                    icon={<span className="text-[10px] opacity-50">部首</span>}
                  />
                  <div className="col-span-1 sm:col-span-2">
                    <MetadataCard
                      label="Definition"
                      value={characterData.definition}
                      icon={
                        <span className="text-[10px] opacity-50">MEANING</span>
                      }
                    />
                  </div>
                </div>
                <DecompositionGrid
                  decomposition={characterData.decomposition}
                  onComponentClick={handleComponentClick}
                />
              </div>
            </div>

            <div className="w-full flex justify-center pt-8">
              <p className="text-[10px] text-cyan-500/20 uppercase tracking-[0.3em]">
                ARCHITECT ID: {characterData.id.toString().padStart(4, '0')}
              </p>
            </div>
          </section>
        )}

        {/* Placeholder (Visible only if no data) */}
        {!characterData && !loading && (
          <div className="text-center py-20 border border-dashed border-cyan-500/10 rounded-2xl">
            <h2 className="text-xl font-light text-cyan-100/30 italic">
              System Idle. Awaiting character input...
            </h2>
          </div>
        )}
      </main>
      {/* Admin Toggle Button */}
      <button
        onClick={() => setIsAdminOpen(!isAdminOpen)}
        className="fixed bottom-6 right-6 z-[60] p-3 bg-[#161f27] border border-cyan-500/30 rounded-full text-cyan-400 shadow-lg hover:bg-cyan-500/20 transition-all active:scale-90"
        title="Database Maintenance"
      >
        {isAdminOpen ? '✕' : '⚙️'}
      </button>

      {/* Admin Modal */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsAdminOpen(false)}
          />

          {/* Panel Container */}
          <div className="relative bg-[#0f1419] border border-cyan-500/40 p-8 rounded-xl max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.2)] animate-in zoom-in-95 duration-200">
            <h3 className="text-cyan-400 font-bold mb-6 tracking-widest uppercase border-b border-cyan-500/20 pb-2">
              System Maintenance
            </h3>
            <AdminPanel />
            <p className="text-[9px] text-cyan-500/40 mt-6 text-center italic">
              Caution: Modifications to SQLite store are immediate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
