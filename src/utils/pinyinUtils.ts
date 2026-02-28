import { describe, it, expect } from 'vitest';
import { cleanPinyin } from './textUtils';

describe('Pinyin Utility Logic', () => {
  it('should remove tone numbers', () => {
    expect(cleanPinyin('ma3')).toBe('ma');
  });
});
