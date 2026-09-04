import React from 'react';
import { Group, Text, Image as KonvaImage, Rect } from 'react-konva';
import { useZoneStore } from '@/store/useZoneStore';
import useImage from 'use-image';

const iconTypeSvgMap = {
  pin: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  sword: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 19-6-6"></path><path d="m5 21-2-2"></path><path d="m8 16-4 4"></path><path d="M9.5 17.5 21 6V3h-3L6.5 14.5"></path></svg>`,
  chest: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>`,
  skull: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.5 17-.5-1-.5 1h1z"></path><path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"></path><circle cx="15" cy="12" r="1"></circle><circle cx="9" cy="12" r="1"></circle></svg>`,
  jewel: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3 8 9l4 13 4-13-2.5-6"></path><path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z"></path><path d="M2 9h20"></path></svg>`
};

function MarkerIcon({ iconType, color }: { iconType?: string, color?: string }) {
  const type = (iconType && iconTypeSvgMap[iconType as keyof typeof iconTypeSvgMap]) ? iconType : 'pin';
  const c = color || '#e55757';
  
  const svg = iconTypeSvgMap[type as keyof typeof iconTypeSvgMap].replace(/currentColor/g, c);
  const [image] = useImage("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
  
  return image ? <KonvaImage image={image} x={-16} y={-32} width={32} height={32} listening={false} /> : null;
}

function MarkerLayer({ scale = 1 }: { scale?: number }) {
  const markersMap = useZoneStore(state => state.markers);
  const markers = Object.values(markersMap);
  const updateMarker = useZoneStore(state => state.updateMarker);
  const activeTool = useZoneStore(state => state.activeTool);

  return (
    <Group>
      {markers.map(marker => {
        const dynamicFontSize = Math.max(12, 14 / scale);
        const dynamicY = -40 / scale;

        return (
        <Group
          key={marker.id}
          id={marker.id}
          x={marker.x}
          y={marker.y}
          draggable={activeTool === 'add-marker'}
          listening={activeTool === 'add-marker' || activeTool === 'pan' || activeTool === 'select'}
          onClick={(e) => {
            e.cancelBubble = true;
            if (activeTool === 'pan' || activeTool === 'select') {
               useZoneStore.getState().setRightSidebarOpen(true);
            }
          }}
          onMouseEnter={(e) => {
            const container = e.target.getStage().container();
            container.style.cursor = 'pointer';
            e.currentTarget.to({ scaleX: 1.05, scaleY: 1.05, duration: 0.15 });
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage().container();
            container.style.cursor = activeTool === 'pan' ? 'grab' : activeTool === 'edit-bg' ? 'default' : 'crosshair';
            e.currentTarget.to({ scaleX: 1, scaleY: 1, duration: 0.15 });
          }}
          onMouseDown={(e) => {
            e.currentTarget.to({ scaleX: 0.9, scaleY: 0.9, duration: 0.05 });
          }}
          onMouseUp={(e) => {
            e.currentTarget.to({ scaleX: 1.05, scaleY: 1.05, duration: 0.2 });
          }}
          onDragStart={(e) => {
            e.currentTarget.to({ scaleX: 0.85, scaleY: 0.85, opacity: 0.7, duration: 0.15 });
          }}
          onDragEnd={(e) => {
            e.currentTarget.to({ scaleX: 0.95, scaleY: 0.95, opacity: 0.85, duration: 0.15 });
            updateMarker(marker.id, { x: e.target.x(), y: e.target.y() });
          }}
        >
          {/* Hit area for mouse events */}
          <Rect
            x={-30}
            y={-40}
            width={60}
            height={60}
            fill="transparent"
          />

          <MarkerIcon iconType={marker.iconType} color={marker.color} />

          {/* Marker Label */}
          <Text
            text={marker.text}
            x={-100}
            y={dynamicY}
            width={200}
            align="center"
            fontSize={dynamicFontSize}
            fontStyle="bold"
            fill={marker.textColor || "white"}
            shadowColor="black"
            shadowBlur={4}
            shadowOffset={{ x: 1, y: 1 }}
            shadowOpacity={1}
            listening={false}
            perfectDrawEnabled={false}
          />
        </Group>
      )})}
    </Group>
  );
}

export default React.memo(MarkerLayer);
