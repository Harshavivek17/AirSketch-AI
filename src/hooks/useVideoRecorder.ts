import { useCallback, useRef, useState } from 'react';

interface UseVideoRecorderReturn {
  isRecording: boolean;
  startRecording: (canvas: HTMLCanvasElement) => void;
  stopRecording: () => void;
  toggleRecording: (canvas: HTMLCanvasElement) => void;
}

export function useVideoRecorder(): UseVideoRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback((canvas: HTMLCanvasElement) => {
    try {
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000,
      });

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
        link.download = `airsketch-recording.${ext}`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        chunksRef.current = [];
      };

      recorder.start(100);
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsRecording(false);
    }
  }, []);

  const toggleRecording = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording(canvas);
      }
    },
    [isRecording, startRecording, stopRecording]
  );

  return {
    isRecording,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
