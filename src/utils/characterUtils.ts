import { CharacterData } from '@/types/database';

export const getScriptTypeName = (type: string | null | undefined) => {
  const normalized = type?.trim().toUpperCase();

  switch (normalized) {
    case 'S':
    case 'SIMPLIFIED':
      return 'Simplified';
    case 'T':
    case 'TRADITIONAL':
      return 'Traditional';
    case 'B':
    case 'U':
    case 'UNIVERSAL':
    case 'DICTIONARY':
      return 'Universal';
    default:
      return 'General';
  }
};

export const getDisplayVariant = (data: CharacterData) => {
  const script = data.script_type?.toUpperCase();
  // Simplified -> Show Traditional | Traditional -> Show Simplified
  return script === 'S' || script === 'SIMPLIFIED'
    ? data.traditional_variant
    : data.simplified_variant;
};
