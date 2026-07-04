import { Layer, Circle, Text, Group } from 'react-konva';
import { useTokenStore } from '@/store/useTokenStore';
import { useCampaignStore } from '@/store/useCampaignStore';
import { useZoneStore } from '@/store/useZoneStore';

/**
 * Renders token circles on the map.
 * Only tokens with x !== null (i.e. placed on map) are shown.
 * Matches the .token-map styling from DM_tool_6v.html.
 */
export default function TokenLayer() {
  const tokens = useTokenStore(state => state.tokens);
  const initiativeQueue = useTokenStore(state => state.initiativeQueue);
  const updateToken = useTokenStore(state => state.updateToken);
  const setEditingTokenId = useTokenStore(state => state.setEditingTokenId);
  const turn = useCampaignStore(state => state.turn);
  const activeTool = useZoneStore(state => state.activeTool);

  // Determine which token has the active turn
  const activeTokenId = initiativeQueue.length > 0
    ? initiativeQueue[(turn - 1) % initiativeQueue.length]?.tokenId
    : null;

  return (
    <Layer>
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
                />
              )}
              {/* Token body */}
              <Circle
                radius={27}
                fill={t.colorFill}
                stroke={isActive ? '#ffd700' : t.colorBorder}
                strokeWidth={3}
                shadowBlur={isActive ? 15 : 6}
                shadowColor={isActive ? '#ffd700' : 'rgba(0,0,0,0.7)'}
              />
              {/* Token initials */}
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
              />
            </Group>
          );
        })}
    </Layer>
  );
}
