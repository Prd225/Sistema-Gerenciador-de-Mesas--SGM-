import {
  ChevronRight,
  Lock,
  Unlock,
  MapPin,
  Trash,
  Sword,
  Skull,
  Gem,
  Box,
} from 'lucide-react';
import { useZoneStore } from '@/store/useZoneStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SidebarRightProps {
  isOpen: boolean;
  toggle: () => void;
}

export default function SidebarRight({ isOpen, toggle }: SidebarRightProps) {
  const markers = useZoneStore((state) => state.markers);
  const editingMarkers = useZoneStore((state) => state.editingMarkers);
  const setEditingMarkers = useZoneStore((state) => state.setEditingMarkers);
  const updateMarker = useZoneStore((state) => state.updateMarker);
  const removeMarker = useZoneStore((state) => state.removeMarker);
  const markersList = Object.values(markers);

  const width = useZoneStore((state) => state.rightSidebarWidth);
  const setWidth = useZoneStore((state) => state.setRightSidebarWidth);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Right sidebar: moving mouse left (negative X delta) means larger width
      const newWidth = Math.max(
        300,
        Math.min(800, startWidth - (moveEvent.clientX - startX)),
      );
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!isOpen) {
    return (
      <div className="bg-surface-elevated border-l border-subtle h-full flex flex-col items-center py-4 z-40 w-12 transition-all">
        <button
          onClick={toggle}
          className="text-muted-custom hover:text-main p-2 hover:bg-surface rounded transition-colors"
        >
          <ChevronRight className="rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <aside
      style={{ width: `${width}px` }}
      className="bg-surface-elevated border-l border-subtle flex flex-col h-full z-40 overflow-hidden shrink-0 relative transition-colors"
    >
      {/* Resize Handle */}
      <div
        className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-brand-purple/50 active:bg-brand-purple z-50 transition-colors"
        onMouseDown={handleDragStart}
      />
      <div className="p-5 overflow-y-auto flex-1 h-full relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-5 text-brand-purple font-bold uppercase tracking-wide border-b-2 border-subtle pb-2">
          <button
            onClick={toggle}
            className="text-muted-custom hover:text-main p-1 -ml-2 rounded hover:bg-surface transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span>Marcadores</span>
            <button
              onClick={() => setEditingMarkers(!editingMarkers)}
              className={`p-1 rounded hover:bg-surface transition-colors ${editingMarkers ? 'text-brand-gold' : 'text-muted-custom hover:text-main'}`}
              title="Alternar Edição"
            >
              {editingMarkers ? (
                <Unlock className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Markers List */}
        <div id="markerList" className="flex flex-col gap-4">
          {markersList.length === 0 ? (
            <div className="text-muted-custom text-center text-sm mt-10 opacity-50 italic">
              Nenhum marcador no mapa.
            </div>
          ) : (
            markersList.map((marker) => {
              const Icon =
                marker.iconType === 'sword'
                  ? Sword
                  : marker.iconType === 'chest'
                    ? Box
                    : marker.iconType === 'skull'
                      ? Skull
                      : marker.iconType === 'jewel'
                        ? Gem
                        : MapPin;

              return (
                <div
                  key={marker.id}
                  className="bg-surface p-3 rounded border border-subtle flex flex-col gap-2 relative group cursor-pointer hover:border-brand-purple transition-colors shadow-sm"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('panTo', {
                        detail: { x: marker.x, y: marker.y },
                      }),
                    );
                  }}
                >
                  <Icon
                    className="absolute top-3 right-3 w-4 h-4"
                    style={{ color: marker.color || 'var(--brand-red)' }}
                  />

                  {!editingMarkers ? (
                    <>
                      <h4
                        className="font-bold pr-6 text-main"
                        style={{ color: marker.textColor || undefined }}
                      >
                        {marker.text}
                      </h4>
                      {marker.description && (
                        <p className="text-xs text-muted-custom mt-1 whitespace-pre-wrap">
                          {marker.description}
                        </p>
                      )}
                    </>
                  ) : (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-col gap-2 mt-1"
                    >
                      <Input
                        value={marker.text}
                        onChange={(e) =>
                          updateMarker(marker.id, { text: e.target.value })
                        }
                        className="bg-surface-elevated border-subtle h-8 text-sm text-main"
                        placeholder="Título do Marcador"
                      />

                      <textarea
                        value={marker.description || ''}
                        onChange={(e) =>
                          updateMarker(marker.id, {
                            description: e.target.value,
                          })
                        }
                        className="bg-surface-elevated border border-subtle rounded-md p-2 text-sm text-main min-h-[60px] resize-y w-full focus:outline-none focus:ring-1 focus:ring-brand-purple placeholder:text-muted-custom"
                        placeholder="Descrição rápida..."
                      />

                      <div className="flex items-center gap-2 mt-1">
                        <label className="text-xs text-muted-custom flex items-center gap-1">
                          Cor:
                          <input
                            type="color"
                            value={marker.color || '#e55757'}
                            onChange={(e) =>
                              updateMarker(marker.id, { color: e.target.value })
                            }
                            className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
                          />
                        </label>
                        <label className="text-xs text-muted-custom flex items-center gap-1 ml-2">
                          Texto:
                          <input
                            type="color"
                            value={marker.textColor || '#ffffff'}
                            onChange={(e) =>
                              updateMarker(marker.id, {
                                textColor: e.target.value,
                              })
                            }
                            className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
                          />
                        </label>
                      </div>

                      <div className="flex items-center gap-1 mt-1">
                        {['pin', 'sword', 'chest', 'skull', 'jewel'].map(
                          (iconType) => (
                            <button
                              key={iconType}
                              onClick={() =>
                                updateMarker(marker.id, {
                                  iconType: iconType as any,
                                })
                              }
                              className={`p-1 rounded border transition-colors ${
                                marker.iconType === iconType ||
                                (!marker.iconType && iconType === 'pin')
                                  ? 'border-brand-purple bg-brand-purple/20 text-brand-purple'
                                  : 'border-subtle hover:bg-surface-elevated text-muted-custom hover:text-main'
                              }`}
                              title={iconType}
                            >
                              {iconType === 'pin' && (
                                <MapPin className="w-3 h-3" />
                              )}
                              {iconType === 'sword' && (
                                <Sword className="w-3 h-3" />
                              )}
                              {iconType === 'chest' && (
                                <Box className="w-3 h-3" />
                              )}
                              {iconType === 'skull' && (
                                <Skull className="w-3 h-3" />
                              )}
                              {iconType === 'jewel' && (
                                <Gem className="w-3 h-3" />
                              )}
                            </button>
                          ),
                        )}
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => removeMarker(marker.id)}
                        className="h-7 text-xs border-brand-red/50 text-brand-red hover:bg-brand-red/10 hover:text-brand-red mt-2"
                      >
                        <Trash className="w-3 h-3 mr-2" /> Remover
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
