import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    Clock,
    Ban,
    Calendar,
    Download,
    ChevronDown,
    Loader2,
    RefreshCw
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { statsApi, FocusStats } from '../lib/api';

type TimeRange = '7d' | '30d' | '90d';

export default function Stats() {
    const [timeRange, setTimeRange] = useState<TimeRange>('7d');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<FocusStats[]>([]);

    const loadStats = async () => {
        setIsLoading(true);
        try {
            const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
            const data = await statsApi.getFocusStats(days);
            setStats(data);
        } catch (err) {
            console.error('Failed to load stats:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, [timeRange]);

    // Process data for charts
    const chartData = stats.map(s => ({
        date: s.date.slice(5), // MM-DD format
        hours: Math.round(s.minutes_protected / 60 * 10) / 10,
        blocks: s.blocks_count
    })).reverse();

    const totalHours = stats.reduce((sum, s) => sum + s.minutes_protected, 0) / 60;
    const totalBlocks = stats.reduce((sum, s) => sum + s.blocks_count, 0);
    const avgDaily = totalHours / (stats.length || 1);
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

    return (
        <div className="max-w-6xl mx-auto animate-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="heading-1 mb-2">Stats & Insights</h1>
                    <p className="text-bastion-text-secondary">
                        Track your focus journey and identify patterns
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={loadStats}
                        className="btn-ghost flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="relative">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                            className="input pr-10 appearance-none cursor-pointer bg-bastion-surface"
                        >
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bastion-text-muted pointer-events-none" />
                    </div>
                    <button className="btn-secondary flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="card bg-gradient-to-br from-bastion-surface to-bastion-accent-muted"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-bastion-accent/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-bastion-accent" />
                        </div>
                        <span className="text-bastion-text-muted text-sm">Total Focus</span>
                    </div>
                    <p className="stat-value">{totalHours.toFixed(1)}h</p>
                    <p className="text-sm text-bastion-success mt-1 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" /> Last {days} days
                    </p>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="card"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-bastion-warning-muted flex items-center justify-center">
                            <Ban className="w-5 h-5 text-bastion-warning" />
                        </div>
                        <span className="text-bastion-text-muted text-sm">Blocks</span>
                    </div>
                    <p className="stat-value">{totalBlocks}</p>
                    <p className="text-sm text-bastion-text-muted mt-1">
                        ~{Math.round(totalBlocks / days)} per day
                    </p>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="card"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-bastion-success-muted flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-bastion-success" />
                        </div>
                        <span className="text-bastion-text-muted text-sm">Daily Avg</span>
                    </div>
                    <p className="stat-value">{avgDaily.toFixed(1)}h</p>
                    <p className="text-sm text-bastion-text-muted mt-1">
                        Goal: 6h
                    </p>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="card"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-bastion-text-muted text-sm">Streak</span>
                    </div>
                    <p className="stat-value">{stats.length} days</p>
                    <p className="text-sm text-bastion-text-muted mt-1">
                        Data recorded
                    </p>
                </motion.div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
                {/* Focus time chart */}
                <div className="col-span-2 card">
                    <h2 className="heading-3 mb-4">Focus Time</h2>
                    {isLoading ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-bastion-accent" />
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-bastion-text-muted">
                            <div className="text-center">
                                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No data yet</p>
                                <p className="text-sm">Start a focus session to see your stats</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#666666"
                                        fontSize={12}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="#666666"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `${v}h`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#111111',
                                            border: '1px solid #1f1f1f',
                                            borderRadius: '12px',
                                        }}
                                        labelStyle={{ color: '#ffffff' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="hours"
                                        stroke="#00e5ff"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorHours)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Daily breakdown */}
                <div className="card">
                    <h2 className="heading-3 mb-4">Daily Breakdown</h2>
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="py-8 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-bastion-accent" />
                            </div>
                        ) : stats.length === 0 ? (
                            <p className="text-bastion-text-muted text-sm py-4 text-center">
                                No data recorded yet
                            </p>
                        ) : (
                            stats.slice(0, 7).map((day) => (
                                <div key={day.date} className="flex items-center justify-between py-2 border-b border-bastion-border last:border-0">
                                    <div>
                                        <p className="text-sm font-medium">{day.date}</p>
                                        <p className="text-xs text-bastion-text-muted">{day.blocks_count} blocks</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-bastion-accent">
                                            {Math.floor(day.minutes_protected / 60)}h {day.minutes_protected % 60}m
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Heatmap */}
            <div className="card">
                <h2 className="heading-3 mb-2">Activity Overview</h2>
                <p className="text-bastion-text-muted text-sm mb-6">
                    Your focus patterns over time
                </p>

                {isLoading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-bastion-accent" />
                    </div>
                ) : stats.length === 0 ? (
                    <div className="py-12 text-center text-bastion-text-muted">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No activity data yet</p>
                        <p className="text-sm">Complete focus sessions to build your heatmap</p>
                    </div>
                ) : (
                    <div className="flex gap-1 flex-wrap">
                        {stats.map((day, i) => {
                            const intensity = Math.min(day.minutes_protected / 60, 8) / 8;
                            return (
                                <div
                                    key={day.date}
                                    className="w-4 h-4 rounded-sm transition-colors"
                                    style={{
                                        backgroundColor: intensity > 0.7
                                            ? '#00e5ff'
                                            : intensity > 0.4
                                                ? 'rgba(0, 229, 255, 0.5)'
                                                : intensity > 0.1
                                                    ? 'rgba(0, 229, 255, 0.2)'
                                                    : '#1a1a1a',
                                    }}
                                    title={`${day.date}: ${Math.floor(day.minutes_protected / 60)}h ${day.minutes_protected % 60}m focus`}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
