export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  brushSize: number;
  glowIntensity: number;
  isEraser: boolean;
}

export type DrawingMode = 'draw' | 'eraser' | 'pointer';

export type GestureType =
  | 'draw'
  | 'pause'
  | 'erase'
  | 'fist-erase'
  | 'pointer'
  | 'clear'
  | 'swipe-left'
  | 'swipe-right'
  | 'none';

export interface GestureState {
  type: GestureType;
  confidence: number;
  fingerStates: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
}

export type CameraFacing = 'user' | 'environment';

export interface AppSettings {
  brushSize: number;
  glowIntensity: number;
  smoothing: number;
  strokeColor: string;
  drawingMode: DrawingMode;
  showCamera: boolean;
  showLandmarks: boolean;
  showMLVisualization: boolean;
  showFPS: boolean;
  particlesEnabled: boolean;
  fadeTrailEnabled: boolean;
  dualHandDrawing: boolean;
  bodyTracking: boolean;
  cameraFacing: CameraFacing;
  lipTracking: boolean;
  lipControlActions: boolean;
  rainbowBrush: boolean;
  panelTheme: 'neumorphic-light' | 'neumorphic-dark' | 'glassmorphism-dark';
}

export interface CanvasTab {
  id: string;
  name: string;
  imageData: ImageData | null;
  strokes: Stroke[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  opacity: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

export interface TrackingData {
  hands: HandLandmark[][];
  handedness: string[];
  pose: PoseLandmark[] | null;
  face: FaceLandmark[] | null;
}

export const COLOR_PRESETS = [
  { name: 'Cyan', color: '#00FFFF' },
  { name: 'Purple', color: '#BF00FF' },
  { name: 'Pink', color: '#FF00AA' },
  { name: 'Green', color: '#00FF66' },
  { name: 'Orange', color: '#FF6600' },
  { name: 'White', color: '#FFFFFF' },
  { name: 'Blue', color: '#0088FF' },
  { name: 'Yellow', color: '#FFFF00' },
] as const;

export const LANDMARK_INDICES = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

export const POSE_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
];

export const POSE_LANDMARK_NAMES: Record<number, string> = {
  0: 'nose', 1: 'left eye inner', 2: 'left eye', 3: 'left eye outer',
  4: 'right eye inner', 5: 'right eye', 6: 'right eye outer',
  7: 'left ear', 8: 'right ear', 9: 'mouth left', 10: 'mouth right',
  11: 'left shoulder', 12: 'right shoulder',
  13: 'left elbow', 14: 'right elbow',
  15: 'left wrist', 16: 'right wrist',
  23: 'left hip', 24: 'right hip',
  25: 'left knee', 26: 'right knee',
  27: 'left ankle', 28: 'right ankle',
};

// Lip/mouth landmarks connection pairs for outer and inner contours
export const LIPS_OUTER_CONNECTIONS: [number, number][] = [
  [61, 185], [185, 40], [40, 39], [39, 37], [37, 0], [0, 267], [267, 269], [269, 270], [270, 409], [409, 291],
  [291, 375], [375, 321], [321, 405], [405, 314], [314, 17], [17, 84], [84, 181], [181, 91], [91, 146], [146, 61]
];

export const LIPS_INNER_CONNECTIONS: [number, number][] = [
  [78, 191], [191, 80], [80, 81], [81, 82], [82, 13], [13, 312], [312, 311], [311, 310], [310, 415], [415, 308],
  [308, 324], [324, 318], [318, 402], [402, 317], [317, 14], [14, 87], [87, 178], [178, 88], [88, 95], [95, 78]
];

export const DEFAULT_SETTINGS: AppSettings = {
  brushSize: 4,
  glowIntensity: 25,
  smoothing: 5,
  strokeColor: '#00FFFF',
  drawingMode: 'draw',
  showCamera: true,
  showLandmarks: true,
  showMLVisualization: false,
  showFPS: false,
  particlesEnabled: true,
  fadeTrailEnabled: false,
  dualHandDrawing: true,
  bodyTracking: false,
  cameraFacing: 'user',
  lipTracking: false,
  lipControlActions: false,
  rainbowBrush: false,
  panelTheme: 'neumorphic-dark',
};
