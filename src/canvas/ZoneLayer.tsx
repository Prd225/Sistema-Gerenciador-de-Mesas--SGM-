import React, { useRef, useEffect } from 'react';
import { Group, Rect, Ellipse, Line, Text, Transformer } from 'react-konva';
import { useZoneStore } from '@/store/useZoneStore';
import type { Zone } from '@/types/game';

export interface NewShapeState {
  type: 'rect' | 'ellipse' | 'polygon';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[]; // [x1, y1, x2, y2, ...]
}

function ZoneLayer({ scale = 1 }: { scale?: number }) {
  const zonesMap = useZoneStore(state => state.zones);
  const zones = Object.values(zonesMap);
  const selectedZoneId = useZoneStore(state => state.selectedZoneId);
  const selectZone = useZoneStore(state => state.selectZone);
  const openZoneSidebar = useZoneStore(state => state.openZoneSidebar);
  const updateZoneTransform = useZoneStore(state => state.updateZoneTransform);
  const activeTool = useZoneStore(state => state.activeTool);
  
  const trRef = useRef<any>(null);
  const nodeRefs = useRef<Record<string, any>>({});

  useEffect(() => {
    if (trRef.current) {
      if (selectedZoneId && nodeRefs.current[selectedZoneId] && activeTool === 'edit-zone') {
        trRef.current.nodes([nodeRefs.current[selectedZoneId]]);
      } else {
        trRef.current.nodes([]);
      }
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedZoneId, activeTool, zones]); // re-run if zones change because a node ref might be re-created
  
  const handleSelect = (e: any, id: string) => {
    if (activeTool === 'select' || activeTool === 'edit-zone') {
      selectZone(id);
    } else if (activeTool === 'pan') {
      openZoneSidebar(id);
    }
  };
  
  const handleDoubleClick = (id: string) => {
    openZoneSidebar(id);
  };

  const handleDragEnd = (e: any, id: string) => {
    updateZoneTransform(id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleTransformEnd = (id: string) => {
    const node = nodeRefs.current[id];
    if (!node) return;
    
    const zone = zonesMap[id];
    if (!zone) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const newX = node.x();
    const newY = node.y();
    const newRotation = node.rotation();

    // Reset scale so text inside doesn't stretch, and apply it to dimensions instead.
    node.scaleX(1);
    node.scaleY(1);

    const updates: Partial<Zone> = {
      x: newX,
      y: newY,
      rotation: newRotation
    };

    if (zone.type === 'polygon' && zone.points) {
      updates.points = zone.points.map((p, i) => i % 2 === 0 ? p * scaleX : p * scaleY);
    } else {
      updates.w = Math.max(5, zone.w * scaleX);
      updates.h = Math.max(5, zone.h * scaleY);
    }

    updateZoneTransform(id, updates);
  };

  const isEditTool = activeTool === 'edit-zone';

  return (
    <Group>
      {zones.map(z => {
        if (z.type === 'group' as any) return null; // Fallback in case old group data remains

        const isActive = selectedZoneId === z.id;
        const s = z.data?.style;
        
        const applyOp = (hex: string | undefined, active: boolean) => {
          if (!hex) return active ? 'rgba(130, 87, 229, 0.3)' : 'rgba(130, 87, 229, 0.08)';
          if (hex.startsWith('#') && hex.length === 7) return active ? `${hex}4D` : `${hex}1A`; 
          return hex;
        };

        const fill = applyOp(s?.fillColor, isActive);
        const stroke = (isActive && isEditTool) ? '#ffd700' : (s?.borderColor || 'rgba(130, 87, 229, 0.5)');
        const textColor = s?.textColor || 'white';
        const strokeWidth = (isActive && isEditTool) ? 2.5 : 1.5;
        const title = z.data?.title || '';

        const commonProps = {
          fill,
          stroke,
          strokeWidth,
          onClick: (e: any) => handleSelect(e, z.id),
          onTap: (e: any) => handleSelect(e, z.id),
          onDblClick: () => handleDoubleClick(z.id),
          onDblTap: () => handleDoubleClick(z.id),
          listening: activeTool === 'pan' || activeTool === 'select' || activeTool === 'edit-zone',
          perfectDrawEnabled: false,
          shadowForStrokeEnabled: false,
        };

        // Bounding calculations for text centering
        let textX = 0;
        let textY = 0;
        let textW = z.w;
        let textH = z.h;

        if (z.type === 'polygon' && z.points) {
          const minX = Math.min(...z.points.filter((_, i) => i % 2 === 0));
          const minY = Math.min(...z.points.filter((_, i) => i % 2 !== 0));
          const maxX = Math.max(...z.points.filter((_, i) => i % 2 === 0));
          const maxY = Math.max(...z.points.filter((_, i) => i % 2 !== 0));
          textX = minX;
          textY = minY;
          textW = maxX - minX;
          textH = maxY - minY;
        }

        return (
          <Group 
            key={z.id}
            ref={(node) => {
              if (node) {
                nodeRefs.current[z.id] = node;
              } else {
                delete nodeRefs.current[z.id];
              }
            }}
            x={z.x}
            y={z.y}
            rotation={z.rotation || 0}
            draggable={isActive && isEditTool}
            onDragEnd={(e) => handleDragEnd(e, z.id)}
            onTransformEnd={() => handleTransformEnd(z.id)}
          >
            {z.type === 'rect' && (
              <Rect width={z.w} height={z.h} cornerRadius={2} {...commonProps} />
            )}
            
            {z.type === 'ellipse' && (
              <Ellipse x={z.w / 2} y={z.h / 2} radiusX={z.w / 2} radiusY={z.h / 2} {...commonProps} />
            )}

            {z.type === 'polygon' && z.points && (
              <Line points={z.points} closed={true} {...commonProps} />
            )}

            {title && (
              <Text 
                x={textX} 
                y={textY} 
                width={textW} 
                height={textH} 
                text={title} 
                fill={textColor} 
                fontSize={Math.max(4, 12 / scale)} 
                fontStyle="bold" 
                align="center" 
                verticalAlign="middle" 
                listening={false} 
                shadowColor="black" 
                shadowBlur={4} 
                shadowOpacity={0.9} 
                perfectDrawEnabled={false} 
              />
            )}
          </Group>
        );
      })}

      {isEditTool && (
        <Transformer
          ref={trRef}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </Group>
  );
}

export default React.memo(ZoneLayer);
