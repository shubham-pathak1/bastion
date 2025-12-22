import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    Clock,
    Ban,
    Calendar,
    Loader2,
    RefreshCw,
    Share2,
    Info,
    ArrowUpRight
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { statsApi, FocusStats } from '../lib/api';

type TimeRange = '7d' | '30d' | '90d';

export default function Stats() {
    const [timeRange, setTimeRange] = useState<TimeRange>('7d');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<FocusStats[]>([]);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
        fullDate: s.date,
        hours: Math.round(s.minutes_protected / 60 * 10) / 10,
        blocks: s.blocks_count,
        intensity: Math.min(s.minutes_protected / 60, 8) / 8
    })).reverse();

    const totalHours = stats.reduce((sum, s) => sum + s.minutes_protected, 0) / 60;
    const totalBlocks = stats.reduce((sum, s) => sum + s.blocks_count, 0);
    const avgDaily = totalHours / (stats.length || 1);
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

    // Calculate trend (dummy logic for now, could be real later)
    const trend = "+12.5%";

    return (
        <div className="max-w-7xl mx-auto min-h-screen pb-20">
            {/* Header */}
            <div className={`sticky top-0 z-30 transition-all duration-200 ${scrolled ? 'py-4 bg-black/50 backdrop-blur-xl border-b border-white/5' : 'py-8'}`}>
                <div className="flex items-center justify-between px-2">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="heading-hero"
                        >
                            Analytics
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-bastion-muted mt-2"
                        >
                            Deep dive into your productivity metrics
                        </motion.p>
                    </div>

                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={loadStats}
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5 hover:border-white/10"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </motion.button>

                        <div className="relative group z-50">
                            <div className="absolute inset-0 bg-bastion-accent/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative bg-black/40 backdrop-blur-md border border-white/10 rounded-xl flex items-center p-1">
                                {['7d', '30d', '90d'].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setTimeRange(r as TimeRange)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative ${timeRange === r
                                            ? 'text-black'
                                            : 'text-bastion-muted hover:text-white'
                                            }`}
                                    >
                                        {timeRange === r && (
                                            <motion.div
                                                layoutId="range-bg"
                                                className="absolute inset-0 bg-bastion-accent rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="relative z-10">{r.toUpperCase()}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-secondary px-4 flex items-center gap-2"
                        >
                            <Share2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Share</span>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-2">
                {[
                    {
                        label: "Total Focus",
                        value: `${totalHours.toFixed(1)}h`,
                        sub: `Last ${days} days`,
                        icon: Clock,
                        color: "text-bastion-accent",
                        bg: "bg-bastion-accent/10",
                        border: "border-bastion-accent/20"
                    },
                    {
                        label: "Distractions Blocked",
                        value: totalBlocks,
                        sub: `~${Math.round(totalBlocks / days)} per day`,
                        icon: Ban,
                        color: "text-bastion-danger",
                        bg: "bg-bastion-danger/10",
                        border: "border-bastion-danger/20"
                    },
                    {
                        label: "Daily Average",
                        value: `${avgDaily.toFixed(1)}h`,
                        sub: "Goal: 6h",
                        icon: BarChart3,
                        color: "text-bastion-success",
                        bg: "bg-bastion-success/10",
                        border: "border-bastion-success/20"
                    },
                    {
                        label: "Productivity Strike",
                        value: `${stats.length} Days`,
                        sub: "Current Streak",
                        icon: TrendingUp,
                        color: "text-purple-400",
                        bg: "bg-purple-500/10",
                        border: "border-purple-500/20"
                    }
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-panel p-6 border border-white/5 hover:border-white/10 relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 p-16 ${stat.bg} blur-[60px] rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />

                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className={`p-3 rounded-2xl ${stat.bg} border ${stat.border}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium text-bastion-success bg-bastion-success/10 px-2 py-1 rounded-lg border border-bastion-success/20">
                                <ArrowUpRight className="w-3 h-3" />
                                {trend}
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{stat.value}</h3>
                            <p className="text-sm text-bastion-muted font-medium">{stat.label}</p>
                            <p className="text-xs text-white/40 mt-2">{stat.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 px-2">
                {/* Focus Time Area Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="col-span-2 glass-panel p-6 border border-white/5 relative"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-white">Focus Trajectory</h2>
                            <p className="text-sm text-bastion-muted">Daily breakdown vs goal</p>
                        </div>
                        <button className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                            <Info className="w-5 h-5 text-bastion-muted" />
                        </button>
                    </div>

                    <div className="h-[300px] w-full">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-bastion-accent" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#666"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: '#666' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#666"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `${v}h`}
                                        tick={{ fill: '#666' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(0,0,0,0.8)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: '#999', marginBottom: '0.5rem' }}
                                        labelFormatter={(label, payload) => {
                                            if (payload && payload.length > 0) {
                                                return payload[0].payload.fullDate;
                                            }
                                            return label;
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="hours"
                                        stroke="#00F0FF"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorHours)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Blocks Bar Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass-panel p-6 border border-white/5"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-white">Blocked Items</h2>
                            <p className="text-sm text-bastion-muted">Distractions prevented</p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-bastion-danger" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#666"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: '#666' }}
                                        dy={10}
                                        interval={1}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{
                                            backgroundColor: 'rgba(0,0,0,0.8)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                        }}
                                    />
                                    <Bar dataKey="blocks" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.blocks > 20 ? '#FF3366' : '#FF336680'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Heatmap Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mx-2 glass-panel p-8 border border-white/5 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-bastion-accent/50 to-transparent opacity-20" />

                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h2 className="heading-2 mb-2">Consistency Heatmap</h2>
                        <p className="text-bastion-muted max-w-lg">
                            Visualizing your daily focus intensity. Darker cells indicate longer deep work sessions.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-bastion-muted">
                        <span>Less</span>
                        <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-sm bg-white/5" />
                            <div className="w-3 h-3 rounded-sm bg-bastion-accent/20" />
                            <div className="w-3 h-3 rounded-sm bg-bastion-accent/50" />
                            <div className="w-3 h-3 rounded-sm bg-bastion-accent" />
                        </div>
                        <span>More</span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="h-32 flex justify-center items-center">
                        <Loader2 className="w-8 h-8 animate-spin text-bastion-accent" />
                    </div>
                ) : stats.length === 0 ? (
                    <div className="py-12 text-center text-bastion-muted border border-dashed border-white/10 rounded-2xl bg-black/20">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No activity data recorded yet</p>
                    </div>
                ) : (
                    <div className="flex gap-1.5 flex-wrap">
                        {stats.map((day, i) => (
                            <motion.div
                                key={day.date}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.01 }}
                                className="w-8 h-8 rounded-md transition-all duration-300 hover:scale-125 hover:z-10 relative group cursor-pointer"
                                style={{
                                    backgroundColor: day.minutes_protected === 0
                                        ? 'rgba(255,255,255,0.05)'
                                        : `rgba(0, 240, 255, ${Math.max(0.2, Math.min(day.minutes_protected / 300, 1))})`,
                                    boxShadow: day.minutes_protected > 240 ? '0 0 10px rgba(0,240,255,0.4)' : 'none'
                                }}
                            >
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 backdrop-blur-md rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-white/10">
                                    <p className="font-bold text-white">{day.date}</p>
                                    <p className="text-bastion-accent">{Math.floor(day.minutes_protected / 60)}h {day.minutes_protected % 60}m</p>
                                </div>
                            </motion.div>
                        ))}
                        {/* Fill empty spots for visual balance if needed */}
                        {Array.from({ length: Math.max(0, 90 - stats.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="w-8 h-8 rounded-md bg-white/5 opacity-20" />
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
