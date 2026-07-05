import React from 'react';
import { Group, Rect, Ellipse, Line, Text, Circle } from 'react-konva';
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
function ZoneLayer() {
  const zonesMap = useZoneStore(state => state.zones);
  const zones = Object.values(zonesMap);
  const selectedZoneId = useZoneStore(state => state.selectedZoneId);
  const selectZone = useZoneStore(state => state.selectZone);
  const activeTool = useZoneStore(state => state.activeTool);

  return (
    <Group>
      {zones.map(z => {
        const isActive = z.id === selectedZoneId;
        const fill = isActive ? 'rgba(130, 87, 229, 0.3)' : 'rgba(130, 87, 229, 0.08)';
        const stroke = isActive ? '#ffd700' : 'rgba(130, 87, 229, 0.5)';
        const strokeWidth = isActive ? 2.5 : 1.5;
        const title = z.data?.title || '';

        if (z.type === 'rect') {
          return (
            <Group key={z.id}>
              <Rect
                x={z.x} y={z.y} width={z.w} height={z.h}
                fill={fill} stroke={stroke} strokeWidth={strokeWidth}
                onClick={() => selectZone(z.id)}
                onTap={() => selectZone(z.id)}
                cornerRadius={2}
                listening={activeTool === 'pan'}
                perfectDrawEnabled={false}
                shadowForStrokeEnabled={false}
              />
              {title && (
                <Text
                  x={z.x} y={z.y}
                  width={z.w} height={z.h}
                  text={title}
                  fill="white"
                  fontSize={12}
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
                x={z.x + z.w / 2} y={z.y + z.h / 2} radiusX={z.w / 2} radiusY={z.h / 2}
                fill={fill} stroke={stroke} strokeWidth={strokeWidth}
                onClick={() => selectZone(z.id)}
                onTap={() => selectZone(z.id)}
                listening={activeTool === 'pan'}
                perfectDrawEnabled={false}
                shadowForStrokeEnabled={false}
              />
              {title && (
                <Text
                  x={z.x} y={z.y}
                  width={z.w} height={z.h}
                  text={title}
                  fill="white"
                  fontSize={12}
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
                fill={fill} stroke={stroke} strokeWidth={strokeWidth}
                closed={true}
                onClick={() => selectZone(z.id)}
                onTap={() => selectZone(z.id)}
                listening={activeTool === 'pan'}
                perfectDrawEnabled={false}
                shadowForStrokeEnabled={false}
              />
              {title && (
                <Text
                  x={minX} y={minY}
                  width={maxX - minX} height={maxY - minY}
                  text={title}
                  fill="white"
                  fontSize={12}
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
