'use client';
import { useClipboard } from '../../hooks/useClipboard';
import { getHskStyle } from '@/utils/hskStyles';
import { SpeakButton } from '../ui/SpeakButton';

interface CharacterHeroProps {
  character: string;
  pinyin?: string;
  hskLevel?: number | null;
  isRadical?: boolean;
}

export default function CharacterHero({
  character,
  pinyin,
  hskLevel,
  isRadical,
}: CharacterHeroProps) {
  const { copied, copy } = useClipboard();
  const hskStyle = getHskStyle(hskLevel);

  return (
    <div className="relative w-full max-w-[292px] mx-auto group">
      <SpeakButton
        text={character}
        pinyin={pinyin}
        className="absolute top-4 right-4"
      />

      <button
        onClick={() => copy(character)}
        style={{ '--focus-glow': hskStyle.glow } as React.CSSProperties}
        className={`
      group relative flex items-center justify-center 
      w-full max-w-[292px] mx-auto aspect-square 
      bg-[#161f27] border-2 rounded-2xl overflow-hidden 
      transition-all duration-500 outline-none cursor-pointer
      ${hskStyle.textClass} ${hskStyle.borderClass}
      ${hskStyle.isRaw ? 'animate-flicker hover:border-slate-300/60' : 'hover:border-current/60'}
      focus-visible:shadow-[0_0_40px_var(--focus-glow)]
      focus-visible:border-current/100
    `}
      >
        {/* HARDWARE HUM: Using white at very low opacity for a neutral 'glow' */}
        {hskLevel && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none z-0 bg-white opacity-[0.01] animate-hsk-hum"
          />
        )}
        {/* DECORATIVE: Scanlines & Beam (Hidden from SR) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-scanline pointer-events-none opacity-[0.12] z-20 animate-[old-screen-flicker_0.15s_infinite]"
        />
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 h-12 bg-scanline-pulse pointer-events-none z-20 animate-scan opacity-30"
        />

        {/* HUD Labels (Hidden from SR) */}
        <div
          aria-hidden="true"
          className="absolute top-3 left-8 text-[10px] font-mono text-cyan-500/50 tracking-[0.2em] uppercase z-30 group-focus-visible:text-cyan-400 transition-colors"
        >
          Result: {hskStyle.label}
        </div>
        <div
          aria-hidden="true"
          className="absolute bottom-3 right-8 text-[10px] font-mono text-cyan-500/50 tracking-[0.2em] uppercase z-30 group-focus-visible:text-cyan-400 transition-colors"
        >
          {isRadical ? 'Radical_Sync: 100%' : 'Structure: Verified'}
        </div>

        {/* Measurement lines (Hidden from SR) */}
        <div
          aria-hidden="true"
          className="absolute top-8 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent transition-opacity group-focus-visible:opacity-100"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-8 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent transition-opacity group-focus-visible:opacity-100"
        />

        {/* THE CHARACTER */}
        <div className="relative z-10 font-hero text-[8rem] sm:text-[10rem] md:text-[12rem] leading-none transition-all duration-300">
          <span
            className={`relative z-10 block transition-all duration-300 drop-shadow-[0_0_35px_currentColor]
          ${copied ? 'opacity-30' : 'group-hover:scale-105 group-focus-visible:scale-105'}
        `}
          >
            {character}
          </span>
          {copied && (
            <>
              <span className="glitch-layer glitch-red z-20" aria-hidden="true">
                {character}
              </span>
              <span
                className="glitch-layer glitch-blue z-20"
                aria-hidden="true"
              >
                {character}
              </span>
            </>
          )}
        </div>

        {/* STATUS BADGE */}
        <div className="absolute top-12 inset-x-0 flex justify-center z-40">
          <span
            className={`text-[9px] uppercase tracking-[0.3em] font-bold px-3 py-1 rounded-full transition-all duration-300
    ${
      copied
        ? 'bg-emerald-500 text-black opacity-100 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
        : 'bg-cyan-500/20 text-cyan-400 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0'
    }
  `}
          >
            {copied ? 'DATA CAPTURED' : 'COPY HANZI'}
          </span>
        </div>

        {/* CORNER ACCENTS (Hidden from SR) */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 transition-all duration-500 border-current opacity-40 group-hover:opacity-100 group-focus-visible:opacity-100"
        />
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 transition-all duration-500 border-current opacity-40 group-hover:opacity-100 group-focus-visible:opacity-100"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 transition-all duration-500 border-current opacity-40 group-hover:opacity-100 group-focus-visible:opacity-100"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 transition-all duration-500 border-current opacity-40 group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      </button>
    </div>
  );
}
