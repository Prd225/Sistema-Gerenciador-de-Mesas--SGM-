import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BookmarkPlus,
  Sparkles,
  Skull,
  Package,
  BookOpen,
  Users,
  Compass,
  Hammer,
  ChevronLeft,
  ChevronRight,
  Square,
  CheckSquare,
  Check,
  Plus,
} from 'lucide-react';
import type { Zone } from '@/types/game';
import { useZoneStore } from '@/store/useZoneStore';

interface ZoneMarkerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: Zone | null;
}

// Interfaces fiéis ao funcionamento real dos marcadores no SGM
interface ThreatNode {
  id: string;
  name: string;
  type: string;
  damage: string;
  damageType: string;
  effect: string;
  isRevealed: boolean;
}

interface HighlightCategory {
  title: string;
  options: {
    id: string;
    name: string;
    desc: string;
    color: 'yellow' | 'blue' | 'purple' | 'green' | 'red';
    tags: string;
    isRevealed: boolean;
  }[];
}

interface InventoryNode {
  id: string;
  name: string;
  type: string;
  element: string;
  weight: string;
  effect: string;
  desc: string;
  isFound: boolean;
}

interface JournalNode {
  id: string;
  title: string;
  session: string;
  author: string;
  text: string;
  isRevealed: boolean;
}

interface NpcNode {
  id: string;
  name: string;
  role: string;
  disposition: string;
  notes: string;
  isRevealed: boolean;
}

interface QuestNode {
  id: string;
  title: string;
  priority: string;
  reward: string;
  objective: string;
  isCompleted: boolean;
}

interface PresetMeta {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: any;
}

const PRESET_LIST: PresetMeta[] = [
  {
    id: 'destaques',
    name: 'Destaques',
    description: 'Eventos, marcos e pontos de investigação da cena.',
    color: '#f59e0b',
    icon: Sparkles,
  },
  {
    id: 'ameacas',
    name: 'Ameaças',
    description: 'Inimigos, perigos ambientais e armadilhas ativas.',
    color: '#ef4444',
    icon: Skull,
  },
  {
    id: 'inventario',
    name: 'Inventário',
    description: 'Itens coletáveis, suprimentos e recompensas locais.',
    color: '#06b6d4',
    icon: Package,
  },
  {
    id: 'diario',
    name: 'Diário de Bordo',
    description: 'Crônicas, anotações de sessão e pistas desvendadas.',
    color: '#3b82f6',
    icon: BookOpen,
  },
  {
    id: 'npcs',
    name: 'NPCs & Facções',
    description: 'Personagens encontrados, alianças e contatos locais.',
    color: '#a855f7',
    icon: Users,
  },
  {
    id: 'missoes',
    name: 'Missões',
    description: 'Metas principais e tarefas com recompensas da área.',
    color: '#10b981',
    icon: Compass,
  },
];

// Dados realistas de demonstração para o preview
const SAMPLE_HIGHLIGHTS: HighlightCategory[] = [
  {
    title: 'Pontos de Investigação',
    options: [
      {
        id: 'h1',
        name: 'Altar de Sangue',
        desc: 'Monólito entalhado com rituais arcanos. A vala central ressoa com energia espectral.',
        color: 'yellow',
        tags: 'INVESTIGAÇÃO, MISTÉRIO',
        isRevealed: false,
      },
      {
        id: 'h2',
        name: 'Passagem Secreta',
        desc: 'Fenda oculta atrás de raízes que leva diretamente às catacumbas inferiores.',
        color: 'blue',
        tags: 'EXPLORAÇÃO',
        isRevealed: true,
      },
    ],
  },
];

const SAMPLE_THREATS: ThreatNode[] = [
  {
    id: 't1',
    name: 'Sentinela Encouraçado',
    type: 'Monstro',
    damage: '2d8+4',
    damageType: 'Impacto / Balístico',
    effect:
      'Autômato guardião blindado. Desfere contra-ataque imediato em área a cada acerto crítico sofrido.',
    isRevealed: false,
  },
  {
    id: 't2',
    name: 'Armadilha de Lâminas Ocultas',
    type: 'Armadilha',
    damage: '3d6',
    damageType: 'Corte / Perfurante',
    effect:
      'Placa de pressão oculta entre ladrilhos. Exige teste de Percepção DT 18 para notar antes do disparo.',
    isRevealed: true,
  },
];

