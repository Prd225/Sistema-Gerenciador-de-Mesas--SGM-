import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from './button';
import { RotateCcw, RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onConfirm: (croppedBase64: string) => void;
  onCancel: () => void;
  size?: number; // Output size of the token image
}

export function ImageCropper({ imageSrc, onConfirm, onCancel, size = 256 }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  
  // Transform state
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasWidth = 300;
  const canvasHeight = 300;
  const radius = 120; // Radius of the circular mask preview

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Just in case
    img.src = imageSrc;
    img.onload = () => {
      setImage(img);
      // Center image initially
      const initScale = Math.max((radius * 2) / img.width, (radius * 2) / img.height);
      setScale(initScale);
      setPos({ x: canvasWidth / 2, y: canvasHeight / 2 });
    };
  }, [imageSrc]);

  // Draw on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw checkered background (optional, or just dark)
    ctx.fillStyle = '#121214';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Save context for image transform
    ctx.save();
    
    // Move to position
    ctx.translate(pos.x, pos.y);
    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);
    // Apply flip and scale
    ctx.scale(flipH ? -scale : scale, flipV ? -scale : scale);

    // Draw image centered at 0,0
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    
    ctx.restore();

    // Draw overlay mask (darkened area outside the circle)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.rect(0, 0, canvasWidth, canvasHeight);
    ctx.arc(canvasWidth / 2, canvasHeight / 2, radius, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    
    // Draw circle border
    ctx.beginPath();
    ctx.arc(canvasWidth / 2, canvasHeight / 2, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

  }, [image, pos, scale, rotation, flipH, flipV]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse Handlers for Panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = 0.05;
    const dir = e.deltaY > 0 ? -1 : 1;
    setScale(prev => Math.max(0.1, Math.min(prev + dir * zoomFactor, 5)));
  };

  const handleConfirm = () => {
    if (!image) return;
    // Create an offscreen canvas for the final export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = size;
    exportCanvas.height = size;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const exportRadius = size / 2;
    
    // We need to map the position/scale from the preview canvas to the export canvas
    // In preview: center of circle is at (canvasWidth/2, canvasHeight/2)
    // In export: center of circle is at (size/2, size/2)
    // The scale in export is: scale * (exportRadius / previewRadius)
    
    const scaleFactor = exportRadius / radius;
    
    // Offset of image center relative to the circle center in the preview canvas
    const offsetX = pos.x - (canvasWidth / 2);
    const offsetY = pos.y - (canvasHeight / 2);

    ctx.save();
    
    // Optional: clip to circle in the exported image as well, or leave it square with transparency.
    // Let's clip it so it's perfectly round.
    ctx.beginPath();
    ctx.arc(exportRadius, exportRadius, exportRadius, 0, Math.PI * 2);
    ctx.clip();
    
    // Translate to the center of the export canvas, plus the relative offset
    ctx.translate(exportRadius + offsetX * scaleFactor, exportRadius + offsetY * scaleFactor);
    
    ctx.rotate((rotation * Math.PI) / 180);
    
    const finalScale = scale * scaleFactor;
    ctx.scale(flipH ? -finalScale : finalScale, flipV ? -finalScale : finalScale);
    
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();

    const dataUrl = exportCanvas.toDataURL('image/png', 0.9);
    onConfirm(dataUrl);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative rounded-md overflow-hidden border border-[#323238]">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="cursor-move"
          style={{ touchAction: 'none' }} // Prevent scrolling when dragging on touch devices
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 w-full px-2">
        {/* Zoom Slider */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#a8a8b3]">Zoom</span>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 accent-[#8257e5]"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setRotation(r => (r - 90) % 360)} title="Girar Esquerda">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setRotation(r => (r + 90) % 360)} title="Girar Direita">
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setFlipH(f => !f)} title="Espelhar Horizontalmente">
            <FlipHorizontal className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setFlipV(f => !f)} title="Espelhar Verticalmente">
            <FlipVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 w-full mt-2">
        <Button variant="outline" onClick={onCancel} className="border-[#323238] bg-transparent text-[#e1e1e6] hover:bg-white/5">
          Voltar
        </Button>
        <Button onClick={handleConfirm} className="bg-[#8257e5] hover:bg-[#9466ff] text-white">
          Aplicar Imagem
        </Button>
      </div>
    </div>
  );
}
