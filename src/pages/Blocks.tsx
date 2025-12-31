import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe,
    Box,
    Search,
    Plus,
    Trash2,
    Tag,
    X,
    Loader2,
    RefreshCw,
    AlertTriangle,
    MessageSquare,
    Play,
    Newspaper,
    ShoppingBag,
    Briefcase,
    Layers,
    ShieldCheck
} from 'lucide-react';
import { blockedSitesApi, blockedAppsApi, systemApi, BlockedSite, BlockedApp } from '../lib/api';

type TabType = 'websites' | 'applications';
type Category = 'social' | 'entertainment' | 'news' | 'shopping' | 'work' | 'other';

const categoryColors: Record<Category, string> = {
    social: 'bg-black/5 dark:bg-white/10 text-black dark:text-white border border-black/5 dark:border-white/10',
    entertainment: 'bg-black/5 dark:bg-white/10 text-black dark:text-white border border-black/5 dark:border-white/10',
    news: 'bg-black/5 dark:bg-white/10 text-black dark:text-white border border-black/5 dark:border-white/10',
    shopping: 'bg-black/5 dark:bg-white/10 text-black dark:text-white border border-black/5 dark:border-white/10',
    work: 'bg-black/5 dark:bg-white/10 text-black dark:text-white border border-black/5 dark:border-white/10',
    other: 'bg-black/5 dark:bg-white/10 text-black dark:text-white border border-black/5 dark:border-white/10',
};

const popularSites = [
    'twitter.com', 'x.com', 'youtube.com', 'instagram.com', 'reddit.com',
    'tiktok.com', 'facebook.com', 'fb.com', 'messenger.com', 'netflix.com'
];

const categoryIcons: Record<Category, any> = {
    social: MessageSquare,
    entertainment: Play,
    news: Newspaper,
    shopping: ShoppingBag,
    work: Briefcase,
    other: Layers,
};

