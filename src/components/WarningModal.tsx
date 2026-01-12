import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X } from 'lucide-react';

interface WarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    blockedItems: string[];
    customMessage?: string;
}

export default function WarningModal({ isOpen, onClose, blockedItems, customMessage }: WarningModalProps) {
    if (!isOpen) return null;

    const defaultMessage = "You tried to access blocked content. Stay focused!";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md glass-panel p-8 border border-white/10 rounded-3xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <X className="w-4 h-4 text-white/60" />
                        </button>

                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: "spring", damping: 15 }}
                                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20"
                            >
                                <ShieldAlert className="w-10 h-10 text-red-400" />
                            </motion.div>
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-black text-white text-center mb-4">
                            Blocked!
                        </h2>

                        {/* Custom Message */}
                        <p className="text-center text-white/80 mb-6 leading-relaxed">
                            {customMessage || defaultMessage}
                        </p>

                        {/* Blocked Items */}
                        {blockedItems.length > 0 && (
                            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
                                <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-2">
                                    Blocked Items
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {blockedItems.map((item, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm font-medium border border-red-500/20"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Dismiss Button */}
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-colors"
                        >
                            Back to Focus
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
