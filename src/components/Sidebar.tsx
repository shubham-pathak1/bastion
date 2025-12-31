import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Home,
    ShieldOff,
    Target,
    Brain,
    LineChart,
    SlidersHorizontal,
    ChevronLeft,
} from 'lucide-react';
import { sessionsApi, blockedSitesApi } from '../lib/api';
import logo from '../assets/bastion_logo.png';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/blocks', icon: ShieldOff, label: 'Blocks' },
    { path: '/sessions', icon: Target, label: 'Sessions' },
    { path: '/pomodoro', icon: Brain, label: 'Pomodoro' },
    { path: '/stats', icon: LineChart, label: 'Stats' },
    { path: '/settings', icon: SlidersHorizontal, label: 'Settings' },
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
            animate={{ width: collapsed ? 84 : 260 }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0, damping: 20 }}
            className="h-full glass-panel rounded-3xl flex flex-col relative z-20 border border-white/5"
        >
            {/* Logo Area */}
            <div className={`h-24 flex items-center transition-all duration-300 ${collapsed ? 'justify-center px-0' : 'px-6'}`}>
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0 group cursor-pointer">
                        <img src={logo} alt="Bastion Logo" className="w-full h-full object-contain invert dark:invert-0" />
                    </div>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex flex-col"
                        >
                            <span className="font-display text-xl font-black tracking-tight text-black dark:text-white leading-none">
                                Bastion
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-black/40 dark:text-white/40 font-bold mt-1">
                                FOCUS SHELL
                            </span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className={`flex-1 space-y-1.5 transition-all duration-300 ${collapsed ? 'px-4' : 'px-4'}`}>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="block relative group"
                        >
                            <div className={`
                                relative flex items-center gap-4 px-3 py-3 rounded-2xl transition-all duration-300
                                ${isActive
                                    ? 'text-black dark:text-white bg-black/5 dark:bg-white/10 shadow-sm border border-black/5 dark:border-white/5'
                                    : 'text-gray-500 dark:text-bastion-secondary hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}
                            `}>
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active-bar"
                                        className="absolute left-0 w-1 h-6 bg-black dark:bg-white rounded-r-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <item.icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="font-black text-sm tracking-tight"
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
            <div className="p-4 mt-auto space-y-3">
                {/* Status Card */}
                <div className={`
                    relative overflow-hidden rounded-2xl p-1.5 transition-all duration-500
                    ${isProtected
                        ? 'bg-black/10 dark:bg-white/10 shadow-lg shadow-black/5'
                        : 'bg-black/5 dark:bg-white/5'}
                `}>
                    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-2 py-1'}`}>
                        <div className={`w-8 h-8 flex-shrink-0 transition-all duration-500`}>
                            <img
                                src={logo}
                                alt="Status"
                                className={`w-full h-full object-contain ${isProtected ? 'invert dark:invert-0' : 'opacity-40'}`}
                            />
                        </div>
                        {!collapsed && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
                                <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${isProtected ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40'}`}>
                                    {isProtected ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-bastion-muted font-bold mt-1">
                                    {isProtected ? 'Focusing' : 'Idle'}
                                </span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-center h-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-bastion-muted hover:text-black dark:hover:text-white transition-all group border border-transparent hover:border-black/5 dark:hover:border-white/5"
                >
                    <motion.div
                        animate={{ rotate: collapsed ? 180 : 0 }}
                        className="group-hover:scale-125 transition-transform duration-300"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </motion.div>
                </button>
            </div>
        </motion.aside >
    );
}
