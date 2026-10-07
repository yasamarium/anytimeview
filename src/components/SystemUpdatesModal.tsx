'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  Sparkles,
  Calendar,
  Radio,
  FileText,
  Film,
  Image as ImageIcon,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Wrench,
  Info,
  Layers,
} from 'lucide-react';
import { SystemUpdate, ViewItem } from '@/lib/db';

interface SystemUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia?: (item: ViewItem) => void;
}

export function SystemUpdatesModal({ isOpen, onClose, onSelectMedia }: SystemUpdatesModalProps) {
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUpdates();
    }
  }, [isOpen]);

  const loadUpdates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/updates');
      const data = await res.json();
      if (data.updates) {
        setUpdates(data.updates);
      }
    } catch (err) {
      console.error('Failed to load system updates:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyCdnLink = (item: ViewItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}/api/cdn/${item.id}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'feature':
        return {
          label: 'Feature Release',
          icon: Sparkles,
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
      case 'maintenance':
        return {
          label: 'Maintenance',
          icon: Wrench,
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
      case 'media':
        return {
          label: 'System Media',
          icon: Layers,
          color: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        };
      default:
        return {
          label: 'Announcement',
          icon: Info,
          color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        };
    }
  };

  const getNodeFlag = (node?: string) => {
    if (!node) return '🌐 Global Multi-Cluster';
    if (node.includes('Kolkata')) return '🇮🇳 Kolkata Node';
    if (node.includes('Israel')) return '🇮🇱 Israel Gateway';
    if (node.includes('US')) return '🇺🇸 US Central Core';
    return `🌐 ${node}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-3xl max-h-[85vh] rounded-3xl glass-panel p-5 sm:p-7 flex flex-col z-10 border border-white/[0.1] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white">System Updates</h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">LIVE BROADCAST</span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Platform releases, announcements, and administrative node broadcasts.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto py-5 space-y-4 pr-1">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-28 rounded-2xl bg-neutral-900/40 animate-pulse" />
                ))}
              </div>
            ) : updates.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-3xl glass-card border border-white/[0.06]">
                <Radio className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white">No announcements published yet</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                  Administrative broadcasts and new feature releases will appear here in real-time.
                </p>
              </div>
            ) : (
              updates.map((update) => {
                const badge = getTypeBadge(update.type);
                const BadgeIcon = badge.icon;
                const nodeLabel = getNodeFlag(update.targetNode);

                return (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-3xl glass-card border border-white/[0.08] hover:border-white/[0.15] transition-all space-y-3"
                  >
                    {/* Top Row: Category, Date, Node */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-neutral-300 border border-white/[0.06]">
                          {nodeLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        <span>{formatDate(update.createdAt)}</span>
                      </div>
                    </div>

                    {/* Update Title */}
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      {update.title}
                    </h3>

                    {/* Text Message Content */}
                    {update.content && (
                      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                        {update.content}
                      </p>
                    )}

                    {/* Attached Media Asset */}
                    {update.item && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                            {update.item.fileType === 'video' && <Film className="w-5 h-5 text-sky-400" />}
                            {update.item.fileType === 'image' && (
                              <ImageIcon className="w-5 h-5 text-emerald-400" />
                            )}
                            {update.item.fileType === 'pdf' && (
                              <FileText className="w-5 h-5 text-pink-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-white truncate">
                              {update.item.title}
                            </h4>
                            <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                              {update.item.fileName} &bull; {(update.item.fileSize / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {/* Copy CDN */}
                          <button
                            onClick={() => copyCdnLink(update.item!)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                              copiedId === update.item.id
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.08] text-neutral-200'
                            }`}
                          >
                            {copiedId === update.item.id ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-sky-400" />
                                <span>Copy CDN</span>
                              </>
                            )}
                          </button>

                          {/* Preview Media */}
                          {onSelectMedia && (
                            <button
                              onClick={() => {
                                onSelectMedia(update.item!);
                                onClose();
                              }}
                              className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                              title="Preview Media"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Author & Tags */}
                    <div className="pt-2 flex items-center justify-between text-[11px] text-neutral-400 border-t border-white/[0.04]">
                      <span className="flex items-center gap-1 text-sky-400 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                        <span>{update.author || 'System Admin'}</span>
                      </span>

                      {update.tags && update.tags.length > 0 && (
                        <div className="flex items-center gap-1 overflow-x-auto">
                          {update.tags.map((t, idx) => (
                            <span key={idx} className="text-[10px] text-neutral-400">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-white/[0.06] text-center text-[11px] text-neutral-400 shrink-0">
            Broadcasting via Distributed Cluster Protocol &bull; Kolkata &bull; Israel &bull; US Nodes
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
