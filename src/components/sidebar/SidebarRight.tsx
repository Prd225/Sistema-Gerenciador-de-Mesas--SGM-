import { useState, useEffect, useRef } from 'react';
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
  Search,
  Plus,
  X,
  Info,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useZoneStore } from '@/store/useZoneStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Marker } from '@/types/game';

interface SidebarRightProps {
  isOpen: boolean;
  toggle: () => void;
}

// Subcomponente de edição com debounce para não inundar o WebSocket no servidor
function MarkerEditForm({
  marker,
  onUpdate,
  onRemove,
}: {
  marker: Marker;
  onUpdate: (id: string, updates: Partial<Marker>) => void;
  onRemove: (id: string) => void;
}) {
  const [text, setText] = useState(marker.text);
  const [desc, setDesc] = useState(marker.description || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(marker.text);
  }, [marker.text]);

  useEffect(() => {
    setDesc(marker.description || '');
  }, [marker.description]);

  const scheduleUpdate = (updates: Partial<Marker>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate(marker.id, updates);
    }, 400);
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    scheduleUpdate({ text: newText });
  };

  const handleDescChange = (newDesc: string) => {
    setDesc(newDesc);
    scheduleUpdate({ description: newDesc });
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col gap-2 mt-1"
    >
      <Input
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        onBlur={() => onUpdate(marker.id, { text })}
        className="bg-[#121214] border-[#323238] h-8 text-sm text-[#e1e1e6]"
        placeholder="Título do Marcador"
      />

      <textarea
        value={desc}
        onChange={(e) => handleDescChange(e.target.value)}
        onBlur={() => onUpdate(marker.id, { description: desc })}
        className="bg-[#121214] border border-[#323238] rounded-md p-2 text-xs text-[#e1e1e6] min-h-[55px] resize-y w-full focus:outline-none focus:ring-1 focus:ring-[#8257e5]"
        placeholder="Descrição rápida..."
      />

      <div className="flex items-center gap-3 mt-1">
        <label className="text-xs text-[#a8a8b3] flex items-center gap-1.5 cursor-pointer">
          <span>Cor:</span>
          <input
            type="color"
            value={marker.color || '#e55757'}
            onChange={(e) => onUpdate(marker.id, { color: e.target.value })}
            className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
          />
        </label>
        <label className="text-xs text-[#a8a8b3] flex items-center gap-1.5 cursor-pointer">
          <span>Texto:</span>
          <input
            type="color"
            value={marker.textColor || '#ffffff'}
            onChange={(e) => onUpdate(marker.id, { textColor: e.target.value })}
            className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
          />
        </label>
      </div>

      <div className="flex items-center gap-1 mt-1">
        {(['pin', 'sword', 'chest', 'skull', 'jewel'] as const).map(
          (iconType) => (
            <button
              key={iconType}
              onClick={() => onUpdate(marker.id, { iconType })}
              className={`p-1.5 rounded border transition-colors ${
                marker.iconType === iconType ||
                (!marker.iconType && iconType === 'pin')
                  ? 'border-[#8257e5] bg-[#8257e5]/20 text-white'
                  : 'border-[#323238] hover:bg-[#323238] text-[#a8a8b3]'
              }`}
              title={iconType}
            >
              {iconType === 'pin' && <MapPin className="w-3.5 h-3.5" />}
              {iconType === 'sword' && <Sword className="w-3.5 h-3.5" />}
              {iconType === 'chest' && <Box className="w-3.5 h-3.5" />}
              {iconType === 'skull' && <Skull className="w-3.5 h-3.5" />}
              {iconType === 'jewel' && <Gem className="w-3.5 h-3.5" />}
            </button>
          ),
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => onUpdate(marker.id, { completed: !marker.completed })}
          className={`flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors cursor-pointer border ${
            marker.completed
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-[#121214] text-[#a8a8b3] border-[#323238] hover:text-[#e1e1e6]'
          }`}
        >
          {marker.completed ? (
            <CheckSquare className="w-4 h-4 text-[#04d361]" />
          ) : (
            <Square className="w-4 h-4 text-[#7a7a80]" />
          )}
          <span>{marker.completed ? 'Marcador Concluído / Lido' : 'Marcar como Concluído'}</span>
        </button>
      </div>

      <Button
        variant="outline"
        onClick={() => onRemove(marker.id)}
        className="h-7 text-xs border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400 mt-2"
      >
        <Trash className="w-3 h-3 mr-2" /> Remover
      </Button>
    </div>
  );
}

