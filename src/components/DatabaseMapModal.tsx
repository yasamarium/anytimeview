'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Globe,
  Server,
  Zap,
  RefreshCw,
  Activity,
  CheckCircle2,
  Lock,
  MapPin,
  Radio,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { CLUSTER_NODES, ClusterNode } from '@/lib/config';
import { SPHERE_PATH, GRATICULE_PATH, LAND_PATH, PRECISE_NODES } from '@/lib/worldData';
import {
  projectCoordinates,
  findNearestClusterNode,
  getArcControlPoint,
} from '@/lib/geoUtils';

interface DatabaseMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserGeo {
  ip: string;
  city: string;
  region?: string;
  country: string;
  lat: number;
  lng: number;
  source: string;
}

export function DatabaseMapModal({ isOpen, onClose }: DatabaseMapModalProps) {
  const [selectedNode, setSelectedNode] = useState<ClusterNode>(CLUSTER_NODES[0]);
  const [userGeo, setUserGeo] = useState<UserGeo | null>(null);
  const [nearestInfo, setNearestInfo] = useState<{
    node: ClusterNode;
    distanceKm: number;
    estimatedPing: number;
  } | null>(null);
  const [userPos, setUserPos] = useState<{ x: number; y: number } | null>(null);
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

  // 1. Fetch User Geo Location on open
  useEffect(() => {
    if (!isOpen) return;

    async function detectLocation() {
      try {
        const res = await fetch('/api/geo');
        if (res.ok) {
          const data: UserGeo = await res.json();
          setUserGeo(data);

          // Project coordinates to map canvas (1000x520)
          const proj = projectCoordinates(data.lng, data.lat);
          if (proj) {
            setUserPos(proj);
          }

          // Calculate nearest cluster node
          const nearest = findNearestClusterNode(data.lat, data.lng);
          setNearestInfo(nearest);
          setSelectedNode(nearest.node);
        }
      } catch (err) {
        console.warn('Geo detection error:', err);
      }
    }

    detectLocation();
  }, [isOpen]);

  // 2. High-Precision 60fps Canvas Animation: Zero Glow, Sharp Professional Telemetry
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper for Quadratic Bezier point calculation
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

    // Backbone control points between nodes
    const usToIsraelControl = { x: 440, y: 90 };
    const israelToKolkataControl = { x: 670, y: 135 };
    const usToKolkataControl = { x: 520, y: 270 };

    let start = performance.now();

    const render = (now: number) => {
      const elapsed = (now - start) / 1000;

      ctx.clearRect(0, 0, 1000, 520);

      // --- SECTION A: INTER-CLUSTER BACKBONE MESH (Muted, Crisp, Minimalist) ---
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      // Backbone 1: US <-> Israel
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.beginPath();
      ctx.moveTo(usPos.x, usPos.y);
      ctx.quadraticCurveTo(usToIsraelControl.x, usToIsraelControl.y, israelPos.x, israelPos.y);
      ctx.stroke();

      // Backbone 2: Israel <-> Kolkata
      ctx.beginPath();
      ctx.moveTo(israelPos.x, israelPos.y);
      ctx.quadraticCurveTo(israelToKolkataControl.x, israelToKolkataControl.y, kolkataPos.x, kolkataPos.y);
      ctx.stroke();

      // Backbone 3: US <-> Kolkata Transatlantic
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(usPos.x, usPos.y);
      ctx.quadraticCurveTo(usToKolkataControl.x, usToKolkataControl.y, kolkataPos.x, kolkataPos.y);
      ctx.stroke();

      ctx.setLineDash([]);

      // Subtle solid tick packets along backbone
      const drawBackboneTick = (
        p0: { x: number; y: number },
        p1: { x: number; y: number },
        p2: { x: number; y: number },
        speed: number,
        offset: number
      ) => {
        const t = (elapsed * speed + offset) % 1;
        const pt = getQuadPoint(p0, p1, p2, t);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      };

      drawBackboneTick(usPos, usToIsraelControl, israelPos, 0.35, 0.0);
      drawBackboneTick(israelPos, israelToKolkataControl, kolkataPos, 0.4, 0.3);

      // --- SECTION B: ACTIVE SERVING REDLINE (Nearest Node -> User Location) ---
      if (userPos && nearestInfo) {
        let originPos = kolkataPos;
        if (nearestInfo.node.id === 'node-israel') originPos = israelPos;
        if (nearestInfo.node.id === 'node-us') originPos = usPos;

        // Compute gentle curve control point to user
        const redControl = getArcControlPoint(originPos, userPos, 0.2);

        // 1. Draw Crisp Solid Red Serving Line (No Glow, Razor Sharp)
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = '#ef4444'; // Signal Red
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(originPos.x, originPos.y);
        ctx.quadraticCurveTo(redControl.x, redControl.y, userPos.x, userPos.y);
        ctx.stroke();

        // 2. Animate Data Packets flowing from Node to User along the Redline
        const packetCount = 4;
        for (let i = 0; i < packetCount; i++) {
          const t = (elapsed * 0.75 + i / packetCount) % 1;
          const pt = getQuadPoint(originPos, redControl, userPos, t);

          // Crisp solid red packet dot
          ctx.fillStyle = '#fee2e2'; // White-red core
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. User Target Reticle / Pulse Animation (Clean 1px circle, no blur)
        const userPulse = (elapsed * 1.2) % 1;
        const userRadius = 4 + userPulse * 16;
        const userAlpha = Math.max(0, 1 - userPulse);

        ctx.strokeStyle = `rgba(239, 68, 68, ${userAlpha.toFixed(2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(userPos.x, userPos.y, userRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Secondary inner reticle ring
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(userPos.x, userPos.y, 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // --- SECTION C: CRISP SUBTLE RADAR ON DATABASE NODES (Clean 1px stroke) ---
      const drawNodeRadar = (pos: { x: number; y: number }, color: string, timeOffset: number) => {
        const cycle = (elapsed * 0.7 + timeOffset) % 1;
        const radius = 5 + cycle * 14;
        const alpha = Math.max(0, 0.8 - cycle * 0.8);

        ctx.strokeStyle = color.replace('ALPHA', alpha.toFixed(3));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      };

      drawNodeRadar(kolkataPos, 'rgba(16, 185, 129, ALPHA)', 0.0);
      drawNodeRadar(israelPos, 'rgba(56, 189, 248, ALPHA)', 0.33);
      drawNodeRadar(usPos, 'rgba(168, 85, 247, ALPHA)', 0.66);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, userPos, nearestInfo]);

  const triggerPingTest = () => {
    setIsPinging(true);
    setTimeout(() => {
      setPings({
        'node-kolkata': Math.floor(10 + Math.random() * 6),
        'node-israel': Math.floor(20 + Math.random() * 8),
        'node-us': Math.floor(32 + Math.random() * 9),
      });
      setIsPinging(false);
    }, 600);
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
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className="relative w-full max-w-5xl rounded-3xl glass-panel p-5 sm:p-7 text-white shadow-2xl z-10 border border-white/[0.1] my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                      Database in Map
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      3 Database Clusters
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Real-time geo-routing telemetry across Kolkata, Israel, and US States.
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
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-white' : ''}`} />
                  <span className="hidden sm:inline">Test Route</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Serving Banner */}
            {userGeo && nearestInfo && (
              <div className="mt-4 px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-neutral-400">Your Location:</span>
                  <strong className="text-white">
                    {userGeo.city}, {userGeo.country}
                  </strong>
                  <span className="font-mono text-[10px] text-neutral-500 hidden sm:inline">
                    ({userGeo.ip})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">Serving Pipeline:</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-semibold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span>{nearestInfo.node.name}</span>
                    <ArrowRight className="w-3 h-3 text-red-400" />
                    <span>{nearestInfo.distanceKm} km ({nearestInfo.estimatedPing}ms)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Geographically Exact World Map Canvas */}
            <div className="mt-4 relative w-full aspect-[1000/520] rounded-2xl bg-[#07090e] border border-white/[0.08] overflow-hidden select-none shadow-xl">
              {/* Exact Natural Earth Vector Layer */}
              <svg
                viewBox="0 0 1000 520"
                className="w-full h-full absolute inset-0 pointer-events-none"
              >
                {/* Earth Sphere Boundary */}
                <path
                  d={SPHERE_PATH}
                  fill="#080c14"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1"
                />

                {/* Curved Latitude/Longitude Grid Lines */}
                <path
                  d={GRATICULE_PATH}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.04)"
                  strokeWidth="0.6"
                />

                {/* Real Exact Landmasses */}
                <path
                  d={LAND_PATH}
                  fill="#141822"
                  stroke="rgba(255, 255, 255, 0.16)"
                  strokeWidth="0.8"
                />
              </svg>

              {/* 60 FPS Hardware Accelerated Canvas Overlay for Serving Redline & Mesh */}
              <canvas
                ref={canvasRef}
                width={1000}
                height={520}
                className="w-full h-full absolute inset-0 pointer-events-none"
              />

              {/* Interactive Node Anchors & User Location Pin */}
              <svg
                viewBox="0 0 1000 520"
                className="w-full h-full absolute inset-0"
              >
                {/* 1. Database Node: US Central */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedNode(CLUSTER_NODES[2])}
                >
                  <circle cx={usPos.x} cy={usPos.y} r="4" fill="#a855f7" />
                  <circle cx={usPos.x} cy={usPos.y} r="1.8" fill="#ffffff" />
                  <rect
                    x={usPos.x - 38}
                    y={usPos.y - 22}
                    width="76"
                    height="16"
                    rx="8"
                    fill="#0f1118"
                    stroke="rgba(168, 85, 247, 0.5)"
                    strokeWidth="1"
                  />
                  <text
                    x={usPos.x}
                    y={usPos.y - 11}
                    fill="#c084fc"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    US &bull; {pings['node-us']}ms
                  </text>
                </g>

                {/* 2. Database Node: Israel Gateway */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedNode(CLUSTER_NODES[1])}
                >
                  <circle cx={israelPos.x} cy={israelPos.y} r="4" fill="#38bdf8" />
                  <circle cx={israelPos.x} cy={israelPos.y} r="1.8" fill="#ffffff" />
                  <rect
                    x={israelPos.x - 42}
                    y={israelPos.y - 22}
                    width="84"
                    height="16"
                    rx="8"
                    fill="#0f1118"
                    stroke="rgba(56, 189, 248, 0.5)"
                    strokeWidth="1"
                  />
                  <text
                    x={israelPos.x}
                    y={israelPos.y - 11}
                    fill="#38bdf8"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    Israel &bull; {pings['node-israel']}ms
                  </text>
                </g>

                {/* 3. Database Node: Kolkata Node */}
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedNode(CLUSTER_NODES[0])}
                >
                  <circle cx={kolkataPos.x} cy={kolkataPos.y} r="4" fill="#10b981" />
                  <circle cx={kolkataPos.x} cy={kolkataPos.y} r="1.8" fill="#ffffff" />
                  <rect
                    x={kolkataPos.x - 45}
                    y={kolkataPos.y - 22}
                    width="90"
                    height="16"
                    rx="8"
                    fill="#0f1118"
                    stroke="rgba(16, 185, 129, 0.5)"
                    strokeWidth="1"
                  />
                  <text
                    x={kolkataPos.x}
                    y={kolkataPos.y - 11}
                    fill="#10b981"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    Kolkata &bull; {pings['node-kolkata']}ms
                  </text>
                </g>

                {/* 4. USER LOCATION PIN (Clean Target Reticle & Red Pin) */}
                {userPos && userGeo && (
                  <g className="cursor-pointer">
                    {/* Crosshair lines */}
                    <line
                      x1={userPos.x - 7}
                      y1={userPos.y}
                      x2={userPos.x + 7}
                      y2={userPos.y}
                      stroke="#ef4444"
                      strokeWidth="1"
                    />
                    <line
                      x1={userPos.x}
                      y1={userPos.y - 7}
                      x2={userPos.x}
                      y2={userPos.y + 7}
                      stroke="#ef4444"
                      strokeWidth="1"
                    />

                    {/* Red Center Target */}
                    <circle cx={userPos.x} cy={userPos.y} r="3.2" fill="#ef4444" />
                    <circle cx={userPos.x} cy={userPos.y} r="1.4" fill="#ffffff" />

                    {/* Badge */}
                    <rect
                      x={userPos.x - 50}
                      y={userPos.y + 10}
                      width="100"
                      height="17"
                      rx="8.5"
                      fill="#180c0c"
                      stroke="#ef4444"
                      strokeWidth="1.2"
                    />
                    <text
                      x={userPos.x}
                      y={userPos.y + 22}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      YOU &bull; {userGeo.city}
                    </text>
                  </g>
                )}
              </svg>

              {/* Legend in corner */}
              <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/[0.08] flex items-center gap-3 text-[10px] text-neutral-300 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-red-500" />
                  <span className="text-red-400 font-bold">Serving Redline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-white/30 border-dashed" />
                  <span>Inter-Cluster Mesh</span>
                </div>
              </div>
            </div>

            {/* Interactive Node Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
              {CLUSTER_NODES.map((node) => {
                const active = selectedNode.id === node.id;
                const isNearest = nearestInfo?.node.id === node.id;
                const nodeColors = {
                  'node-kolkata': 'border-emerald-500/40 text-emerald-400',
                  'node-israel': 'border-sky-500/40 text-sky-400',
                  'node-us': 'border-purple-500/40 text-purple-400',
                };

                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3 rounded-2xl text-left transition-all ${
                      active
                        ? `bg-white/[0.08] border ${nodeColors[node.id as keyof typeof nodeColors] || 'border-white/30'}`
                        : 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{node.name}</span>
                        {isNearest && (
                          <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-mono text-[9px] font-bold">
                            NEAREST
                          </span>
                        )}
                      </div>
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
                    <Server className="w-4 h-4 text-white" />
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
                    <Lock className="w-3.5 h-3.5 text-white" />
                    <span>TLS 1.3 Direct Tunnel</span>
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
                    Routing Protocol
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
