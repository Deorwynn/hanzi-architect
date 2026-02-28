import { describe, it, expect } from 'vitest';

const filterLogic = (related: any[], heroType: string, userPref: string) => {
  // Logic: If hero is Universal, use User Preference.
  // If Hero is specific (Simp/Trad), only show that type (+ Universal).
  const activeMode =
    heroType === 'Universal' || !heroType ? userPref : heroType;

  return related.filter((char) => {
    if (activeMode === 'Simplified')
      return (
        char.script_type === 'Simplified' || char.script_type === 'Universal'
      );
    if (activeMode === 'Traditional')
      return (
        char.script_type === 'Traditional' || char.script_type === 'Universal'
      );
    return true; // "Both" or No Filter
  });
};

describe('Hanzi Architect: Script Filtering Logic', () => {
  const mockData = [
    { character: '人', script_type: 'Universal' },
    { character: '车', script_type: 'Simplified' },
    { character: '車', script_type: 'Traditional' },
  ];

  it('should show Universal + Traditional when Hero is Traditional (Logic Override)', () => {
    const result = filterLogic(mockData, 'Traditional', 'Simplified');
    // We expect 2 results: 人 and 車
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.character)).toContain('車');
    expect(result.map((c) => c.character)).not.toContain('车');
  });

  it('should respect User Preference when Hero is Universal', () => {
    const result = filterLogic(mockData, 'Universal', 'Simplified');
    // We expect 2 results: 人 and 车
    expect(result.map((c) => c.character)).toContain('车');
    expect(result.map((c) => c.character)).not.toContain('車');
  });

  it('should return everything when userPref is "Both"', () => {
    const result = filterLogic(mockData, 'Universal', 'Both');
    expect(result).toHaveLength(3);
  });
});
