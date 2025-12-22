import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe,
    AppWindow,
    Search,
    Plus,
    Trash2,
    Tag,
    X,
    Loader2,
    RefreshCw,
    AlertTriangle
} from 'lucide-react';
import { blockedSitesApi, blockedAppsApi, systemApi, BlockedSite, BlockedApp } from '../lib/api';

type TabType = 'websites' | 'applications';
type Category = 'social' | 'entertainment' | 'news' | 'shopping' | 'work' | 'other';

const categoryColors: Record<Category, string> = {
    social: 'bg-pink-500/15 text-pink-400',
    entertainment: 'bg-purple-500/15 text-purple-400',
    news: 'bg-blue-500/15 text-blue-400',
    shopping: 'bg-orange-500/15 text-orange-400',
    work: 'bg-green-500/15 text-green-400',
    other: 'bg-gray-500/15 text-gray-400',
};

const popularSites = [
    'twitter.com', 'x.com', 'youtube.com', 'instagram.com', 'reddit.com',
    'tiktok.com', 'facebook.com', 'netflix.com', 'twitch.tv', 'discord.com'
];

export default function Blocks() {
    const [activeTab, setActiveTab] = useState<TabType>('websites');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState('');
    const [newCategory, setNewCategory] = useState<Category>('other');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const [websites, setWebsites] = useState<BlockedSite[]>([]);
    const [applications, setApplications] = useState<BlockedApp[]>([]);

    const [isAdmin, setIsAdmin] = useState(true);
    const [isFixingFirefox, setIsFixingFirefox] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const checkAdmin = async () => {
        try {
            const admin = await systemApi.isAdmin();
            setIsAdmin(admin);
        } catch (err) {
            console.error('Failed to check admin status:', err);
            setIsAdmin(false);
        }
    };

    const fixFirefox = async () => {
        setIsFixingFirefox(true);
        try {
            await systemApi.fixFirefoxPolicies();
            alert('Firefox configuration updated! Please restart Firefox to apply changes.');
        } catch (err) {
            console.error('Failed to fix Firefox:', err);
            alert('Failed to configure Firefox. Make sure you are running as Administrator.');
        } finally {
            setIsFixingFirefox(false);
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

    const items = activeTab === 'websites' ? websites : applications;

    const filteredItems = items.filter(item => {
        const name = activeTab === 'websites'
            ? (item as BlockedSite).domain
            : (item as BlockedApp).name;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

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
            } else {
                await blockedAppsApi.add(newItem.trim(), newItem.trim(), newCategory);
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
        <div className="max-w-5xl mx-auto min-h-screen pb-20">
            {/* Header */}
            <div className={`sticky top-0 z-30 transition-all duration-200 ${scrolled ? 'py-4 bg-black/50 backdrop-blur-xl border-b border-white/5' : 'py-8'}`}>
                <div className="flex items-center justify-between px-2">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="heading-hero"
                        >
                            Defense Matrix
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-bastion-muted mt-2"
                        >
                            Manage your digital perimeter
                        </motion.p>
                    </div>

                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { checkAdmin(); loadData(); }}
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5 hover:border-white/10"
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
                            Add Target
                        </motion.button>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="mt-8 flex items-center justify-between gap-6 px-2">
                    {/* Tabs */}
                    <div className="p-1.5 bg-white/5 border border-white/5 rounded-2xl flex gap-1">
                        <button
                            onClick={() => setActiveTab('websites')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all duration-300 relative ${activeTab === 'websites' ? 'text-black' : 'text-bastion-muted hover:text-white'}`}
                        >
                            {activeTab === 'websites' && (
                                <motion.div layoutId="tab-bg" className="absolute inset-0 bg-bastion-accent rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.3)]" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                            )}
                            <Globe className="w-4 h-4 relative z-10" />
                            <span className="relative z-10">Websites</span>
                            <span className={`relative z-10 ml-2 text-xs py-0.5 px-2 rounded-full ${activeTab === 'websites' ? 'bg-black/20 text-black' : 'bg-white/10'}`}>
                                {websites.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('applications')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all duration-300 relative ${activeTab === 'applications' ? 'text-black' : 'text-bastion-muted hover:text-white'}`}
                        >
                            {activeTab === 'applications' && (
                                <motion.div layoutId="tab-bg" className="absolute inset-0 bg-bastion-accent rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.3)]" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                            )}
                            <AppWindow className="w-4 h-4 relative z-10" />
                            <span className="relative z-10">Apps</span>
                            <span className={`relative z-10 ml-2 text-xs py-0.5 px-2 rounded-full ${activeTab === 'applications' ? 'bg-black/20 text-black' : 'bg-white/10'}`}>
                                {applications.length}
                            </span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex-1 max-w-md relative group">
                        <div className="absolute inset-0 bg-bastion-accent/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bastion-muted group-focus-within:text-bastion-accent transition-colors" />
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

            {/* Warnings */}
            <AnimatePresence>
                {!isAdmin && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-6 mx-2 overflow-hidden"
                    >
                        <div className="p-4 rounded-xl bg-bastion-danger/10 border border-bastion-danger/20 flex items-start gap-4 shadow-[0_0_30px_rgba(255,0,51,0.1)]">
                            <div className="p-2 rounded-lg bg-bastion-danger/20">
                                <AlertTriangle className="w-6 h-6 text-bastion-danger" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">System Access Required</h3>
                                <p className="text-bastion-muted mt-1">
                                    Bastion requires elevated privileges to modify system firewalls. Please restart as Administrator.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Firefox Helper */}
            <div className="mx-2 mt-6 mb-8 group">
                <div className="glass-panel p-4 flex items-center justify-between border border-white/5 hover:border-bastion-accent/30 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#FF7139]/10 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-[#FF7139]" />
                        </div>
                        <div>
                            <p className="font-medium text-white group-hover:text-bastion-accent transition-colors">Using Firefox?</p>
                            <p className="text-sm text-bastion-muted">Requires one-time policy configuration</p>
                        </div>
                    </div>
                    <button
                        onClick={fixFirefox}
                        disabled={isFixingFirefox}
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-[#FF7139] hover:text-black border border-white/10 hover:border-transparent transition-all duration-300 text-sm font-medium"
                    >
                        {isFixingFirefox ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" /> Configuring...
                            </span>
                        ) : (
                            "Auto-Fix policies"
                        )}
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="mx-2 space-y-3">
                {isLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-bastion-accent" />
                        <p className="text-bastion-muted animate-pulse">Scanning defenses...</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredItems.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-64 glass-panel flex flex-col items-center justify-center text-center gap-4 border-dashed border-white/10"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                    <Globe className="w-8 h-8 text-bastion-muted opacity-50" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Perimeter Clear</h3>
                                    <p className="text-bastion-muted max-w-sm mx-auto">
                                        No {activeTab} blocked. Add distractions to your blocklist to maintain focus.
                                    </p>
                                </div>
                                <button onClick={() => setShowAddModal(true)} className="text-bastion-accent hover:underline font-medium">
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
                                            absolute inset-0 bg-gradient-to-r from-bastion-accent/20 to-transparent opacity-0 
                                            transition-opacity duration-300 rounded-xl pointer-events-none
                                            ${item.enabled ? 'group-hover:opacity-10' : ''}
                                        `} />

                                        <div className="glass-panel p-4 flex items-center justify-between border border-white/5 hover:border-white/10 transition-all duration-300">
                                            <div className="flex items-center gap-5">
                                                <button
                                                    onClick={() => toggleItem(item.id)}
                                                    className={`w-12 h-7 rounded-full transition-all duration-300 relative shadow-inner ${item.enabled
                                                        ? 'bg-bastion-accent shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                                                        : 'bg-white/10'
                                                        }`}
                                                >
                                                    <motion.div
                                                        layout
                                                        className="w-5 h-5 rounded-full bg-white absolute top-1 shadow-sm"
                                                        animate={{ left: item.enabled ? 24 : 4 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                    />
                                                </button>

                                                <div>
                                                    <p className={`font-mono text-base transition-colors ${item.enabled ? 'text-white font-medium' : 'text-bastion-muted'}`}>
                                                        {name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${categoryColors[category]}`}>
                                                            {category}
                                                        </span>
                                                        {item.enabled && (
                                                            <span className="text-[10px] text-bastion-success flex items-center gap-1">
                                                                <div className="w-1 h-1 rounded-full bg-bastion-success animate-pulse" />
                                                                Active
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button className="p-2.5 rounded-xl hover:bg-white/10 text-bastion-muted hover:text-white transition-colors">
                                                    <Tag className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteItem(item.id)}
                                                    className="p-2.5 rounded-xl hover:bg-bastion-danger/20 text-bastion-muted hover:text-bastion-danger transition-colors"
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

            {/* Modal */}
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
                            className="glass-panel w-full max-w-lg rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-32 bg-bastion-accent/10 blur-[80px] rounded-full pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="heading-title">
                                        Add {activeTab === 'websites' ? 'Website' : 'Application'}
                                    </h2>
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-bastion-muted hover:text-white" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-sm font-medium text-bastion-secondary mb-2 block">
                                            {activeTab === 'websites' ? 'Domain URL' : 'Application Name'}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={activeTab === 'websites' ? 'e.g. twitter.com' : 'e.g. Discord.exe'}
                                            value={newItem}
                                            onChange={(e) => setNewItem(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addItem()}
                                            autoFocus
                                            className="glass-input text-lg"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-bastion-secondary mb-2 block">Category</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {Object.keys(categoryColors).map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setNewCategory(cat as Category)}
                                                    className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all capitalize ${newCategory === cat
                                                        ? 'bg-bastion-accent text-black border-bastion-accent shadow-glow-sm'
                                                        : 'bg-white/5 border-white/5 text-bastion-muted hover:bg-white/10 hover:text-white'
                                                        }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {activeTab === 'websites' && (
                                        <div>
                                            <p className="text-xs font-semibold text-bastion-muted uppercase tracking-wider mb-3">Popular Targets</p>
                                            <div className="flex flex-wrap gap-2">
                                                {popularSites.slice(0, 6).map((site) => (
                                                    <button
                                                        key={site}
                                                        onClick={() => setNewItem(site)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/5 hover:border-bastion-accent hover:text-white text-bastion-muted transition-all"
                                                    >
                                                        {site}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 flex justify-end gap-3">
                                        <button
                                            onClick={() => setShowAddModal(false)}
                                            className="px-6 py-3 rounded-xl hover:bg-white/5 text-bastion-muted hover:text-white transition-colors font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={addItem}
                                            disabled={isSaving}
                                            className="btn-primary px-8"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                'Add Block'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
