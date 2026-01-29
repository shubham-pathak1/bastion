/**
 * Tauri API hooks for communicating with the Rust backend
 */
import { invoke } from '@tauri-apps/api/core';

// ============= Types =============

/** Represents a domain blocked by the hosts file. */
export interface BlockedSite {
    id: number;
    domain: string;
    category: string;
    enabled: boolean;
    created_at: string;
}

/** Represents an application executable blocked by the process monitor. */
export interface BlockedApp {
    id: number;
    name: string;
    process_name: string; // e.g., 'discord.exe'
    category: string;
    enabled: boolean;
    created_at: string;
}

/** A recurring schedule for blocking sessions. */
export interface Session {
    id: number;
    name: string;
    start_time: string; // HH:MM format
    end_time: string;   // HH:MM format
    days: string;       // JSON string of days array (e.g. '["Mon", "Tue"]')
    hardcore: boolean;  // If true, cannot be cancelled easily
    enabled: boolean;
}

export interface ActiveSession {
    id: string;
    name: string;
    start_time: number;
    end_time: number;
    hardcore: boolean;
    session_type: 'Manual' | 'Scheduled' | 'Pomodoro';
}

export interface PomodoroState {
    phase: 'Work' | 'Break' | 'LongBreak';
    work_duration: number;
    break_duration: number;
    long_break_duration: number;
    sessions_until_long_break: number;
    completed_sessions: number;
    time_remaining: number;
    is_running: boolean;
}

export interface BlockEvent {
    id: number;
    target: string;
    target_type: string;
    blocked_at: string;
}

export interface FocusStats {
    date: string;
    minutes_protected: number;
    blocks_count: number;
}

export interface RunningProcess {
    pid: number;
    name: string;
}

// ============= Security API =============

export const securityApi = {
    isOnboarded: () =>
        invoke<boolean>('is_onboarded'),
};

// ============= System API =============

export const systemApi = {
    isAdmin: () => invoke<boolean>('is_app_admin'),
    fixBrowserPolicies: () => invoke<void>('fix_browser_policies'),
    killBrowsers: () => invoke<number>('kill_browsers'),
};

// ============= Blocked Sites API =============

export const blockedSitesApi = {
    add: (domain: string, category: string = 'other') =>
        invoke<number>('add_blocked_site', { domain, category }),

    getAll: () =>
        invoke<BlockedSite[]>('get_blocked_sites'),

    toggle: (id: number, enabled: boolean) =>
        invoke<void>('toggle_blocked_site', { id, enabled }),

    delete: (id: number) =>
        invoke<void>('delete_blocked_site', { id }),
};

// ============= Blocked Apps API =============

export const blockedAppsApi = {
    add: (name: string, processName: string, category: string = 'other') =>
        invoke<number>('add_blocked_app', { name, processName, category }),

    getAll: () =>
        invoke<BlockedApp[]>('get_blocked_apps'),

    toggle: (id: number, enabled: boolean) =>
        invoke<void>('toggle_blocked_app', { id, enabled }),

    delete: (id: number) =>
        invoke<void>('delete_blocked_app', { id }),

    getRunningProcesses: () =>
        invoke<RunningProcess[]>('get_running_processes'),

    /** Returns a list of all installed applications (via PowerShell or common paths). */
    getInstalledApplications: () =>
        invoke<{ name: string; id: string }[]>('get_installed_applications'),

    /** Manually triggers an enforcement check for blocked apps. Returns killed app names. */
    enforceBlocks: () =>
        invoke<string[]>('enforce_app_blocks'),
};

// ============= Sessions API =============

export const sessionsApi = {
    add: (session: Omit<Session, 'id'>) =>
        invoke<number>('add_session', { session: { id: 0, ...session } }),

    getAll: () =>
        invoke<Session[]>('get_sessions'),

    delete: (id: number) =>
        invoke<void>('delete_session', { id }),

    startFocus: (name: string, durationMinutes: number, hardcore: boolean) =>
        invoke<ActiveSession>('start_focus_session', { name, durationMinutes, hardcore }),

    endFocus: () =>
        invoke<void>('end_focus_session'),

    /** Returns the remaining time in seconds for the current session, or null if inactive. */
    getTimeRemaining: () =>
        invoke<number | null>('get_session_time_remaining'),

    /** Checks if the current session is in 'Hardcore Mode' (cannot be cancelled). */
    isHardcoreLocked: () =>
        invoke<boolean>('is_hardcore_locked'),

    emergencyUnlock: (password: string) =>
        invoke<void>('emergency_unlock', { password }),
};

// ============= Pomodoro API =============

export const pomodoroApi = {
    start: () =>
        invoke<void>('pomodoro_start'),

    pause: () =>
        invoke<void>('pomodoro_pause'),

    reset: () =>
        invoke<void>('pomodoro_reset'),

    getState: () =>
        invoke<PomodoroState>('pomodoro_get_state'),

    configure: (work: number, shortBreak: number, longBreak: number, sessions: number) =>
        invoke<void>('pomodoro_configure', { work, shortBreak, longBreak, sessions }),
};

// ============= Stats API =============

export const statsApi = {
    getRecentBlocks: (limit: number = 10) =>
        invoke<BlockEvent[]>('get_recent_blocks', { limit }),

    getFocusStats: (days: number = 7) =>
        invoke<FocusStats[]>('get_focus_stats', { days }),

    logProtectedTime: (minutes: number) =>
        invoke<void>('log_protected_time', { minutes }),

    getBlockCounts: () =>
        invoke<Record<string, number>>('get_block_counts'),
};

// ============= Settings API =============

export const settingsApi = {
    get: (key: string) =>
        invoke<string | null>('get_setting', { key }),

    set: (key: string, value: string) =>
        invoke<void>('set_setting', { key, value }),

    factoryReset: () =>
        invoke<void>('factory_reset'),

    setMasterPassword: (password: string) =>
        invoke<void>('set_master_password', { password }),

    verifyMasterPassword: (password: string) =>
        invoke<boolean>('verify_master_password', { password }),
};

// ============= Combined API =============

export const api = {
    security: securityApi,
    blockedSites: blockedSitesApi,
    blockedApps: blockedAppsApi,
    sessions: sessionsApi,
    pomodoro: pomodoroApi,
    stats: statsApi,
    settings: settingsApi,
    system: systemApi,
};

export default api;
