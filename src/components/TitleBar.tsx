import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Copy } from 'lucide-react';

export default function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);
    const appWindow = getCurrentWindow();

    useEffect(() => {
        // Check initial maximized state
        const checkMaximized = async () => {
            try {
                const maximized = await appWindow.isMaximized();
                setIsMaximized(maximized);
            } catch (err) {
                console.error('Failed to check maximized state:', err);
            }
        };
        checkMaximized();
    }, []);

    const handleMinimize = async () => {
        try {
            await appWindow.minimize();
        } catch (err) {
            console.error('Failed to minimize:', err);
        }
    };

    const handleMaximize = async () => {
        try {
            const maximized = await appWindow.isMaximized();
            if (maximized) {
                await appWindow.unmaximize();
                setIsMaximized(false);
            } else {
                await appWindow.maximize();
                setIsMaximized(true);
            }
        } catch (err) {
            console.error('Failed to maximize:', err);
        }
    };

    const handleClose = async () => {
        try {
            await appWindow.close();
        } catch (err) {
            console.error('Failed to close:', err);
        }
    };

    return (
        <div
            data-tauri-drag-region
            className="h-8 bg-black flex items-center justify-end select-none shrink-0"
        >
            {/* Draggable area */}
            <div data-tauri-drag-region className="flex-1 h-full" />

            {/* Right side - Window controls */}
            <div className="flex items-center h-full">
                {/* Minimize */}
                <button
                    onClick={handleMinimize}
                    className="h-full px-4 flex items-center justify-center hover:bg-white/5 transition-colors group"
                    title="Minimize"
                >
                    <Minus className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70 transition-colors" />
                </button>

                {/* Maximize/Restore */}
                <button
                    onClick={handleMaximize}
                    className="h-full px-4 flex items-center justify-center hover:bg-white/5 transition-colors group"
                    title={isMaximized ? "Restore" : "Maximize"}
                >
                    {isMaximized ? (
                        <Copy className="w-3 h-3 text-white/40 group-hover:text-white/70 transition-colors rotate-180" />
                    ) : (
                        <Square className="w-3 h-3 text-white/40 group-hover:text-white/70 transition-colors" />
                    )}
                </button>

                {/* Close */}
                <button
                    onClick={handleClose}
                    className="h-full px-4 flex items-center justify-center hover:bg-red-500/80 transition-colors group"
                    title="Close"
                >
                    <X className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                </button>
            </div>
        </div>
    );
}

