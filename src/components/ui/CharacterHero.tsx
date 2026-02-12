interface CharacterHeroProps {
  character: string;
  hskLevel?: number | null;
  isRadical?: boolean;
}

export default function CharacterHero({
  character,
  hskLevel,
  isRadical,
}: CharacterHeroProps) {
  const getGlowStyles = () => {
    if (!hskLevel)
      return 'border-cyan-500/30 shadow-none text-cyan-200/60 drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]';

    if (hskLevel <= 3)
      return 'border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.25)] text-cyan-300';

    if (hskLevel <= 6)
      return 'border-emerald-400/50 shadow-[0_0_30px_rgba(52,211,153,0.25)] text-emerald-300';

    return 'border-orange-500/60 shadow-[0_0_40px_rgba(249,115,22,0.4)] text-orange-300';
  };

  const glowClass = getGlowStyles();

  return (
    <div
      className={`relative w-full h-[292px] flex items-center justify-center bg-[#0f1419] border-2 rounded-xl p-6 transition-all duration-1000 overflow-hidden ${glowClass}`}
    >
      {/* 1. Static Scanline Pattern & Flicker */}
      <div className="absolute inset-0 bg-scanline pointer-events-none opacity-[0.12] z-20 animate-[old-screen-flicker_0.15s_infinite]" />

      {/* 2. Animated Scanning Beam */}
      <div className="absolute left-0 right-0 h-12 bg-scanline-pulse pointer-events-none z-20 animate-scan opacity-30" />

      {/* 3. HUD Labels */}
      <div className="absolute top-3 left-8 text-[10px] font-mono text-cyan-500/50 tracking-[0.2em] uppercase z-30">
        Result: {hskLevel ? 'Index_Match' : 'Unclassified_Entry'}
      </div>

      <div className="absolute bottom-3 right-8 text-[10px] font-mono text-cyan-500/50 tracking-[0.2em] uppercase z-30">
        {isRadical ? 'Radical_Sync: 100%' : 'Structure: Verified'}
      </div>

      {/* 4. Measurement lines */}
      <div className="absolute top-8 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      <div className="absolute bottom-8 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      {/* 5. The Character */}
      <div className="relative z-10 font-hero text-[8rem] sm:text-[10rem] md:text-[12rem] leading-none transition-all duration-1000 drop-shadow-[0_0_35px_currentColor]">
        {character}
      </div>

      {/* Figma Corners */}
      <div
        className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 transition-colors duration-1000 ${hskLevel ? 'border-current' : 'border-cyan-400/30'}`}
      />
      <div
        className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 transition-colors duration-1000 ${hskLevel ? 'border-current' : 'border-cyan-400/30'}`}
      />
      <div
        className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 transition-colors duration-1000 ${hskLevel ? 'border-current' : 'border-cyan-400/30'}`}
      />
      <div
        className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 transition-colors duration-1000 ${hskLevel ? 'border-current' : 'border-cyan-400/30'}`}
      />
    </div>
  );
}
