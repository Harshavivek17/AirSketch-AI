import React from 'react';

interface FPSCounterProps {
  fps: number;
  visible: boolean;
}

const FPSCounter: React.FC<FPSCounterProps> = ({ fps, visible }) => {
  if (!visible) return null;

  const color = fps >= 50 ? '#00FF66' : fps >= 30 ? '#FFFF00' : '#FF3333';

  return (
    <div className="fixed top-3 right-3 z-50 glass-panel px-3 py-1.5 flex items-center gap-2">
      <div
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span className="text-xs font-mono font-semibold" style={{ color }}>
        {fps} FPS
      </span>
    </div>
  );
};

export default FPSCounter;
