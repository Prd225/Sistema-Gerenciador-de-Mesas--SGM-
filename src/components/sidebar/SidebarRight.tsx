import { ChevronRight, Lock, Unlock, MapPin, Trash } from 'lucide-react';
import { useZoneStore } from '@/store/useZoneStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SidebarRightProps {
  isOpen: boolean;
  toggle: () => void;
}

export default function SidebarRight({ isOpen, toggle }: SidebarRightProps) {
  const markers = useZoneStore(state => state.markers);
  const editingMarkers = useZoneStore(state => state.editingMarkers);
  const setEditingMarkers = useZoneStore(state => state.setEditingMarkers);
  const updateMarker = useZoneStore(state => state.updateMarker);
  const removeMarker = useZoneStore(state => state.removeMarker);
  const markersList = Object.values(markers);
  
  const width = useZoneStore(state => state.rightSidebarWidth);
  const setWidth = useZoneStore(state => state.setRightSidebarWidth);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Right sidebar: moving mouse left (negative X delta) means larger width
      const newWidth = Math.max(300, Math.min(800, startWidth - (moveEvent.clientX - startX)));
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
        <button onClick={toggle} className="text-[#a8a8b3] hover:text-[#e1e1e6] p-2 hover:bg-white/5 rounded">
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
          <button onClick={toggle} className="text-[#a8a8b3] hover:text-[#e1e1e6] p-1 -ml-2 rounded hover:bg-white/5">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span>Marcadores</span>
            <button
              onClick={() => setEditingMarkers(!editingMarkers)}
              className={`p-1 rounded hover:bg-white/5 ${editingMarkers ? 'text-[#ffd700]' : 'text-[#a8a8b3] hover:text-[#e1e1e6]'}`}
              title="Alternar Edição"
            >
              {editingMarkers ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
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
            markersList.map(marker => (
              <div key={marker.id} className="bg-black/20 p-3 rounded border border-[#323238] flex flex-col gap-2 relative group">
                <MapPin className="absolute top-3 right-3 w-4 h-4 text-[#e55757]" />

                {!editingMarkers ? (
                  <>
                    <h4 className="font-bold text-[#e1e1e6] pr-6">{marker.text}</h4>
                  </>
                ) : (
                  <>
                    <Input
                      value={marker.text}
                      onChange={(e) => updateMarker(marker.id, { text: e.target.value })}
                      className="bg-[#121214] border-[#323238] h-8 text-sm text-[#e1e1e6]"
                      placeholder="Texto..."
                    />
                    <Button
                      variant="outline"
                      onClick={() => removeMarker(marker.id)}
                      className="h-7 text-xs border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400 mt-2"
                    >
                      <Trash className="w-3 h-3 mr-2" /> Remover
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </aside>
  );
}
