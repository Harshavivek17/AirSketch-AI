import { Point } from '@/types';

/**
 * Draw a multi-pass glowing stroke segment using quadratic Bézier curves.
 */
export function drawGlowStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  brushSize: number,
  glowIntensity: number
): void {
  if (points.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Pass 1: Outer glow (large blur, low opacity)
  ctx.globalAlpha = 0.15;
  ctx.shadowBlur = glowIntensity * 2;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize * 4;
  drawSmoothCurve(ctx, points);

  // Pass 2: Medium glow
  ctx.globalAlpha = 0.4;
  ctx.shadowBlur = glowIntensity;
  ctx.lineWidth = brushSize * 2;
  drawSmoothCurve(ctx, points);

  // Pass 3: Inner bright stroke
  ctx.globalAlpha = 1;
  ctx.shadowBlur = glowIntensity * 0.5;
  ctx.lineWidth = brushSize;
  drawSmoothCurve(ctx, points);

  // Pass 4: Core white highlight
  ctx.globalAlpha = 0.6;
  ctx.shadowBlur = 2;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = Math.max(1, brushSize * 0.4);
  drawSmoothCurve(ctx, points);

  ctx.restore();
}

/**
 * Draw a smooth curve through points using quadratic Bézier.
 */
function drawSmoothCurve(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  ctx.stroke();
}

/**
 * Draw eraser at a position.
 */
export function drawEraser(
  ctx: CanvasRenderingContext2D,
  point: Point,
  size: number
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(point.x, point.y, size * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draw the magnetic glowing cursor at the fingertip position.
 */
export function drawCursor(
  ctx: CanvasRenderingContext2D,
  point: Point,
  color: string,
  isDrawing: boolean
): void {
  ctx.save();

  // Outer glow ring
  const gradient = ctx.createRadialGradient(
    point.x, point.y, 0,
    point.x, point.y, isDrawing ? 25 : 18
  );
  gradient.addColorStop(0, color + '60');
  gradient.addColorStop(0.5, color + '20');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(point.x, point.y, isDrawing ? 25 : 18, 0, Math.PI * 2);
  ctx.fill();

  // Inner dot
  ctx.fillStyle = color;
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, isDrawing ? 5 : 3, 0, Math.PI * 2);
  ctx.fill();

  // Crosshair lines (subtle)
  ctx.strokeStyle = color + '40';
  ctx.lineWidth = 1;
  ctx.shadowBlur = 0;
  const size = isDrawing ? 12 : 8;

  ctx.beginPath();
  ctx.moveTo(point.x - size, point.y);
  ctx.lineTo(point.x - 4, point.y);
  ctx.moveTo(point.x + 4, point.y);
  ctx.lineTo(point.x + size, point.y);
  ctx.moveTo(point.x, point.y - size);
  ctx.lineTo(point.x, point.y - 4);
  ctx.moveTo(point.x, point.y + 4);
  ctx.lineTo(point.x, point.y + size);
  ctx.stroke();

  ctx.restore();
}

/**
 * Clear entire canvas.
 */
export function clearCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

/**
 * Save canvas as PNG file download.
 */
export function saveCanvasAsPNG(
  canvas: HTMLCanvasElement,
  filename: string = 'airsketch-drawing.png',
  transparent: boolean = true
): void {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d')!;

  if (!transparent) {
    tempCtx.fillStyle = '#0a0a0f';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  }

  tempCtx.drawImage(canvas, 0, 0);

  const link = document.createElement('a');
  link.download = filename;
  link.href = tempCanvas.toDataURL('image/png');
  link.click();
}

/**
 * Resize canvas to match video dimensions while respecting device pixel ratio.
 */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): void {
  const dpr = 1; // Use 1 for performance with drawing
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}
