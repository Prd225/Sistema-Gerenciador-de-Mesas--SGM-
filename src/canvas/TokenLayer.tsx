import React from 'react';
import { Group, Circle, Text } from 'react-konva';
import { useTokenStore } from '@/store/useTokenStore';
import { useCampaignStore } from '@/store/useCampaignStore';
import { useZoneStore } from '@/store/useZoneStore';

/**
 * Renders token circles on the map.
 * Only tokens with x !== null (i.e. placed on map) are shown.
 * Matches the .token-map styling from DM_tool_6v.html.
 */

function TokenFace({ t, isActive, scale = 1 }: { t: any; isActive: boolean; scale?: number }) {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    if (t.imageUrl) {
      const img = new window.Image();
      img.src = t.imageUrl;
      img.onload = () => setImage(img);
    }
  }, [t.imageUrl]);

  return (
    <>
      <Circle
        radius={27}
        fill={t.imageUrl && image ? undefined : t.colorFill}
        fillPatternImage={t.imageUrl && image ? image : undefined}
        fillPatternScale={t.imageUrl && image ? { x: 54 / image.width, y: 54 / image.height } : undefined}
        fillPatternOffset={t.imageUrl && image ? { x: image.width / 2, y: image.height / 2 } : undefined}
        stroke={isActive ? '#ffd700' : t.colorBorder}
        strokeWidth={3}
        shadowBlur={isActive ? 15 : 6}
        shadowColor={isActive ? '#ffd700' : 'rgba(0,0,0,0.7)'}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
      />
      {(!t.imageUrl || !image) && (
        <Text
          text={t.name}
          fill={t.colorText}
          fontSize={14}
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
          offsetX={27}
          offsetY={27}
          width={54}
          height={54}
          shadowColor="black"
          shadowBlur={2}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Token Full Name Label */}
      <Text
        text={t.fullName}
        fill={isActive ? '#ffd700' : '#e1e1e6'}
        fontSize={Math.max(8, 12 / scale)}
        fontFamily="sans-serif"
        fontStyle="bold"
        align="center"
        x={-(150 / scale) / 2}
        y={27 + Math.max(5, 5 / scale)}
        width={150 / scale}
        shadowColor="black"
        shadowBlur={4}
        shadowOffset={{ x: 1, y: 1 }}
        shadowOpacity={1}
        listening={false}
        perfectDrawEnabled={false}
      />
    </>
  );
}

