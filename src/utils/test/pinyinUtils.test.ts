import { describe, it, expect } from 'vitest';
import { cleanPinyin } from '../textUtils';

describe('Pinyin Utility Logic', () => {
  it('should remove tone numbers from pinyin', () => {
    expect(cleanPinyin('ma3')).toBe('ma');
    expect(cleanPinyin('zhong1')).toBe('zhong');
  });

  it('should handle empty or null values', () => {
    expect(cleanPinyin(null)).toBe('??');
    expect(cleanPinyin(undefined)).toBe('??');
  });
});
