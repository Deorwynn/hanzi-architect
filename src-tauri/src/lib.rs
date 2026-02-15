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

/// Data transfer object (DTO) for character metadata.
/// Implements Serialize to allow seamless IPC transmission to the Next.js frontend.
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

/// Internal utility to strip Ideographic Description Characters (IDS) 
/// from decomposition strings (Unicode range U+2FF0..U+2FFB).
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
    
    // --- DATABASE SCHEMA UPDATE ---
    // Ensure we have an etymology column
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN etymology TEXT", []);
    // Clear the variants column if it accidentally got hint data earlier
    conn.execute("UPDATE characters SET variants = NULL", []).ok();
    // ------------------------------

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
        
        // Combine type and hint for the new etymology column
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

/// Retrieves metadata for a single character from the SQLite store.
#[tauri::command]
fn get_character_details(handle: AppHandle, target: String) -> Result<CharacterData, String> {
    let db_path = get_db_path(&handle)?;
    let conn = Connection::open_with_flags(&db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|e| format!("DB Connection Error: {}", e))?;
   
    let mut stmt = conn.prepare(
        "SELECT id, character, definition, pinyin, radical, hsk_level, is_radical, script_type, stroke_count, decomposition, variants, radical_variants
        FROM characters WHERE character = ?"
    ).map_err(|e| e.to_string())?;

    stmt.query_row([target], |row| {
        Ok(CharacterData {
            id: row.get(0)?,
            character: row.get(1)?,
            definition: row.get(2)?,
            pinyin: row.get(3)?,
            radical: row.get(4)?,
            hsk_level: row.get(5)?,
            is_radical: row.get(6)?,
            script_type: row.get(7)?,
            stroke_count: row.get(8)?,
            decomposition: row.get(9)?,
            variants: row.get(10)?,
            radical_variants: row.get(11)?,
            etymology: row.get(12).ok()
        })
    }).map_err(|e| e.to_string())
}

/// Performs a bulk lookup of all components within a character's decomposition.
/// Leverages dynamic SQL parameterization to minimize IPC round-trips.
#[tauri::command]
async fn get_component_details(handle: AppHandle, decomp: String) -> Result<Vec<CharacterData>, String> {
    let components = parse_decomposition(&decomp);
    
    // Performance Guard: Avoid SQL execution if no sub-components exist
    if components.is_empty() {
        return Ok(Vec::new());
    }

    let db_path = get_db_path(&handle)?;
    let conn = Connection::open_with_flags(&db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|e| e.to_string())?;

    let vars = vec!["?"; components.len()].join(", ");
    let query = format!(
        "SELECT id, character, definition, pinyin, radical, hsk_level, is_radical, script_type, stroke_count, decomposition, variants, radical_variants 
         FROM characters WHERE character IN ({})", vars
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let params = params_from_iter(components.iter());

    let rows = stmt.query_map(params, |row| {
        Ok(CharacterData {
            id: row.get(0)?,
            character: row.get(1)?,
            definition: row.get(2)?,
            pinyin: row.get(3)?,
            radical: row.get(4)?,
            hsk_level: row.get(5)?,
            is_radical: row.get(6)?,
            script_type: row.get(7)?,
            stroke_count: row.get(8)?,
            decomposition: row.get(9)?,
            variants: row.get(10)?,
            radical_variants: row.get(11)?,
            etymology: row.get(12).ok()
        })
    }).map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }

    Ok(results)
}

