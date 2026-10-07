'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Globe,
  Radio,
  Server,
  ShieldCheck,
  Zap,
  RefreshCw,
  HardDrive,
  Activity,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { CLUSTER_NODES, ClusterNode } from '@/lib/config';

interface DatabaseMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DatabaseMapModal({ isOpen, onClose }: DatabaseMapModalProps) {
  const [selectedNode, setSelectedNode] = useState<ClusterNode>(CLUSTER_NODES[0]);
  const [isPinging, setIsPinging] = useState(false);
  const [pings, setPings] = useState<Record<string, number>>({
    'node-kolkata': 14,
    'node-israel': 24,
    'node-us': 36,
  });

  // Calculate coordinates on 1000x500 map canvas
  const getNodeCoords = (node: ClusterNode) => {
    const x = ((node.lng + 180) * 1000) / 360;
    const y = ((90 - node.lat) * 500) / 180;
    return { x, y };
  };

  const kolkataPos = getNodeCoords(CLUSTER_NODES[0]);
  const israelPos = getNodeCoords(CLUSTER_NODES[1]);
  const usPos = getNodeCoords(CLUSTER_NODES[2]);

  const triggerPingTest = () => {
    setIsPinging(true);
    setTimeout(() => {
      setPings({
        'node-kolkata': Math.floor(10 + Math.random() * 8),
        'node-israel': Math.floor(20 + Math.random() * 9),
        'node-us': Math.floor(32 + Math.random() * 10),
      });
      setIsPinging(false);
    }, 900);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative w-full max-w-5xl rounded-3xl glass-panel p-5 sm:p-7 text-white shadow-2xl z-10 border border-white/[0.1] my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500/20 via-indigo-500/20 to-emerald-500/20 border border-white/[0.1] flex items-center justify-center">
                  <Globe className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                      Database in Map
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      3 Active Nodes
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    High-availability geo-distributed database architecture across Kolkata, Israel, and US States.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={triggerPingTest}
                  disabled={isPinging}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-medium text-neutral-300 transition-all disabled:opacity-50"
                  title="Run Ping Test"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-sky-400' : ''}`} />
                  <span className="hidden sm:inline">Ping Mesh</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive World Map Canvas */}
            <div className="mt-5 relative w-full aspect-[2/1] rounded-2xl bg-[#090b10] border border-white/[0.08] overflow-hidden select-none">
              {/* Background Map Grid */}
              <svg
                viewBox="0 0 1000 500"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  {/* Grid Pattern */}
                  <pattern id="world-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.8" />
                  </pattern>

                  {/* Gradient for Lines */}
                  <linearGradient id="link-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                  </linearGradient>

                  {/* Node Glow Filters */}
                  <filter id="glow-kolkata" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.8" />
                  </filter>
                  <filter id="glow-israel" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.8" />
                  </filter>
                  <filter id="glow-us" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ec4899" floodOpacity="0.8" />
                  </filter>
                </defs>

                {/* Map Grid */}
                <rect width="1000" height="500" fill="url(#world-grid)" />

