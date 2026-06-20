import { GestureState, GestureType, HandLandmark, LANDMARK_INDICES } from '@/types';

function isFingerRaised(tip: HandLandmark, pip: HandLandmark): boolean {
  return tip.y < pip.y;
}

function isThumbRaised(tip: HandLandmark, ip: HandLandmark, wrist: HandLandmark): boolean {
  const thumbExtension = Math.abs(tip.x - wrist.x);
  const ipExtension = Math.abs(ip.x - wrist.x);
  return thumbExtension > ipExtension;
}

export function detectFingerStates(landmarks: HandLandmark[]) {
  const thumb = isThumbRaised(
    landmarks[LANDMARK_INDICES.THUMB_TIP],
    landmarks[LANDMARK_INDICES.THUMB_IP],
    landmarks[LANDMARK_INDICES.WRIST]
  );
  const index = isFingerRaised(
    landmarks[LANDMARK_INDICES.INDEX_TIP],
    landmarks[LANDMARK_INDICES.INDEX_PIP]
  );
  const middle = isFingerRaised(
    landmarks[LANDMARK_INDICES.MIDDLE_TIP],
    landmarks[LANDMARK_INDICES.MIDDLE_PIP]
  );
  const ring = isFingerRaised(
    landmarks[LANDMARK_INDICES.RING_TIP],
    landmarks[LANDMARK_INDICES.RING_PIP]
  );
  const pinky = isFingerRaised(
    landmarks[LANDMARK_INDICES.PINKY_TIP],
    landmarks[LANDMARK_INDICES.PINKY_PIP]
  );

  return { thumb, index, middle, ring, pinky };
}

/**
 * Detect if hand is making a fist (all fingers closed).
 */
function isFist(fingers: ReturnType<typeof detectFingerStates>): boolean {
  return !fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky && !fingers.thumb;
}

// Per-hand state tracking (supports up to 4 hands)
interface HandSwipeState {
  prevWristX: number | null;
  swipeAccumulator: number;
  swipeVelocityBuffer: number[];
  // Gesture smoothing: history buffer + debounce
  gestureHistory: GestureType[];
  lastConfirmedGesture: GestureType;
  lastGestureChangeTime: number;
}

const handStates: Map<number, HandSwipeState> = new Map();
let clearGestureStartTime: number | null = null;

const SWIPE_THRESHOLD = 0.12;
const SWIPE_VELOCITY_THRESHOLD = 0.015;
const CLEAR_HOLD_DURATION = 2000;

// Smoothing constants
const GESTURE_HISTORY_SIZE = 5;       // frames of history for majority vote
const GESTURE_DEBOUNCE_MS = 120;      // minimum ms between gesture changes

function getHandState(handIndex: number): HandSwipeState {
  if (!handStates.has(handIndex)) {
    handStates.set(handIndex, {
      prevWristX: null,
      swipeAccumulator: 0,
      swipeVelocityBuffer: [],
      gestureHistory: [],
      lastConfirmedGesture: 'none',
      lastGestureChangeTime: 0,
    });
  }
  return handStates.get(handIndex)!;
}

/**
 * Smooth gesture output using majority-vote over recent frames + temporal debounce.
 * Prevents flickering when fingers are in transition between gestures.
 */
function smoothGesture(rawGesture: GestureType, state: HandSwipeState): GestureType {
  // Always allow high-priority gestures through immediately
  const immediateGestures: GestureType[] = ['clear', 'swipe-left', 'swipe-right', 'palm-erase'];
  if (immediateGestures.includes(rawGesture)) {
    state.gestureHistory = [rawGesture];
    state.lastConfirmedGesture = rawGesture;
    state.lastGestureChangeTime = Date.now();
    return rawGesture;
  }

  // Push to history buffer
  state.gestureHistory.push(rawGesture);
  if (state.gestureHistory.length > GESTURE_HISTORY_SIZE) {
    state.gestureHistory.shift();
  }

  // Majority vote: find the most common gesture in the buffer
  const counts = new Map<GestureType, number>();
  for (const g of state.gestureHistory) {
    counts.set(g, (counts.get(g) || 0) + 1);
  }
  let majorityGesture = rawGesture;
  let maxCount = 0;
  counts.forEach((count, gesture) => {
    if (count > maxCount) {
      maxCount = count;
      majorityGesture = gesture;
    }
  });

  // Temporal debounce: don't switch if we changed too recently
  const now = Date.now();
  if (majorityGesture !== state.lastConfirmedGesture) {
    if (now - state.lastGestureChangeTime < GESTURE_DEBOUNCE_MS) {
      return state.lastConfirmedGesture;
    }
    // Require a supermajority (>60%) to actually switch
    const needed = Math.ceil(state.gestureHistory.length * 0.6);
    if (maxCount < needed) {
      return state.lastConfirmedGesture;
    }
    state.lastConfirmedGesture = majorityGesture;
    state.lastGestureChangeTime = now;
  }

  return state.lastConfirmedGesture;
}

