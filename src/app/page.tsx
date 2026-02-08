'use client';
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CharacterData } from '../types/database';
import MetadataCard from '../components/ui/MetadataCard';

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

  /**
   * Executes a search via the Tauri IPC bridge.
   * @param {React.FormEvent} e - Optional form event to prevent default submission behavior.
   */
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

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-widest text-blueprint-accent uppercase mb-2">
            Hanzi Architect
          </h1>
          <p className="text-xs text-cyan-500/60 tracking-[0.2em] uppercase">
            Character Decomposition & Analysis System
          </p>
        </header>

        {/* Search Bar Area */}
        <div className="max-w-2xl mx-auto mb-16">
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
        </div>

        {/* Placeholder/Initial State */}
        {!characterData && !loading && (
          <div className="text-center py-20 border border-dashed border-cyan-500/10 rounded-2xl">
            <div className="text-cyan-500/20 text-6xl mb-4">叠</div>
            <h2 className="text-2xl font-light text-cyan-100/50">
              Explore the Architecture of Chinese Characters
            </h2>
            <p className="text-cyan-500/30 max-w-md mx-auto mt-4 text-sm">
              Search for a character above to analyze its structure and
              components.
            </p>
          </div>
        )}

        {characterData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <MetadataCard
              label="Pinyin"
              value={characterData.pinyin}
              icon={<span className="text-xs font-mono">PY</span>}
            />

            <MetadataCard
              label="Radical"
              value={characterData.radical}
              icon={<span className="text-xs font-mono">RD</span>}
            />

            <MetadataCard
              label="Definition"
              value={characterData.definition}
              className="md:col-span-2"
              icon={<span className="text-xs font-mono">DF</span>}
            />

            {/* Debug/Audit Card (shows the internal ID) */}
            <div className="md:col-span-2 text-center mt-4">
              <p className="text-[10px] text-cyan-500/20 uppercase tracking-widest">
                System ID: {characterData.id}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
