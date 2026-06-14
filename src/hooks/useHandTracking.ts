import { useCallback, useEffect, useRef, useState } from 'react';
import { Hands, Results as HandResults } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { CameraFacing, HandLandmark, PoseLandmark, FaceLandmark, TrackingData } from '@/types';

interface UseHandTrackingOptions {
  videoElement: HTMLVideoElement | null;
  onResults: (data: TrackingData) => void;
  enabled: boolean;
  cameraFacing: CameraFacing;
  bodyTrackingEnabled: boolean;
  lipTrackingEnabled: boolean;
}

interface UseHandTrackingReturn {
  isLoading: boolean;
  error: string | null;
  isTracking: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => void;
}

export function useHandTracking({
  videoElement,
  onResults,
  enabled,
  cameraFacing,
  bodyTrackingEnabled,
  lipTrackingEnabled,
}: UseHandTrackingOptions): UseHandTrackingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const poseRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);
  const onResultsRef = useRef(onResults);
  const facingRef = useRef(cameraFacing);
  
  const poseResultRef = useRef<PoseLandmark[] | null>(null);
  const faceResultRef = useRef<FaceLandmark[] | null>(null);

  const handsBusyRef = useRef(false);
  const poseBusyRef = useRef(false);
  const faceBusyRef = useRef(false);
  const frameCountRef = useRef(0);

  onResultsRef.current = onResults;
  facingRef.current = cameraFacing;

  const handleHandResults = useCallback((results: HandResults) => {
    const hands: HandLandmark[][] = [];
    const handedness: string[] = [];

    if (results.multiHandLandmarks) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        hands.push(results.multiHandLandmarks[i] as HandLandmark[]);
        const rawLabel = results.multiHandedness?.[i]?.label;
        const mappedLabel = rawLabel === 'Left' ? 'Right' : 'Left';
        handedness.push(mappedLabel);
      }
    }

    onResultsRef.current({
      hands,
      handedness,
      pose: poseResultRef.current,
      face: faceResultRef.current,
    });
  }, []);

  const initPoseTracking = useCallback(async () => {
    if (poseRef.current) return;
    try {
      const { Pose } = await import('@mediapipe/pose');
      const pose = new Pose({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults((results: any) => {
        poseResultRef.current = results.poseLandmarks
          ? (results.poseLandmarks as PoseLandmark[])
          : null;
      });
      poseRef.current = pose;
    } catch (err) {
      console.warn('Pose tracking not available', err);
    }
  }, []);

  const initFaceTracking = useCallback(async () => {
    if (faceMeshRef.current) return;
    try {
      const { FaceMesh } = await import('@mediapipe/face_mesh');
      const faceMesh = new FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      faceMesh.onResults((results: any) => {
        faceResultRef.current = results.multiFaceLandmarks?.[0]
          ? (results.multiFaceLandmarks[0] as FaceLandmark[])
          : null;
      });
      faceMeshRef.current = faceMesh;
    } catch (err) {
      console.warn('Face mesh tracking not available', err);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!videoElement) {
      setError('Video element not ready');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access. Please use Chrome, Firefox, or Edge.');
      }

      // Initialize MediaPipe Hands
      if (!handsRef.current) {
        const hands = new Hands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.65,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(handleHandResults);
        handsRef.current = hands;
      }

      // Initialize body pose tracking if enabled
      if (bodyTrackingEnabled) {
        await initPoseTracking();
      } else if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
        poseResultRef.current = null;
      }

      // Initialize FaceMesh lip tracking if enabled
      if (lipTrackingEnabled) {
        await initFaceTracking();
      } else if (faceMeshRef.current) {
        faceMeshRef.current.close();
        faceMeshRef.current = null;
        faceResultRef.current = null;
      }

      // Determine camera constraints
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingRef.current,
          width: { ideal: isMobile ? 640 : 1280 },
          height: { ideal: isMobile ? 480 : 720 },
        },
      };

      // Initialize camera
      if (cameraRef.current) {
        cameraRef.current.stop();
      }

      const camera = new Camera(videoElement, {
        onFrame: async () => {
          if (videoElement.readyState < 2) return;
          frameCountRef.current++;
          const currentFrame = frameCountRef.current;
          
          const promises: Promise<void>[] = [];
          
          // 1. Hands: critical, run every frame if not busy
          if (handsRef.current && !handsBusyRef.current) {
            handsBusyRef.current = true;
            promises.push(
              handsRef.current.send({ image: videoElement }).finally(() => {
                handsBusyRef.current = false;
              })
            );
          }
          
          // 2. Pose: run every 3rd frame if enabled and not busy
          if (bodyTrackingEnabled && poseRef.current && !poseBusyRef.current && currentFrame % 3 === 0) {
            poseBusyRef.current = true;
            promises.push(
              poseRef.current.send({ image: videoElement }).finally(() => {
                poseBusyRef.current = false;
              })
            );
          }
          
          // 3. FaceMesh: run every 2nd frame if enabled and not busy
          if (lipTrackingEnabled && faceMeshRef.current && !faceBusyRef.current && currentFrame % 2 === 0) {
            faceBusyRef.current = true;
            promises.push(
              faceMeshRef.current.send({ image: videoElement }).finally(() => {
                faceBusyRef.current = false;
              })
            );
          }
          
          if (promises.length > 0) {
            await Promise.all(promises);
          }
        },
        ...constraints.video as object,
        facingMode: facingRef.current,
      });

      cameraRef.current = camera;
      await camera.start();
      setIsTracking(true);
      setIsLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';

      if (message.includes('Permission') || message.includes('NotAllowedError')) {
        setError('Camera access denied. Please allow camera permission and refresh the page.');
      } else if (message.includes('NotFoundError') || message.includes('DevicesNotFoundError')) {
        setError('No webcam found. Please connect a camera and try again.');
      } else if (message.includes('NotReadableError')) {
        setError('Camera is in use by another application. Please close it and try again.');
      } else {
        setError(`Failed to start camera: ${message}`);
      }

      setIsLoading(false);
      setIsTracking(false);
    }
  }, [videoElement, handleHandResults, bodyTrackingEnabled, lipTrackingEnabled, initPoseTracking, initFaceTracking]);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
    }
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoElement.srcObject = null;
    }
    poseResultRef.current = null;
    faceResultRef.current = null;
    setIsTracking(false);
  }, [videoElement]);

  const switchCamera = useCallback(() => {
    if (isTracking) {
      stopCamera();
      // Small delay to let camera release
      setTimeout(() => {
        startCamera();
      }, 300);
    }
  }, [isTracking, stopCamera, startCamera]);

  // Auto-start or update when settings change
  useEffect(() => {
    if (enabled && videoElement) {
      // If camera is already running, we need to restart it to re-initialize dependencies (Pose, FaceMesh)
      if (isTracking) {
        startCamera();
      } else if (!isLoading) {
        startCamera();
      }
    }
    if (!enabled && isTracking) {
      stopCamera();
    }
  }, [enabled, videoElement, bodyTrackingEnabled, lipTrackingEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraRef.current) cameraRef.current.stop();
      if (handsRef.current) handsRef.current.close();
      if (poseRef.current) poseRef.current.close();
      if (faceMeshRef.current) faceMeshRef.current.close();
    };
  }, []);

  return {
    isLoading,
    error,
    isTracking,
    startCamera,
    stopCamera,
    switchCamera,
  };
}
