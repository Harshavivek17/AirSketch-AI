import { useEffect, useCallback } from 'react';
import { DrawingMode } from '@/types';

interface KeyboardShortcutActions {
  onClear: () => void;
  onSave: () => void;
  onSaveTransparent: () => void;
  onSetMode: (mode: DrawingMode) => void;
  onUndo: () => void;
  onToggleFPS: () => void;
  onToggleRecording: () => void;
  onToggleMLViz: () => void;
  onToggleLandmarks: () => void;
}

export function useKeyboardShortcuts(actions: KeyboardShortcutActions): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Ctrl/Cmd + Z = Undo
      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault();
        actions.onUndo();
        return;
      }

      // Ctrl/Cmd + S = Save
      if ((e.ctrlKey || e.metaKey) && key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          actions.onSaveTransparent();
        } else {
          actions.onSave();
        }
        return;
      }

      switch (key) {
        case 'c':
          actions.onClear();
          break;
        case 's':
          actions.onSave();
          break;
        case 'e':
          actions.onSetMode('eraser');
          break;
        case 'd':
          actions.onSetMode('draw');
          break;
        case 'p':
          actions.onSetMode('pointer');
          break;
        case 'f':
          actions.onToggleFPS();
          break;
        case 'r':
          actions.onToggleRecording();
          break;
        case 'm':
          actions.onToggleMLViz();
          break;
        case 'l':
          actions.onToggleLandmarks();
          break;
      }
    },
    [actions]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
