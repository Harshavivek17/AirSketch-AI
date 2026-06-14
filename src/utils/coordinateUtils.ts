import { Point, HandLandmark } from '@/types';

/**
 * Convert MediaPipe normalized coordinates to canvas pixel coordinates.
 * Mirrors X-axis since camera is mirrored.
 */
export function landmarkToCanvas(
  landmark: HandLandmark,
  canvasWidth: number,
  canvasHeight: number
): Point {
  return {
    x: (1 - landmark.x) * canvasWidth,
    y: landmark.y * canvasHeight,
    timestamp: Date.now(),
  };
}

/**
 * Weighted moving average smoothing for a point buffer.
 */
export function smoothPoints(points: Point[], windowSize: number): Point {
  if (points.length === 0) {
    return { x: 0, y: 0, timestamp: Date.now() };
  }
  if (points.length === 1) {
    return { ...points[0] };
  }

  const size = Math.min(windowSize, points.length);
  const recent = points.slice(-size);
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (let i = 0; i < recent.length; i++) {
    // More recent points get higher weight
    const weight = (i + 1) / recent.length;
    weightedX += recent[i].x * weight;
    weightedY += recent[i].y * weight;
    totalWeight += weight;
  }

  return {
    x: weightedX / totalWeight,
    y: weightedY / totalWeight,
    timestamp: Date.now(),
  };
}

/**
 * Calculate distance between two points.
 */
export function distanceBetween(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

/**
 * Linear interpolation between two points.
 */
export function lerp(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    timestamp: Date.now(),
  };
}

/**
 * Generate intermediate points between two points using interpolation.
 * This fills gaps when finger moves too fast.
 */
export function interpolatePoints(a: Point, b: Point, maxSpacing: number): Point[] {
  const dist = distanceBetween(a, b);
  if (dist <= maxSpacing) return [b];

  const steps = Math.ceil(dist / maxSpacing);
  const points: Point[] = [];
  for (let i = 1; i <= steps; i++) {
    points.push(lerp(a, b, i / steps));
  }
  return points;
}

/**
 * Midpoint between two points for quadratic curve control point.
 */
export function midpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    timestamp: Date.now(),
  };
}

/**
 * Check if a point jump is too large (unstable detection).
 */
export function isJump(a: Point, b: Point, threshold: number = 150): boolean {
  return distanceBetween(a, b) > threshold;
}
