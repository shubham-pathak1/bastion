import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    Timer,
    Lock,
    Clock,
    X,
    Loader2,
    ChevronRight,
    Zap,
    Activity
} from 'lucide-react';
import { statsApi, sessionsApi, blockedSitesApi, BlockEvent } from '../lib/api';

export default function Dashboard() {
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

    useEffect(() => {
        loadDashboardData();

        const interval = setInterval(async () => {
            try {
                const remaining = await sessionsApi.getTimeRemaining();
                if (remaining !== null && remaining > 0) {
                    setSessionTimeLeft(remaining);
                    setIsSessionActive(true);
                } else {
                    setSessionTimeLeft(null);
                    setIsSessionActive(false);
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
            const [blocks, sites, stats] = await Promise.all([
                statsApi.getRecentBlocks(5),
                blockedSitesApi.getAll(),
                statsApi.getFocusStats(1),
            ]);

            setRecentBlocks(blocks);
            setBlockedCount(sites.filter(s => s.enabled).length);

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
        const date = new Date(blockedAt);
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
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end justify-between"
            >
                <div>
                    <h1 className="heading-hero">
                        Command Center
                    </h1>
                    <p className="text-gray-500 dark:text-bastion-muted mt-2 text-lg">
                        You remain <span className="text-black dark:text-white font-black underline underline-offset-8 tracking-tight">UNBREAKABLE</span> today.
                    </p>
                </div>

                {isSessionActive && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-3 px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white shadow-xl"
                    >
                        <div className="w-2 h-2 rounded-full bg-white dark:bg-black animate-pulse" />
                        <span className="font-mono font-black text-xs tracking-tighter">
                            SESSION ACTIVE
                        </span>
                    </motion.div>
                )}
            </motion.div>

            {/* Bento Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
                {/* Main Stat Card - Spans 2 cols */}
                <motion.div variants={item} className="md:col-span-2 glass-card p-8 flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-black/5 dark:bg-white/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors duration-500" />

                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-gray-500 dark:text-bastion-secondary font-bold mb-1 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-black dark:text-white" />
                                Focus Time
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-display font-black text-black dark:text-white tracking-tighter">
                                    {todayStats.hours}
                                </span>
                                <span className="text-xl text-gray-400 dark:text-bastion-muted font-bold">h</span>
                                <span className="text-6xl font-display font-black text-black dark:text-white tracking-tighter ml-2">
                                    {todayStats.minutes}
                                </span>
                                <span className="text-xl text-gray-400 dark:text-bastion-muted font-bold">m</span>
                            </div>
                        </div>
                        {isSessionActive && sessionTimeLeft !== null && (
                            <div className="text-right">
                                <p className="text-sm text-gray-400 dark:text-bastion-muted mb-1 font-bold">Remaining</p>
                                <p className="text-2xl font-mono text-black dark:text-white tracking-widest font-black">{formatTimeLeft(sessionTimeLeft)}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 relative z-10">
                        <div className="h-1 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((todayStats.hours / 8) * 100, 100)}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-black dark:bg-white shadow-md shadow-black/10 dark:shadow-white/50"
                            />
                        </div>
                        <p className="text-xs text-gray-400 dark:text-bastion-muted mt-2 text-right font-bold uppercase tracking-wider">Target: 8h</p>
                    </div>
                </motion.div>

                {/* Quick Start Card */}
                <motion.div variants={item} className="glass-card-interactive p-6 flex flex-col items-center justify-center text-center gap-4 group" onClick={() => setShowStartModal(true)}>
                    <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border border-black/5 dark:border-white/5">
                        <Zap className="w-8 h-8 text-black dark:text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-black dark:text-white">Focus Now</h3>
                        <p className="text-sm text-gray-500 dark:text-bastion-muted font-bold">Start a deep work session</p>
                    </div>
                </motion.div>

                {/* Blocks Stat Card */}
                <motion.div variants={item} className="glass-card p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-black/5 dark:bg-white/5 blur-[40px] rounded-full" />

                    <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-500 dark:text-bastion-secondary font-bold flex items-center gap-2">
                            <Shield className="w-4 h-4 text-black dark:text-white" />
                            Threats
                        </p>
                        <span className="text-xs font-mono bg-black/5 dark:bg-white/5 px-2 py-1 rounded text-black/40 dark:text-bastion-muted font-bold">{blockedCount} Active</span>
                    </div>
                    <div>
                        <p className="text-4xl font-black text-black dark:text-white">{todayStats.totalBlocks}</p>
                        <p className="text-sm text-gray-400 dark:text-bastion-muted mt-1 font-bold">Distractions blocked today</p>
                    </div>
                </motion.div>

                {/* Recent Activity Feed - Spans full width on mobile, 2 on desktop */}
                <motion.div variants={item} className="md:col-span-2 glass-card p-0 flex flex-col">
                    <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                        <h3 className="font-black text-black dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-black dark:text-white" />
                            Live Feed
                        </h3>
                        <button onClick={() => navigate('/stats')} className="text-xs font-black text-black dark:text-white hover:underline transition-colors uppercase tracking-widest">
                            VIEW REPORT
                        </button>
                    </div>
                    <div className="flex-1 p-2">
                        {isLoading ? (
                            <div className="h-40 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-black dark:text-white" />
                            </div>
                        ) : recentBlocks.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-gray-400 dark:text-bastion-muted gap-2 font-bold">
                                <Shield className="w-8 h-8 opacity-20" />
                                <p className="text-sm">No activity recorded yet</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {recentBlocks.map((block) => (
                                    <div key={block.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-black dark:bg-white shadow-md shadow-black/10 dark:shadow-white/50" />
                                            <div>
                                                <p className="font-mono text-sm text-black dark:text-white font-bold transition-colors">
                                                    {block.target}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-mono text-gray-400 dark:text-bastion-muted font-bold">
                                            {formatBlockTime(block.blocked_at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Quick Actions 2x1 */}
                <motion.div variants={item} className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass-card-interactive p-6 flex flex-col justify-center items-start gap-4"
                        onClick={() => navigate('/pomodoro')}
                    >
                        <Timer className="w-8 h-8 text-black dark:text-white" />
                        <div>
                            <h3 className="font-black text-black dark:text-white">Pomodoro</h3>
                            <p className="text-xs text-gray-500 dark:text-bastion-muted mt-1 font-bold">Cycle focus & breaks</p>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass-card-interactive p-6 flex flex-col justify-center items-start gap-4"
                        onClick={() => navigate('/blocks')}
                    >
                        <Lock className="w-8 h-8 text-black dark:text-white" />
                        <div>
                            <h3 className="font-black text-black dark:text-white">Manage Blocks</h3>
                            <p className="text-xs text-gray-500 dark:text-bastion-muted mt-1 font-bold">Configure firewall</p>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Start Session Modal */}
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
                            {/* Decorative Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="heading-title flex items-center gap-2">
                                        <Zap className="w-6 h-6 text-black dark:text-white" />
                                        Initiate Focus
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
                                            className="glass-input text-lg" // Larger input
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
                                        {/* Custom duration slider could go here */}
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
                                                ENGAGE PROTOCOL
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
