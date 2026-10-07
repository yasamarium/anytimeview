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
} from 'lucide-react';
import { AnytimeLogo } from '@/components/AnytimeLogo';
import { DatabaseMapModal } from '@/components/DatabaseMapModal';
import { MediaViewerModal } from '@/components/MediaViewerModal';
import { ViewItem } from '@/lib/db';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard state
  const [items, setItems] = useState<ViewItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<ViewItem | null>(null);

  // Upload Form state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Check initial auth status
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        loadItems();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
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
      loadItems();
    } catch (err: any) {
      setAuthError(err.message || 'Invalid passkey');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
    } catch (err) {
      console.error(err);
    }
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
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        // Strip extension for cleaner title suggestion
        const nameWithoutExt = selected.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadStep('Connecting to Kolkata ingestion node...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('tags', tags);

      // Visual step progressions
      setTimeout(() => setUploadStep('Replicating to Israel cryptographic ledger...'), 1200);
      setTimeout(() => setUploadStep('Syncing failover archive in US States...'), 2600);

      const res = await fetch('/api/items/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadSuccess('File successfully vaulted across Kolkata, Israel, and US nodes.');
      setFile(null);
      setTitle('');
      setTags('');
      loadItems();
    } catch (err: any) {
      setUploadError(err.message || 'Upload process failed');
    } finally {
      setUploading(false);
      setUploadStep(null);
    }
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${itemTitle}" from all distributed clusters?`)) {
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
      alert(err.message || 'Deletion error');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#07080a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Passkey Gate if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07080a] text-neutral-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md p-6 sm:p-8 rounded-3xl glass-card border border-white/[0.08] shadow-2xl text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Lock className="w-6 h-6 text-sky-400" />
          </div>

          <h1 className="text-xl font-bold text-white tracking-tight">Admin Gate</h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
            Enter passkey to manage media, documents, and distributed database cluster.
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
                placeholder="Enter passkey (e.g. 123as)"
                className="w-full bg-white/[0.04] border border-white/[0.1] focus:border-sky-400/50 focus:outline-none rounded-2xl pl-10 pr-4 py-3 text-sm text-center tracking-widest text-white placeholder:text-neutral-500 font-mono transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading || !passkeyInput}
              className="w-full py-3 rounded-2xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {authLoading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authenticate Node</span>
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

  // 2. Authenticated Admin Dashboard
  const videoCount = items.filter((i) => i.fileType === 'video').length;
  const imageCount = items.filter((i) => i.fileType === 'image').length;
  const pdfCount = items.filter((i) => i.fileType === 'pdf').length;

  return (
    <div className="min-h-screen bg-[#07080a] text-neutral-100 flex flex-col selection:bg-sky-500/20 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#07080a]/85 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <AnytimeLogo size="sm" showText={true} />
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] font-mono text-sky-400 font-semibold">
              ADMIN MODE
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMapOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-neutral-200 transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Database in Map</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-neutral-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>View Site</span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-white/[0.04] hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Cluster Status Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-3xl glass-card border border-white/[0.06]">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Total Assets</span>
              <HardDrive className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white">{items.length}</div>
            <div className="text-[10px] text-neutral-500 mt-1">Multi-region replicated</div>
          </div>

          <div className="p-4 rounded-3xl glass-card border border-white/[0.06]">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Videos</span>
              <Film className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white">{videoCount}</div>
            <div className="text-[10px] text-neutral-500 mt-1">Streamable clips</div>
          </div>

          <div className="p-4 rounded-3xl glass-card border border-white/[0.06]">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Images</span>
              <ImageIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{imageCount}</div>
            <div className="text-[10px] text-neutral-500 mt-1">High-res photos</div>
          </div>

          <div className="p-4 rounded-3xl glass-card border border-white/[0.06]">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Documents</span>
              <FileText className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-2xl font-bold text-white">{pdfCount}</div>
            <div className="text-[10px] text-neutral-500 mt-1">PDF & text files</div>
          </div>
        </div>

        {/* Upload Box Card */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/[0.08] shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
              <Upload className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Upload New Content</h2>
              <p className="text-xs text-neutral-400">
                Upload Videos, Images, or PDFs. Files are synchronized to Kolkata, Israel, and US nodes.
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
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/[0.12] hover:border-white/30 rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
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
                  placeholder="e.g. Annual Architecture Blueprint or Demo Video"
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
                  placeholder="e.g. demo, product, confidential"
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/20 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-neutral-200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-3 rounded-2xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>{uploadStep || 'Uploading to cluster...'}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Publish & Distribute to Nodes</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Manage Content List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Manage Distributed Content</h2>
            <button
              onClick={loadItems}
              disabled={loadingItems}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-xs text-neutral-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingItems ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingItems ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 rounded-2xl bg-neutral-900/40 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-card border border-white/[0.06] text-xs text-neutral-400">
              No files currently stored. Use the box above to upload your first asset.
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
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                        <span className="truncate max-w-[200px]">{item.fileName}</span>
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
                      onClick={() => setPreviewItem(item)}
                      className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition-colors"
                      title="Preview Inline"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition-colors"
                      title="Open Direct URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={deletingId === item.id}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                      title="Delete Asset from Clusters"
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
      </main>

      {/* Database in Map Modal */}
      <DatabaseMapModal isOpen={mapOpen} onClose={() => setMapOpen(false)} />

      {/* Media Viewer Modal */}
      <MediaViewerModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
}
