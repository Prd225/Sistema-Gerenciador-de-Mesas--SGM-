import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useZoneStore } from '@/store/useZoneStore';
import { useTokenStore } from '@/store/useTokenStore';
import { useMasterPanelStore } from '@/store/useMasterPanelStore';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import type { ActiveTool } from '@/types/game';

import GridLayer from './GridLayer';
import BackgroundLayer from './BackgroundLayer';
import ZoneLayer, { type NewShapeState } from './ZoneLayer';
import TokenLayer from './TokenLayer';
import MarkerLayer from './MarkerLayer';
import DrawingLayer from './DrawingLayer';
import CanvasContextMenu from './CanvasContextMenu';

const generateId = () =>
  window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 11);

export default function StageMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

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
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const previousToolRef = useRef<ActiveTool>('pan');
  const isSpaceDownRef = useRef(false);
  const [newShape, setNewShape] = useState<NewShapeState | null>(null);
  const drawStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    worldX: number;
    worldY: number;
    zoneId?: string | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0,
    zoneId: null,
  });

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

  // --- Mouse Down ---
  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      // If context menu was open, close it
      setContextMenu((prev) =>
        prev.isOpen ? { ...prev, isOpen: false } : prev,
      );

      // Right-click is handled by onContextMenu, do not draw or drag
      if (e.evt.button === 2) {
        e.evt.preventDefault();
        return;
      }

      // Don't interfere when clicking on existing shapes/tokens
      if (e.target !== e.target.getStage()) return;

      const stage = stageRef.current;
      if (!stage) return;
      const pos = getRelativePointerPosition(stage);

      // Alt + Click ou Botão do Meio (roda) -> Emite Ping tático
      if (e.evt.altKey || e.evt.button === 1) {
        e.evt.preventDefault();
        useMultiplayerStore.getState().sendPing(pos.x, pos.y);
        return;
      }

      if (activeTool === 'pan') {
        if (e.evt.button === 0) setIsDraggingStage(true);
        return;
      }
      if (activeTool === 'edit-bg') return;

      if (activeTool === 'select') {
        useZoneStore.getState().setSelectedNodeIds([]);
        setIsDrawing(true);
        drawStartRef.current = { x: pos.x, y: pos.y };
        setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
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
          setIsDrawing(true);
          setPolyPoints([pos.x, pos.y]);
          setNewShape({
            type: 'polygon',
            x: pos.x,
            y: pos.y,
            points: [pos.x, pos.y],
          });
        } else {
          setPolyPoints((prev) => [...prev, pos.x, pos.y]);
          setNewShape((prev) =>
            prev
              ? { ...prev, points: [...(prev.points || []), pos.x, pos.y] }
              : null,
          );
        }
      }
    },
    [
      activeTool,
      addMarker,
      getRelativePointerPosition,
      setRightSidebarOpen,
      isDrawing,
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
      setNewShape((prev) => {
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
  }, [
    isDrawing,
    newShape,
    getRelativePointerPosition,
    polyPoints,
    activeTool,
    selectionRect,
  ]);

  // --- Mouse Up ---
  const handleMouseUp = useCallback(() => {
    setIsDraggingStage(false);
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
          customPois: [],
          customEvents: [],
        },
      });

      // Auto-select and open sidebar (matching original behavior)
      selectZone(id);
      // Keeps active tool for continuous drawing workflow
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

  // --- Context menu handlers ---
  const handleContextMenu = useCallback(
    (e: KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const pos = getRelativePointerPosition(stage);
      setContextMenu({
        isOpen: true,
        x: e.evt.clientX,
        y: e.evt.clientY,
        worldX: pos.x,
        worldY: pos.y,
        zoneId: null,
      });
    },
    [getRelativePointerPosition],
  );

  const handleZoneContextMenu = useCallback(
    (zoneId: string, e: any) => {
      const stage = stageRef.current;
      if (!stage) return;
      const pos = getRelativePointerPosition(stage);
      setContextMenu({
        isOpen: true,
        x: e.evt?.clientX ?? e.clientX ?? 0,
        y: e.evt?.clientY ?? e.clientY ?? 0,
        worldX: pos.x,
        worldY: pos.y,
        zoneId,
      });
    },
    [getRelativePointerPosition],
  );

  const handleCenterView = useCallback(
    (targetX: number, targetY: number) => {
      setPosition({
        x: dimensions.width / 2 - targetX * scale,
        y: dimensions.height / 2 - targetY * scale,
      });
    },
    [dimensions.width, dimensions.height, scale],
  );

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable ||
        useMasterPanelStore.getState().isOpen
      ) {
        return;
      }

      if (e.code === 'Space' && !e.repeat && !isSpaceDownRef.current) {
        e.preventDefault();
        isSpaceDownRef.current = true;
        if (activeTool !== 'pan') {
          previousToolRef.current = activeTool;
          setActiveTool('pan');
        }
      }

      if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const ids = useZoneStore.getState().selectedNodeIds;
        if (ids.length > 0) {
          const zState = useZoneStore.getState();
          const tState = useTokenStore.getState();
          ids.forEach((id) => {
            if (tState.tokens.some((t) => t.id === id))
              tState.updateToken(id, { x: null, y: null });
            if (zState.markers[id]) zState.removeMarker(id);
          });
          useZoneStore.getState().setSelectedNodeIds([]);
        }
      }

      if (e.key === 'Escape') {
        setIsDrawing(false);
        setNewShape(null);
        setPolyPoints([]);
        if (activeTool.startsWith('draw')) setActiveTool('pan');
      }
      if (
        e.key === 'Enter' &&
        activeTool === 'draw-poly' &&
        polyPoints.length >= 6
      ) {
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
          data: {
            title: 'Nova Zona Poligonal',
            desc: '',
            visits: 0,
            customPois: [],
            customEvents: [],
          },
        });

        selectZone(id);
        // Keeps active tool for continuous drawing workflow
        setIsDrawing(false);
        setNewShape(null);
        setPolyPoints([]);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isSpaceDownRef.current) {
        isSpaceDownRef.current = false;
        if (previousToolRef.current && previousToolRef.current !== 'pan') {
          setActiveTool(previousToolRef.current);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTool, polyPoints, setActiveTool, addZone, selectZone]);

  const cursorStyle = (() => {
    if (activeTool === 'pan') {
      return isDraggingStage ? 'grabbing' : 'grab';
    }
    if (activeTool === 'select') {
      return selectionRect ? 'crosshair' : 'default';
    }
    if (activeTool === 'add-marker') {
      return 'crosshair';
    }
    if (activeTool.startsWith('draw')) {
      return 'crosshair';
    }
    if (activeTool === 'edit-bg') {
      return 'move';
    }
    return 'default';
  })();

  // Synchronize cursor with stage container and outer element
  useEffect(() => {
    const stage = stageRef.current;
    if (stage) {
      stage.container().style.cursor = cursorStyle;
    }
    if (containerRef.current) {
      containerRef.current.style.cursor = cursorStyle;
    }
  }, [cursorStyle]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ cursor: cursorStyle }}
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
        onDragStart={(e) => {
          if (e.target === stageRef.current) {
            setIsDraggingStage(true);
          }
        }}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setIsDraggingStage(false);
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
          <ZoneLayer scale={scale} onContextMenuZone={handleZoneContextMenu} />
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
          <DrawingLayer newShape={newShape} />
        </Layer>
      </Stage>

      {/* Modern Context Menu on Canvas / Zones */}
      <CanvasContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        worldX={contextMenu.worldX}
        worldY={contextMenu.worldY}
        zoneId={contextMenu.zoneId}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        onCenterView={handleCenterView}
      />
    </div>
  );
}
