import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings2 as SettingsIcon,
    Lock as LockIcon,
    Github as GithubIcon,
    Plus as PlusIcon,
    Trash2 as TrashIcon,
    AlertTriangle as AlertIcon,
    LogOut as LogoutIcon,
    FileText as LicenseIcon,
    Database as DatabaseIcon,
    Clock as ClockIcon
} from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { settingsApi, sessionsApi } from '../lib/api';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import logo from '../assets/bastion_logo.png';
import CustomDialog from '../components/CustomDialog';
import PasswordModal from '../components/PasswordModal';

type Tab = 'general' | 'hardcore' | 'schedules' | 'advanced' | 'about';

const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'hardcore', label: 'Hardcore', icon: LockIcon },
    { id: 'schedules', label: 'Schedules', icon: ClockIcon },
    { id: 'advanced', label: 'Advanced', icon: DatabaseIcon },
    { id: 'about', label: 'About', icon: LicenseIcon },
] as const;

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
        onClick={onChange}
        className={`w-12 h-7 rounded-full transition-all duration-300 relative ${enabled
            ? 'bg-black dark:bg-white'
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

export default function Settings() {
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [startOnBoot, setStartOnBoot] = useState(false);
    const [minimizeToTray, setMinimizeToTray] = useState(true);
    const [showNotifications, setShowNotifications] = useState(true);
    const [hardcoreEnabled, setHardcoreEnabled] = useState(false);
    const [emergencyOverride, setEmergencyOverride] = useState(false);

    // Dialog States
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showResetSuccess, setShowResetSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Custom Warning Text
    const [customWarningText, setCustomWarningText] = useState('');

    // Schedules State
    const [schedules, setSchedules] = useState<any[]>([]);

    useEffect(() => {
        // Load settings
        const loadSettings = async () => {
            try {
                const [boot, tray, notify, autostart, warningText] = await Promise.all([
                    settingsApi.get('start_on_boot'),
                    settingsApi.get('minimize_to_tray'),
                    settingsApi.get('show_notifications'),
                    isEnabled(),
                    settingsApi.get('custom_warning_text')
                ]);

                if (boot !== null) setStartOnBoot(boot === 'true');
                else setStartOnBoot(autostart);

                if (tray !== null) setMinimizeToTray(tray === 'true');
                if (notify !== null) setShowNotifications(notify === 'true');
                if (warningText !== null) setCustomWarningText(warningText);
                const masterPasswordHash = await settingsApi.get('master_password_hash');
                setEmergencyOverride(!!masterPasswordHash && masterPasswordHash.length > 0);
            } catch (err) {
                console.error('Failed to load settings:', err);
            }
        };

        const loadSchedules = async () => {
            try {
                const data = await sessionsApi.getAll();
                setSchedules(data);
            } catch (err) {
                console.error('Failed to load schedules:', err);
            }
        };

        loadSettings();
        loadSchedules();
    }, []);

    const toggleStartOnBoot = async () => {
        const newValue = !startOnBoot;
        setStartOnBoot(newValue);
        try {
            await settingsApi.set('start_on_boot', String(newValue));
            if (newValue) await enable();
            else await disable();
        } catch (err) {
            console.error('Failed to update start on boot:', err);
        }
    };

    const toggleMinimizeToTray = async () => {
        const newValue = !minimizeToTray;
        setMinimizeToTray(newValue);
        try {
            await settingsApi.set('minimize_to_tray', String(newValue));
        } catch (err) {
            console.error('Failed to update minimize to tray:', err);
        }
    };

    const toggleNotifications = async () => {
        const newValue = !showNotifications;
        setShowNotifications(newValue);
        try {
            await settingsApi.set('show_notifications', String(newValue));
        } catch (err) {
            console.error('Failed to update notifications:', err);
        }
    };

    const updateWarningText = async (text: string) => {
        setCustomWarningText(text);
        try {
            await settingsApi.set('custom_warning_text', text);
        } catch (err) {
            console.error('Failed to update warning text:', err);
        }
    };

    // Password Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordModalType, setPasswordModalType] = useState<'set' | 'verify'>('verify');

    const handleEmergencyToggle = () => {
        if (emergencyOverride) {
            // Disable it (verify first)
            setPasswordModalType('verify');
            setShowPasswordModal(true);
        } else {
            // Enable it (set password)
            setPasswordModalType('set');
            setShowPasswordModal(true);
        }
    };

    const onPasswordSubmit = async (password: string) => {
        if (passwordModalType === 'set') {
            await settingsApi.setMasterPassword(password);
            setEmergencyOverride(true);
        } else {
            const isValid = await settingsApi.verifyMasterPassword(password);
            if (!isValid) throw new Error('Incorrect password');
            // To disable, we clear the password hash (or just consider it disabled if we had a flag, but clearing hash is safer)
            // Ideally we'd have a removeSetting, but setting it to empty string works if we check for Some() and non-empty in backend.
            // Actually, let's just use empty string for now as "disabled".
            // Backend `verify_master_password` handles Option, so if we can delete it that's best.
            // Our set_setting overwrites. So we can overwrite with empty string?
            // Let's assume empty string means disabled for now, or add a delete_setting command?
            // Simpler: Just set it to empty string.
            await settingsApi.set('master_password_hash', '');
            setEmergencyOverride(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 px-8 pt-8 pb-6 bg-black z-20 border-b border-white/5">
                <div className="flex items-center justify-between">
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

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-8 px-8 py-8 items-start">
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

                {/* Content Area - Scrollable */}
                <div className="flex-1 h-full overflow-y-auto no-scrollbar glass-panel p-8 border border-black/5 dark:border-white/5">
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
                                        <Toggle enabled={startOnBoot} onChange={toggleStartOnBoot} />
                                    </SettingRow>

                                    <SettingRow label="Minimize to Tray" description="Keep Bastion running in the background when closed">
                                        <Toggle enabled={minimizeToTray} onChange={toggleMinimizeToTray} />
                                    </SettingRow>

                                    <SettingRow label="Notifications" description="Receive alerts for session start/stop and blocks">
                                        <Toggle enabled={showNotifications} onChange={toggleNotifications} />
                                    </SettingRow>

                                    <div className="h-px bg-black/10 dark:bg-white/10 my-4" />

                                    {/* Custom Warning Text */}
                                    <div className="p-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                        <div className="mb-3">
                                            <p className="font-bold text-black dark:text-white">Custom Warning Message</p>
                                            <p className="text-sm text-gray-500 dark:text-bastion-muted mt-0.5">Shown when you try to access blocked content</p>
                                        </div>
                                        <textarea
                                            value={customWarningText}
                                            onChange={(e) => updateWarningText(e.target.value)}
                                            placeholder="e.g., Is this really worth breaking your focus?"
                                            className="glass-input w-full min-h-[80px] resize-none"
                                            maxLength={200}
                                        />
                                        <p className="text-xs text-gray-400 dark:text-bastion-muted mt-2 text-right">{customWarningText.length}/200</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'schedules' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-black text-black dark:text-white">Active Schedules</h2>
                                        <button
                                            onClick={async () => {
                                                const newSchedule = {
                                                    name: 'Focus Block',
                                                    start_time: '09:00',
                                                    end_time: '17:00',
                                                    days: JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
                                                    hardcore: true,
                                                    enabled: true
                                                };
                                                await sessionsApi.add(newSchedule);
                                                const data = await sessionsApi.getAll();
                                                setSchedules(data);
                                            }}
                                            className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            <PlusIcon className="w-3.5 h-3.5" />
                                            Add Work Hours
                                        </button>
                                    </div>

                                    {schedules.length === 0 ? (
                                        <div className="text-center py-12 bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                                            <ClockIcon className="w-12 h-12 text-gray-400 dark:text-bastion-muted mx-auto mb-4 opacity-50" />
                                            <p className="text-gray-500 dark:text-bastion-muted font-bold">No active schedules. Set work hours to automate blocking.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {schedules.map((schedule) => (
                                                <div key={schedule.id} className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-between group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center">
                                                            <ClockIcon className="w-5 h-5 text-black dark:text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-black dark:text-white uppercase tracking-tight">{schedule.name}</p>
                                                            <p className="text-sm text-gray-500 dark:text-bastion-muted">
                                                                {schedule.start_time} - {schedule.end_time} • {JSON.parse(schedule.days).join(', ')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {schedule.hardcore && (
                                                            <span className="px-2 py-0.5 rounded bg-red-600/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-600/20">Hardcore</span>
                                                        )}
                                                        <button
                                                            onClick={async () => {
                                                                await sessionsApi.delete(schedule.id);
                                                                const data = await sessionsApi.getAll();
                                                                setSchedules(data);
                                                            }}
                                                            className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 mt-8">
                                        <div className="flex items-start gap-3">
                                            <AlertIcon className="w-5 h-5 text-zinc-500 mt-0.5" />
                                            <p className="text-xs text-zinc-500 leading-relaxed font-bold uppercase tracking-tight">
                                                Scheduled sessions start automatically in the background. If "Ghost Mode" is active, Bastion will block distractions silently even if the window is closed.
                                            </p>
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

                                        <div className="flex gap-4 relative z-10">
                                            <div className="p-3 bg-black/10 dark:bg-white/10 rounded-xl h-fit">
                                                <AlertIcon className="w-8 h-8 text-black dark:text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-black dark:text-white mb-2">Unbreakable Commitment</h3>
                                                <p className="text-gray-500 dark:text-bastion-muted max-w-xl">
                                                    Hardcore mode removes the ability to exit the session or modify blocklists until the timer expires.
                                                    This includes preventing application exit during active sessions.
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <SettingRow label="Enable by Default" description="New sessions will start in Hardcore Mode automatically">
                                        <Toggle enabled={hardcoreEnabled} onChange={() => setHardcoreEnabled(!hardcoreEnabled)} />
                                    </SettingRow>

                                    <SettingRow label="Emergency Override" description="Allow bypassing Hardcore Mode by entering a Master Password.">
                                        <Toggle enabled={emergencyOverride} onChange={handleEmergencyToggle} />
                                    </SettingRow>
                                </div>
                            )}

                            {activeTab === 'advanced' && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-black text-black dark:text-white mb-6">Advanced Actions</h2>

                                    <SettingRow label="Factory Reset" description="Clear all data and return to initial state" danger>
                                        <button
                                            onClick={() => setShowResetConfirm(true)}
                                            className="px-4 py-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-500 text-sm font-medium border border-red-600/20 flex items-center gap-2 transition-colors"
                                        >
                                            <LogoutIcon className="w-4 h-4" />
                                            Reset Bastion
                                        </button>
                                    </SettingRow>

                                    {/* Dialogs */}
                                    <CustomDialog
                                        isOpen={showResetConfirm}
                                        onClose={() => setShowResetConfirm(false)}
                                        onConfirm={async () => {
                                            try {
                                                await settingsApi.factoryReset();
                                                setShowResetSuccess(true);
                                            } catch (err) {
                                                setErrorMessage(String(err));
                                            }
                                        }}
                                        title="Factory Reset"
                                        message="Are you sure you want to reset Bastion? This will delete all blocked sites, apps, sessions, and settings from Bastion only. This action cannot be undone."
                                        confirmLabel="Reset Everything"
                                        type="danger"
                                    />

                                    <CustomDialog
                                        isOpen={showResetSuccess}
                                        onClose={() => window.location.reload()}
                                        onConfirm={() => window.location.reload()}
                                        title="Reset Complete"
                                        message="Bastion has been factory reset. The application will now reload to apply changes."
                                        confirmLabel="Reload Now"
                                        isAlert
                                        type="success"
                                    />

                                    <CustomDialog
                                        isOpen={!!errorMessage}
                                        onClose={() => setErrorMessage('')}
                                        title="Reset Failed"
                                        message={`Failed to reset: ${errorMessage}`}
                                        confirmLabel="Close"
                                        isAlert
                                        type="warning"
                                    />
                                </div>
                            )}

                            {activeTab === 'about' && (
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6 overflow-hidden">
                                        <img src={logo} alt="Bastion Logo" className="w-20 h-20 object-contain" />
                                    </div>
                                    <h3 className="text-4xl font-black text-black dark:text-white mb-2 tracking-tight">Bastion</h3>
                                    <p className="text-black/60 dark:text-white/60 font-mono text-sm mb-6 uppercase tracking-wider">v0.1.0 alpha</p>

                                    <p className="text-gray-500 dark:text-bastion-muted max-w-md mx-auto mb-8 leading-relaxed font-medium">
                                        Unbreakable focus tool for deep work. Reclaim your attention.
                                    </p>

                                    <div className="flex justify-center gap-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <button
                                                onClick={() => openUrl('https://github.com/shubham-pathak1/bastion')}
                                                className="p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white transition-colors border border-black/5 dark:border-white/5"
                                                title="View GitHub Repository"
                                            >
                                                <GithubIcon className="w-6 h-6" />
                                            </button>
                                            <span className="text-[10px] font-mono font-bold text-black/40 dark:text-white/40 tracking-widest uppercase">Github</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <button
                                                onClick={() => openUrl('https://github.com/shubham-pathak1/bastion/blob/main/LICENSE')}
                                                className="p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white transition-colors border border-black/5 dark:border-white/5"
                                                title="License Information"
                                            >
                                                <LicenseIcon className="w-6 h-6" />
                                            </button>
                                            <span className="text-[10px] font-mono font-bold text-black/40 dark:text-white/40 tracking-widest uppercase">License</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
            <AnimatePresence>
                {showPasswordModal && (
                    <PasswordModal
                        isOpen={showPasswordModal}
                        onClose={() => setShowPasswordModal(false)}
                        onConfirm={onPasswordSubmit}
                        title={passwordModalType === 'set' ? "Set Master Password" : "Disable Override"}
                        message={passwordModalType === 'set'
                            ? "This password will be required to stop a Hardcore Mode session. Don't lose it!"
                            : "Enter your Master Password to disable the Emergency Override feature."
                        }
                        confirmLabel={passwordModalType === 'set' ? "Enable Override" : "Disable Override"}
                        type={passwordModalType}
                    />
                )}
            </AnimatePresence>
        </div >
    );
}
