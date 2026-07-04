import { Layer, Rect } from 'react-konva';
import { useEffect, useState } from 'react';

const GRID_SIZE = 40;
const GRID_EXTENT = 10000;

/**
 * High-performance grid using a repeating canvas pattern instead of thousands of Line elements.
 * Draws a single grid tile to an offscreen canvas, then uses Konva's fillPatternImage
 * to tile it across the entire extent.
 */
export default function GridLayer() {
  const [patternImage, setPatternImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw one grid cell
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;

    // Right edge
    ctx.beginPath();
    ctx.moveTo(GRID_SIZE, 0);
    ctx.lineTo(GRID_SIZE, GRID_SIZE);
    ctx.stroke();

    // Bottom edge
    ctx.beginPath();
    ctx.moveTo(0, GRID_SIZE);
    ctx.lineTo(GRID_SIZE, GRID_SIZE);
    ctx.stroke();

    // Convert canvas to Image to ensure Konva renders it properly
    const img = new window.Image();
    img.src = canvas.toDataURL();
    img.onload = () => {
      setPatternImage(img);
    };
  }, []);

  if (!patternImage) return <Layer listening={false} />;

  return (
    <Layer listening={false}>
      <Rect
        x={-GRID_EXTENT}
        y={-GRID_EXTENT}
        width={GRID_EXTENT * 2}
        height={GRID_EXTENT * 2}
        fillPatternImage={patternImage}
        fillPatternRepeat="repeat"
        fillPatternOffset={{ x: GRID_EXTENT % GRID_SIZE, y: GRID_EXTENT % GRID_SIZE }}
        listening={false}
      />
    </Layer>
  );
}
