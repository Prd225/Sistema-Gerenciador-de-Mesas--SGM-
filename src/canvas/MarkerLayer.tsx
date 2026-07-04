import { Layer, Group, Circle, Text, Line } from 'react-konva';
import { useZoneStore } from '@/store/useZoneStore';

/**
 * Renders map pin markers. Each marker is a pin icon with a label.
 * Matching the original .marker style from DM_tool_6v.
 */
export default function MarkerLayer() {
  const markersMap = useZoneStore(state => state.markers);
  const markers = Object.values(markersMap);
  const updateMarker = useZoneStore(state => state.updateMarker);
  const activeTool = useZoneStore(state => state.activeTool);

  return (
    <Layer>
      {markers.map(marker => (
        <Group
          key={marker.id}
          x={marker.x}
          y={marker.y}
          draggable={activeTool === 'pan'}
          listening={activeTool === 'pan'}
          onDragEnd={(e) => {
            updateMarker(marker.id, {
              x: e.target.x(),
              y: e.target.y()
            });
          }}
        >
          {/* Pin stem */}
          <Line
            points={[0, 0, 0, -20]}
            stroke="#e55757"
            strokeWidth={3}
            lineCap="round"
          />
          {/* Pin head */}
          <Circle
            x={0}
            y={-20}
            radius={10}
            fill="#e55757"
            stroke="#ffffff"
            strokeWidth={2}
            shadowColor="black"
            shadowBlur={8}
            shadowOpacity={0.7}
            shadowOffsetY={2}
          />
          {/* Pin dot */}
          <Circle
            x={0}
            y={-20}
            radius={3}
            fill="white"
          />
          {/* Label */}
          {marker.text && (
            <Text
              text={marker.text}
              fill="white"
              fontSize={11}
              fontStyle="bold"
              x={14}
              y={-28}
              shadowColor="black"
              shadowBlur={4}
            />
          )}
        </Group>
      ))}
    </Layer>
  );
}
