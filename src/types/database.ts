export interface CharacterData {
  id: number;
  character: string;
  pinyin: string;
  radical: string;
  definition: string;
  hsk_level: number | null;
  is_radical: boolean;
  script_type: string | null;
  stroke_count: number | null;
  decomposition: string | null;
  variants: string | null;
  radical_variants: string | null;
}
