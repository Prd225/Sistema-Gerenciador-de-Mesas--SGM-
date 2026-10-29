import { memo, useEffect, useRef } from 'react';
import { Group, Rect, Ellipse, Line } from 'react-konva';
import type Konva from 'konva';
import { useFogStore } from '@/store/useFogStore';
import { isPlayerMode } from '@/lib/roomRole';
import type { FogArea } from '@/types/fog';

interface FogLayerProps {
  scale?: number;
}

// Bounding box amplo para cobrir o mapa sem consumo excessivo de memória
const MAP_BOUNDS = 10000;
const FOG_COLOR = '#000000';

function FogLayerComponent({ scale = 1 }: FogLayerProps) {
  const enabled = useFogStore((state) => state.enabled);
  const defaultCovered = useFogStore((state) => state.defaultCovered);
  const areas = useFogStore((state) => state.areas);
  const isPlayer = isPlayerMode();
  const groupRef = useRef<Konva.Group>(null);

  // Controla a opacidade diretamente no elemento <canvas> do Layer no DOM.
  // Isso garante que todas as operações internas de recorte ('destination-out')
  // operem com alpha 1.0 (recortando 100% da névoa de forma limpa e imediata),
  // sem deixar resíduos cinzentos nem acumular camadas sobrepostas.
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const layer = group.getLayer();
    const canvas = layer?.getCanvas()?._canvas;
    if (canvas) {
      canvas.style.opacity = isPlayer ? '1' : '0.45';
      canvas.style.pointerEvents = 'none';
      canvas.style.transition = 'opacity 0.15s ease-out';
    }
  }, [isPlayer, enabled]);

  // Se a névoa estiver desativada na cena atual, não renderiza nada
  if (!enabled) return null;

  return (
    <Group ref={groupRef} listening={false}>
      {/* 1. Base escura se o mapa estiver configurado como coberto por padrão */}
      {defaultCovered && (
        <Rect
          x={-MAP_BOUNDS}
          y={-MAP_BOUNDS}
          width={MAP_BOUNDS * 2}
          height={MAP_BOUNDS * 2}
          fill={FOG_COLOR}
          listening={false}
        />
      )}

      {/* 2. Áreas dinâmicas de Ocultação (hide) e Revelação (reveal) */}
      {(Array.isArray(areas) ? areas : []).map((area: FogArea) => {
        if (!area || !area.id) return null;
        const isReveal = area.mode === 'reveal';
        // 'destination-out' recorta a névoa com 100% de alpha, tornando a área totalmente transparente
        const composite = isReveal ? 'destination-out' : 'source-over';

        if (area.type === 'rect') {
          return (
            <Rect
              key={area.id}
              x={area.x}
              y={area.y}
              width={area.width || 0}
              height={area.height || 0}
              fill={FOG_COLOR}
              globalCompositeOperation={composite as any}
              stroke={!isPlayer && !isReveal ? '#8257e5' : undefined}
              strokeWidth={!isPlayer && !isReveal ? 1.5 / scale : 0}
              dash={!isPlayer && !isReveal ? [6 / scale, 4 / scale] : undefined}
              listening={false}
            />
          );
        }

        if (area.type === 'circle') {
          const radiusX = Math.abs((area.width || 0) / 2);
          const radiusY = Math.abs((area.height || 0) / 2);
          return (
            <Ellipse
              key={area.id}
              x={area.x + radiusX}
              y={area.y + radiusY}
              radiusX={radiusX}
              radiusY={radiusY}
              fill={FOG_COLOR}
              globalCompositeOperation={composite as any}
              stroke={!isPlayer && !isReveal ? '#8257e5' : undefined}
              strokeWidth={!isPlayer && !isReveal ? 1.5 / scale : 0}
              dash={!isPlayer && !isReveal ? [6 / scale, 4 / scale] : undefined}
              listening={false}
            />
          );
        }

        if (area.type === 'polygon' && Array.isArray(area.points) && area.points.length >= 6) {
          return (
            <Line
              key={area.id}
              points={area.points}
              fill={FOG_COLOR}
              closed={true}
              globalCompositeOperation={composite as any}
              stroke={!isPlayer && !isReveal ? '#8257e5' : undefined}
              strokeWidth={!isPlayer && !isReveal ? 1.5 / scale : 0}
              dash={!isPlayer && !isReveal ? [6 / scale, 4 / scale] : undefined}
              listening={false}
            />
          );
        }

        if (area.type === 'brush' && Array.isArray(area.points) && area.points.length >= 2) {
          const isSquare = area.brushShape === 'square';
          return (
            <Line
              key={area.id}
              points={area.points}
              stroke={FOG_COLOR}
              strokeWidth={area.brushSize || 50}
              lineCap={isSquare ? 'square' : 'round'}
              lineJoin={isSquare ? 'miter' : 'round'}
              closed={false}
              globalCompositeOperation={composite as any}
              listening={false}
            />
          );
        }

        return null;
      })}
    </Group>
  );
}

export const FogLayer = memo(FogLayerComponent, (prev, next) => {
  if (isPlayerMode()) {
    // In player mode, scale does not affect fog strokes or appearance
    return true;
  }
  return prev.scale === next.scale;
});
export default FogLayer;
