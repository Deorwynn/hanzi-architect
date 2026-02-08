import React from 'react';

/**
 * Props definition for the MetadataCard.
 * @property {string} label - The uppercase category title (e.g., PINYIN).
 * @property {string | number} value - The data to display.
 * @property {React.ReactNode} icon - Optional decorative icon or label.
 * @property {string} className - Optional Tailwind overrides for layout (e.g., col-span).
 */
interface MetadataCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

export default function MetadataCard({
  label,
  value,
  icon,
  className = '',
}: MetadataCardProps) {
  return (
    <div
      className={`
      relative bg-gradient-to-br from-[#1a2332] to-[#0f1419] 
      border border-cyan-500/20 rounded-lg p-6
      hover:border-cyan-400/40 transition-all duration-300
      hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]
      group ${className}
    `}
    >
      {/* Structural Corner Accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400/50" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400/50" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400/50" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400/50" />

      {icon && (
        <div className="mb-3 text-cyan-400 opacity-70 group-hover:opacity-100 transition-opacity">
          {icon}
        </div>
      )}

      <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/70 mb-2 font-medium">
        {label}
      </div>

      <div
        className="text-xl text-slate-100 font-medium leading-relaxed"
        style={{ fontFamily: "'Noto Serif SC', serif" }}
      >
        {value || '---'}
      </div>
    </div>
  );
}
