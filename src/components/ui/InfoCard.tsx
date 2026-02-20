interface InfoCardProps {
  title?: string;
  pinyin: string;
  radical: string;
  definition: string;
  className?: string;
}

export default function InfoCard({
  title = 'System_Analysis.log',
  pinyin,
  radical,
  definition,
  className = '',
}: InfoCardProps) {
  return (
    <div
      className={`
        bg-[#161f27]/30 border border-cyan-500/10 
        p-4 rounded-lg backdrop-blur-sm w-full sm:flex-1 lg:w-full 
        ${className}
      `}
    >
      <h3 className="text-[9px] uppercase tracking-[0.3em] text-cyan-500/50 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
        {title}
      </h3>
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-cyan-500/10 pb-2">
          <span className="text-[10px] text-cyan-500/40 uppercase">
            Reading
          </span>
          <span className="text-xl font-mono text-cyan-100 leading-none">
            {pinyin}
          </span>
        </div>
        <div className="flex justify-between items-end border-b border-cyan-500/10 pb-2">
          <span className="text-[10px] text-cyan-500/40 uppercase">
            Radical
          </span>
          <span className="text-xl text-cyan-100 leading-none">{radical}</span>
        </div>
        <div className="flex justify-between items-end border-b border-cyan-500/10 pb-2">
          <span className="text-[10px] text-cyan-500/40 uppercase">
            Stroke Count
          </span>
          <span className="text-xl text-cyan-100 leading-none">N/A</span>
        </div>
        <div className="bg-cyan-500/[0.03] p-4 rounded border border-cyan-500/5">
          <span className="text-[10px] text-cyan-500/40 block mb-2 uppercase text-center">
            Semantic Definition
          </span>
          <p className="text-sm text-white/80 leading-relaxed italic text-center">
            "{definition}"
          </p>
        </div>
      </div>
    </div>
  );
}
