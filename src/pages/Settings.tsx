import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Settings2,
    Shield,
    Moon,
    Sun,
    Monitor,
    Lock,
    Key,
    RefreshCw,
    ExternalLink,
    Github,
    Heart,
    Zap,
    AlertTriangle,
} from 'lucide-react';
import { cn } from '../lib/utils';

type Tab = 'general' | 'security' | 'hardcore' | 'advanced' | 'about';
type Theme = 'system' | 'dark' | 'light';

const tabs = [
    { id: 'general' as Tab, label: 'General', icon: Settings2 },
    { id: 'security' as Tab, label: 'Security', icon: Lock },
    { id: 'hardcore' as Tab, label: 'Hardcore', icon: Shield },
    { id: 'advanced' as Tab, label: 'Advanced', icon: Zap },
    { id: 'about' as Tab, label: 'About', icon: Heart },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [theme, setTheme] = useState<Theme>('dark');
    const [settings, setSettings] = useState({
        launchOnStartup: true,
        notifications: true,
        minimizeToTray: true,
        emergencyOverride: false,
        emergencyDelay: 30,
        whitelistSystem: true,
        backupPath: 'C:\\Users\\AppData\\Bastion\\backup',
    });

    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="max-w-4xl mx-auto animate-in">
            <div className="mb-8">
                <h1 className="heading-1 mb-2">Settings</h1>
                <p className="text-bastion-text-secondary">
                    Configure Bastion to work the way you need
                </p>
            </div>

            <div className="flex gap-6">
                {/* Tabs sidebar */}
                <div className="w-48 flex-shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
                                    activeTab === tab.id
                                        ? 'bg-bastion-accent/10 text-bastion-accent'
                                        : 'text-bastion-text-secondary hover:bg-bastion-surface hover:text-bastion-text-primary'
                                )}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 card">
                    {activeTab === 'general' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            <h2 className="heading-2 mb-6">General Settings</h2>

                            <div className="flex items-center justify-between py-4 border-b border-bastion-border">
                                <div>
                                    <p className="font-medium">Launch at Startup</p>
                                    <p className="text-sm text-bastion-text-muted">
                                        Automatically start Bastion when you log in
                                    </p>
                                </div>
                                <Toggle
                                    enabled={settings.launchOnStartup}
                                    onChange={(v) => updateSetting('launchOnStartup', v)}
                                />
                            </div>

                            <div className="flex items-center justify-between py-4 border-b border-bastion-border">
                                <div>
                                    <p className="font-medium">Notifications</p>
                                    <p className="text-sm text-bastion-text-muted">
                                        Show alerts when sessions start or sites are blocked
                                    </p>
                                </div>
                                <Toggle
                                    enabled={settings.notifications}
                                    onChange={(v) => updateSetting('notifications', v)}
                                />
                            </div>

                            <div className="flex items-center justify-between py-4 border-b border-bastion-border">
                                <div>
                                    <p className="font-medium">Minimize to Tray</p>
                                    <p className="text-sm text-bastion-text-muted">
                                        Keep running in background when closed
                                    </p>
                                </div>
                                <Toggle
                                    enabled={settings.minimizeToTray}
                                    onChange={(v) => updateSetting('minimizeToTray', v)}
                                />
                            </div>

                            <div className="py-4">
                                <p className="font-medium mb-3">Theme</p>
                                <div className="flex gap-3">
                                    {[
                                        { id: 'system' as Theme, label: 'System', icon: Monitor },
                                        { id: 'dark' as Theme, label: 'Dark', icon: Moon },
                                        { id: 'light' as Theme, label: 'Light', icon: Sun },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTheme(t.id)}
                                            className={cn(
                                                'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all',
                                                theme === t.id
                                                    ? 'bg-bastion-accent/10 border-bastion-accent text-bastion-accent'
                                                    : 'bg-bastion-bg border-bastion-border text-bastion-text-secondary hover:border-bastion-accent/50'
                                            )}
                                        >
                                            <t.icon className="w-4 h-4" />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'security' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            <h2 className="heading-2 mb-6">Security</h2>

                            <div className="p-4 rounded-xl bg-bastion-bg border border-bastion-border">
                                <div className="flex items-center gap-3 mb-4">
                                    <Key className="w-5 h-5 text-bastion-accent" />
                                    <p className="font-medium">Master Password</p>
                                </div>
                                <p className="text-sm text-bastion-text-muted mb-4">
                                    Your master password is required to disable protection or change security settings.
                                </p>
                                <button className="btn-secondary">
                                    Change Master Password
                                </button>
                            </div>

                            <div className="p-4 rounded-xl bg-bastion-bg border border-bastion-border">
                                <div className="flex items-center gap-3 mb-4">
                                    <Shield className="w-5 h-5 text-bastion-success" />
                                    <p className="font-medium">Biometric Unlock</p>
                                </div>
                                <p className="text-sm text-bastion-text-muted mb-4">
                                    Use fingerprint or face recognition instead of password (where supported).
                                </p>
                                <button className="btn-secondary" disabled>
                                    Not Available on This Device
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'hardcore' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            <h2 className="heading-2 mb-6">Hardcore Mode</h2>

                            <div className="p-4 rounded-xl bg-bastion-warning/10 border border-bastion-warning/30 mb-6">
                                <div className="flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-bastion-warning flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-bastion-warning">Extreme Protection</p>
                                        <p className="text-sm text-bastion-text-muted mt-1">
                                            Hardcore mode makes Bastion impossible to disable until your session ends.
                                            The UI is locked, global shortcuts are disabled, and even uninstalling won't work.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-4 border-b border-bastion-border">
                                <div>
                                    <p className="font-medium">Emergency Override</p>
                                    <p className="text-sm text-bastion-text-muted">
                                        Hidden 30-second hold on power icon to force-unlock (requires reboot)
                                    </p>
                                </div>
                                <Toggle
                                    enabled={settings.emergencyOverride}
                                    onChange={(v) => updateSetting('emergencyOverride', v)}
                                />
                            </div>

                            <div className="py-4">
                                <label className="font-medium block mb-2">Emergency Delay (seconds)</label>
                                <input
                                    type="number"
                                    value={settings.emergencyDelay}
                                    onChange={(e) => updateSetting('emergencyDelay', Number(e.target.value))}
                                    min={10}
                                    max={120}
                                    className="input w-32"
                                />
                                <p className="text-sm text-bastion-text-muted mt-2">
                                    How long you must hold the power icon to trigger emergency unlock
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'advanced' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            <h2 className="heading-2 mb-6">Advanced</h2>

                            <div className="flex items-center justify-between py-4 border-b border-bastion-border">
                                <div>
                                    <p className="font-medium">Whitelist System Apps</p>
                                    <p className="text-sm text-bastion-text-muted">
                                        Never block essential system processes
                                    </p>
                                </div>
                                <Toggle
                                    enabled={settings.whitelistSystem}
                                    onChange={(v) => updateSetting('whitelistSystem', v)}
                                />
                            </div>

                            <div className="py-4 border-b border-bastion-border">
                                <label className="font-medium block mb-2">Hosts Backup Location</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={settings.backupPath}
                                        onChange={(e) => updateSetting('backupPath', e.target.value)}
                                        className="input flex-1"
                                    />
                                    <button className="btn-secondary">Browse</button>
                                </div>
                            </div>

                            <div className="py-4">
                                <button className="btn-secondary flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4" />
                                    Reset All Settings
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'about' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            <div className="text-center py-8">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-bastion-accent to-cyan-600 flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-10 h-10 text-bastion-bg" />
                                </div>
                                <h2 className="heading-1 mb-2">Bastion</h2>
                                <p className="text-bastion-text-muted">Version 0.1.0</p>
                            </div>

                            <div className="text-center text-bastion-text-secondary">
                                <p className="mb-4">
                                    The unbreakable focus tool for those who need it.
                                    <br />
                                    Open source. Privacy-first. Built with ❤️
                                </p>
                            </div>

                            <div className="flex justify-center gap-4">
                                <a
                                    href="https://github.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <Github className="w-4 h-4" />
                                    GitHub
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                                <button className="btn-secondary flex items-center gap-2">
                                    View Licenses
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Toggle component
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={cn(
                'w-12 h-7 rounded-full transition-all duration-200 relative',
                enabled ? 'bg-bastion-accent' : 'bg-bastion-border'
            )}
        >
            <motion.div
                layout
                className="w-5 h-5 rounded-full bg-white absolute top-1"
                animate={{ left: enabled ? 26 : 4 }}
            />
        </button>
    );
}
