import StatusBadge from '@/components/ui/metadata/StatusBadge';
import { getHskStyle } from '@/utils/hskStyles';
import { getScriptTypeName, getDisplayVariant } from '@/utils/characterUtils';
import { CharacterData } from '@/types/database';

interface Props {
  data: CharacterData;
  onVariantClick: (char: string) => void;
}

export default function CharacterMetadata({ data, onVariantClick }: Props) {
  const displayVariant = getDisplayVariant(data);
  const script = data.script_type?.toUpperCase();
  const isSimplified = script === 'S' || script === 'SIMPLIFIED';

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-xs mx-auto">
      <StatusBadge
        label="HSK"
        value={data.hsk_level?.toString() ?? 'N/A'}
        className={getHskStyle(data.hsk_level).badgeClass}
      />

      <StatusBadge
        label="字体"
        value={getScriptTypeName(data.script_type)}
        className="bg-blue-500/10 text-blue-400 border-blue-500/30"
      />

      {displayVariant && (
        <button
          onClick={() => onVariantClick(displayVariant)}
          className="group"
        >
          <StatusBadge
            label={
              <span className="flex items-center gap-1">
                ⇄ {isSimplified ? 'Trad' : 'Simp'}
              </span>
            }
            value={displayVariant}
            className="bg-lime-500/10 text-lime-400 border-lime-500/30 hover:bg-lime-500/20"
          />
        </button>
      )}
    </div>
  );
}
