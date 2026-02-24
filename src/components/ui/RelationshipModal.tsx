'use client';
import { CharacterData } from '@/types/database';
import { ModalShell } from './ModalShell';

interface RelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  characters: CharacterData[];
  onSelect: (char: string) => void;
}

export default function RelationshipModal(props: RelationshipModalProps) {
  return (
    <ModalShell
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.title}
      subtitle={`${props.characters.length} characters found in database`}
    >
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(64px, 1fr))` }}
      >
        {props.characters.map((item) => (
          <button
            key={item.character}
            onClick={() => {
              props.onSelect(item.character);
              props.onClose();
            }}
            className="group relative aspect-square flex flex-col items-center justify-center bg-[#161f27] border border-dashed border-cyan-500/10 rounded hover:border-cyan-500/50 transition-all hover:bg-cyan-500/5 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 cursor-pointer"
          >
            <span className="text-[10px] text-cyan-500/40 uppercase tracking-tighter mb-0.5 z-10">
              {item.pinyin?.replace(/[0-9]/g, '') || '??'}
            </span>
            <span
              lang="zh-CN"
              className="text-2xl font-light text-cyan-100 group-hover:scale-110 transition-transform z-10"
            >
              {item.character === '？' ? '—' : item.character}
            </span>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}
