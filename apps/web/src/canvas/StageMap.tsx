import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useZoneStore } from '@/store/useZoneStore';
import { useTokenStore } from '@/store/useTokenStore';
import { useMasterPanelStore } from '@/store/useMasterPanelStore';

import GridLayer from './GridLayer';
import BackgroundLayer from './BackgroundLayer';
import ZoneLayer, { type NewShapeState } from './ZoneLayer';
import TokenLayer from './TokenLayer';
import MarkerLayer from './MarkerLayer';
import DrawingLayer from './DrawingLayer';

// Distancia na tela (px) em que um segundo clique conta como o mesmo ponto.
const REPEAT_CLICK_PX = 10;

const generateId = () =>
  window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 11);

export default function StageMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(() => {
    try {
      const saved = sessionStorage.getItem('sgm_viewport');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.scale === 'number') return parsed.scale;
      }
    } catch {
      // ignore
    }
    return 1;
  });
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = sessionStorage.getItem('sgm_viewport');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.position &&
          typeof parsed.position.x === 'number' &&
          typeof parsed.position.y === 'number'
        ) {
          return parsed.position;
        }
      }
    } catch {
      // ignore
    }
    return { x: 0, y: 0 };
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(
        'sgm_viewport',
        JSON.stringify({ scale, position }),
      );
    } catch {
      // ignore
    }
  }, [scale, position]);

  const activeTool = useZoneStore((state) => state.activeTool);
  const setActiveTool = useZoneStore((state) => state.setActiveTool);
  const addZone = useZoneStore((state) => state.addZone);
  const selectZone = useZoneStore((state) => state.selectZone);
  const addMarker = useZoneStore((state) => state.addMarker);
  const addBgImage = useZoneStore((state) => state.addBgImage);
  const setRightSidebarOpen = useZoneStore(
    (state) => state.setRightSidebarOpen,
  );

  const updateToken = useTokenStore((state) => state.updateToken);

  const [isDrawing, setIsDrawing] = useState(false);
  const [newShape, setNewShape] = useState<NewShapeState | null>(null);
  const drawStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Polygon state
  const [polyPoints, setPolyPoints] = useState<number[]>([]);

  // Selection state
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

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

  // --- Touch & Mouse Down ---
  const lastTouchDistRef = useRef<number | null>(null);
  // Se o ultimo clique no desenho de poligono caiu sobre o vertice anterior.
  const lastClickRepeatedRef = useRef(false);

  // Cancel drawing in progress if tool changes to non-drawing
  useEffect(() => {
    if (
      activeTool !== 'draw-poly' &&
      activeTool !== 'draw-rect' &&
      activeTool !== 'draw-ellipse' &&
      activeTool !== 'select'
    ) {
      setIsDrawing(false);
      setNewShape(null);
      setPolyPoints([]);
    }
  }, [activeTool]);

  // --- Finish Polygon Creation ---
  const finishPolygon = useCallback(
    (pts: number[]) => {
      // Need at least 3 vertices (6 coordinates)
      const cleaned: number[] = [];
      for (let i = 0; i < pts.length; i += 2) {
        const x = pts[i];
        const y = pts[i + 1];
        if (cleaned.length >= 2) {
          const lastX = cleaned[cleaned.length - 2];
          const lastY = cleaned[cleaned.length - 1];
          if (Math.hypot(x - lastX, y - lastY) < 3) {
            continue;
          }
        }
        cleaned.push(x, y);
      }

      // If last vertex is identical to the first, remove it since closed={true} connects them
      if (
        cleaned.length >= 6 &&
        Math.hypot(
          cleaned[cleaned.length - 2] - cleaned[0],
          cleaned[cleaned.length - 1] - cleaned[1],
        ) < 5
      ) {
        cleaned.splice(cleaned.length - 2, 2);
      }

      if (cleaned.length < 6) {
        setIsDrawing(false);
        setNewShape(null);
        setPolyPoints([]);
        return;
      }

      const xs = cleaned.filter((_, i) => i % 2 === 0);
      const ys = cleaned.filter((_, i) => i % 2 !== 0);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const w = Math.max(10, maxX - minX);
      const h = Math.max(10, maxY - minY);

      // Local points relative to bounding box top-left (minX, minY)
      const localPoints = cleaned.map((val, idx) =>
        idx % 2 === 0 ? Math.round(val - minX) : Math.round(val - minY),
      );

      const id = generateId();
      addZone({
        id,
        type: 'polygon',
        x: Math.round(minX),
        y: Math.round(minY),
        w: Math.round(w),
        h: Math.round(h),
        points: localPoints,
        data: {
          title: 'Nova Zona Poligonal',
          desc: '',
          visits: 0,
          style: {
            borderColor: '#8257e5',
            fillColor: '#8257e5',
            textColor: '#ffffff',
          },
          customPois: [],
          customEvents: [],
          customHighlights: [],
          customThreats: [],
          customInventory: [],
          activeMarkers: ['destaques', 'ameacas', 'inventario'],
          markerColors: {},
          markerTextColors: {},
        },
      });

      selectZone(id);
      setActiveTool('pan');
      setIsDrawing(false);
      setNewShape(null);
      setPolyPoints([]);
    },
    [addZone, selectZone, setActiveTool],
  );

  // --- Double Click ---
  const handleDblClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (activeTool !== 'draw-poly' || polyPoints.length < 6) return;
      // O Konva dispara dblclick para dois cliques rapidos mesmo longe um do
      // outro. So fecha se o segundo clique caiu perto do primeiro (e por
      // isso nao virou vertice); senao, clicar os vertices em ritmo normal
      // fechava o poligono no 3o ponto.
      if (!lastClickRepeatedRef.current) return;

      e.evt.preventDefault();
      finishPolygon(polyPoints);
    },
    [activeTool, polyPoints, finishPolygon],
  );

  // --- Mouse Down ---
  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      const pos = getRelativePointerPosition(stage);

      // Suporte a multitoque (2 dedos no tablet/mobile para zoom)
      if ('touches' in e.evt && e.evt.touches && e.evt.touches.length === 2) {
        const p1 = e.evt.touches[0];
        const p2 = e.evt.touches[1];
        lastTouchDistRef.current = Math.hypot(
          p1.clientX - p2.clientX,
          p1.clientY - p2.clientY,
        );
        return;
      }

      // Don't interfere when clicking on existing shapes/tokens
      if (e.target !== e.target.getStage()) return;

      if (activeTool === 'pan' || activeTool === 'edit-bg') return;

      if (activeTool === 'select') {
        useZoneStore.getState().setSelectedZoneId(null);
        useZoneStore.getState().setSelectedNodeIds([]);
        setIsDrawing(true);
        drawStartRef.current = { x: pos.x, y: pos.y };
        setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
        return;
      }

      if (activeTool === 'edit-zone') {
        useZoneStore.getState().setSelectedZoneId(null);
        return;
      }

      // Right-click → create marker (matching original contextmenu behavior)
      if ('button' in e.evt && e.evt.button === 2) {
        e.evt.preventDefault();
        addMarker({
          id: generateId(),
          x: pos.x,
          y: pos.y,
          text: 'Novo Marcador',
        });
        setRightSidebarOpen(true);
        return;
      }

      if (activeTool === 'add-marker') {
        addMarker({
          id: generateId(),
          x: pos.x,
          y: pos.y,
          text: 'Novo Marcador',
        });
        setRightSidebarOpen(true);
        return;
      }

      // Start drawing zone
      if (activeTool === 'draw-rect' || activeTool === 'draw-ellipse') {
        setIsDrawing(true);
        drawStartRef.current = { x: pos.x, y: pos.y };
        setNewShape({
          type: activeTool === 'draw-rect' ? 'rect' : 'ellipse',
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
        });
      }

      if (activeTool === 'draw-poly') {
        if (!isDrawing) {
          lastClickRepeatedRef.current = false;
          setIsDrawing(true);
          setPolyPoints([pos.x, pos.y]);
          setNewShape({
            type: 'polygon',
            x: pos.x,
            y: pos.y,
            points: [pos.x, pos.y],
          });
        } else {
          // If at least 3 vertices (6 coordinates), check if clicking near start vertex to close
          if (polyPoints.length >= 6) {
            const startX = polyPoints[0];
            const startY = polyPoints[1];
            const dist = Math.hypot(pos.x - startX, pos.y - startY);
            if (dist <= 25 / scale) {
              finishPolygon(polyPoints);
              return;
            }
          }

          // Otherwise add new vertex. Clique ate REPEAT_CLICK_PX (na tela) do
          // ultimo vertice conta como repeticao, nao como vertice novo.
          const lastX = polyPoints[polyPoints.length - 2];
          const lastY = polyPoints[polyPoints.length - 1];
          const repeated =
            Math.hypot(pos.x - lastX, pos.y - lastY) < REPEAT_CLICK_PX / scale;
          lastClickRepeatedRef.current = repeated;
          if (!repeated) {
            const nextPoints = [...polyPoints, pos.x, pos.y];
            setPolyPoints(nextPoints);
            setNewShape((prev) =>
              prev ? { ...prev, points: [...nextPoints, pos.x, pos.y] } : null,
            );
          }
        }
      }
    },
    [
      activeTool,
      addMarker,
      getRelativePointerPosition,
      setRightSidebarOpen,
      isDrawing,
      polyPoints,
      scale,
      finishPolygon,
    ],
  );

  // --- Mouse Move ---
  const handleMouseMove = useCallback(() => {
    if (!isDrawing) return;

    const stage = stageRef.current;
    if (!stage) return;
    const pos = getRelativePointerPosition(stage);

    if (activeTool === 'select' && selectionRect) {
      setSelectionRect({
        ...selectionRect,
        width: pos.x - drawStartRef.current.x,
        height: pos.y - drawStartRef.current.y,
      });
      return;
    }

    if (!newShape) return;

    if (newShape.type === 'polygon' && activeTool === 'draw-poly') {
      let targetX = pos.x;
      let targetY = pos.y;
      if (polyPoints.length >= 6) {
        const startX = polyPoints[0];
        const startY = polyPoints[1];
        if (Math.hypot(pos.x - startX, pos.y - startY) <= 25 / scale) {
          targetX = startX;
          targetY = startY;
        }
      }
      setNewShape((prev) => {
        if (!prev || !prev.points) return prev;
        return { ...prev, points: [...polyPoints, targetX, targetY] };
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
  }, [
    isDrawing,
    newShape,
    getRelativePointerPosition,
    polyPoints,
    activeTool,
    selectionRect,
    scale,
  ]);

  // --- Mouse Up ---
  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;

    if (activeTool === 'select' && selectionRect) {
      setIsDrawing(false);
      const box = {
        x: Math.min(selectionRect.x, selectionRect.x + selectionRect.width),
        y: Math.min(selectionRect.y, selectionRect.y + selectionRect.height),
        width: Math.abs(selectionRect.width),
        height: Math.abs(selectionRect.height),
      };

      if (box.width > 5 && box.height > 5) {
        const tState = useTokenStore.getState();
        const zState = useZoneStore.getState();
        const newSelected: string[] = [];

        tState.tokens.forEach((t) => {
          if (t.x !== null && t.y !== null) {
            if (
              t.x >= box.x &&
              t.x <= box.x + box.width &&
              t.y >= box.y &&
              t.y <= box.y + box.height
            ) {
              newSelected.push(t.id);
            }
          }
        });
        Object.values(zState.markers).forEach((m) => {
          if (
            m.x >= box.x &&
            m.x <= box.x + box.width &&
            m.y >= box.y &&
            m.y <= box.y + box.height
          ) {
            newSelected.push(m.id);
          }
        });

        useZoneStore.getState().setSelectedNodeIds(newSelected);
      }
      setSelectionRect(null);
      return;
    }

    if (!newShape) return;
    if (activeTool === 'draw-poly') return; // Handled by Enter key

    setIsDrawing(false);

    const absW = Math.abs(newShape.width || 0);
    const absH = Math.abs(newShape.height || 0);

    if (absW > 10 && absH > 10) {
      const x =
        (newShape.width || 0) < 0
          ? drawStartRef.current.x + (newShape.width || 0)
          : drawStartRef.current.x;
      const y =
        (newShape.height || 0) < 0
          ? drawStartRef.current.y + (newShape.height || 0)
          : drawStartRef.current.y;
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
          style: {
            borderColor: '#8257e5',
            fillColor: '#8257e5',
            textColor: '#ffffff',
          },
          customPois: [],
          customEvents: [],
          customHighlights: [],
          customThreats: [],
          customInventory: [],
          activeMarkers: ['destaques', 'ameacas', 'inventario'],
          markerColors: {},
          markerTextColors: {},
        },
      });

      // Auto-select and open sidebar (matching original behavior)
      selectZone(id);
      // Switch back to pan
      setActiveTool('pan');
    }

    setNewShape(null);
  }, [
    isDrawing,
    newShape,
    addZone,
    selectZone,
    setActiveTool,
    activeTool,
    selectionRect,
  ]);

  // --- Context menu prevention ---
  const handleContextMenu = useCallback((e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
  }, []);

  // --- Touch Move & Pinch-to-zoom (Mobile / Tablet) ---
  const handleTouchMove = useCallback(
    (e: KonvaEventObject<TouchEvent>) => {
      const touches = e.evt.touches;
      if (touches && touches.length === 2) {
        e.evt.preventDefault();
        const p1 = { x: touches[0].clientX, y: touches[0].clientY };
        const p2 = { x: touches[1].clientX, y: touches[1].clientY };
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

        if (lastTouchDistRef.current !== null) {
          const stage = stageRef.current;
          if (!stage) return;
          const oldScale = stage.scaleX();
          const factor = dist / lastTouchDistRef.current;
          let newScale = oldScale * factor;
          newScale = Math.min(Math.max(0.1, newScale), 8);

          const center = {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
          };

          const mousePointTo = {
            x: (center.x - stage.x()) / oldScale,
            y: (center.y - stage.y()) / oldScale,
          };

          setScale(newScale);
          setPosition({
            x: center.x - mousePointTo.x * newScale,
            y: center.y - mousePointTo.y * newScale,
          });
        }
        lastTouchDistRef.current = dist;
        return;
      }
      handleMouseMove();
    },
    [handleMouseMove],
  );

  const handleTouchEnd = useCallback(() => {
    lastTouchDistRef.current = null;
    handleMouseUp();
  }, [handleMouseUp]);

  // --- HTML5 Drag & Drop (for tokens from roster + image files) ---
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
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
    },
    [position, scale, addBgImage, updateToken],
  );

  // --- Keyboard (Shortcuts & Polygon) ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable ||
        useMasterPanelStore.getState().isOpen
      ) {
        return;
      }

      if (e.code === 'Space' || e.key === '1') {
        e.preventDefault();
        setActiveTool('pan');
        setIsDrawing(false);
        setNewShape(null);
        setPolyPoints([]);
      }

      if (e.key === 'v' || e.key === 'V' || e.key === '2') {
        setActiveTool('select');
      }

      if (e.key === '3') {
        setActiveTool('edit-zone');
      }

      if (e.key === '4') {
        setActiveTool('draw-rect');
      }

      if (e.key === '5') {
        setActiveTool('draw-ellipse');
      }

      if (e.key === '6') {
        setActiveTool('draw-poly');
      }

      if (e.key === '7') {
        setActiveTool('add-marker');
      }

      if (e.key === '8') {
        setActiveTool('edit-bg');
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const ids = useZoneStore.getState().selectedNodeIds;
        const selectedZoneId = useZoneStore.getState().selectedZoneId;
        if (ids.length > 0) {
          const zState = useZoneStore.getState();
          const tState = useTokenStore.getState();
          ids.forEach((id) => {
            if (tState.tokens.some((t) => t.id === id))
              tState.updateToken(id, { x: null, y: null });
            if (zState.markers[id]) zState.removeMarker(id);
          });
          useZoneStore.getState().setSelectedNodeIds([]);
        } else if (selectedZoneId && activeTool === 'edit-zone') {
          useZoneStore.getState().removeZone(selectedZoneId);
          useZoneStore.getState().setSelectedZoneId(null);
        }
      }

      if (e.key === 'Escape') {
        setIsDrawing(false);
        setNewShape(null);
        setPolyPoints([]);
        useZoneStore.getState().setSelectedZoneId(null);
        useZoneStore.getState().setSelectedNodeIds([]);
        if (activeTool.startsWith('draw')) setActiveTool('pan');
      }
      if (
        e.key === 'Enter' &&
        activeTool === 'draw-poly' &&
        polyPoints.length >= 6
      ) {
        e.preventDefault();
        finishPolygon(polyPoints);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTool, polyPoints, setActiveTool, finishPolygon]);

  const cursorStyle =
    activeTool === 'pan'
      ? 'grab'
      : activeTool === 'edit-bg'
        ? 'default'
        : 'crosshair';

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 select-none"
      style={{ touchAction: 'none' }}
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
        onTouchStart={handleMouseDown}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDblClick={handleDblClick}
        onContextMenu={handleContextMenu}
        style={{ cursor: cursorStyle }}
      >
        <Layer>
          <GridLayer />
          <BackgroundLayer />
        </Layer>
        <Layer>
          <ZoneLayer scale={scale} />
          <TokenLayer scale={scale} />
          <MarkerLayer scale={scale} />
          {selectionRect && (
            <Rect
              x={Math.min(
                selectionRect.x,
                selectionRect.x + selectionRect.width,
              )}
              y={Math.min(
                selectionRect.y,
                selectionRect.y + selectionRect.height,
              )}
              width={Math.abs(selectionRect.width)}
              height={Math.abs(selectionRect.height)}
              fill="rgba(0, 161, 255, 0.2)"
              stroke="#00A1FF"
              strokeWidth={1}
            />
          )}
        </Layer>
        <Layer>
          <DrawingLayer newShape={newShape} scale={scale} />
        </Layer>
      </Stage>
    </div>
  );
}