export default function SidebarRight({ isOpen, toggle }: SidebarRightProps) {
  const markers = useZoneStore((state) => state.markers);
  const editingMarkers = useZoneStore((state) => state.editingMarkers);
  const setEditingMarkers = useZoneStore((state) => state.setEditingMarkers);
  const updateMarker = useZoneStore((state) => state.updateMarker);
  const removeMarker = useZoneStore((state) => state.removeMarker);
  const selectedMarkerId = useZoneStore((state) => state.selectedMarkerId);
  const setSelectedMarkerId = useZoneStore((state) => state.setSelectedMarkerId);
  const activeTool = useZoneStore((state) => state.activeTool);
  const setActiveTool = useZoneStore((state) => state.setActiveTool);

  const width = useZoneStore((state) => state.rightSidebarWidth);
  const setWidth = useZoneStore((state) => state.setRightSidebarWidth);
  const hideCompletedMarkers = useZoneStore(
    (state) => state.hideCompletedMarkers,
  );
  const toggleHideCompletedMarkers = useZoneStore(
    (state) => state.toggleHideCompletedMarkers,
  );

  const [searchQuery, setSearchQuery] = useState('');
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-scroll to selected marker from canvas
  useEffect(() => {
    if (selectedMarkerId && cardRefs.current[selectedMarkerId]) {
      cardRefs.current[selectedMarkerId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedMarkerId]);

  const markersList = Object.values(markers);
  const completedCount = markersList.filter((m) => m.completed).length;

  const filteredMarkers = markersList.filter((m) => {
    const query = searchQuery.trim().toLowerCase();
    return (
      !query ||
      m.text.toLowerCase().includes(query) ||
      (m.description && m.description.toLowerCase().includes(query))
    );
  });

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(
        300,
        Math.min(800, startWidth - (moveEvent.clientX - startX)),
      );
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
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
          title="Expandir Marcadores"
        >
          <ChevronRight className="rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <aside
      style={{ width: `${width}px` }}
      className="bg-[#202024] border-l border-[#323238] flex flex-col h-full z-40 overflow-hidden shrink-0 relative select-none"
    >
      {/* Resize Handle */}
      <div
        className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-[#8257e5]/50 active:bg-[#8257e5] z-50 transition-colors"
        onMouseDown={handleDragStart}
      />

      <div className="p-4 overflow-y-auto custom-scrollbar flex-1 h-full relative flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 text-[#8257e5] font-bold uppercase tracking-wide border-b border-[#323238] pb-2">
          <button
            onClick={toggle}
            className="text-[#a8a8b3] hover:text-[#e1e1e6] p-1 -ml-1 rounded hover:bg-white/5"
            title="Recolher Barra"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-sm">Marcadores ({markersList.length})</span>
            <button
              onClick={() => setEditingMarkers(!editingMarkers)}
              className={`p-1 rounded hover:bg-white/5 transition-colors ${
                editingMarkers
                  ? 'text-[#ffd700]'
                  : 'text-[#a8a8b3] hover:text-[#e1e1e6]'
              }`}
              title="Alternar Edição"
            >
              {editingMarkers ? (
                <Unlock className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            onClick={() => setActiveTool('add-marker')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all ${
              activeTool === 'add-marker'
                ? 'bg-[#8257e5] text-white shadow-[0_0_10px_rgba(130,87,229,0.5)]'
                : 'bg-[#8257e5]/10 text-[#8257e5] hover:bg-[#8257e5]/20'
            }`}
            title="Adicionar Marcador no Mapa"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo</span>
          </button>
        </div>

        {/* Feedback de ferramenta ativa */}
        {activeTool === 'add-marker' && (
          <div className="flex items-center gap-1.5 p-2 mb-3 bg-[#8257e5]/10 border border-[#8257e5]/30 rounded text-xs text-[#e1e1e6] animate-in fade-in">
            <Info className="w-4 h-4 text-[#8257e5] shrink-0" />
            <span>Clique em qualquer posição do mapa para colocar o marcador.</span>
          </div>
        )}

        {/* Busca rápida */}
        <div className="flex flex-col gap-2 mb-2">
          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar marcador..."
              className="w-full bg-[#121214] border border-[#323238] rounded-md pl-8 pr-7 py-1.5 text-xs text-[#e1e1e6] focus:outline-none focus:border-[#8257e5]"
            />
            <Search className="w-3.5 h-3.5 text-[#7a7a80] absolute left-2.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7a7a80] hover:text-[#e1e1e6]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status de Concluídos e Controle de Visibilidade no Mapa */}
        <div className="flex items-center justify-between text-xs px-1 py-1.5 text-[#a8a8b3] border-b border-[#323238]/60 mb-2.5">
          <span className="text-[11px] text-[#7a7a80]">
            {completedCount > 0
              ? `${completedCount} de ${markersList.length} concluídos`
              : `${markersList.length} marcadores`}
          </span>

          <button
            type="button"
            onClick={toggleHideCompletedMarkers}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              hideCompletedMarkers
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'hover:bg-white/5 text-[#a8a8b3] hover:text-[#e1e1e6]'
            }`}
            title={
              hideCompletedMarkers
                ? 'Pins concluídos estão ocultos no mapa. Clique para exibir com opacidade reduzida.'
                : 'Pins concluídos estão visíveis com opacidade reduzida. Clique para ocultar do mapa.'
            }
          >
            {hideCompletedMarkers ? (
              <>
                <EyeOff className="w-3 h-3 text-amber-400" />
                <span>Ocultos no mapa</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 text-[#04d361]" />
                <span>Opacidade baixa</span>
              </>
            )}
          </button>
        </div>

        {/* Markers List */}
        <div id="markerList" className="flex flex-col gap-2.5 flex-1">
          {filteredMarkers.length === 0 ? (
            <div className="text-[#a8a8b3] text-center text-xs mt-10 opacity-60 italic">
              {markersList.length === 0
                ? 'Nenhum marcador no mapa. Use "+ Novo" para adicionar.'
                : 'Nenhum marcador encontrado para o filtro atual.'}
            </div>
          ) : (
            filteredMarkers.map((marker) => {
              const isSelected = selectedMarkerId === marker.id;
              const isCompleted = !!marker.completed;

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
                  ref={(el) => {
                    cardRefs.current[marker.id] = el;
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'border-[#8257e5] bg-[#8257e5]/15 shadow-[0_0_15px_rgba(130,87,229,0.3)] ring-1 ring-[#8257e5]/50'
                      : isCompleted
                        ? 'bg-[#151518] border-[#29292e] opacity-60 hover:opacity-100 hover:border-[#8257e5]/40'
                        : 'bg-[#1a1a1e] border-[#323238] hover:border-[#8257e5]/60 hover:bg-[#202024]'
                  }`}
                  onClick={() => {
                    setSelectedMarkerId(marker.id);
                    window.dispatchEvent(
                      new CustomEvent('panTo', {
                        detail: { x: marker.x, y: marker.y },
                      }),
                    );
                  }}
                >
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <Icon
                      className="w-4 h-4"
                      style={{ color: marker.color || '#e55757' }}
                    />
                  </div>

                  {!editingMarkers ? (
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox estilo GeneralTab */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateMarker(marker.id, {
                            completed: !marker.completed,
                          });
                        }}
                        className="text-[#a8a8b3] hover:text-[#04d361] transition-colors cursor-pointer shrink-0 mt-0.5"
                        title={
                          isCompleted
                            ? 'Marcar como não concluído'
                            : 'Marcar como concluído / encontrado'
                        }
                      >
                        {isCompleted ? (
                          <CheckSquare className="w-4 h-4 text-[#04d361]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#7a7a80]" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0 pr-5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4
                            className={`font-bold text-sm truncate ${
                              isCompleted ? 'line-through text-[#a8a8b3]' : ''
                            }`}
                            style={{
                              color: isCompleted
                                ? undefined
                                : marker.textColor || '#e1e1e6',
                            }}
                          >
                            {marker.text}
                          </h4>
                          {isCompleted && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                              Encontrado
                            </span>
                          )}
                        </div>
                        {marker.description && (
                          <p
                            className={`text-xs mt-1 whitespace-pre-wrap leading-relaxed ${
                              isCompleted ? 'text-[#7a7a80]' : 'text-[#a8a8b3]'
                            }`}
                          >
                            {marker.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <MarkerEditForm
                      marker={marker}
                      onUpdate={updateMarker}
                      onRemove={removeMarker}
                    />
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
