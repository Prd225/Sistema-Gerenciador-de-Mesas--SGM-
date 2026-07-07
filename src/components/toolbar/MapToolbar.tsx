import { useRef } from 'react';
import { useZoneStore } from '@/store/useZoneStore';
import { Button } from '@/components/ui/button';
import { Move, MousePointer2, Square, Circle, Hexagon, MapPin, Image as ImageIcon, Plus, Pencil } from 'lucide-react';
import type { ActiveTool } from '@/types/game';

const generateId = () =>
  window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 11);

export default function MapToolbar() {
  const activeTool = useZoneStore(state => state.activeTool);
  const setActiveTool = useZoneStore(state => state.setActiveTool);
  const addBgImage = useZoneStore(state => state.addBgImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      addBgImage({
        id: generateId(),
        src: evt.target?.result as string,
        x: 100,
        y: 100,
        scale: 1,
        rotation: 0,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const tools: { id: string; icon: React.ReactNode; title: string; subTools?: { id: ActiveTool; icon: React.ReactNode; title: string }[] }[] = [
    { id: 'pan', icon: <Move className="w-5 h-5" />, title: 'Mover Fundo (Espaço)' },
    { id: 'select', icon: <MousePointer2 className="w-5 h-5" />, title: 'Selecionar / Arrastar Itens (V)' },
    { 
      id: 'draw-group', 
      icon: <Pencil className="w-5 h-5" />, 
      title: 'Ferramentas de Desenho',
      subTools: [
        { id: 'draw-rect', icon: <Square className="w-4 h-4" />, title: 'Desenhar Zona Retangular' },
        { id: 'draw-ellipse', icon: <Circle className="w-4 h-4" />, title: 'Desenhar Zona Circular' },
        { id: 'draw-poly', icon: <Hexagon className="w-4 h-4" />, title: 'Desenhar Zona Poligonal' }
      ]
    },
    { id: 'add-marker', icon: <MapPin className="w-5 h-5" />, title: 'Adicionar Marcador' },
    { id: 'edit-bg', icon: <ImageIcon className="w-5 h-5" />, title: 'Editar Imagens de Fundo' },
  ];

  return (
    <div className="absolute right-5 bottom-5 flex flex-col gap-2 z-[100] pointer-events-none">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col gap-2 bg-[#202024]/90 p-2 rounded-lg border border-[#323238] shadow-[0_4px_15px_rgba(0,0,0,0.5)] backdrop-blur-sm pointer-events-auto">
        {tools.map(tool => (
          <div key={tool.id} className="relative group">
            <Button
              variant="outline"
              size="icon"
              onClick={() => tool.id === 'draw-group' ? setActiveTool('draw-rect') : setActiveTool(tool.id as ActiveTool)}
              className={`w-10 h-10 transition-all ${
                (activeTool === tool.id || (tool.id === 'draw-group' && activeTool.startsWith('draw-')))
                  ? 'bg-[#8257e5] text-white border-[#8257e5] hover:bg-[#9466ff]'
                  : 'bg-transparent text-[#a8a8b3] border-transparent hover:bg-white/10 hover:text-white'
              }`}
              title={tool.title}
            >
              {tool.icon}
            </Button>

            {/* Sub-tools for draw-group: Rect, Ellipse, Poly */}
            {tool.id === 'draw-group' && (
              <div className="absolute right-full top-0 pr-2 hidden group-hover:flex items-center gap-1 h-full">
                {tool.subTools?.map(sub => (
                  <Button
                    key={sub.id}
                    variant="outline"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); setActiveTool(sub.id); }}
                    className={`w-9 h-9 rounded-full transition-all shadow-[0_2px_5px_rgba(0,0,0,0.5)] ${
                      activeTool === sub.id 
                        ? 'bg-[#9466ff] border-[#8257e5] text-white' 
                        : 'bg-[#202024] border-[#323238] text-[#a8a8b3] hover:bg-[#8257e5] hover:text-white'
                    }`}
                    title={sub.title}
                  >
                    {sub.icon}
                  </Button>
                ))}
              </div>
            )}

            {/* Sub-tools for edit-bg: add image button */}
            {tool.id === 'edit-bg' && (
              <div className="absolute right-full top-0 pr-2 hidden group-hover:flex items-center gap-1 h-full">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 rounded-full bg-[#202024] border-[#323238] text-[#a8a8b3] hover:bg-[#8257e5] hover:text-white shadow-[0_2px_5px_rgba(0,0,0,0.5)] transition-all"
                  title="Adicionar Imagem"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
