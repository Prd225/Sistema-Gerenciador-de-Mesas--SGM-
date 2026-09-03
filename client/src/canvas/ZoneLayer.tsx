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

interface ZoneLayerProps {
  scale?: number;
  onContextMenuZone?: (zoneId: string, e: any) => void;
}

/**
 * Renders zones on the map canvas.
 * Matches the .zone styling from DM_tool_6v.html with labels.
 */
function ZoneLayer({ scale = 1, onContextMenuZone }: ZoneLayerProps) {
  const zonesMap = useZoneStore((state) => state.zones);
  const zones = Object.values(zonesMap);
  const selectedZoneId = useZoneStore((state) => state.selectedZoneId);
  const selectedZoneIds = useZoneStore((state) => state.selectedZoneIds);
  const selectZone = useZoneStore((state) => state.selectZone);
  const activeTool = useZoneStore((state) => state.activeTool);

  const DEFAULT_COLOR = '#8257e5';

  return (
    <Group>
      {zones.map((z) => {
        const isActive =
          selectedZoneIds && selectedZoneIds.length > 0
            ? selectedZoneIds.includes(z.id)
            : z.id === selectedZoneId;
        const s = z.data?.style;

        // Helper to apply opacity to hex
        const applyOp = (hex: string | undefined, active: boolean) => {
          const raw = hex && hex.trim() !== '' ? hex.trim() : DEFAULT_COLOR;
          if (raw.startsWith('#') && raw.length === 7) {
            return active ? `${raw}4D` : `${raw}1A`; // 30% and 10%
          }
          return raw;
        };

        const fill = applyOp(s?.fillColor, isActive);
        // ALWAYS keep the zone's real border color
        const stroke =
          s?.borderColor && s.borderColor.trim() !== ''
            ? s.borderColor.trim()
            : DEFAULT_COLOR;
        const textColor =
          s?.textColor && s.textColor.trim() !== ''
            ? s.textColor.trim()
            : '#ffffff';
        const strokeWidth = 2;
        const title = z.data?.title || '';

        const handleContextMenu = (e: any) => {
          e.evt.preventDefault();
          e.cancelBubble = true;
          onContextMenuZone?.(z.id, e);
        };

        if (z.type === 'rect') {
          return (
            <Group key={z.id}>
              {/* Highlight externo quando selecionada */}
              {isActive && (
                <Rect
                  x={z.x - 4}
                  y={z.y - 4}
                  width={z.w + 8}
                  height={z.h + 8}
                  stroke="#ffd700"
                  strokeWidth={1.5}
                  dash={[6, 4]}
                  cornerRadius={4}
                  shadowColor="#ffd700"
                  shadowBlur={5}
                  shadowOpacity={0.8}
                  listening={false}
                  perfectDrawEnabled={false}
                  shadowForStrokeEnabled={true}
                />
              )}
              <Rect
                id={z.id}
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                onClick={() => selectZone(z.id)}
                onTap={() => selectZone(z.id)}
                onContextMenu={handleContextMenu}
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
              {/* Highlight externo quando selecionada */}
              {isActive && (
                <Ellipse
                  x={z.x + z.w / 2}
                  y={z.y + z.h / 2}
                  radiusX={z.w / 2 + 4}
                  radiusY={z.h / 2 + 4}
                  stroke="#ffd700"
                  strokeWidth={1.5}
                  dash={[6, 4]}
                  shadowColor="#ffd700"
                  shadowBlur={5}
                  shadowOpacity={0.8}
                  listening={false}
                  perfectDrawEnabled={false}
                  shadowForStrokeEnabled={true}
                />
              )}
              <Ellipse
                id={z.id}
                x={z.x + z.w / 2}
                y={z.y + z.h / 2}
                radiusX={z.w / 2}
                radiusY={z.h / 2}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                onClick={() => selectZone(z.id)}
                onTap={() => selectZone(z.id)}
                onContextMenu={handleContextMenu}
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
              {/* Highlight externo quando selecionada (sob a linha base) */}
              {isActive && (
                <Line
                  points={z.points}
                  stroke="#ffd700"
                  strokeWidth={6}
                  dash={[8, 4]}
                  closed={true}
                  shadowColor="#ffd700"
                  shadowBlur={5}
                  shadowOpacity={0.8}
                  listening={false}
                  perfectDrawEnabled={false}
                />
              )}
              <Line
                id={z.id}
                points={z.points}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                closed={true}
                onClick={() => selectZone(z.id)}
                onTap={() => selectZone(z.id)}
                onContextMenu={handleContextMenu}
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
