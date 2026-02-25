use serde::{Deserialize, Serialize};
use rusqlite::{Connection, params, params_from_iter};
use tauri::{AppHandle, Manager};
use tauri_plugin_log::{Target, TargetKind};
use tauri::path::BaseDirectory;
use std::env;
use std::fs::File;
use std::fs;
use std::io::BufReader;
use chrono::Local;

// --- DATA STRUCTURES ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CharacterData {
    pub id: Option<i32>,
    pub character: String,
    pub traditional_variant: Option<String>,
    pub simplified_variant: Option<String>,
    pub pinyin: Option<String>,
    pub definition: Option<String>,
    pub hsk_level: Option<i32>,
    pub radical: Option<String>,
    pub decomposition: Option<String>,
    pub etymology: Option<serde_json::Value>,
    pub script_type: String,
}

// --- HELPERS ---

fn parse_decomposition(decomp: &str) -> Vec<String> {
    decomp
        .chars()
        .filter(|c| !('\u{2FF0}'..='\u{2FFB}').contains(c))
        .map(|c| c.to_string())
        .collect()
}

// Helper to map a database row to CharacterData struct
fn map_row_to_character(row: &rusqlite::Row) -> rusqlite::Result<CharacterData> {
    // 1. Get the raw etymology string from the DB
    let etymology_raw: Option<String> = row.get(9).ok();
    
    // 2. Parse it into JSON only if it exists
    let etymology_json = etymology_raw.and_then(|s| {
        serde_json::from_str::<serde_json::Value>(&s).ok()
    });

    Ok(CharacterData {
        id: row.get(0)?,
        character: row.get(1)?,
        traditional_variant: row.get(2).ok(),
        simplified_variant: row.get(3).ok(),
        pinyin: row.get(4).unwrap_or_default(),
        definition: row.get(5).unwrap_or_default(),
        hsk_level: row.get(6).ok(),
        radical: row.get(7).ok(),
        decomposition: row.get(8).ok(),
        etymology: etymology_json,
        script_type: row.get(10).unwrap_or_else(|_| "Unknown".to_string()),
    })
}

const SELECT_FIELDS: &str = "id, character, traditional_variant, simplified_variant, pinyin, definition, hsk_level, radical, decomposition, etymology, script_type";

// --- COMMANDS ---

#[tauri::command]
async fn initialize_database(handle: tauri::AppHandle) -> Result<String, String> {
    let project_root = if cfg!(dev) {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        std::path::Path::new(manifest_dir).parent().ok_or("Root")?.to_path_buf()
    } else {
        handle.path().resource_dir().map_err(|e| e.to_string())?
    };
    
    let file_path = project_root.join("data").join("master_db.json");
    let db_path = get_db_path(&handle)?;
    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    conn.execute("DROP TABLE IF EXISTS characters", []).ok();
    conn.execute(
        "CREATE TABLE characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            character TEXT UNIQUE NOT NULL,
            traditional_variant TEXT,
            simplified_variant TEXT,
            pinyin TEXT,
            definition TEXT,
            hsk_level INTEGER,
            radical TEXT,
            decomposition TEXT,
            etymology TEXT,
            script_type TEXT
        )",
        [],
    ).map_err(|e| e.to_string())?;

    let file = File::open(&file_path).map_err(|e| format!("Master JSON not found: {}", e))?;
    let reader = BufReader::new(file);
    let master_data: Vec<CharacterData> = serde_json::from_reader(reader).map_err(|e| e.to_string())?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let mut total_count = 0;

    for entry in master_data {
        let etymology_json = entry.etymology.as_ref().map(|v| v.to_string());
        
        tx.execute(
            "INSERT INTO characters (
                character, traditional_variant, simplified_variant, pinyin, 
                definition, hsk_level, radical, decomposition, etymology, script_type
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
            ON CONFLICT(character) DO UPDATE SET
                traditional_variant = excluded.traditional_variant,
                simplified_variant = excluded.simplified_variant,
                pinyin = COALESCE(excluded.pinyin, characters.pinyin),
                definition = COALESCE(excluded.definition, characters.definition),
                hsk_level = COALESCE(excluded.hsk_level, characters.hsk_level),
                radical = COALESCE(excluded.radical, characters.radical),
                decomposition = COALESCE(excluded.decomposition, characters.decomposition),
                etymology = COALESCE(excluded.etymology, characters.etymology),
                script_type = excluded.script_type",
            params![
                entry.character,
                entry.traditional_variant.as_deref(), 
                entry.simplified_variant.as_deref(),
                entry.pinyin.as_deref(),
                entry.definition.as_deref(),
                entry.hsk_level,
                entry.radical.as_deref(),
                entry.decomposition.as_deref(),
                etymology_json.as_deref(),
                entry.script_type
            ],
        ).map_err(|e| format!("Error at {}: {}", entry.character, e))?;
        total_count += 1;
    }
    tx.commit().map_err(|e| e.to_string())?;

    Ok(format!("CORE OVERHAUL COMPLETE: {} records indexed.", total_count))
}