export default function Blocks() {
    const [activeTab, setActiveTab] = useState<TabType>('websites');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState('');
    const [newCategory, setNewCategory] = useState<Category>('other');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [websites, setWebsites] = useState<BlockedSite[]>([]);
    const [applications, setApplications] = useState<BlockedApp[]>([]);

    const [isAdmin, setIsAdmin] = useState(true);
    const [isFixingBrowsers, setIsFixingBrowsers] = useState(false);

    // App Scanning State
    const [scanTab, setScanTab] = useState<'manual' | 'installed' | 'running'>('manual');
    const [installedApps, setInstalledApps] = useState<{ name: string; id: string }[]>([]);
    const [runningProcesses, setRunningProcesses] = useState<{ pid: number; name: string }[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const scanApps = async () => {
        setIsScanning(true);
        try {
            const [installed, running] = await Promise.all([
                blockedAppsApi.getInstalledApplications(),
                blockedAppsApi.getRunningProcesses()
            ]);
            setInstalledApps(installed);
            setRunningProcesses(running);
        } catch (err) {
            console.error('Failed to scan apps:', err);
        } finally {
            setIsScanning(false);
        }
    };
    const checkAdmin = async () => {
        try {
            const admin = await systemApi.isAdmin();
            setIsAdmin(admin);
        } catch (err) {
            console.error('Failed to check admin status:', err);
            setIsAdmin(false);
        }
    };

    const fixBrowsers = async () => {
        setIsFixingBrowsers(true);
        try {
            await systemApi.fixBrowserPolicies();
            showNotification('Browser security policies updated! Please restart Firefox/Chrome/Thorium to apply changes.');
        } catch (err) {
            console.error('Failed to fix browser policies:', err);
            showNotification('Failed to configure browser policies. Make sure you are running as Administrator.', 'error');
        } finally {
            setIsFixingBrowsers(false);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [sites, apps] = await Promise.all([
                blockedSitesApi.getAll(),
                blockedAppsApi.getAll()
            ]);
            setWebsites(sites);
            setApplications(apps);
        } catch (err) {
            console.error('Failed to load blocked items:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAdmin();
        loadData();
    }, []);

    useEffect(() => {
        if (showAddModal && activeTab === 'applications') {
            setScanTab('installed');
            setNewItem('');
            scanApps();
        }
    }, [showAddModal, activeTab]);

    const items = activeTab === 'websites' ? websites : applications;

    const filteredItems = items.filter(item => {
        const name = activeTab === 'websites'
            ? (item as BlockedSite).domain
            : (item as BlockedApp).name;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const filteredScannedApps = (scanTab === 'installed' ? installedApps : runningProcesses).filter(app =>
        app && app.name && app.name.toLowerCase().includes((newItem || '').toLowerCase())
    );

    const toggleItem = async (id: number) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        try {
            if (activeTab === 'websites') {
                await blockedSitesApi.toggle(id, !item.enabled);
            } else {
                await blockedAppsApi.toggle(id, !item.enabled);
            }
            await loadData();
        } catch (err) {
            console.error('Failed to toggle item:', err);
        }
    };

    const deleteItem = async (id: number) => {
        try {
            if (activeTab === 'websites') {
                await blockedSitesApi.delete(id);
            } else {
                await blockedAppsApi.delete(id);
            }
            await loadData();
        } catch (err) {
            console.error('Failed to delete item:', err);
        }
    };

    const addItem = async () => {
        if (!newItem.trim()) return;
        setIsSaving(true);

        let cleanItem = newItem.trim().toLowerCase();

        // Remove protocol
        cleanItem = cleanItem.replace(/^https?:\/\//, '');
        // Remove www.
        cleanItem = cleanItem.replace(/^www\./, '');
        // Remove trailing slash
        cleanItem = cleanItem.replace(/\/$/, '');
        // Remove path if present (just get domain)
        cleanItem = cleanItem.split('/')[0];

        try {
            if (activeTab === 'websites') {
                await blockedSitesApi.add(cleanItem, newCategory);

                // Smart Aliasing for Meta
                if (cleanItem === 'facebook.com') {
                    await blockedSitesApi.add('fb.com', newCategory);
                    await blockedSitesApi.add('facebook.net', newCategory);
                }
                if (cleanItem === 'instagram.com') {
                    await blockedSitesApi.add('cdninstagram.com', newCategory);
                }
            } else {
                const procName = newItem.trim();
                if (applications.some(a => a.process_name.toLowerCase() === procName.toLowerCase())) {
                    showNotification('This application is already blocked.', 'error');
                    setIsSaving(false);
                    return;
                }
                await blockedAppsApi.add(procName, procName, newCategory);
            }
            setNewItem('');
            setNewCategory('other');
            setShowAddModal(false);
            await loadData();
        } catch (err) {
            console.error('Failed to add item:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 px-8 pt-8 pb-6 bg-black z-20 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="heading-hero"
                        >
                            Blocked Items
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-500 dark:text-bastion-muted mt-2 font-bold"
                        >
                            Manage website and application blocks.
                        </motion.p>
                    </div>

                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { checkAdmin(); loadData(); }}
                            className="p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white transition-colors border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAddModal(true)}
                            className="btn-primary flex items-center gap-2 pl-4 pr-6"
                        >
                            <Plus className="w-5 h-5" />
                            Add Block
                        </motion.button>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="mt-8 flex items-center justify-between gap-6">
                    {/* Tabs */}
                    <div className="p-1.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl flex gap-1">
                        <button
                            onClick={() => setActiveTab('websites')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black transition-all duration-300 relative ${activeTab === 'websites' ? 'text-white dark:text-black' : 'text-gray-500 dark:text-bastion-muted hover:text-black dark:hover:text-white'}`}
                        >
                            {activeTab === 'websites' && (
                                <motion.div layoutId="tab-bg" className="absolute inset-0 bg-black dark:bg-white rounded-xl shadow-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                            )}
                            <Globe className="w-4 h-4 relative z-10" />
                            <span className="relative z-10">Websites</span>
                            <span className={`relative z-10 ml-2 text-[10px] py-0.5 px-2 rounded-full font-black ${activeTab === 'websites' ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black' : 'bg-black/10 dark:bg-white/10'}`}>
                                {websites.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('applications')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black transition-all duration-300 relative ${activeTab === 'applications' ? 'text-white dark:text-black' : 'text-gray-500 dark:text-bastion-muted hover:text-black dark:hover:text-white'}`}
                        >
                            {activeTab === 'applications' && (
                                <motion.div layoutId="tab-bg" className="absolute inset-0 bg-black dark:bg-white rounded-xl shadow-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                            )}
                            <Box className="w-3.5 h-3.5" />
                            <span className="relative z-10">Apps</span>
                            <span className={`relative z-10 ml-2 text-[10px] py-0.5 px-2 rounded-full font-black ${activeTab === 'applications' ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black' : 'bg-black/10 dark:bg-white/10'}`}>
                                {applications.length}
                            </span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex-1 max-w-md relative group">
                        <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-bastion-muted group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="glass-input pl-12 h-12 w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-8 py-8">
                <div className="max-w-5xl mx-auto space-y-6 pb-8">
                    {/* Warnings */}
                    <AnimatePresence>
                        {!isAdmin && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-6 mx-2 overflow-hidden"
                            >
                                <div className="p-4 rounded-xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/20 flex items-start gap-4 shadow-lg">
                                    <div className="p-2 rounded-lg bg-black/5 dark:bg-white/20">
                                        <AlertTriangle className="w-6 h-6 text-black dark:text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-black dark:text-white text-lg">System Access Required</h3>
                                        <p className="text-gray-500 dark:text-bastion-muted mt-1 font-bold">
                                            Bastion requires elevated privileges to modify system firewalls. Please restart as Administrator.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Browser Policy Helper */}
                    <div className="mx-2 mt-6 mb-8">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-indigo-500/10 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative glass-panel p-6 border border-white/5 dark:border-white/5 hover:border-indigo-500/30 transition-all duration-500 bg-black/20">
                                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                                    <div className="flex items-start gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 transition-colors duration-500">
                                            <ShieldCheck className="w-7 h-7 text-indigo-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <p className="font-black text-white transition-colors uppercase tracking-tight text-xl">Leak Prevention</p>
                                                <div className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">Security Layer</div>
                                            </div>
                                            <p className="text-sm text-zinc-400 font-bold max-w-xl leading-relaxed mt-1">
                                                Force browser protection by hardening security policies and purging persistent socket connections.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center p-1.5 bg-black/40 border border-white/5 rounded-2xl shadow-2xl">
                                        <button
                                            onClick={fixBrowsers}
                                            disabled={isFixingBrowsers}
                                            className={`
                                                relative px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 min-w-[180px]
                                                ${isFixingBrowsers
                                                    ? 'bg-indigo-500/20 text-indigo-400 cursor-default'
                                                    : 'bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-95 shadow-lg'}
                                            `}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {isFixingBrowsers ? <ShieldCheck className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                                <span>{isFixingBrowsers ? "Policies Fixed" : "Harden Policies"}</span>
                                            </div>
                                        </button>

                                        <div className="w-px h-8 bg-white/10 mx-2" />

                                        <button
                                            onClick={async () => {
                                                if (window.confirm("This will close all open browsers to reset connections. Save your work first! Continue?")) {
                                                    await systemApi.killBrowsers();
                                                    showNotification("Browsers terminated. Re-open to see blocking in effect.");
                                                }
                                            }}
                                            className="px-6 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-300 font-black uppercase tracking-widest text-[10px]"
                                        >
                                            <div className="flex items-center gap-2">
                                                <X className="w-3.5 h-3.5" />
                                                Hardcore Reset
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="mt-3 ml-4 text-[9px] text-zinc-600 font-black uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-zinc-700" />
                            Policy hardening requires system administrator privileges
                        </p>
                    </div>

                    {/* Content List */}
                    <div className="mx-2 space-y-3">
                        {isLoading ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" />
                                <p className="text-gray-400 dark:text-bastion-muted font-bold animate-pulse">Loading...</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {filteredItems.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="h-64 glass-panel flex flex-col items-center justify-center text-center gap-4 border-dashed border-black/10 dark:border-white/10"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                                            <Globe className="w-8 h-8 text-gray-400 dark:text-bastion-muted opacity-50" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-black dark:text-white mb-2">No items blocked</h3>
                                            <p className="text-gray-500 dark:text-bastion-muted max-w-sm mx-auto font-bold">
                                                No {activeTab} blocked. Add distractions to your blocklist to maintain focus.
                                            </p>
                                        </div>
                                        <button onClick={() => setShowAddModal(true)} className="text-black dark:text-white hover:underline font-black uppercase tracking-widest text-xs">
                                            Add your first block
                                        </button>
                                    </motion.div>
                                ) : (
                                    filteredItems.map((item, i) => {
                                        const name = activeTab === 'websites'
                                            ? (item as BlockedSite).domain
                                            : (item as BlockedApp).name;
                                        const category = (item.category || 'other') as Category;

                                        return (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="group relative"
                                            >
                                                <div className={`
                                            absolute inset-0 bg-gradient-to-r from-black/5 dark:from-white/10 to-transparent opacity-0 
                                            transition-opacity duration-300 rounded-xl pointer-events-none
                                            ${item.enabled ? 'group-hover:opacity-10' : ''}
                                        `} />

                                                <div className="glass-panel p-4 flex items-center justify-between border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-all duration-300">
                                                    <div className="flex items-center gap-5">
                                                        <button
                                                            onClick={() => toggleItem(item.id)}
                                                            className={`w-12 h-7 rounded-full transition-all duration-300 relative shadow-inner ${item.enabled
                                                                ? 'bg-black dark:bg-white shadow-lg'
                                                                : 'bg-black/10 dark:bg-white/10'
                                                                }`}
                                                        >
                                                            <motion.div
                                                                layout
                                                                className="w-5 h-5 rounded-full bg-white dark:bg-black absolute top-1 shadow-sm"
                                                                animate={{ left: item.enabled ? 24 : 4 }}
                                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                            />
                                                        </button>

                                                        <div>
                                                            <p className={`font-mono text-base transition-colors ${item.enabled ? 'text-black dark:text-white font-black' : 'text-gray-400 dark:text-bastion-muted font-bold'}`}>
                                                                {name}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md ${categoryColors[category]}`}>
                                                                    {category}
                                                                </span>
                                                                {item.enabled && (
                                                                    <span className="text-[10px] text-black dark:text-white flex items-center gap-1 font-black uppercase tracking-widest">
                                                                        <div className="w-1 h-1 rounded-full bg-black dark:bg-white animate-pulse" />
                                                                        Active
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <button className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 dark:text-bastion-muted hover:text-black dark:hover:text-white transition-colors">
                                                            <Tag className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteItem(item.id)}
                                                            className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 dark:text-bastion-muted hover:text-black dark:hover:text-white transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>

            {/* Aesthetic Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] min-w-[320px] max-w-md"
                    >
                        <div className={`
                            glass-panel p-4 flex items-center gap-4 border shadow-2xl
                            ${notification.type === 'error' ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 bg-black/40'}
                        `}>
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                ${notification.type === 'error' ? 'bg-red-500' : 'bg-white'}
                            `}>
                                {notification.type === 'error' ? (
                                    <AlertTriangle className="w-4 h-4 text-white" />
                                ) : (
                                    <ShieldCheck className="w-4 h-4 text-black" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-black uppercase tracking-tight ${notification.type === 'error' ? 'text-red-500' : 'text-white'}`}>
                                    {notification.type === 'error' ? 'System Error' : 'Policy Update'}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-bastion-muted font-bold leading-relaxed mt-0.5">
                                    {notification.message}
                                </p>
                            </div>
                            <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/5 rounded-full transition-colors self-start">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-zinc-950 w-full max-w-2xl rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col h-[600px] max-h-[85vh]"
                        >
                            <div className="absolute top-0 right-0 p-32 bg-white/5 blur-[80px] rounded-full pointer-events-none" />

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-white">
                                            Add {activeTab === 'websites' ? 'Website' : 'Application'}
                                        </h2>
                                        <p className="text-sm text-zinc-500 font-bold mt-1">
                                            {activeTab === 'websites'
                                                ? 'Block distracting domains'
                                                : 'Choose applications to restrict'
                                            }
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-zinc-500 hover:text-white" />
                                    </button>
                                </div>

                                {activeTab === 'applications' && (
                                    <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6">
                                        {[
                                            { id: 'installed', label: 'Installed', icon: Box },
                                            { id: 'running', label: 'Running', icon: RefreshCw },
                                            { id: 'manual', label: 'Manual', icon: Plus },
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setScanTab(t.id as any)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${scanTab === t.id
                                                    ? 'bg-white text-black shadow-lg'
                                                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                <t.icon className="w-3.5 h-3.5" />
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                                    {(activeTab === 'websites' || scanTab === 'manual') ? (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-black text-zinc-500 mb-2 block uppercase tracking-[0.2em]">
                                                    {activeTab === 'websites' ? 'Domain URL' : 'Process Name'}
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={activeTab === 'websites' ? 'e.g. twitter.com' : 'e.g. Discord.exe'}
                                                    value={newItem}
                                                    onChange={(e) => setNewItem(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                                                    autoFocus
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white font-black placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-zinc-500 mb-2 block uppercase tracking-[0.2em]">Category</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {Object.keys(categoryColors).map(cat => (
                                                        <button
                                                            key={cat}
                                                            onClick={() => setNewCategory(cat as Category)}
                                                            className={`py-2 px-3 rounded-lg border text-[10px] font-black transition-all capitalize uppercase tracking-widest flex items-center justify-center gap-2 ${newCategory === cat
                                                                ? 'bg-white text-black border-transparent shadow-lg'
                                                                : 'bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10 hover:text-white'
                                                                }`}
                                                        >
                                                            {(() => {
                                                                const Icon = categoryIcons[cat as Category];
                                                                return <Icon className="w-3 h-3" />;
                                                            })()}
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {activeTab === 'websites' && (
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Suggested Targets</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {popularSites.slice(0, 8).map((site) => (
                                                            <button
                                                                key={site}
                                                                onClick={() => setNewItem(site)}
                                                                className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-white/5 border border-white/5 hover:border-white hover:text-white text-zinc-500 transition-all uppercase tracking-widest"
                                                            >
                                                                {site}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {isScanning ? (
                                                <div className="py-12 flex flex-col items-center justify-center gap-4">
                                                    <Loader2 className="w-8 h-8 animate-spin text-white/20" />
                                                    <p className="text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Scanning System...</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-4">
                                                    <div className="relative">
                                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                        <input
                                                            type="text"
                                                            placeholder={`Search ${scanTab} apps...`}
                                                            value={newItem}
                                                            onChange={(e) => setNewItem(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white font-black placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {filteredScannedApps.length === 0 ? (
                                                            <p className="text-center py-8 text-zinc-500 font-bold uppercase tracking-widest text-[10px]">No matches found</p>
                                                        ) : (
                                                            filteredScannedApps.map((app, idx) => (
                                                                <button
                                                                    key={`${scanTab}-${idx}`}
                                                                    onClick={async () => {
                                                                        if (!app || !app.name) return;
                                                                        const procName = (scanTab === 'running'
                                                                            ? app.name
                                                                            : app.name.toLowerCase().includes('steam') ? 'steam.exe' : `${app.name.replace(/\s+/g, '')}.exe`).trim();

                                                                        // Check for duplicates
                                                                        if (applications.some(a => a.process_name.toLowerCase() === procName.toLowerCase())) {
                                                                            showNotification('This application is already blocked.', 'error');
                                                                            return;
                                                                        }

                                                                        setIsSaving(true);
                                                                        try {
                                                                            await blockedAppsApi.add(app.name, procName, newCategory);
                                                                            await loadData();
                                                                            setShowAddModal(false);
                                                                        } catch (err) {
                                                                            console.error('Failed to add app:', err);
                                                                            showNotification('Failed to add application.', 'error');
                                                                        } finally {
                                                                            setIsSaving(false);
                                                                        }
                                                                    }}
                                                                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-white/20 group-hover:text-white transition-colors">
                                                                            {app.name[0]}
                                                                        </div>
                                                                        <span className="text-sm font-black text-zinc-300 group-hover:text-white transition-colors">
                                                                            {app.name}
                                                                        </span>
                                                                    </div>
                                                                    <Plus className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-8 flex justify-end gap-3 border-t border-white/5 mt-6">
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="px-6 py-3 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-colors font-black uppercase tracking-widest text-xs"
                                    >
                                        Cancel
                                    </button>
                                    {(activeTab === 'websites' || scanTab === 'manual') && (
                                        <button
                                            onClick={addItem}
                                            disabled={isSaving || !newItem}
                                            className="btn-primary px-8"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                'Add Block'
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
