use serde::{Deserialize, Serialize};
use rusqlite::{Connection, params_from_iter};
use tauri::{AppHandle, Manager};
use tauri_plugin_log::{Target, TargetKind};
use tauri::path::BaseDirectory;
use std::env;

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
        })
    }).map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }

    Ok(results)
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
            get_component_details
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}