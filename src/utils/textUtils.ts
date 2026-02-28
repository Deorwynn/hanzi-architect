/**
 * Cleans pinyin by removing tone numbers and whitespace.
 * Example: "ma3" -> "ma"
 */
export const cleanPinyin = (pinyin: string | null | undefined): string => {
  if (!pinyin) return '??';
  return pinyin.toLowerCase().replace(/[0-9]/g, '').trim();
};