const SAMPLE_INVENTORY: InventoryNode[] = [
  {
    id: 'inv1',
    name: 'Chave do Sacrário',
    type: 'Chave',
    element: 'Conhecimento',
    weight: '1 Espaço',
    effect: 'Abre fechaduras seladas da nave central',
    desc: 'Chave de metal escurecido esculpida em formato de crânio estilizado.',
    isFound: false,
  },
  {
    id: 'inv2',
    name: 'Elixir da Vitalidade',
    type: 'Consumível',
    element: 'Sangue',
    weight: '1 Espaço',
    effect: 'Recupera 3d8+3 Pontos de Vida',
    desc: 'Frasco reforçado contendo líquido carmesim espesso e energizante.',
    isFound: true,
  },
];

const SAMPLE_JOURNALS: JournalNode[] = [
  {
    id: 'j1',
    title: 'Relato do Primeiro Batedor',
    session: 'Sessão 11',
    author: 'Mestre',
    text: 'Encontramos marcas de garras nas paredes reforçadas de ferro. Os cultistas abandonaram o posto às pressas.',
    isRevealed: false,
  },
  {
    id: 'j2',
    title: 'Inscrição na Lápide Oculta',
    session: 'Sessão 09',
    author: 'Eldrin',
    text: '"Aquele que quebrar o selo das três chaves herdará o peso da maldição ancestral."',
    isRevealed: true,
  },
];

const SAMPLE_NPCS: NpcNode[] = [
  {
    id: 'npc1',
    name: 'Eldrin, o Arquivista',
    role: 'Erudito Resgatado',
    disposition: 'Aliado',
    notes:
      'Conhece o dialeto das catacumbas e oferece decifrar textos antigos em troca de proteção.',
    isRevealed: false,
  },
  {
    id: 'npc2',
    name: 'Vigia das Sombras',
    role: 'Mercenário Renegado',
    disposition: 'Hostil',
    notes: 'Patrulha o corredor norte armado com arco longo e dardos envenenados.',
    isRevealed: true,
  },
];

const SAMPLE_QUESTS: QuestNode[] = [
  {
    id: 'q1',
    title: 'Desativar o Núcleo Corruptor',
    priority: 'Missão Principal',
    reward: '350 XP / Acesso ao Cofre',
    objective:
      'Interromper a fonte de energia antes que o ritual de invocação atinja o ápice.',
    isCompleted: false,
  },
  {
    id: 'q2',
    title: 'Resgatar as Anotações do Explorador',
    priority: 'Secundária',
    reward: 'Diário Mágico + 100 PO',
    objective:
      'Recuperar o livro de anotações no laboratório de alquimia submerso.',
    isCompleted: true,
  },
];