#[tauri::command]
fn get_character_details(handle: AppHandle, target: String) -> Result<CharacterData, String> {
    let db_path = get_db_path(&handle)?;
    let conn = Connection::open_with_flags(&db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY).map_err(|e| e.to_string())?;
    
    let query = format!("SELECT {} FROM characters WHERE character = ?1", SELECT_FIELDS);
    conn.query_row(&query, [target], |row| map_row_to_character(row))
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_component_details(handle: AppHandle, decomp: String) -> Result<Vec<CharacterData>, String> {
    let components = parse_decomposition(&decomp);
    if components.is_empty() { return Ok(Vec::new()); }
    let db_path = get_db_path(&handle)?;
    let conn = Connection::open_with_flags(&db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY).map_err(|e| e.to_string())?;
    
    let vars = vec!["?"; components.len()].join(", ");
    let query = format!("SELECT {} FROM characters WHERE character IN ({})", SELECT_FIELDS, vars);
    
    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params_from_iter(components.iter()), |row| map_row_to_character(row))
        .map_err(|e| e.to_string())?; // FIXED line 195
    
    let mut results = Vec::new();
    for row in rows { results.push(row.map_err(|e| e.to_string())?); }
    Ok(results)
}

#[tauri::command]
async fn get_random_character(handle: tauri::AppHandle) -> Result<CharacterData, String> {
    let db_path = get_db_path(&handle)?;
    let conn = Connection::open_with_flags(&db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY).map_err(|e| e.to_string())?;
    
    let query = format!(
        "SELECT {} FROM characters WHERE LENGTH(character) = 1 ORDER BY RANDOM() LIMIT 1", 
        SELECT_FIELDS
    );
    
    conn.query_row(&query, [], |row| map_row_to_character(row)).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_related_characters(
    handle: tauri::AppHandle, 
    radical: String, 
    current_char: String,
    mode: String,
    pinyin: String,
) -> Result<Vec<CharacterData>, String> {
    let db_path = get_db_path(&handle)?;
    let conn = Connection::open_with_flags(&db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY).map_err(|e| e.to_string())?;

    // 1. Define the SQL and parameters based on the mode
    let (sql_query, query_params) = match mode.as_str() {
        "HSK" => (
            format!(
                "SELECT {} FROM characters 
                 WHERE hsk_level = (SELECT hsk_level FROM characters WHERE character = ?1) 
                 AND character != ?1 
                 AND LENGTH(character) = 1 
                 ORDER BY character ASC", 
                SELECT_FIELDS
            ),
            vec![current_char]
        ),
        "Sound" => {
            let decomp_query: String = conn.query_row(
                "SELECT decomposition FROM characters WHERE character = ?1", 
                [&current_char], 
                |row| row.get(0)
            ).unwrap_or_default();

            let phonetic_part = if decomp_query.starts_with('⿰') && decomp_query.chars().count() >= 3 {
                decomp_query.chars().nth(2).unwrap_or(' ').to_string()
            } else { "__NONE__".to_string() };

            let pinyin_no_tone = pinyin.chars().filter(|c| !c.is_numeric()).collect::<String>();
            
            (
                format!(
                    "SELECT {} FROM characters 
                     WHERE ((pinyin LIKE ?1 OR pinyin GLOB ?2) OR (decomposition LIKE ?3)) 
                     AND character != ?4 
                     AND LENGTH(character) = 1 
                     ORDER BY pinyin ASC", 
                    SELECT_FIELDS
                ),
                vec![
                    format!("{}%", pinyin_no_tone), 
                    format!("{}[1-5]", pinyin_no_tone), 
                    format!("%{}%", phonetic_part), 
                    current_char
                ]
            )
        },
        _ => (
            format!(
                "SELECT {} FROM characters 
                 WHERE (radical = ?1 OR (radical IS NULL AND character = ?1)) 
                 AND character != ?2 
                 AND LENGTH(character) = 1 
                 ORDER BY hsk_level ASC, id ASC", 
                SELECT_FIELDS
            ),
            vec![radical.clone(), current_char]
        )
    };

    // 2. Prepare and execute the statement
    let mut stmt = conn.prepare(&sql_query).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params_from_iter(query_params), |row| map_row_to_character(row))
        .map_err(|e| e.to_string())?;
    
    let mut results = Vec::new();
    for row in rows { 
        results.push(row.map_err(|e| e.to_string())?); 
    }
    Ok(results)
}

#[tauri::command]
async fn backup_database(handle: tauri::AppHandle) -> Result<String, String> {
    let db_path = get_db_path(&handle)?;
    if !db_path.exists() {
        return Err("Database file not found. Nothing to backup.".into());
    }

    let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let backup_path = db_path.with_file_name(format!("hanzi_backup_{}.db", timestamp));

    fs::copy(&db_path, &backup_path).map_err(|e| e.to_string())?;

    Ok(format!("Snapshot created: {:?}", backup_path.file_name().unwrap()))
}

#[tauri::command]
async fn save_character_to_json(handle: tauri::AppHandle, updated_char: CharacterData) -> Result<String, String> {
    let project_root = if cfg!(dev) {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        std::path::Path::new(manifest_dir).parent().ok_or("Root")?.to_path_buf()
    } else {
        handle.path().resource_dir().map_err(|e| e.to_string())?
    };
    
    let file_path = project_root.join("data").join("master_db.json");
    
    // 1. Read existing JSON
    let data = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let mut db: Vec<CharacterData> = serde_json::from_str(&data).map_err(|e| e.to_string())?;

    // 2. Find and Update
    if let Some(index) = db.iter().position(|c| c.character == updated_char.character) {
        db[index] = updated_char;
        
        // 3. Write back to file
        let new_json = serde_json::to_string_pretty(&db).map_err(|e| e.to_string())?;
        fs::write(file_path, new_json).map_err(|e| e.to_string())?;
        
        Ok("JSON Entry Updated Successfully".into())
    } else {
        Err("Character not found in master_db.json".into())
    }
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
            initialize_database,
            get_character_details,
            get_component_details,
            get_random_character,
            get_related_characters,
            save_character_to_json,
            backup_database
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}