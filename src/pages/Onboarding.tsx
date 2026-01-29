import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Sparkles,
    Lock,
    Zap,
    Loader2
} from 'lucide-react';
import { settingsApi } from '../lib/api';
import logo from '../assets/bastion_logo.png';

interface OnboardingProps {
    onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFinish = async () => {
        setIsLoading(true);
        setError('');

        try {
            // Persist onboarding status to the database
            await settingsApi.set('onboarded', 'true');
            onComplete();
        } catch (err) {
            console.error('Onboarding error:', err);
            setError('Failed to finalize setup. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full w-full flex items-center justify-center bg-black relative overflow-hidden p-6">
            {/* Main card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-lg glass-panel border border-white/10 rounded-[2.5rem] p-12 shadow-2xl text-center"
            >
                {/* Logo */}
                <div className="mb-10">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="w-24 h-24 rounded-[2rem] overflow-hidden flex items-center justify-center mx-auto mb-6 border border-white/10 p-3 bg-white/5"
                    >
                        <img src={logo} alt="Bastion Logo" className="w-full h-full object-contain" />
                    </motion.div>
                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase mb-2">Bastion</h1>
                    <p className="text-bastion-muted text-sm font-bold uppercase tracking-[0.2em]">System Guard Alpha</p>
                </div>

                <div className="space-y-4 mb-12 text-left">
                    {[
                        { icon: Sparkles, title: 'Deep Focus', desc: 'Global OS-level distraction interceptor' },
                        { icon: Lock, title: 'Hardcore Persistence', desc: 'Secure sessions that cannot be bypassed' },
                        { icon: Zap, title: 'Zero Friction', desc: 'Local processing with zero telemetry' },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 + 0.2 }}
                            className="flex items-center gap-5 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                                <item.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-white uppercase text-xs tracking-widest mb-1">{item.title}</h3>
                                <p className="text-[11px] text-bastion-muted font-bold leading-relaxed">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {error && (
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-6">{error}</p>
                )}

                <button
                    onClick={handleFinish}
                    disabled={isLoading}
                    className="w-full btn-primary h-16 text-sm flex items-center justify-center gap-3 group"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-black uppercase tracking-[0.2em]">Initializing...</span>
                        </>
                    ) : (
                        <>
                            <span className="font-black uppercase tracking-[0.2em]">Activate Bastion</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                <p className="mt-8 text-[10px] text-bastion-muted font-bold uppercase tracking-widest opacity-50">
                    Version 0.1.0 Alpha • Ready for Deployment
                </p>
            </motion.div>
        </div>
    );
}