export function detectGesture(landmarks: HandLandmark[], handIndex: number = 0): GestureState {
  const fingers = detectFingerStates(landmarks);
  const allUp = fingers.index && fingers.middle && fingers.ring && fingers.pinky;
  const state = getHandState(handIndex);

  // ─── Fist detection (all fingers closed) ───
  if (isFist(fingers)) {
    state.prevWristX = landmarks[LANDMARK_INDICES.WRIST].x;
    state.swipeAccumulator = 0;
    return {
      type: 'fist',
      confidence: 0.9,
      fingerStates: fingers,
    };
  }

  // ─── Swipe detection (velocity-based for better accuracy) ───
  const wristX = landmarks[LANDMARK_INDICES.WRIST].x;
  let swipeGesture: GestureType = 'none';

  if (state.prevWristX !== null && allUp) {
    const delta = wristX - state.prevWristX;
    state.swipeVelocityBuffer.push(delta);
    if (state.swipeVelocityBuffer.length > 5) state.swipeVelocityBuffer.shift();

    const avgVelocity =
      state.swipeVelocityBuffer.reduce((a, b) => a + b, 0) / state.swipeVelocityBuffer.length;
    state.swipeAccumulator += delta;

    if (
      Math.abs(state.swipeAccumulator) > SWIPE_THRESHOLD &&
      Math.abs(avgVelocity) > SWIPE_VELOCITY_THRESHOLD
    ) {
      swipeGesture = state.swipeAccumulator > 0 ? 'swipe-right' : 'swipe-left';
      state.swipeAccumulator = 0;
      state.swipeVelocityBuffer = [];
    }
  }
  state.prevWristX = wristX;

  if (!allUp) {
    state.swipeAccumulator = 0;
    state.swipeVelocityBuffer = [];
  }

  // ─── Clear gesture: all fingers + thumb up for 2 seconds ───
  if (allUp && fingers.thumb) {
    if (clearGestureStartTime === null) {
      clearGestureStartTime = Date.now();
    } else if (Date.now() - clearGestureStartTime >= CLEAR_HOLD_DURATION) {
      clearGestureStartTime = null;
      return { type: 'clear', confidence: 0.9, fingerStates: fingers };
    }
  } else {
    clearGestureStartTime = null;
  }

  // ─── Swipe takes priority when detected ───
  if (swipeGesture !== 'none') {
    return { type: smoothGesture(swipeGesture, state), confidence: 0.85, fingerStates: fingers };
  }

  // ─── Determine raw gesture ───
  let rawGesture: GestureType = 'none';
  let confidence = 0.5;

  if (allUp) {
    // Erase: open palm (all fingers up)
    rawGesture = 'palm-erase';
    confidence = 0.85;
  } else if (fingers.index && !fingers.middle) {
    // Draw: index up, middle down
    rawGesture = 'draw';
    confidence = 0.9;
  } else if (fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
    // Pointer: peace sign (index + middle up, rest down)
    rawGesture = 'pointer';
    confidence = 0.85;
  }

  // Apply smoothing to prevent flickering
  const smoothed = smoothGesture(rawGesture, state);
  return { type: smoothed, confidence, fingerStates: fingers };
}

export function resetGestureState(): void {
  clearGestureStartTime = null;
  handStates.clear();
}

export function getClearGestureProgress(): number {
  if (clearGestureStartTime === null) return 0;
  return Math.min(1, (Date.now() - clearGestureStartTime) / CLEAR_HOLD_DURATION);
}

export function detectMouthState(faceLandmarks: any[] | null): 'open' | 'smile' | 'pursed' | 'neutral' {
  if (!faceLandmarks || faceLandmarks.length < 300) return 'neutral';
  
  const p13 = faceLandmarks[13]; // inner lip top
  const p14 = faceLandmarks[14]; // inner lip bottom
  const p61 = faceLandmarks[61]; // lip corner left
  const p291 = faceLandmarks[291]; // lip corner right
  const p0 = faceLandmarks[0]; // outer lip top
  const p17 = faceLandmarks[17]; // outer lip bottom

  if (!p13 || !p14 || !p61 || !p291 || !p0 || !p17) return 'neutral';

  const dist = (a: any, b: any) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  
  const cornerDist = dist(p61, p291);
  const openDist = dist(p13, p14);
  const lipHeight = dist(p0, p17);

  if (cornerDist === 0) return 'neutral';

  const openRatio = openDist / cornerDist;
  const aspect = cornerDist / (lipHeight || 0.01);
  
  // Smile detection: corners pulled upward (lower y coord in canvas/webcam space)
  const cornersY = (p61.y + p291.y) / 2;
  const lipCenterY = (p0.y + p17.y) / 2;
  const smileRatio = (lipCenterY - cornersY) / cornerDist;

  if (openRatio > 0.22) {
    return 'open';
  } else if (smileRatio > 0.09) {
    return 'smile';
  } else if (aspect < 1.35) {
    return 'pursed';
  }
  
  return 'neutral';
}
