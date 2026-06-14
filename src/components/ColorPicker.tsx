import React from 'react';
import { COLOR_PRESETS } from '@/types';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  isNeumorphic?: boolean;
  theme?: 'neumorphic-light' | 'neumorphic-dark' | 'glassmorphism-dark';
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorChange,
  theme = 'glassmorphism-dark',
}) => {
  const isLight = theme === 'neumorphic-light';
  const isDarkNeumorphic = theme === 'neumorphic-dark';
  const isNeumorphic = isLight || isDarkNeumorphic;

  const labelColor = isLight ? 'text-[#5e6e80]' : 'text-white/40';
  const customLabelColor = isLight ? 'text-[#4a5a70]' : 'text-white/50';
  const valueColor = isLight ? 'text-[#8796a8]' : 'text-white/30';

  return (
    <div className="space-y-2.5">
      {/* Color grid */}
      <div className="grid grid-cols-4 gap-2">
        {COLOR_PRESETS.map((preset) => {
          const isActive = selectedColor === preset.color;
          return (
            <button
              key={preset.name}
              onClick={() => onColorChange(preset.color)}
              title={preset.name}
              className="group flex flex-col items-center gap-1"
            >
              <div
                className="w-7 h-7 rounded-full transition-all duration-200 group-hover:scale-110 flex items-center justify-center"
                style={{
                  background: preset.color,
                  boxShadow: isActive
                    ? isLight
                      ? `0 3px 8px ${preset.color}60, inset 0 1px 0 rgba(255,255,255,0.4)`
                      : isDarkNeumorphic
                      ? `0 3px 8px ${preset.color}80, inset 0 1px 0 rgba(255,255,255,0.1)`
                      : `0 0 12px ${preset.color}80, 0 0 24px ${preset.color}30`
                    : isLight
                    ? 'inset 1px 1.5px 3px rgba(0,0,0,0.15)'
                    : isDarkNeumorphic
                    ? 'inset 1px 1.5px 3px rgba(0,0,0,0.45)'
                    : `0 0 4px ${preset.color}20`,
                  border: isLight
                    ? isActive
                      ? '2.5px solid #ffffff'
                      : '1.5px solid rgba(0,0,0,0.05)'
                    : isDarkNeumorphic
                    ? isActive
                      ? '2.5px solid #14141a'
                      : '1.5px solid rgba(0,0,0,0.1)'
                    : isActive
                    ? `2px solid ${preset.color}`
                    : '2px solid rgba(255,255,255,0.08)',
                  outline: isActive
                    ? isLight
                      ? '1.5px solid #d5dde7'
                      : isDarkNeumorphic
                      ? '1.5px solid #09090c'
                      : '2px solid rgba(255,255,255,0.15)'
                    : 'none',
                  outlineOffset: '1px',
                }}
              />
              <span
                className={`text-[9px] transition-colors font-medium ${
                  isActive
                    ? isLight
                      ? 'text-[#1a2b40] font-bold'
                      : isDarkNeumorphic
                      ? 'text-[#00ffff] font-bold'
                      : 'text-white/80 font-bold'
                    : labelColor
                }`}
              >
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>
 
      {/* Custom color row */}
      <div className="flex items-center gap-2 pt-1">
        <span className={`text-[10px] flex-shrink-0 font-medium ${customLabelColor}`}>Custom</span>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          className={`w-6 h-6 rounded-md cursor-pointer bg-transparent flex-shrink-0 ${
            isLight
              ? 'border border-[#d5dde7] shadow-[1px_1px_3px_#d5dde7,-1px_-1px_3px_rgba(255,255,255,0.9)]'
              : isDarkNeumorphic
              ? 'border border-[#09090c] shadow-[1px_1px_3px_#09090c,-1px_-1px_3px_rgba(255,255,255,0.03)]'
              : 'border border-white/10'
          }`}
        />
        <span className={`text-[10px] font-mono truncate ${valueColor}`}>{selectedColor}</span>
      </div>
    </div>
  );
};

export default ColorPicker;
