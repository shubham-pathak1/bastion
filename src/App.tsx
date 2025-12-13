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
            <div className="h-full w-full flex items-center justify-center bg-bastion-bg">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-bastion-accent" />
                    <div className="text-bastion-text-muted text-sm">Loading Bastion...</div>
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
            <div className="h-full w-full flex bg-bastion-bg">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
                <main className="flex-1 overflow-auto p-8">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/blocks" element={<Blocks />} />
                        <Route path="/sessions" element={<Sessions />} />
                        <Route path="/pomodoro" element={<Pomodoro />} />
                        <Route path="/stats" element={<Stats />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
