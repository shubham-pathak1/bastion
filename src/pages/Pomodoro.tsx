import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain, Settings2, Volume2, VolumeX, Maximize2 } from 'lucide-react';
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
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
            color: '#00F0FF',
            bg: 'from-bastion-accent/20 to-cyan-500/5',
            glow: 'shadow-[0_0_50px_rgba(0,240,255,0.2)]',
            icon: Brain
        },
        break: {
            color: '#00D68F',
            bg: 'from-bastion-success/20 to-emerald-500/5',
            glow: 'shadow-[0_0_50px_rgba(0,214,143,0.2)]',
            icon: Coffee
        },
        longBreak: {
            color: '#A855F7',
            bg: 'from-purple-500/20 to-violet-500/5',
            glow: 'shadow-[0_0_50px_rgba(168,85,247,0.2)]',
            icon: Coffee
        },
    };

    const CurrentIcon = phaseConfig[phase].icon;

    return (
        <div className="max-w-4xl mx-auto min-h-screen pb-20 overflow-hidden">
            {/* Header */}
            <div className={`sticky top-0 z-30 transition-all duration-200 ${scrolled ? 'py-4 bg-black/50 backdrop-blur-xl border-b border-white/5' : 'py-8'}`}>
                <div className="flex items-center justify-between px-4">
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
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                        >
                            {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-bastion-muted" />}
                        </button>
                        <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
                            <Maximize2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 px-4 items-start">
                {/* Main Timer Area */}
                <div className="flex-1 w-full">
                    {/* Phase Tabs */}
                    <div className="flex justify-center mb-12">
                        <div className="p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex relative">
                            {/* Sliding Background */}
                            <motion.div
                                className="absolute top-1.5 bottom-1.5 rounded-xl bg-white/10 border border-white/5"
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
                                    className={`relative z-10 px-6 py-2 rounded-xl text-sm font-medium transition-colors ${phase === key ? 'text-white' : 'text-bastion-muted hover:text-white'
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
                                        stroke="rgba(255,255,255,0.05)"
                                        strokeWidth="6"
                                        fill="none"
                                    />
                                    {/* Progress */}
                                    <motion.circle
                                        cx="50%"
                                        cy="50%"
                                        r="45%"
                                        stroke={phaseConfig[phase].color}
                                        strokeWidth="6"
                                        fill="none"
                                        strokeLinecap="round"
                                        initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                                        animate={{ strokeDashoffset }}
                                        transition={{ duration: 0.5, ease: "linear" }}
                                        style={{
                                            strokeDasharray: circumference,
                                            filter: `drop-shadow(0 0 8px ${phaseConfig[phase].color})`
                                        }}
                                    />
                                </svg>

                                {/* Center Content */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <motion.div
                                        key={phase}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="mb-4 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
                                    >
                                        <CurrentIcon className="w-6 h-6 text-white" />
                                    </motion.div>

                                    <div className="text-7xl lg:text-8xl font-mono font-bold text-white tracking-tighter tabular-nums drop-shadow-lg">
                                        {formatTime(timeLeft)}
                                    </div>

                                    <motion.div
                                        animate={{ opacity: isRunning ? [0.5, 1, 0.5] : 0.5 }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="mt-4 text-sm font-medium tracking-widest uppercase text-bastion-muted"
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
                            className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 flex items-center justify-center transition-colors group"
                        >
                            <RotateCcw className="w-6 h-6 text-bastion-muted group-hover:text-white transition-colors" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsRunning(!isRunning)}
                            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRunning
                                    ? 'bg-white/5 border border-white/10'
                                    : `bg-white text-black shadow-[0_0_40px_${phaseConfig[phase].color}60]`
                                }`}
                        >
                            {isRunning ? (
                                <Pause className="w-10 h-10 text-white fill-current" />
                            ) : (
                                <Play className="w-10 h-10 text-black fill-current ml-1" />
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowSettings(!showSettings)}
                            className={`w-16 h-16 rounded-full border flex items-center justify-center transition-all ${showSettings
                                    ? 'bg-white text-black border-white'
                                    : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20'
                                }`}
                        >
                            <Settings2 className={`w-6 h-6 ${showSettings ? 'text-black' : 'text-bastion-muted'}`} />
                        </motion.button>
                    </div>
                </div>

                {/* Side Panel (Stats & Settings) */}
                <div className="w-full lg:w-80 space-y-6">
                    {/* Session Tracker */}
                    <div className="glass-panel p-6 border border-white/5">
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Session Progress</h3>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-3xl font-bold text-white">{completedSessions}</span>
                            <span className="text-xs text-bastion-muted mb-1">/{settings.sessionsUntilLongBreak} to Long Break</span>
                        </div>
                        <div className="flex gap-2 h-2 mb-6">
                            {Array.from({ length: settings.sessionsUntilLongBreak }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-full transition-all duration-500 ${i < completedSessions % settings.sessionsUntilLongBreak
                                            ? 'bg-bastion-accent shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                                            : 'bg-white/10'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-white/5">
                                <p className="text-xs text-bastion-muted">Total Time</p>
                                <p className="text-lg font-bold text-white mt-1">
                                    {Math.floor((completedSessions * settings.workDuration) / 60)}h{' '}
                                    {(completedSessions * settings.workDuration) % 60}m
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5">
                                <p className="text-xs text-bastion-muted">Daily Goal</p>
                                <p className="text-lg font-bold text-white/50 mt-1">4h 00m</p>
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
                                className="glass-panel p-6 border border-white/5"
                            >
                                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Timer Configuration</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-bastion-muted mb-1.5 block">Deep Work Duration</label>
                                        <div className="glass-input p-1 flex">
                                            {[15, 25, 45, 60].map(v => (
                                                <button
                                                    key={v}
                                                    onClick={() => setSettings(s => ({ ...s, workDuration: v }))}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${settings.workDuration === v
                                                            ? 'bg-white/10 text-white'
                                                            : 'text-bastion-muted hover:text-white'
                                                        }`}
                                                >
                                                    {v}m
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-bastion-muted mb-1.5 block">Short Break</label>
                                            <select
                                                value={settings.breakDuration}
                                                onChange={(e) => setSettings(s => ({ ...s, breakDuration: Number(e.target.value) }))}
                                                className="glass-input w-full py-2 px-3 text-sm appearance-none cursor-pointer"
                                            >
                                                {[3, 5, 10, 15].map(v => (
                                                    <option key={v} value={v}>{v} min</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-bastion-muted mb-1.5 block">Long Break</label>
                                            <select
                                                value={settings.longBreakDuration}
                                                onChange={(e) => setSettings(s => ({ ...s, longBreakDuration: Number(e.target.value) }))}
                                                className="glass-input w-full py-2 px-3 text-sm appearance-none cursor-pointer"
                                            >
                                                {[10, 15, 20, 30].map(v => (
                                                    <option key={v} value={v}>{v} min</option>
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
