'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Film,
  Image as ImageIcon,
  HardDrive,
  Calendar,
  Maximize2,
  Globe,
} from 'lucide-react';
import { ViewItem } from '@/lib/db';

interface MediaViewerModalProps {
  item: ViewItem | null;
  onClose: () => void;
}

export function MediaViewerModal({ item, onClose }: MediaViewerModalProps) {
  const [pdfZoom, setPdfZoom] = useState(100);

  if (!item) return null;

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
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-5xl h-[90vh] max-h-[900px] rounded-3xl glass-panel p-4 sm:p-6 flex flex-col z-10 border border-white/[0.1] shadow-2xl overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] shrink-0">
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                {item.fileType === 'video' && <Film className="w-4 h-4 text-sky-400" />}
                {item.fileType === 'image' && <ImageIcon className="w-4 h-4 text-emerald-400" />}
                {item.fileType === 'pdf' && <FileText className="w-4 h-4 text-pink-400" />}
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-white truncate">
                  {item.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-neutral-500" />
                    {formatFileSize(item.fileSize)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-neutral-500" />
                    {formatDate(item.uploadedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={item.url}
                download={item.fileName}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-neutral-200 hover:text-white text-xs font-medium transition-all"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>

              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white transition-all"
                title="Open Direct Link"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white transition-colors"
                title="Close Viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Media Presentation Body */}
          <div className="flex-1 w-full min-h-0 py-4 flex items-center justify-center overflow-hidden">
            {item.fileType === 'video' && (
              <div className="w-full h-full flex items-center justify-center bg-black/60 rounded-2xl overflow-hidden border border-white/[0.05]">
                <video
                  src={item.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                />
              </div>
            )}

            {item.fileType === 'image' && (
              <div className="w-full h-full flex items-center justify-center bg-black/40 rounded-2xl p-2 overflow-auto border border-white/[0.05]">
                <img
                  src={item.url}
                  alt={item.title}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl select-none"
                />
              </div>
            )}

            {item.fileType === 'pdf' && (
              <div className="w-full h-full flex flex-col bg-neutral-950 rounded-2xl border border-white/[0.08] overflow-hidden">
                <iframe
                  src={`${item.url}#view=FitH`}
                  className="w-full flex-1 border-0 rounded-2xl bg-neutral-900"
                  title={item.title}
                />
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400 shrink-0">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-neutral-300 font-mono">
                Streamed via Distributed Nodes: Kolkata • Israel • US
              </span>
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-[50%]">
                {item.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px] text-neutral-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
