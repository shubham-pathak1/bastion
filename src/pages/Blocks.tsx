import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe,
    AppWindow,
    Search,
    Plus,
    Trash2,
    Tag,
    Download,
    Upload,
    X,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { blockedSitesApi, blockedAppsApi, BlockedSite, BlockedApp } from '../lib/api';

type TabType = 'websites' | 'applications';
type Category = 'social' | 'entertainment' | 'news' | 'shopping' | 'work' | 'other';

const categoryColors: Record<Category, string> = {
    social: 'bg-pink-500/20 text-pink-400',
    entertainment: 'bg-purple-500/20 text-purple-400',
    news: 'bg-blue-500/20 text-blue-400',
    shopping: 'bg-orange-500/20 text-orange-400',
    work: 'bg-green-500/20 text-green-400',
    other: 'bg-gray-500/20 text-gray-400',
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

    // Real data from Tauri backend
    const [websites, setWebsites] = useState<BlockedSite[]>([]);
    const [applications, setApplications] = useState<BlockedApp[]>([]);

    // Load data from backend
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

        try {
            if (activeTab === 'websites') {
                await blockedSitesApi.add(newItem.trim(), newCategory);
            } else {
                // For apps, use the input as both name and process name
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
        <div className="max-w-4xl mx-auto animate-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="heading-1 mb-2">Blocks</h1>
                    <p className="text-bastion-text-secondary">
                        Manage websites and applications to block during focus sessions
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadData} className="btn-ghost flex items-center gap-2">
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} /> Refresh
                    </button>
                    <button className="btn-ghost flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="btn-ghost flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Import
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('websites')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                        activeTab === 'websites'
                            ? 'bg-bastion-accent text-bastion-bg'
                            : 'text-bastion-text-secondary hover:text-bastion-text-primary'
                    )}
                >
                    <Globe className="w-4 h-4" />
                    Websites
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-black/20 text-xs">
                        {websites.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('applications')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                        activeTab === 'applications'
                            ? 'bg-bastion-accent text-bastion-bg'
                            : 'text-bastion-text-secondary hover:text-bastion-text-primary'
                    )}
                >
                    <AppWindow className="w-4 h-4" />
                    Applications
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-bastion-surface text-xs">
                        {applications.length}
                    </span>
                </button>
            </div>

            {/* Search and Add */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bastion-text-muted" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-12"
                    />
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add {activeTab === 'websites' ? 'Website' : 'App'}
                </button>
            </div>

            {/* Items list */}
            <div className="card">
                {isLoading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-bastion-accent" />
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredItems.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-12 text-center text-bastion-text-muted"
                            >
                                <p>No {activeTab} blocked yet</p>
                                <p className="text-sm mt-1">Add some to start protecting your focus</p>
                            </motion.div>
                        ) : (
                            filteredItems.map((item) => {
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
                                        exit={{ opacity: 0, x: -20 }}
                                        className="flex items-center justify-between py-4 border-b border-bastion-border last:border-0 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => toggleItem(item.id)}
                                                className={cn(
                                                    'w-12 h-7 rounded-full transition-all duration-200 relative',
                                                    item.enabled ? 'bg-bastion-accent' : 'bg-bastion-border'
                                                )}
                                            >
                                                <motion.div
                                                    layout
                                                    className="w-5 h-5 rounded-full bg-white absolute top-1"
                                                    animate={{ left: item.enabled ? 26 : 4 }}
                                                />
                                            </button>
                                            <div>
                                                <p className="font-mono text-sm">{name}</p>
                                                <span className={cn('text-xs px-2 py-0.5 rounded-full', categoryColors[category])}>
                                                    {category}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-bastion-surface-hover rounded-lg transition-colors">
                                                <Tag className="w-4 h-4 text-bastion-text-muted" />
                                            </button>
                                            <button
                                                onClick={() => deleteItem(item.id)}
                                                className="p-2 hover:bg-bastion-danger/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 text-bastion-danger" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-bastion-surface border border-bastion-border rounded-2xl p-6 w-full max-w-md"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="heading-2">
                                    Add {activeTab === 'websites' ? 'Website' : 'Application'}
                                </h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-bastion-surface-hover rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder={activeTab === 'websites' ? 'e.g. twitter.com' : 'e.g. Discord.exe'}
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                                className="input mb-4"
                                autoFocus
                            />

                            <div className="mb-4">
                                <label className="text-sm text-bastion-text-muted mb-2 block">Category</label>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value as Category)}
                                    className="input"
                                >
                                    <option value="social">Social</option>
                                    <option value="entertainment">Entertainment</option>
                                    <option value="news">News</option>
                                    <option value="shopping">Shopping</option>
                                    <option value="work">Work</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {activeTab === 'websites' && (
                                <div className="mb-6">
                                    <p className="text-sm text-bastion-text-muted mb-2">Popular suggestions:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {popularSites.slice(0, 6).map((site) => (
                                            <button
                                                key={site}
                                                onClick={() => setNewItem(site)}
                                                className="px-3 py-1 rounded-full text-sm bg-bastion-bg border border-bastion-border hover:border-bastion-accent transition-colors"
                                            >
                                                {site}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowAddModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button onClick={addItem} disabled={isSaving} className="btn-primary flex items-center gap-2">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add to Block List'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
