import React from 'react';
import { Group, Rect, Ellipse, Line, Text } from 'react-konva';
import { useZoneStore } from '@/store/useZoneStore';

export interface NewShapeState {
  type: 'rect' | 'ellipse' | 'polygon';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[]; // [x1, y1, x2, y2, ...]
}

/**
 * Renders zones on the map canvas.
 * Matches the .zone styling from DM_tool_6v.html with labels.
 */
function ZoneLayer({ scale = 1 }: { scale?: number }) {
  const zonesMap = useZoneStore((state) => state.zones);
  const zones = Object.values(zonesMap);
  const selectedZoneId = useZoneStore((state) => state.selectedZoneId);
  const selectZone = useZoneStore((state) => state.selectZone);
  const activeTool = useZoneStore((state) => state.activeTool);

  return (
    <Group>
      {zones.map((z) => {
        const isActive = z.id === selectedZoneId;
        const s = z.data?.style;

        // Helper to apply opacity to hex
        const applyOp = (hex: string | undefined, active: boolean) => {
          if (!hex)
            return active
              ? 'rgba(130, 87, 229, 0.3)'
              : 'rgba(130, 87, 229, 0.08)';
          if (hex.startsWith('#') && hex.length === 7)
            return active ? `${hex}4D` : `${hex}1A`; // 30% and 10%
          return hex;
        };

        const fill = applyOp(s?.fillColor, isActive);
        const stroke = isActive
          ? '#ffd700'
          : s?.borderColor || 'rgba(130, 87, 229, 0.5)';
        const textColor = s?.textColor || 'white';
        const strokeWidth = isActive ? 2.5 : 1.5;
        const title = z.data?.title || '';

        if (z.type === 'rect') {
          return (
            <Group key={z.id}>
              <Rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                onClick={() => selectZone(z.id)}
                onTap={() => selectZone(z.id)}
                onMouseEnter={(e) => {
                  if (activeTool === 'select') {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'pointer';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTool === 'select') {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = '';
                  }
                }}
                cornerRadius={2}
                listening={activeTool === 'pan' || activeTool === 'select'}
                perfectDrawEnabled={false}
                shadowForStrokeEnabled={false}
              />
              {title && (
                <Text
                  x={z.x}
                  y={z.y}
                  width={z.w}
                  height={z.h}
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
        }
        if (z.type === 'ellipse') {
          return (
            <Group key={z.id}>
              <Ellipse
                x={z.x + z.w / 2}
                y={z.y + z.h / 2}
                radiusX={z.w / 2}
                radiusY={z.h / 2}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                onClick={() => selectZone(z.id)}
                onTap={() => selectZone(z.id)}
                onMouseEnter={(e) => {
                  if (activeTool === 'select') {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'pointer';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTool === 'select') {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = '';
                  }
                }}
                listening={activeTool === 'pan' || activeTool === 'select'}
                perfectDrawEnabled={false}
                shadowForStrokeEnabled={false}
              />
              {title && (
                <Text
                  x={z.x}
                  y={z.y}
                  width={z.w}
                  height={z.h}
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
        }

        if (z.type === 'polygon' && z.points) {
          // Bounding box for text
          const minX = Math.min(...z.points.filter((_, i) => i % 2 === 0));
          const minY = Math.min(...z.points.filter((_, i) => i % 2 !== 0));
          const maxX = Math.max(...z.points.filter((_, i) => i % 2 === 0));
          const maxY = Math.max(...z.points.filter((_, i) => i % 2 !== 0));

          return (
            <Group key={z.id}>
              <Line
                points={z.points}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                closed={true}
                onClick={() => selectZone(z.id)}
                onTap={() => selectZone(z.id)}
                onMouseEnter={(e) => {
                  if (activeTool === 'select') {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'pointer';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTool === 'select') {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = '';
                  }
                }}
                listening={activeTool === 'pan' || activeTool === 'select'}

                perfectDrawEnabled={false}
                shadowForStrokeEnabled={false}
              />
              {title && (
                <Text
                  x={minX}
                  y={minY}
                  width={maxX - minX}
                  height={maxY - minY}
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
        }
        return null;
      })}

      {/* Drawing layer was moved to DrawingLayer.tsx */}
    </Group>
  );
}

export default React.memo(ZoneLayer);
