//! Session module - Focus session and Pomodoro timer management

use chrono::{Local, NaiveTime, Weekday, Datelike};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveSession {
    pub id: String,
    pub name: String,
    pub start_time: i64,      // Unix timestamp
    pub end_time: i64,        // Unix timestamp
    pub hardcore: bool,
    pub session_type: SessionType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SessionType {
    Manual,
    Scheduled,
    Pomodoro,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PomodoroState {
    pub phase: PomodoroPhase,
    pub work_duration: i64,      // seconds
    pub break_duration: i64,     // seconds
    pub long_break_duration: i64, // seconds
    pub sessions_until_long_break: i32,
    pub completed_sessions: i32,
    pub time_remaining: i64,     // seconds
    pub is_running: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PomodoroPhase {
    Work,
    Break,
    LongBreak,
}

impl Default for PomodoroState {
    fn default() -> Self {
        PomodoroState {
            phase: PomodoroPhase::Work,
            work_duration: 25 * 60,
            break_duration: 5 * 60,
            long_break_duration: 15 * 60,
            sessions_until_long_break: 4,
            completed_sessions: 0,
            time_remaining: 25 * 60,
            is_running: false,
        }
    }
}

pub struct SessionManager {
    pub active_session: Mutex<Option<ActiveSession>>,
    pub pomodoro_state: Mutex<PomodoroState>,
    pub is_hardcore_locked: AtomicBool,
}

impl Default for SessionManager {
    fn default() -> Self {
        Self::new()
    }
}

impl SessionManager {
    pub fn new() -> Self {
        SessionManager {
            active_session: Mutex::new(None),
            pomodoro_state: Mutex::new(PomodoroState::default()),
            is_hardcore_locked: AtomicBool::new(false),
        }
    }

    /// Start a manual focus session
    pub fn start_session(&self, name: String, duration_minutes: i64, hardcore: bool) -> ActiveSession {
        let now = Local::now().timestamp();
        let session = ActiveSession {
            id: format!("session_{}", now),
            name,
            start_time: now,
            end_time: now + (duration_minutes * 60),
            hardcore,
            session_type: SessionType::Manual,
        };
        
        if hardcore {
            self.is_hardcore_locked.store(true, Ordering::SeqCst);
        }
        
        let mut active = self.active_session.lock().unwrap();
        *active = Some(session.clone());
        session
    }

    /// End the current session
    pub fn end_session(&self) -> Result<(), String> {
        let active = self.active_session.lock().unwrap();
        
        if let Some(ref session) = *active {
            if session.hardcore {
                let now = Local::now().timestamp();
                if now < session.end_time {
                    return Err("Cannot end hardcore session before time expires".to_string());
                }
            }
        }
        
        drop(active);
        
        let mut active = self.active_session.lock().unwrap();
        *active = None;
        self.is_hardcore_locked.store(false, Ordering::SeqCst);
        Ok(())
    }

    /// Get time remaining in current session (seconds)
    pub fn get_time_remaining(&self) -> Option<i64> {
        let active = self.active_session.lock().unwrap();
        if let Some(ref session) = *active {
            let now = Local::now().timestamp();
            let remaining = session.end_time - now;
            Some(remaining.max(0))
        } else {
            None
        }
    }

    /// Check if session has expired
    pub fn is_session_expired(&self) -> bool {
        if let Some(remaining) = self.get_time_remaining() {
            remaining <= 0
        } else {
            true
        }
    }

    /// Check if any scheduled session should be active now
    pub fn check_scheduled_sessions(&self, sessions: &[crate::storage::Session]) -> Option<crate::storage::Session> {
        let now = Local::now();
        let current_time = now.time();
        let current_day = match now.weekday() {
            Weekday::Mon => "Mon",
            Weekday::Tue => "Tue",
            Weekday::Wed => "Wed",
            Weekday::Thu => "Thu",
            Weekday::Fri => "Fri",
            Weekday::Sat => "Sat",
            Weekday::Sun => "Sun",
        };

        for session in sessions {
            if !session.enabled {
                continue;
            }

            // Parse days
            let days: Vec<String> = serde_json::from_str(&session.days).unwrap_or_default();
            if !days.iter().any(|d| d == current_day) {
                continue;
            }

            // Parse times
            if let (Ok(start), Ok(end)) = (
                NaiveTime::parse_from_str(&session.start_time, "%H:%M"),
                NaiveTime::parse_from_str(&session.end_time, "%H:%M"),
            ) {
                if current_time >= start && current_time <= end {
                    return Some(session.clone());
                }
            }
        }

        None
    }

    // Pomodoro methods

    /// Start/resume pomodoro timer
    pub fn pomodoro_start(&self) {
        let mut state = self.pomodoro_state.lock().unwrap();
        state.is_running = true;
    }

    /// Pause pomodoro timer
    pub fn pomodoro_pause(&self) {
        let mut state = self.pomodoro_state.lock().unwrap();
        state.is_running = false;
    }

    /// Reset pomodoro timer
    pub fn pomodoro_reset(&self) {
        let mut state = self.pomodoro_state.lock().unwrap();
        state.time_remaining = match state.phase {
            PomodoroPhase::Work => state.work_duration,
            PomodoroPhase::Break => state.break_duration,
            PomodoroPhase::LongBreak => state.long_break_duration,
        };
        state.is_running = false;
    }

    /// Tick the pomodoro timer (call every second)
    pub fn pomodoro_tick(&self) -> Option<PomodoroPhase> {
        let mut state = self.pomodoro_state.lock().unwrap();
        
        if !state.is_running {
            return None;
        }
        
        if state.time_remaining > 0 {
            state.time_remaining -= 1;
            return None;
        }
        
        // Timer expired, switch phase
        let completed_phase = state.phase.clone();
        
        match state.phase {
            PomodoroPhase::Work => {
                state.completed_sessions += 1;
                
                if state.completed_sessions % state.sessions_until_long_break == 0 {
                    state.phase = PomodoroPhase::LongBreak;
                    state.time_remaining = state.long_break_duration;
                } else {
                    state.phase = PomodoroPhase::Break;
                    state.time_remaining = state.break_duration;
                }
            }
            PomodoroPhase::Break | PomodoroPhase::LongBreak => {
                state.phase = PomodoroPhase::Work;
                state.time_remaining = state.work_duration;
            }
        }
        
        Some(completed_phase)
    }

    /// Update pomodoro settings
    pub fn pomodoro_configure(&self, work: i64, short_break: i64, long_break: i64, sessions: i32) {
        let mut state = self.pomodoro_state.lock().unwrap();
        state.work_duration = work;
        state.break_duration = short_break;
        state.long_break_duration = long_break;
        state.sessions_until_long_break = sessions;
        
        // Reset timer to new work duration if on work phase
        if state.phase == PomodoroPhase::Work {
            state.time_remaining = work;
        }
    }

    /// Get current pomodoro state
    pub fn get_pomodoro_state(&self) -> PomodoroState {
        self.pomodoro_state.lock().unwrap().clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_start_end() {
        let manager = SessionManager::new();
        
        let session = manager.start_session("Test".to_string(), 30, false);
        assert!(manager.get_time_remaining().is_some());
        
        assert!(manager.end_session().is_ok());
        assert!(manager.get_time_remaining().is_none());
    }

    #[test]
    fn test_pomodoro_tick() {
        let manager = SessionManager::new();
        
        // Configure short timers for testing
        manager.pomodoro_configure(2, 1, 2, 4);
        manager.pomodoro_start();
        
        // Tick through work phase
        assert!(manager.pomodoro_tick().is_none()); // 1 second left
        let phase = manager.pomodoro_tick(); // 0 seconds, phase complete
        assert_eq!(phase, Some(PomodoroPhase::Work));
    }
}
