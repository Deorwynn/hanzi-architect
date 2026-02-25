'use client';
import { useSettings } from '@/context/SettingsContext';

export default function GlobalNav() {
  const { setIsSettingsOpen } = useSettings();

  return (
    <nav className="h-14 border-b border-cyan-500/10 bg-[#161f27] flex items-center px-6 justify-between shrink-0 z-40">
      <div className="flex items-center gap-8">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="text-xl hover:scale-110 transition-transform"
        >
          ⚙️
        </button>
        <div className="flex gap-6 text-[10px] uppercase tracking-[0.2em] font-bold">
          <span className="text-cyan-400 border-b border-cyan-400 pb-1">
            Architect
          </span>
          <span className="text-white/20 hover:text-white/60 cursor-not-allowed">
            Games
          </span>
          <span className="text-white/20 hover:text-white/60 cursor-not-allowed">
            Grammar
          </span>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="text-cyan-500/30 text-[9px] font-mono tracking-widest"
      >
        SYSTEM_v3.0.4
      </div>
    </nav>
  );
}
