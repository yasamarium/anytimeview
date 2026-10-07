'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Image as ImageIcon,
  FileText,
  Search,
  Globe,
  Play,
  HardDrive,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Upload,
  Copy,
  Check,
  User,
  LogOut,
  FolderLock,
  Plus,
  Trash2,
  Share2,
  Cloud,
  CheckCircle2,
  AlertCircle,
  X,
  Bell,
  Layers,
} from 'lucide-react';
import { AnytimeLogo } from '@/components/AnytimeLogo';
import { DatabaseMapModal } from '@/components/DatabaseMapModal';
import { MediaViewerModal } from '@/components/MediaViewerModal';
import { SystemUpdatesModal } from '@/components/SystemUpdatesModal';
import { UserAuthModal } from '@/components/UserAuthModal';
import { ViewItem } from '@/lib/db';
import { CloudUser } from '@/lib/userDb';

export default function HomePage() {
  const [items, setItems] = useState<ViewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'video' | 'image' | 'pdf'>('all');
  const [search, setSearch] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ViewItem | null>(null);

  // CloudDrive User State
  const [user, setUser] = useState<Partial<CloudUser> | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [activeView, setActiveView] = useState<'public' | 'drive'>('public');

  // Direct CDN Copy State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Upload State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [selectedTargetNode, setSelectedTargetNode] = useState('Global Geo-Replicated');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Deleting user's item
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch Session & Items
  useEffect(() => {
    checkUserSession();
    loadItems();
  }, []);

  const checkUserSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setActiveView('drive');
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const loadItems = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error('Error fetching stream items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setActiveView('public');
    } catch {
      setUser(null);
    }
  };

  const handleAuthSuccess = (authedUser: Partial<CloudUser>) => {
    setUser(authedUser);
    setActiveView('drive');
    loadItems();
  };

  const copyDirectCdn = (e: React.MouseEvent, item: ViewItem) => {
    e.stopPropagation();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}/api/cdn/${item.id}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(item.id);
    setCopyToast(`Direct CDN URL copied for "${item.title}"`);
    setTimeout(() => {
      setCopiedId(null);
      setCopyToast(null);
    }, 3000);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    if (!user) {
      setUploadModalOpen(false);
      setAuthMode('signin');
      setAuthModalOpen(true);
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle || uploadFile.name);
      formData.append('tags', uploadTags);
      formData.append('targetNode', selectedTargetNode);

      const res = await fetch('/api/items/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadSuccess(`Replicated successfully on ${selectedTargetNode}!`);
      setUploadFile(null);
      setUploadTitle('');
      setUploadTags('');

      await loadItems();
      await checkUserSession();

      setTimeout(() => {
        setUploadModalOpen(false);
        setUploadSuccess(null);
      }, 1500);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload to CloudDrive');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMyItem = async (e: React.MouseEvent, item: ViewItem) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to remove "${item.title}" from your CloudDrive?`)) {
      return;
    }

    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Deletion failed');
      }

      setItems((prev) => prev.filter((i) => i.id !== item.id));
      await checkUserSession();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getNodeBadge = (targetNode?: string) => {
    if (!targetNode || targetNode.includes('Global')) return '🌐 Multi-Cluster';
    if (targetNode.includes('Kolkata')) return '🇮🇳 Kolkata Node';
    if (targetNode.includes('Israel')) return '🇮🇱 Israel Gateway';
    if (targetNode.includes('US')) return '🇺🇸 US Central Core';
    return `🌐 ${targetNode}`;
  };

  // Filter items based on active view and filters
  const currentViewItems = items.filter((item) => {
    if (activeView === 'drive') {
      if (!user) return false;
      return item.ownerUsername?.toLowerCase() === user.username?.toLowerCase();
    }
    return true;
  });

  const filteredItems = currentViewItems.filter((item) => {
    const matchesFilter = filter === 'all' || item.fileType === filter;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.fileName.toLowerCase().includes(search.toLowerCase()) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())));
    return matchesFilter && matchesSearch;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes < 1024) return `${bytes || 0} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-neutral-100 flex flex-col selection:bg-sky-500/20 selection:text-white">
      {/* Toast Notification for CDN Copy */}
      <AnimatePresence>
        {copyToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-sky-500/90 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md border border-sky-400/30"
          >
            <Check className="w-4 h-4" />
            <span>{copyToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#07080a]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <AnytimeLogo size="md" showText={true} />
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] font-mono text-sky-400 font-medium">
              CloudDrive & CDN
            </span>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* System Updates Button */}
            <button
              onClick={() => setUpdatesOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-xs font-medium text-amber-300 transition-all cursor-pointer group"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>System Updates</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </button>

            {/* Database in Map Button */}
            <button
              onClick={() => setMapOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-neutral-200 transition-all cursor-pointer group"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">Database in Map</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Authenticated User Menu vs Guest Buttons */}
            {user ? (
              <div className="flex items-center gap-2">
                {/* Upload Button */}
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload</span>
                </button>

                {/* User Storage Pill */}
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-neutral-300">
                  <HardDrive className="w-3 h-3 text-sky-400" />
                  <span>{formatFileSize(user.storageUsed || 0)} used</span>
                </div>

                {/* User Avatar & Logout */}
                <div className="flex items-center gap-1.5 pl-1">
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
                    alt={user.username}
                    className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/[0.1]"
                  />
                  <button
                    onClick={handleUserLogout}
                    className="p-1.5 rounded-full bg-white/[0.04] hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Create CloudDrive</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* CloudDrive Hero / Status Bar if User is Logged In */}
        {user ? (
          <div className="mb-8 p-5 sm:p-6 rounded-3xl glass-panel border border-white/[0.08] relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-sky-400 font-semibold uppercase tracking-wider">
                    Personal CloudDrive
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-neutral-400 font-mono">Nodes: Kolkata • Israel • US</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Welcome, @{user.username}
                </h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Your files are distributed across your chosen cluster nodes with instant direct CDN endpoints.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all shadow-lg cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload to CloudDrive</span>
                </button>
              </div>
            </div>

            {/* Storage Progress Bar */}
            <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  Storage Used:{' '}
                  <strong className="text-white font-mono">{formatFileSize(user.storageUsed || 0)}</strong>
                </span>
                <span>&bull;</span>
                <span>
                  Total Files: <strong className="text-white font-mono">{user.filesCount || 0}</strong>
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Direct CDN URLs generated on your own domain
              </div>
            </div>
          </div>
        ) : (
          /* Non-logged in Welcome Banner */
          <div className="mb-8 p-5 sm:p-6 rounded-3xl glass-panel border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] font-semibold mb-2">
                <Sparkles className="w-3 h-3" />
                <span>Free Distributed Cloud Storage</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Store, Stream & Embed with Direct CDN URLs
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                Upload videos, images, and documents with instant CDN links hosted on our domain. Choose your storage node between Kolkata, Israel, and US.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setAuthModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all shadow-lg cursor-pointer"
              >
                Create Free Drive
              </button>
            </div>
          </div>
        )}

        {/* View Switcher & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher: My CloudDrive vs Public Stream */}
            {user && (
              <div className="flex rounded-2xl bg-white/[0.04] p-1 border border-white/[0.06]">
                <button
                  onClick={() => setActiveView('drive')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeView === 'drive'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <FolderLock className="w-3.5 h-3.5" />
                  <span>My CloudDrive</span>
                </button>
                <button
                  onClick={() => setActiveView('public')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeView === 'public'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Public Stream</span>
                </button>
              </div>
            )}

            {/* Filter Pills */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              {[
                { id: 'all', label: 'All' },
                { id: 'video', label: 'Videos', icon: Film },
                { id: 'image', label: 'Images', icon: ImageIcon },
                { id: 'pdf', label: 'Docs', icon: FileText },
              ].map((tab) => {
                const active = filter === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as any)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      active ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="filter-pill"
                        className="absolute inset-0 bg-white/[0.1] rounded-xl border border-white/[0.1]"
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                      />
                    )}
                    {Icon && <Icon className="w-3.5 h-3.5 relative z-10" />}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-white/20 focus:outline-none rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 transition-colors"
            />
          </div>
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-64 rounded-3xl bg-neutral-900/40 border border-white/[0.04] animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 px-4 glass-card rounded-3xl max-w-lg mx-auto border border-white/[0.06]">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4 text-neutral-500">
              <Cloud className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-neutral-200">
              {activeView === 'drive' ? 'Your CloudDrive is empty' : 'No media found'}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
              {activeView === 'drive'
                ? 'Upload your first file to get instant direct CDN streaming links.'
                : search
                ? 'No items match your search query.'
                : 'No public content has been shared yet.'}
            </p>

            {user ? (
              <button
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-xs font-semibold text-white shadow-md transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload to CloudDrive</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setAuthModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create CloudDrive Account</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const cdnStreamUrl = item.cdnUrl || `/api/cdn/${item.id}`;
              const isOwner = user && item.ownerUsername === user.username;
              const nodeLabel = getNodeBadge(item.targetNode);

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setSelectedItem(item)}
                  className="group cursor-pointer rounded-3xl glass-card overflow-hidden border border-white/[0.06] hover:border-white/[0.18] transition-all flex flex-col justify-between relative"
                >
                  {/* Media Preview Box */}
                  <div className="relative aspect-[16/10] bg-black/60 overflow-hidden flex items-center justify-center">
                    {item.fileType === 'video' && (
                      <>
                        <video
                          src={cdnStreamUrl}
                          preload="metadata"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 ml-0.5 fill-white" />
                          </div>
                        </div>
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-semibold text-sky-400 flex items-center gap-1 border border-white/[0.08]">
                          <Film className="w-3 h-3" />
                          <span>VIDEO</span>
                        </div>
                      </>
                    )}

                    {item.fileType === 'image' && (
                      <>
                        <img
                          src={cdnStreamUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-semibold text-emerald-400 flex items-center gap-1 border border-white/[0.08]">
                          <ImageIcon className="w-3 h-3" />
                          <span>IMAGE</span>
                        </div>
                      </>
                    )}

                    {item.fileType === 'pdf' && (
                      <div className="w-full h-full bg-gradient-to-tr from-pink-950/20 via-neutral-900 to-black flex flex-col items-center justify-center p-6 text-center group-hover:bg-black/80 transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <FileText className="w-6 h-6 text-pink-400" />
                        </div>
                        <span className="text-[11px] font-medium text-neutral-300 uppercase tracking-wider">
                          Document / PDF
                        </span>
                        <span className="text-[10px] text-neutral-500 mt-1">Tap to read inline</span>
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-semibold text-pink-400 flex items-center gap-1 border border-white/[0.08]">
                          <FileText className="w-3 h-3" />
                          <span>PDF</span>
                        </div>
                      </div>
                    )}

                    {/* Owner Tag Badge */}
                    {item.ownerUsername && (
                      <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono text-sky-300 border border-white/[0.08]">
                        @{item.ownerUsername}
                      </div>
                    )}

                    {/* Direct CDN Link Copy Button on Hover */}
                    <button
                      onClick={(e) => copyDirectCdn(e, item)}
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 backdrop-blur-md border shadow-lg transition-all cursor-pointer ${
                        copiedId === item.id
                          ? 'bg-emerald-500 text-white border-emerald-400 scale-105'
                          : 'bg-black/70 text-sky-300 hover:text-white hover:bg-black/90 border-white/20'
                      }`}
                      title="Copy Direct CDN URL on our domain"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>CDN Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Details Footer */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors truncate">
                          {item.title}
                        </h3>
                        {/* Target Node Badge */}
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-neutral-400">
                            {nodeLabel}
                          </span>
                        </div>
                      </div>

                      {/* Owner Delete Button */}
                      {isOwner && (
                        <button
                          onClick={(e) => handleDeleteMyItem(e, item)}
                          disabled={deletingId === item.id}
                          className="text-neutral-500 hover:text-red-400 transition-colors p-1 cursor-pointer shrink-0"
                          title="Remove from my CloudDrive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-400 mt-2.5 pt-2.5 border-t border-white/[0.05]">
                      <span className="flex items-center gap-1 text-[11px]">
                        <HardDrive className="w-3 h-3 text-neutral-500" />
                        {formatFileSize(item.fileSize)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        {formatDate(item.uploadedAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Upload Modal with Target Node Selector */}
      <AnimatePresence>
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUploadModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-7 z-10 border border-white/[0.1] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Upload to CloudDrive</h3>
                    <p className="text-xs text-neutral-400">
                      Select your target database node & generate direct CDN links.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setUploadModalOpen(false)}
                  className="p-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {uploadSuccess && (
                <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {uploadError && (
                <div className="mt-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="mt-5 space-y-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/[0.12] hover:border-white/30 rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                  <div className="flex flex-col items-center justify-center p-3 text-center">
                    <Upload className="w-6 h-6 text-neutral-500 group-hover:text-neutral-300 mb-1.5 transition-colors" />
                    <p className="text-xs text-neutral-200 font-medium">
                      {uploadFile ? uploadFile.name : 'Select or drag & drop media file'}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {uploadFile
                        ? `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB`
                        : 'Videos, Images, PDFs'}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="video/*,image/*,.pdf,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const f = e.target.files[0];
                        setUploadFile(f);
                        if (!uploadTitle) {
                          setUploadTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
                        }
                      }
                    }}
                  />
                </label>

                {/* Target Database Node Selector */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center justify-between">
                    <span>Target Database Node</span>
                    <span className="text-[10px] text-sky-400 font-mono">Location Choice</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Global Geo-Replicated', name: 'Global Multi-Cluster', sub: 'All 3 nodes synchronized', icon: '🌐' },
                      { id: 'Kolkata Node', name: 'Kolkata Node', sub: 'South Asia / APAC Edge', icon: '🇮🇳' },
                      { id: 'Israel Gateway', name: 'Israel Gateway', sub: 'EMEA / Encrypted Vault', icon: '🇮🇱' },
                      { id: 'US Central Core', name: 'US Central Core', sub: 'North America / Atlantic Core', icon: '🇺🇸' },
                    ].map((node) => {
                      const isSelected = selectedTargetNode === node.id;
                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => setSelectedTargetNode(node.id)}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-sky-500/15 border-sky-400/50 text-white shadow-sm'
                              : 'bg-white/[0.02] border-white/[0.06] text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{node.icon}</span>
                            <span className="text-xs font-semibold truncate">{node.name}</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 truncate mt-0.5">{node.sub}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Title / Caption
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Enter file title"
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-sky-500/50 focus:outline-none rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Tags <span className="text-neutral-500">(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    placeholder="e.g. photos, vacation, docs"
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-sky-500/50 focus:outline-none rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-60 transition-all cursor-pointer"
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Distributing to {selectedTargetNode}...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Generate CDN URL</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* System Updates Modal */}
      <SystemUpdatesModal
        isOpen={updatesOpen}
        onClose={() => setUpdatesOpen(false)}
        onSelectMedia={(mediaItem) => setSelectedItem(mediaItem)}
      />

      {/* User Auth Modal */}
      <UserAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authMode}
      />

      {/* Database in Map Modal */}
      <DatabaseMapModal isOpen={mapOpen} onClose={() => setMapOpen(false)} />

      {/* Media Viewer Modal */}
      <MediaViewerModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      {/* Clean Footer (strictly no admin button) */}
      <footer className="border-t border-white/[0.06] py-6 px-4 text-center text-xs text-neutral-500">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Distributed Object Storage &bull; Kolkata, Israel & US States</span>
        </div>
        <p className="text-[11px] text-neutral-600">
          AnytimeView CloudDrive &bull; High-Performance CDN Streaming &bull; &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
