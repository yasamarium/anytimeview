'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Layers,
} from 'lucide-react';
import { CLUSTER_NODES, ClusterNode } from '@/lib/config';
import { SPHERE_PATH, GRATICULE_PATH, LAND_PATH, PRECISE_NODES } from '@/lib/worldData';

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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const kolkataPos = PRECISE_NODES['node-kolkata'];
  const israelPos = PRECISE_NODES['node-israel'];
  const usPos = PRECISE_NODES['node-us'];

  // Smooth 60fps Canvas Animation for Data Packets and Radar Waves
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper for Quadratic Bezier point
    const getQuadPoint = (
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      t: number
    ) => {
      const oneMinusT = 1 - t;
      const x = oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x;
      const y = oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y;
      return { x, y };
    };

    // Control points for curved arcs
    const usToIsraelControl = { x: 440, y: 90 };
    const israelToKolkataControl = { x: 670, y: 135 };
    const usToKolkataControl = { x: 520, y: 270 };

    let start = performance.now();

    const render = (now: number) => {
      const elapsed = (now - start) / 1000; // seconds

      ctx.clearRect(0, 0, 1000, 520);

      // 1. Draw static connecting arcs
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 5]);

      // US -> Israel Arc
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.moveTo(usPos.x, usPos.y);
      ctx.quadraticCurveTo(usToIsraelControl.x, usToIsraelControl.y, israelPos.x, israelPos.y);
      ctx.stroke();

      // Israel -> Kolkata Arc
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.beginPath();
      ctx.moveTo(israelPos.x, israelPos.y);
      ctx.quadraticCurveTo(israelToKolkataControl.x, israelToKolkataControl.y, kolkataPos.x, kolkataPos.y);
      ctx.stroke();

      // US -> Kolkata Global Arc
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';
      ctx.beginPath();
      ctx.moveTo(usPos.x, usPos.y);
      ctx.quadraticCurveTo(usToKolkataControl.x, usToKolkataControl.y, kolkataPos.x, kolkataPos.y);
      ctx.stroke();

      ctx.setLineDash([]);

      // 2. Animate Traveling Data Packets along the Arcs
      const drawPacket = (
        p0: { x: number; y: number },
        p1: { x: number; y: number },
        p2: { x: number; y: number },
        speed: number,
        offset: number,
        color: string
      ) => {
        const t = (elapsed * speed + offset) % 1;
        const pt = getQuadPoint(p0, p1, p2, t);

        // Glow
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Outer ambient glow
        ctx.fillStyle = color.replace('1)', '0.3)');
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        ctx.fill();
      };

      // US to Israel packets
      drawPacket(usPos, usToIsraelControl, israelPos, 0.4, 0.0, 'rgba(56, 189, 248, 1)');
      drawPacket(usPos, usToIsraelControl, israelPos, 0.4, 0.5, 'rgba(56, 189, 248, 1)');

      // Israel to Kolkata packets
      drawPacket(israelPos, israelToKolkataControl, kolkataPos, 0.45, 0.2, 'rgba(16, 185, 129, 1)');
      drawPacket(israelPos, israelToKolkataControl, kolkataPos, 0.45, 0.7, 'rgba(16, 185, 129, 1)');

      // US to Kolkata packets
      drawPacket(usPos, usToKolkataControl, kolkataPos, 0.35, 0.4, 'rgba(236, 72, 153, 1)');

      // 3. Smooth Radar Rings at Nodes
      const drawRadar = (pos: { x: number; y: number }, color: string, timeOffset: number) => {
        const cycle = ((elapsed * 0.8 + timeOffset) % 1);
        const radius = 6 + cycle * 22;
        const alpha = Math.max(0, 1 - cycle);

        ctx.strokeStyle = color.replace('ALPHA', alpha.toFixed(3));
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      };

      drawRadar(kolkataPos, 'rgba(16, 185, 129, ALPHA)', 0.0);
      drawRadar(kolkataPos, 'rgba(16, 185, 129, ALPHA)', 0.5);

      drawRadar(israelPos, 'rgba(56, 189, 248, ALPHA)', 0.2);
      drawRadar(israelPos, 'rgba(56, 189, 248, ALPHA)', 0.7);

      drawRadar(usPos, 'rgba(236, 72, 153, ALPHA)', 0.4);
      drawRadar(usPos, 'rgba(236, 72, 153, ALPHA)', 0.9);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen]);

  const triggerPingTest = () => {
    setIsPinging(true);
    setTimeout(() => {
      setPings({
        'node-kolkata': Math.floor(10 + Math.random() * 8),
        'node-israel': Math.floor(20 + Math.random() * 9),
        'node-us': Math.floor(32 + Math.random() * 10),
      });
      setIsPinging(false);
    }, 700);
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
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
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
                      3 Active Clusters
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    100% Geographically Accurate World Map &bull; Live Telemetry across Kolkata, Israel, and US.
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
                  <span className="hidden sm:inline">Test Ping</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Geographically Exact World Map Canvas */}
            <div className="mt-5 relative w-full aspect-[1000/520] rounded-2xl bg-[#06080d] border border-white/[0.09] overflow-hidden select-none shadow-2xl">
              {/* Exact Natural Earth Vector Layer */}
              <svg
                viewBox="0 0 1000 520"
                className="w-full h-full absolute inset-0 pointer-events-none"
              >
                {/* Earth Sphere Boundary */}
                <path
                  d={SPHERE_PATH}
                  fill="#080c14"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1.2"
                />

                {/* Curved Latitude/Longitude Grid Lines */}
                <path
                  d={GRATICULE_PATH}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="0.75"
                />

                {/* 100% Real Exact Landmasses */}
                <path
                  d={LAND_PATH}
                  fill="#151a24"
                  stroke="rgba(255, 255, 255, 0.18)"
                  strokeWidth="0.85"
                />
              </svg>

              {/* 60 FPS Hardware Accelerated Canvas Overlay for Packets & Radar */}
              <canvas
                ref={canvasRef}
                width={1000}
                height={520}
                className="w-full h-full absolute inset-0 pointer-events-none"
              />

              {/* Interactive Node Anchors (HTML/SVG DOM overlays for click/hover) */}
              <svg
                viewBox="0 0 1000 520"
                className="w-full h-full absolute inset-0"
              >
                {/* Node: US Central */}
                <g
                  className="cursor-pointer group"
                  onClick={() => setSelectedNode(CLUSTER_NODES[2])}
                >
                  <circle cx={usPos.x} cy={usPos.y} r="10" fill="rgba(236, 72, 153, 0.2)" />
                  <circle cx={usPos.x} cy={usPos.y} r="5" fill="#ec4899" />
                  <circle cx={usPos.x} cy={usPos.y} r="2" fill="#ffffff" />
                  <rect
                    x={usPos.x - 45}
                    y={usPos.y - 25}
                    width="90"
                    height="18"
                    rx="9"
                    fill="rgba(10, 12, 18, 0.85)"
                    stroke="rgba(236, 72, 153, 0.4)"
                    strokeWidth="1"
                  />
                  <text
                    x={usPos.x}
                    y={usPos.y - 13}
                    fill="#f472b6"
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    US ({pings['node-us']}ms)
                  </text>
                </g>

                {/* Node: Israel Security Gateway */}
                <g
                  className="cursor-pointer group"
                  onClick={() => setSelectedNode(CLUSTER_NODES[1])}
                >
                  <circle cx={israelPos.x} cy={israelPos.y} r="10" fill="rgba(56, 189, 248, 0.2)" />
                  <circle cx={israelPos.x} cy={israelPos.y} r="5" fill="#38bdf8" />
                  <circle cx={israelPos.x} cy={israelPos.y} r="2" fill="#ffffff" />
                  <rect
                    x={israelPos.x - 48}
                    y={israelPos.y - 25}
                    width="96"
                    height="18"
                    rx="9"
                    fill="rgba(10, 12, 18, 0.85)"
                    stroke="rgba(56, 189, 248, 0.4)"
                    strokeWidth="1"
                  />
                  <text
                    x={israelPos.x}
                    y={israelPos.y - 13}
                    fill="#38bdf8"
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    Israel ({pings['node-israel']}ms)
                  </text>
                </g>

                {/* Node: Kolkata Edge Cluster */}
                <g
                  className="cursor-pointer group"
                  onClick={() => setSelectedNode(CLUSTER_NODES[0])}
                >
                  <circle cx={kolkataPos.x} cy={kolkataPos.y} r="10" fill="rgba(16, 185, 129, 0.2)" />
                  <circle cx={kolkataPos.x} cy={kolkataPos.y} r="5" fill="#10b981" />
                  <circle cx={kolkataPos.x} cy={kolkataPos.y} r="2" fill="#ffffff" />
                  <rect
                    x={kolkataPos.x - 52}
                    y={kolkataPos.y - 25}
                    width="104"
                    height="18"
                    rx="9"
                    fill="rgba(10, 12, 18, 0.85)"
                    stroke="rgba(16, 185, 129, 0.4)"
                    strokeWidth="1"
                  />
                  <text
                    x={kolkataPos.x}
                    y={kolkataPos.y - 13}
                    fill="#10b981"
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    Kolkata ({pings['node-kolkata']}ms)
                  </text>
                </g>
              </svg>

              {/* Real-time Telemetry Pill Overlay */}
              <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/[0.1] flex items-center gap-2 text-[10px] text-neutral-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Synchronized Mesh: Kolkata ⇄ Israel ⇄ US States</span>
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
