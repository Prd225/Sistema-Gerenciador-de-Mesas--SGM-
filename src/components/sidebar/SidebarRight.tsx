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
      <div className="bg-[#202024] border-l border-[#323238] h-full flex flex-col items-center py-4 z-40 w-12 transition-all">
        <button
          onClick={toggle}
          className="text-[#a8a8b3] hover:text-[#e1e1e6] p-2 hover:bg-white/5 rounded"
        >
          <ChevronRight className="rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <aside
      style={{ width: `${width}px` }}
      className="bg-[#202024] border-l border-[#323238] flex flex-col h-full z-40 overflow-hidden shrink-0 relative"
    >
      {/* Resize Handle */}
      <div
        className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-[#8257e5]/50 active:bg-[#8257e5] z-50 transition-colors"
        onMouseDown={handleDragStart}
      />
      <div className="p-5 overflow-y-auto flex-1 h-full relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-5 text-[#8257e5] font-bold uppercase tracking-wide border-b-2 border-[#323238] pb-2">
          <button
            onClick={toggle}
            className="text-[#a8a8b3] hover:text-[#e1e1e6] p-1 -ml-2 rounded hover:bg-white/5"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span>Marcadores</span>
            <button
              onClick={() => setEditingMarkers(!editingMarkers)}
              className={`p-1 rounded hover:bg-white/5 ${editingMarkers ? 'text-[#ffd700]' : 'text-[#a8a8b3] hover:text-[#e1e1e6]'}`}
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
            <div className="text-[#a8a8b3] text-center text-sm mt-10 opacity-50 italic">
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
                  className="bg-black/20 p-3 rounded border border-[#323238] flex flex-col gap-2 relative group cursor-pointer hover:border-[#8257e5] transition-colors"
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
                    style={{ color: marker.color || '#e55757' }}
                  />

                  {!editingMarkers ? (
                    <>
                      <h4
                        className="font-bold pr-6"
                        style={{ color: marker.textColor || '#e1e1e6' }}
                      >
                        {marker.text}
                      </h4>
                      {marker.description && (
                        <p className="text-xs text-[#a8a8b3] mt-1 whitespace-pre-wrap">
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
                        className="bg-[#121214] border-[#323238] h-8 text-sm text-[#e1e1e6]"
                        placeholder="Título do Marcador"
                      />

                      <textarea
                        value={marker.description || ''}
                        onChange={(e) =>
                          updateMarker(marker.id, {
                            description: e.target.value,
                          })
                        }
                        className="bg-[#121214] border border-[#323238] rounded-md p-2 text-sm text-[#e1e1e6] min-h-[60px] resize-y w-full focus:outline-none focus:ring-1 focus:ring-[#8257e5]"
                        placeholder="Descrição rápida..."
                      />

                      <div className="flex items-center gap-2 mt-1">
                        <label className="text-xs text-[#a8a8b3] flex items-center gap-1">
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
                        <label className="text-xs text-[#a8a8b3] flex items-center gap-1 ml-2">
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
                              className={`p-1 rounded border ${marker.iconType === iconType || (!marker.iconType && iconType === 'pin') ? 'border-[#8257e5] bg-[#8257e5]/20' : 'border-[#323238] hover:bg-[#323238]'}`}
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
                        className="h-7 text-xs border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400 mt-2"
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
