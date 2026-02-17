export interface HskStyleConfig {
  glow: string;
  charColor: string;
  borderClass: string;
  textClass: string;
  label: string;
  isRaw?: boolean;
}

export const getHskStyle = (
  hskLevel: number | null | undefined,
): HskStyleConfig => {
  // Non-HSK (Raw Silver)
  if (!hskLevel) {
    return {
      glow: 'rgba(226, 232, 240, 0.4)',
      charColor: 'rgba(226, 232, 240, 0.9)',
      borderClass: 'border-slate-500/30',
      textClass: 'text-slate-200',
      label: 'RAW_DATA_STREAM',
      isRaw: true,
    };
  }

  // HSK 1-3 (Cyan)
  if (hskLevel <= 3) {
    return {
      glow: 'rgba(34, 211, 238, 0.3)',
      charColor: 'rgb(34, 211, 238)',
      borderClass: 'border-cyan-500/20',
      textClass: 'text-cyan-300',
      label: 'CORE_ENTRY',
    };
  }

  // HSK 4-6 (Epic Orange)
  if (hskLevel <= 6) {
    return {
      glow: 'rgba(249, 115, 22, 0.6)',
      charColor: 'rgb(249, 115, 22)',
      borderClass: 'border-orange-500/30',
      textClass: 'text-orange-400',
      label: 'ADVANCED_ENTRY',
    };
  }

  // HSK 7-9 (Legendary Purple)
  return {
    glow: 'rgba(167, 139, 250, 0.6)',
    charColor: 'rgb(167, 139, 250)',
    borderClass: 'border-violet-500/30',
    textClass: 'text-violet-300',
    label: 'ELITE_ARCHIVE',
  };
};
