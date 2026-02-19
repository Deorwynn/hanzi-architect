use serde::{Deserialize, Serialize};
use rusqlite::{Connection, params_from_iter};
use tauri::{AppHandle, Manager};
use tauri_plugin_log::{Target, TargetKind};
use tauri::path::BaseDirectory;
use std::env;
use std::fs::File;
use csv::ReaderBuilder;
use serde_json::Value;
use std::io::{BufRead, BufReader};

// --- DATA STRUCTURES ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CharacterData {
    pub id: i32,
    pub character: String,
    pub pinyin: String,
    pub radical: String,
    pub definition: String,
    pub hsk_level: Option<i32>,
    pub is_radical: bool,
    pub script_type: Option<String>,
    pub stroke_count: Option<i32>,
    pub decomposition: Option<String>,
    pub variants: Option<String>,
    pub radical_variants: Option<String>,
    pub etymology: Option<String>,
}

// --- HELPERS ---

fn parse_decomposition(decomp: &str) -> Vec<String> {
    decomp
        .chars()
        .filter(|c| !('\u{2FF0}'..='\u{2FFB}').contains(c))
        .map(|c| c.to_string())
        .collect()
}

// --- COMMANDS ---

#[tauri::command]
async fn import_dictionary_data(handle: tauri::AppHandle) -> Result<String, String> {
    let project_root = if cfg!(dev) {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        std::path::Path::new(manifest_dir).parent().ok_or("Root")?.to_path_buf()
    } else {
        handle.path().resource_dir().map_err(|e| e.to_string())?
    };
    let file_path = project_root.join("data").join("dictionary.txt");
    let db_path = get_db_path(&handle)?;

    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN etymology TEXT", []);

    let file = File::open(&file_path).map_err(|e| e.to_string())?;
    let reader = BufReader::new(file);
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let mut update_count = 0;

    for line in reader.lines() {
        let line_str = line.map_err(|e| e.to_string())?;
        let v: Value = serde_json::from_str(&line_str).map_err(|e| e.to_string())?;

        let character = v["character"].as_str().unwrap_or("");
        let decomposition = v["decomposition"].as_str().unwrap_or("");
        let etymology_type = v["etymology"]["type"].as_str().unwrap_or("");
        let etymology_hint = v["etymology"]["hint"].as_str().unwrap_or("");
        let etymology_full = format!("{}: {}", etymology_type, etymology_hint);

        if !character.is_empty() {
            tx.execute(
                "UPDATE characters SET decomposition = ?1, etymology = ?2 WHERE character = ?3",
                rusqlite::params![decomposition, etymology_full, character],
            ).map_err(|e| e.to_string())?;
            update_count += 1;
        }
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(format!("Imported {} structures and etymologies.", update_count))
}

#[tauri::command]
async fn sync_hsk_levels(handle: tauri::AppHandle) -> Result<String, String> {
    let project_root = if cfg!(dev) {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        std::path::Path::new(manifest_dir).parent().ok_or("Root")?.to_path_buf()
    } else {
        handle.path().resource_dir().map_err(|e| e.to_string())?
    };
    let file_path = project_root.join("data").join("hsk_3.0_words.csv");
    let db_path = get_db_path(&handle)?;
    
    let file = File::open(&file_path).map_err(|e| format!("CSV not found: {}", e))?;
    let mut rdr = ReaderBuilder::new().has_headers(true).from_reader(file);
    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_character_unique ON characters(character)", []).ok();

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let mut update_count = 0;

    for result in rdr.records() {
        let record = result.map_err(|e| e.to_string())?;
        let s_word = &record[0];
        let t_word = &record[1];
        let level: i32 = record[4].split('-').next().unwrap_or("0").parse().unwrap_or(0);

        let s_chars: Vec<char> = s_word.chars().collect();
        let t_chars: Vec<char> = t_word.chars().collect();

        for (i, &s_char) in s_chars.iter().enumerate() {
            let t_char = t_chars.get(i).unwrap_or(&s_char);
            let s_str = s_char.to_string();
            let t_str = t_char.to_string();

            if s_str == t_str {
                // Universal Character
                tx.execute(
                    "INSERT INTO characters (character, hsk_level, script_type) VALUES (?1, ?2, 'B')
                     ON CONFLICT(character) DO UPDATE SET 
                     hsk_level = CASE WHEN excluded.hsk_level < hsk_level OR hsk_level IS NULL THEN excluded.hsk_level ELSE hsk_level END,
                     script_type = 'B'",
                    rusqlite::params![s_str, level],
                ).ok();
            } else {
                // Simplified Entry
                tx.execute(
                    "INSERT INTO characters (character, hsk_level, script_type, variants) VALUES (?1, ?2, 'S', ?3)
                     ON CONFLICT(character) DO UPDATE SET 
                     hsk_level = CASE WHEN excluded.hsk_level < hsk_level OR hsk_level IS NULL THEN excluded.hsk_level ELSE hsk_level END,
                     script_type = 'S', variants = excluded.variants",
                    rusqlite::params![s_str, level, t_str],
                ).ok();
                // Traditional Entry
                tx.execute(
                    "INSERT INTO characters (character, hsk_level, script_type, variants) VALUES (?1, ?2, 'T', ?3)
                     ON CONFLICT(character) DO UPDATE SET 
                     hsk_level = CASE WHEN excluded.hsk_level < hsk_level OR hsk_level IS NULL THEN excluded.hsk_level ELSE hsk_level END,
                     script_type = 'T', variants = excluded.variants",
                    rusqlite::params![t_str, level, s_str],
                ).ok();
            }
            update_count += 1;
        }
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(format!("Processed {} characters.", update_count))
}

#[tauri::command]
fn get_character_details(handle: AppHandle, target: String) -> Result<CharacterData, String> {
    let db_path = get_db_path(&handle)?;
    let conn = Connection::open_with_flags(&db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT id, character, definition, pinyin, radical, hsk_level, is_radical, script_type, stroke_count, decomposition, variants, radical_variants, etymology
         FROM characters WHERE character = ?"
    ).map_err(|e| e.to_string())?;

    stmt.query_row([target], |row| {
        Ok(CharacterData {
            id: row.get(0)?,
            character: row.get(1)?,
            definition: row.get(2).unwrap_or_default(),
            pinyin: row.get(3).unwrap_or_default(),
            radical: row.get(4).unwrap_or_default(),
            hsk_level: row.get(5).ok(),
            is_radical: row.get(6).unwrap_or(false),
            script_type: row.get(7).ok(),
            stroke_count: row.get(8).ok(),
            decomposition: row.get(9).ok(),
            variants: row.get(10).ok(),
            radical_variants: row.get(11).ok(),
            etymology: row.get(12).ok(),
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_component_details(handle: AppHandle, decomp: String) -> Result<Vec<CharacterData>, String> {
    let components = parse_decomposition(&decomp);
    if components.is_empty() { return Ok(Vec::new()); }
    let db_path = get_db_path(&handle)?;
    let conn = Connection::open_with_flags(&db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY).map_err(|e| e.to_string())?;
    let vars = vec!["?"; components.len()].join(", ");
    let query = format!("SELECT id, character, definition, pinyin, radical, hsk_level, is_radical, script_type, stroke_count, decomposition, variants, radical_variants, etymology FROM characters WHERE character IN ({})", vars);
    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params_from_iter(components.iter()), |row| {
        Ok(CharacterData {
            id: row.get(0)?,
            character: row.get(1)?,
            definition: row.get(2).unwrap_or_default(),
            pinyin: row.get(3).unwrap_or_default(),
            radical: row.get(4).unwrap_or_default(),
            hsk_level: row.get(5).ok(),
            is_radical: row.get(6).unwrap_or(false),
            script_type: row.get(7).ok(),
            stroke_count: row.get(8).ok(),
            decomposition: row.get(9).ok(),
            variants: row.get(10).ok(),
            radical_variants: row.get(11).ok(),
            etymology: row.get(12).ok(),
        })
    }).map_err(|e| e.to_string())?;
    let mut results = Vec::new();
    for row in rows { results.push(row.map_err(|e| e.to_string())?); }
    Ok(results)
}

#[tauri::command]
async fn get_random_character(handle: tauri::AppHandle) -> Result<CharacterData, String> {
    let db_path = get_db_path(&handle)?;
    let conn = Connection::open_with_flags(&db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, character, definition, pinyin, radical, hsk_level, is_radical, script_type, stroke_count, decomposition, variants, radical_variants, etymology FROM characters ORDER BY RANDOM() LIMIT 1").map_err(|e| e.to_string())?;
    stmt.query_row([], |row| {
        Ok(CharacterData {
            id: row.get(0)?,
            character: row.get(1)?,
            definition: row.get(2).unwrap_or_default(),
            pinyin: row.get(3).unwrap_or_default(),
            radical: row.get(4).unwrap_or_default(),
            hsk_level: row.get(5).ok(),
            is_radical: row.get(6).unwrap_or(false),
            script_type: row.get(7).ok(),
            stroke_count: row.get(8).ok(),
            decomposition: row.get(9).ok(),
            variants: row.get(10).ok(),
            radical_variants: row.get(11).ok(),
            etymology: row.get(12).ok(),
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
async fn backup_database(handle: tauri::AppHandle) -> Result<String, String> {
    let db_path = get_db_path(&handle)?;
    let mut backup_path = db_path.clone();
    backup_path.set_extension("db.bak");
    std::fs::copy(&db_path, &backup_path).map_err(|e| e.to_string())?;
    Ok(format!("Database backed up to {:?}", backup_path.file_name().unwrap()))
}

fn get_db_path(handle: &AppHandle) -> Result<std::path::PathBuf, String> {
    if cfg!(dev) {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        Ok(std::path::Path::new(manifest_dir).parent().ok_or("Root failed")?.join("hanzi.db"))
    } else {
        handle.path().resolve("hanzi.db", BaseDirectory::Resource).map_err(|e| e.to_string())
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_log::Builder::new().targets([Target::new(TargetKind::Stdout), Target::new(TargetKind::Webview)]).build())
        .invoke_handler(tauri::generate_handler![
            get_character_details,
            get_component_details,
            sync_hsk_levels,
            backup_database,
            import_dictionary_data,
            get_random_character
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}