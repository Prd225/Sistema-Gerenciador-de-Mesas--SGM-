import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useZoneStore } from '@/store/useZoneStore';
import { useTokenStore } from '@/store/useTokenStore';

import GridLayer from './GridLayer';
import BackgroundLayer from './BackgroundLayer';
import ZoneLayer, { type NewShapeState } from './ZoneLayer';
import TokenLayer from './TokenLayer';
import MarkerLayer from './MarkerLayer';
import DrawingLayer from './DrawingLayer';

const generateId = () =>
  window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 11);

export default function StageMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const activeTool = useZoneStore(state => state.activeTool);
  const setActiveTool = useZoneStore(state => state.setActiveTool);
  const addZone = useZoneStore(state => state.addZone);
  const selectZone = useZoneStore(state => state.selectZone);
  const addMarker = useZoneStore(state => state.addMarker);
  const addBgImage = useZoneStore(state => state.addBgImage);
  const setRightSidebarOpen = useZoneStore(state => state.setRightSidebarOpen);

  const updateToken = useTokenStore(state => state.updateToken);

  const [isDrawing, setIsDrawing] = useState(false);
  const [newShape, setNewShape] = useState<NewShapeState | null>(null);
  const drawStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Polygon state
  const [polyPoints, setPolyPoints] = useState<number[]>([]);

  // --- Resize Observer ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // --- PanTo Listener ---
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { x, y } = e.detail;
      setPosition({
        x: dimensions.width / 2 - x * scale,
        y: dimensions.height / 2 - y * scale,
      });
    };
    window.addEventListener('panTo', handler as EventListener);
    return () => window.removeEventListener('panTo', handler as EventListener);
  }, [dimensions.width, dimensions.height, scale]);

  // --- Convert screen coords to map/world coords ---
  const getRelativePointerPosition = useCallback((stage: any) => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return transform.point(pos);
  }, []);

  // --- Zoom (Wheel) ---
  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = stage.scaleX();
    const scaleBy = 1.1;
    const direction = e.evt.deltaY < 0 ? 1 : -1;
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.min(Math.max(0.1, newScale), 8);

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, []);

  // --- Mouse Down ---
  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    // Don't interfere when clicking on existing shapes/tokens
    if (e.target !== e.target.getStage()) return;

    const stage = stageRef.current;
    if (!stage) return;
    const pos = getRelativePointerPosition(stage);

    if (activeTool === 'pan' || activeTool === 'edit-bg') return;

    // Right-click → create marker (matching original contextmenu behavior)
    if (e.evt.button === 2) {
      e.evt.preventDefault();
      addMarker({ id: generateId(), x: pos.x, y: pos.y, text: 'Novo Marcador' });
      setRightSidebarOpen(true);
      return;
    }

    if (activeTool === 'add-marker') {
      addMarker({ id: generateId(), x: pos.x, y: pos.y, text: 'Novo Marcador' });
      setRightSidebarOpen(true);
      return;
    }

    // Start drawing zone
    if (activeTool === 'draw-rect' || activeTool === 'draw-ellipse') {
      setIsDrawing(true);
      drawStartRef.current = { x: pos.x, y: pos.y };
      setNewShape({ type: activeTool === 'draw-rect' ? 'rect' : 'ellipse', x: pos.x, y: pos.y, width: 0, height: 0 });
    }

    if (activeTool === 'draw-poly') {
      if (!isDrawing) {
        setIsDrawing(true);
        setPolyPoints([pos.x, pos.y]);
        setNewShape({ type: 'polygon', x: pos.x, y: pos.y, points: [pos.x, pos.y] });
      } else {
        setPolyPoints(prev => [...prev, pos.x, pos.y]);
        setNewShape(prev => prev ? { ...prev, points: [...(prev.points || []), pos.x, pos.y] } : null);
      }
    }
  }, [activeTool, addMarker, getRelativePointerPosition, setRightSidebarOpen, isDrawing]);

  // --- Mouse Move ---
  const handleMouseMove = useCallback(() => {
    if (!isDrawing || !newShape) return;

    const stage = stageRef.current;
    if (!stage) return;
    const pos = getRelativePointerPosition(stage);

    if (newShape.type === 'polygon' && activeTool === 'draw-poly') {
      setNewShape(prev => {
        if (!prev || !prev.points) return prev;
        const currentPoints = [...polyPoints, pos.x, pos.y];
        return { ...prev, points: currentPoints };
      });
      return;
    }

    const w = pos.x - drawStartRef.current.x;
    const h = pos.y - drawStartRef.current.y;

    setNewShape({
      ...newShape,
      x: drawStartRef.current.x,
      y: drawStartRef.current.y,
      width: w,
      height: h,
    });
  }, [isDrawing, newShape, getRelativePointerPosition, polyPoints, activeTool]);

  // --- Mouse Up ---
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !newShape) return;
    if (activeTool === 'draw-poly') return; // Handled by Enter key

    setIsDrawing(false);

    const absW = Math.abs(newShape.width || 0);
    const absH = Math.abs(newShape.height || 0);

    if (absW > 10 && absH > 10) {
      const x = (newShape.width || 0) < 0 ? drawStartRef.current.x + (newShape.width || 0) : drawStartRef.current.x;
      const y = (newShape.height || 0) < 0 ? drawStartRef.current.y + (newShape.height || 0) : drawStartRef.current.y;
      const id = generateId();

      addZone({
        id,
        type: newShape.type === 'rect' ? 'rect' : 'ellipse',
        x,
        y,
        w: absW,
        h: absH,
        data: {
          title: 'Nova Zona',
          desc: '',
          visits: 0,
          customPois: [],
          customEvents: [],
        },
      });

      // Auto-select and open sidebar (matching original behavior)
      selectZone(id);
      // Switch back to pan
      setActiveTool('pan');
    }

    setNewShape(null);
  }, [isDrawing, newShape, addZone, selectZone, setActiveTool]);

  // --- Context menu prevention ---
  const handleContextMenu = useCallback((e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
  }, []);

  // --- HTML5 Drag & Drop (for tokens from roster + image files) ---
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    // Get drop position in world coordinates
    const stageBox = stage.container().getBoundingClientRect();
    const stageX = e.clientX - stageBox.left;
    const stageY = e.clientY - stageBox.top;
    const worldX = (stageX - position.x) / scale;
    const worldY = (stageY - position.y) / scale;

    // Check if it's a file drop (image)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          addBgImage({
            id: generateId(),
            src: evt.target?.result as string,
            x: worldX,
            y: worldY,
            scale: 1,
            rotation: 0,
          });
        };
        reader.readAsDataURL(file);
        return;
      }
    }

    // Check if it's a token drop from roster
    const tokenId = e.dataTransfer.getData('text/plain');
    if (tokenId) {
      updateToken(tokenId, { x: worldX, y: worldY });
    }
  }, [position, scale, addBgImage, updateToken]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        setActiveTool('pan');
        setIsDrawing(false);
        setNewShape(null);
        setPolyPoints([]);
      }
      if (e.key === 'Escape') {
        setIsDrawing(false);
        setNewShape(null);
        setPolyPoints([]);
        if (activeTool.startsWith('draw')) setActiveTool('pan');
      }
      if (e.key === 'Enter' && activeTool === 'draw-poly' && polyPoints.length >= 6) {
        // polyPoints has [x, y] coordinates, so length >= 6 means at least 3 points
        const minX = Math.min(...polyPoints.filter((_, i) => i % 2 === 0));
        const minY = Math.min(...polyPoints.filter((_, i) => i % 2 !== 0));
        const id = generateId();

        addZone({
          id,
          type: 'polygon',
          x: minX,
          y: minY,
          w: 0,
          h: 0,
          points: polyPoints,
          data: { title: 'Nova Zona Poligonal', desc: '', visits: 0, customPois: [], customEvents: [] },
        });

        selectZone(id);
        setActiveTool('pan');
        setIsDrawing(false);
        setNewShape(null);
        setPolyPoints([]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTool, polyPoints, setActiveTool, addZone, selectZone]);

  const cursorStyle =
    activeTool === 'pan' ? 'grab' :
    activeTool === 'edit-bg' ? 'default' :
    'crosshair';

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={activeTool === 'pan'}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setPosition({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        style={{ cursor: cursorStyle }}
      >
        <Layer>
          <GridLayer />
          <BackgroundLayer />
        </Layer>
        <Layer>
          <ZoneLayer />
          <TokenLayer />
          <MarkerLayer />
        </Layer>
        <Layer>
          <DrawingLayer newShape={newShape} />
        </Layer>
      </Stage>
    </div>
  );
}