                {/* Simplified Continents Outlines */}
                <g fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.09)" strokeWidth="0.8">
                  {/* North America */}
                  <path d="M 120 70 Q 200 40 310 80 Q 320 130 260 170 Q 220 220 160 180 Q 110 130 120 70 Z" />
                  {/* South America */}
                  <path d="M 280 230 Q 340 250 360 320 Q 330 420 290 440 Q 260 360 270 270 Z" />
                  {/* Europe */}
                  <path d="M 470 70 Q 560 60 590 120 Q 550 160 480 150 Q 450 110 470 70 Z" />
                  {/* Africa */}
                  <path d="M 480 170 Q 580 170 590 270 Q 550 380 490 350 Q 450 260 480 170 Z" />
                  {/* Asia */}
                  <path d="M 600 70 Q 780 50 880 110 Q 890 220 780 250 Q 690 260 600 180 Z" />
                  {/* Australia */}
                  <path d="M 800 320 Q 890 310 900 380 Q 830 420 790 380 Z" />
                </g>

                {/* Connecting Replication Mesh Lines */}
                {/* US to Israel */}
                <path
                  d={`M ${usPos.x} ${usPos.y} Q 440 90 ${israelPos.x} ${israelPos.y}`}
                  fill="none"
                  stroke="url(#link-grad)"
                  strokeWidth="1.5"
                  className="animate-dash"
                />
                {/* Israel to Kolkata */}
                <path
                  d={`M ${israelPos.x} ${israelPos.y} Q 670 140 ${kolkataPos.x} ${kolkataPos.y}`}
                  fill="none"
                  stroke="url(#link-grad)"
                  strokeWidth="1.5"
                  className="animate-dash"
                />
                {/* US to Kolkata Transatlantic Arc */}
                <path
                  d={`M ${usPos.x} ${usPos.y} Q 520 280 ${kolkataPos.x} ${kolkataPos.y}`}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="1.2"
                  strokeDasharray="3 4"
                />

                {/* Node: US States */}
                <g
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => setSelectedNode(CLUSTER_NODES[2])}
                >
                  <circle cx={usPos.x} cy={usPos.y} r="18" fill="rgba(236, 72, 153, 0.12)" className="animate-radar" />
                  <circle cx={usPos.x} cy={usPos.y} r="6" fill="#ec4899" filter="url(#glow-us)" />
                  <circle cx={usPos.x} cy={usPos.y} r="2.5" fill="#ffffff" />
                  <text
                    x={usPos.x}
                    y={usPos.y - 12}
                    fill="#ec4899"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    US Node ({pings['node-us']}ms)
                  </text>
                </g>

                {/* Node: Israel */}
                <g
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => setSelectedNode(CLUSTER_NODES[1])}
                >
                  <circle cx={israelPos.x} cy={israelPos.y} r="18" fill="rgba(56, 189, 248, 0.12)" className="animate-radar" />
                  <circle cx={israelPos.x} cy={israelPos.y} r="6" fill="#38bdf8" filter="url(#glow-israel)" />
                  <circle cx={israelPos.x} cy={israelPos.y} r="2.5" fill="#ffffff" />
                  <text
                    x={israelPos.x}
                    y={israelPos.y - 12}
                    fill="#38bdf8"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    Israel ({pings['node-israel']}ms)
                  </text>
                </g>

                {/* Node: Kolkata */}
                <g
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => setSelectedNode(CLUSTER_NODES[0])}
                >
                  <circle cx={kolkataPos.x} cy={kolkataPos.y} r="18" fill="rgba(16, 185, 129, 0.12)" className="animate-radar" />
                  <circle cx={kolkataPos.x} cy={kolkataPos.y} r="6" fill="#10b981" filter="url(#glow-kolkata)" />
                  <circle cx={kolkataPos.x} cy={kolkataPos.y} r="2.5" fill="#ffffff" />
                  <text
                    x={kolkataPos.x}
                    y={kolkataPos.y - 12}
                    fill="#10b981"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    Kolkata ({pings['node-kolkata']}ms)
                  </text>
                </g>
              </svg>

              {/* Real-time Telemetry Pill Overlay */}
              <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/[0.1] flex items-center gap-2 text-[10px] text-neutral-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Mesh Sync: Kolkata ⇄ Israel ⇄ US States</span>
              </div>
            </div>

            {/* Interactive Node Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
              {CLUSTER_NODES.map((node) => {
                const active = selectedNode.id === node.id;
                const nodeColors = {
                  'node-kolkata': 'text-emerald-400 border-emerald-500/30',
                  'node-israel': 'text-sky-400 border-sky-500/30',
                  'node-us': 'text-pink-400 border-pink-500/30',
                };
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3 rounded-2xl text-left transition-all ${
                      active
                        ? `bg-white/[0.08] border ${nodeColors[node.id as keyof typeof nodeColors] || 'border-white/20'}`
                        : 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{node.name}</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-300">
                        {pings[node.id]} ms
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400">{node.location}</div>
                  </button>
                );
              })}
            </div>

            {/* Selected Node Detailed Metrics */}
            <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                    <Server className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedNode.name}</h3>
                    <p className="text-xs text-neutral-400">{selectedNode.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Uptime: <strong className="text-white">{selectedNode.uptime}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <Lock className="w-3.5 h-3.5 text-sky-400" />
                    <span>TLS 1.3 Encrypted</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium block">
                    Region & Geo
                  </span>
                  <span className="text-neutral-200 font-medium mt-0.5 block">{selectedNode.region}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium block">
                    Storage Protocol
                  </span>
                  <span className="text-neutral-200 font-medium mt-0.5 block">{selectedNode.storageProtocol}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium block">
                    Telemetry Status
                  </span>
                  <span className="text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Synchronized & Ready
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs text-neutral-400 bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                {selectedNode.description}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
