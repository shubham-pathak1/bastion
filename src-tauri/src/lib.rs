//! Bastion - Unbreakable Focus Blocker
//! Main library with Tauri commands

mod blocking;
mod security;
mod session;
mod storage;
mod server;

use blocking::{RunningProcess, InstalledApp};
// use security::SecurityError;
use session::{ActiveSession, PomodoroState, SessionManager};
use storage::{BlockedApp, BlockedSite, BlockEvent, Database, FocusStats, Session};

use std::sync::Arc;
use tauri::{Manager, State, WebviewWindowBuilder, WebviewUrl};
use tauri::Emitter;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

pub struct AppState {
    pub db: Database,
    pub session_manager: SessionManager,
    pub app_handle: std::sync::Mutex<Option<tauri::AppHandle>>,
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
            // Flush DNS to make changes immediate
            let _ = blocking::flush_dns();
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
fn get_installed_applications() -> Vec<InstalledApp> {
    blocking::get_installed_applications()
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

#[tauri::command]
fn reset_all_blocks(state: State<Arc<AppState>>) -> Result<(), String> {
    let apps = state.db.get_blocked_apps().map_err(|e| e.to_string())?;
    for app in apps {
        state.db.delete_blocked_app(app.id).map_err(|e| e.to_string())?;
    }
    let sites = state.db.get_blocked_sites().map_err(|e| e.to_string())?;
    for site in sites {
        state.db.delete_blocked_site(site.id).map_err(|e| e.to_string())?;
    }
    // Restore hosts file to original state
    let _ = blocking::update_blocked_websites(&[]);
    Ok(())
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
fn kill_browsers() -> Result<u32, String> {
    let mut total_killed = 0;
    let browser_processes = [
        "chrome.exe", "google-chrome.exe", "thorium.exe", "thorium-browser.exe", 
        "firefox.exe", "msedge.exe", "brave.exe", "opera.exe", "vivaldi.exe",
        "chrome", "google-chrome", "thorium", "thorium-browser",
        "firefox", "msedge", "brave", "opera", "vivaldi"
    ];
    
    for browser in &browser_processes {
        if let Ok(count) = blocking::kill_process_by_name(browser) {
            total_killed += count;
        }
    }

    Ok(total_killed)
}

#[tauri::command]
fn fix_browser_policies() -> Result<(), String> {
    let _ = blocking::disable_firefox_doh();
    let _ = blocking::disable_chromium_doh();
    let _ = blocking::flush_dns();
    Ok(())
}

// ============= App Entry Point =============

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--silent"])))
        .plugin(tauri_plugin_notification::init())
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api: _api, .. } = event {
                let state = window.state::<Arc<AppState>>();
                let minimize_to_tray = state.db.get_setting("minimize_to_tray")
                    .unwrap_or(Some("true".to_string()))
                    .unwrap_or("true".to_string()) == "true";

                if minimize_to_tray {
                    // In Headless mode, we just let the window close itself naturally
                    // We DO NOT call window.close() here as it triggers this event recursively
                    // The app stays alive because we have a tray icon and background thread
                } else {
                    // If not minimizing to tray, we might want to prevent close or do something else
                }
            }
        })
        .setup(|app| {
            let data_dir = app.path().app_data_dir().expect("Failed to get app data dir");
            let db = Database::new(data_dir).expect("Failed to initialize database");
            let session_manager = SessionManager::new();
            
            let state = Arc::new(AppState { 
                db, 
                session_manager,
                app_handle: std::sync::Mutex::new(Some(app.handle().clone())),
            });
            app.manage(state.clone());
            
            // Start blocking stats listener
            let server_state = state.clone();
            tauri::async_runtime::spawn(async move {
                server::start_block_server(server_state).await;
            });

            // Master Background Loop (The "Heartbeat" of Bastion)
            let background_state = state.clone();
            tauri::async_runtime::spawn(async move {
                let mut timer_interval = tokio::time::interval(std::time::Duration::from_secs(1));
                let mut enforcement_counter = 0;

                loop {
                    timer_interval.tick().await;

                    // 1. Tick Pomodoro (every second)
                    let _ = background_state.session_manager.pomodoro_tick();

                    // 2. Enforce App Blocks (every 3 seconds)
                    enforcement_counter += 1;
                    if enforcement_counter >= 3 {
                        enforcement_counter = 0;
                        if let Ok(apps) = background_state.db.get_blocked_apps() {
                            let blocked_process_names: Vec<String> = apps
                                .into_iter()
                                .filter(|a| a.enabled)
                                .map(|a| a.process_name)
                                .collect();
                            
                            // Pass the system object if we refactored it, 
                            // but for now our revised enforce_app_blocks creates its own efficiently.
                            // Actually, let's keep it simple for now as I already optimized enforce_app_blocks.
                            let killed = blocking::enforce_app_blocks(&blocked_process_names);
                            
                            // Log block events and notify frontend
                            if !killed.is_empty() {
                                for app in &killed {
                                    let _ = background_state.db.log_block_event(app, "app");
                                }
                                // Emit event to all windows if any apps were killed
                                if let Some(handle) = background_state.app_handle.lock().unwrap().as_ref() {
                                    let _ = handle.emit("blocked-apps", killed);
                                }
                            }
                        }
                    }
                }
            });
            
            // Tray Menu
            let quit_i = MenuItemBuilder::with_id("quit", "Quit Bastion").build(app)?;
            let show_i = MenuItemBuilder::with_id("show", "Show Bastion").build(app)?;
            let menu = MenuBuilder::new(app)
                .item(&show_i)
                .separator()
                .item(&quit_i)
                .build()?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "quit" => {
                            std::process::exit(0);
                        }
                        "show" => {
                            ensure_window(app);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        ensure_window(tray.app_handle());
                    }
                })
                .build(app)?;

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
            get_installed_applications,
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
            kill_browsers,
            fix_browser_policies,
            reset_all_blocks,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| match event {
            tauri::RunEvent::ExitRequested { api, .. } => {
                api.prevent_exit();
            }
            _ => {}
        });
}

fn ensure_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    } else {
        // Create new window with the same specs as tauri.conf.json
        let _window = WebviewWindowBuilder::new(
            app,
            "main",
            WebviewUrl::App("index.html".into())
        )
        .title("bastion")
        .inner_size(1000.0, 700.0)
        .min_inner_size(800.0, 600.0)
        .decorations(false)
        .transparent(true)
        .center()
        .build()
        .unwrap();
    }
}
