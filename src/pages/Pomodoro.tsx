import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Waves, Brain, Settings2, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { sessionsApi } from '../lib/api';

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
        // Play sound if enabled (mock)
        if (settings.soundEnabled) {
            // new Audio('/sounds/bell.mp3').play().catch(() => {}); 
        }

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

    const phaseConfig = {
        work: {
            color: '#FFFFFF',
            bg: 'from-white/20 to-transparent',
            icon: Brain
        },
        break: {
            color: '#FFFFFF',
            bg: 'from-white/10 to-transparent',
            icon: Waves
        },
        longBreak: {
            color: '#FFFFFF',
            bg: 'from-white/5 to-transparent',
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
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
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
                        <div className={`absolute inset-0 bg-gradient-to-input ${phaseConfig[phase].bg} rounded-full blur-[100px] opacity-40 transition-all duration-1000`} />

                        <div className="relative flex justify-center">
                            <div className="relative w-80 h-80 lg:w-96 lg:h-96">
                                {/* SVG Timer */}
                                <svg className="w-full h-full -rotate-90 drop-shadow-2xl">
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

                                    <div className="text-7xl lg:text-8xl font-mono font-black text-black dark:text-white tracking-tighter tabular-nums drop-shadow-lg">
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
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={reset}
                            className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 flex items-center justify-center transition-colors group"
                        >
                            <RotateCcw className="w-6 h-6 text-gray-500 dark:text-bastion-muted group-hover:text-black dark:group-hover:text-white transition-colors" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsRunning(!isRunning)}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isRunning
                                ? 'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10'
                                : `bg-black dark:bg-white text-white dark:text-black shadow-lg`
                                }`}
                        >
                            {isRunning ? (
                                <Pause className="w-6 h-6 text-black dark:text-white fill-current" />
                            ) : (
                                <Play className="w-6 h-6 text-white dark:text-black fill-current ml-1" />
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowSettings(!showSettings)}
                            className={`w-16 h-16 rounded-full border flex items-center justify-center transition-all ${showSettings
                                ? 'bg-black dark:bg-white text-white dark:text-black border-transparent'
                                : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20'
                                }`}
                        >
                            <Settings2 className={`w-6 h-6 ${showSettings ? 'text-white dark:text-black' : 'text-gray-400 dark:text-bastion-muted'}`} />
                        </motion.button>
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
                                        ? 'bg-black dark:bg-white shadow-md'
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
                                                    onClick={() => setSettings(s => ({ ...s, workDuration: v }))}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${settings.workDuration === v
                                                        ? 'bg-white dark:bg-white/20 text-black dark:text-white shadow-sm'
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
                                                onChange={(e) => setSettings(s => ({ ...s, breakDuration: Number(e.target.value) }))}
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
                                                onChange={(e) => setSettings(s => ({ ...s, longBreakDuration: Number(e.target.value) }))}
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
