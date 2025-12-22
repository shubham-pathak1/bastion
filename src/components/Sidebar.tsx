import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Ban,
    Calendar,
    Timer,
    BarChart3,
    Settings,
    ChevronLeft,
    ShieldCheck,
    ShieldAlert,
} from 'lucide-react';
import { sessionsApi, blockedSitesApi } from '../lib/api';
import logo from '../assets/bastion_logo.png';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/blocks', icon: Ban, label: 'Blocks' },
    { path: '/sessions', icon: Calendar, label: 'Sessions' },
    { path: '/pomodoro', icon: Timer, label: 'Pomodoro' },
    { path: '/stats', icon: BarChart3, label: 'Stats' },
    { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const location = useLocation();
    const [isProtected, setIsProtected] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const [remaining, sites] = await Promise.all([
                    sessionsApi.getTimeRemaining().catch(() => null),
                    blockedSitesApi.getAll().catch(() => [])
                ]);

                const hasActiveSession = remaining !== null && remaining > 0;
                const hasBlockedSites = sites.filter(s => s.enabled).length > 0;

                setIsProtected(hasActiveSession || hasBlockedSites);
            } catch (err) {
                // API not ready
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 80 : 260 }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0, damping: 20 }}
            className="h-full glass-panel rounded-3xl flex flex-col relative z-20"
        >
            {/* Logo Area */}
            <div className="h-20 flex items-center px-5 mb-2">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg border border-black/5 dark:border-white/10">
                        <img src={logo} alt="Bastion Logo" className="w-full h-full object-cover" />
                    </div>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex flex-col"
                        >
                            <span className="font-display text-xl font-black tracking-tight text-black dark:text-white">
                                Bastion
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/60 font-bold">
                                Version 1.0
                            </span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="block relative group"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl shadow-md"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            <div className={`
                                relative flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200
                                ${isActive ? 'text-black dark:text-white' : 'text-gray-500 dark:text-bastion-secondary hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}
                            `}>
                                <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-black dark:text-white' : ''}`} />
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="font-black text-sm tracking-wide"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </div>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Status & Collapse */}
            <div className="p-4 mt-auto space-y-4">
                {/* Status Card */}
                <div className={`
                    relative overflow-hidden rounded-2xl p-3 transition-all duration-300 border
                    ${isProtected
                        ? 'bg-black/10 dark:bg-white/10 border-black/10 dark:border-white/20'
                        : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10'}
                `}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${isProtected ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-black/5 dark:bg-white/5 text-black dark:text-white'}`}>
                            {isProtected ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                        </div>
                        {!collapsed && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
                                <p className={`text-sm font-black ${isProtected ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/60'}`}>
                                    {isProtected ? 'Protected' : 'Vulnerable'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-bastion-muted truncate font-bold">
                                    {isProtected ? 'Focus Active' : 'No blocks active'}
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-bastion-muted hover:text-black dark:hover:text-white transition-all border border-transparent hover:border-black/5 dark:hover:border-white/5"
                >
                    <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
                        <ChevronLeft className="w-5 h-5" />
                    </motion.div>
                </button>
            </div>
        </motion.aside>
    );
}
