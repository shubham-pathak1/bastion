import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    ArrowLeft,
    Check,
    Eye,
    EyeOff,
    Sparkles,
    Lock,
    Zap,
    Loader2
} from 'lucide-react';
import { securityApi, blockedSitesApi } from '../lib/api';
import logo from '../assets/bastion_logo.png';

interface OnboardingProps {
    onComplete: () => void;
}

const popularDistractions = [
    { name: 'twitter.com', label: 'Twitter/X', category: 'social' },
    { name: 'youtube.com', label: 'YouTube', category: 'entertainment' },
    { name: 'instagram.com', label: 'Instagram', category: 'social' },
    { name: 'reddit.com', label: 'Reddit', category: 'social' },
    { name: 'tiktok.com', label: 'TikTok', category: 'entertainment' },
    { name: 'facebook.com', label: 'Facebook', category: 'social' },
    { name: 'netflix.com', label: 'Netflix', category: 'entertainment' },
    { name: 'twitch.tv', label: 'Twitch', category: 'entertainment' },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [step, setStep] = useState(0);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [selectedDistractions, setSelectedDistractions] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const steps = [
        { title: 'Welcome', subtitle: 'Why Bastion?' },
        { title: 'Security', subtitle: 'Set Master Password' },
        { title: 'Quick Setup', subtitle: 'Common Distractions' },
    ];

    const validatePassword = () => {
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        setError('');
        return true;
    };

    const handleNext = async () => {
        if (step === 1 && !validatePassword()) {
            return;
        }
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            setIsLoading(true);
            setError('');

            try {
                await securityApi.setMasterPassword(password);

                for (const distraction of selectedDistractions) {
                    const category = popularDistractions.find(d => d.name === distraction)?.category || 'other';
                    await blockedSitesApi.add(distraction, category);
                }

                onComplete();
            } catch (err) {
                console.error('Onboarding error:', err);
                setError(`Setup failed: ${err}`);
                setIsLoading(false);
            }
        }
    };

    const toggleDistraction = (name: string) => {
        setSelectedDistractions(prev =>
            prev.includes(name)
                ? prev.filter(d => d !== name)
                : [...prev, name]
        );
    };

    return (
        <div className="h-full w-full flex items-center justify-center bg-black relative overflow-hidden">
            {/* Monochromatic orbs */}
            <motion.div
                className="absolute top-20 right-20 w-96 h-96 rounded-full bg-white/5 blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
                className="absolute bottom-20 left-20 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl"
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ duration: 10, repeat: Infinity }}
            />

            {/* Main card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-lg glass-panel border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <motion.div
                        className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/10"
                        animate={{ boxShadow: ['0 0 20px rgba(255, 255, 255, 0.05)', '0 0 40px rgba(255, 255, 255, 0.1)', '0 0 20px rgba(255, 255, 255, 0.05)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <img src={logo} alt="Bastion Logo" className="w-full h-full object-cover" />
                    </motion.div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Bastion</h1>
                    <p className="text-bastion-muted mt-1 font-bold">Unbreakable focus for those who need it.</p>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-8">
                    {steps.map((_, i) => (
                        <motion.div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-white shadow-lg' : i < step ? 'bg-white/50' : 'bg-white/10'
                                }`}
                            animate={{ scale: i === step ? 1.3 : 1 }}
                        />
                    ))}
                </div>

                {/* Step content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {step === 0 && (
                            <div className="text-center space-y-4">
                                {[
                                    { icon: Sparkles, title: 'Reclaim Your Focus', desc: 'Block distracting sites with zero willpower required', color: 'text-white', bg: 'bg-white/10' },
                                    { icon: Lock, title: 'Truly Unbreakable', desc: 'Hardcore mode locks you in until your session ends', color: 'text-white', bg: 'bg-white/10' },
                                    { icon: Zap, title: 'Privacy First', desc: 'Everything stays local. No accounts, no telemetry.', color: 'text-white', bg: 'bg-white/10' },
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5"
                                    >
                                        <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                                            <item.icon className={`w-6 h-6 ${item.color}`} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-black text-white uppercase tracking-tight">{item.title}</h3>
                                            <p className="text-xs text-bastion-muted font-bold">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">Set Master Password</h2>
                                    <p className="text-xs text-bastion-muted font-bold uppercase tracking-widest">
                                        Protects settings and allows bypass
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="glass-input pr-12 font-black"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-bastion-muted hover:text-white"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Confirm password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="glass-input font-black"
                                    />

                                    {error && (
                                        <p className="text-[10px] text-red-500 font-black uppercase tracking-widest text-center">{error}</p>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`flex-1 h-1 rounded-full transition-colors ${password.length >= level * 3
                                                        ? 'bg-white'
                                                        : 'bg-white/10'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-bastion-muted font-black uppercase tracking-widest text-right">
                                            {password.length < 8 ? 'Min 8 chars required' : 'Strong password'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">Targets Identified</h2>
                                    <p className="text-xs text-bastion-muted font-bold uppercase tracking-widest">
                                        Select distractions to neutralize
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {popularDistractions.map((item) => (
                                        <motion.button
                                            key={item.name}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => toggleDistraction(item.name)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selectedDistractions.includes(item.name)
                                                ? 'bg-white border-transparent text-black shadow-lg'
                                                : 'bg-white/5 border-white/5 text-bastion-muted hover:border-white/20'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${selectedDistractions.includes(item.name)
                                                ? 'bg-black/20'
                                                : 'border border-white/10'
                                                }`}>
                                                {selectedDistractions.includes(item.name) && (
                                                    <Check className="w-3 h-3 text-black" />
                                                )}
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-tight">{item.label}</span>
                                        </motion.button>
                                    ))}
                                </div>

                                {error && (
                                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest text-center">{error}</p>
                                )}

                                <p className="text-[10px] text-center text-bastion-muted font-bold uppercase tracking-tight">
                                    Configure additional masks in your console anytime
                                </p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation buttons */}
                <div className="flex justify-between items-center mt-8">
                    <button
                        onClick={() => setStep(step - 1)}
                        disabled={step === 0 || isLoading}
                        className={`text-xs font-black uppercase tracking-widest text-bastion-muted hover:text-white transition-colors flex items-center gap-2 ${step === 0 ? 'opacity-0 pointer-events-none' : ''
                            }`}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Abort
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={isLoading}
                        className="btn-primary flex items-center gap-3 pl-6 pr-8 h-12"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs font-black uppercase tracking-widest">Initializing...</span>
                            </>
                        ) : (
                            <>
                                <span className="text-xs font-black uppercase tracking-widest">{step === steps.length - 1 ? 'Deploy Bastion' : 'Proceed'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
