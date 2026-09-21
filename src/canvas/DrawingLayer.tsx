import { Group, Rect, Ellipse, Line, Circle } from 'react-konva';
import React from 'react';
import type { NewShapeState } from './ZoneLayer';

/**
 * Renders the shape currently being drawn on the canvas.
 * Isolated into its own layer so it can re-render frequently
 * without causing the rest of the canvas to re-render.
 */
function DrawingLayer({
  newShape,
  scale = 1,
}: {
  newShape: NewShapeState | null;
  scale?: number;
}) {
  if (!newShape) return <Group listening={false} />;

  const isPolygon =
    newShape.type === 'polygon' &&
    newShape.points &&
    newShape.points.length >= 2;
  const polyPoints = isPolygon ? newShape.points! : [];

  // When polygon has >= 6 coordinates (at least 3 vertices), it can be closed
  const canClose = isPolygon && polyPoints.length >= 6;
  const startX = isPolygon ? polyPoints[0] : 0;
  const startY = isPolygon ? polyPoints[1] : 0;
  const lastX = isPolygon ? polyPoints[polyPoints.length - 2] : 0;
  const lastY = isPolygon ? polyPoints[polyPoints.length - 1] : 0;
  const isSnappedToStart =
    canClose && Math.hypot(lastX - startX, lastY - startY) < 1;

  return (
    <Group listening={false}>
      {newShape.type === 'rect' && (
        <Rect
          x={
            (newShape.width || 0) < 0
              ? newShape.x + (newShape.width || 0)
              : newShape.x
          }
          y={
            (newShape.height || 0) < 0
              ? newShape.y + (newShape.height || 0)
              : newShape.y
          }
          width={Math.abs(newShape.width || 0)}
          height={Math.abs(newShape.height || 0)}
          fill="rgba(130, 87, 229, 0.2)"
          stroke="#8257e5"
          strokeWidth={2 / scale}
          dash={[6 / scale, 4 / scale]}
        />
      )}
      {newShape.type === 'ellipse' && (
        <Ellipse
          x={newShape.x + (newShape.width || 0) / 2}
          y={newShape.y + (newShape.height || 0) / 2}
          radiusX={Math.abs((newShape.width || 0) / 2)}
          radiusY={Math.abs((newShape.height || 0) / 2)}
          fill="rgba(130, 87, 229, 0.2)"
          stroke="#8257e5"
          strokeWidth={2 / scale}
          dash={[6 / scale, 4 / scale]}
        />
      )}
      {isPolygon && (
        <Group>
          {/* Fill preview when polygon has >= 3 vertices */}
          {canClose && (
            <Line
              points={polyPoints}
              fill="rgba(130, 87, 229, 0.15)"
              closed={true}
              listening={false}
            />
          )}

          {/* Polygon line preview */}
          <Line
            points={polyPoints}
            stroke={isSnappedToStart ? '#ffd700' : '#8257e5'}
            strokeWidth={2 / scale}
            dash={[6 / scale, 4 / scale]}
            closed={false}
          />

          {/* Intermediate vertex markers */}
          {polyPoints.map((_, idx) => {
            if (idx % 2 !== 0 || idx === 0 || idx >= polyPoints.length - 2)
              return null;
            return (
              <Circle
                key={idx}
                x={polyPoints[idx]}
                y={polyPoints[idx + 1]}
                radius={3.5 / scale}
                fill="#8257e5"
                stroke="#ffffff"
                strokeWidth={1 / scale}
              />
            );
          })}

          {/* Start vertex marker (Target to close) */}
          <Circle
            x={startX}
            y={startY}
            radius={(canClose ? (isSnappedToStart ? 9 : 7) : 5) / scale}
            fill={canClose ? '#ffd700' : '#8257e5'}
            stroke="#ffffff"
            strokeWidth={(canClose ? 2 : 1) / scale}
            shadowBlur={canClose ? 8 / scale : 0}
            shadowColor="#ffd700"
          />

          {/* Outer target ring on start vertex when polygon can be closed */}
          {canClose && (
            <Circle
              x={startX}
              y={startY}
              radius={(isSnappedToStart ? 14 : 12) / scale}
              stroke="#ffd700"
              strokeWidth={1.5 / scale}
              dash={[3 / scale, 3 / scale]}
            />
          )}
        </Group>
      )}
    </Group>
  );
}

export default React.memo(DrawingLayer);
