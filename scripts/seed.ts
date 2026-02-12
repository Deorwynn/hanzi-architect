import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

import rawHskMap from '../data/hsk30_map.json';

interface HskEntry {
  level: number;
  script: string;
  strokes: number;
  decomp: string;
  variant: string | null;
}

const hskMap = rawHskMap as Record<string, HskEntry>;

const db = new Database('hanzi.db');

// Initialize schema with a fresh state for each seeding run
db.exec(`
  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character TEXT NOT NULL,
    definition TEXT,
    pinyin TEXT,
    radical TEXT,
    hsk_level INTEGER,
    is_radical BOOLEAN DEFAULT 0,
    script_type TEXT,
    stroke_count INTEGER,
    decomposition TEXT,
    variants TEXT,
    radical_variants TEXT
  );
`);

async function seed() {
  const filePath = path.join(process.cwd(), 'data', 'dictionary.txt');
  const fileStream = fs.createReadStream(filePath);

  // Use a ReadStream to process the dictionary without loading the entire
  // 9k+ line file into memory at once.
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  // Reusable prepared statement for insertion performance and SQL injection safety
  const insert = db.prepare(`
  INSERT INTO characters (character, definition, pinyin, radical, hsk_level, is_radical, script_type, stroke_count, decomposition, variants, radical_variants)
  VALUES (@character, @definition, @pinyin, @radical, @hsk_level, @is_radical, @script_type, @stroke_count, @decomposition, @variants, @radical_variants)
`);

  // Wrap insertions in a transaction to minimize disk I/O overhead
  // This reduces processing time from several seconds to milliseconds
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });

  const batch: any[] = [];
  console.log('Parsing dictionary...');

  for await (const line of rl) {
    // Every line in dictionary.txt is a standalone JSON object (LDJSON format)
    const data = JSON.parse(line);
    const char = data.character;

    batch.push({
      character: char,
      definition: data.definition || '',
      pinyin: Array.isArray(data.pinyin) ? data.pinyin.join(', ') : '',
      radical: data.radical,
      hsk_level: hskMap[char]?.level || null,
      is_radical: char === data.radical ? 1 : 0,
      script_type: hskMap[char]?.script || null,
      stroke_count: hskMap[char]?.strokes || null,
      decomposition: hskMap[char]?.decomp || null,
      variants: hskMap[char]?.variant || null,
      radical_variants: data.radical_variants || null,
    });
  }

  console.log(`Inserting ${batch.length} characters...`);
  insertMany(batch);
  console.log('Seeding complete! 🌱');
}

seed().catch(console.error);
