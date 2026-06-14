import React, { forwardRef } from 'react';

interface CameraViewProps {
  visible: boolean;
}

const CameraView = forwardRef<HTMLVideoElement, CameraViewProps>(({ visible }, ref) => {
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className="absolute top-0 left-0 w-full h-full object-cover"
      style={{
        transform: 'scaleX(-1)',
        opacity: visible ? 0.6 : 0,
        zIndex: 1,
        transition: 'opacity 0.3s ease',
      }}
    />
  );
});

CameraView.displayName = 'CameraView';

export default CameraView;
