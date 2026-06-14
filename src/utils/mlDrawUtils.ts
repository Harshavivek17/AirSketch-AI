import {
  HandLandmark,
  PoseLandmark,
  FaceLandmark,
  HAND_CONNECTIONS,
  POSE_CONNECTIONS,
  LANDMARK_INDICES,
  POSE_LANDMARK_NAMES,
  LIPS_OUTER_CONNECTIONS,
  LIPS_INNER_CONNECTIONS,
  GestureType,
} from '@/types';

const HAND_COLORS = ['#00FFFF', '#FF00AA'];
const FINGER_NAMES = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
const FINGER_TIPS = [
  LANDMARK_INDICES.THUMB_TIP,
  LANDMARK_INDICES.INDEX_TIP,
  LANDMARK_INDICES.MIDDLE_TIP,
  LANDMARK_INDICES.RING_TIP,
  LANDMARK_INDICES.PINKY_TIP,
];

function tx(x: number, w: number): number {
  return (1 - x) * w; // mirror
}
function ty(y: number, h: number): number {
  return y * h;
}

export function drawMLSkeletons(
  ctx: CanvasRenderingContext2D,
  data: {
    hands: HandLandmark[][];
    handedness: string[];
    pose: PoseLandmark[] | null;
    face: FaceLandmark[] | null;
  },
  gesture: GestureType,
  mouthState: 'neutral' | 'open' | 'smile' | 'pursed',
  w: number,
  h: number
) {
  const { hands, handedness, pose, face } = data;

  // 1. Draw body pose skeleton
  if (pose) {
    drawPoseSkeleton(ctx, pose, w, h);
  }

  // 2. Draw face mesh & lips contour
  if (face) {
    drawFaceSkeleton(ctx, face, w, h, mouthState);
  }

  // 3. Draw each hand
  for (let hIndex = 0; hIndex < hands.length; hIndex++) {
    const landmarks = hands[hIndex];
    const color = HAND_COLORS[hIndex % HAND_COLORS.length];
    const label = handedness[hIndex] || `Hand ${hIndex + 1}`;

    drawHandSkeleton(ctx, landmarks, color, w, h);
    drawFingerLabels(ctx, landmarks, color, w, h);
    drawHandLabel(ctx, landmarks, label, color, w, h);
    drawConfidenceArc(ctx, landmarks, color, w, h, hIndex);
    drawMotionTrails(ctx, landmarks, color, w, h);
  }

  // 4. Draw info panel
  drawInfoPanel(ctx, hands, handedness, gesture, w, h, pose, face, mouthState);
}

/* ═══════════ Internal Drawing Helpers ═══════════ */

function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  lm: HandLandmark[],
  color: string,
  w: number,
  h: number
) {
  for (const [start, end] of HAND_CONNECTIONS) {
    const a = lm[start];
    const b = lm[end];
    if (!a || !b) continue;
    const depth = (Math.abs(a.z) + Math.abs(b.z)) / 2;
    const alpha = Math.max(0.15, 0.6 - depth * 3);

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 6;
    ctx.shadowColor = color;
    ctx.moveTo(tx(a.x, w), ty(a.y, h));
    ctx.lineTo(tx(b.x, w), ty(b.y, h));
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  for (let i = 0; i < lm.length; i++) {
    const l = lm[i];
    const x = tx(l.x, w);
    const y = ty(l.y, h);
    const isTip = FINGER_TIPS.includes(i as any);
    const isWrist = i === LANDMARK_INDICES.WRIST;
    const depth = Math.abs(l.z);

    if (isTip) {
      const pulseSize = 10 + Math.sin(Date.now() / 300 + i) * 3;
      ctx.beginPath();
      ctx.strokeStyle = color + '40';
      ctx.lineWidth = 1;
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      ctx.stroke();
    }

    const radius = isTip ? 5 : isWrist ? 4 : 3;
    ctx.fillStyle = isTip ? '#FFFFFF' : color;
    ctx.shadowBlur = isTip ? 12 : 4;
    ctx.shadowColor = color;
    ctx.globalAlpha = 1 - depth * 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (isTip) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2 * (1 - depth * 4));
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
}

function drawFingerLabels(
  ctx: CanvasRenderingContext2D,
  lm: HandLandmark[],
  color: string,
  w: number,
  h: number
) {
  ctx.font = '9px Inter, monospace';

  for (let i = 0; i < FINGER_TIPS.length; i++) {
    const tip = lm[FINGER_TIPS[i]];
    if (!tip) continue;
    const x = tx(tip.x, w);
    const y = ty(tip.y, h);

    ctx.fillStyle = color + '80';
    ctx.fillText(`${FINGER_NAMES[i]}`, x + 12, y - 6);
    
    ctx.fillStyle = color + '50';
    ctx.font = '8px monospace';
    ctx.fillText(
      `(${tip.x.toFixed(2)}, ${tip.y.toFixed(2)}, ${tip.z.toFixed(3)})`,
      x + 12,
      y + 5
    );
    ctx.font = '9px Inter, monospace';
  }
}

function drawHandLabel(
  ctx: CanvasRenderingContext2D,
  lm: HandLandmark[],
  label: string,
  color: string,
  w: number,
  h: number
) {
  const wrist = lm[LANDMARK_INDICES.WRIST];
  if (!wrist) return;
  const x = tx(wrist.x, w);
  const y = ty(wrist.y, h) + 25;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  const textWidth = ctx.measureText(label).width + 16;
  ctx.beginPath();
  ctx.roundRect(x - textWidth / 2, y - 8, textWidth, 18, 9);
  ctx.fill();

  ctx.strokeStyle = color + '50';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - textWidth / 2, y - 8, textWidth, 18, 9);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = 'bold 10px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y + 4);
  ctx.textAlign = 'start';
}

