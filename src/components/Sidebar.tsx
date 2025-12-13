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
    Shield,
    ShieldCheck,
    ShieldAlert,
} from 'lucide-react';
import { sessionsApi, blockedSitesApi } from '../lib/api';

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
    const [blockedCount, setBlockedCount] = useState(0);

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
                setBlockedCount(sites.filter(s => s.enabled).length);
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
            animate={{ width: collapsed ? 72 : 240 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="h-full bg-bastion-bg border-r border-bastion-border flex flex-col"
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-bastion-border">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bastion-accent to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-glow">
                        <Shield className="w-5 h-5 text-black" />
                    </div>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-xl font-bold tracking-tight text-white"
                        >
                            Bastion
                        </motion.span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-bastion-accent text-black'
                                    : 'text-bastion-text-secondary hover:bg-bastion-surface hover:text-white'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-black' : ''}`} />
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="font-medium text-sm"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Status indicator */}
            <div className="p-3 border-t border-bastion-border">
                <div
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl ${isProtected ? 'bg-bastion-success-muted' : 'bg-bastion-danger-muted'
                        }`}
                >
                    {isProtected ? (
                        <ShieldCheck className="w-5 h-5 text-bastion-success flex-shrink-0" />
                    ) : (
                        <ShieldAlert className="w-5 h-5 text-bastion-danger flex-shrink-0" />
                    )}
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <p className={`text-sm font-medium ${isProtected ? 'text-bastion-success' : 'text-bastion-danger'}`}>
                                {isProtected ? 'Protected' : 'Not Protected'}
                            </p>
                            <p className="text-xs text-bastion-text-muted truncate">
                                {isProtected ? `${blockedCount} sites blocked` : 'Add sites to protect'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Collapse toggle */}
            <button
                onClick={onToggle}
                className="p-4 border-t border-bastion-border flex items-center justify-center hover:bg-bastion-surface transition-colors"
            >
                <motion.div
                    animate={{ rotate: collapsed ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronLeft className="w-5 h-5 text-bastion-text-muted" />
                </motion.div>
            </button>
        </motion.aside>
    );
}
