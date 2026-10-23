import { useRef, useState, useEffect } from 'react';
import { useZoneStore } from '@/store/useZoneStore';
import { useFogStore } from '@/store/useFogStore';
import { Button } from '@/components/ui/button';
import {
  Move,
  MousePointer2,
  Square,
  Circle,
  Hexagon,
  MapPin,
  Image as ImageIcon,
  Plus,
  Pencil,
  Edit3,
  Cloud,
  CloudOff,
  Sun,
  Paintbrush,
} from 'lucide-react';
import type { ActiveTool } from '@/types/game';
import { uploadMediaFile } from '@/lib/mediaUpload';

const generateId = () =>
  window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 11);

export default function MapToolbar() {
  const activeTool = useZoneStore((state) => state.activeTool);
  const setActiveTool = useZoneStore((state) => state.setActiveTool);
  const addBgImage = useZoneStore((state) => state.addBgImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fogEnabled = useFogStore((state) => state.enabled);
  const toggleFogEnabled = useFogStore((state) => state.toggleEnabled);
  const coverAllFog = useFogStore((state) => state.coverAll);
  const revealAllFog = useFogStore((state) => state.revealAll);

  const brushSize = useFogStore((state) => state.brushSize);
  const brushShape = useFogStore((state) => state.brushShape);
  const setBrushSize = useFogStore((state) => state.setBrushSize);
  const setBrushShape = useFogStore((state) => state.setBrushShape);

  // Controle local do modo (Cobrir vs Revelar) e forma ativa da névoa
  const [fogMode, setFogMode] = useState<'hide' | 'reveal'>('hide');
  const [fogShape, setFogShape] = useState<'brush' | 'rect' | 'circle' | 'poly'>('brush');

  // Sincroniza estado com a ferramenta ativa atual se ela for de névoa
  useEffect(() => {
    if (activeTool.startsWith('fog-')) {
      const isReveal = activeTool.includes('reveal');
      setFogMode(isReveal ? 'reveal' : 'hide');
      const shape = activeTool.split('-').pop() as 'brush' | 'rect' | 'circle' | 'poly';
      if (['brush', 'rect', 'circle', 'poly'].includes(shape)) {
        setFogShape(shape);
      }
    }
  }, [activeTool]);

  const isFogActive = activeTool.startsWith('fog-');
  const isBrushActive = activeTool.endsWith('-brush');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { url } = await uploadMediaFile(file);
      addBgImage({
        id: generateId(),
        src: url,
        x: 100,
        y: 100,
        scale: 1,
        rotation: 0,
      });
    } catch (err) {
      console.error('[MapToolbar] Erro ao adicionar imagem de fundo:', err);
    }
    e.target.value = ''; // Reset input
  };

  const tools = [
    {
      id: 'pan',
      icon: <Move className="w-5 h-5" />,
      title: 'Mover Fundo (Espaço)',
    },
    {
      id: 'select',
      icon: <MousePointer2 className="w-5 h-5" />,
      title: 'Selecionar (V)',
    },
    {
      id: 'draw-group',
      icon: <Pencil className="w-5 h-5" />,
      title: 'Ferramentas de Zona',
      subTools: [
        {
          id: 'edit-zone' as ActiveTool,
          icon: <Edit3 className="w-4 h-4" />,
          title: 'Editar Zonas (Mover/Redimensionar)',
        },
        {
          id: 'draw-rect' as ActiveTool,
          icon: <Square className="w-4 h-4" />,
          title: 'Desenhar Zona Retangular',
        },
        {
          id: 'draw-ellipse' as ActiveTool,
          icon: <Circle className="w-4 h-4" />,
          title: 'Desenhar Zona Circular',
        },
        {
          id: 'draw-poly' as ActiveTool,
          icon: <Hexagon className="w-4 h-4" />,
          title: 'Desenhar Zona Poligonal',
        },
      ],
    },
    {
      id: 'fog-group',
      icon: (
        <div className="relative">
          <Cloud className="w-5 h-5" />
          {fogEnabled && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
          )}
        </div>
      ),
      title: 'Névoa de Guerra (Fog of War)',
    },
    {
      id: 'add-marker',
      icon: <MapPin className="w-5 h-5" />,
      title: 'Adicionar Marcador',
    },
    {
      id: 'edit-bg',
      icon: <ImageIcon className="w-5 h-5" />,
      title: 'Editar Imagens de Fundo',
    },
  ];

  return (
    <div className="absolute right-5 bottom-5 flex flex-col gap-2 z-30 pointer-events-none">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col gap-2 bg-[#202024]/95 p-2 rounded-lg border border-[#323238] shadow-[0_4px_15px_rgba(0,0,0,0.5)] pointer-events-auto">
        {tools.map((tool) => (
          <div key={tool.id} className="relative group">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (tool.id === 'draw-group') {
                  setActiveTool('draw-rect');
                } else if (tool.id === 'fog-group') {
                  if (activeTool.startsWith('fog-')) {
                    setActiveTool('pan');
                  } else {
                    setActiveTool(`fog-${fogMode}-${fogShape}` as ActiveTool);
                  }
                } else {
                  setActiveTool(tool.id as ActiveTool);
                }
              }}
              className={`w-10 h-10 transition-all ${
                activeTool === tool.id ||
                (tool.id === 'draw-group' &&
                  (activeTool.startsWith('draw-') || activeTool === 'edit-zone')) ||
                (tool.id === 'fog-group' && isFogActive)
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
                {tool.subTools?.map((sub) => (
                  <Button
                    key={sub.id}
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTool(sub.id);
                    }}
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

            {/* Sub-tools for fog-group */}
            {tool.id === 'fog-group' && (
              <div
                className={`absolute right-full top-0 pr-2 ${
                  isFogActive ? 'flex' : 'hidden group-hover:flex'
                } items-center gap-1.5 h-full`}
              >
                {/* Floating Brush Settings Bar */}
                {isFogActive && isBrushActive && (
                  <div className="absolute bottom-[calc(100%+8px)] right-2 flex items-center gap-2.5 bg-[#18181b]/98 px-3 py-1.5 rounded-xl border border-[#3f3f46] shadow-2xl backdrop-blur-md pointer-events-auto whitespace-nowrap">
                    {/* Brush Shape Toggle */}
                    <div className="flex items-center gap-0.5 bg-[#27272a] p-0.5 rounded-lg border border-[#3f3f46]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBrushShape('round');
                        }}
                        className={`p-1 rounded-md transition-all ${
                          brushShape === 'round'
                            ? 'bg-[#8257e5] text-white shadow-sm'
                            : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'
                        }`}
                        title="Pincel Circular"
                      >
                        <Circle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBrushShape('square');
                        }}
                        className={`p-1 rounded-md transition-all ${
                          brushShape === 'square'
                            ? 'bg-[#8257e5] text-white shadow-sm'
                            : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'
                        }`}
                        title="Pincel Quadrado"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-[1px] h-5 bg-[#3f3f46]" />

                    {/* Presets de Tamanho */}
                    <div className="flex items-center gap-1">
                      {[25, 50, 100, 180].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBrushSize(preset);
                          }}
                          className={`px-1.5 py-0.5 text-[11px] font-semibold rounded transition-all ${
                            brushSize === preset
                              ? 'bg-[#8257e5] text-white'
                              : 'bg-[#27272a] text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46]'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    {/* Slider de Tamanho */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range"
                        min={10}
                        max={250}
                        step={5}
                        value={brushSize}
                        onChange={(e) => {
                          e.stopPropagation();
                          setBrushSize(Number(e.target.value));
                        }}
                        className="w-20 h-1 bg-[#3f3f46] rounded appearance-none cursor-pointer accent-[#8257e5]"
                        title="Tamanho do pincel"
                      />
                      <span className="text-[11px] font-mono text-[#e4e4e7] min-w-[36px] text-right">
                        {brushSize}px
                      </span>
                    </div>

                    <span
                      className="text-[10px] text-[#71717a] border-l border-[#3f3f46] pl-2 font-mono"
                      title="Atalhos: [ e ] para ajustar o tamanho"
                    >
                      [ ]
                    </span>
                  </div>
                )}

                {/* Sub-bar Principal da Névoa */}
                <div className="flex items-center gap-1.5 bg-[#18181b]/98 px-2 py-1 rounded-xl border border-[#3f3f46] shadow-2xl backdrop-blur-md pointer-events-auto">
                  {/* Status Toggle On/Off da Névoa */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFogEnabled();
                    }}
                    className={`relative w-8 h-8 rounded-lg transition-all ${
                      fogEnabled
                        ? 'bg-purple-600/25 border-purple-500 text-purple-300 hover:bg-purple-600/35'
                        : 'bg-[#27272a] border-[#3f3f46] text-[#71717a] hover:bg-white/10'
                    }`}
                    title={
                      fogEnabled
                        ? 'Névoa Ativa no Mapa (clique para pausar)'
                        : 'Névoa Pausada (clique para ativar)'
                    }
                  >
                    {fogEnabled ? (
                      <Cloud className="w-4 h-4 text-purple-400" />
                    ) : (
                      <CloudOff className="w-4 h-4" />
                    )}
                    {fogEnabled && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                    )}
                  </Button>

                  <div className="w-[1px] h-5 bg-[#3f3f46]" />

                  {/* Modo: Cobrir vs Revelar */}
                  <div className="flex items-center bg-[#27272a] p-0.5 rounded-lg border border-[#3f3f46]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFogMode('hide');
                        setActiveTool(`fog-hide-${fogShape}` as ActiveTool);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                        fogMode === 'hide'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'
                      }`}
                      title="Modo Cobrir: desenha névoa ocultando visão"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Cobrir</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFogMode('reveal');
                        setActiveTool(`fog-reveal-${fogShape}` as ActiveTool);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                        fogMode === 'reveal'
                          ? 'bg-amber-400 text-black font-bold shadow-sm'
                          : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'
                      }`}
                      title="Modo Revelar: remove névoa abrindo visão"
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Revelar</span>
                    </button>
                  </div>

                  <div className="w-[1px] h-5 bg-[#3f3f46]" />

                  {/* Ferramentas: Pincel, Retângulo, Círculo, Polígono */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFogShape('brush');
                        setActiveTool(`fog-${fogMode}-brush` as ActiveTool);
                      }}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        fogShape === 'brush'
                          ? fogMode === 'reveal'
                            ? 'bg-amber-400/25 border-amber-400 text-amber-300'
                            : 'bg-purple-600/30 border-purple-500 text-purple-300'
                          : 'bg-[#27272a] border-[#3f3f46] text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46]'
                      }`}
                      title={`Pincel Livre (${fogMode === 'reveal' ? 'Revelar' : 'Cobrir'})`}
                    >
                      <Paintbrush className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFogShape('rect');
                        setActiveTool(`fog-${fogMode}-rect` as ActiveTool);
                      }}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        fogShape === 'rect'
                          ? fogMode === 'reveal'
                            ? 'bg-amber-400/25 border-amber-400 text-amber-300'
                            : 'bg-purple-600/30 border-purple-500 text-purple-300'
                          : 'bg-[#27272a] border-[#3f3f46] text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46]'
                      }`}
                      title={`Retângulo (${fogMode === 'reveal' ? 'Revelar' : 'Cobrir'})`}
                    >
                      <Square className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFogShape('circle');
                        setActiveTool(`fog-${fogMode}-circle` as ActiveTool);
                      }}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        fogShape === 'circle'
                          ? fogMode === 'reveal'
                            ? 'bg-amber-400/25 border-amber-400 text-amber-300'
                            : 'bg-purple-600/30 border-purple-500 text-purple-300'
                          : 'bg-[#27272a] border-[#3f3f46] text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46]'
                      }`}
                      title={`Círculo (${fogMode === 'reveal' ? 'Revelar' : 'Cobrir'})`}
                    >
                      <Circle className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFogShape('poly');
                        setActiveTool(`fog-${fogMode}-poly` as ActiveTool);
                      }}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        fogShape === 'poly'
                          ? fogMode === 'reveal'
                            ? 'bg-amber-400/25 border-amber-400 text-amber-300'
                            : 'bg-purple-600/30 border-purple-500 text-purple-300'
                          : 'bg-[#27272a] border-[#3f3f46] text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46]'
                      }`}
                      title={`Polígono (${fogMode === 'reveal' ? 'Revelar' : 'Cobrir'})`}
                    >
                      <Hexagon className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="w-[1px] h-5 bg-[#3f3f46]" />

                  {/* Ações Globais: Cobrir Tudo / Revelar Tudo */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        coverAllFog();
                      }}
                      className="w-8 h-8 rounded-lg bg-[#27272a] border-[#3f3f46] text-purple-400 hover:bg-purple-600/20 hover:text-purple-300"
                      title="Cobrir todo o mapa com névoa"
                    >
                      <Cloud className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        revealAllFog();
                      }}
                      className="w-8 h-8 rounded-lg bg-[#27272a] border-[#3f3f46] text-amber-300 hover:bg-amber-600/20 hover:text-amber-200"
                      title="Revelar todo o mapa"
                    >
                      <Sun className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
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