function drawConfidenceArc(
  ctx: CanvasRenderingContext2D,
  lm: HandLandmark[],
  color: string,
  w: number,
  h: number,
  handIndex: number
) {
  const avgZ = lm.reduce((sum, l) => sum + Math.abs(l.z), 0) / lm.length;
  const conf = Math.max(0, Math.min(1, 1 - avgZ * 5));

  const wrist = lm[LANDMARK_INDICES.WRIST];
  if (!wrist) return;
  const x = tx(wrist.x, w);
  const y = ty(wrist.y, h);

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 3;
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.stroke();

  const confColor = conf > 0.7 ? '#00FF66' : conf > 0.4 ? '#FFFF00' : '#FF3333';
  ctx.beginPath();
  ctx.strokeStyle = confColor;
  ctx.lineWidth = 3;
  ctx.shadowBlur = 8;
  ctx.shadowColor = confColor;
  ctx.arc(x, y, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * conf);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = confColor;
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${(conf * 100).toFixed(0)}%`, x, y + 3);
  ctx.textAlign = 'start';
}

function drawMotionTrails(
  ctx: CanvasRenderingContext2D,
  lm: HandLandmark[],
  color: string,
  w: number,
  h: number
) {
  const indexTip = lm[LANDMARK_INDICES.INDEX_TIP];
  const indexDip = lm[LANDMARK_INDICES.INDEX_DIP];
  if (!indexTip || !indexDip) return;

  const tipX = tx(indexTip.x, w);
  const tipY = ty(indexTip.y, h);
  const dipX = tx(indexDip.x, w);
  const dipY = ty(indexDip.y, h);

  const dx = tipX - dipX;
  const dy = tipY - dipY;
  const len = Math.sqrt(dx * dx + dipY * dipY); // fix calculation error
  if (len < 2) return;

  const nx = dx / len;
  const ny = dy / len;
  const arrowLen = Math.min(len * 1.5, 30);

  ctx.beginPath();
  ctx.strokeStyle = color + '60';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX + nx * arrowLen, tipY + ny * arrowLen);
  ctx.stroke();
  ctx.setLineDash([]);

  const angle = Math.atan2(ny, nx);
  ctx.fillStyle = color + '60';
  ctx.beginPath();
  ctx.moveTo(tipX + nx * arrowLen, tipY + ny * arrowLen);
  ctx.lineTo(
    tipX + nx * arrowLen - 5 * Math.cos(angle - 0.5),
    tipY + ny * arrowLen - 5 * Math.sin(angle - 0.5)
  );
  ctx.lineTo(
    tipX + nx * arrowLen - 5 * Math.cos(angle + 0.5),
    tipY + ny * arrowLen - 5 * Math.sin(angle + 0.5)
  );
  ctx.closePath();
  ctx.fill();
}

function drawFaceSkeleton(
  ctx: CanvasRenderingContext2D,
  face: FaceLandmark[],
  w: number,
  h: number,
  mouthState: string
) {
  if (!face || face.length < 300) return;

  // Lips outer contour (neon green)
  ctx.beginPath();
  ctx.strokeStyle = '#00FF66';
  ctx.shadowColor = '#00FF66';
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;
  for (const [start, end] of LIPS_OUTER_CONNECTIONS) {
    const a = face[start];
    const b = face[end];
    if (a && b) {
      ctx.moveTo(tx(a.x, w), ty(a.y, h));
      ctx.lineTo(tx(b.x, w), ty(b.y, h));
    }
  }
  ctx.stroke();

  // Lips inner contour (neon pink)
  ctx.beginPath();
  ctx.strokeStyle = '#FF00AA';
  ctx.shadowColor = '#FF00AA';
  ctx.shadowBlur = 8;
  ctx.lineWidth = 1.5;
  for (const [start, end] of LIPS_INNER_CONNECTIONS) {
    const a = face[start];
    const b = face[end];
    if (a && b) {
      ctx.moveTo(tx(a.x, w), ty(a.y, h));
      ctx.lineTo(tx(b.x, w), ty(b.y, h));
    }
  }
  ctx.stroke();

  // Reset shadow effects explicitly
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  // Face oval wireframe (extremely subtle grey)
  const keyPoints = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 0.6;
  for (let i = 0; i < keyPoints.length; i++) {
    const idx = keyPoints[i];
    const nextIdx = keyPoints[(i + 1) % keyPoints.length];
    const a = face[idx];
    const b = face[nextIdx];
    if (a && b) {
      ctx.moveTo(tx(a.x, w), ty(a.y, h));
      ctx.lineTo(tx(b.x, w), ty(b.y, h));
    }
  }
  ctx.stroke();

  // Eyes wireframe (faint, no glow)
  const leftEye = [33, 160, 158, 133, 153, 144, 33];
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < leftEye.length - 1; i++) {
    const a = face[leftEye[i]];
    const b = face[leftEye[i + 1]];
    if (a && b) {
      ctx.moveTo(tx(a.x, w), ty(a.y, h));
      ctx.lineTo(tx(b.x, w), ty(b.y, h));
    }
  }
  ctx.stroke();

  const rightEye = [362, 385, 387, 263, 373, 380, 362];
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < rightEye.length - 1; i++) {
    const a = face[rightEye[i]];
    const b = face[rightEye[i + 1]];
    if (a && b) {
      ctx.moveTo(tx(a.x, w), ty(a.y, h));
      ctx.lineTo(tx(b.x, w), ty(b.y, h));
    }
  }
  ctx.stroke();

  // HUD tag near mouth
  const mouthLeft = face[61];
  const mouthRight = face[291];
  if (mouthLeft && mouthRight && mouthState !== 'neutral') {
    const mx = tx((mouthLeft.x + mouthRight.x) / 2, w);
    const my = ty((mouthLeft.y + mouthRight.y) / 2, h) - 25;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.strokeStyle = '#00FF66';
    ctx.lineWidth = 1;
    ctx.font = 'bold 8px monospace';
    
    const label = `LIPS: ${mouthState.toUpperCase()}`;
    const textW = ctx.measureText(label).width + 10;
    
    ctx.beginPath();
    ctx.roundRect(mx - textW / 2, my - 7, textW, 14, 4);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#00FF66';
    ctx.textAlign = 'center';
    ctx.fillText(label, mx, my + 3);
    ctx.textAlign = 'start';
  }
}

function drawPoseSkeleton(
  ctx: CanvasRenderingContext2D,
  pose: PoseLandmark[],
  w: number,
  h: number
) {
  const color = '#FF6600';

  for (const [start, end] of POSE_CONNECTIONS) {
    if (start >= pose.length || end >= pose.length) continue;
    const a = pose[start];
    const b = pose[end];
    if (!a || !b) continue;
    const vis = ((a.visibility || 0) + (b.visibility || 0)) / 2;
    if (vis < 0.3) continue;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.globalAlpha = vis * 0.6;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 4;
    ctx.shadowColor = color;
    ctx.moveTo(tx(a.x, w), ty(a.y, h));
    ctx.lineTo(tx(b.x, w), ty(b.y, h));
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  for (let i = 0; i < pose.length; i++) {
    const l = pose[i];
    if (!l) continue;
    const vis = l.visibility || 0;
    if (vis < 0.3) continue;

    const x = tx(l.x, w);
    const y = ty(l.y, h);
    const name = POSE_LANDMARK_NAMES[i];

    const isKey = name !== undefined;
    const radius = isKey ? 4 : 2;

    ctx.fillStyle = color;
    ctx.globalAlpha = vis;
    ctx.shadowBlur = isKey ? 8 : 2;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (isKey && name) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = color + '90';
      ctx.font = '8px Inter';
      ctx.fillText(name, x + 8, y + 3);
    }
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawInfoPanel(
  ctx: CanvasRenderingContext2D,
  hands: HandLandmark[][],
  handedness: string[],
  gesture: GestureType,
  w: number,
  h: number,
  pose: PoseLandmark[] | null,
  face: FaceLandmark[] | null,
  mouthState: string
) {
  const panelX = 10;
  const panelY = h - 160;
  const panelW = 180;
  const panelH = 150;

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 10);
  ctx.stroke();

  ctx.fillStyle = '#00FFFF';
  ctx.font = 'bold 10px Inter';
  ctx.fillText('🤖 ML MOTION DESK', panelX + 10, panelY + 18);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(panelX + 10, panelY + 24);
  ctx.lineTo(panelX + panelW - 10, panelY + 24);
  ctx.stroke();

  ctx.font = '9px Inter';
  let y = panelY + 38;
  const lineH = 14;

  ctx.fillStyle = '#ffffff80';
  ctx.fillText(`Hands Detected:`, panelX + 10, y);
  ctx.fillStyle = hands.length > 0 ? '#00FF66' : '#FF3333';
  ctx.fillText(`${hands.length}`, panelX + 110, y);
  y += lineH;

  if (handedness.length > 0) {
    ctx.fillStyle = '#ffffff80';
    ctx.fillText(`Handedness:`, panelX + 10, y);
    ctx.fillStyle = '#00FFFF';
    ctx.fillText(handedness.join(', '), panelX + 110, y);
    y += lineH;
  }

  ctx.fillStyle = '#ffffff80';
  ctx.fillText(`Hand Gesture:`, panelX + 10, y);
  const gestureColor: Record<string, string> = {
    draw: '#00FF66', pause: '#FFFF00', 'fist-erase': '#FF6600',
    pointer: '#BF00FF', clear: '#FF3333', none: '#666666',
    'swipe-left': '#0088FF', 'swipe-right': '#0088FF',
  };
  ctx.fillStyle = gestureColor[gesture] || '#888888';
  ctx.fillText(gesture, panelX + 110, y);
  y += lineH;

  ctx.fillStyle = '#ffffff80';
  ctx.fillText(`Body Skeleton:`, panelX + 10, y);
  ctx.fillStyle = pose ? '#00FF66' : '#666666';
  ctx.fillText(pose ? `Active (${pose.length} pts)` : 'Disabled', panelX + 110, y);
  y += lineH;

  ctx.fillStyle = '#ffffff80';
  ctx.fillText(`Face Tracking:`, panelX + 10, y);
  ctx.fillStyle = face ? '#00FF66' : '#666666';
  ctx.fillText(face ? `Active (${face.length} pts)` : 'Disabled', panelX + 110, y);
  y += lineH;

  ctx.fillStyle = '#ffffff80';
  ctx.fillText(`Mouth Expression:`, panelX + 10, y);
  const mouthColors: Record<string, string> = {
    neutral: '#ffffff80',
    smile: '#00FF66',
    open: '#FFFF00',
    pursed: '#FF00AA',
  };
  ctx.fillStyle = mouthColors[mouthState] || '#ffffff80';
  ctx.fillText(mouthState.toUpperCase(), panelX + 110, y);
  y += lineH;

  const totalLm = hands.reduce((sum, h) => sum + h.length, 0) + (pose?.length || 0) + (face?.length || 0);
  ctx.fillStyle = '#ffffff80';
  ctx.fillText(`Total Skeletons:`, panelX + 10, y);
  ctx.fillStyle = '#00FFFF';
  ctx.font = 'bold 9px monospace';
  ctx.fillText(`${totalLm}`, panelX + 110, y);
}
