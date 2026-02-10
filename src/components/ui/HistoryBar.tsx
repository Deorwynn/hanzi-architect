import { CharacterData } from '../../types/database';

interface HistoryBarProps {
  /** Array of previously searched character data objects */
  history: CharacterData[];
  /** Callback triggered when a history chip is clicked */
  onSelect: (item: CharacterData) => void;
  /** Callback to wipe the local history state and storage */
  onClear: () => void;
}

/**
 * A navigational component providing quick access to recently analyzed characters.
 * Features a centered layout and accessible button controls.
 */
export default function HistoryBar({
  history,
  onSelect,
  onClear,
}: HistoryBarProps) {
  // Graceful exit if no history exists to avoid rendering empty containers
  if (history.length === 0) return null;

  return (
    <nav
      className="w-full mt-6 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500"
      aria-label="Search history"
    >
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-3">
        <h3 className="text-[10px] uppercase tracking-widest text-cyan-500/50 font-medium">
          Search History
        </h3>
        <div className="w-px h-2 bg-cyan-500/20" aria-hidden="true" />
        <button
          onClick={onClear}
          className="text-[10px] uppercase tracking-widest text-red-400/40 hover:text-red-400 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-400/50 rounded px-1"
          aria-label="Clear all search history"
        >
          Clear History
        </button>
      </div>

      {/* Characters List */}
      <div className="flex flex-wrap justify-center gap-3" role="list">
        {history.map((item, index) => (
          <button
            key={`${item.character}-${index}`}
            onClick={() => onSelect(item)}
            role="listitem"
            aria-label={`Revisit character ${item.character}`}
            className="group relative w-12 h-12 flex items-center justify-center bg-blueprint-card border border-cyan-500/20 rounded-md hover:border-cyan-400 transition-all hover:shadow-glow focus:outline-none focus:border-cyan-400"
          >
            <span className="text-xl text-cyan-100 font-hero group-hover:scale-110 transition-transform">
              {item.character}
            </span>
            {/* Contextual metadata for screen readers */}
            <span
              className="absolute bottom-0 right-1 text-[7px] text-cyan-500/30"
              aria-hidden="true"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
