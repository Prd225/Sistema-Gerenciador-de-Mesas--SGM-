import { Group, Rect, Ellipse, Line, Circle } from 'react-konva';
import React from 'react';
import type { NewShapeState } from './ZoneLayer';

/**
 * Renders the shape currently being drawn on the canvas.
 * Isolated into its own layer so it can re-render frequently 
 * without causing the rest of the canvas to re-render.
 */
function DrawingLayer({ newShape }: { newShape: NewShapeState | null }) {
  if (!newShape) return <Group listening={false} />;

  return (
    <Group listening={false}>
      {newShape.type === 'rect' && (
        <Rect
          x={newShape.x} y={newShape.y}
          width={newShape.width} height={newShape.height}
          fill="rgba(255, 255, 255, 0.2)"
          stroke="#fff"
          strokeWidth={1}
          dash={[4, 4]}
        />
      )}
      {newShape.type === 'ellipse' && (
        <Ellipse
          x={newShape.x + (newShape.width || 0) / 2} y={newShape.y + (newShape.height || 0) / 2}
          radiusX={Math.abs((newShape.width || 0) / 2)} radiusY={Math.abs((newShape.height || 0) / 2)}
          fill="rgba(255, 255, 255, 0.2)"
          stroke="#fff"
          strokeWidth={1}
          dash={[4, 4]}
        />
      )}
      {newShape.type === 'polygon' && newShape.points && (
        <Group>
          <Line
            points={newShape.points}
            stroke="#fff"
            strokeWidth={2}
            dash={[4, 4]}
            closed={false}
          />
          {newShape.points.length >= 2 && (
            <Circle 
              x={newShape.points[0]} 
              y={newShape.points[1]} 
              radius={5} 
              fill="#ffd700" 
            />
          )}
        </Group>
      )}
    </Group>
  );
}

export default React.memo(DrawingLayer);
