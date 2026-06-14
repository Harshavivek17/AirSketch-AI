import React from 'react';
import { CanvasTab } from '@/types';

interface TabBarProps {
  tabs: CanvasTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onCloseTab: (id: string) => void;
  isNeumorphic?: boolean;
  theme?: 'neumorphic-light' | 'neumorphic-dark' | 'glassmorphism-dark';
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onCloseTab,
  theme = 'glassmorphism-dark',
}) => {
  if (tabs.length <= 1) return null;

  const isLight = theme === 'neumorphic-light';
  const isDarkNeumorphic = theme === 'neumorphic-dark';
  const isNeumorphic = isLight || isDarkNeumorphic;

  let dockClass = 'glass-panel';
  if (isLight) {
    dockClass = 'neumorphic-panel bg-[#edf1f5]/95 border-white/70 shadow-[5px_5px_12px_#d5dde7,-5px_-5px_12px_rgba(255,255,255,0.9)]';
  } else if (isDarkNeumorphic) {
    dockClass = 'neumorphic-panel-dark bg-[#14141a]/95 border-white/[0.03] shadow-[5px_5px_12px_#09090c,-5px_-5px_12px_rgba(255,255,255,0.03)]';
  }

  return (
    <div
      className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center p-1 gap-1 border transition-all duration-300 ${dockClass}`}
      style={{ borderRadius: '14px' }}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        
        let tabClass = 'text-white/40 hover:text-white/70 border border-transparent';
        if (isActive) {
          if (isLight) {
            tabClass = 'bg-[#edf1f5] text-[#0088FF] border border-black/[0.01] shadow-[inset_1.5px_1.5px_3px_#d5dde7,inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.9)] font-bold';
          } else if (isDarkNeumorphic) {
            tabClass = 'bg-[#14141a] text-[#00ffff] border border-white/[0.01] shadow-[inset_1.5px_1.5px_3px_#09090c,inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.025)] font-bold';
          } else {
            tabClass = 'border-neon-cyan/40 text-neon-cyan';
          }
        } else {
          if (isLight) {
            tabClass = 'text-[#5e6e80] hover:text-[#2a3b50]';
          } else if (isDarkNeumorphic) {
            tabClass = 'text-white/50 hover:text-white/80';
          }
        }

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer ${tabClass}`}
            style={{
              borderRadius: '10px',
              boxShadow:
                isActive && !isNeumorphic
                  ? '0 0 12px rgba(0,255,255,0.15)'
                  : undefined,
            }}
          >
            <span>Canvas {index + 1}</span>
            {tabs.length > 1 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className={`transition-colors ml-1 text-[10px] ${
                  isLight
                    ? 'text-black/20 hover:text-red-500'
                    : 'text-white/20 hover:text-red-400'
                }`}
              >
                ✕
              </span>
            )}
          </button>
        );
      })}
      
      <button
        onClick={onAddTab}
        className={`w-7 h-7 flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isLight
            ? 'neumorphic-button border border-white/85 text-[#5e6e80] hover:text-[#0088FF] shadow-[2.5px_2.5px_5px_#d5dde7,-2.5px_-2.5px_5px_rgba(255,255,255,0.9)]'
            : isDarkNeumorphic
            ? 'neumorphic-button-dark border border-white/[0.03] text-white/50 hover:text-[#00ffff] shadow-[2.5px_2.5px_5px_#09090c,-2.5px_-2.5px_5px_rgba(255,255,255,0.03)]'
            : 'glass-panel text-white/30 hover:text-neon-cyan hover:border-neon-cyan/30'
        }`}
        style={{ borderRadius: '10px' }}
        title="New canvas tab"
      >
        +
      </button>
    </div>
  );
};

export default TabBar;
