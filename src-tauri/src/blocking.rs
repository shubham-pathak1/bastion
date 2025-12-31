//! Blocking module - Website blocking via hosts file and app blocking via process monitoring

use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::{Read, Write};
use std::path::PathBuf;
use sysinfo::{System, Signal, ProcessesToUpdate};

#[cfg(target_os = "windows")]
const HOSTS_PATH: &str = "C:\\Windows\\System32\\drivers\\etc\\hosts";

#[cfg(target_os = "macos")]
const HOSTS_PATH: &str = "/etc/hosts";

#[cfg(target_os = "linux")]
const HOSTS_PATH: &str = "/etc/hosts";

const BASTION_MARKER_START: &str = "# === BASTION BLOCK START ===";
const BASTION_MARKER_END: &str = "# === BASTION BLOCK END ===";

#[derive(Debug, Serialize, Deserialize)]
pub struct BlockingError {
    pub message: String,
}

impl From<std::io::Error> for BlockingError {
    fn from(err: std::io::Error) -> Self {
        BlockingError {
            message: err.to_string(),
        }
    }
}

/// Website Blocking via hosts file

pub fn get_hosts_path() -> PathBuf {
    PathBuf::from(HOSTS_PATH)
}

/// Backup the hosts file before modification
#[allow(dead_code)]
pub fn backup_hosts(backup_dir: &PathBuf) -> Result<PathBuf, BlockingError> {
    let hosts_path = get_hosts_path();
    let backup_path = backup_dir.join("hosts.backup");
    
    fs::create_dir_all(backup_dir)?;
    fs::copy(&hosts_path, &backup_path)?;
    
    Ok(backup_path)
}

/// Read the current hosts file
fn read_hosts() -> Result<String, BlockingError> {
    let mut file = OpenOptions::new().read(true).open(get_hosts_path())?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

/// Write to the hosts file (requires admin/root privileges)
fn write_hosts(contents: &str) -> Result<(), BlockingError> {
    let mut file = OpenOptions::new()
        .write(true)
        .truncate(true)
        .open(get_hosts_path())?;
    file.write_all(contents.as_bytes())?;
    Ok(())
}

/// Get the current Bastion block section from hosts file
fn get_bastion_section(contents: &str) -> Option<(&str, usize, usize)> {
    let start_idx = contents.find(BASTION_MARKER_START)?;
    let end_idx = contents.find(BASTION_MARKER_END)?;
    let end_idx = end_idx + BASTION_MARKER_END.len();
    Some((&contents[start_idx..end_idx], start_idx, end_idx))
}

/// Generate hosts file entries for blocked domains
fn generate_block_entries(domains: &[String]) -> String {
    let mut entries = String::new();
    entries.push_str(BASTION_MARKER_START);
    entries.push('\n');
    
    for domain in domains {
        // Block both with and without www
        entries.push_str(&format!("127.0.0.1 {}\n", domain));
        entries.push_str(&format!("127.0.0.1 www.{}\n", domain));
        entries.push_str(&format!("::1 {}\n", domain));
        entries.push_str(&format!("::1 www.{}\n", domain));
    }
    
    entries.push_str(BASTION_MARKER_END);
    entries
}

/// Update the hosts file with blocked domains
pub fn update_blocked_websites(domains: &[String]) -> Result<(), BlockingError> {
    let mut contents = read_hosts()?;
    
    // Remove existing Bastion section if present
    if let Some((_, start, end)) = get_bastion_section(&contents) {
        contents = format!("{}{}", &contents[..start], &contents[end..]);
    }
    
    // Add new block section if there are domains to block
    if !domains.is_empty() {
        let block_section = generate_block_entries(domains);
        contents.push_str("\n\n");
        contents.push_str(&block_section);
        contents.push('\n');
    }
    
    write_hosts(&contents)?;
    Ok(())
}

/// Remove all Bastion blocks from hosts file
#[allow(dead_code)]
pub fn clear_blocked_websites() -> Result<(), BlockingError> {
    let mut contents = read_hosts()?;
    
    if let Some((_, start, end)) = get_bastion_section(&contents) {
        contents = format!("{}{}", &contents[..start].trim_end(), &contents[end..]);
        write_hosts(&contents)?;
    }
    
    Ok(())
}

/// Restore hosts file from backup
#[allow(dead_code)]
pub fn restore_hosts(backup_path: &PathBuf) -> Result<(), BlockingError> {
    fs::copy(backup_path, get_hosts_path())?;
    Ok(())
}

/// Check if the application has admin privileges
pub fn is_admin() -> bool {
    // Try to open hosts file in write mode as a check
    OpenOptions::new()
        .write(true)
        .append(true)
        .open(get_hosts_path())
        .is_ok()
}

/// Disable DNS-over-HTTPS in Firefox via Enterprise Policies
pub fn disable_firefox_doh() -> Result<(), BlockingError> {
    #[cfg(target_os = "windows")]
    let policies_path = PathBuf::from("C:\\Program Files\\Mozilla Firefox\\distribution\\policies.json");
    
    #[cfg(not(target_os = "windows"))]
    // Skip for non-Windows for now or implement as needed
    return Ok(());

    #[cfg(target_os = "windows")]
    {
        if !policies_path.parent().unwrap().exists() {
            fs::create_dir_all(policies_path.parent().unwrap())?;
        }

        let policy_content = r#"{
    "policies": {
        "DNSOverHTTPS": {
            "Enabled": false,
            "Locked": true
        }
    }
}"#;

        let mut file = OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(policies_path)?;
            
        file.write_all(policy_content.as_bytes())?;
    }
    
    Ok(())
}

