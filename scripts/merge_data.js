const fs = require('fs');
const readline = require('readline');

async function mergeData() {
  const dictionary = new Map();

  console.log('--- Phase 1: Loading Dictionary ---');
  const dictStream = readline.createInterface({
    input: fs.createReadStream('../data/dictionary.txt'),
    crlfDelay: Infinity,
  });

  for await (const line of dictStream) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    dictionary.set(entry.character, entry);
  }

  console.log('--- Phase 2: Processing HSK CSV ---');
  const csvData = fs
    .readFileSync('../data/hsk_3.0_words.csv', 'utf-8')
    .split('\n');
  const headers = csvData[0].split(',');

  // Use a Map to accumulate characters so we can merge duplicates
  const finalMap = new Map();

  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i].split(',');
    if (row.length < headers.length) continue;

    const clean = (val) => (val ? val.replace(/["\\]/g, '').trim() : null);

    const simplified = clean(row[0]);
    const traditional = clean(row[1]);
    const csvPinyin = clean(row[2]);
    const csvDefinition = clean(row[6]);
    const hskLevel = parseInt(row[4]) || null;

    const isDifferent = traditional && traditional !== simplified;

    // Helper function to merge or create entry
    const processEntry = (char, type, isTrad) => {
      const dictMatch = dictionary.get(char) || {};
      const existing = finalMap.get(char);

      if (existing) {
        // MERGE LOGIC: If character exists, append new pinyin/definition
        if (csvPinyin && !existing.pinyin.includes(csvPinyin)) {
          existing.pinyin += ` / ${csvPinyin}`;
        }
        if (csvDefinition && !existing.definition.includes(csvDefinition)) {
          existing.definition += ` ; ${csvDefinition}`;
        }
        // Keep the lowest HSK level (most important)
        if (
          hskLevel &&
          (!existing.hsk_level || hskLevel < existing.hsk_level)
        ) {
          existing.hsk_level = hskLevel;
        }
      } else {
        finalMap.set(char, {
          character: char,
          traditional_variant: isTrad ? null : isDifferent ? traditional : null,
          simplified_variant: isTrad ? simplified : null,
          pinyin: dictMatch.pinyin ? dictMatch.pinyin[0] : csvPinyin,
          definition: dictMatch.definition || csvDefinition,
          hsk_level: hskLevel,
          radical: dictMatch.radical || null,
          decomposition: dictMatch.decomposition || null,
          etymology: dictMatch.etymology || null,
          script_type: type,
        });
      }
      dictionary.delete(char);
    };

    processEntry(
      simplified,
      traditional,
      isDifferent ? 'Simplified' : 'Universal',
      false,
    );
    if (isDifferent) {
      processEntry(traditional, simplified, 'Traditional', true);
    }
  }

  // Convert Map back to the finalData array
  const finalData = Array.from(finalMap.values());

  console.log('--- Phase 3: Adding Remaining Dictionary Entries ---');
  for (const [char, entry] of dictionary) {
    // This loop now only hits characters that WERE NOT in the HSK CSV
    finalData.push({
      character: char,
      traditional_variant: null,
      simplified_variant: null, // Note: For dict-only entries, variant mapping is often handled by specific dict fields if available
      pinyin: entry.pinyin ? entry.pinyin[0] : null,
      definition: entry.definition || null,
      hsk_level: null,
      radical: entry.radical || null,
      decomposition: entry.decomposition || null,
      etymology: entry.etymology || null,
      script_type: 'Dictionary',
    });
  }

  fs.writeFileSync('master_db.json', JSON.stringify(finalData, null, 2));
  console.log(`\nDONE: Merged ${finalData.length} characters.`);
}

mergeData().catch(console.error);