export default function ZoneMarkerModal({
  open,
  onOpenChange,
  zone,
}: ZoneMarkerModalProps) {
  const updateZoneData = useZoneStore((state) => state.updateZoneData);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('destaques');

  // Marcadores ativos na zona atual
  const activeMarkers = zone?.data?.activeMarkers ?? [
    'destaques',
    'ameacas',
    'inventario',
  ];
  const isCurrentPresetActive = activeMarkers.includes(selectedPresetId);

  const handleToggleMarker = (presetId: string) => {
    if (!zone) return;
    const current = zone.data?.activeMarkers ?? [
      'destaques',
      'ameacas',
      'inventario',
    ];
    const exists = current.includes(presetId);
    const updated = exists
      ? current.filter((id) => id !== presetId)
      : [...current, presetId];

    updateZoneData(zone.id, { activeMarkers: updated });
  };

  // Estado interativo dos nós no preview
  const [nodeState, setNodeState] = useState<Record<string, boolean>>({
    h1: false,
    h2: true,
    t1: false,
    t2: true,
    inv1: false,
    inv2: true,
    j1: false,
    j2: true,
    npc1: false,
    npc2: true,
    q1: false,
    q2: true,
  });

  // Campos do marcador personalizado
  const [customName, setCustomName] = useState('Grimório Arcano');
  const [customCategory, setCustomCategory] = useState('Feitiços Ativos');
  const [customColor, setCustomColor] = useState('#8257e5');
  const [customNodeChecked, setCustomNodeChecked] = useState(false);

  // Estado do Balãozinho / Tooltip inteligente ao passar o cursor no Card
  const [hoveredPreset, setHoveredPreset] = useState<PresetMeta | null>(null);
  const [tooltipState, setTooltipState] = useState<{
    left: number;
    top: number;
    arrowOffset: number;
    placement: 'above' | 'below';
  } | null>(null);

  // Controle de rolagem do carrossel para habilitar/desabilitar botões
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const carouselRef = useRef<HTMLDivElement>(null);
  const carouselContainerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const zoneTitle = zone?.data?.title || 'Zona Atual';

  const updateScrollState = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  useEffect(() => {
    if (open && activeTab === 'presets') {
      const timer = setTimeout(updateScrollState, 60);
      return () => clearTimeout(timer);
    }
  }, [open, activeTab]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const scrollCarousel = (direction: 'left' | 'right') => {
    handleCardMouseLeave();
    if (carouselRef.current) {
      // Passo de rolagem exato de 1 card (130px largura + 8px gap = 138px)
      const cardStride = 138;
      const scrollAmount = direction === 'left' ? -cardStride : cardStride;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(updateScrollState, 320);
    }
  };

  const handleCardMouseEnter = (
    preset: PresetMeta,
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (carouselContainerRef.current) {
      const containerRect = carouselContainerRef.current.getBoundingClientRect();
      const cardRect = e.currentTarget.getBoundingClientRect();
      const cardCenterX = cardRect.left - containerRect.left + cardRect.width / 2;
      const containerWidth = containerRect.width;

      const tooltipWidth = 210;
      const halfTooltip = tooltipWidth / 2;
      const padding = 12;

      const minX = halfTooltip + padding;
      const maxX = Math.max(minX, containerWidth - halfTooltip - padding);
      const clampedCenterX = Math.max(minX, Math.min(cardCenterX, maxX));

      // Deslocamento da seta em relação ao centro do balãozinho
      const rawOffset = cardCenterX - clampedCenterX;
      const maxOffset = halfTooltip - 16;
      const safeArrowOffset = Math.max(-maxOffset, Math.min(rawOffset, maxOffset));

      // Determina dinamicamente a posição vertical conforme o espaço disponível
      const spaceAbove = cardRect.top - containerRect.top;
      const placement: 'above' | 'below' = spaceAbove >= 55 ? 'above' : 'below';

      const top =
        placement === 'above'
          ? cardRect.top - containerRect.top - 8
          : cardRect.bottom - containerRect.top + 8;

      // Aguarda 350ms para evitar que apareça rápido demais ao apenas mover o cursor
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredPreset(preset);
        setTooltipState({
          left: clampedCenterX,
          top,
          arrowOffset: safeArrowOffset,
          placement,
        });
      }, 350);
    }
  };

  const handleCardMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredPreset(null);
    setTooltipState(null);
  };

  const toggleNode = (id: string) => {
    setNodeState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#202024] border-[#323238] text-[#e1e1e6] sm:max-w-[620px] max-h-[90vh] flex flex-col shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 pb-2.5 border-b border-[#323238]">
          <DialogHeader>
            <DialogTitle className="text-[#ffd700] flex items-center gap-2.5 text-base font-bold">
              <BookmarkPlus className="w-5 h-5 text-[#ffd700]" />
              Gerenciador de Marcadores
            </DialogTitle>
            <DialogDescription className="text-xs text-[#a8a8b3]">
              Personalize os marcadores e submenus da lateral de{' '}
              <span className="font-semibold text-white">{zoneTitle}</span>.
            </DialogDescription>
          </DialogHeader>

          {/* Abas solicitadas: apenas texto, sem ícones */}
          <div className="flex gap-2 mt-3 bg-[#121214] p-1 rounded-lg border border-[#323238]">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all text-center ${
                activeTab === 'presets'
                  ? 'bg-[#8257e5] text-white shadow-sm'
                  : 'text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-white/5'
              }`}
            >
              Marcadores pré-configurados
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all text-center ${
                activeTab === 'custom'
                  ? 'bg-[#8257e5] text-white shadow-sm'
                  : 'text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-white/5'
              }`}
            >
              Marcadores personalizados
            </button>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {activeTab === 'presets' ? (
            <>
              {/* Carrossel de Marcadores Pré-configurados */}
              <div ref={carouselContainerRef} className="relative space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#a8a8b3] uppercase tracking-wider">
                    Visualize um marcador
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => scrollCarousel('left')}
                      disabled={!canScrollLeft}
                      className={`p-1 rounded bg-[#18181b] border border-[#323238] transition-colors cursor-pointer ${
                        canScrollLeft
                          ? 'text-[#e1e1e6] hover:text-white hover:bg-white/10'
                          : 'opacity-30 text-[#71717a] cursor-not-allowed'
                      }`}
                      title="Anterior"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCarousel('right')}
                      disabled={!canScrollRight}
                      className={`p-1 rounded bg-[#18181b] border border-[#323238] transition-colors cursor-pointer ${
                        canScrollRight
                          ? 'text-[#e1e1e6] hover:text-white hover:bg-white/10'
                          : 'opacity-30 text-[#71717a] cursor-not-allowed'
                      }`}
                      title="Próximo"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Container do Carrossel */}
                <div
                  ref={carouselRef}
                  onScroll={() => {
                    handleCardMouseLeave();
                    updateScrollState();
                  }}
                  className="flex gap-2 overflow-x-auto px-2.5 py-1.5 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  {PRESET_LIST.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = selectedPresetId === preset.id;
                    const isActive = activeMarkers.includes(preset.id);
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setSelectedPresetId(preset.id)}
                        onMouseEnter={(e) => handleCardMouseEnter(preset, e)}
                        onMouseLeave={handleCardMouseLeave}
                        className={`group cursor-pointer py-2.5 px-2 rounded-lg border transition-all shrink-0 w-[130px] snap-start select-none flex flex-col items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-[#ffd700]/10 border-[#ffd700] shadow-md shadow-[#ffd700]/10 ring-1 ring-[#ffd700]/30'
                            : isActive
                              ? 'bg-[#18181b] border-[#323238] hover:border-[#10b981]/50 hover:bg-[#202024]'
                              : 'bg-[#18181b] border-[#323238] hover:border-[#52525b] hover:bg-[#202024]'
                        }`}
                      >
                        <div className="w-full flex items-center justify-center gap-1">
                          <span className="text-xs font-bold text-center block truncate text-[#e1e1e6] group-hover:text-white transition-colors">
                            {preset.name}
                          </span>
                          {isActive && (
                            <span
                              className="text-[#10b981] text-[10px] font-black shrink-0"
                              title="Marcador Ativo nesta Zona"
                            >
                              ✓
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-center gap-1.5 w-full">
                          <div
                            className="h-[1px] w-4 transition-colors"
                            style={{
                              backgroundColor: isSelected
                                ? `${preset.color}80`
                                : '#323238',
                            }}
                          />
                          <Icon
                            className="w-4 h-4 transition-transform group-hover:scale-110 shrink-0"
                            style={{ color: preset.color }}
                          />
                          <div
                            className="h-[1px] w-4 transition-colors"
                            style={{
                              backgroundColor: isSelected
                                ? `${preset.color}80`
                                : '#323238',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Balãozinho de Fala / Hint inteligente adaptado ao espaço */}
                {hoveredPreset && tooltipState && (
                  <div
                    className="absolute pointer-events-none z-50 transition-all duration-150 ease-out"
                    style={{
                      left: `${tooltipState.left}px`,
                      top: `${tooltipState.top}px`,
                      transform:
                        tooltipState.placement === 'above'
                          ? 'translate(-50%, -100%)'
                          : 'translate(-50%, 0)',
                    }}
                  >
                    <div className="relative bg-[#18181b] border border-[#ffd700] text-[#e1e1e6] px-3 py-1.5 rounded-lg shadow-2xl text-[11px] leading-snug w-[210px] text-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                      <p className="text-[#e1e1e6] font-medium leading-tight">
                        {hoveredPreset.description}
                      </p>

                      {/* Pontinha do balãozinho ajustada dinamicamente apontando para o card */}
                      <div
                        className={`w-2.5 h-2.5 bg-[#18181b] border-[#ffd700] absolute ${
                          tooltipState.placement === 'above'
                            ? '-bottom-1.5 border-r border-b'
                            : '-top-1.5 border-l border-t'
                        }`}
                        style={{
                          left: `calc(50% + ${tooltipState.arrowOffset}px)`,
                          transform: 'translateX(-50%) rotate(45deg)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Área de Preview Fiel da Barra Lateral */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#a8a8b3] uppercase tracking-wider">
                    Prévia na Barra Lateral
                  </span>

                  {/* Controle funcional de Ativar / Desativar Marcador */}
                  <div className="flex items-center gap-2">
                    {isCurrentPresetActive ? (
                      <>
                        <span className="text-[10px] font-bold text-[#10b981] flex items-center gap-1 bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/30">
                          <Check className="w-3 h-3" /> Ativo nesta Zona
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleMarker(selectedPresetId)}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all flex items-center gap-1 cursor-pointer"
                          title="Desativar este marcador na zona atual"
                        >
                          Desativar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleMarker(selectedPresetId)}
                        className="text-[11px] font-bold px-3 py-1 rounded bg-[#ffd700] hover:bg-[#ffd700]/90 text-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Ativar este marcador na zona atual"
                      >
                        <Plus className="w-3.5 h-3.5" /> Ativar Marcador
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-[#18181b] border border-[#323238] rounded-lg p-3 space-y-3">
                  {/* CASO 1: AMEAÇAS (Sem título geral de categoria; cards complexos com Dano, Tipo, Efeito e Tag vermelha) */}
                  {selectedPresetId === 'ameacas' && (
                    <div className="space-y-2.5">
                      {SAMPLE_THREATS.map((threat) => {
                        const isRev = nodeState[threat.id] ?? threat.isRevealed;
                        return (
                          <div
                            key={threat.id}
                            className={`bg-black/20 p-3 rounded border border-[#323238] min-w-0 transition-opacity ${
                              isRev ? 'opacity-50' : 'opacity-100'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => toggleNode(threat.id)}
                                  className="text-[#a8a8b3] hover:text-[#8257e5] transition-colors cursor-pointer shrink-0"
                                  title="Marcar como revelada"
                                >
                                  {isRev ? (
                                    <CheckSquare className="w-5 h-5 text-red-500" />
                                  ) : (
                                    <Square className="w-5 h-5" />
                                  )}
                                </button>
                                <span className="font-bold text-[#e1e1e6] text-sm break-words min-w-0">
                                  {threat.name}
                                </span>
                              </div>
                              <span className="bg-red-500/20 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/30 uppercase shrink-0 ml-2">
                                {threat.type}
                              </span>
                            </div>

                            {/* Sub-row de Dano e Tipo */}
                            <div className="flex gap-4 mb-1.5 text-xs text-[#a8a8b3] pl-7">
                              <div>
                                <span className="font-bold text-[#e1e1e6]">
                                  Dano:
                                </span>{' '}
                                {threat.damage}
                              </div>
                              <div>
                                <span className="font-bold text-[#e1e1e6]">
                                  Tipo:
                                </span>{' '}
                                {threat.damageType}
                              </div>
                            </div>

                            {/* Linha de Efeito */}
                            <div className="pl-7 text-xs text-[#c4c4cc] leading-relaxed">
                              {threat.effect}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CASO 2: DESTAQUES (Com título de categoria, borda lateral colorida e tags) */}
                  {selectedPresetId === 'destaques' && (
                    <div className="space-y-3">
                      {SAMPLE_HIGHLIGHTS.map((cat, catIdx) => (
                        <div key={catIdx} className="space-y-2">
                          <div className="font-bold text-xs uppercase tracking-wider text-[#e1e1e6] border-b border-[#323238] pb-1">
                            {cat.title}
                          </div>
                          {cat.options.map((hl) => {
                            const isRev = nodeState[hl.id] ?? hl.isRevealed;
                            const borderMap: Record<string, string> = {
                              yellow: 'border-l-yellow-400',
                              blue: 'border-l-blue-500',
                              purple: 'border-l-purple-500',
                              red: 'border-l-red-500',
                              green: 'border-l-green-500',
                            };
                            const textMap: Record<string, string> = {
                              yellow: 'text-yellow-400',
                              blue: 'text-blue-400',
                              purple: 'text-purple-400',
                              red: 'text-red-400',
                              green: 'text-green-400',
                            };

                            return (
                              <div
                                key={hl.id}
                                className={`bg-black/20 p-3 rounded border-l-[3px] ml-1.5 min-w-0 transition-opacity ${
                                  borderMap[hl.color] || 'border-l-gray-500'
                                } ${isRev ? 'opacity-50' : 'opacity-100'}`}
                              >
                                <div className="flex justify-between items-start mb-1 gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => toggleNode(hl.id)}
                                      className="text-[#a8a8b3] hover:text-[#8257e5] transition-colors cursor-pointer shrink-0"
                                      title="Marcar como revelado"
                                    >
                                      {isRev ? (
                                        <CheckSquare className="w-4 h-4 text-[#04d361]" />
                                      ) : (
                                        <Square className="w-4 h-4" />
                                      )}
                                    </button>
                                    <span
                                      className={`font-bold text-sm break-words min-w-0 ${
                                        textMap[hl.color] || 'text-white'
                                      }`}
                                    >
                                      {hl.name}
                                    </span>
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    {hl.tags.split(',').map((t, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-[#121214] text-[#a8a8b3] px-1.5 py-0.5 rounded text-[9px] border border-[#323238] uppercase"
                                      >
                                        {t.trim()}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-[#c4c4cc] pl-6 leading-relaxed">
                                  {hl.desc}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CASO 3: INVENTÁRIO (Sem categoria, com tags de tipo, elemento, peso e efeito) */}
                  {selectedPresetId === 'inventario' && (
                    <div className="space-y-2.5">
                      {SAMPLE_INVENTORY.map((item) => {
                        const isF = nodeState[item.id] ?? item.isFound;
                        const elColorMap: Record<string, string> = {
                          Conhecimento:
                            'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
                          Sangue: 'text-red-500 border-red-500/30 bg-red-500/10',
                          Morte: 'text-gray-400 border-gray-400/30 bg-gray-400/10',
                          Energia:
                            'text-purple-500 border-purple-500/30 bg-purple-500/10',
                        };

                        return (
                          <div
                            key={item.id}
                            className={`bg-black/20 p-3 rounded border border-[#323238] min-w-0 transition-opacity ${
                              isF ? 'opacity-50 grayscale' : 'opacity-100'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => toggleNode(item.id)}
                                  className="text-[#a8a8b3] hover:text-[#8257e5] transition-colors cursor-pointer shrink-0"
                                  title="Marcar como encontrado"
                                >
                                  {isF ? (
                                    <CheckSquare className="w-5 h-5 text-[#ffd700]" />
                                  ) : (
                                    <Square className="w-5 h-5" />
                                  )}
                                </button>
                                <span
                                  className={`font-bold text-sm break-words min-w-0 ${
                                    isF ? 'text-[#a8a8b3] line-through' : 'text-[#e1e1e6]'
                                  }`}
                                >
                                  {item.name}
                                </span>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <span className="bg-[#121214] text-[#a8a8b3] text-[10px] px-2 py-0.5 rounded border border-[#323238] uppercase">
                                  {item.type}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded border uppercase ${
                                    elColorMap[item.element] ||
                                    'text-[#a8a8b3] border-[#323238]'
                                  }`}
                                >
                                  {item.element}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-4 mb-1.5 text-xs text-[#a8a8b3] pl-7">
                              <div>
                                <span className="font-bold text-[#e1e1e6]">
                                  Peso:
                                </span>{' '}
                                {item.weight}
                              </div>
                              <div>
                                <span className="font-bold text-[#e1e1e6]">
                                  Efeito:
                                </span>{' '}
                                {item.effect}
                              </div>
                            </div>

                            <div className="pl-7 text-xs text-[#c4c4cc] leading-relaxed">
                              {item.desc}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CASO 4: DIÁRIO DE BORDO */}
                  {selectedPresetId === 'diario' && (
                    <div className="space-y-2.5">
                      {SAMPLE_JOURNALS.map((j) => {
                        const isRev = nodeState[j.id] ?? j.isRevealed;
                        return (
                          <div
                            key={j.id}
                            className={`bg-black/20 p-3 rounded border border-[#323238] min-w-0 transition-opacity ${
                              isRev ? 'opacity-50' : 'opacity-100'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => toggleNode(j.id)}
                                  className="text-[#a8a8b3] hover:text-[#3b82f6] transition-colors cursor-pointer shrink-0"
                                >
                                  {isRev ? (
                                    <CheckSquare className="w-5 h-5 text-[#3b82f6]" />
                                  ) : (
                                    <Square className="w-5 h-5" />
                                  )}
                                </button>
                                <span className="font-bold text-sm text-[#e1e1e6]">
                                  {j.title}
                                </span>
                              </div>
                              <span className="bg-[#121214] text-[#3b82f6] text-[10px] px-2 py-0.5 rounded border border-[#3b82f6]/30 uppercase shrink-0">
                                {j.session}
                              </span>
                            </div>
                            <p className="pl-7 text-xs text-[#c4c4cc] leading-relaxed italic">
                              "{j.text}"
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CASO 5: NPCS & FACÇÕES */}
                  {selectedPresetId === 'npcs' && (
                    <div className="space-y-2.5">
                      {SAMPLE_NPCS.map((npc) => {
                        const isRev = nodeState[npc.id] ?? npc.isRevealed;
                        return (
                          <div
                            key={npc.id}
                            className={`bg-black/20 p-3 rounded border border-[#323238] min-w-0 transition-opacity ${
                              isRev ? 'opacity-50' : 'opacity-100'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => toggleNode(npc.id)}
                                  className="text-[#a8a8b3] hover:text-[#a855f7] transition-colors cursor-pointer shrink-0"
                                >
                                  {isRev ? (
                                    <CheckSquare className="w-5 h-5 text-[#a855f7]" />
                                  ) : (
                                    <Square className="w-5 h-5" />
                                  )}
                                </button>
                                <span className="font-bold text-sm text-[#e1e1e6]">
                                  {npc.name}
                                </span>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <span className="bg-[#121214] text-[#a8a8b3] text-[10px] px-2 py-0.5 rounded border border-[#323238] uppercase">
                                  {npc.role}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded border uppercase ${
                                    npc.disposition === 'Aliado'
                                      ? 'text-green-400 border-green-500/30 bg-green-500/10'
                                      : 'text-red-400 border-red-500/30 bg-red-500/10'
                                  }`}
                                >
                                  {npc.disposition}
                                </span>
                              </div>
                            </div>
                            <p className="pl-7 text-xs text-[#c4c4cc] leading-relaxed">
                              {npc.notes}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CASO 6: OBJETIVOS & MISSÕES */}
                  {selectedPresetId === 'missoes' && (
                    <div className="space-y-2.5">
                      {SAMPLE_QUESTS.map((q) => {
                        const isComp = nodeState[q.id] ?? q.isCompleted;
                        return (
                          <div
                            key={q.id}
                            className={`bg-black/20 p-3 rounded border border-[#323238] min-w-0 transition-opacity ${
                              isComp ? 'opacity-50' : 'opacity-100'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => toggleNode(q.id)}
                                  className="text-[#a8a8b3] hover:text-[#10b981] transition-colors cursor-pointer shrink-0"
                                >
                                  {isComp ? (
                                    <CheckSquare className="w-5 h-5 text-[#10b981]" />
                                  ) : (
                                    <Square className="w-5 h-5" />
                                  )}
                                </button>
                                <span
                                  className={`font-bold text-sm text-[#e1e1e6] ${
                                    isComp ? 'line-through text-[#a8a8b3]' : ''
                                  }`}
                                >
                                  {q.title}
                                </span>
                              </div>
                              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 uppercase shrink-0">
                                {q.priority}
                              </span>
                            </div>
                            <div className="pl-7 text-xs text-[#a8a8b3] mb-1">
                              <span className="font-bold text-[#e1e1e6]">
                                Recompensa:
                              </span>{' '}
                              {q.reward}
                            </div>
                            <p className="pl-7 text-xs text-[#c4c4cc] leading-relaxed">
                              {q.objective}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Aba: Marcadores Personalizados */
            <div className="space-y-3">
              {/* Faixa preta e amarela: Em Construção */}
              <div className="px-3 py-1.5 rounded border border-yellow-500/40 bg-[#121214] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hammer className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-[11px] font-bold tracking-wider uppercase text-yellow-400">
                    Marcadores Personalizados • Em Construção
                  </span>
                </div>
                {/* Padrão listrado preto e amarelo */}
                <div
                  className="w-20 h-2 rounded opacity-80"
                  style={{
                    background:
                      'repeating-linear-gradient(45deg, #eab308, #eab308 5px, #000000 5px, #000000 10px)',
                  }}
                />
              </div>

              <div className="bg-[#18181b] border border-[#323238] rounded-lg p-3 space-y-2.5">
                {/* Nome do Marcador */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#c4c4cc]">
                    Nome do Marcador
                  </label>
                  <Input
                    placeholder="Ex: Grimório, Clima, Religião, Rumores..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="bg-[#121214] border-[#323238] text-xs h-8 text-white focus:border-[#8257e5]"
                  />
                </div>

                {/* Categoria Inicial */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#c4c4cc]">
                    Categoria Inicial
                  </label>
                  <Input
                    placeholder="Ex: Feitiços Ativos, Notas de Exploração..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="bg-[#121214] border-[#323238] text-xs h-8 text-white focus:border-[#8257e5]"
                  />
                </div>

                {/* Cor do Marcador */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-semibold text-[#c4c4cc]">
                    Cor do Marcador
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      '#8257e5',
                      '#f59e0b',
                      '#ef4444',
                      '#06b6d4',
                      '#10b981',
                      '#ec4899',
                      '#3b82f6',
                      '#a855f7',
                    ].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCustomColor(c)}
                        className="w-5 h-5 rounded-full border border-black/40 flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                        style={{ backgroundColor: c }}
                      >
                        {customColor === c && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prévia do Marcador Personalizado */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#a8a8b3] uppercase tracking-wider">
                    Prévia do Marcador Personalizado
                  </span>
                </div>

                <div className="bg-[#18181b] border border-[#323238] rounded-lg p-3 space-y-2.5">
                  <div className="border-b border-[#323238] pb-1 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#e1e1e6]">
                      {customCategory || 'Categoria'}
                    </span>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: customColor }}
                    />
                  </div>

                  {/* Nó de Exemplo */}
                  <div
                    className={`bg-black/30 border border-[#323238] rounded-md p-3 transition-opacity ${
                      customNodeChecked ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => setCustomNodeChecked(!customNodeChecked)}
                        className="text-[#a8a8b3] hover:text-[#ffd700] transition-colors mt-0.5 shrink-0 cursor-pointer"
                      >
                        {customNodeChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#04d361]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-xs font-bold text-[#e1e1e6] block ${
                            customNodeChecked
                              ? 'line-through text-[#a8a8b3]'
                              : ''
                          }`}
                        >
                          {customName || 'Novo Nó'}
                        </span>
                        <p className="text-[11px] text-[#a8a8b3] mt-1 leading-relaxed">
                          Exemplo de nó personalizado vinculado à barra lateral desta zona.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  disabled
                  className="bg-[#8257e5]/40 text-white text-xs font-bold cursor-not-allowed opacity-60"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Criar Marcador (Em breve)
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-3 border-t border-[#323238] bg-[#1a1a1e] flex justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#323238] bg-transparent text-[#e1e1e6] hover:bg-white/5 text-xs font-semibold"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
