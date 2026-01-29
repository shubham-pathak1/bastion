import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, ShieldCheck } from 'lucide-react';

interface CustomDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'warning' | 'info' | 'success' | 'danger';
    isAlert?: boolean;
}

export default function CustomDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    type = 'info',
    isAlert = false
}: CustomDialogProps) {
    if (!isOpen) return null;

    const iconMap = {
        warning: <AlertTriangle className="w-8 h-8 text-white" />,
        info: <Info className="w-8 h-8 text-white" />,
        success: <ShieldCheck className="w-8 h-8 text-white" />,
        danger: <AlertTriangle className="w-8 h-8 text-white" />, // Keeping monochrome, so no distinct red here unless needed
    };

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        onClose();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isOpen && e.key === 'Enter') {
                handleConfirm();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onConfirm, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="relative w-full max-w-[320px] glass-panel p-8 border border-white/10 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] text-center overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Aesthetic Noise/Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

                        {/* Icon */}
                        <div className="mb-6 flex justify-center">
                            <motion.div
                                initial={{ scale: 0.8, rotate: -5 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 ${type === 'danger' ? 'bg-white/10 border-white/20' : ''}`}
                            >
                                {iconMap[type]}
                            </motion.div>
                        </div>

                        {/* Text */}
                        <h2 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                            {title}
                        </h2>
                        <p className="text-zinc-500 font-bold text-[11px] leading-relaxed mb-8 px-4">
                            {message}
                        </p>

                        {/* Buttons */}
                        <div className="flex flex-col gap-2">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleConfirm}
                                className={`w-full py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all ${type === 'danger'
                                    ? 'bg-white text-black hover:bg-zinc-200'
                                    : 'bg-white text-black hover:bg-zinc-200'
                                    }`}
                            >
                                {confirmLabel}
                            </motion.button>

                            {!isAlert && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    className="w-full py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    {cancelLabel}
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
