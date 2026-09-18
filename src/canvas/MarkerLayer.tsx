import React from 'react';
import { Group, Text, Image as KonvaImage, Rect, Circle } from 'react-konva';
import { useZoneStore } from '@/store/useZoneStore';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import useImage from 'use-image';

const iconTypeSvgMap = {
  pin: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  sword: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 19-6-6"></path><path d="m5 21-2-2"></path><path d="m8 16-4 4"></path><path d="M9.5 17.5 21 6V3h-3L6.5 14.5"></path></svg>`,
  chest: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>`,
  skull: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.5 17-.5-1-.5 1h1z"></path><path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"></path><circle cx="15" cy="12" r="1"></circle><circle cx="9" cy="12" r="1"></circle></svg>`,
  jewel: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3 8 9l4 13 4-13-2.5-6"></path><path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z"></path><path d="M2 9h20"></path></svg>`,
};

const svgUriCache = new Map<string, string>();
function getCachedSvgUri(type: string, color: string): string {
  const key = `${type}_${color}`;
  let uri = svgUriCache.get(key);
  if (!uri) {
    const raw =
      iconTypeSvgMap[type as keyof typeof iconTypeSvgMap] || iconTypeSvgMap.pin;
    const svg = raw.replace(/currentColor/g, color);
    uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    svgUriCache.set(key, uri);
  }
  return uri;
}

function MarkerIcon({
  iconType,
  color,
  opacity = 1,
}: {
  iconType?: string;
  color?: string;
  opacity?: number;
}) {
  const type =
    iconType && iconTypeSvgMap[iconType as keyof typeof iconTypeSvgMap]
      ? iconType
      : 'pin';
  const c = color || '#e55757';

  const uri = getCachedSvgUri(type, c);
  const [image] = useImage(uri);

  return image ? (
    <KonvaImage
      image={image}
      x={-16}
      y={-32}
      width={32}
      height={32}
      opacity={opacity}
      listening={false}
    />
  ) : null;
}

function MarkerLayer({ scale = 1 }: { scale?: number }) {
  const markersMap = useZoneStore((state) => state.markers);
  const markers = Object.values(markersMap);
  const updateMarker = useZoneStore((state) => state.updateMarker);
  const activeTool = useZoneStore((state) => state.activeTool);
  const hideCompletedMarkers = useZoneStore(
    (state) => state.hideCompletedMarkers,
  );
  const pings = useMultiplayerStore((state) => state.pings);

  return (
    <Group>
      {/* Live Multiplayer Pings */}
      {pings.map((ping) => {
        const dynamicFontSize = Math.max(12, 13 / scale);
        const dynamicY = -35 / scale;
        return (
          <Group key={ping.id} x={ping.x} y={ping.y} listening={false}>
            {/* Outer Pulse Wave */}
            <Circle
              radius={28 / scale}
              stroke={ping.color || '#2ac7e3'}
              strokeWidth={3 / scale}
              dash={[8 / scale, 4 / scale]}
              opacity={0.9}
            />
            {/* Inner Dot */}
            <Circle
              radius={10 / scale}
              fill={ping.color || '#2ac7e3'}
              shadowColor="black"
              shadowBlur={6}
              opacity={0.85}
            />
            {/* Sender Name Badge */}
            <Text
              text={`📍 ${ping.senderName}`}
              x={-100}
              y={dynamicY}
              width={200}
              align="center"
              fontSize={dynamicFontSize}
              fontFamily="sans-serif"
              fontStyle="bold"
              fill="#ffffff"
              shadowColor="black"
              shadowBlur={4}
            />
          </Group>
        );
      })}
      {markers.map((marker) => {
        const isCompleted = !!marker.completed;
        const isHidden =
          !!marker.hidden || (isCompleted && hideCompletedMarkers);
        if (isHidden) return null;

        const dynamicFontSize = Math.max(12, 14 / scale);
        const dynamicY = -40 / scale;

        // Marcador concluído: opacidade direta leve nos elementos e não tocável (listening=false)
        if (isCompleted) {
          return (
            <Group
              key={marker.id}
              id={marker.id}
              x={marker.x}
              y={marker.y}
              listening={false}
            >
              <MarkerIcon
                iconType={marker.iconType}
                color={marker.color}
                opacity={0.25}
              />
              <Circle
                x={10}
                y={-28}
                radius={6.5}
                fill="#04d361"
                stroke="#121214"
                strokeWidth={1}
                opacity={0.35}
                listening={false}
              />
              <Text
                text="✓"
                x={4}
                y={-33}
                width={12}
                height={12}
                align="center"
                verticalAlign="middle"
                fontSize={9}
                fontStyle="bold"
                fill="#ffffff"
                opacity={0.4}
                listening={false}
              />
              <Text
                text={`✓ ${marker.text}`}
                x={-100}
                y={dynamicY}
                width={200}
                align="center"
                fontSize={dynamicFontSize}
                fontStyle="bold"
                fill="#04d361"
                opacity={0.3}
                listening={false}
                perfectDrawEnabled={false}
              />
            </Group>
          );
        }

        // Marcador ativo: animações de hover, clique e arrasto
        return (
          <Group
            key={marker.id}
            id={marker.id}
            x={marker.x}
            y={marker.y}
            draggable={activeTool === 'add-marker'}
            listening={
              activeTool === 'add-marker' ||
              activeTool === 'pan' ||
              activeTool === 'select'
            }
            onClick={(e) => {
              e.cancelBubble = true;
              if (activeTool === 'pan' || activeTool === 'select') {
                useZoneStore.getState().setSelectedMarkerId(marker.id);
                useZoneStore.getState().setRightSidebarOpen(true);
              }
            }}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'pointer';
              e.currentTarget.to({
                scaleX: 1.08,
                scaleY: 1.08,
                duration: 0.12,
              });
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
              e.currentTarget.to({
                scaleX: 1,
                scaleY: 1,
                duration: 0.12,
              });
            }}
            onMouseDown={(e) => {
              e.currentTarget.to({
                scaleX: 0.92,
                scaleY: 0.92,
                duration: 0.05,
              });
            }}
            onMouseUp={(e) => {
              e.currentTarget.to({
                scaleX: 1.08,
                scaleY: 1.08,
                duration: 0.15,
              });
            }}
            onDragStart={(e) => {
              e.currentTarget.to({
                scaleX: 0.88,
                scaleY: 0.88,
                duration: 0.12,
              });
            }}
            onDragEnd={(e) => {
              e.currentTarget.to({
                scaleX: 1,
                scaleY: 1,
                duration: 0.15,
              });
              updateMarker(marker.id, { x: e.target.x(), y: e.target.y() });
            }}
          >
            {/* Hit area for mouse events */}
            <Rect x={-30} y={-40} width={60} height={60} fill="transparent" />

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
              fill={marker.textColor || 'white'}
              shadowColor="black"
              shadowBlur={3}
              shadowOffset={{ x: 1, y: 1 }}
              shadowOpacity={0.8}
              listening={false}
              perfectDrawEnabled={false}
            />
          </Group>
        );
      })}
    </Group>
  );
}

export default React.memo(MarkerLayer);
