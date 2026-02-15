'use client';
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function AdminPanel() {
  const [status, setStatus] = useState<string>('SYSTEM READY');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const runCommand = async (cmd: string, label: string) => {
    setLoading(true);
    setProgress(10); // Start progress
    setStatus(`EXECUTING: ${label}...`);

    try {
      const result = await invoke<string>(cmd);
      setProgress(100);
      setStatus(`SUCCESS: ${result}`);
    } catch (err) {
      setProgress(0);
      setStatus(`ERROR: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-80 bg-[#0a0f13] border-2 border-red-900/40 p-5 font-mono shadow-2xl">
      <div className="flex items-center justify-between mb-3 border-b border-red-900/20 pb-2">
        <span className="text-[9px] text-red-500 font-bold tracking-[0.2em] uppercase">
          Sys.Admin
        </span>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      </div>

      {/* TERMINAL STATUS */}
      <div className="bg-black/60 p-3 rounded border border-white/5 mb-4 h-24 overflow-y-auto text-[10px]">
        <p className="text-cyan-500/60 leading-tight"># {status}</p>
      </div>

      {/* PROGRESS BAR */}
      {loading && (
        <div className="w-full bg-red-900/20 h-1 mb-4 overflow-hidden rounded-full">
          <div
            className="bg-red-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          onClick={() => runCommand('backup_database', 'SNAPSHOT')}
          disabled={loading}
          className="w-full py-2 text-[10px] uppercase bg-blue-950/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
        >
          1. Snapshot_DB
        </button>

        <button
          onClick={() => runCommand('sync_hsk_levels', 'HSK_SYNC')}
          disabled={loading}
          className="w-full py-2 text-[10px] uppercase bg-red-950/20 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white transition-all"
        >
          2. Sync_HSK_Levels
        </button>

        <button
          onClick={() => runCommand('import_dictionary_data', 'DICT_IMPORT')}
          disabled={loading}
          className="w-full py-2 text-[10px] uppercase bg-emerald-950/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
        >
          3. Rebuild_Structures
        </button>

        <button
          onClick={() => runCommand('sync_json_metadata', 'SYNC_METADATA')}
          disabled={loading}
          className="w-full py-2 text-[10px] uppercase bg-amber-950/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500 hover:text-white transition-all"
        >
          4. Sync_JSON_Metadata
        </button>
      </div>
    </div>
  );
}
