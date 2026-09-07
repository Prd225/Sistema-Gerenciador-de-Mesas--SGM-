import { useState, useRef } from 'react';
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
  tipShape: 'triangular' | 'square';
}

const PRESET_LIST: PresetMeta[] = [
  {
    id: 'destaques',
    name: 'Destaques',
    description: 'Categorias com pontos de interesse, tags e revelação.',
    color: '#f59e0b',
    icon: Sparkles,
    tipShape: 'triangular',
  },
  {
    id: 'ameacas',
    name: 'Ameaças',
    description: 'Inimigos e perigos com dano, tipo e efeito detalhado.',
    color: '#ef4444',
    icon: Skull,
    tipShape: 'triangular',
  },
  {
    id: 'inventario',
    name: 'Inventário',
    description: 'Itens com peso, elemento, efeito e estado de busca.',
    color: '#06b6d4',
    icon: Package,
    tipShape: 'triangular',
  },
  {
    id: 'diario',
    name: 'Diário de Bordo',
    description: 'Crônicas, anotações de sessão e pistas desvendadas.',
    color: '#3b82f6',
    icon: BookOpen,
    tipShape: 'triangular',
  },
  {
    id: 'npcs',
    name: 'NPCs & Facções',
    description: 'Personagens encontrados, alianças e posturas.',
    color: '#a855f7',
    icon: Users,
    tipShape: 'triangular',
  },
  {
    id: 'missoes',
    name: 'Objetivos & Missões',
    description: 'Metas principais e tarefas com recompensas locais.',
    color: '#10b981',
    icon: Compass,
    tipShape: 'square',
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
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('destaques');

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
  const [customTip, setCustomTip] = useState<'triangular' | 'square'>('square');
  const [customNodeChecked, setCustomNodeChecked] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);

  const zoneTitle = zone?.data?.title || 'Zona Atual';

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
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

          {/* Faixa preta e amarela: Em Construção */}
          <div className="mt-2.5 px-3 py-1 rounded border border-yellow-500/40 bg-[#121214] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hammer className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-yellow-400">
                Em Construção
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
        </div>

        {/* Conteúdo Principal */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {activeTab === 'presets' ? (
            <>
              {/* Carrossel de Marcadores Pré-configurados */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#a8a8b3] uppercase tracking-wider">
                    Escolha um Marcador
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => scrollCarousel('left')}
                      className="p-1 rounded bg-[#18181b] border border-[#323238] text-[#a8a8b3] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      title="Anterior"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCarousel('right')}
                      className="p-1 rounded bg-[#18181b] border border-[#323238] text-[#a8a8b3] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      title="Próximo"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Container do Carrossel */}
                <div
                  ref={carouselRef}
                  className="flex gap-2 overflow-x-auto pb-1 pt-0.5 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  {PRESET_LIST.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setSelectedPresetId(preset.id)}
                        className={`cursor-pointer p-2 rounded-lg border transition-all shrink-0 w-[155px] select-none flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-[#ffd700]/10 border-[#ffd700] shadow-md shadow-[#ffd700]/5'
                            : 'bg-[#18181b] border-[#323238] hover:border-[#52525b]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className="p-1 rounded-md flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${preset.color}20`,
                              color: preset.color,
                            }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-black/40 text-[#a8a8b3] uppercase">
                            {preset.tipShape === 'square' ? 'Quadrada' : 'Triangular'}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#e1e1e6] truncate">
                              {preset.name}
                            </span>
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: preset.color }}
                            />
                          </div>
                          <p className="text-[9.5px] text-[#a8a8b3] line-clamp-1 mt-0.5 leading-snug">
                            {preset.description}
                          </p>
                        </div>

                        <div className="pt-1 border-t border-[#27272a] flex items-center justify-between">
                          <span
                            className={`text-[8.5px] font-bold uppercase tracking-wider ${
                              isSelected ? 'text-[#ffd700]' : 'text-[#71717a]'
                            }`}
                          >
                            {isSelected ? 'Visualizando' : 'Ver prévia'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Área de Preview Fiel da Barra Lateral */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#a8a8b3] uppercase tracking-wider">
                    Prévia na Barra Lateral
                  </span>
                  <span className="text-[10px] text-[#71717a]">
                    Estrutura real dos nós internos
                  </span>
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

                {/* Cor e Formato */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Cor */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#c4c4cc]">
                      Cor do Marcador
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        '#8257e5',
                        '#f59e0b',
                        '#ef4444',
                        '#06b6d4',
                        '#10b981',
                        '#ec4899',
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

                  {/* Formato da Ponta */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#c4c4cc]">
                      Formato da Ponta
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomTip('square')}
                        className={`flex-1 py-1 px-2 rounded border text-xs font-bold transition-all cursor-pointer ${
                          customTip === 'square'
                            ? 'border-[#8257e5] bg-[#8257e5]/20 text-white'
                            : 'border-[#323238] bg-[#121214] text-[#a8a8b3]'
                        }`}
                      >
                        Ponta Quadrada
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomTip('triangular')}
                        className={`flex-1 py-1 px-2 rounded border text-xs font-bold transition-all cursor-pointer ${
                          customTip === 'triangular'
                            ? 'border-[#8257e5] bg-[#8257e5]/20 text-white'
                            : 'border-[#323238] bg-[#121214] text-[#a8a8b3]'
                        }`}
                      >
                        Ponta Triangular
                      </button>
                    </div>
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
