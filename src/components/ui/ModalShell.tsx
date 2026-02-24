import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: ModalShellProps) {
  const containerRef = useFocusTrap(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        ref={containerRef}
        className="relative w-full md:max-w-2xl xl:max-w-6xl max-h-[90vh] bg-[#0f1419] border border-cyan-500/30 rounded-xl flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-cyan-500/10 bg-black/20 z-20">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-cyan-400 uppercase">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] text-cyan-500/40 uppercase tracking-widest mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* CONTENT AREA WITH FADE MASK */}
        <div
          className="flex-1 overflow-y-auto p-6 scrollbar-thin relative"
          style={{
            maskImage:
              'linear-gradient(to bottom, transparent, black 40px, black calc(100% - 40px), transparent)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent, black 40px, black calc(100% - 40px), transparent)',
          }}
        >
          {children}
        </div>

        {/* FOOTER AREA */}
        <div className="px-6 py-3 bg-cyan-950/20 border-t border-cyan-500/10 flex justify-between items-center z-20">
          <p className="text-[10px] text-cyan-500/40 uppercase tracking-[0.2em]">
            Select unit to navigate
          </p>
          <div className="flex items-center gap-4">
            <span className="h-1 w-1 bg-cyan-500/30 rounded-full animate-pulse" />
            <p className="text-[10px] text-cyan-500/40 uppercase font-mono tracking-tighter">
              SYS_EXP_V.2.0.6
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
