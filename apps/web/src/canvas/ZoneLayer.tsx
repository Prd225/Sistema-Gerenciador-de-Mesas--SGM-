import React, { useRef, useEffect } from 'react';
import { Group, Rect, Ellipse, Line, Text, Transformer } from 'react-konva';
import { useZoneStore } from '@/store/useZoneStore';
import type { Zone } from '@/types/game';

export interface NewShapeState {
  type: 'rect' | 'ellipse' | 'polygon';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[]; // [x1, y1, x2, y2, ...]
}

function ZoneLayer({ scale = 1 }: { scale?: number }) {
  const zonesMap = useZoneStore((state) => state.zones);
  const zones = Object.values(zonesMap);
  const selectedZoneId = useZoneStore((state) => state.selectedZoneId);
  const selectZone = useZoneStore((state) => state.selectZone);
  const openZoneSidebar = useZoneStore((state) => state.openZoneSidebar);
  const updateZoneTransform = useZoneStore(
    (state) => state.updateZoneTransform,
  );
  const activeTool = useZoneStore((state) => state.activeTool);

  const trRef = useRef<any>(null);
  const nodeRefs = useRef<Record<string, any>>({});

  const isEditTool = activeTool === 'edit-zone';
  const canDrag = isEditTool || activeTool === 'select';

  useEffect(() => {
    if (trRef.current) {
      if (selectedZoneId && nodeRefs.current[selectedZoneId] && isEditTool) {
        trRef.current.nodes([nodeRefs.current[selectedZoneId]]);
      } else {
        trRef.current.nodes([]);
      }
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedZoneId, isEditTool, zones]);

  const handleSelect = (e: any, id: string) => {
    e.cancelBubble = true;
    if (activeTool === 'select' || activeTool === 'edit-zone') {
      selectZone(id);
    } else if (activeTool === 'pan') {
      openZoneSidebar(id);
    }
  };

  const handleDoubleClick = (id: string) => {
    openZoneSidebar(id);
  };

  const handleDragEnd = (e: any, id: string) => {
    updateZoneTransform(id, {
      x: Math.round(e.target.x()),
      y: Math.round(e.target.y()),
    });
  };

  const handleTransformEnd = (id: string) => {
    const node = nodeRefs.current[id];
    if (!node) return;

    const zone = zonesMap[id];
    if (!zone) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const newX = node.x();
    const newY = node.y();
    const newRotation = node.rotation();

    // Reset scale so text inside doesn't stretch, and apply it to dimensions instead.
    node.scaleX(1);
    node.scaleY(1);

    const updates: Partial<Zone> = {
      rotation: Math.round(newRotation),
    };

    if (zone.type === 'polygon' && zone.points) {
      // Find current relative points
      const xs = zone.points.filter((_, i) => i % 2 === 0);
      const ys = zone.points.filter((_, i) => i % 2 !== 0);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const pts =
        minX > 5 && Math.abs(minX - zone.x) < 2
          ? zone.points.map((p, i) => (i % 2 === 0 ? p - minX : p - minY))
          : zone.points;

      const rawScaled = pts.map((p, i) =>
        Math.round(i % 2 === 0 ? p * scaleX : p * scaleY),
      );

      // In case scaleX or scaleY was negative (flipped):
      const sXs = rawScaled.filter((_, i) => i % 2 === 0);
      const sYs = rawScaled.filter((_, i) => i % 2 !== 0);
      const sMinX = Math.min(...sXs);
      const sMinY = Math.min(...sYs);
      const sMaxX = Math.max(...sXs);
      const sMaxY = Math.max(...sYs);

      const normalizedPts = rawScaled.map((p, i) =>
        Math.round(i % 2 === 0 ? p - sMinX : p - sMinY),
      );

      updates.x = Math.round(newX + sMinX);
      updates.y = Math.round(newY + sMinY);
      updates.points = normalizedPts;
      updates.w = Math.max(10, Math.round(sMaxX - sMinX));
      updates.h = Math.max(10, Math.round(sMaxY - sMinY));
    } else {
      const finalX = scaleX < 0 ? newX + zone.w * scaleX : newX;
      const finalY = scaleY < 0 ? newY + zone.h * scaleY : newY;
      updates.x = Math.round(finalX);
      updates.y = Math.round(finalY);
      updates.w = Math.max(10, Math.round(zone.w * Math.abs(scaleX)));
      updates.h = Math.max(10, Math.round(zone.h * Math.abs(scaleY)));
    }

    if (updates.x !== undefined) node.x(updates.x);
    if (updates.y !== undefined) node.y(updates.y);

    updateZoneTransform(id, updates);
    if (trRef.current) {
      trRef.current.update();
    }
  };

  return (
    <Group>
      {zones.map((z) => {
        if (z.type === ('group' as any)) return null;

        const isActive = selectedZoneId === z.id;
        const s = z.data?.style;

        const applyOp = (hex: string | undefined, active: boolean) => {
          if (!hex)
            return active
              ? 'rgba(130, 87, 229, 0.3)'
              : 'rgba(130, 87, 229, 0.08)';
          if (hex.startsWith('#') && hex.length === 7)
            return active ? `${hex}4D` : `${hex}1A`;
          return hex;
        };

        const fill = applyOp(s?.fillColor, isActive);
        const stroke = isActive
          ? '#ffd700'
          : s?.borderColor || 'rgba(130, 87, 229, 0.5)';
        const textColor = s?.textColor || 'white';
        const strokeWidth = isActive ? 2.5 : 1.5;
        const title = z.data?.title || '';

        // Bounding calculations for text centering
        let textX = 0;
        let textY = 0;
        let textW = z.w;
        let textH = z.h;

        let polygonPoints: number[] | undefined = undefined;
        if (z.type === 'polygon' && z.points && z.points.length >= 2) {
          const xs = z.points.filter((_, i) => i % 2 === 0);
          const ys = z.points.filter((_, i) => i % 2 !== 0);
          const minX = Math.min(...xs);
          const minY = Math.min(...ys);
          // If legacy points were saved in absolute coordinates, shift to relative
          const pts =
            minX > 5 && Math.abs(minX - z.x) < 2
              ? z.points.map((p, i) => (i % 2 === 0 ? p - minX : p - minY))
              : z.points;
          polygonPoints = pts;
          const pXs = pts.filter((_, i) => i % 2 === 0);
          const pYs = pts.filter((_, i) => i % 2 !== 0);
          const pMinX = Math.min(...pXs);
          const pMinY = Math.min(...pYs);
          const pMaxX = Math.max(...pXs);
          const pMaxY = Math.max(...pYs);
          textX = pMinX;
          textY = pMinY;
          textW = Math.max(10, pMaxX - pMinX);
          textH = Math.max(10, pMaxY - pMinY);
        }

        const commonProps = {
          fill,
          stroke,
          strokeWidth,
          onClick: (e: any) => handleSelect(e, z.id),
          onTap: (e: any) => handleSelect(e, z.id),
          onDblClick: () => handleDoubleClick(z.id),
          onDblTap: () => handleDoubleClick(z.id),
          listening:
            activeTool === 'pan' ||
            activeTool === 'select' ||
            activeTool === 'edit-zone',
          perfectDrawEnabled: false,
          shadowForStrokeEnabled: false,
        };

        return (
          <Group
            key={z.id}
            ref={(node) => {
              if (node) {
                nodeRefs.current[z.id] = node;
              } else {
                delete nodeRefs.current[z.id];
              }
            }}
            x={z.x}
            y={z.y}
            rotation={z.rotation || 0}
            draggable={canDrag}
            onDragStart={(e) => {
              e.cancelBubble = true;
              if (selectedZoneId !== z.id) {
                selectZone(z.id);
              }
            }}
            onDragMove={() => {
              if (trRef.current && isEditTool) {
                trRef.current.update();
              }
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              handleDragEnd(e, z.id);
              if (trRef.current && isEditTool) {
                trRef.current.update();
              }
            }}
            onTransformEnd={() => handleTransformEnd(z.id)}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) {
                if (canDrag) {
                  container.style.cursor = 'move';
                } else if (activeTool === 'pan') {
                  container.style.cursor = 'pointer';
                }
              }
              e.currentTarget.to({ opacity: 0.88, duration: 0.1 });
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) {
                container.style.cursor =
                  activeTool === 'pan'
                    ? 'grab'
                    : activeTool === 'edit-bg'
                      ? 'default'
                      : 'crosshair';
              }
              e.currentTarget.to({ opacity: 1, duration: 0.1 });
            }}
          >
            {z.type === 'rect' && (
              <Rect
                width={z.w}
                height={z.h}
                cornerRadius={2}
                {...commonProps}
              />
            )}

            {z.type === 'ellipse' && (
              <Ellipse
                x={z.w / 2}
                y={z.h / 2}
                radiusX={z.w / 2}
                radiusY={z.h / 2}
                {...commonProps}
              />
            )}

            {z.type === 'polygon' && polygonPoints && (
              <Line points={polygonPoints} closed={true} {...commonProps} />
            )}

            {title && (
              <Text
                x={textX}
                y={textY}
                width={textW}
                height={textH}
                text={title}
                fill={textColor}
                fontSize={Math.max(4, 12 / scale)}
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
                listening={false}
                shadowColor="black"
                shadowBlur={4}
                shadowOpacity={0.9}
                perfectDrawEnabled={false}
              />
            )}
          </Group>
        );
      })}

      {isEditTool && (
        <Transformer
          ref={trRef}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          borderStroke="#ffd700"
          borderDash={[4, 4]}
          anchorStroke="#ffd700"
          anchorFill="#202024"
          anchorSize={8}
          anchorCornerRadius={2}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </Group>
  );
}

export default React.memo(ZoneLayer);
