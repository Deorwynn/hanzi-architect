use serde::{Deserialize, Serialize};
use rusqlite::Connection;
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
    pub radical_variants: Option<String>,
}

// --- COMMANDS ---

/// Health-check command to verify the IPC bridge is functional.
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Rust backend is responsive.", name)
}

/// Queries the local SQLite database for specific character details.
/// 
/// # Arguments
/// * `handle` - The Tauri AppHandle used for resource path resolution.
/// * `target` - The UTF-8 string of the character to look up.
///
/// # Security
/// Uses parameterized queries to prevent SQL injection and opens the 
/// database in READ_ONLY mode to ensure data integrity during dev/prod.
#[tauri::command]
fn get_character_details(handle: AppHandle, target: String) -> Result<CharacterData, String> {
    let db_path = if cfg!(dev) {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        std::path::Path::new(manifest_dir)
            .parent() 
            .ok_or("Failed to resolve project root")?
            .join("hanzi.db")
    } else {
        handle.path().resolve("hanzi.db", BaseDirectory::Resource)
            .map_err(|e| format!("Resource resolution failed: {}", e))?
    };

    let conn = Connection::open_with_flags(&db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|e| format!("SQLite connection failed: {}", e))?;
    
    let mut stmt = conn.prepare(
        "SELECT id, character, definition, pinyin, radical, hsk_level, is_radical, radical_variants 
        FROM characters 
        WHERE character = ?"
    ).map_err(|e| format!("Query preparation failed: {}", e))?;

    let char_data = stmt.query_row([target.clone()], |row: &rusqlite::Row| {
        Ok(CharacterData {
            id: row.get::<_, i32>(0)?,
            character: row.get::<_, String>(1)?,
            definition: row.get::<_, String>(2)?,
            pinyin: row.get::<_, String>(3)?,
            radical: row.get::<_, String>(4)?,
            hsk_level: row.get::<_, Option<i32>>(5)?, 
            is_radical: row.get::<_, bool>(6)?, 
            radical_variants: row.get::<_, Option<String>>(7)?,
        })
    }).map_err(|e| format!("Character '{}' not found: {}", target, e))?;

    println!("Found Data: {:?}", char_data.hsk_level);
    Ok(char_data)
}

// --- RUNTIME ---

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())

        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            greet, 
            get_character_details
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}