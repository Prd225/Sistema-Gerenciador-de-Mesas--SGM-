import { Group, Rect, Circle, Line } from 'react-konva';
import { useFogStore } from '@/store/useFogStore';
import { isPlayerMode } from '@/lib/roomRole';
import type { FogArea } from '@/types/fog';

interface FogLayerProps {
  scale?: number;
}

// Retângulo grande que cobre todo o espaço do mapa virtual (100.000 x 100.000 pixels)
const MAP_BOUNDS = 50000;

export default function FogLayer({ scale = 1 }: FogLayerProps) {
  const enabled = useFogStore((state) => state.enabled);
  const defaultCovered = useFogStore((state) => state.defaultCovered);
  const areas = useFogStore((state) => state.areas);

  const isPlayer = isPlayerMode();

  // Se a névoa estiver desativada na cena atual, não renderiza nada
  if (!enabled) return null;

  // No mestre, a névoa é semitransparente para que ele consiga ver e mestrar.
  // No jogador, ela é 100% opaca e preta, bloqueando qualquer visão.
  const layerOpacity = isPlayer ? 1 : 0.45;
  const fogColor = isPlayer ? '#000000' : '#141419';

  return (
    <Group opacity={layerOpacity} listening={false}>
      {/* 1. Se o mapa começa totalmente coberto, desenhamos a base escura infinita */}
      {defaultCovered && (
        <Rect
          x={-MAP_BOUNDS}
          y={-MAP_BOUNDS}
          width={MAP_BOUNDS * 2}
          height={MAP_BOUNDS * 2}
          fill={fogColor}
          listening={false}
        />
      )}

      {/* 2. Áreas dinâmicas de Ocultação (hide) e Revelação (reveal) */}
      {areas.map((area: FogArea) => {
        const isReveal = area.mode === 'reveal';
        // 'destination-out' recorta a névoa, tornando a área transparente e revelando o mapa embaixo!
        const composite = isReveal ? 'destination-out' : 'source-over';

        if (area.type === 'rect') {
          return (
            <Rect
              key={area.id}
              x={area.x}
              y={area.y}
              width={area.width || 0}
              height={area.height || 0}
              fill={fogColor}
              globalCompositeOperation={composite as any}
              stroke={!isPlayer && !isReveal ? '#8257e5' : undefined}
              strokeWidth={!isPlayer && !isReveal ? 1 / scale : 0}
              dash={!isPlayer && !isReveal ? [4 / scale, 4 / scale] : undefined}
              listening={false}
            />
          );
        }

        if (area.type === 'circle') {
          const radiusX = Math.abs((area.width || 0) / 2);
          const radiusY = Math.abs((area.height || 0) / 2);
          return (
            <Circle
              key={area.id}
              x={area.x + radiusX}
              y={area.y + radiusY}
              radius={Math.max(radiusX, radiusY)}
              fill={fogColor}
              globalCompositeOperation={composite as any}
              stroke={!isPlayer && !isReveal ? '#8257e5' : undefined}
              strokeWidth={!isPlayer && !isReveal ? 1 / scale : 0}
              dash={!isPlayer && !isReveal ? [4 / scale, 4 / scale] : undefined}
              listening={false}
            />
          );
        }

        if (area.type === 'polygon' && area.points && area.points.length >= 6) {
          return (
            <Line
              key={area.id}
              points={area.points}
              fill={fogColor}
              closed={true}
              globalCompositeOperation={composite as any}
              stroke={!isPlayer && !isReveal ? '#8257e5' : undefined}
              strokeWidth={!isPlayer && !isReveal ? 1 / scale : 0}
              dash={!isPlayer && !isReveal ? [4 / scale, 4 / scale] : undefined}
              listening={false}
            />
          );
        }

        return null;
      })}
    </Group>
  );
}
