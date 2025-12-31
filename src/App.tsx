import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Blocks from './pages/Blocks';
import Sessions from './pages/Sessions';
import Pomodoro from './pages/Pomodoro';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import { securityApi } from './lib/api';
import { Loader2 } from 'lucide-react';

function App() {
    const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        // Check if user has completed onboarding via Tauri backend
        const checkOnboarding = async () => {
            try {
                const onboarded = await securityApi.isOnboarded();
                setIsOnboarded(onboarded);
            } catch (err) {
                console.error('Failed to check onboarding status:', err);
                // Fallback to localStorage for dev/testing
                const localOnboarded = localStorage.getItem('bastion_onboarded');
                setIsOnboarded(localOnboarded === 'true');
            }
        };
        checkOnboarding();
    }, []);

    const completeOnboarding = () => {
        setIsOnboarded(true);
    };

    // Loading state
    if (isOnboarded === null) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                    <div className="text-bastion-muted text-xs font-black uppercase tracking-widest animate-pulse">Loading Bastion...</div>
                </div>
            </div>
        );
    }

    // Show onboarding for new users
    if (!isOnboarded) {
        return <Onboarding onComplete={completeOnboarding} />;
    }

    return (
        <BrowserRouter>
            <div className="h-screen w-screen bg-black overflow-hidden flex p-4 gap-4 relative">
                {/* Noise Texture Overlay */}
                <div className="noise-overlay" />

                {/* Ambient Background Glows */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                />

                <main className="flex-1 relative z-10 glass-panel rounded-3xl overflow-hidden flex flex-col border border-white/5">
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/blocks" element={<Blocks />} />
                            <Route path="/sessions" element={<Sessions />} />
                            <Route path="/pomodoro" element={<Pomodoro />} />
                            <Route path="/stats" element={<Stats />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </div>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
