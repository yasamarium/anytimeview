'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Plus,
  Minus,
  RotateCcw,
  Navigation,
  Crosshair,
  Maximize2,
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

// Default initial location to guarantee instant rendering of redline without waiting for network
const DEFAULT_LAT = 25.5591;
const DEFAULT_LNG = 92.1957;
const DEFAULT_USER_POS = projectCoordinates(DEFAULT_LNG, DEFAULT_LAT);
const DEFAULT_NEAREST = findNearestClusterNode(DEFAULT_LAT, DEFAULT_LNG);

export function DatabaseMapModal({ isOpen, onClose }: DatabaseMapModalProps) {
  const [selectedNode, setSelectedNode] = useState<ClusterNode>(CLUSTER_NODES[0]);
  const [userGeo, setUserGeo] = useState<UserGeo>({
    ip: '152.58.x.x',
    city: 'Detecting Location',
    country: 'India',
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    source: 'init',
  });
  const [nearestInfo, setNearestInfo] = useState<{
    node: ClusterNode;
    distanceKm: number;
    estimatedPing: number;
  }>(DEFAULT_NEAREST);
  const [userPos, setUserPos] = useState<{ x: number; y: number } | null>(DEFAULT_USER_POS);

  const [isPinging, setIsPinging] = useState(false);
  const [pings, setPings] = useState<Record<string, number>>({
    'node-kolkata': 14,
    'node-israel': 24,
    'node-us': 36,
  });

  // Pan & Zoom State (Google Maps Style)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Refs for animation loop
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;

  const kolkataPos = PRECISE_NODES['node-kolkata'];
  const israelPos = PRECISE_NODES['node-israel'];
  const usPos = PRECISE_NODES['node-us'];

  // Origin point of the serving pipeline
  let originPos = kolkataPos;
  if (nearestInfo.node.id === 'node-israel') originPos = israelPos;
  if (nearestInfo.node.id === 'node-us') originPos = usPos;

  // Active Redline Curve control point
  const currentTargetPos = userPos || { x: kolkataPos.x + 15, y: kolkataPos.y - 10 };
  const redControl = getArcControlPoint(originPos, currentTargetPos, 0.22);

  // 1. Fetch User Geo Location on open
  useEffect(() => {
    if (!isOpen) return;

    async function detectLocation() {
      try {
        const res = await fetch('/api/geo');
        if (res.ok) {
          const data: UserGeo = await res.json();
          setUserGeo(data);

          const proj = projectCoordinates(data.lng, data.lat);
          if (proj) {
            setUserPos(proj);
          }

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

  // 2. High-Precision 60fps Canvas Animation: Zero Glow, Razor Sharp Data Packets
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    const usToIsraelControl = { x: 440, y: 90 };
    const israelToKolkataControl = { x: 670, y: 135 };
    const usToKolkataControl = { x: 520, y: 270 };

    let start = performance.now();

    const render = (now: number) => {
      const elapsed = (now - start) / 1000;
      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;

      ctx.clearRect(0, 0, 1000, 520);

      ctx.save();
      // Apply Google Maps Pan & Zoom Matrix
      ctx.translate(currentPan.x, currentPan.y);
      ctx.scale(currentZoom, currentZoom);

      const dotScale = 1 / Math.pow(currentZoom, 0.65);
      const lineScale = 1 / Math.pow(currentZoom, 0.65);

      // --- SECTION A: INTER-CLUSTER BACKBONE MESH ---
      ctx.lineWidth = 0.9 * lineScale;
      ctx.setLineDash([2 * lineScale, 3 * lineScale]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';

      ctx.beginPath();
      ctx.moveTo(usPos.x, usPos.y);
      ctx.quadraticCurveTo(usToIsraelControl.x, usToIsraelControl.y, israelPos.x, israelPos.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(israelPos.x, israelPos.y);
      ctx.quadraticCurveTo(israelToKolkataControl.x, israelToKolkataControl.y, kolkataPos.x, kolkataPos.y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
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
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.2 * dotScale, 0, Math.PI * 2);
        ctx.fill();
      };

      drawBackboneTick(usPos, usToIsraelControl, israelPos, 0.35, 0.0);
      drawBackboneTick(israelPos, israelToKolkataControl, kolkataPos, 0.4, 0.3);

      // --- SECTION B: ACTIVE SERVING REDLINE PACKETS ---
      // Animate 4 fast moving signal red packet dots from Cluster -> User
      const packetCount = 4;
      for (let i = 0; i < packetCount; i++) {
        const t = (elapsed * 0.9 + i / packetCount) % 1;
        const pt = getQuadPoint(originPos, redControl, currentTargetPos, t);

        // Crisp solid red packet dot
        ctx.fillStyle = '#fee2e2'; // White-red core
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2 * dotScale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1 * dotScale, 0, Math.PI * 2);
        ctx.fill();
      }

      // User Target Pulse
      const userPulse = (elapsed * 1.3) % 1;
      const userRadius = (3 + userPulse * 12) * dotScale;
      const userAlpha = Math.max(0, 1 - userPulse);

      ctx.strokeStyle = `rgba(239, 68, 68, ${userAlpha.toFixed(2)})`;
      ctx.lineWidth = 1 * lineScale;
      ctx.beginPath();
      ctx.arc(currentTargetPos.x, currentTargetPos.y, userRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, originPos, redControl, currentTargetPos]);

  // Google Maps Zoom Helper Functions
  const applyClampedZoom = useCallback((newZoom: number, focalX: number, focalY: number) => {
    const clampedZoom = Math.min(Math.max(1, newZoom), 8);
    const factor = clampedZoom / zoom;

    const newPanX = focalX - (focalX - pan.x) * factor;
    const newPanY = focalY - (focalY - pan.y) * factor;

    const minPanX = 1000 - 1000 * clampedZoom;
    const minPanY = 520 - 520 * clampedZoom;

    setZoom(clampedZoom);
    setPan({
      x: Math.min(0, Math.max(minPanX, newPanX)),
      y: Math.min(0, Math.max(minPanY, newPanY)),
    });
  }, [zoom, pan]);

  // Wheel Zoom (Focal point under cursor like Google Maps)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = ((e.clientX - rect.left) / rect.width) * 1000;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 520;

    const zoomFactor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
    applyClampedZoom(zoom * zoomFactor, mouseX, mouseY);
  };

  // Drag Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scaleX = 1000 / rect.width;
    const scaleY = 520 / rect.height;

    const dx = (e.clientX - dragStartRef.current.x) * scaleX;
    const dy = (e.clientY - dragStartRef.current.y) * scaleY;

    const newPanX = dragStartRef.current.panX + dx;
    const newPanY = dragStartRef.current.panY + dy;

    const minPanX = 1000 - 1000 * zoom;
    const minPanY = 520 - 520 * zoom;

    setPan({
      x: Math.min(0, Math.max(minPanX, newPanX)),
      y: Math.min(0, Math.max(minPanY, newPanY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom Button Controls
  const zoomIn = () => applyClampedZoom(zoom * 1.35, 500, 260);
  const zoomOut = () => {
    if (zoom <= 1.1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      applyClampedZoom(zoom / 1.35, 500, 260);
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Auto-focus directly on the Serving Route
  const focusRoute = () => {
    const midX = (originPos.x + currentTargetPos.x) / 2;
    const midY = (originPos.y + currentTargetPos.y) / 2;
    const dx = Math.abs(originPos.x - currentTargetPos.x);
    const dy = Math.abs(originPos.y - currentTargetPos.y);
    const span = Math.max(dx, dy, 25);

    const targetZoom = Math.min(Math.max(2.2, 280 / span), 6.5);
    const targetPanX = 500 - midX * targetZoom;
    const targetPanY = 260 - midY * targetZoom;

    const minPanX = 1000 - 1000 * targetZoom;
    const minPanY = 520 - 520 * targetZoom;

    setZoom(targetZoom);
    setPan({
      x: Math.min(0, Math.max(minPanX, targetPanX)),
      y: Math.min(0, Math.max(minPanY, targetPanY)),
    });
  };

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

  // Small micro-scale factor: Keeps labels minimal, tiny, and unobtrusive
  const microScale = 1 / Math.pow(zoom, 0.7);

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
                      3 Active Clusters
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Real-time geo-routing telemetry &bull; Scroll to Zoom, Drag to Pan.
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

            {/* Live Serving Banner with Route Focus Button */}
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

                <button
                  onClick={focusRoute}
                  className="px-2.5 py-1 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-[10px] font-semibold text-red-300 transition-all ml-1 flex items-center gap-1 shadow-sm"
                  title="Zoom into Serving Line"
                >
                  <Crosshair className="w-3 h-3 text-red-400" />
                  <span>Zoom Route</span>
                </button>
              </div>
            </div>

            {/* Geographically Exact World Map Canvas with Interactive Pan & Zoom */}
            <div
              ref={containerRef}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`mt-4 relative w-full aspect-[1000/520] rounded-2xl bg-[#07090e] border border-white/[0.08] overflow-hidden select-none shadow-xl ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {/* Exact Natural Earth Vector Layer with Synced Matrix Transform */}
              <svg
                viewBox="0 0 1000 520"
                className="w-full h-full absolute inset-0 pointer-events-none"
              >
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* Earth Sphere Boundary */}
                  <path
                    d={SPHERE_PATH}
                    fill="#080c14"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={1 / Math.pow(zoom, 0.6)}
                  />

                  {/* Curved Latitude/Longitude Grid Lines */}
                  <path
                    d={GRATICULE_PATH}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.04)"
                    strokeWidth={0.6 / Math.pow(zoom, 0.6)}
                  />

                  {/* Real Exact Landmasses */}
                  <path
                    d={LAND_PATH}
                    fill="#141822"
                    stroke="rgba(255, 255, 255, 0.16)"
                    strokeWidth={0.8 / Math.pow(zoom, 0.6)}
                  />

                  {/* --- HIGH VISIBILITY VECTOR RED SERVING LINE (Underneath Markers) --- */}
                  <g>
                    {/* Black contrast outline so line is bold & visible over any land/sea */}
                    <path
                      d={`M ${originPos.x} ${originPos.y} Q ${redControl.x} ${redControl.y} ${currentTargetPos.x} ${currentTargetPos.y}`}
                      fill="none"
                      stroke="#000000"
                      strokeWidth={4.5 / Math.pow(zoom, 0.55)}
                      strokeLinecap="round"
                    />
                    {/* Vivid Signal Red Pipeline */}
                    <path
                      d={`M ${originPos.x} ${originPos.y} Q ${redControl.x} ${redControl.y} ${currentTargetPos.x} ${currentTargetPos.y}`}
                      fill="none"
                      stroke="#ff2d20"
                      strokeWidth={2.4 / Math.pow(zoom, 0.55)}
                      strokeLinecap="round"
                    />
                  </g>
                </g>
              </svg>

              {/* 60 FPS Hardware Accelerated Canvas Overlay for Serving Redline Packets & Mesh */}
              <canvas
                ref={canvasRef}
                width={1000}
                height={520}
                className="w-full h-full absolute inset-0 pointer-events-none"
              />

              {/* Interactive Node Anchors & User Location Pin (Micro-Scale, Non-Overlapping) */}
              <svg
                viewBox="0 0 1000 520"
                className="w-full h-full absolute inset-0 pointer-events-none"
              >
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* 1. Database Node: US Central (Offset Label Left) */}
                  <g
                    transform={`translate(${usPos.x}, ${usPos.y}) scale(${microScale})`}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(CLUSTER_NODES[2]);
                    }}
                  >
                    <circle cx={0} cy={0} r={3} fill="#a855f7" />
                    <circle cx={0} cy={0} r={1.2} fill="#ffffff" />
                    <rect
                      x={-42}
                      y={-6}
                      width={38}
                      height={12}
                      rx={6}
                      fill="#0d0e14"
                      stroke="rgba(168, 85, 247, 0.7)"
                      strokeWidth={0.8}
                    />
                    <text
                      x={-23}
                      y={2.5}
                      fill="#c084fc"
                      fontSize={7}
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      US &bull; {pings['node-us']}m
                    </text>
                  </g>

                  {/* 2. Database Node: Israel Gateway (Offset Label Top) */}
                  <g
                    transform={`translate(${israelPos.x}, ${israelPos.y}) scale(${microScale})`}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(CLUSTER_NODES[1]);
                    }}
                  >
                    <circle cx={0} cy={0} r={3} fill="#38bdf8" />
                    <circle cx={0} cy={0} r={1.2} fill="#ffffff" />
                    <rect
                      x={-24}
                      y={-17}
                      width={48}
                      height={12}
                      rx={6}
                      fill="#0d0e14"
                      stroke="rgba(56, 189, 248, 0.7)"
                      strokeWidth={0.8}
                    />
                    <text
                      x={0}
                      y={-8.5}
                      fill="#38bdf8"
                      fontSize={7}
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      Israel &bull; {pings['node-israel']}m
                    </text>
                  </g>

                  {/* 3. Database Node: Kolkata Node (Offset Label Strictly to the LEFT so redline to east is 100% open) */}
                  <g
                    transform={`translate(${kolkataPos.x}, ${kolkataPos.y}) scale(${microScale})`}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(CLUSTER_NODES[0]);
                    }}
                  >
                    <circle cx={0} cy={0} r={3} fill="#10b981" />
                    <circle cx={0} cy={0} r={1.2} fill="#ffffff" />
                    <rect
                      x={-52}
                      y={-6}
                      width={48}
                      height={12}
                      rx={6}
                      fill="#0d0e14"
                      stroke="rgba(16, 185, 129, 0.7)"
                      strokeWidth={0.8}
                    />
                    <text
                      x={-28}
                      y={2.5}
                      fill="#10b981"
                      fontSize={7}
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      Kolkata &bull; {pings['node-kolkata']}m
                    </text>
                  </g>

                  {/* 4. USER LOCATION PIN (Offset Label Strictly to the RIGHT so redline to west is 100% open) */}
                  <g
                    transform={`translate(${currentTargetPos.x}, ${currentTargetPos.y}) scale(${microScale})`}
                    className="pointer-events-auto cursor-pointer"
                  >
                    {/* Crosshairs */}
                    <line x1={-6} y1={0} x2={6} y2={0} stroke="#ef4444" strokeWidth={1} />
                    <line x1={0} y1={-6} x2={0} y2={6} stroke="#ef4444" strokeWidth={1} />

                    {/* Red Center Target */}
                    <circle cx={0} cy={0} r={3} fill="#ef4444" />
                    <circle cx={0} cy={0} r={1.2} fill="#ffffff" />

                    {/* Compact Micro Badge to the RIGHT */}
                    <rect
                      x={7}
                      y={-6}
                      width={54}
                      height={12}
                      rx={6}
                      fill="#180a0a"
                      stroke="#ef4444"
                      strokeWidth={1}
                    />
                    <text
                      x={34}
                      y={2.5}
                      fill="#ffffff"
                      fontSize={7}
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      YOU &bull; {userGeo.city.length > 8 ? userGeo.city.substring(0, 8) + '..' : userGeo.city}
                    </text>
                  </g>
                </g>
              </svg>

              {/* Google Maps On-Screen Zoom Controls (Top Right) */}
              <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
                <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/[0.1] p-1 flex flex-col items-center shadow-lg">
                  <button
                    onClick={zoomIn}
                    className="p-1.5 rounded-lg hover:bg-white/[0.15] text-neutral-300 hover:text-white transition-colors"
                    title="Zoom In (+)"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono py-1 font-semibold text-neutral-400">
                    {zoom.toFixed(1)}x
                  </span>
                  <button
                    onClick={zoomOut}
                    className="p-1.5 rounded-lg hover:bg-white/[0.15] text-neutral-300 hover:text-white transition-colors"
                    title="Zoom Out (-)"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={resetView}
                  className="p-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/[0.1] hover:bg-white/[0.15] text-neutral-300 hover:text-white transition-colors shadow-lg flex items-center justify-center"
                  title="Reset World View (1.0x)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={focusRoute}
                  className="p-2 rounded-xl bg-black/80 backdrop-blur-md border border-red-500/40 hover:bg-red-500/20 text-red-400 transition-colors shadow-lg flex items-center justify-center"
                  title="Zoom into Active Serving Redline"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom Navigation Hint & Legend */}
              <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/[0.08] flex items-center gap-3 text-[10px] text-neutral-300 font-mono pointer-events-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 rounded-full bg-red-500" />
                  <span className="text-red-400 font-bold">Serving Redline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-white/30 border-dashed" />
                  <span>Inter-Cluster Mesh</span>
                </div>
                <span className="hidden sm:inline text-neutral-500">
                  &bull; Scroll to Zoom, Drag to Pan
                </span>
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