function TokenLayer({ scale = 1 }: { scale?: number }) {
  const tokens = useTokenStore(state => state.tokens);
  const initiativeQueue = useTokenStore(state => state.initiativeQueue);
  const updateToken = useTokenStore(state => state.updateToken);
  const setEditingTokenId = useTokenStore(state => state.setEditingTokenId);
  const turn = useCampaignStore(state => state.turn);
  const activeTool = useZoneStore(state => state.activeTool);
  const selectedNodeIds = useZoneStore(state => state.selectedNodeIds);
  const setSelectedNodeIds = useZoneStore(state => state.setSelectedNodeIds);
  const dragStartPositions = React.useRef<Record<string, { x: number; y: number }>>({});

  // Determine which token has the active turn
  const len = initiativeQueue.length;
  const activeTokenId = len > 0
    ? initiativeQueue[(((turn - 1) % len) + len) % len]?.tokenId
    : null;

  return (
    <Group>
      {tokens
        .filter(t => t.x !== null && t.y !== null)
        .map(t => {
          const isActive = t.id === activeTokenId;
          const isSelected = selectedNodeIds.includes(t.id);
          return (
            <Group
              key={t.id}
              id={t.id}
              x={t.x!}
              y={t.y!}
              draggable={activeTool === 'pan' || activeTool === 'select'}
              listening={activeTool === 'pan' || activeTool === 'select'}
              onClick={(e) => {
                if (activeTool === 'select') {
                  e.cancelBubble = true;
                  if (e.evt.shiftKey) {
                    const newSelected = isSelected ? selectedNodeIds.filter(id => id !== t.id) : [...selectedNodeIds, t.id];
                    setSelectedNodeIds(newSelected);
                  } else {
                    if (!isSelected) setSelectedNodeIds([t.id]);
                  }
                }
              }}
              onMouseEnter={(e) => {
                if (activeTool !== 'select' && activeTool !== 'pan') return;
                document.body.style.cursor = 'pointer';
                e.currentTarget.to({ scaleX: 0.95, scaleY: 0.95, opacity: 0.85, duration: 0.15 });
              }}
              onMouseLeave={(e) => {
                document.body.style.cursor = 'default';
                e.currentTarget.to({ scaleX: 1, scaleY: 1, opacity: 1, duration: 0.15 });
              }}
              onDragStart={(e) => {
                e.currentTarget.to({ scaleX: 0.85, scaleY: 0.85, opacity: 0.7, duration: 0.15 });
                if (activeTool !== 'select') return;
                let currentSelected = selectedNodeIds;
                if (!isSelected) {
                   setSelectedNodeIds([t.id]);
                   currentSelected = [t.id];
                }
                
                const tState = useTokenStore.getState();
                const zState = useZoneStore.getState();
                
                dragStartPositions.current = currentSelected.reduce((acc: any, id) => {
                   const token = tState.tokens.find(tk => tk.id === id);
                   if (token) acc[id] = { x: token.x!, y: token.y! };
                   const marker = zState.markers[id];
                   if (marker) acc[id] = { x: marker.x, y: marker.y };
                   return acc;
                }, {});

                const stage = e.target.getStage();
                if (stage) {
                  currentSelected.forEach(id => {
                    if (id === t.id) return;
                    const node = stage.findOne('#' + id);
                    if (node) node.to({ scaleX: 0.85, scaleY: 0.85, opacity: 0.7, duration: 0.15 });
                  });
                }
              }}
              onDragMove={(e) => {
                if (activeTool !== 'select') return;
                if (isSelected && selectedNodeIds.length > 1) {
                  const startX = dragStartPositions.current[t.id]?.x || 0;
                  const startY = dragStartPositions.current[t.id]?.y || 0;
                  const dx = e.target.x() - startX;
                  const dy = e.target.y() - startY;
                  
                  const stage = e.target.getStage();
                  if (!stage) return;
                  
                  selectedNodeIds.forEach(id => {
                     if (id !== t.id) {
                        const start = dragStartPositions.current[id];
                        if (start) {
                           const node = stage.findOne('#' + id);
                           if (node) {
                             node.position({ x: start.x + dx, y: start.y + dy });
                           }
                        }
                     }
                  });
                }
              }}
              onDragEnd={(e) => {
                e.currentTarget.to({ scaleX: 0.95, scaleY: 0.95, opacity: 0.85, duration: 0.15 });
                if (activeTool !== 'select') {
                  updateToken(t.id, { x: e.target.x(), y: e.target.y() });
                  return;
                }
                const startX = dragStartPositions.current[t.id]?.x || t.x!;
                const startY = dragStartPositions.current[t.id]?.y || t.y!;
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

                const stage = e.target.getStage();
                if (stage) {
                  selectedNodeIds.forEach(id => {
                    if (id === t.id) return;
                    const node = stage.findOne('#' + id);
                    if (node) node.to({ scaleX: 1, scaleY: 1, opacity: 1, duration: 0.15 });
                  });
                }
              }}
              onDblClick={() => setEditingTokenId(t.id)}
              onDblTap={() => setEditingTokenId(t.id)}
              onContextMenu={(e) => {
                e.evt.preventDefault();
                if (window.confirm(`Deseja retirar ${t.fullName} do Mapa?`)) {
                  updateToken(t.id, { x: null, y: null });
                }
              }}
            >
              {/* Active turn glow */}
              {isActive && (
                <Circle
                  radius={35}
                  fill="rgba(255, 215, 0, 0.2)"
                  shadowBlur={25}
                  shadowColor="#ffd700"
                  perfectDrawEnabled={false}
                  shadowForStrokeEnabled={false}
                />
              )}
              {isSelected && (
                <Circle
                  radius={32}
                  stroke="#00A1FF"
                  strokeWidth={2}
                  dash={[5, 5]}
                  perfectDrawEnabled={false}
                  listening={false}
                />
              )}
              {/* Token body and initials */}
              <TokenFace t={t} isActive={isActive} scale={scale} />
            </Group>
          );
        })}
    </Group>
  );
}

export default React.memo(TokenLayer);
