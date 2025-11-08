import React, { useRef, useEffect, useState } from 'react';

interface AvatarPreviewProps {
  textureUrl: string;
  canvasSize?: number;
  direction?: number;
  className?: string;
  animate?: boolean;
}

export const AvatarPreview: React.FC<AvatarPreviewProps> = ({
  textureUrl,
  canvasSize = 64,
  direction = 0,
  className = '',
  animate = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const frameRef = useRef(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.src = textureUrl;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [textureUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx || !image) return;

    const draw = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the sprite frame (32x32 from sprite sheet)
      // Each character sprite sheet has 4 rows (directions) and 3 columns (animation frames)
      const frameX = animate ? (frameRef.current % 3) * 32 : 0;
      const frameY = direction * 32;

      ctx.drawImage(
        image,
        frameX,
        frameY,
        32,
        32, // Source rectangle
        0,
        0,
        canvasSize,
        canvasSize // Destination rectangle
      );

      if (animate) {
        frameRef.current = (frameRef.current + 0.1) % 3;
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    if (animate) {
      draw();
    } else {
      draw();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [image, direction, canvasSize, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className={`pixelated ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
