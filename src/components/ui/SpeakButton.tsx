'use client';
import { useSpeech } from '@/hooks/useSpeech';

interface SpeakButtonProps {
  text: string;
  pinyin?: string;
  className?: string;
}

export function SpeakButton({
  text,
  pinyin,
  className = '',
}: SpeakButtonProps) {
  const { speak } = useSpeech();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        speak(text, pinyin);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          speak(text, pinyin);
        }
      }}
      className={`p-2 rounded-lg border border-cyan-500/20 bg-[#161f27] text-cyan-500/50 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 z-[60] ${className}`}
      title={`Listen to ${text}`}
      aria-label={`Speak ${text}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
      </svg>
    </button>
  );
}
