import React from 'react';
import { GestureType } from '@/types';

interface GestureIndicatorProps {
  gesture: GestureType;
  clearProgress: number;
}

const gestureInfo: Record<GestureType, { label: string; icon: string; color: string }> = {
  draw: { label: 'Drawing', icon: '✏️', color: '#00FFFF' },
  pause: { label: 'Paused', icon: '✋', color: '#FFFF00' },
  fist: { label: 'Grab / Pause', icon: '✊', color: '#FFFF00' },
  erase: { label: 'Erasing', icon: '🧹', color: '#FF6600' },
  'palm-erase': { label: 'Palm Erasing', icon: '🖐️', color: '#FF6600' },
  pointer: { label: 'Pointing', icon: '👆', color: '#BF00FF' },
  clear: { label: 'Clearing!', icon: '🗑️', color: '#FF3333' },
  'swipe-left': { label: '← Swipe', icon: '👈', color: '#0088FF' },
  'swipe-right': { label: 'Swipe →', icon: '👉', color: '#0088FF' },
  none: { label: 'No Hand', icon: '🔍', color: '#666666' },
};

const GestureIndicator: React.FC<GestureIndicatorProps> = ({ gesture, clearProgress }) => {
  const info = gestureInfo[gesture];

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 md:bottom-auto md:top-3 md:left-1/2">
      <div
        className="gesture-badge glass-panel px-4 py-2 flex items-center gap-2"
        style={{
          borderColor: info.color + '40',
          boxShadow: `0 0 15px ${info.color}20`,
        }}
      >
        <span className="text-base">{info.icon}</span>
        <span className="text-xs font-medium" style={{ color: info.color }}>
          {info.label}
        </span>

        {/* Clear progress bar */}
        {clearProgress > 0 && clearProgress < 1 && (
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden ml-2">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${clearProgress * 100}%`,
                background: `linear-gradient(90deg, #FF6600, #FF3333)`,
                boxShadow: '0 0 8px #FF3333',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GestureIndicator;
