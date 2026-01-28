import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import WarningModal from './components/WarningModal';
import Home from './pages/Home';
import Blocks from './pages/Blocks';
import Sessions from './pages/Sessions';
import Pomodoro from './pages/Pomodoro';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import { securityApi, settingsApi } from './lib/api';
import { Loader2 } from 'lucide-react';
import { listen } from '@tauri-apps/api/event';

function App() {
    const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const [showWarning, setShowWarning] = useState(false);
    const [blockedItems, setBlockedItems] = useState<string[]>([]);
    const [customWarningText, setCustomWarningText] = useState<string>('');

    useEffect(() => {
        // Check if user has completed onboarding via Tauri backend
        const checkOnboarding = async () => {
            try {
                const onboarded = await securityApi.isOnboarded();
                setIsOnboarded(onboarded);
            } catch (err) {
                console.error('Failed to check onboarding status:', err);
                const localOnboarded = localStorage.getItem('bastion_onboarded');
                setIsOnboarded(localOnboarded === 'true');
            }
        };
        checkOnboarding();

        // Load custom warning text
        const loadWarningText = async () => {
            try {
                const text = await settingsApi.get('custom_warning_text');
                if (text) setCustomWarningText(text);
            } catch (err) {
                console.error('Failed to load warning text:', err);
            }
        };
        loadWarningText();

        // Listen for blocks from the Rust background loop
        const unlisten = listen<string[]>('blocked-apps', async (event) => {
            const killed = event.payload;
            if (killed && killed.length > 0) {
                // Reload warning text in case it was updated
                const text = await settingsApi.get('custom_warning_text');
                if (text) setCustomWarningText(text);

                setBlockedItems(killed);
                setShowWarning(true);
            }
        });

        return () => {
            unlisten.then(f => f());
        };
    }, []);

    const completeOnboarding = () => {
        setIsOnboarded(true);
    };

    // Loading state
    if (isOnboarded === null) {
        return (
            <div className="h-screen w-screen flex flex-col bg-black">
                <TitleBar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                        <div className="text-bastion-muted text-xs font-black uppercase tracking-widest animate-pulse">Loading Bastion...</div>
                    </div>
                </div>
            </div>
        );
    }

    // Show onboarding for new users
    if (!isOnboarded) {
        return (
            <div className="h-screen w-screen flex flex-col bg-black">
                <TitleBar />
                <div className="flex-1 overflow-hidden">
                    <Onboarding onComplete={completeOnboarding} />
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <div className="h-screen w-screen bg-black overflow-hidden flex flex-col">
                <TitleBar />

                {/* Main Content */}
                <div className="flex-1 flex p-4 gap-4 relative overflow-hidden">
                    <div className="noise-overlay" />


                    <Sidebar
                        collapsed={sidebarCollapsed}
                        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />

                    <main className="flex-1 relative z-10 glass-panel rounded-3xl overflow-hidden flex flex-col border border-white/5">
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/blocks" element={<Blocks />} />
                                <Route path="/sessions" element={<Sessions />} />
                                <Route path="/pomodoro" element={<Pomodoro />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </div>
                    </main>

                    <WarningModal
                        isOpen={showWarning}
                        onClose={() => setShowWarning(false)}
                        blockedItems={blockedItems}
                        customMessage={customWarningText}
                    />
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;

