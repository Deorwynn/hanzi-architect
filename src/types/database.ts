export interface CharacterData {
  id?: number;
  character: string;
  traditional_variant: string | null;
  simplified_variant: string | null;
  variants?: string | null;
  is_radical?: boolean;
  pinyin: string | null;
  definition: string | null;
  hsk_level: number | null;
  radical: string | null;
  decomposition: string | null;
  etymology: any;
  script_type: string;
}