/// Disable DNS-over-HTTPS in Chromium-based browsers via Registry Policies
pub fn disable_chromium_doh() -> Result<(), BlockingError> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        
        // Disable for Google Chrome
        let _ = Command::new("reg")
            .args(&["add", "HKLM\\SOFTWARE\\Policies\\Google\\Chrome", "/v", "DnsOverHttpsMode", "/t", "REG_SZ", "/d", "off", "/f"])
            .output();

        // Disable for Thorium (Specifically requested by user)
        let _ = Command::new("reg")
            .args(&["add", "HKLM\\SOFTWARE\\Policies\\Thorium", "/v", "DnsOverHttpsMode", "/t", "REG_SZ", "/d", "off", "/f"])
            .output();
            
        // Also disable built-in DNS client to force OS/Hosts lookup
        let _ = Command::new("reg")
            .args(&["add", "HKLM\\SOFTWARE\\Policies\\Google\\Chrome", "/v", "BuiltInDnsClientEnabled", "/t", "REG_DWORD", "/d", "0", "/f"])
            .output();

        let _ = Command::new("reg")
            .args(&["add", "HKLM\\SOFTWARE\\Policies\\Thorium", "/v", "BuiltInDnsClientEnabled", "/t", "REG_DWORD", "/d", "0", "/f"])
            .output();
    }
    
    Ok(())
}

/// Flush system DNS cache to ensure browser picks up hosts changes
pub fn flush_dns() -> Result<(), BlockingError> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let _ = Command::new("ipconfig")
            .arg("/flushdns")
            .output();
    }
    
    Ok(())
}

/// Application Blocking via process monitoring

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledApp {
    #[serde(alias = "Name")]
    pub name: String,
    #[serde(alias = "AppID")]
    pub id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunningProcess {
    pub pid: u32,
    pub name: String,
}

/// Get all installed applications using PowerShell
pub fn get_installed_applications() -> Vec<InstalledApp> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        
        let output = Command::new("powershell")
            .args(&["-Command", "Get-StartApps | Where-Object { $_.Name -notmatch '^Windows ' -and $_.AppID -notmatch 'Windows' } | Select-Object @{N='Name';E={$_.Name}}, @{N='AppID';E={$_.AppID}} | ConvertTo-Json -Compress"])
            .output();

        if let Ok(output) = output {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if !stdout.trim().is_empty() {
                if let Ok(apps) = serde_json::from_str::<Vec<InstalledApp>>(&stdout) {
                    return apps;
                }
                // Fallback for single object output
                if let Ok(app) = serde_json::from_str::<InstalledApp>(&stdout) {
                    return vec![app];
                }
            }
        }
    }
    
    // Fallback/Common apps for manual discovery or if PowerShell fails
    vec![
        InstalledApp { name: "Discord".to_string(), id: "Discord.exe".to_string() },
        InstalledApp { name: "Spotify".to_string(), id: "Spotify.exe".to_string() },
        InstalledApp { name: "Firefox".to_string(), id: "firefox.exe".to_string() },
        InstalledApp { name: "Chrome".to_string(), id: "chrome.exe".to_string() },
        InstalledApp { name: "Steam".to_string(), id: "steam.exe".to_string() },
        InstalledApp { name: "VS Code".to_string(), id: "Code.exe".to_string() },
    ]
}

/// Get all running processes
pub fn get_running_processes() -> Vec<RunningProcess> {
    let mut system = System::new();
    system.refresh_processes(ProcessesToUpdate::All, true);
    
    let mut processes: Vec<RunningProcess> = system
        .processes()
        .iter()
        .map(|(pid, process)| RunningProcess {
            pid: pid.as_u32(),
            name: process.name().to_string_lossy().to_string(),
        })
        .collect();

    // Sort by name and remove duplicates
    processes.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    processes.dedup_by(|a, b| a.name.to_lowercase() == b.name.to_lowercase());
    
    processes
}

/// Check if a process is running by name
pub fn is_process_running(process_name: &str) -> bool {
    let mut system = System::new();
    system.refresh_processes(ProcessesToUpdate::All, true);
    
    system
        .processes()
        .values()
        .any(|p| p.name().to_string_lossy().to_lowercase() == process_name.to_lowercase())
}

/// Kill a process by name (returns number of processes killed)
pub fn kill_process_by_name(process_name: &str) -> Result<u32, BlockingError> {
    let mut system = System::new();
    system.refresh_processes(ProcessesToUpdate::All, true);
    
    let mut killed = 0u32;
    let process_name_lower = process_name.to_lowercase();
    
    for (_pid, process) in system.processes() {
        if process.name().to_string_lossy().to_lowercase() == process_name_lower {
            // First try SIGTERM (graceful)
            if process.kill_with(Signal::Term).is_none() {
                // If SIGTERM not supported, try SIGKILL
                process.kill();
            }
            killed += 1;
        }
    }
    
    Ok(killed)
}

/// Monitor and kill blocked apps (call this periodically)
pub fn enforce_app_blocks(blocked_apps: &[String]) -> Vec<String> {
    let mut killed_apps = Vec::new();
    
    for app_name in blocked_apps {
        if is_process_running(app_name) {
            if let Ok(count) = kill_process_by_name(app_name) {
                if count > 0 {
                    killed_apps.push(app_name.clone());
                }
            }
        }
    }
    
    killed_apps
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_block_entries() {
        let domains = vec!["twitter.com".to_string(), "reddit.com".to_string()];
        let entries = generate_block_entries(&domains);
        
        assert!(entries.contains(BASTION_MARKER_START));
        assert!(entries.contains(BASTION_MARKER_END));
        assert!(entries.contains("127.0.0.1 twitter.com"));
        assert!(entries.contains("127.0.0.1 www.twitter.com"));
    }

    #[test]
    fn test_get_running_processes() {
        let processes = get_running_processes();
        assert!(!processes.is_empty());
    }
}
