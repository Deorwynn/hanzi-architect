'use client';
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function AdminPanel() {
  const [status, setStatus] = useState<string>('SYSTEM READY');
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchChar, setSearchChar] = useState('');
  const [editChar, setEditChar] = useState<any>(null);

  const runCommand = async (cmd: string, label: string) => {
    setLoading(true);
    setStatus(`EXECUTING: ${label}...`);
    try {
      const result = await invoke<string>(cmd);
      setStatus(`SUCCESS: ${result}`);
    } catch (err) {
      setStatus(`ERROR: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCharacter = async () => {
    if (!searchChar) return;
    setLoading(true);
    try {
      const data = await invoke<any>('get_character_details', {
        target: searchChar,
      });
      setEditChar(data);
      setStatus(`LOADED: ${searchChar}`);
    } catch (err) {
      setStatus('ERROR: Character not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editChar) return;
    setLoading(true);
    setStatus('WRITING TO MASTER_DB.JSON...');
    try {
      await invoke('save_character_to_json', { updatedChar: editChar });
      setStatus('JSON UPDATED. REBUILDING SQLITE...');
      await invoke('initialize_database');
      setStatus('SYNC COMPLETE: SYSTEM UPDATED');
    } catch (err) {
      setStatus(`CRITICAL ERROR: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-80 bg-[#0a0f13] border-2 border-red-900/40 p-5 font-mono shadow-2xl">
      <div className="flex items-center justify-between mb-3 border-b border-red-900/20 pb-2">
        <span className="text-[9px] text-red-500 font-bold tracking-[0.2em] uppercase">
          Sys.Admin {isEditMode ? '// EDIT_MODE' : '// SYS_OP'}
        </span>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className="text-[8px] px-2 py-0.5 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white"
        >
          TOGGLE
        </button>
      </div>

      <div className="bg-black/60 p-3 rounded border border-white/5 mb-4 h-24 overflow-y-auto text-[10px]">
        <p className="text-cyan-500/60 leading-tight whitespace-pre-wrap">
          # {status}
        </p>
      </div>

      {!isEditMode ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => runCommand('backup_database', 'SNAPSHOT')}
            disabled={loading}
            className="w-full py-2 text-[10px] uppercase bg-blue-950/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
          >
            1. Snapshot_DB
          </button>
          <button
            onClick={() => runCommand('initialize_database', 'MASTER_REBUILD')}
            disabled={loading}
            className="w-full py-2 text-[10px] uppercase bg-red-950/20 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white transition-all"
          >
            2. Master_Rebuild
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex gap-1">
            <input
              className="flex-1 bg-black border border-white/10 text-[10px] px-2 py-1 text-white outline-none focus:border-cyan-500"
              placeholder="CHAR_TO_EDIT"
              value={searchChar}
              onChange={(e) => setSearchChar(e.target.value)}
            />
            <button
              onClick={loadCharacter}
              className="bg-white/10 px-3 text-[10px] text-white hover:bg-white/20"
            >
              LOAD
            </button>
          </div>

          {editChar && (
            <div className="mt-2 space-y-2 border-t border-white/5 pt-2">
              <div className="flex justify-between text-[8px] text-white/40">
                <span>SCRIPT: {editChar.script_type}</span>
                <span>CHAR: {editChar.character}</span>
              </div>
              <input
                className="w-full bg-black border border-white/10 text-[10px] px-2 py-1 text-cyan-400"
                placeholder="Traditional Variant"
                value={editChar.traditional_variant || ''}
                onChange={(e) =>
                  setEditChar({
                    ...editChar,
                    traditional_variant: e.target.value,
                  })
                }
              />
              <input
                className="w-full bg-black border border-white/10 text-[10px] px-2 py-1 text-cyan-400"
                placeholder="Simplified Variant"
                value={editChar.simplified_variant || ''}
                onChange={(e) =>
                  setEditChar({
                    ...editChar,
                    simplified_variant: e.target.value,
                  })
                }
              />
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="w-full py-2 text-[10px] uppercase bg-green-950/20 border border-green-500/50 text-green-400 hover:bg-green-500 hover:text-white"
              >
                Execute Overwrite
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
