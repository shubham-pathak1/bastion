import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings2 as SettingsIcon,
    Shield as ShieldIcon,
    Lock as LockIcon,
    RefreshCw as RefreshIcon,
    ExternalLink as LinkIcon,
    Github as GithubIcon,
    Heart as HeartIcon,
    Zap as ZapIcon,
    AlertTriangle as AlertIcon,
    LogOut as LogoutIcon,
    Check as CheckIcon
} from 'lucide-react';
import { securityApi } from '../lib/api';

type Tab = 'general' | 'security' | 'hardcore' | 'advanced' | 'about';

const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: ShieldIcon },
    { id: 'hardcore', label: 'Hardcore', icon: LockIcon },
    { id: 'advanced', label: 'Advanced', icon: ZapIcon },
    { id: 'about', label: 'About', icon: HeartIcon },
] as const;

export default function Settings() {
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [startOnBoot, setStartOnBoot] = useState(true);
    const [minimizeToTray, setMinimizeToTray] = useState(true);
    const [showNotifications, setShowNotifications] = useState(true);
    const [hardcoreEnabled, setHardcoreEnabled] = useState(false);
    const [emergencyOverride, setEmergencyOverride] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handlePasswordChange = async () => {
        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        try {
            const valid = await securityApi.verifyMasterPassword(currentPassword);
            if (!valid) {
                setPasswordError('Current password is incorrect');
                return;
            }

            await securityApi.setMasterPassword(newPassword);
            setPasswordSuccess('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');

            setTimeout(() => setPasswordSuccess(''), 3000);
        } catch (err) {
            setPasswordError('Failed to update password');
        }
    };

    const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            className={`w-12 h-7 rounded-full transition-all duration-300 relative ${enabled
                ? 'bg-black dark:bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                : 'bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20'
                }`}
        >
            <motion.div
                layout
                className="w-5 h-5 rounded-full bg-white dark:bg-black absolute top-1 shadow-sm"
                animate={{ left: enabled ? 26 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        </button>
    );

    const SettingRow = ({ label, description, children, danger = false }: { label: string; description?: string; children: React.ReactNode; danger?: boolean }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-between p-4 rounded-xl transition-colors ${danger ? 'hover:bg-red-500/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
        >
            <div>
                <p className={`font-bold ${danger ? 'text-white bg-red-600 px-2 py-0.5 rounded text-xs inline-block' : 'text-black dark:text-white'}`}>{label}</p>
                {description && <p className="text-sm text-gray-500 dark:text-bastion-muted mt-0.5">{description}</p>}
            </div>
            {children}
        </motion.div>
    );

    return (
        <div className="max-w-5xl mx-auto min-h-screen pb-20">
            {/* Header */}
            <div className={`sticky top-0 z-30 transition-all duration-200 ${scrolled ? 'py-4 bg-white/80 dark:bg-black/50 backdrop-blur-xl border-b border-black/5 dark:border-white/5' : 'py-8'}`}>
                <div className="flex items-center justify-between px-2">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="heading-hero"
                        >
                            Settings
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-bastion-muted mt-2"
                        >
                            Configure your defense parameters
                        </motion.p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 px-2 items-start">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <nav className="p-2 space-y-1 bg-black/5 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-black/5 dark:border-white/5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left relative overflow-hidden group ${activeTab === tab.id
                                    ? 'text-black dark:text-white bg-black/5 dark:bg-white/10 font-bold'
                                    : 'text-gray-500 dark:text-bastion-muted hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-black/5 dark:bg-white/5 text-gray-400 dark:text-bastion-muted group-hover:text-black dark:group-hover:text-white'}`}>
                                    <tab.icon className="w-4 h-4" />
                                </div>
                                <span className="relative z-10">{tab.label}</span>
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="active-tab"
                                        className="absolute left-0 w-1 h-8 bg-bastion-accent rounded-r-full"
                                    />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 glass-panel p-8 border border-black/5 dark:border-white/5 min-h-[500px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'general' && (
                                <div className="space-y-2">
                                    <h2 className="text-xl font-black text-black dark:text-white mb-6">General Preferences</h2>

                                    <SettingRow label="Start on Boot" description="Launch Bastion automatically when you log in">
                                        <Toggle enabled={startOnBoot} onChange={() => setStartOnBoot(!startOnBoot)} />
                                    </SettingRow>

                                    <SettingRow label="Minimize to Tray" description="Keep Bastion running in the background when closed">
                                        <Toggle enabled={minimizeToTray} onChange={() => setMinimizeToTray(!minimizeToTray)} />
                                    </SettingRow>

                                    <SettingRow label="Notifications" description="Receive alerts for session start/stop and blocks">
                                        <Toggle enabled={showNotifications} onChange={() => setShowNotifications(!showNotifications)} />
                                    </SettingRow>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-black text-black dark:text-white mb-6">Security & Access</h2>

                                    <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-4">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 rounded-full bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/20">
                                                <LockIcon className="w-6 h-6 text-black dark:text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-black dark:text-white">Master Password</h3>
                                                <p className="text-sm text-gray-500 dark:text-bastion-muted">Required to modify blocks and stop sessions</p>
                                            </div>
                                        </div>

                                        <div className="grid gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 dark:text-bastion-muted ml-1 mb-1.5 block">Current Password</label>
                                                <input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="glass-input w-full"
                                                    placeholder="••••••••"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 dark:text-bastion-muted ml-1 mb-1.5 block">New Password</label>
                                                    <input
                                                        type="password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="glass-input w-full"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 dark:text-bastion-muted ml-1 mb-1.5 block">Confirm Password</label>
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="glass-input w-full"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {passwordError && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-lg flex items-center gap-2">
                                                    <AlertIcon className="w-4 h-4" />
                                                    {passwordError}
                                                </motion.div>
                                            )}
                                            {passwordSuccess && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-sm text-green-500 bg-green-500/10 px-4 py-2 rounded-lg flex items-center gap-2">
                                                    <CheckIcon className="w-4 h-4" />
                                                    {passwordSuccess}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="flex justify-end pt-2">
                                            <button onClick={handlePasswordChange} className="btn-primary px-6">
                                                Update Password
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'hardcore' && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-black text-black dark:text-white mb-6">Hardcore Mode Configuration</h2>

                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mb-8 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-32 bg-black/5 dark:bg-white/5 blur-[80px] rounded-full pointer-events-none" />

                                        <div className="flex gap-4 relative z-10">
                                            <div className="p-3 bg-black/10 dark:bg-white/10 rounded-xl h-fit">
                                                <AlertIcon className="w-8 h-8 text-black dark:text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-black dark:text-white mb-2">Unbreakable Commitment</h3>
                                                <p className="text-gray-500 dark:text-bastion-muted max-w-xl">
                                                    Hardcore mode removes the ability to exit the session or modify blocklists until the timer expires.
                                                    This includes preventing application exit and uninstallation during active sessions.
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <SettingRow label="Enable by Default" description="New sessions will start in Hardcore Mode automatically">
                                        <Toggle enabled={hardcoreEnabled} onChange={() => setHardcoreEnabled(!hardcoreEnabled)} />
                                    </SettingRow>

                                    <SettingRow label="Emergency Override" description="Allow bypassing Hardcore Mode with Master Password (not recommended)">
                                        <Toggle enabled={emergencyOverride} onChange={() => setEmergencyOverride(!emergencyOverride)} />
                                    </SettingRow>
                                </div>
                            )}

                            {activeTab === 'advanced' && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-black text-black dark:text-white mb-6">Advanced Actions</h2>

                                    <SettingRow label="Export Configuration" description="Save your blocklists and settings to a file">
                                        <button className="px-4 py-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white text-sm font-bold border border-black/10 dark:border-white/10 flex items-center gap-2 transition-colors">
                                            <LinkIcon className="w-4 h-4" />
                                            Export JSON
                                        </button>
                                    </SettingRow>

                                    <SettingRow label="Import Configuration" description="Restore settings from a backup file">
                                        <button className="px-4 py-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white text-sm font-bold border border-black/10 dark:border-white/10 flex items-center gap-2 transition-colors">
                                            <RefreshIcon className="w-4 h-4" />
                                            Import JSON
                                        </button>
                                    </SettingRow>

                                    <div className="h-px bg-black/10 dark:bg-white/10 my-4" />

                                    <SettingRow label="Factory Reset" description="Clear all data and return to initial state" danger>
                                        <button className="px-4 py-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-500 text-sm font-medium border border-red-600/20 flex items-center gap-2 transition-colors">
                                            <LogoutIcon className="w-4 h-4" />
                                            Reset Bastion
                                        </button>
                                    </SettingRow>
                                </div>
                            )}

                            {activeTab === 'about' && (
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 rounded-3xl bg-black dark:bg-white shadow-xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                                        <ShieldIcon className="w-12 h-12 text-white dark:text-black" />
                                    </div>
                                    <h3 className="text-4xl font-black text-black dark:text-white mb-2 tracking-tight">Bastion</h3>
                                    <p className="text-black/60 dark:text-white/60 font-mono text-sm mb-6">v1.0.0 (Prism Alpha)</p>

                                    <p className="text-gray-500 dark:text-bastion-muted max-w-md mx-auto mb-8 leading-relaxed font-medium">
                                        Engineered for uncompromised focus. Bastion acts as your digital fortress, filtering out the noise so you can build what matters.
                                    </p>

                                    <div className="flex justify-center gap-4">
                                        <a href="#" className="p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white transition-colors border border-black/5 dark:border-white/5">
                                            <GithubIcon className="w-6 h-6" />
                                        </a>
                                        <a href="#" className="p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-pink-500 transition-colors border border-black/5 dark:border-white/5 hover:border-pink-500/20">
                                            <HeartIcon className="w-6 h-6" />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
