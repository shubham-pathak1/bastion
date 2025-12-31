import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Clock,
    Shield,
    Trash2,
    X,
    Loader2,
    Calendar,
    AlertTriangle,
    Zap,
    Repeat,
    Sparkles
} from 'lucide-react';
import { sessionsApi, Session } from '../lib/api';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const presetTemplates = [
    {
        name: 'Work Hours',
        startTime: '09:00',
        endTime: '17:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        hardcore: false,
        icon: Clock,
        color: 'text-black dark:text-white'
    },
    {
        name: 'Deep Focus',
        startTime: '06:00',
        endTime: '12:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        hardcore: true,
        icon: Zap,
        color: 'text-black dark:text-white'
    },
    {
        name: 'Evening Chill',
        startTime: '18:00',
        endTime: '22:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        hardcore: false,
        icon: Sparkles,
        color: 'text-black dark:text-white'
    },
];

export default function Sessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        startTime: '09:00',
        endTime: '17:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        hardcore: false,
    });

    const loadSessions = async () => {
        setIsLoading(true);
        try {
            const data = await sessionsApi.getAll();
            setSessions(data);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const openNewSession = () => {
        setEditingSession(null);
        setFormData({
            name: '',
            startTime: '09:00',
            endTime: '17:00',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            hardcore: false,
        });
        setShowModal(true);
    };

    const applyTemplate = (template: typeof presetTemplates[0]) => {
        setFormData({
            name: template.name,
            startTime: template.startTime,
            endTime: template.endTime,
            days: template.days,
            hardcore: template.hardcore,
        });
        setShowModal(true);
    };

    const toggleDay = (day: string) => {
        setFormData(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day],
        }));
    };

    const saveSession = async () => {
        if (!formData.name.trim() || formData.days.length === 0) return;
        setIsSaving(true);

        try {
            await sessionsApi.add({
                name: formData.name,
                start_time: formData.startTime,
                end_time: formData.endTime,
                days: JSON.stringify(formData.days),
                hardcore: formData.hardcore,
                enabled: true,
            });

            setShowModal(false);
            await loadSessions();
        } catch (err) {
            console.error('Failed to save session:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteSession = async (id: number) => {
        try {
            await sessionsApi.delete(id);
            await loadSessions();
        } catch (err) {
            console.error('Failed to delete session:', err);
        }
    };

    const parseDays = (daysJson: string): string[] => {
        try {
            return JSON.parse(daysJson);
        } catch {
            return [];
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
                            Schedules
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-500 dark:text-bastion-muted mt-2 font-bold"
                        >
                            Configure automatic focus periods.
                        </motion.p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={openNewSession}
                        className="btn-primary flex items-center gap-2 pl-4 pr-6"
                    >
                        <Plus className="w-5 h-5" />
                        New Schedule
                    </motion.button>
                </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-8 pt-8 pb-32">
                <div className="max-w-5xl mx-auto space-y-8 pb-32">
                    {/* Templates */}
                    <div>
                        <h2 className="text-xs font-black text-gray-400 dark:text-bastion-muted uppercase tracking-widest mb-4 px-1">Quick Templates</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
                            {presetTemplates.map((template, i) => (
                                <motion.button
                                    key={template.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => applyTemplate(template)}
                                    className="glass-panel p-6 text-left group border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-black/5 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="flex items-start justify-between mb-4 relative z-10">
                                        <div className={`p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 group-hover:border-black/10 dark:group-hover:border-white/10 transition-colors`}>
                                            <template.icon className={`w-6 h-6 ${template.color}`} />
                                        </div>
                                        <div className="px-2 py-1 rounded-md bg-black dark:bg-black/40 text-[10px] font-black uppercase tracking-widest text-white dark:text-bastion-muted border border-black/5 dark:border-white/5">
                                            {template.startTime}
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="font-black text-black dark:text-white mb-1 uppercase tracking-tight">{template.name}</h3>
                                        <p className="text-xs text-gray-400 dark:text-bastion-muted font-bold">
                                            {template.days.length} days • {template.hardcore ? 'Hardcore' : 'Standard'}
                                        </p>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Active Sessions */}
                    <div>
                        <h2 className="text-xs font-black text-gray-400 dark:text-bastion-muted uppercase tracking-widest mb-4 px-1">Active Schedules</h2>
                        {isLoading ? (
                            <div className="h-40 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="glass-panel p-12 text-center border-dashed border-black/10 dark:border-white/10 mx-2"
                            >
                                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-bastion-muted opacity-30" />
                                <h3 className="text-lg font-black text-black dark:text-white mb-1 uppercase tracking-tight">No Active Schedules</h3>
                                <p className="text-gray-500 dark:text-bastion-muted max-w-sm mx-auto font-bold">
                                    Configure automated sessions to protect your focus hours automatically.
                                </p>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 px-2">
                                {sessions.map((session, i) => {
                                    const activeDays = parseDays(session.days);
                                    return (
                                        <motion.div
                                            key={session.id}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="glass-panel p-6 flex items-center justify-between group border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-bastion-accent/20 active:border-black/20 dark:active:border-bastion-accent/40"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-black/5 dark:border-white/5 ${session.hardcore
                                                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                                                    : 'bg-black/5 dark:bg-white/10 text-black dark:text-white shadow-none'
                                                    }`}>
                                                    {session.hardcore ? (
                                                        <Shield className="w-7 h-7" />
                                                    ) : (
                                                        <Repeat className="w-7 h-7" />
                                                    )}
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="font-black text-lg text-black dark:text-white uppercase tracking-tight">{session.name}</h3>
                                                        {session.hardcore && (
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white flex items-center gap-1">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                Hardcore
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-bastion-muted font-bold">
                                                        <span className="font-black bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded text-black/80 dark:text-white/80">
                                                            {session.start_time} - {session.end_time}
                                                        </span>
                                                        <div className="flex gap-1">
                                                            {days.map((day) => (
                                                                <span
                                                                    key={day}
                                                                    className={`w-5 h-5 text-[10px] flex items-center justify-center rounded font-black uppercase transition-all ${activeDays.includes(day)
                                                                        ? 'bg-black dark:bg-white text-white dark:text-black'
                                                                        : 'text-gray-300 dark:text-white/10'
                                                                        }`}
                                                                >
                                                                    {day.charAt(0)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => deleteSession(session.id)}
                                                className="p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 dark:text-bastion-muted hover:text-black dark:hover:text-white transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-panel w-full max-w-lg rounded-3xl p-8 border border-black/5 dark:border-white/10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-32 bg-black/5 dark:bg-white/5 blur-[80px] rounded-full pointer-events-none" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="heading-title text-black dark:text-white">
                                        {editingSession ? 'Edit Schedule' : 'New Schedule'}
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-400 dark:text-bastion-muted hover:text-black dark:hover:text-white" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-black text-gray-400 dark:text-bastion-secondary mb-2 block uppercase tracking-widest">Schedule Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Deep Work Morning"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="glass-input text-lg font-black"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-black text-gray-400 dark:text-bastion-secondary mb-2 block uppercase tracking-widest">Start Time</label>
                                            <input
                                                type="time"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                                className="glass-input text-center font-black cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-gray-400 dark:text-bastion-secondary mb-2 block uppercase tracking-widest">End Time</label>
                                            <input
                                                type="time"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                                className="glass-input text-center font-black cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-black text-gray-400 dark:text-bastion-secondary mb-3 block uppercase tracking-widest">Active Days</label>
                                        <div className="flex gap-2">
                                            {days.map((day) => (
                                                <button
                                                    key={day}
                                                    onClick={() => toggleDay(day)}
                                                    className={`flex-1 h-12 rounded-xl text-xs font-black transition-all relative overflow-hidden uppercase tracking-widest ${formData.days.includes(day)
                                                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                                                        : 'bg-black/5 dark:bg-white/5 text-gray-500 dark:text-bastion-muted hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white'
                                                        }`}
                                                >
                                                    {day.charAt(0)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${formData.hardcore ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-black/5 dark:bg-white/10 text-gray-400 dark:text-bastion-muted'}`}>
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className={`font-black uppercase tracking-widest text-xs ${formData.hardcore ? 'text-black dark:text-white' : 'text-gray-400 dark:text-bastion-secondary'}`}>Hardcore Mode</p>
                                                <p className="text-[10px] text-gray-400 dark:text-bastion-muted font-bold uppercase tracking-tight">Cannot be stopped once active</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setFormData(prev => ({ ...prev, hardcore: !prev.hardcore }))}
                                            className={`w-14 h-8 rounded-full transition-all relative ${formData.hardcore ? 'bg-black dark:bg-white shadow-lg' : 'bg-black/10 dark:bg-white/10'}`}
                                        >
                                            <motion.div
                                                layout
                                                className="w-6 h-6 bg-white dark:bg-black rounded-full absolute top-1"
                                                animate={{ left: formData.hardcore ? 28 : 4 }}
                                            />
                                        </button>
                                    </div>

                                    <div className="pt-4 flex justify-end gap-3">
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="px-6 py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-bastion-muted hover:text-black dark:hover:text-white transition-colors font-black uppercase tracking-widest text-xs"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={saveSession}
                                            disabled={isSaving || !formData.name.trim() || formData.days.length === 0}
                                            className="btn-primary px-8 flex items-center gap-2"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                'Save Schedule'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
