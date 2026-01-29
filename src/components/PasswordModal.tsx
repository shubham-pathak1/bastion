import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Eye, EyeOff, Loader2 } from 'lucide-react';

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => Promise<void>;
    title: string;
    message: string;
    confirmLabel?: string;
    type?: 'set' | 'verify'; // 'set' shows confirm password field
}

export default function PasswordModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    type = 'verify'
}: PasswordModalProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setConfirmPassword('');
            setError('');
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!password) {
            setError('Password is required');
            return;
        }

        if (type === 'set' && password.length < 4) {
            setError('Password must be at least 4 characters');
            return;
        }

        if (type === 'set' && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await onConfirm(password);
            onClose();
        } catch (err) {
            setError(String(err));
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                >
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md glass-panel p-8 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-white">{title}</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5 text-zinc-500 hover:text-white" />
                            </button>
                        </div>

                        <p className="text-zinc-500 font-bold text-sm mb-6 leading-relaxed">
                            {message}
                        </p>

                        <div className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={type === 'set' ? "Enter new master password" : "Enter master password"}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white font-bold placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-mono"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && (type === 'verify' ? handleSubmit() : null)}
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {type === 'set' && (
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm master password"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white font-bold placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-mono"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                    />
                                </div>
                            )}

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="text-red-400 text-xs font-bold uppercase tracking-widest pl-2"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all mt-4 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
