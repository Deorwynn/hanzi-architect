export interface CharacterData {
  id: number;
  character: string;
  pinyin: string;
  radical: string;
  definition: string;
  hsk_level: number | null;
  is_radical: boolean;
  radical_variants: string | null;
}
