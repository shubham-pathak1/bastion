import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck,
    Brain,
    Lock,
    Flame,
    X,
    Loader2,
    ChevronRight,
    Rocket,
    Radar
} from 'lucide-react';
import { statsApi, sessionsApi, blockedSitesApi, BlockEvent, settingsApi } from '../lib/api';
import PasswordModal from '../components/PasswordModal';

export default function Home() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [recentBlocks, setRecentBlocks] = useState<BlockEvent[]>([]);
    const [blockedCount, setBlockedCount] = useState(0);
    const [todayStats, setTodayStats] = useState({ hours: 0, minutes: 0, totalBlocks: 0 });
    const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);
    const [isSessionActive, setIsSessionActive] = useState(false);

    const [showStartModal, setShowStartModal] = useState(false);
    const [sessionName, setSessionName] = useState('Deep Focus');
    const [sessionDuration, setSessionDuration] = useState(60);
    const [hardcoreMode, setHardcoreMode] = useState(false);
    const [isStarting, setIsStarting] = useState(false);

    const [canOverride, setCanOverride] = useState(false);
    const [showUnlockModal, setShowUnlockModal] = useState(false);

    useEffect(() => {
        loadDashboardData();

        const interval = setInterval(async () => {
            try {
                const [remaining, isLocked] = await Promise.all([
                    sessionsApi.getTimeRemaining(),
                    sessionsApi.isHardcoreLocked()
                ]);

                if (remaining !== null && remaining > 0) {
                    setSessionTimeLeft(remaining);
                    setIsSessionActive(true);
                    setHardcoreMode(isLocked); // Sync hardcore state
                } else {
                    setSessionTimeLeft(null);
                    setIsSessionActive(false);
                    setHardcoreMode(false);
                }
            } catch {
                // Session API not available
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [blocks, sites, stats, masterHash] = await Promise.all([
                statsApi.getRecentBlocks(8),
                blockedSitesApi.getAll(),
                statsApi.getFocusStats(1),
                settingsApi.get('master_password_hash')
            ]);

            setRecentBlocks(blocks);
            setBlockedCount(sites.filter(s => s.enabled).length);
            setCanOverride(!!masterHash && masterHash.length > 0);

            if (stats.length > 0) {
                const today = stats[0];
                setTodayStats({
                    hours: Math.floor(today.minutes_protected / 60),
                    minutes: today.minutes_protected % 60,
                    totalBlocks: today.blocks_count
                });
            }
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const startSession = async () => {
        setIsStarting(true);
        try {
            await sessionsApi.startFocus(sessionName, sessionDuration, hardcoreMode);
            setShowStartModal(false);
            setIsSessionActive(true);
        } catch (err) {
            console.error('Failed to start session:', err);
        } finally {
            setIsStarting(false);
        }
    };

    const formatTimeLeft = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatBlockTime = (blockedAt: string) => {
        const date = new Date(blockedAt.replace(' ', 'T') + 'Z');
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 px-8 pt-6 pb-4 bg-black z-20 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-2xl font-black text-black dark:text-white tracking-tighter"
                        >
                            Home
                        </motion.h1>
                        <p className="text-bastion-muted text-xs font-bold uppercase tracking-widest mt-0.5">Dashboard</p>
                    </div>

                    {isSessionActive && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black border border-black/10 dark:border-white/10"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black animate-pulse" />
                            <span className="font-mono font-black text-[10px] tracking-widest uppercase">ACTIVE</span>
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 scroll-smooth no-scrollbar">
                <div className="max-w-5xl mx-auto w-full">
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-6 gap-6"
                    >
                        {/* Primary Focus Card */}
                        <motion.div variants={item} className="md:col-span-4 glass-card p-6 flex flex-col justify-between group relative overflow-hidden min-h-[180px]">
                            <div className="flex items-start justify-between relative z-10">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-bastion-muted mb-2 flex items-center gap-2">
                                        <Flame className="w-3 h-3" />
                                        Daily Progress
                                    </p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black text-black dark:text-white tracking-tighter">
                                            {todayStats.hours}
                                        </span>
                                        <span className="text-lg text-bastion-muted font-bold mr-2">h</span>
                                        <span className="text-5xl font-black text-black dark:text-white tracking-tighter">
                                            {todayStats.minutes}
                                        </span>
                                        <span className="text-lg text-bastion-muted font-bold">m</span>
                                    </div>
                                </div>
                                {isSessionActive && sessionTimeLeft !== null && (
                                    <div className="flex flex-col gap-2 items-end">
                                        <div className="text-right p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 min-w-[140px]">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-bastion-muted mb-1">Time Left</p>
                                            <p className="text-2xl font-mono text-black dark:text-white font-black">{formatTimeLeft(sessionTimeLeft)}</p>
                                        </div>

                                        {/* Stop / Unlock Button */}
                                        {!hardcoreMode ? (
                                            <button
                                                onClick={async () => {
                                                    await sessionsApi.endFocus();
                                                    setIsSessionActive(false);
                                                }}
                                                className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest border border-red-500/20"
                                            >
                                                Stop Session
                                            </button>
                                        ) : canOverride ? (
                                            <button
                                                onClick={() => setShowUnlockModal(true)}
                                                className="px-4 py-2 rounded-xl bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all text-xs font-black uppercase tracking-widest border border-yellow-500/20 flex items-center gap-2"
                                            >
                                                <Lock className="w-3 h-3" />
                                                Emergency Unlock
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-bastion-muted opacity-50 cursor-not-allowed">
                                                <Lock className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Locked</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto relative z-10 pt-4">
                                <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((todayStats.hours / 8) * 100, 100)}%` }}
                                        className="h-full bg-black dark:bg-white"
                                    />
                                </div>
                                <div className="flex justify-between mt-2">
                                    <p className="text-[10px] text-bastion-muted font-black uppercase tracking-widest">Efficiency</p>
                                    <p className="text-[10px] text-bastion-muted font-black uppercase tracking-widest">Goal: 8h</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick Start Card - Compact */}
                        <motion.div
                            variants={item}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="md:col-span-2 glass-card-interactive p-6 flex flex-col items-center justify-center text-center gap-3 border-dashed border-2 border-black/5 dark:border-white/5 group"
                            onClick={() => setShowStartModal(true)}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                                <Rocket className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-widest">Focus</h3>
                                <p className="text-[10px] text-bastion-muted font-bold">Start New Session</p>
                            </div>
                        </motion.div>

                        {/* Second Row */}
                        <motion.div variants={item} className="md:col-span-2 glass-card p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-bastion-muted flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3" />
                                    Blocked Items
                                </p>
                                <span className="text-[9px] font-black bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded uppercase tracking-widest text-bastion-muted">{blockedCount} Active</span>
                            </div>
                            <div className="mt-4">
                                <p className="text-3xl font-black text-black dark:text-white">{todayStats.totalBlocks}</p>
                                <p className="text-[10px] text-bastion-muted mt-1 font-bold">Attempts Blocked Today</p>
                            </div>
                        </motion.div>

                        <motion.div variants={item} className="md:col-span-4 glass-card p-0 flex flex-col overflow-hidden">
                            <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/5 dark:bg-white/5">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-bastion-muted flex items-center gap-2">
                                    <Radar className="w-3 h-3" />
                                    Activity Log
                                </h3>
                            </div>
                            <div className="p-2 max-h-[140px] overflow-y-auto no-scrollbar">
                                {isLoading ? (
                                    <div className="h-20 flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 animate-spin text-bastion-muted" />
                                    </div>
                                ) : recentBlocks.length === 0 ? (
                                    <div className="h-20 flex flex-col items-center justify-center text-bastion-muted gap-2 font-bold opacity-30">
                                        <p className="text-[10px] uppercase tracking-widest text-center">No Activity Detected</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                        {recentBlocks.map((block) => (
                                            <div key={block.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-black/20 dark:bg-white/20 flex-shrink-0" />
                                                    <p className="font-mono text-[10px] text-black dark:text-white font-bold truncate">
                                                        {block.target}
                                                    </p>
                                                </div>
                                                <span className="text-[9px] font-black text-bastion-muted flex-shrink-0 ml-2">
                                                    {formatBlockTime(block.blocked_at)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div variants={item} className="md:col-span-3">
                            <motion.div
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="glass-card-interactive p-4 flex items-center gap-4 group h-full"
                                onClick={() => navigate('/pomodoro')}
                            >
                                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                                    <Brain className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-widest">Pomodoro</h3>
                                    <p className="text-[10px] text-bastion-muted font-bold">Interval Timer</p>
                                </div>
                            </motion.div>
                        </motion.div>

                        <motion.div variants={item} className="md:col-span-3">
                            <motion.div
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="glass-card-interactive p-4 flex items-center gap-4 group h-full"
                                onClick={() => navigate('/blocks')}
                            >
                                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-widest">Block Lists</h3>
                                    <p className="text-[10px] text-bastion-muted font-bold">Manage Blocked Content</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {showStartModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={() => setShowStartModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-panel w-full max-w-lg rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden"
                        >

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="heading-title flex items-center gap-2">
                                        <Rocket className="w-6 h-6 text-black dark:text-white" />
                                        Start Focus Session
                                    </h2>
                                    <button
                                        onClick={() => setShowStartModal(false)}
                                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500 dark:text-bastion-muted hover:text-black dark:hover:text-white" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-500 dark:text-bastion-secondary uppercase tracking-widest">Objective</label>
                                        <input
                                            type="text"
                                            value={sessionName}
                                            onChange={(e) => setSessionName(e.target.value)}
                                            className="glass-input text-lg"
                                            placeholder="What are you working on?"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-500 dark:text-bastion-secondary uppercase tracking-widest">Duration</label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {[15, 30, 60, 90].map(mins => (
                                                <button
                                                    key={mins}
                                                    onClick={() => setSessionDuration(mins)}
                                                    className={`py-3 rounded-xl border font-black transition-all ${sessionDuration === mins
                                                        ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-lg'
                                                        : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-gray-500 dark:text-bastion-muted hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white'
                                                        }`}
                                                >
                                                    {mins}m
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${hardcoreMode ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-black/10 dark:bg-white/10 text-gray-400 dark:text-bastion-muted'}`}>
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className={`font-black ${hardcoreMode ? 'text-black dark:text-white' : 'text-gray-500 dark:text-bastion-secondary'}`}>Hardcore Mode</p>
                                                <p className="text-xs text-gray-400 dark:text-bastion-muted font-bold">Prevent edits & exit</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setHardcoreMode(!hardcoreMode)}
                                            className={`w-14 h-8 rounded-full transition-all relative ${hardcoreMode ? 'bg-black dark:bg-white shadow-lg' : 'bg-black/10 dark:bg-white/10'}`}
                                        >
                                            <motion.div
                                                className="w-6 h-6 bg-white dark:bg-black rounded-full absolute top-1 shadow-sm"
                                                animate={{ left: hardcoreMode ? 28 : 4 }}
                                            />
                                        </button>
                                    </div>

                                    <button
                                        onClick={startSession}
                                        disabled={isStarting}
                                        className="w-full btn-primary h-14 text-lg mt-4 flex items-center justify-center gap-2 group"
                                    >
                                        {isStarting ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                START SESSION
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {showUnlockModal && (
                    <PasswordModal
                        isOpen={showUnlockModal}
                        onClose={() => setShowUnlockModal(false)}
                        onConfirm={async (password) => {
                            await sessionsApi.emergencyUnlock(password);
                            setIsSessionActive(false);
                            setHardcoreMode(false);
                        }}
                        title="Emergency Unlock"
                        message="Enter your Master Password to override Hardcore Mode and stop the session."
                        confirmLabel="Unlock & Stop"
                        type="verify"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
