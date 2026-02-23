interface ArchitectBadgeProps {
  label: string | React.ReactNode;
  value?: string | number;
  className?: string;
}

export default function StatusBadge({
  label,
  value,
  className,
}: ArchitectBadgeProps) {
  if (!value) return null;
  return (
    <div
      className={`
      flex items-center gap-2 px-3 h-10 rounded border 
      text-[14px] font-mono tracking-tighter uppercase whitespace-nowrap
      flex-shrink-0 transition-all duration-300
      ${className}
    `}
    >
      <span className="opacity-50">{label}</span>
      <span className="font-bold border-l border-current/20 pl-2 h-full flex items-center">
        {value}
      </span>
    </div>
  );
}
