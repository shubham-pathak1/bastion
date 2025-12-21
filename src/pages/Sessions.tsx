import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Shield, Trash2, X, Loader2, Calendar, AlertTriangle } from 'lucide-react';
import { sessionsApi, Session } from '../lib/api';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const presetTemplates = [
    {
        name: 'Work Hours',
        startTime: '09:00',
        endTime: '17:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        hardcore: false,
    },
    {
        name: 'Deep Work Morning',
        startTime: '06:00',
        endTime: '12:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        hardcore: true,
    },
    {
        name: 'Evening Focus',
        startTime: '18:00',
        endTime: '22:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        hardcore: false,
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
        <div className="max-w-4xl mx-auto animate-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="heading-1 mb-2">Sessions</h1>
                    <p className="text-bastion-text-secondary">
                        Schedule recurring focus sessions
                    </p>
                </div>
                <button onClick={openNewSession} className="btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    New Session
                </button>
            </div>

            {/* Quick Templates */}
            <div className="mb-8">
                <h2 className="heading-3 mb-4">Quick Templates</h2>
                <div className="grid grid-cols-3 gap-4">
                    {presetTemplates.map((template) => (
                        <motion.button
                            key={template.name}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => applyTemplate(template)}
                            className="card-interactive text-left"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${template.hardcore
                                    ? 'bg-bastion-warning-muted'
                                    : 'bg-bastion-accent-muted'
                                    }`}>
                                    {template.hardcore ? (
                                        <Shield className="w-5 h-5 text-bastion-warning" />
                                    ) : (
                                        <Clock className="w-5 h-5 text-bastion-accent" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{template.name}</h3>
                                    <p className="text-xs text-bastion-text-muted">
                                        {template.startTime} - {template.endTime}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {days.map((day) => (
                                    <span
                                        key={day}
                                        className={`w-8 h-6 text-xs rounded flex items-center justify-center ${template.days.includes(day)
                                            ? 'bg-bastion-accent-muted text-bastion-accent'
                                            : 'bg-bastion-surface-active text-bastion-text-muted'
                                            }`}
                                    >
                                        {day.charAt(0)}
                                    </span>
                                ))}
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Existing Sessions */}
            <div>
                <h2 className="heading-3 mb-4">Your Sessions</h2>
                {isLoading ? (
                    <div className="card py-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-bastion-accent" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="card py-12 text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-bastion-text-muted opacity-30" />
                        <p className="text-bastion-text-muted">No sessions scheduled</p>
                        <p className="text-sm text-bastion-text-muted mt-1">
                            Create a session to automatically block distractions
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map((session) => (
                            <motion.div
                                key={session.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="card flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${session.hardcore
                                        ? 'bg-bastion-warning-muted'
                                        : 'bg-bastion-accent-muted'
                                        }`}>
                                        {session.hardcore ? (
                                            <Shield className="w-6 h-6 text-bastion-warning" />
                                        ) : (
                                            <Clock className="w-6 h-6 text-bastion-accent" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-white">{session.name}</h3>
                                            {session.hardcore && (
                                                <span className="badge-warning">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Hardcore
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-bastion-text-muted">
                                            {session.start_time} - {session.end_time}
                                        </p>
                                        <div className="flex gap-1 mt-2">
                                            {days.map((day) => (
                                                <span
                                                    key={day}
                                                    className={`w-6 h-5 text-xs rounded flex items-center justify-center ${parseDays(session.days).includes(day)
                                                        ? 'bg-bastion-accent text-black'
                                                        : 'bg-bastion-surface-active text-bastion-text-muted'
                                                        }`}
                                                >
                                                    {day.charAt(0)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => deleteSession(session.id)}
                                        className="p-2 hover:bg-bastion-danger-muted rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 text-bastion-danger" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-bastion-surface border border-bastion-border rounded-2xl p-6 w-full max-w-md"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="heading-2">
                                    {editingSession ? 'Edit Session' : 'New Session'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-bastion-surface-hover rounded-xl"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="label mb-2 block">Session Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Morning Focus"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="input"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label mb-2 block">Start Time</label>
                                        <input
                                            type="time"
                                            value={formData.startTime}
                                            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label mb-2 block">End Time</label>
                                        <input
                                            type="time"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                            className="input"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="label mb-2 block">Days</label>
                                    <div className="flex gap-2">
                                        {days.map((day) => (
                                            <button
                                                key={day}
                                                onClick={() => toggleDay(day)}
                                                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${formData.days.includes(day)
                                                    ? 'bg-bastion-accent text-black'
                                                    : 'bg-bastion-surface-active text-bastion-text-muted hover:bg-bastion-surface-hover'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between py-4 border-t border-bastion-border">
                                    <div>
                                        <p className="font-medium text-white">Hardcore Mode</p>
                                        <p className="text-sm text-bastion-text-muted">
                                            Cannot be disabled until session ends
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, hardcore: !prev.hardcore }))}
                                        className={`w-11 h-6 rounded-full transition-all duration-200 relative ${formData.hardcore ? 'bg-bastion-warning' : 'bg-bastion-surface-active'
                                            }`}
                                    >
                                        <motion.div
                                            layout
                                            className="w-5 h-5 rounded-full bg-white absolute top-0.5"
                                            animate={{ left: formData.hardcore ? 22 : 2 }}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setShowModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button
                                    onClick={saveSession}
                                    disabled={isSaving || !formData.name.trim() || formData.days.length === 0}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Create Session'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