#[tauri::command]
async fn sync_hsk_levels(handle: tauri::AppHandle) -> Result<String, String> {
    // 1. Resolve Path to /data/hsk_3.0_words.csv
    let project_root = if cfg!(dev) {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        std::path::Path::new(manifest_dir).parent().ok_or("Root resolution failed")?.to_path_buf()
    } else {
        handle.path().resource_dir().map_err(|e| e.to_string())?
    };
    let file_path = project_root.join("data").join("hsk_3.0_words.csv");
    let db_path = get_db_path(&handle)?;
    
    // 2. Open and Read CSV
    let file = File::open(&file_path).map_err(|e| format!("CSV not found at {:?}: {}", file_path, e))?;
    let mut rdr = ReaderBuilder::new().has_headers(true).from_reader(file);

    // 3. Setup Connection
    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    // --- CRITICAL FIX: Ensure the UNIQUE constraint exists ---
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_character_unique ON characters(character)",
        [],
    ).map_err(|e| format!("Failed to create database index: {}", e))?;
    // ---------------------------------------------------------

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let mut update_count = 0;

    for result in rdr.records() {
        let record = result.map_err(|e| e.to_string())?;
        let simplified = &record[0];
        let level_str = &record[4]; 

        if simplified.chars().count() == 1 {
            let level: i32 = level_str.split('-').next().unwrap_or("0").parse().unwrap_or(0);
            if level > 0 {
                tx.execute(
                    "INSERT INTO characters (character, hsk_level) VALUES (?1, ?2)
                     ON CONFLICT(character) DO UPDATE SET hsk_level = excluded.hsk_level 
                     WHERE excluded.hsk_level < characters.hsk_level OR characters.hsk_level IS NULL",
                    rusqlite::params![simplified, level],
                ).map_err(|e| e.to_string())?;
                update_count += 1;
            }
        }
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(format!("Synced {} HSK records from /data folder.", update_count))
}

#[tauri::command]
async fn sync_json_metadata(handle: tauri::AppHandle) -> Result<String, String> {
    let project_root = if cfg!(dev) {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        std::path::Path::new(manifest_dir).parent().ok_or("Root")?.to_path_buf()
    } else {
        handle.path().resource_dir().map_err(|e| e.to_string())?
    };
    
    let file_path = project_root.join("data").join("hanzi-data.json");
    let db_path = get_db_path(&handle)?;

    let file = File::open(file_path).map_err(|e| e.to_string())?;
    let data: std::collections::HashMap<String, serde_json::Value> = serde_json::from_reader(file).map_err(|e| e.to_string())?;

    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let mut update_count = 0;

    for (char_key, details) in data {
        let script = details["script"].as_str().unwrap_or("");
        let strokes = details["strokes"].as_i64().unwrap_or(0);
        let variant = details["variant"].as_str(); // Can be null

        tx.execute(
            "UPDATE characters SET script_type = ?1, stroke_count = ?2, variants = ?3 WHERE character = ?4",
            rusqlite::params![script, strokes, variant, char_key],
        ).map_err(|e| e.to_string())?;
        
        update_count += 1;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(format!("Enriched {} characters with JSON metadata (Script/Strokes/Variants).", update_count))
}

#[tauri::command]
async fn backup_database(handle: tauri::AppHandle) -> Result<String, String> {
    let db_path = get_db_path(&handle)?;
    let mut backup_path = db_path.clone();
    backup_path.set_extension("db.bak");

    std::fs::copy(&db_path, &backup_path)
        .map_err(|e| format!("Backup failed: {}", e))?;

    Ok(format!("Database backed up to {:?}", backup_path.file_name().unwrap()))
}

/// Centralized path resolver for the SQLite database.
fn get_db_path(handle: &AppHandle) -> Result<std::path::PathBuf, String> {
    if cfg!(dev) {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        Ok(std::path::Path::new(manifest_dir)
            .parent()
            .ok_or("Root resolution failed")?
            .join("hanzi.db"))
    } else {
        handle.path().resolve("hanzi.db", BaseDirectory::Resource)
            .map_err(|e| format!("Resource error: {}", e))
    }
}

// --- RUNTIME ---

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_log::Builder::new().targets([
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::Webview),
        ]).build())
        .invoke_handler(tauri::generate_handler![
            get_character_details,
            get_component_details,
            sync_hsk_levels,
            backup_database,
            import_dictionary_data,
            sync_json_metadata
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}