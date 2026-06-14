import React, { forwardRef } from 'react';

interface DrawingCanvasProps {
  width: number;
  height: number;
}

const DrawingCanvas = forwardRef<HTMLCanvasElement, DrawingCanvasProps>(
  ({ width, height }, ref) => {
    return (
      <canvas
        ref={ref}
        width={width}
        height={height}
        className="absolute top-0 left-0 w-full h-full"
        style={{ zIndex: 10 }}
      />
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
