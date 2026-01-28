import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Waves, Brain, Settings2, Volume2, VolumeX, Maximize2, SkipForward } from 'lucide-react';
import { pomodoroApi, sessionsApi } from '../lib/api';

type Phase = 'work' | 'break' | 'longBreak';

interface PomodoroSettings {
    workDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
    soundEnabled: boolean;
}

export default function Pomodoro() {
    const [settings, setSettings] = useState<PomodoroSettings>({
        workDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4,
        soundEnabled: true,
    });

    const [phase, setPhase] = useState<Phase>('work');
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [completedSessions, setCompletedSessions] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    // Initial load and Polling
    useEffect(() => {
        const syncState = async () => {
            try {
                const state = await pomodoroApi.getState();
                setPhase(state.phase.toLowerCase() as Phase);
                setTimeLeft(state.time_remaining);
                setIsRunning(state.is_running);
                setCompletedSessions(state.completed_sessions);
                setSettings(s => ({
                    ...s,
                    workDuration: Math.floor(state.work_duration / 60),
                    breakDuration: Math.floor(state.break_duration / 60),
                    longBreakDuration: Math.floor(state.long_break_duration / 60),
                    sessionsUntilLongBreak: state.sessions_until_long_break
                }));
            } catch (err) {
                console.error('Failed to sync pomodoro state:', err);
            }
        };

        syncState();
        const interval = setInterval(syncState, 1000);

        const checkLock = async () => {
            try {
                const locked = await sessionsApi.isHardcoreLocked();
                setIsLocked(locked);
            } catch { }
        };
        checkLock();
        const lockInterval = setInterval(checkLock, 5000);

        return () => {
            clearInterval(interval);
            clearInterval(lockInterval);
        };
    }, []);

    const getPhaseTime = useCallback((p: Phase) => {
        switch (p) {
            case 'work': return settings.workDuration * 60;
            case 'break': return settings.breakDuration * 60;
            case 'longBreak': return settings.longBreakDuration * 60;
        }
    }, [settings]);

    const toggleTimer = async () => {
        if (isLocked) return;
        try {
            if (isRunning) {
                await pomodoroApi.pause();
            } else {
                await pomodoroApi.start();
            }
            setIsRunning(!isRunning);
        } catch (err) {
            console.error('Failed to toggle timer:', err);
        }
    };

    const reset = async () => {
        if (isLocked) return;
        try {
            await pomodoroApi.reset();
            const state = await pomodoroApi.getState();
            setTimeLeft(state.time_remaining);
            setIsRunning(false);
        } catch (err) {
            console.error('Failed to reset timer:', err);
        }
    };

    const switchPhase = async (newPhase: Phase) => {
        if (isLocked) return;
        try {
            const work = newPhase === 'work' ? settings.workDuration : settings.workDuration;
            const sBreak = newPhase === 'break' ? settings.breakDuration : settings.breakDuration;
            const lBreak = newPhase === 'longBreak' ? settings.longBreakDuration : settings.longBreakDuration;

            // This is a bit of a hack since Rust doesn't have switchPhase, 
            // but we can just use setSettings-like logic
            await pomodoroApi.configure(
                work * 60,
                sBreak * 60,
                lBreak * 60,
                settings.sessionsUntilLongBreak
            );
            setPhase(newPhase);
        } catch (err) {
            console.error('Failed to switch phase:', err);
        }
    };

    const skipBreak = async () => {
        try {
            // Configure with current settings to reset to work phase if needed
            // Or add a 'skip' command to Rust. 
            // For now, let's just trigger a reset and start if it was a break.
            await pomodoroApi.reset();
            await pomodoroApi.start();
        } catch (err) {
            console.error('Failed to skip break:', err);
        }
    };

    const updateSettings = async (newSettings: Partial<PomodoroSettings>) => {
        const s = { ...settings, ...newSettings };
        setSettings(s);
        try {
            await pomodoroApi.configure(
                s.workDuration * 60,
                s.breakDuration * 60,
                s.longBreakDuration * 60,
                s.sessionsUntilLongBreak
            );
        } catch (err) {
            console.error('Failed to configure pomodoro:', err);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progress = 1 - timeLeft / getPhaseTime(phase);
    const circumference = 2 * Math.PI * 140;
    const strokeDashoffset = circumference * (1 - progress);

    const phaseConfig = {
        work: {
            color: '#FFFFFF',
            bg: 'bg-black/5 dark:bg-white/5',
            icon: Brain
        },
        break: {
            color: '#FFFFFF',
            bg: 'bg-black/5 dark:bg-white/5',
            icon: Waves
        },
        longBreak: {
            color: '#FFFFFF',
            bg: 'bg-black/5 dark:bg-white/5',
            icon: Waves
        },
    };

    const CurrentIcon = phaseConfig[phase].icon;

    return (
        <div className="flex flex-col h-full">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 px-8 pt-8 pb-6 bg-black z-20 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="heading-hero"
                        >
                            Focus Timer
                        </motion.h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
                            className="p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white transition-colors"
                        >
                            {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-gray-400 dark:text-bastion-muted" />}
                        </button>
                        <button className="p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white transition-colors">
                            <Maximize2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-8 px-8 py-8 items-start">
                {/* Main Timer Area */}
                <div className="flex-1 w-full">
                    {/* Phase Tabs */}
                    <div className="flex justify-center mb-12">
                        <div className="p-1.5 bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl flex relative">
                            {/* Sliding Background */}
                            <motion.div
                                className="absolute top-1.5 bottom-1.5 rounded-xl bg-black/10 dark:bg-white/10 border border-black/5 dark:border-white/5"
                                layoutId="phase-bg"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                style={{
                                    left: phase === 'work' ? '6px' : phase === 'break' ? '33.3%' : '66.6%',
                                    width: 'calc(33.3% - 8px)'
                                }}
                            />

                            {[
                                { key: 'work', label: 'Deep Work' },
                                { key: 'break', label: 'Short Break' },
                                { key: 'longBreak', label: 'Decompress' },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => switchPhase(key as Phase)}
                                    className={`relative z-10 px-6 py-2 rounded-xl text-sm font-bold transition-colors ${phase === key ? 'text-black dark:text-white' : 'text-gray-400 dark:text-bastion-muted hover:text-black dark:hover:text-white'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Timer Circle */}
                    <div className="relative mb-12 group">

                        <div className="relative flex justify-center">
                            <div className="relative w-80 h-80 lg:w-96 lg:h-96">
                                {/* SVG Timer */}
                                <svg className="w-full h-full -rotate-90">
                                    {/* Track */}
                                    <circle
                                        cx="50%"
                                        cy="50%"
                                        r="45%"
                                        stroke="currentColor"
                                        className="text-black/5 dark:text-white/5"
                                        strokeWidth="6"
                                        fill="none"
                                    />
                                    {/* Progress */}
                                    <motion.circle
                                        cx="50%"
                                        cy="50%"
                                        r="45%"
                                        stroke="currentColor"
                                        className="text-black dark:text-white"
                                        strokeWidth="6"
                                        fill="none"
                                        strokeLinecap="round"
                                        initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                                        animate={{ strokeDashoffset }}
                                        transition={{ duration: 0.5, ease: "linear" }}
                                        style={{
                                            strokeDasharray: circumference,
                                        }}
                                    />
                                </svg>

                                {/* Center Content */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <motion.div
                                        key={phase}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="mb-4 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-md"
                                    >
                                        <CurrentIcon className="w-6 h-6 text-black dark:text-white" />
                                    </motion.div>

                                    <div className="text-7xl lg:text-8xl font-mono font-black text-black dark:text-white tracking-tighter tabular-nums">
                                        {formatTime(timeLeft)}
                                    </div>

                                    <motion.div
                                        animate={{ opacity: isRunning ? [0.5, 1, 0.5] : 0.5 }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="mt-4 text-sm font-black tracking-widest uppercase text-black dark:text-white"
                                    >
                                        {isRunning ? 'Timer Active' : 'Ready to Start'}
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-6">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={reset}
                            className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 flex items-center justify-center transition-colors group"
                        >
                            <RotateCcw className="w-6 h-6 text-gray-500 dark:text-bastion-muted group-hover:text-black dark:group-hover:text-white transition-colors" />
                        </motion.button>

                        <motion.button
                            whileHover={isLocked ? {} : { scale: 1.05 }}
                            whileTap={isLocked ? {} : { scale: 0.95 }}
                            onClick={toggleTimer}
                            disabled={isLocked}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isLocked ? 'opacity-50 grayscale cursor-not-allowed' : ''} ${isRunning
                                ? 'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10'
                                : `bg-black dark:bg-white text-white dark:text-black`
                                }`}
                        >
                            {isRunning ? (
                                <Pause className="w-6 h-6 text-black dark:text-white fill-current" />
                            ) : (
                                <Play className="w-6 h-6 text-white dark:text-black fill-current ml-1" />
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowSettings(!showSettings)}
                            className={`w-16 h-16 rounded-full border flex items-center justify-center transition-all ${showSettings
                                ? 'bg-black dark:bg-white text-white dark:text-black border-transparent'
                                : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20'
                                }`}
                        >
                            <Settings2 className={`w-6 h-6 ${showSettings ? 'text-white dark:text-black' : 'text-gray-400 dark:text-bastion-muted'}`} />
                        </motion.button>

                        {/* Skip Break Button - Only visible during break phases */}
                        {phase !== 'work' && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={skipBreak}
                                className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 flex items-center justify-center transition-colors group"
                                title="Skip Break"
                            >
                                <SkipForward className="w-6 h-6 text-gray-500 dark:text-bastion-muted group-hover:text-black dark:group-hover:text-white transition-colors" />
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Side Panel (Stats & Settings) */}
                <div className="w-full lg:w-80 space-y-6">
                    {/* Session Tracker */}
                    <div className="glass-panel p-6 border border-black/5 dark:border-white/5">
                        <h3 className="text-sm font-black text-black dark:text-white mb-4 uppercase tracking-wider">Session Progress</h3>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-3xl font-black text-black dark:text-white">{completedSessions}</span>
                            <span className="text-xs text-gray-500 dark:text-bastion-muted mb-1">/{settings.sessionsUntilLongBreak} to Long Break</span>
                        </div>
                        <div className="flex gap-2 h-2 mb-6">
                            {Array.from({ length: settings.sessionsUntilLongBreak }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-full transition-all duration-500 ${i < completedSessions % settings.sessionsUntilLongBreak
                                        ? 'bg-black dark:bg-white'
                                        : 'bg-black/10 dark:bg-white/10'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
                                <p className="text-xs text-gray-500 dark:text-bastion-muted">Total Time</p>
                                <p className="text-lg font-black text-black dark:text-white mt-1">
                                    {Math.floor((completedSessions * settings.workDuration) / 60)}h{' '}
                                    {(completedSessions * settings.workDuration) % 60}m
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 opacity-50">
                                <p className="text-xs text-gray-500 dark:text-bastion-muted">Goal</p>
                                <p className="text-lg font-black text-black dark:text-white mt-1">--</p>
                            </div>
                        </div>
                    </div>

                    {/* Settings Panel */}
                    <AnimatePresence>
                        {showSettings && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="glass-panel p-6 border border-black/5 dark:border-white/5"
                            >
                                <h3 className="text-sm font-black text-black dark:text-white mb-4 uppercase tracking-wider">Timer Configuration</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-400 dark:text-bastion-muted mb-1.5 block font-bold">Deep Work Duration</label>
                                        <div className="bg-black/5 dark:bg-white/5 p-1 flex rounded-xl border border-black/5 dark:border-white/10">
                                            {[15, 25, 45, 60].map(v => (
                                                <button
                                                    key={v}
                                                    onClick={() => updateSettings({ workDuration: v })}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${settings.workDuration === v
                                                        ? 'bg-white dark:bg-white/20 text-black dark:text-white'
                                                        : 'text-gray-400 dark:text-bastion-muted hover:text-black dark:hover:text-white'
                                                        }`}
                                                >
                                                    {v}m
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 dark:text-bastion-muted mb-1.5 block font-bold">Short Break</label>
                                            <select
                                                value={settings.breakDuration}
                                                onChange={(e) => updateSettings({ breakDuration: Number(e.target.value) })}
                                                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl w-full py-2 px-3 text-sm text-black dark:text-white appearance-none cursor-pointer outline-none focus:border-black dark:focus:border-white transition-all"
                                            >
                                                {[3, 5, 10, 15].map(v => (
                                                    <option key={v} value={v} className="bg-black text-white">{v} min</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 dark:text-bastion-muted mb-1.5 block font-bold">Long Break</label>
                                            <select
                                                value={settings.longBreakDuration}
                                                onChange={(e) => updateSettings({ longBreakDuration: Number(e.target.value) })}
                                                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl w-full py-2 px-3 text-sm text-black dark:text-white appearance-none cursor-pointer outline-none focus:border-black dark:focus:border-white transition-all"
                                            >
                                                {[10, 15, 20, 30].map(v => (
                                                    <option key={v} value={v} className="bg-black text-white">{v} min</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
