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
  Lock,
  Play,
  HardDrive,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { AnytimeLogo } from '@/components/AnytimeLogo';
import { DatabaseMapModal } from '@/components/DatabaseMapModal';
import { MediaViewerModal } from '@/components/MediaViewerModal';
import { ViewItem } from '@/lib/db';

export default function HomePage() {
  const [items, setItems] = useState<ViewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'video' | 'image' | 'pdf'>('all');
  const [search, setSearch] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ViewItem | null>(null);

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

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesFilter = filter === 'all' || item.fileType === filter;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.fileName.toLowerCase().includes(search.toLowerCase()) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())));
    return matchesFilter && matchesSearch;
  });

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

  return (
    <div className="min-h-screen bg-[#07080a] text-neutral-100 flex flex-col selection:bg-sky-500/20 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#07080a]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <AnytimeLogo size="md" showText={true} />
          </Link>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Database in Map Button */}
            <button
              onClick={() => setMapOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-neutral-200 transition-all group"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">Database in Map</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Admin Keyhole Link */}
            <Link
              href="/admin"
              className="p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] text-neutral-400 hover:text-white transition-all"
              title="Admin Console (/admin)"
            >
              <Lock className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Sub-header & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] self-start">
            {[
              { id: 'all', label: 'All Content' },
              { id: 'video', label: 'Videos', icon: Film },
              { id: 'image', label: 'Images', icon: ImageIcon },
              { id: 'pdf', label: 'Documents', icon: FileText },
            ].map((tab) => {
              const active = filter === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
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

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search content..."
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
          <div className="text-center py-24 px-4 glass-card rounded-3xl max-w-lg mx-auto border border-white/[0.06]">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4 text-neutral-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-neutral-200">No media found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
              {search
                ? 'No items match your search query.'
                : 'No content has been published yet. Check back soon or upload via admin.'}
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-white transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Go to Admin Portal</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setSelectedItem(item)}
                className="group cursor-pointer rounded-3xl glass-card overflow-hidden border border-white/[0.06] hover:border-white/[0.18] transition-all flex flex-col justify-between"
              >
                {/* Media Preview Box */}
                <div className="relative aspect-[16/10] bg-black/60 overflow-hidden flex items-center justify-center">
                  {item.fileType === 'video' && (
                    <>
                      <video
                        src={item.url}
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
                        src={item.url}
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

                  <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors truncate">
                    {item.title}
                  </h3>

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
            ))}
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-white/[0.06] py-6 px-4 text-center text-xs text-neutral-500">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Distributed across Kolkata, Israel & US States nodes</span>
        </div>
        <p className="text-[11px] text-neutral-600">
          AnytimeView &copy; {new Date().getFullYear()} &bull; Minimalist Stream & Document Vault
        </p>
      </footer>

      {/* Database in Map Modal */}
      <DatabaseMapModal isOpen={mapOpen} onClose={() => setMapOpen(false)} />

      {/* Media Viewer Modal */}
      <MediaViewerModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
