import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain, Settings2 } from 'lucide-react';
import { sessionsApi } from '../lib/api';

type Phase = 'work' | 'break' | 'longBreak';

interface PomodoroSettings {
    workDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
}

export default function Pomodoro() {
    const [settings, setSettings] = useState<PomodoroSettings>({
        workDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4,
    });

    const [phase, setPhase] = useState<Phase>('work');
    const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [completedSessions, setCompletedSessions] = useState(0);
    const [showSettings, setShowSettings] = useState(false);

    const getPhaseTime = useCallback((p: Phase) => {
        switch (p) {
            case 'work': return settings.workDuration * 60;
            case 'break': return settings.breakDuration * 60;
            case 'longBreak': return settings.longBreakDuration * 60;
        }
    }, [settings]);

    useEffect(() => {
        setTimeLeft(getPhaseTime(phase));
    }, [settings, phase, getPhaseTime]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((t) => t - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handlePhaseComplete();
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, timeLeft]);

    const handlePhaseComplete = async () => {
        setIsRunning(false);

        if (phase === 'work') {
            const newCount = completedSessions + 1;
            setCompletedSessions(newCount);

            // Record focus time
            try {
                await sessionsApi.startFocus('Pomodoro', settings.workDuration, false);
            } catch (err) {
                console.error('Failed to record pomodoro:', err);
            }

            if (newCount % settings.sessionsUntilLongBreak === 0) {
                setPhase('longBreak');
                setTimeLeft(settings.longBreakDuration * 60);
            } else {
                setPhase('break');
                setTimeLeft(settings.breakDuration * 60);
            }
        } else {
            setPhase('work');
            setTimeLeft(settings.workDuration * 60);
        }
    };

    const reset = () => {
        setIsRunning(false);
        setTimeLeft(getPhaseTime(phase));
    };

    const switchPhase = (newPhase: Phase) => {
        setPhase(newPhase);
        setTimeLeft(getPhaseTime(newPhase));
        setIsRunning(false);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progress = 1 - timeLeft / getPhaseTime(phase);
    const circumference = 2 * Math.PI * 140;
    const strokeDashoffset = circumference * (1 - progress);

    const phaseColors = {
        work: { bg: 'from-bastion-accent/20 to-cyan-500/10', stroke: '#00e5ff', text: 'text-bastion-accent' },
        break: { bg: 'from-bastion-success/20 to-emerald-500/10', stroke: '#00d68f', text: 'text-bastion-success' },
        longBreak: { bg: 'from-purple-500/20 to-violet-500/10', stroke: '#a855f7', text: 'text-purple-400' },
    };

    return (
        <div className="max-w-3xl mx-auto animate-in">
            <div className="text-center mb-6">
                <h1 className="heading-1 mb-2">Pomodoro Timer</h1>
                <p className="text-bastion-text-secondary">
                    Stay focused with timed work sessions
                </p>
            </div>

            {/* Phase selector */}
            <div className="flex justify-center gap-2 mb-8">
                {[
                    { key: 'work', label: 'Focus', icon: Brain },
                    { key: 'break', label: 'Break', icon: Coffee },
                    { key: 'longBreak', label: 'Long Break', icon: Coffee },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => switchPhase(key as Phase)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${phase === key
                            ? 'bg-bastion-surface text-white border border-bastion-border'
                            : 'text-bastion-text-muted hover:text-white'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Timer display */}
            <div className={`card bg-gradient-to-br ${phaseColors[phase].bg} mb-8`}>
                <div className="relative w-80 h-80 mx-auto">
                    {/* Background circle */}
                    <svg className="w-full h-full -rotate-90">
                        <circle
                            cx="160"
                            cy="160"
                            r="140"
                            stroke="#1f1f1f"
                            strokeWidth="8"
                            fill="none"
                        />
                        {/* Progress circle */}
                        <motion.circle
                            cx="160"
                            cy="160"
                            r="140"
                            stroke={phaseColors[phase].stroke}
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset,
                                filter: `drop-shadow(0 0 10px ${phaseColors[phase].stroke}60)`,
                            }}
                        />
                    </svg>

                    {/* Time display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-7xl font-mono font-bold text-white tracking-tight">
                            {formatTime(timeLeft)}
                        </p>
                        <p className={`text-sm font-medium mt-2 ${phaseColors[phase].text}`}>
                            {phase === 'work' ? 'Focus Time' : phase === 'break' ? 'Short Break' : 'Long Break'}
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4 mt-6">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={reset}
                        className="w-14 h-14 rounded-full bg-bastion-surface-active flex items-center justify-center hover:bg-bastion-surface-hover transition-colors"
                    >
                        <RotateCcw className="w-6 h-6 text-bastion-text-muted" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsRunning(!isRunning)}
                        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-glow transition-all ${isRunning
                            ? 'bg-bastion-surface-active'
                            : 'bg-bastion-accent'
                            }`}
                    >
                        {isRunning ? (
                            <Pause className="w-8 h-8 text-white" />
                        ) : (
                            <Play className="w-8 h-8 text-black ml-1" />
                        )}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowSettings(!showSettings)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${showSettings ? 'bg-bastion-accent text-black' : 'bg-bastion-surface-active hover:bg-bastion-surface-hover text-bastion-text-muted'
                            }`}
                    >
                        <Settings2 className="w-6 h-6" />
                    </motion.button>
                </div>
            </div>

            {/* Session counter */}
            <div className="flex justify-center gap-3 mb-8">
                {Array.from({ length: settings.sessionsUntilLongBreak }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-4 h-4 rounded-full transition-all ${i < completedSessions % settings.sessionsUntilLongBreak
                            ? 'bg-bastion-accent shadow-glow'
                            : 'bg-bastion-surface-active'
                            }`}
                    />
                ))}
            </div>

            {/* Settings panel */}
            {showSettings && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                >
                    <h3 className="heading-3 mb-4">Timer Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label mb-2 block">Focus Duration</label>
                            <select
                                value={settings.workDuration}
                                onChange={(e) => setSettings(s => ({ ...s, workDuration: Number(e.target.value) }))}
                                className="input"
                            >
                                {[15, 20, 25, 30, 45, 60].map(v => (
                                    <option key={v} value={v}>{v} minutes</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label mb-2 block">Short Break</label>
                            <select
                                value={settings.breakDuration}
                                onChange={(e) => setSettings(s => ({ ...s, breakDuration: Number(e.target.value) }))}
                                className="input"
                            >
                                {[3, 5, 10, 15].map(v => (
                                    <option key={v} value={v}>{v} minutes</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label mb-2 block">Long Break</label>
                            <select
                                value={settings.longBreakDuration}
                                onChange={(e) => setSettings(s => ({ ...s, longBreakDuration: Number(e.target.value) }))}
                                className="input"
                            >
                                {[10, 15, 20, 30].map(v => (
                                    <option key={v} value={v}>{v} minutes</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label mb-2 block">Sessions Until Long Break</label>
                            <select
                                value={settings.sessionsUntilLongBreak}
                                onChange={(e) => setSettings(s => ({ ...s, sessionsUntilLongBreak: Number(e.target.value) }))}
                                className="input"
                            >
                                {[2, 3, 4, 5, 6].map(v => (
                                    <option key={v} value={v}>{v} sessions</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="card text-center">
                    <p className="stat-value text-bastion-accent">{completedSessions}</p>
                    <p className="stat-label">Sessions Today</p>
                </div>
                <div className="card text-center">
                    <p className="stat-value text-white">
                        {Math.floor((completedSessions * settings.workDuration) / 60)}h{' '}
                        {(completedSessions * settings.workDuration) % 60}m
                    </p>
                    <p className="stat-label">Focus Time</p>
                </div>
                <div className="card text-center">
                    <p className="stat-value text-purple-400">
                        {Math.floor(completedSessions / settings.sessionsUntilLongBreak)}
                    </p>
                    <p className="stat-label">Long Breaks</p>
                </div>
            </div>
        </div>
    );
}
