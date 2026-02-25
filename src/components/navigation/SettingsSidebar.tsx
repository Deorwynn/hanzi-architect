'use client';
import { useSettings } from '@/context/SettingsContext';
import { useState } from 'react';
import AdminPanel from '@/components/AdminPanel';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export default function SettingsSidebar() {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    scriptPreference,
    setScriptPreference,
  } = useSettings();
  const [showAdmin, setShowAdmin] = useState(false);
  const sidebarRef = useFocusTrap(isSettingsOpen, () =>
    setIsSettingsOpen(false),
  );

  return (
    <>
      {/* Overlay */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          onClick={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        ref={sidebarRef as React.RefObject<HTMLDivElement>}
        tabIndex={-1}
        className={`fixed left-0 top-0 h-full w-80 bg-[#0f1419] border-r border-cyan-500/20 z-[101] p-6 transition-transform duration-300 ease-in-out flex flex-col ${isSettingsOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-cyan-400 text-xs font-bold tracking-[0.3em] uppercase">
            Control_Panel
          </h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="text-white/40 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
          {/* SCRIPT PREFERENCE */}
          <section>
            <label className="text-[9px] text-white/30 uppercase tracking-widest block mb-4">
              Script Filter
            </label>
            <div className="flex flex-col gap-2">
              {(['Simplified', 'Traditional', 'Both'] as const).map((pref) => (
                <button
                  key={pref}
                  onClick={() => setScriptPreference(pref)}
                  className={`w-full py-2 text-[10px] border transition-all ${
                    scriptPreference === pref
                      ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 font-bold'
                      : 'border-white/5 text-white/40 hover:bg-white/5'
                  }`}
                >
                  {pref === 'Both' ? 'Show Both' : `${pref} Only`}
                </button>
              ))}
            </div>
          </section>

          {/* ADMIN TOGGLE */}
          <section className="pt-8 border-t border-white/5">
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className="text-[9px] text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors mb-4"
            >
              {showAdmin ? '▼ Hide Maintenance' : '▶ System Maintenance'}
            </button>

            {showAdmin && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                <AdminPanel />
              </div>
            )}
          </section>
        </div>

        <div className="pt-6 border-t border-white/5 text-[8px] text-white/20 uppercase tracking-widest text-center">
          Hanzi Architect // Build 2026.02
        </div>
      </aside>
    </>
  );
}
