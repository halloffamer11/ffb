import React, { useRef, useEffect, useCallback } from 'react';

export interface CanvasHookProps {
  draw: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void;
  width?: number;
  height?: number;
  dpr?: number;
}

export function useCanvas({ draw, width, height, dpr = window.devicePixelRatio || 1 }: CanvasHookProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const container = canvas.parentElement;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    
    // Use provided dimensions or container size
    const canvasWidth = width || rect.width;
    const canvasHeight = height || rect.height;
    
    // Set actual canvas size for high DPI displays
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    
    // Set displayed size
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      draw(ctx, canvas);
    }
  }, [draw, width, height, dpr]);
  
  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);
  
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      draw(ctx, canvas);
    }
  }, [draw, dpr]);
  
  return { canvasRef, setupCanvas, redraw };
}

export interface CanvasProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  draw: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void;
}

export const Canvas: React.FC<CanvasProps> = ({ draw, ...props }) => {
  const { canvasRef, redraw } = useCanvas({ draw });
  
  useEffect(() => {
    redraw();
  }, [redraw]);
  
  return <canvas ref={canvasRef} {...props} />;
};