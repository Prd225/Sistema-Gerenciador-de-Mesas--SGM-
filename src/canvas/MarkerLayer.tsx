import React from 'react';
import { Group, Circle, Text, Line } from 'react-konva';
import { useZoneStore } from '@/store/useZoneStore';
import { useTokenStore } from '@/store/useTokenStore';

/**
 * Renders map pin markers. Each marker is a pin icon with a label.
 * Matching the original .marker style from DM_tool_6v.
 */
function MarkerLayer() {
  const markersMap = useZoneStore(state => state.markers);
  const markers = Object.values(markersMap);
  const updateMarker = useZoneStore(state => state.updateMarker);
  const activeTool = useZoneStore(state => state.activeTool);
  const selectedNodeIds = useZoneStore(state => state.selectedNodeIds);
  const setSelectedNodeIds = useZoneStore(state => state.setSelectedNodeIds);
  const dragStartPositions = React.useRef<Record<string, { x: number; y: number }>>({});

  return (
    <Group>
      {markers.map(marker => {
        const isSelected = selectedNodeIds.includes(marker.id);
        return (
        <Group
          key={marker.id}
          x={marker.x}
          y={marker.y}
          draggable={activeTool === 'pan' || activeTool === 'select'}
          listening={activeTool === 'pan' || activeTool === 'select'}
          onClick={(e) => {
            if (activeTool === 'select') {
              e.cancelBubble = true;
              if (e.evt.shiftKey) {
                const newSelected = isSelected ? selectedNodeIds.filter(id => id !== marker.id) : [...selectedNodeIds, marker.id];
                setSelectedNodeIds(newSelected);
              } else {
                if (!isSelected) setSelectedNodeIds([marker.id]);
              }
            }
          }}
          onDragStart={() => {
            if (activeTool !== 'select') return;
            let currentSelected = selectedNodeIds;
            if (!isSelected) {
               setSelectedNodeIds([marker.id]);
               currentSelected = [marker.id];
            }
            
            const tState = useTokenStore.getState();
            const zState = useZoneStore.getState();
            
            dragStartPositions.current = currentSelected.reduce((acc: any, id) => {
               const token = tState.tokens.find(tk => tk.id === id);
               if (token) acc[id] = { x: token.x!, y: token.y! };
               const m = zState.markers[id];
               if (m) acc[id] = { x: m.x, y: m.y };
               return acc;
            }, {});
          }}
          onDragMove={(e) => {
            if (activeTool !== 'select') return;
            if (isSelected && selectedNodeIds.length > 1) {
              const startX = dragStartPositions.current[marker.id]?.x || 0;
              const startY = dragStartPositions.current[marker.id]?.y || 0;
              const dx = e.target.x() - startX;
              const dy = e.target.y() - startY;
              
              const tState = useTokenStore.getState();
              const zState = useZoneStore.getState();
              
              selectedNodeIds.forEach(id => {
                 if (id !== marker.id) {
                    const start = dragStartPositions.current[id];
                    if (start) {
                       if (tState.tokens.some(tk => tk.id === id)) {
                          tState.updateToken(id, { x: start.x + dx, y: start.y + dy });
                       } else if (zState.markers[id]) {
                          zState.updateMarker(id, { x: start.x + dx, y: start.y + dy });
                       }
                    }
                 }
              });
            }
          }}
          onDragEnd={(e) => {
            if (activeTool !== 'select') {
              updateMarker(marker.id, { x: e.target.x(), y: e.target.y() });
              return;
            }
            const startX = dragStartPositions.current[marker.id]?.x || marker.x;
            const startY = dragStartPositions.current[marker.id]?.y || marker.y;
            const dx = e.target.x() - startX;
            const dy = e.target.y() - startY;

            const tState = useTokenStore.getState();
            const zState = useZoneStore.getState();
            
            selectedNodeIds.forEach(id => {
               const start = dragStartPositions.current[id];
               if (start) {
                  if (tState.tokens.some(tk => tk.id === id)) {
                     tState.updateToken(id, { x: start.x + dx, y: start.y + dy });
                  } else if (zState.markers[id]) {
                     zState.updateMarker(id, { x: start.x + dx, y: start.y + dy });
                  }
               }
            });
          }}
        >
          {isSelected && (
            <Circle
              x={0}
              y={-20}
              radius={16}
              stroke="#00A1FF"
              strokeWidth={2}
              dash={[4, 4]}
              perfectDrawEnabled={false}
              listening={false}
            />
          )}
          {/* Pin stem */}
          <Line
            points={[0, 0, 0, -20]}
            stroke="#e55757"
            strokeWidth={3}
            lineCap="round"
            perfectDrawEnabled={false}
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
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
          />
          {/* Pin dot */}
          <Circle
            x={0}
            y={-20}
            radius={3}
            fill="white"
            perfectDrawEnabled={false}
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
              perfectDrawEnabled={false}
            />
          )}
        </Group>
      )})}
    </Group>
  );
}

export default React.memo(MarkerLayer);
