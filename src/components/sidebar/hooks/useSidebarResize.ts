import { useState, useCallback } from 'react';
import { useZoneStore } from '@/store/useZoneStore';

export function useSidebarResize() {
  const width = useZoneStore((state) => state.leftSidebarWidth);
  const setWidth = useZoneStore((state) => state.setLeftSidebarWidth);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const startX = e.clientX;
      const startWidth = width;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const newWidth = Math.max(
          300,
          Math.min(800, startWidth + (moveEvent.clientX - startX)),
        );
        setWidth(newWidth);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, setWidth],
  );

  return {
    width,
    isDragging,
    handleDragStart,
  };
}
