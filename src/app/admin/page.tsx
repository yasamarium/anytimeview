'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  KeyRound,
  Upload,
  Trash2,
  ExternalLink,
  Eye,
  Globe,
  ArrowLeft,
  LogOut,
  CheckCircle2,
  AlertCircle,
  FileText,
  Film,
  Image as ImageIcon,
  HardDrive,
  Calendar,
  Sparkles,
  Server,
  RefreshCw,
  Users,
  Copy,
  Check,
  ShieldAlert,
  Database,
  Radio,
  Bell,
  Send,
  Wrench,
  Info,
  Layers,
} from 'lucide-react';
import { AnytimeLogo } from '@/components/AnytimeLogo';
import { DatabaseMapModal } from '@/components/DatabaseMapModal';
import { MediaViewerModal } from '@/components/MediaViewerModal';
import { ViewItem, SystemUpdate } from '@/lib/db';
import { CLUSTER_NODES } from '@/lib/config';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string;
  avatarUrl: string;
  createdAt: string;
  storageUsed: number;
  filesCount: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'files' | 'users' | 'updates' | 'upload' | 'nodes'>('files');

  // Dashboard state
  const [items, setItems] = useState<ViewItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [systemUpdates, setSystemUpdates] = useState<SystemUpdate[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<ViewItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Direct Upload Form state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [uploadNode, setUploadNode] = useState('Global Geo-Replicated');
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // System Update Broadcast Form state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastType, setBroadcastType] = useState<'announcement' | 'feature' | 'maintenance' | 'media'>('announcement');
  const [broadcastNode, setBroadcastNode] = useState('Global Geo-Replicated');
  const [broadcastFile, setBroadcastFile] = useState<File | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [deletingUpdateId, setDeletingUpdateId] = useState<string | null>(null);

  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingUsername, setDeletingUsername] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        loadAllData();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const loadAllData = () => {
    loadItems();
    loadUsers();
    loadUpdates();
  };

  const loadItems = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUpdates = async () => {
    setLoadingUpdates(true);
    try {
      const res = await fetch('/api/updates');
      const data = await res.json();
      if (data.updates) {
        setSystemUpdates(data.updates);
      }
    } catch (err) {
      console.error('Failed to load system updates:', err);
    } finally {
      setLoadingUpdates(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: passkeyInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Access denied');
      }

      setIsAuthenticated(true);
      setPasskeyInput('');
      loadAllData();
    } catch (err: any) {
      setAuthError(err.message || 'Invalid security passkey');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setItems([]);
      setUsers([]);
      setSystemUpdates([]);
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadStep(`Distributing to ${uploadNode}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('tags', tags);
      formData.append('targetNode', uploadNode);

      const res = await fetch('/api/items/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cluster distribution failed');
      }

      setUploadSuccess(`"${data.item.title}" successfully synchronized and logged to System Updates!`);
      setFile(null);
      setTitle('');
      setTags('');
      loadItems();
      loadUpdates();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload asset');
    } finally {
      setUploading(false);
      setUploadStep(null);
    }
  };

  const handlePublishBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() && !broadcastContent.trim() && !broadcastFile) {
      alert('Please provide a title, message, or file to broadcast.');
      return;
    }

    setBroadcasting(true);
    setBroadcastError(null);
    setBroadcastSuccess(null);

    try {
      const formData = new FormData();
      formData.append('title', broadcastTitle.trim() || 'System Announcement');
      formData.append('content', broadcastContent.trim());
      formData.append('type', broadcastType);
      formData.append('targetNode', broadcastNode);
      if (broadcastFile) {
        formData.append('file', broadcastFile);
      }

      const res = await fetch('/api/updates', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish system update');
      }

      setBroadcastSuccess('System update successfully broadcasted to live feed!');
      setBroadcastTitle('');
      setBroadcastContent('');
      setBroadcastFile(null);
      loadUpdates();
      loadItems();
    } catch (err: any) {
      setBroadcastError(err.message || 'Broadcast error');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    if (!confirm('Are you sure you want to remove this system update?')) return;

    setDeletingUpdateId(id);
    try {
      const res = await fetch(`/api/updates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      setSystemUpdates((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingUpdateId(null);
    }
  };

  const handleDeleteItem = async (id: string, itemTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${itemTitle}" from all clusters?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete');
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Are you sure you want to delete user @${username}? This action is irreversible.`)) {
      return;
    }

    setDeletingUsername(username);
    try {
      const res = await fetch(`/api/admin/users/${username}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }
      setUsers((prev) => prev.filter((u) => u.username !== username));
    } catch (err: any) {
      alert(`User delete error: ${err.message}`);
    } finally {
      setDeletingUsername(null);
    }
  };

  const copyCdnLink = (item: ViewItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const directUrl = `${origin}/api/cdn/${item.id}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatFileSize = (bytes: number) => {
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
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const totalStorageBytes = items.reduce((acc, item) => acc + (item.fileSize || 0), 0);
  const videoCount = items.filter((i) => i.fileType === 'video').length;
  const imageCount = items.filter((i) => i.fileType === 'image').length;

  // 1. Loading State
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#07080a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Unauthenticated: Passkey Authentication (STRICT, NO EXPOSED PASSKEY)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07080a] flex items-center justify-center p-4 selection:bg-sky-500/20 selection:text-white">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm rounded-3xl glass-panel p-8 text-center border border-white/[0.08] shadow-2xl relative overflow-hidden"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-sky-400" />
          </div>

          <h1 className="text-xl font-bold text-white tracking-tight">Security Access</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Authorize administrative console to manage distributed storage nodes, broadcasts & users.
          </p>

          {authError && (
            <div className="mt-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                required
                autoFocus
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                placeholder="Enter security passkey"
                className="w-full bg-white/[0.04] border border-white/[0.1] focus:border-sky-400/50 focus:outline-none rounded-2xl pl-10 pr-4 py-3 text-sm text-center tracking-widest text-white placeholder:text-neutral-500 font-mono transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading || !passkeyInput}
              className="w-full py-3 rounded-2xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {authLoading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authenticate Console</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <Link
              href="/"
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Stream</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. Full Control Admin Dashboard
  return (
    <div className="min-h-screen bg-[#07080a] text-neutral-100 flex flex-col selection:bg-sky-500/20 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#07080a]/85 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <AnytimeLogo size="sm" showText={true} />
            </Link>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono text-rose-400 font-semibold tracking-wider">
              FULL CONTROL CONSOLE
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMapOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-neutral-200 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Database in Map</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-neutral-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>View Site</span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-white/[0.04] hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Sign Out of Console"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Console */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-3xl glass-card border border-white/[0.06]">
            <div className="flex items-center justify-between text-neutral-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider">Total Assets</span>
              <HardDrive className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white">{items.length}</div>
            <div className="text-[10px] text-neutral-400 mt-1">{formatFileSize(totalStorageBytes)} replicated</div>
          </div>

          <div className="p-4 rounded-3xl glass-card border border-white/[0.06]">
            <div className="flex items-center justify-between text-neutral-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider">Cloud Users</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <div className="text-[10px] text-neutral-400 mt-1">Active drive accounts</div>
          </div>

          <div className="p-4 rounded-3xl glass-card border border-white/[0.06]">
            <div className="flex items-center justify-between text-neutral-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider">System Updates</span>
              <Bell className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{systemUpdates.length}</div>
            <div className="text-[10px] text-neutral-400 mt-1">Live broadcasts posted</div>
          </div>

          <div className="p-4 rounded-3xl glass-card border border-white/[0.06]">
            <div className="flex items-center justify-between text-neutral-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider">Storage Nodes</span>
              <Radio className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">3 / 3 Online</div>
            <div className="text-[10px] text-neutral-400 mt-1">Kolkata &bull; Israel &bull; US</div>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto">
          {[
            { id: 'files', label: 'All Files & CDN Links', icon: HardDrive, count: items.length },
            { id: 'updates', label: 'System Updates & Broadcasts', icon: Bell, count: systemUpdates.length },
            { id: 'users', label: 'CloudDrive Users', icon: Users, count: users.length },
            { id: 'upload', label: 'Direct Cluster Upload', icon: Upload },
            { id: 'nodes', label: 'Edge Nodes & Health', icon: Server, count: 3 },
          ].map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-white text-black shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                      active ? 'bg-black/10 text-black' : 'bg-white/[0.08] text-neutral-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: ALL FILES & CDN CONTROLS */}
        {activeTab === 'files' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Distributed Storage Vault</h2>
                <p className="text-xs text-neutral-400">
                  Full control over all platform assets. Direct CDN links stream on your own domain.
                </p>
              </div>
              <button
                onClick={loadItems}
                disabled={loadingItems}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-xs text-neutral-300 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingItems ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingItems ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-16 rounded-2xl bg-neutral-900/40 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center rounded-3xl glass-card border border-white/[0.06] text-xs text-neutral-400">
                No files found on storage nodes. Use the Direct Upload tab to add items.
              </div>
            ) : (
              <div className="rounded-3xl glass-card border border-white/[0.06] overflow-hidden divide-y divide-white/[0.05]">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                        {item.fileType === 'video' && <Film className="w-5 h-5 text-sky-400" />}
                        {item.fileType === 'image' && <ImageIcon className="w-5 h-5 text-emerald-400" />}
                        {item.fileType === 'pdf' && <FileText className="w-5 h-5 text-pink-400" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white truncate">{item.title}</h3>
                          <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/[0.08] text-neutral-300">
                            {item.fileType}
                          </span>
                          {item.ownerUsername && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                              @{item.ownerUsername}
                            </span>
                          )}
                          {item.targetNode && (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-neutral-400">
                              {item.targetNode}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                          <span className="truncate max-w-[200px] text-neutral-400">{item.fileName}</span>
                          <span>&bull;</span>
                          <span>{formatFileSize(item.fileSize)}</span>
                          <span>&bull;</span>
                          <span>{formatDate(item.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => copyCdnLink(item)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          copiedId === item.id
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.08] text-neutral-200'
                        }`}
                        title="Copy Direct CDN Link"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>CDN Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-sky-400" />
                            <span>Copy CDN</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setPreviewItem(item)}
                        className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                        title="Preview Media"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id, item.title)}
                        disabled={deletingId === item.id}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Delete from Cluster"
                      >
                        {deletingId === item.id ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SYSTEM UPDATES & BROADCASTS */}
        {activeTab === 'updates' && (
          <div className="space-y-6">
            {/* Post Broadcast Form */}
            <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/[0.08] shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Broadcast System Update</h2>
                  <p className="text-xs text-neutral-400">
                    Publish announcements, release notes, or text updates visible to all users.
                  </p>
                </div>
              </div>

              {broadcastSuccess && (
                <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{broadcastSuccess}</span>
                </div>
              )}

              {broadcastError && (
                <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{broadcastError}</span>
                </div>
              )}

              <form onSubmit={handlePublishBroadcast} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                      Broadcast Title
                    </label>
                    <input
                      type="text"
                      required
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. Node Latency Optimization Complete"
                      className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-amber-400/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                      Update Category
                    </label>
                    <select
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value as any)}
                      className="w-full bg-neutral-900 border border-white/[0.08] focus:border-amber-400/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white"
                    >
                      <option value="announcement">Announcement / General</option>
                      <option value="feature">Feature Release</option>
                      <option value="maintenance">Maintenance Note</option>
                      <option value="media">Media Release</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                    Announcement Message / Text Content
                  </label>
                  <textarea
                    rows={4}
                    value={broadcastContent}
                    onChange={(e) => setBroadcastContent(e.target.value)}
                    placeholder="Write your system update message here. Supports multi-line announcements and release notes..."
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-amber-400/50 focus:outline-none rounded-xl p-3.5 text-xs text-white placeholder:text-neutral-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                      Associated Node
                    </label>
                    <select
                      value={broadcastNode}
                      onChange={(e) => setBroadcastNode(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/[0.08] focus:border-amber-400/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white"
                    >
                      <option value="Global Geo-Replicated">🌐 Global Multi-Cluster (All Nodes)</option>
                      <option value="Kolkata Node">🇮🇳 Kolkata Node (APAC)</option>
                      <option value="Israel Gateway">🇮🇱 Israel Gateway (EMEA)</option>
                      <option value="US Central Core">🇺🇸 US Central Core (Atlantic)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                      Attach Media File <span className="text-neutral-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="file"
                      accept="video/*,image/*,.pdf,application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setBroadcastFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/[0.08] file:text-white hover:file:bg-white/[0.15] cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={broadcasting}
                  className="w-full py-3 rounded-2xl bg-amber-400 text-black font-semibold text-xs hover:bg-amber-300 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-400/10"
                >
                  {broadcasting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Broadcasting across nodes...</span>
                    </div>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish to System Updates</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Broadcast History List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Broadcast History</h3>
                <button
                  onClick={loadUpdates}
                  disabled={loadingUpdates}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-xs text-neutral-300 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingUpdates ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingUpdates ? (
                <div className="space-y-2">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-16 rounded-2xl bg-neutral-900/40 animate-pulse" />
                  ))}
                </div>
              ) : systemUpdates.length === 0 ? (
                <div className="p-8 text-center rounded-3xl glass-card border border-white/[0.06] text-xs text-neutral-400">
                  No system updates published yet.
                </div>
              ) : (
                <div className="rounded-3xl glass-card border border-white/[0.06] overflow-hidden divide-y divide-white/[0.05]">
                  {systemUpdates.map((update) => (
                    <div
                      key={update.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {update.type}
                          </span>
                          <span className="text-xs font-semibold text-white">{update.title}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {formatDate(update.createdAt)}
                          </span>
                        </div>
                        {update.content && (
                          <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line line-clamp-2">
                            {update.content}
                          </p>
                        )}
                        {update.item && (
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black/40 text-[11px] text-sky-300 border border-white/[0.06]">
                            <span>📎 {update.item.title}</span>
                            <span>&bull;</span>
                            <span className="text-neutral-400">{update.item.fileType}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDeleteUpdate(update.id)}
                          disabled={deletingUpdateId === update.id}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors disabled:opacity-50 cursor-pointer"
                          title="Delete Broadcast"
                        >
                          {deletingUpdateId === update.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CLOUD USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">CloudDrive Users Ledger</h2>
                <p className="text-xs text-neutral-400">
                  Manage registered accounts on anytimeview-users cluster repository.
                </p>
              </div>
              <button
                onClick={loadUsers}
                disabled={loadingUsers}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-xs text-neutral-300 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                <span>Refresh Users</span>
              </button>
            </div>

            {loadingUsers ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-2xl bg-neutral-900/40 animate-pulse" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center rounded-3xl glass-card border border-white/[0.06] text-xs text-neutral-400">
                No CloudDrive users registered yet. New signups will appear here automatically.
              </div>
            ) : (
              <div className="rounded-3xl glass-card border border-white/[0.06] overflow-hidden divide-y divide-white/[0.05]">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={u.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`}
                        alt={u.username}
                        className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">@{u.username}</h3>
                          {u.name && <span className="text-xs text-neutral-400 font-normal">({u.name})</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                          <span className="text-neutral-400">{u.email}</span>
                          <span>&bull;</span>
                          <span className="text-sky-300 font-mono">{formatFileSize(u.storageUsed)} used</span>
                          <span>&bull;</span>
                          <span>{u.filesCount || 0} files</span>
                          <span>&bull;</span>
                          <span>Joined {formatDate(u.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleDeleteUser(u.username)}
                        disabled={deletingUsername === u.username}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                        title="Purge user account"
                      >
                        {deletingUsername === u.username ? (
                          <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Delete User</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DIRECT CLUSTER UPLOAD */}
        {activeTab === 'upload' && (
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/[0.08] shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                <Upload className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Direct Cluster Ingestion</h2>
                <p className="text-xs text-neutral-400">
                  Upload video, audio, images, or PDFs directly to Kolkata, Israel, and US storage nodes.
                </p>
              </div>
            </div>

            {uploadSuccess && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {uploadError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Drag & Drop File Picker */}
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-white/[0.12] hover:border-white/30 rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                  <Upload className="w-8 h-8 text-neutral-500 group-hover:text-neutral-300 mb-2 transition-colors" />
                  <p className="text-xs text-neutral-200 font-medium">
                    {file ? file.name : 'Click to select or drag & drop media file'}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    {file
                      ? `${(file.size / 1024 / 1024).toFixed(2)} MB • ${file.type || 'Binary'}`
                      : 'MP4, WebM, PNG, JPG, WebP, PDF documents'}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="video/*,image/*,.pdf,application/pdf"
                  onChange={handleFileChange}
                />
              </label>

              {/* Node choice */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                  Target Storage Node
                </label>
                <select
                  value={uploadNode}
                  onChange={(e) => setUploadNode(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/[0.08] focus:border-white/20 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white"
                >
                  <option value="Global Geo-Replicated">🌐 Global Multi-Cluster (All 3 Nodes)</option>
                  <option value="Kolkata Node">🇮🇳 Kolkata Node (APAC Edge)</option>
                  <option value="Israel Gateway">🇮🇱 Israel Gateway (EMEA Vault)</option>
                  <option value="US Central Core">🇺🇸 US Central Core (Atlantic)</option>
                </select>
              </div>

              {/* Title & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                    Title / Caption
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter asset title"
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/20 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-neutral-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1 px-1">
                    Tags <span className="text-neutral-500 lowercase">(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. documentation, media, showcase"
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/20 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-neutral-200"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full py-3 rounded-2xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>{uploadStep || 'Uploading to cluster...'}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Publish & Synchronize Across Nodes</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: EDGE NODES & CLUSTER HEALTH */}
        {activeTab === 'nodes' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CLUSTER_NODES.map((node) => (
              <div
                key={node.id}
                className="p-5 rounded-3xl glass-card border border-white/[0.08] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {node.uptime} Uptime
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{node.name}</h3>
                  <p className="text-xs text-sky-400 font-mono mt-0.5">{node.location}</p>
                  <p className="text-xs text-neutral-400 mt-2.5 leading-relaxed">{node.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] text-neutral-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Latency:</span>
                    <span className="text-emerald-400 font-mono">~{node.pingMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protocol:</span>
                    <span className="text-neutral-300 truncate max-w-[150px]">{node.storageProtocol}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Database in Map Modal */}
      <DatabaseMapModal isOpen={mapOpen} onClose={() => setMapOpen(false)} />

      {/* Media Viewer Modal */}
      <MediaViewerModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
}
