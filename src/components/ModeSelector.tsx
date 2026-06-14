import React from 'react';
import { DrawingMode } from '@/types';

interface ModeSelectorProps {
  mode: DrawingMode;
  onModeChange: (mode: DrawingMode) => void;
  isNeumorphic?: boolean;
  theme?: 'neumorphic-light' | 'neumorphic-dark' | 'glassmorphism-dark';
}

const modes: { id: DrawingMode; label: string; icon: string; shortcut: string }[] = [
  { id: 'draw', label: 'Draw', icon: '✏️', shortcut: 'D' },
  { id: 'eraser', label: 'Eraser', icon: '🧹', shortcut: 'E' },
  { id: 'pointer', label: 'Pointer', icon: '👆', shortcut: 'P' },
];

const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  onModeChange,
  theme = 'glassmorphism-dark',
}) => {
  const isLight = theme === 'neumorphic-light';
  const isDarkNeumorphic = theme === 'neumorphic-dark';

  let containerClass = 'bg-black/25 border border-white/5 rounded-xl';
  if (isLight) containerClass = 'neumorphic-well bg-[#e8ebf0]';
  else if (isDarkNeumorphic) containerClass = 'neumorphic-well-dark bg-[#0f0f13]';

  return (
    <div className={`flex p-1 gap-1 ${containerClass}`} style={{ borderRadius: '14px' }}>
      {modes.map((m) => {
        const isActive = mode === m.id;
        
        let buttonClass = 'text-white/50 border border-transparent hover:bg-white/[0.03]';
        if (isActive) {
          if (isLight) {
            buttonClass = 'bg-[#edf1f5] border border-white/80 shadow-[2.5px_2.5px_5px_#d5dde7,-2.5px_-2.5px_5px_rgba(255,255,255,0.95)] text-[#0088FF] font-bold';
          } else if (isDarkNeumorphic) {
            buttonClass = 'bg-[#14141a] border border-white/[0.03] shadow-[2.5px_2.5px_5px_#09090c,-2.5px_-2.5px_5px_rgba(255,255,255,0.035)] text-[#00ffff] font-bold';
          } else {
            buttonClass = 'bg-[rgba(0,255,255,0.1)] border border-[rgba(0,255,255,0.25)] shadow-[0_0_12px_rgba(0,255,255,0.1)] text-neon-cyan';
          }
        } else {
          if (isLight) {
            buttonClass = 'text-[#5e6e80] hover:text-[#2a3b50]';
          } else if (isDarkNeumorphic) {
            buttonClass = 'text-white/40 hover:text-white/80';
          }
        }

        return (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-all duration-200 ${buttonClass}`}
          >
            <span className="text-base">{m.icon}</span>
            <span className="text-[10px] font-semibold">{m.label}</span>
            <span
              className={`text-[8px] font-mono ${
                isActive
                  ? isLight
                    ? 'text-[#0088FF]/60'
                    : isDarkNeumorphic
                    ? 'text-[#00ffff]/60'
                    : 'text-neon-cyan/50'
                  : isLight
                  ? 'text-black/20'
                  : 'text-white/20'
              }`}
            >
              {m.shortcut}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ModeSelector;
