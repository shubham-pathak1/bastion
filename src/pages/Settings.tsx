import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Settings2,
    Shield,
    Moon,
    Sun,
    Monitor,
    Lock,
    RefreshCw,
    ExternalLink,
    Github,
    Heart,
    Zap,
    AlertTriangle,
    ChevronRight
} from 'lucide-react';
import { securityApi } from '../lib/api';

type Tab = 'general' | 'security' | 'hardcore' | 'advanced' | 'about';

const tabs = [
    { id: 'general', label: 'General', icon: Settings2 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'hardcore', label: 'Hardcore', icon: Lock },
    { id: 'advanced', label: 'Advanced', icon: Zap },
    { id: 'about', label: 'About', icon: Heart },
] as const;

export default function Settings() {
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
    const [startOnBoot, setStartOnBoot] = useState(true);
    const [minimizeToTray, setMinimizeToTray] = useState(true);
    const [showNotifications, setShowNotifications] = useState(true);
    const [hardcoreEnabled, setHardcoreEnabled] = useState(false);
    const [emergencyOverride, setEmergencyOverride] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

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
        } catch (err) {
            setPasswordError('Failed to update password');
        }
    };

    const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            className={`w-11 h-6 rounded-full transition-all duration-200 relative ${enabled ? 'bg-bastion-accent' : 'bg-bastion-surface-active'
                }`}
        >
            <motion.div
                layout
                className="w-5 h-5 rounded-full bg-white absolute top-0.5"
                animate={{ left: enabled ? 22 : 2 }}
            />
        </button>
    );

    const SettingRow = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
        <div className="flex items-center justify-between py-4 border-b border-bastion-border last:border-0">
            <div>
                <p className="font-medium text-white">{label}</p>
                {description && <p className="text-sm text-bastion-text-muted mt-0.5">{description}</p>}
            </div>
            {children}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto animate-in">
            <div className="mb-8">
                <h1 className="heading-1 mb-2">Settings</h1>
                <p className="text-bastion-text-secondary">
                    Configure Bastion to work the way you want
                </p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar */}
                <div className="w-48 flex-shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${activeTab === tab.id
                                    ? 'bg-bastion-accent text-black'
                                    : 'text-bastion-text-muted hover:bg-bastion-surface hover:text-white'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="font-medium text-sm">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 card">
                    {activeTab === 'general' && (
                        <div>
                            <h2 className="heading-3 mb-4">General Settings</h2>

                            <SettingRow label="Theme" description="Choose your preferred appearance">
                                <div className="flex gap-2 p-1 bg-bastion-bg-elevated rounded-xl">
                                    {[
                                        { id: 'dark', icon: Moon },
                                        { id: 'light', icon: Sun },
                                        { id: 'system', icon: Monitor },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTheme(t.id as typeof theme)}
                                            className={`p-2 rounded-lg transition-all ${theme === t.id
                                                ? 'bg-bastion-accent text-black'
                                                : 'text-bastion-text-muted hover:text-white'
                                                }`}
                                        >
                                            <t.icon className="w-4 h-4" />
                                        </button>
                                    ))}
                                </div>
                            </SettingRow>

                            <SettingRow label="Start on boot" description="Launch Bastion when you log in">
                                <Toggle enabled={startOnBoot} onChange={() => setStartOnBoot(!startOnBoot)} />
                            </SettingRow>

                            <SettingRow label="Minimize to tray" description="Keep running in the background">
                                <Toggle enabled={minimizeToTray} onChange={() => setMinimizeToTray(!minimizeToTray)} />
                            </SettingRow>

                            <SettingRow label="Show notifications" description="Get alerts for blocks and sessions">
                                <Toggle enabled={showNotifications} onChange={() => setShowNotifications(!showNotifications)} />
                            </SettingRow>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <h2 className="heading-3 mb-4">Security Settings</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="label mb-2 block">Current Password</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="input"
                                        placeholder="Enter current password"
                                    />
                                </div>

                                <div>
                                    <label className="label mb-2 block">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="input"
                                        placeholder="Enter new password"
                                    />
                                </div>

                                <div>
                                    <label className="label mb-2 block">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="input"
                                        placeholder="Confirm new password"
                                    />
                                </div>

                                {passwordError && (
                                    <p className="text-sm text-bastion-danger">{passwordError}</p>
                                )}
                                {passwordSuccess && (
                                    <p className="text-sm text-bastion-success">{passwordSuccess}</p>
                                )}

                                <button onClick={handlePasswordChange} className="btn-primary">
                                    Update Password
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'hardcore' && (
                        <div>
                            <h2 className="heading-3 mb-4">Hardcore Mode</h2>

                            <div className="p-4 rounded-xl bg-bastion-warning-muted border border-bastion-warning/20 mb-6">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-bastion-warning flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-bastion-warning">Be careful!</p>
                                        <p className="text-xs text-bastion-text-muted mt-1">
                                            Hardcore mode is designed to be truly unbreakable. You cannot bypass it until your session ends.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <SettingRow label="Enable by default" description="New sessions will use hardcore mode">
                                <Toggle enabled={hardcoreEnabled} onChange={() => setHardcoreEnabled(!hardcoreEnabled)} />
                            </SettingRow>

                            <SettingRow label="Emergency override" description="Allow bypass with password in emergencies">
                                <Toggle enabled={emergencyOverride} onChange={() => setEmergencyOverride(!emergencyOverride)} />
                            </SettingRow>
                        </div>
                    )}

                    {activeTab === 'advanced' && (
                        <div>
                            <h2 className="heading-3 mb-4">Advanced Settings</h2>

                            <SettingRow label="Clear all data" description="Reset Bastion to factory settings">
                                <button className="btn-danger text-sm px-4 py-2">
                                    Clear Data
                                </button>
                            </SettingRow>

                            <SettingRow label="Export settings" description="Download your configuration">
                                <button className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                                    <ExternalLink className="w-4 h-4" />
                                    Export
                                </button>
                            </SettingRow>

                            <SettingRow label="Import settings" description="Restore from a backup">
                                <button className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4" />
                                    Import
                                </button>
                            </SettingRow>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div>
                            <h2 className="heading-3 mb-4">About Bastion</h2>

                            <div className="text-center py-8">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-bastion-accent to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-glow">
                                    <Shield className="w-10 h-10 text-black" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Bastion</h3>
                                <p className="text-bastion-text-muted mt-1">Version 0.1.0</p>
                                <p className="text-sm text-bastion-text-muted mt-4 max-w-sm mx-auto">
                                    An unbreakable focus app for those who need it. Built with privacy and productivity in mind.
                                </p>
                            </div>

                            <div className="border-t border-bastion-border pt-6 space-y-3">
                                <a
                                    href="https://github.com/your-repo/bastion"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-bastion-surface-hover transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Github className="w-5 h-5 text-bastion-text-muted" />
                                        <span className="text-white">GitHub Repository</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-bastion-text-muted" />
                                </a>

                                <a
                                    href="#"
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-bastion-surface-hover transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Heart className="w-5 h-5 text-pink-400" />
                                        <span className="text-white">Support Development</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-bastion-text-muted" />
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
