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
        color: 'text-bastion-accent'
    },
    {
        name: 'Deep Focus',
        startTime: '06:00',
        endTime: '12:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        hardcore: true,
        icon: Zap,
        color: 'text-purple-400'
    },
    {
        name: 'Evening Chill',
        startTime: '18:00',
        endTime: '22:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        hardcore: false,
        icon: Sparkles,
        color: 'text-pink-400'
    },
];

export default function Sessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        startTime: '09:00',
        endTime: '17:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        hardcore: false,
    });

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
        <div className="max-w-5xl mx-auto min-h-screen pb-20">
            {/* Header */}
            <div className={`sticky top-0 z-30 transition-all duration-200 ${scrolled ? 'py-4 bg-black/50 backdrop-blur-xl border-b border-white/5' : 'py-8'}`}>
                <div className="flex items-center justify-between px-2">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="heading-hero"
                        >
                            Protocols
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-bastion-muted mt-2"
                        >
                            Automated defense schedules
                        </motion.p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={openNewSession}
                        className="btn-primary flex items-center gap-2 pl-4 pr-6"
                    >
                        <Plus className="w-5 h-5" />
                        New Protocol
                    </motion.button>
                </div>
            </div>

            {/* Content */}
            <div className="mx-2 space-y-8">
                {/* Templates */}
                <div>
                    <h2 className="text-sm font-semibold text-bastion-muted uppercase tracking-wider mb-4 px-1">Quick Templates</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {presetTemplates.map((template, i) => (
                            <motion.button
                                key={template.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => applyTemplate(template)}
                                className="glass-panel p-6 text-left group border border-white/5 hover:border-white/10 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className={`p-3 rounded-xl bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors`}>
                                        <template.icon className={`w-6 h-6 ${template.color}`} />
                                    </div>
                                    <div className="px-2 py-1 rounded-md bg-black/40 text-xs font-mono text-bastion-muted border border-white/5">
                                        {template.startTime}
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <h3 className="font-bold text-white mb-1">{template.name}</h3>
                                    <p className="text-xs text-bastion-muted">
                                        {template.days.length} days • {template.hardcore ? 'Hardcore' : 'Standard'}
                                    </p>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Active Sessions */}
                <div>
                    <h2 className="text-sm font-semibold text-bastion-muted uppercase tracking-wider mb-4 px-1">Active Protocols</h2>

                    {isLoading ? (
                        <div className="h-40 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-bastion-accent" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-panel p-12 text-center border-dashed border-white/10"
                        >
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-bastion-muted opacity-30" />
                            <h3 className="text-lg font-medium text-white mb-1">No Active Protocols</h3>
                            <p className="text-bastion-muted max-w-sm mx-auto">
                                Configure automated sessions to protect your focus hours automatically.
                            </p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {sessions.map((session, i) => {
                                const activeDays = parseDays(session.days);
                                return (
                                    <motion.div
                                        key={session.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="glass-panel p-6 flex items-center justify-between group border border-white/5 hover:border-bastion-accent/20 active:border-bastion-accent/40"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 ${session.hardcore
                                                ? 'bg-bastion-danger/10 text-bastion-danger shadow-[0_0_20px_rgba(255,0,51,0.1)]'
                                                : 'bg-bastion-accent/10 text-bastion-accent shadow-[0_0_20px_rgba(0,240,255,0.1)]'
                                                }`}>
                                                {session.hardcore ? (
                                                    <Shield className="w-7 h-7" />
                                                ) : (
                                                    <Repeat className="w-7 h-7" />
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-lg text-white">{session.name}</h3>
                                                    {session.hardcore && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-bastion-danger/20 text-bastion-danger border border-bastion-danger/20 flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Hardcore
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-bastion-muted">
                                                    <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-white/80">
                                                        {session.start_time} - {session.end_time}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        {days.map((day) => (
                                                            <span
                                                                key={day}
                                                                className={`w-5 h-5 text-[10px] flex items-center justify-center rounded ${activeDays.includes(day)
                                                                        ? 'bg-bastion-secondary text-black font-bold'
                                                                        : 'text-white/20'
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
                                            className="p-3 rounded-xl hover:bg-bastion-danger/10 text-bastion-muted hover:text-bastion-danger transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
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

            {/* Create/Edit Modal */}
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
                            className="glass-panel w-full max-w-lg rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-32 bg-bastion-accent/10 blur-[80px] rounded-full pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="heading-title">
                                        {editingSession ? 'Edit Protocol' : 'New Protocol'}
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-bastion-muted hover:text-white" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-sm font-medium text-bastion-secondary mb-2 block">Protocol Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Deep Work Morning"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="glass-input text-lg"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-bastion-secondary mb-2 block">Start Time</label>
                                            <input
                                                type="time"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                                className="glass-input text-center font-mono cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-bastion-secondary mb-2 block">End Time</label>
                                            <input
                                                type="time"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                                className="glass-input text-center font-mono cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-bastion-secondary mb-3 block">Active Days</label>
                                        <div className="flex gap-2">
                                            {days.map((day) => (
                                                <button
                                                    key={day}
                                                    onClick={() => toggleDay(day)}
                                                    className={`flex-1 h-12 rounded-xl text-sm font-bold transition-all relative overflow-hidden ${formData.days.includes(day)
                                                            ? 'bg-bastion-accent text-black shadow-glow-sm'
                                                            : 'bg-white/5 text-bastion-muted hover:bg-white/10 hover:text-white'
                                                        }`}
                                                >
                                                    {day.charAt(0)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${formData.hardcore ? 'bg-bastion-danger/20 text-bastion-danger' : 'bg-white/10 text-bastion-muted'}`}>
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className={`font-bold ${formData.hardcore ? 'text-white' : 'text-bastion-secondary'}`}>Hardcore Mode</p>
                                                <p className="text-xs text-bastion-muted">Cannot be stopped once active</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setFormData(prev => ({ ...prev, hardcore: !prev.hardcore }))}
                                            className={`w-14 h-8 rounded-full transition-all relative ${formData.hardcore ? 'bg-bastion-danger shadow-[0_0_15px_rgba(255,0,51,0.4)]' : 'bg-white/10'}`}
                                        >
                                            <motion.div
                                                layout
                                                className="w-6 h-6 bg-white rounded-full absolute top-1"
                                                animate={{ left: formData.hardcore ? 28 : 4 }}
                                            />
                                        </button>
                                    </div>

                                    <div className="pt-4 flex justify-end gap-3">
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="px-6 py-3 rounded-xl hover:bg-white/5 text-bastion-muted hover:text-white transition-colors font-medium"
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
                                                'Activate Protocol'
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
