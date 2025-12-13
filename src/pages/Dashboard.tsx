import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    Play,
    Timer,
    Lock,
    TrendingUp,
    Clock,
    AlertTriangle,
    X,
    Loader2,
    ChevronRight
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
    const [sessionName, setSessionName] = useState('Focus Session');
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

    return (
        <div className="max-w-6xl mx-auto animate-in">
            {/* Hero stat */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <p className="text-bastion-text-muted mb-1">Today's Focus</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-6xl font-bold tracking-tighter text-white">{todayStats.hours}</span>
                    <span className="text-2xl text-bastion-text-muted">h</span>
                    <span className="text-6xl font-bold tracking-tighter text-white ml-2">{todayStats.minutes}</span>
                    <span className="text-2xl text-bastion-text-muted">m</span>
                </div>
                <p className="text-bastion-text-muted text-sm mt-1">
                    {blockedCount > 0 ? `${blockedCount} sites blocked` : 'No sites blocked yet'}
                </p>
            </motion.div>

            {/* Active session card */}
            {isSessionActive && sessionTimeLeft !== null && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card mb-8 border-bastion-accent/30 bg-gradient-to-br from-bastion-surface to-bastion-accent-muted"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <motion.div
                                className="w-14 h-14 rounded-xl bg-bastion-accent-muted flex items-center justify-center"
                                animate={{ boxShadow: ['0 0 0 rgba(0,229,255,0.3)', '0 0 20px rgba(0,229,255,0.3)', '0 0 0 rgba(0,229,255,0.3)'] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Shield className="w-7 h-7 text-bastion-accent" />
                            </motion.div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Focus Session Active</h3>
                                <p className="text-bastion-text-muted text-sm">{blockedCount} sites blocked</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-mono font-bold text-bastion-accent tracking-tight">
                                {formatTimeLeft(sessionTimeLeft)}
                            </p>
                            <p className="text-bastion-text-muted text-sm">remaining</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { icon: Play, label: 'Start Focus', desc: 'Begin a session', color: 'bastion-accent', onClick: () => setShowStartModal(true) },
                    { icon: Timer, label: 'Pomodoro', desc: '25/5 work cycles', color: 'bastion-success', onClick: () => navigate('/pomodoro') },
                    { icon: Lock, label: 'Manage Blocks', desc: `${blockedCount} configured`, color: 'bastion-warning', onClick: () => navigate('/blocks') },
                ].map((action, i) => (
                    <motion.button
                        key={i}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={action.onClick}
                        className="card-interactive flex items-center gap-4 text-left"
                    >
                        <div className={`w-12 h-12 rounded-xl bg-${action.color}-muted flex items-center justify-center`}>
                            <action.icon className={`w-6 h-6 text-${action.color}`} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-white">{action.label}</h3>
                            <p className="text-sm text-bastion-text-muted">{action.desc}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-bastion-text-muted" />
                    </motion.button>
                ))}
            </div>

            {/* Recent activity & stats */}
            <div className="grid grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="heading-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-bastion-warning" />
                            Recent Blocks
                        </h2>
                        <button
                            onClick={() => navigate('/stats')}
                            className="text-sm text-bastion-accent hover:underline"
                        >
                            View all
                        </button>
                    </div>
                    <div className="space-y-2">
                        {isLoading ? (
                            <div className="py-8 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-bastion-accent" />
                            </div>
                        ) : recentBlocks.length === 0 ? (
                            <div className="py-8 text-center">
                                <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-bastion-text-muted opacity-30" />
                                <p className="text-bastion-text-muted text-sm">No blocks yet</p>
                                <p className="text-xs text-bastion-text-muted">Sites will appear here when blocked</p>
                            </div>
                        ) : (
                            recentBlocks.map((block) => (
                                <div key={block.id} className="flex items-center justify-between py-3 border-b border-bastion-border last:border-0">
                                    <div>
                                        <p className="font-mono text-sm text-white">{block.target}</p>
                                        <p className="text-xs text-bastion-text-muted">{formatBlockTime(block.blocked_at)}</p>
                                    </div>
                                    <span className="badge-danger">blocked</span>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="heading-3 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-bastion-success" />
                            Today
                        </h2>
                        <button
                            onClick={() => navigate('/stats')}
                            className="text-sm text-bastion-accent hover:underline"
                        >
                            Full stats
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-bastion-bg-elevated">
                            <p className="stat-value">{todayStats.hours}h {todayStats.minutes}m</p>
                            <p className="stat-label flex items-center gap-1 mt-1">
                                <Clock className="w-4 h-4" /> Focus time
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-bastion-bg-elevated">
                            <p className="stat-value">{todayStats.totalBlocks}</p>
                            <p className="stat-label flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-4 h-4" /> Blocks
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 h-16 flex items-end gap-1">
                        {[40, 65, 30, 85, 70, 55, 45].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ delay: 0.3 + i * 0.05 }}
                                className="flex-1 bg-bastion-accent/30 rounded-t hover:bg-bastion-accent/50 transition-colors"
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-bastion-text-muted mt-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                            <span key={d}>{d}</span>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Start Session Modal */}
            <AnimatePresence>
                {showStartModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => setShowStartModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-bastion-surface border border-bastion-border rounded-2xl p-6 w-full max-w-md"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="heading-2">Start Focus Session</h2>
                                <button
                                    onClick={() => setShowStartModal(false)}
                                    className="p-2 hover:bg-bastion-surface-hover rounded-xl"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="label mb-2 block">Session Name</label>
                                    <input
                                        type="text"
                                        value={sessionName}
                                        onChange={(e) => setSessionName(e.target.value)}
                                        className="input"
                                        placeholder="Focus Session"
                                    />
                                </div>

                                <div>
                                    <label className="label mb-2 block">Duration (minutes)</label>
                                    <input
                                        type="number"
                                        value={sessionDuration}
                                        onChange={(e) => setSessionDuration(Number(e.target.value))}
                                        className="input"
                                        min={5}
                                        max={480}
                                    />
                                </div>

                                <div className="flex items-center justify-between py-4 border-t border-bastion-border">
                                    <div>
                                        <p className="font-medium text-white">Hardcore Mode</p>
                                        <p className="text-sm text-bastion-text-muted">Cannot be disabled until session ends</p>
                                    </div>
                                    <button
                                        onClick={() => setHardcoreMode(!hardcoreMode)}
                                        className={`w-11 h-6 rounded-full transition-all duration-200 relative ${hardcoreMode ? 'bg-bastion-warning' : 'bg-bastion-surface-active'
                                            }`}
                                    >
                                        <motion.div
                                            layout
                                            className="w-5 h-5 rounded-full bg-white absolute top-0.5"
                                            animate={{ left: hardcoreMode ? 22 : 2 }}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setShowStartModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button onClick={startSession} disabled={isStarting} className="btn-primary flex items-center gap-2">
                                    {isStarting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4" />
                                            Start Session
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
