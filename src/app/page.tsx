'use client';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CharacterData } from '../types/database';
import MetadataCard from '../components/ui/MetadataCard';
import CharacterHero from '../components/ui/CharacterHero';
import HistoryBar from '../components/ui/HistoryBar';

/**
 * Main application dashboard for Hánzì Architect.
 * Handles the orchestration of user input, Rust IPC calls, and character state management.
 */
export default function HanziArchitect() {
  const [searchQuery, setSearchQuery] = useState('');
  const [characterData, setCharacterData] = useState<CharacterData | null>(
    null,
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CharacterData[]>([]);

  // Load both Session and History on Mount
  useEffect(() => {
    // Restore Last Session
    const savedLast = localStorage.getItem('hanzi_last_session');
    if (savedLast) {
      try {
        setCharacterData(JSON.parse(savedLast));
      } catch (err) {
        console.error('Session restore failed', err);
      }
    }

    // Restore History List
    const savedHistory = localStorage.getItem('hanzi_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error('History restore failed', err);
      }
    }
  }, []);

  /**
   * Logical Handler for selecting from History.
   * Re-fetches from SQLite to ensure data is "hydrated" and fresh.
   */
  const handleSelectHistory = async (item: CharacterData) => {
    setLoading(true);
    try {
      const freshData = await invoke<CharacterData>('get_character_details', {
        target: item.character,
      });

      setCharacterData(freshData);

      updateHistory(freshData);
    } catch (err) {
      console.error('Failed to hydrate history item:', err);

      setCharacterData(item);
      updateHistory(item);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Centralized History Management
   */
  const updateHistory = (newEntry: CharacterData) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (item) => item.character !== newEntry.character,
      );
      const updated = [newEntry, ...filtered].slice(0, 10);
      localStorage.setItem('hanzi_history', JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem('hanzi_last_session', JSON.stringify(newEntry));
  };

  /**
   * Clear Utility
   */
  const clearHistory = () => {
    localStorage.removeItem('hanzi_history');
    setHistory([]);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Invoke the Rust command 'get_character_details'
      const result = await invoke<CharacterData>('get_character_details', {
        target: searchQuery.trim(),
      });

      setCharacterData(result);
      updateHistory(result);
      setSearchQuery('');
    } catch (err) {
      console.error('IPC Error:', err);
      setError(`Character "${searchQuery}" not found in local records.`);
      setCharacterData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] text-white relative overflow-hidden font-sans">
      {/* Blueprint grid background */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, .5) 25%, rgba(6, 182, 212, .5) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .5) 75%, rgba(6, 182, 212, .5) 76%, transparent 77%, transparent),
          linear-gradient(90deg, transparent 24%, rgba(6, 182, 212, .5) 25%, rgba(6, 182, 212, .5) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .5) 75%, rgba(6, 182, 212, .5) 76%, transparent 77%, transparent)`,
          backgroundSize: '50px 50px',
        }}
      />

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
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
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute -inset-1 bg-cyan-500/20 rounded-lg blur opacity-25 group-focus-within:opacity-100 transition duration-500"></div>
            <div className="relative flex items-center bg-[#161f27] border border-cyan-500/30 rounded-lg overflow-hidden">
              <input
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
          <HistoryBar
            history={history}
            onSelect={handleSelectHistory}
            onClear={clearHistory}
          />
        </div>

        {/* Results Section */}
        {characterData && (
          <section className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-[292px_1fr] gap-8 mb-12 items-start">
              <div className="w-full lg:mx-0">
                <CharacterHero character={characterData.character} />
              </div>

              <div className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <MetadataCard
                    label="HSK Level"
                    value={
                      characterData.hsk_level
                        ? `HSK ${characterData.hsk_level}`
                        : 'N/A'
                    }
                    icon={
                      <span className="text-[10px] opacity-50 text-orange-400">
                        HSK 3.0
                      </span>
                    }
                  />
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
                  <div className="col-span-1 sm:col-span-3">
                    {' '}
                    <MetadataCard
                      label="Definition"
                      value={characterData.definition}
                      icon={
                        <span className="text-[10px] opacity-50">MEANING</span>
                      }
                    />
                  </div>
                </div>
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
    </div>
  );
}
