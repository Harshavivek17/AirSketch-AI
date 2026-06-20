import { useCallback, useRef } from 'react';
import { Point, Stroke, AppSettings } from '@/types';
import { drawGlowStroke, drawEraser, clearCanvas } from '@/utils/canvasUtils';
import { smoothPoints, distanceBetween, isJump, interpolatePoints } from '@/utils/coordinateUtils';

interface StrokeState {
  points: Point[];
  smoothingBuffer: Point[];
  lastDrawnPoint: Point | null;
}

interface UseSmoothDrawingReturn {
  addPoint: (point: Point, settings: AppSettings, handKey?: string) => void;
  endStroke: (handKey?: string) => void;
  undo: () => void;
  clear: (canvas: HTMLCanvasElement) => void;
  redrawAll: (canvas: HTMLCanvasElement) => void;
  getStrokeCount: () => number;
  activeStrokes: React.MutableRefObject<Record<string, StrokeState>>;
}

// Helper to shift color for dual hand drawing
export function getShiftedColor(hex: string, shiftDegrees: number = 140): string {
  if (!hex || hex.length < 7) return '#FF00FF';
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    // Shift hue
    h = (h + shiftDegrees / 360) % 1.0;

    // Convert back to RGB
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let rNew, gNew, bNew;
    if (s === 0) {
      rNew = gNew = bNew = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      rNew = hue2rgb(p, q, h + 1/3);
      gNew = hue2rgb(p, q, h);
      bNew = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n * 255))).toString(16).padStart(2, '0');
    return `#${toHex(rNew)}${toHex(gNew)}${toHex(bNew)}`;
  } catch {
    return '#FF00FF';
  }
}

// Generate color based on rainbow mode (time-based HSL)
export function getRainbowColor(timeMs: number): string {
  const hue = (timeMs / 25) % 360;
  return `hsl(${hue}, 100%, 60%)`;
}

export function useSmoothDrawing(): UseSmoothDrawingReturn {
  const strokesRef = useRef<Stroke[]>([]);
  
  // Track independent stroke states for multi-hand support (e.g. Left/Right)
  const activeStrokesRef = useRef<Record<string, StrokeState>>({
    Left: { points: [], smoothingBuffer: [], lastDrawnPoint: null },
    Right: { points: [], smoothingBuffer: [], lastDrawnPoint: null },
  });

  const addPoint = useCallback((point: Point, settings: AppSettings, handKey: string = 'Right') => {
    let strokeState = activeStrokesRef.current[handKey];
    if (!strokeState) {
      strokeState = { points: [], smoothingBuffer: [], lastDrawnPoint: null };
      activeStrokesRef.current[handKey] = strokeState;
    }

    const buffer = strokeState.smoothingBuffer;
    buffer.push(point);

    // Keep buffer within window size
    const windowSize = Math.max(2, settings.smoothing);
    if (buffer.length > windowSize * 2) {
      buffer.splice(0, buffer.length - windowSize * 2);
    }

    // Apply weighted moving average
    const smoothed = smoothPoints(buffer, windowSize);

    // Check for jumps
    const lastPoint = strokeState.lastDrawnPoint;
    if (lastPoint && isJump(lastPoint, smoothed, 800)) {
      // Reset stroke on massive jump (tracking glitch)
      endStroke(handKey);
      strokeState.smoothingBuffer = [point];
      strokeState.lastDrawnPoint = null;
      return;
    }

    if (settings.drawingMode === 'eraser') {
      strokeState.points.push(smoothed);
      strokeState.lastDrawnPoint = smoothed;
      return;
    }

    // Push the point directly. 
    // We do NOT interpolate here because pushing multiple points instantly
    // causes the renderer (which only draws the last 8 points) to skip the gap!
    // The quadratic curve drawer in canvasUtils will naturally bridge fast gaps.
    strokeState.points.push(smoothed);
    strokeState.lastDrawnPoint = smoothed;
  }, []);

  const endStroke = useCallback((handKey: string = 'Right') => {
    const strokeState = activeStrokesRef.current[handKey];
    if (strokeState) {
      strokeState.points = [];
      strokeState.smoothingBuffer = [];
      strokeState.lastDrawnPoint = null;
    }
  }, []);

  const drawCurrentStroke = useCallback(
    (ctx: CanvasRenderingContext2D, settings: AppSettings, handKey?: string) => {
      const drawSingle = (key: string, strokeColor: string) => {
        const strokeState = activeStrokesRef.current[key];
        if (!strokeState) return;
        const points = strokeState.points;
        if (points.length < 1) return;

        if (settings.drawingMode === 'eraser') {
          const lastPoint = points[points.length - 1];
          drawEraser(ctx, lastPoint, settings.brushSize);
          return;
        }

        // Draw the most recent segment for performance
        if (points.length >= 2) {
          const segmentSize = Math.min(8, points.length);
          const segment = points.slice(-segmentSize);
          drawGlowStroke(ctx, segment, strokeColor, settings.brushSize, settings.glowIntensity);
        }
      };

      const baseColor = settings.rainbowBrush 
        ? getRainbowColor(performance.now()) 
        : settings.strokeColor;

      if (handKey) {
        const strokeColor = handKey === 'Left' ? getShiftedColor(baseColor) : baseColor;
        drawSingle(handKey, strokeColor);
      } else {
        Object.keys(activeStrokesRef.current).forEach((key) => {
          const strokeColor = key === 'Left' ? getShiftedColor(baseColor) : baseColor;
          drawSingle(key, strokeColor);
        });
      }
    },
    []
  );

  const undo = useCallback(() => {
    strokesRef.current.pop();
  }, []);

  const clear = useCallback((canvas: HTMLCanvasElement) => {
    clearCanvas(canvas);
    strokesRef.current = [];
    Object.keys(activeStrokesRef.current).forEach((key) => {
      activeStrokesRef.current[key] = { points: [], smoothingBuffer: [], lastDrawnPoint: null };
    });
  }, []);

  const redrawAll = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    clearCanvas(canvas);
    for (const stroke of strokesRef.current) {
      if (stroke.isEraser) {
        for (const p of stroke.points) {
          drawEraser(ctx, p, stroke.brushSize);
        }
      } else {
        drawGlowStroke(ctx, stroke.points, stroke.color, stroke.brushSize, stroke.glowIntensity);
      }
    }
  }, []);

  const getStrokeCount = useCallback(() => strokesRef.current.length, []);

  return {
    addPoint,
    endStroke,
    undo,
    clear,
    redrawAll,
    getStrokeCount,
    // @ts-expect-error - exposed for the render loop
    drawCurrentStroke,
    activeStrokes: activeStrokesRef,
    strokesRef,
  };
}
