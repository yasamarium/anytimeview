import { geoNaturalEarth1 } from 'd3-geo';
import { CLUSTER_NODES, ClusterNode } from './config';

const projection = geoNaturalEarth1().fitSize([1000, 520], { type: 'Sphere' });

export function projectCoordinates(lng: number, lat: number): { x: number; y: number } | null {
  const coords = projection([lng, lat]);
  if (!coords) return null;
  return {
    x: Math.round(coords[0] * 10) / 10,
    y: Math.round(coords[1] * 10) / 10,
  };
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function findNearestClusterNode(
  userLat: number,
  userLng: number
): { node: ClusterNode; distanceKm: number; estimatedPing: number } {
  let nearestNode = CLUSTER_NODES[0];
  let minDistance = Infinity;

  for (const node of CLUSTER_NODES) {
    const dist = calculateDistanceKm(userLat, userLng, node.lat, node.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestNode = node;
    }
  }

  // Estimated network propagation ping: base ~6ms + ~1.5ms per 100km
  const estimatedPing = Math.max(8, Math.round(6 + (minDistance / 100) * 1.4));

  return {
    node: nearestNode,
    distanceKm: minDistance,
    estimatedPing,
  };
}

/**
 * Compute gentle curve control point between two 2D points on the map
 */
export function getArcControlPoint(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  curvature: number = 0.25
): { x: number; y: number } {
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Normal vector pointing upwards
  const nx = -dy / dist;
  const ny = dx / dist;

  // Offset control point perpendicular to line
  const offset = dist * curvature;

  // Pull upward on the map canvas (negative Y)
  const sign = ny < 0 ? 1 : -1;

  return {
    x: midX + nx * offset * 0.5,
    y: midY + sign * Math.abs(offset),
  };
}
