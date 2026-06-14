import React from 'react';

interface VideoRecorderProps {
  isRecording: boolean;
  onToggle: () => void;
  isNeumorphic?: boolean;
  theme?: 'neumorphic-light' | 'neumorphic-dark' | 'glassmorphism-dark';
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({
  isRecording,
  onToggle,
  theme = 'glassmorphism-dark',
}) => {
  let btnClass = 'glass-button';
  let shortcutColor = 'text-white/25';

  if (theme === 'neumorphic-light') {
    btnClass = 'neumorphic-button';
    shortcutColor = 'text-black/20';
  } else if (theme === 'neumorphic-dark') {
    btnClass = 'neumorphic-button-dark';
    shortcutColor = 'text-white/20';
  }

  return (
    <button
      onClick={onToggle}
      className={`${btnClass} w-full justify-center ${isRecording ? 'danger' : ''}`}
    >
      {isRecording ? (
        <>
          <span className="w-2 h-2 rounded-full bg-red-500 recording-indicator" />
          <span>Stop Recording</span>
          <span className={`text-[10px] ml-1 font-mono ${shortcutColor}`}>R</span>
        </>
      ) : (
        <>
          <span>⏺</span>
          <span>Record Session</span>
          <span className={`text-[10px] ml-1 font-mono ${shortcutColor}`}>R</span>
        </>
      )}
    </button>
  );
};

export default VideoRecorder;
