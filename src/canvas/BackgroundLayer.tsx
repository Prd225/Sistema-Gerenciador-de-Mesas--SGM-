import { useEffect, useState } from 'react';
import { Layer, Image as KonvaImage } from 'react-konva';
import { useZoneStore } from '@/store/useZoneStore';
import type { BgImage } from '@/types/game';

function BgImageComponent({ bg }: { bg: BgImage }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const activeTool = useZoneStore(state => state.activeTool);
  const updateBgImage = useZoneStore(state => state.updateBgImage);

  useEffect(() => {
    const img = new window.Image();
    img.src = bg.src;
    img.onload = () => setImage(img);
  }, [bg.src]);

  if (!image) return null;

  const isDraggable = activeTool === 'edit-bg';

  return (
    <KonvaImage
      image={image}
      x={bg.x}
      y={bg.y}
      scaleX={bg.scale}
      scaleY={bg.scale}
      rotation={bg.rotation}
      draggable={isDraggable}
      listening={isDraggable}
      onDragEnd={(e) => {
        updateBgImage(bg.id, { x: e.target.x(), y: e.target.y() });
      }}
      // Visual feedback when editable
      stroke={isDraggable ? '#ffd700' : undefined}
      strokeWidth={isDraggable ? 2 : 0}
      dash={isDraggable ? [8, 4] : undefined}
      onWheel={(e) => {
        if (!isDraggable) return;
        e.cancelBubble = true; // Stop event from propagating to Stage
        e.evt.preventDefault();
        const direction = e.evt.deltaY > 0 ? -1 : 1;
        // Adjust the multiplier for finer/coarser scaling
        const newScale = Math.max(0.1, bg.scale + direction * 0.1);
        updateBgImage(bg.id, { scale: newScale });
      }}
    />
  );
}

export default function BackgroundLayer() {
  const bgImages = useZoneStore(state => state.bgImages);

  return (
    <Layer>
      {bgImages.map(bg => <BgImageComponent key={bg.id} bg={bg} />)}
    </Layer>
  );
}
