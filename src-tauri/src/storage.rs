//! Storage module - SQLite database for persistent data

// use chrono::{DateTime, Utc};
use rusqlite::{Connection, Result as SqliteResult, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockedSite {
    pub id: i64,
    pub domain: String,
    pub category: String,
    pub enabled: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockedApp {
    pub id: i64,
    pub name: String,
    pub process_name: String,
    pub category: String,
    pub enabled: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: i64,
    pub name: String,
    pub start_time: String,
    pub end_time: String,
    pub days: String, // JSON array of days
    pub hardcore: bool,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockEvent {
    pub id: i64,
    pub target: String,
    pub target_type: String, // "website" or "app"
    pub blocked_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusStats {
    pub date: String,
    pub minutes_protected: i64,
    pub blocks_count: i64,
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(data_dir: PathBuf) -> SqliteResult<Self> {
        let db_path = data_dir.join("bastion.db");
        std::fs::create_dir_all(&data_dir).ok();
        
        let conn = Connection::open(db_path)?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS blocked_sites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain TEXT NOT NULL UNIQUE,
                category TEXT DEFAULT 'other',
                enabled INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS blocked_apps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                process_name TEXT NOT NULL UNIQUE,
                category TEXT DEFAULT 'other',
                enabled INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                days TEXT NOT NULL,
                hardcore INTEGER DEFAULT 0,
                enabled INTEGER DEFAULT 1
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS block_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                target TEXT NOT NULL,
                target_type TEXT NOT NULL,
                blocked_at TEXT DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS focus_stats (
                date TEXT PRIMARY KEY,
                minutes_protected INTEGER DEFAULT 0,
                blocks_count INTEGER DEFAULT 0
            )",
            [],
        )?;

        Ok(())
    }

    // Settings
    pub fn set_setting(&self, key: &str, value: &str) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn get_setting(&self, key: &str) -> SqliteResult<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
        let result: Result<String, _> = stmt.query_row(params![key], |row| row.get(0));
        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    // Blocked Sites
    pub fn add_blocked_site(&self, domain: &str, category: &str) -> SqliteResult<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO blocked_sites (domain, category) VALUES (?1, ?2)",
            params![domain, category],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_blocked_sites(&self) -> SqliteResult<Vec<BlockedSite>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, domain, category, enabled, created_at FROM blocked_sites"
        )?;
        let sites = stmt.query_map([], |row| {
            Ok(BlockedSite {
                id: row.get(0)?,
                domain: row.get(1)?,
                category: row.get(2)?,
                enabled: row.get::<_, i32>(3)? == 1,
                created_at: row.get(4)?,
            })
        })?;
        sites.collect()
    }

    pub fn toggle_blocked_site(&self, id: i64, enabled: bool) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE blocked_sites SET enabled = ?2 WHERE id = ?1",
            params![id, enabled as i32],
        )?;
        Ok(())
    }

    pub fn delete_blocked_site(&self, id: i64) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM blocked_sites WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Blocked Apps
    pub fn add_blocked_app(&self, name: &str, process_name: &str, category: &str) -> SqliteResult<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO blocked_apps (name, process_name, category) VALUES (?1, ?2, ?3)",
            params![name, process_name, category],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_blocked_apps(&self) -> SqliteResult<Vec<BlockedApp>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, process_name, category, enabled, created_at FROM blocked_apps"
        )?;
        let apps = stmt.query_map([], |row| {
            Ok(BlockedApp {
                id: row.get(0)?,
                name: row.get(1)?,
                process_name: row.get(2)?,
                category: row.get(3)?,
                enabled: row.get::<_, i32>(4)? == 1,
                created_at: row.get(5)?,
            })
        })?;
        apps.collect()
    }

    pub fn toggle_blocked_app(&self, id: i64, enabled: bool) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE blocked_apps SET enabled = ?2 WHERE id = ?1",
            params![id, enabled as i32],
        )?;
        Ok(())
    }

    pub fn delete_blocked_app(&self, id: i64) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM blocked_apps WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Sessions
    pub fn add_session(&self, session: &Session) -> SqliteResult<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO sessions (name, start_time, end_time, days, hardcore, enabled) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                session.name,
                session.start_time,
                session.end_time,
                session.days,
                session.hardcore as i32,
                session.enabled as i32
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_sessions(&self) -> SqliteResult<Vec<Session>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, start_time, end_time, days, hardcore, enabled FROM sessions"
        )?;
        let sessions = stmt.query_map([], |row| {
            Ok(Session {
                id: row.get(0)?,
                name: row.get(1)?,
                start_time: row.get(2)?,
                end_time: row.get(3)?,
                days: row.get(4)?,
                hardcore: row.get::<_, i32>(5)? == 1,
                enabled: row.get::<_, i32>(6)? == 1,
            })
        })?;
        sessions.collect()
    }

    pub fn delete_session(&self, id: i64) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM sessions WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Block Events
    pub fn log_block_event(&self, target: &str, target_type: &str) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO block_events (target, target_type) VALUES (?1, ?2)",
            params![target, target_type],
        )?;
        // Also update daily stats
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        conn.execute(
            "INSERT INTO focus_stats (date, blocks_count) VALUES (?1, 1)
             ON CONFLICT(date) DO UPDATE SET blocks_count = blocks_count + 1",
            params![today],
        )?;
        Ok(())
    }

    pub fn get_recent_blocks(&self, limit: i32) -> SqliteResult<Vec<BlockEvent>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, target, target_type, blocked_at FROM block_events 
             ORDER BY blocked_at DESC LIMIT ?1"
        )?;
        let events = stmt.query_map(params![limit], |row| {
            Ok(BlockEvent {
                id: row.get(0)?,
                target: row.get(1)?,
                target_type: row.get(2)?,
                blocked_at: row.get(3)?,
            })
        })?;
        events.collect()
    }

    // Stats
    pub fn update_protected_time(&self, minutes: i64) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        conn.execute(
            "INSERT INTO focus_stats (date, minutes_protected) VALUES (?1, ?2)
             ON CONFLICT(date) DO UPDATE SET minutes_protected = minutes_protected + ?2",
            params![today, minutes],
        )?;
        Ok(())
    }

    pub fn get_stats(&self, days: i32) -> SqliteResult<Vec<FocusStats>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT date, minutes_protected, blocks_count FROM focus_stats 
             ORDER BY date DESC LIMIT ?1"
        )?;
        let stats = stmt.query_map(params![days], |row| {
            Ok(FocusStats {
                date: row.get(0)?,
                minutes_protected: row.get(1)?,
                blocks_count: row.get(2)?,
            })
        })?;
        stats.collect()
    }
}
