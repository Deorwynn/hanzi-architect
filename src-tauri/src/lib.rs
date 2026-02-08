use serde::{Deserialize, Serialize};
use rusqlite::Connection;
use tauri::{AppHandle, Manager};
use tauri_plugin_log::{Target, TargetKind};
use tauri::path::BaseDirectory;
use std::env;

// --- DATA STRUCTURES ---

/// Data transfer object (DTO) for character metadata.
/// Implements Serialize to allow seamless IPC transmission to the Next.js frontend.
#[derive(Debug, Serialize, Deserialize)]
pub struct CharacterData {
    id: i32,
    character: String,
    definition: String,
    pinyin: String,
    radical: String,
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
    // Strategy: Use compile-time environment variables for Dev paths 
    // and Tauri's runtime resolver for Production bundles.
    let db_path = if cfg!(dev) {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        std::path::Path::new(manifest_dir)
            .parent() 
            .ok_or("Failed to resolve project root from CARGO_MANIFEST_DIR")?
            .join("hanzi.db")
    } else {
        handle.path().resolve("hanzi.db", BaseDirectory::Resource)
            .map_err(|e| format!("Resource resolution failed: {}", e))?
    };

    // Open connection with explicit READ_ONLY flags for safety.
    let conn = Connection::open_with_flags(&db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|e| format!("SQLite connection failed at {:?}: {}", db_path, e))?;

    let mut stmt = conn
        .prepare("SELECT id, character, definition, pinyin, radical FROM characters WHERE character = ?1")
        .map_err(|e| e.to_string())?;

    // Execute query and map the resulting row to our Struct.
    // .clone() is used on 'target' to allow its use in the error-mapping closure.
    let char_data = stmt.query_row([target.clone()], |row| {
        Ok(CharacterData {
            id: row.get(0)?,
            character: row.get(1)?,
            definition: row.get(2)?,
            pinyin: row.get(3)?,
            radical: row.get(4)?,
        })
    }).map_err(|e| format!("Character '{}' not found: {}", target, e))?;

    Ok(char_data)
}

// --- RUNTIME ---

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        // Logger provides critical visibility into the Rust process via the Webview console.
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