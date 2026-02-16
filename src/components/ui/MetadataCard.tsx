'use client';
import React from 'react';
import { useClipboard } from '@/hooks/useClipboard';

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
  const { copied, copy } = useClipboard();

  const handleAction = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (value && value !== '---') copy(value.toString());
  };

  return (
    <button
      onClick={handleAction}
      aria-label={`Copy ${label}: ${value}`}
      className={`relative w-full text-left bg-gradient-to-br from-[#1a2332] to-[#0f1419] p-6 cursor-pointer transition-all duration-300 group outline-none border-2 rounded-lg
    ${
      copied
        ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
        : 'border-cyan-500/20 hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] focus-visible:border-cyan-400 focus-visible:shadow-[0_0_25px_rgba(6,182,212,0.4)]'
    }
    
    ${className}
  `}
    >
      {/* Structural Corner Accents */}
      <div
        className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 transition-colors duration-300 
        ${copied ? 'border-emerald-400' : 'border-cyan-400/50 group-hover:border-cyan-400 group-focus-visible:border-cyan-400'}`}
      />
      <div
        className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 transition-colors duration-300 
        ${copied ? 'border-emerald-400' : 'border-cyan-400/50 group-hover:border-cyan-400 group-focus-visible:border-cyan-400'}`}
      />
      <div
        className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 transition-colors duration-300 
        ${copied ? 'border-emerald-400' : 'border-cyan-400/50 group-hover:border-cyan-400 group-focus-visible:border-cyan-400'}`}
      />
      <div
        className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 transition-colors duration-300 
        ${copied ? 'border-emerald-400' : 'border-cyan-400/50 group-hover:border-cyan-400 group-focus-visible:border-cyan-400'}`}
      />

      <div className="flex justify-between items-start mb-3">
        {icon && (
          <div
            className={`transition-all duration-300 ${copied ? 'text-emerald-400' : 'text-cyan-400 opacity-70 group-hover:opacity-100 group-focus-visible:opacity-100'}`}
          >
            {icon}
          </div>
        )}
        <span
          className={`text-[9px] uppercase tracking-tighter transition-all duration-300 font-bold
          ${copied ? 'text-emerald-400 opacity-100' : 'text-cyan-400 opacity-0 -translate-y-1 group-hover:opacity-60 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0'}
        `}
        >
          {copied ? 'DATA CAPTURED' : 'COPY DATA'}
        </span>
      </div>

      <h3
        className={`text-[10px] uppercase tracking-[0.2em] mb-2 font-stats font-medium transition-colors ${copied ? 'text-emerald-400/70' : 'text-cyan-400/70'}`}
      >
        {label}
      </h3>
      <p className="text-xl text-slate-100 font-stats font-medium leading-relaxed">
        {value || '---'}
      </p>
    </button>
  );
}
