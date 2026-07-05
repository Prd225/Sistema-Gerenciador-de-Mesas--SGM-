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

function TokenFace({ t, isActive }: { t: any; isActive: boolean }) {
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
        fontSize={12}
        fontFamily="sans-serif"
        fontStyle="bold"
        align="center"
        x={-75}
        y={32}
        width={150}
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

function TokenLayer() {
  const tokens = useTokenStore(state => state.tokens);
  const initiativeQueue = useTokenStore(state => state.initiativeQueue);
  const updateToken = useTokenStore(state => state.updateToken);
  const setEditingTokenId = useTokenStore(state => state.setEditingTokenId);
  const turn = useCampaignStore(state => state.turn);
  const activeTool = useZoneStore(state => state.activeTool);

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
          return (
            <Group
              key={t.id}
              x={t.x!}
              y={t.y!}
              draggable={activeTool === 'pan'}
              listening={activeTool === 'pan'}
              onDragEnd={(e) => {
                updateToken(t.id, { x: e.target.x(), y: e.target.y() });
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
              {/* Token body and initials */}
              <TokenFace t={t} isActive={isActive} />
            </Group>
          );
        })}
    </Group>
  );
}

export default React.memo(TokenLayer);
