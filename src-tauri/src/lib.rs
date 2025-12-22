//! Bastion - Unbreakable Focus Blocker
//! Main library with Tauri commands

mod blocking;
mod security;
mod session;
mod storage;
mod server;

use blocking::RunningProcess;
// use security::SecurityError;
use session::{ActiveSession, PomodoroState, SessionManager};
use storage::{BlockedApp, BlockedSite, BlockEvent, Database, FocusStats, Session};

use std::sync::Arc;
use tauri::{Manager, State};

pub struct AppState {
    pub db: Database,
    pub session_manager: SessionManager,
}

// ============= Security Commands =============

#[tauri::command]
fn set_master_password(state: State<Arc<AppState>>, password: String) -> Result<(), String> {
    let hash = security::hash_password(&password).map_err(|e| e.message)?;
    state.db.set_setting("master_password", &hash).map_err(|e| e.to_string())?;
    state.db.set_setting("onboarded", "true").map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn verify_master_password(state: State<Arc<AppState>>, password: String) -> Result<bool, String> {
    let hash = state.db.get_setting("master_password")
        .map_err(|e| e.to_string())?
        .ok_or("No master password set")?;
    security::verify_password(&password, &hash).map_err(|e| e.message)
}

#[tauri::command]
fn is_onboarded(state: State<Arc<AppState>>) -> Result<bool, String> {
    let onboarded = state.db.get_setting("onboarded").map_err(|e| e.to_string())?;
    Ok(onboarded.map(|v| v == "true").unwrap_or(false))
}

// ============= Blocked Sites Commands =============

#[tauri::command]
fn add_blocked_site(state: State<Arc<AppState>>, domain: String, category: String) -> Result<i64, String> {
    let id = state.db.add_blocked_site(&domain, &category).map_err(|e| e.to_string())?;
    sync_blocked_websites(&state)?;
    Ok(id)
}

#[tauri::command]
fn get_blocked_sites(state: State<Arc<AppState>>) -> Result<Vec<BlockedSite>, String> {
    state.db.get_blocked_sites().map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_blocked_site(state: State<Arc<AppState>>, id: i64, enabled: bool) -> Result<(), String> {
    state.db.toggle_blocked_site(id, enabled).map_err(|e| e.to_string())?;
    sync_blocked_websites(&state)
}

#[tauri::command]
fn delete_blocked_site(state: State<Arc<AppState>>, id: i64) -> Result<(), String> {
    state.db.delete_blocked_site(id).map_err(|e| e.to_string())?;
    sync_blocked_websites(&state)
}

fn sync_blocked_websites(state: &State<Arc<AppState>>) -> Result<(), String> {
    let sites = state.db.get_blocked_sites().map_err(|e| e.to_string())?;
    let enabled_domains: Vec<String> = sites
        .into_iter()
        .filter(|s| s.enabled)
        .map(|s| s.domain)
        .collect();
    
    // Try to update hosts file, but don't fail if we don't have admin privileges
    match blocking::update_blocked_websites(&enabled_domains) {
        Ok(()) => {
            println!("[Bastion] Hosts file updated with {} domains", enabled_domains.len());
        },
        Err(e) => {
            // Log the error but don't fail - database is still updated
            eprintln!("[Bastion] Could not update hosts file (need admin?): {}", e.message);
        }
    }
    Ok(())
}

// ============= Blocked Apps Commands =============

#[tauri::command]
fn add_blocked_app(state: State<Arc<AppState>>, name: String, process_name: String, category: String) -> Result<i64, String> {
    state.db.add_blocked_app(&name, &process_name, &category).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_blocked_apps(state: State<Arc<AppState>>) -> Result<Vec<BlockedApp>, String> {
    state.db.get_blocked_apps().map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_blocked_app(state: State<Arc<AppState>>, id: i64, enabled: bool) -> Result<(), String> {
    state.db.toggle_blocked_app(id, enabled).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_blocked_app(state: State<Arc<AppState>>, id: i64) -> Result<(), String> {
    state.db.delete_blocked_app(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_running_processes() -> Vec<RunningProcess> {
    blocking::get_running_processes()
}

#[tauri::command]
fn enforce_app_blocks(state: State<Arc<AppState>>) -> Result<Vec<String>, String> {
    let apps = state.db.get_blocked_apps().map_err(|e| e.to_string())?;
    let blocked_process_names: Vec<String> = apps
        .into_iter()
        .filter(|a| a.enabled)
        .map(|a| a.process_name)
        .collect();
    
    let killed = blocking::enforce_app_blocks(&blocked_process_names);
    
    // Log block events
    for app in &killed {
        let _ = state.db.log_block_event(app, "app");
    }
    
    Ok(killed)
}

// ============= Session Commands =============

#[tauri::command]
fn add_session(state: State<Arc<AppState>>, session: Session) -> Result<i64, String> {
    state.db.add_session(&session).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_sessions(state: State<Arc<AppState>>) -> Result<Vec<Session>, String> {
    state.db.get_sessions().map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_session(state: State<Arc<AppState>>, id: i64) -> Result<(), String> {
    state.db.delete_session(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn start_focus_session(state: State<Arc<AppState>>, name: String, duration_minutes: i64, hardcore: bool) -> Result<ActiveSession, String> {
    Ok(state.session_manager.start_session(name, duration_minutes, hardcore))
}

#[tauri::command]
fn end_focus_session(state: State<Arc<AppState>>, password: Option<String>) -> Result<(), String> {
    let verified = if let Some(pwd) = password {
        verify_master_password(state.clone(), pwd).unwrap_or(false)
    } else {
        false
    };
    state.session_manager.end_session(verified)
}

#[tauri::command]
fn get_session_time_remaining(state: State<Arc<AppState>>) -> Option<i64> {
    state.session_manager.get_time_remaining()
}

#[tauri::command]
fn is_hardcore_locked(state: State<Arc<AppState>>) -> bool {
    state.session_manager.is_hardcore_locked.load(std::sync::atomic::Ordering::SeqCst)
}

// ============= Pomodoro Commands =============

#[tauri::command]
fn pomodoro_start(state: State<Arc<AppState>>) {
    state.session_manager.pomodoro_start();
}

#[tauri::command]
fn pomodoro_pause(state: State<Arc<AppState>>) {
    state.session_manager.pomodoro_pause();
}

#[tauri::command]
fn pomodoro_reset(state: State<Arc<AppState>>) {
    state.session_manager.pomodoro_reset();
}

#[tauri::command]
fn pomodoro_get_state(state: State<Arc<AppState>>) -> PomodoroState {
    state.session_manager.get_pomodoro_state()
}

#[tauri::command]
fn pomodoro_configure(state: State<Arc<AppState>>, work: i64, short_break: i64, long_break: i64, sessions: i32) {
    state.session_manager.pomodoro_configure(work, short_break, long_break, sessions);
}

// ============= Stats Commands =============

#[tauri::command]
fn get_recent_blocks(state: State<Arc<AppState>>, limit: i32) -> Result<Vec<BlockEvent>, String> {
    state.db.get_recent_blocks(limit).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_focus_stats(state: State<Arc<AppState>>, days: i32) -> Result<Vec<FocusStats>, String> {
    state.db.get_stats(days).map_err(|e| e.to_string())
}

#[tauri::command]
fn log_protected_time(state: State<Arc<AppState>>, minutes: i64) -> Result<(), String> {
    state.db.update_protected_time(minutes).map_err(|e| e.to_string())
}

// ============= Settings Commands =============

#[tauri::command]
fn get_setting(state: State<Arc<AppState>>, key: String) -> Result<Option<String>, String> {
    state.db.get_setting(&key).map_err(|e| e.to_string())
}

#[tauri::command]
fn set_setting(state: State<Arc<AppState>>, key: String, value: String) -> Result<(), String> {
    state.db.set_setting(&key, &value).map_err(|e| e.to_string())
}

// ============= System Commands =============

#[tauri::command]
fn is_app_admin() -> bool {
    blocking::is_admin()
}

#[tauri::command]
fn fix_firefox_policies() -> Result<(), String> {
    blocking::disable_firefox_doh().map_err(|e| e.message)
}

// ============= App Entry Point =============

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir().expect("Failed to get app data dir");
            let db = Database::new(data_dir).expect("Failed to initialize database");
            let session_manager = SessionManager::new();
            
            let state = Arc::new(AppState { db, session_manager });
            app.manage(state.clone());
            
            // Start blocking stats listener
            let server_state = state.clone();
            tauri::async_runtime::spawn(async move {
                server::start_block_server(server_state).await;
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Security
            set_master_password,
            verify_master_password,
            is_onboarded,
            // Blocked Sites
            add_blocked_site,
            get_blocked_sites,
            toggle_blocked_site,
            delete_blocked_site,
            // Blocked Apps
            add_blocked_app,
            get_blocked_apps,
            toggle_blocked_app,
            delete_blocked_app,
            get_running_processes,
            enforce_app_blocks,
            // Sessions
            add_session,
            get_sessions,
            delete_session,
            start_focus_session,
            end_focus_session,
            get_session_time_remaining,
            is_hardcore_locked,
            // Pomodoro
            pomodoro_start,
            pomodoro_pause,
            pomodoro_reset,
            pomodoro_get_state,
            pomodoro_configure,
            // Stats
            get_recent_blocks,
            get_focus_stats,
            log_protected_time,
            // Settings
            get_setting,
            set_setting,
            // System
            is_app_admin,
            fix_firefox_policies,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
