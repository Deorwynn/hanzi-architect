interface CharacterHeroProps {
  character: string;
}

export default function CharacterHero({ character }: CharacterHeroProps) {
  return (
    <div
      className="relative w-full h-[292px] flex items-center justify-center bg-gradient-to-br from-[#1a2332] to-[#0f1419] border-2 border-cyan-500/30 rounded-xl p-6 md:p-12 shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden"
      role="img"
      aria-label={`Character: ${character}`}
    >
      {/* Measurement lines decoration */}
      <div className="absolute top-4 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />
      <div className="absolute right-4 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />

      <div
        className="relative z-10 text-[8rem] sm:text-[10rem] md:text-[12rem] text-cyan-300 leading-none drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]"
        style={{ fontFamily: "'Noto Serif SC', serif" }}
      >
        {character}
      </div>

      {/* Prominent Figma Corners */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
    </div>
  );
}
