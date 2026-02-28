import { describe, it, expect } from 'vitest';
import { getHskStyle } from '../hskStyles';

describe('getHskStyle Utility', () => {
  it('should return RAW_DATA_STREAM for null or undefined levels', () => {
    const style = getHskStyle(null);
    expect(style.label).toBe('RAW_DATA_STREAM');
    expect(style.isRaw).toBe(true);
  });

  it('should return CORE_ENTRY for HSK levels 1-3', () => {
    const style = getHskStyle(2);
    expect(style.label).toBe('CORE_ENTRY');
    expect(style.charColor).toBe('rgb(34, 211, 238)');
  });

  it('should return ADVANCED_ENTRY for HSK levels 4-6', () => {
    const style = getHskStyle(5);
    expect(style.label).toBe('ADVANCED_ENTRY');
    expect(style.textClass).toContain('orange');
  });

  it('should return ELITE_ARCHIVE for HSK levels 7+', () => {
    const style = getHskStyle(8);
    expect(style.label).toBe('ELITE_ARCHIVE');
    expect(style.glow).toContain('167, 139, 250');
  });
});
