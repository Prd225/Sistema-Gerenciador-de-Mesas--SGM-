import { useState, useMemo } from 'react';
import type { HandoutItem } from '@/types/inventory';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import {
  X,
  Tv,
  Eye,
  Users,
  UserCheck,
  Check,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface HandoutAudienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: HandoutItem;
  mode: 'project' | 'share';
  onConfirm: (targetPlayerNames: string[] | null) => void;
  onUnshare?: () => void;
}

export default function HandoutAudienceModal({
  isOpen,
  onClose,
  item,
  mode,
  onConfirm,
  onUnshare,
}: HandoutAudienceModalProps) {
  const members = useMultiplayerStore((state) => state.members);

  // Filtra apenas membros com papel de jogador (ou todos menos o mestre se aplicável)
  const playerMembers = useMemo(() => {
    return members.filter((m) => m.role === 'player');
  }, [members]);

  // Inicializa a seleção:
  // Se for mode === 'share', podemos começar com quem já tem o handout compartilhado
  const initialSelected = useMemo(() => {
    if (mode === 'share' && item.sharedWithPlayerNames && item.sharedWithPlayerNames.length > 0) {
      return item.sharedWithPlayerNames;
    }
    return [];
  }, [mode, item.sharedWithPlayerNames]);

  const [audienceType, setAudienceType] = useState<'all' | 'custom'>(() => {
    if (mode === 'share' && item.isSharedWithPlayers && item.sharedWithPlayerNames && item.sharedWithPlayerNames.length > 0) {
      return 'custom';
    }
    return 'all';
  });

  const [selectedNames, setSelectedNames] = useState<string[]>(initialSelected);
  const [customInputName, setCustomInputName] = useState('');

  if (!isOpen) return null;

  // Unifica todos os nomes disponíveis (jogadores conectados + nomes previamente salvos)
  const allKnownPlayerNames = Array.from(
    new Set([
      ...playerMembers.map((m) => m.name),
      ...selectedNames,
      ...(item.sharedWithPlayerNames || []),
    ]),
  ).filter(Boolean);

  const handleToggleName = (name: string) => {
    setSelectedNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const handleSelectAll = () => {
    setSelectedNames(allKnownPlayerNames);
  };

  const handleDeselectAll = () => {
    setSelectedNames([]);
  };

  const handleAddCustomName = () => {
    const trimmed = customInputName.trim();
    if (!trimmed) return;
    if (!selectedNames.includes(trimmed)) {
      setSelectedNames((prev) => [...prev, trimmed]);
    }
    setCustomInputName('');
  };

  const handleConfirm = () => {
    if (audienceType === 'all') {
      onConfirm(null); // null = todos os jogadores
    } else {
      // Se não selecionou ninguém no custom, avisar ou selecionar vazio
      onConfirm(selectedNames);
    }
    onClose();
  };

  const isProjectMode = mode === 'project';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#18181b] border border-[#323238] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#e1e1e6]"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a] bg-[#1c1c20]">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isProjectMode
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isProjectMode ? (
                <Tv className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{isProjectMode ? 'Projetar na Tela' : 'Revelar Handout'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#27272a] text-[#a1a1aa] border border-white/5">
                  {item.type.toUpperCase()}
                </span>
              </h3>
              <p className="text-xs text-[#a1a1aa] truncate max-w-xs sm:max-w-sm mt-0.5" title={item.title}>
                {item.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-white/10 transition-colors"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* Mensagem explicativa */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#202024] border border-[#2e2e34] text-xs text-[#d4d4d8]">
            <Info className="w-4 h-4 text-[#8257e5] shrink-0 mt-0.5" />
            <div>
              {isProjectMode ? (
                <p>
                  Transmita este handout na tela dos jogadores selecionados.
                </p>
              ) : (
                <p>
                  Disponibilize este handout na visualização dos jogadores selecionados.
                </p>
              )}
            </div>
          </div>

          {/* Opções de Audiência: Todos vs Selecionados */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              Destinatários
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Opção 1: Todos */}
              <button
                type="button"
                onClick={() => setAudienceType('all')}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  audienceType === 'all'
                    ? isProjectMode
                      ? 'bg-purple-950/40 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/50'
                      : 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50'
                    : 'bg-[#202024] border-[#2e2e34] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white'
                }`}
              >
                <div
                  className={`p-1.5 rounded-md mt-0.5 shrink-0 ${
                    audienceType === 'all'
                      ? isProjectMode
                        ? 'bg-purple-600 text-white'
                        : 'bg-emerald-600 text-white'
                      : 'bg-[#18181b] text-[#71717a]'
                  }`}
                >
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Todos os Jogadores</h4>
                  <p className="text-[11px] text-[#a1a1aa] mt-0.5 leading-snug">
                    Toda a mesa
                  </p>
                </div>
              </button>

              {/* Opção 2: Jogadores Selecionados */}
              <button
                type="button"
                onClick={() => setAudienceType('custom')}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  audienceType === 'custom'
                    ? isProjectMode
                      ? 'bg-purple-950/40 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/50'
                      : 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50'
                    : 'bg-[#202024] border-[#2e2e34] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white'
                }`}
              >
                <div
                  className={`p-1.5 rounded-md mt-0.5 shrink-0 ${
                    audienceType === 'custom'
                      ? isProjectMode
                        ? 'bg-purple-600 text-white'
                        : 'bg-emerald-600 text-white'
                      : 'bg-[#18181b] text-[#71717a]'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Jogadores Selecionados</h4>
                  <p className="text-[11px] text-[#a1a1aa] mt-0.5 leading-snug">
                    Pessoas selecionadas
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Lista de Seleção de Jogadores */}
          {audienceType === 'custom' && (
            <div className="flex flex-col gap-2.5 pt-2 border-t border-[#27272a] animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>Selecione os participantes</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#27272a] text-[#8257e5] font-mono">
                    {selectedNames.length} selecionados
                  </span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] text-[#8257e5] hover:text-purple-300 transition-colors"
                  >
                    Marcar todos
                  </button>
                  <span className="text-[#3f3f46] text-xs">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-[11px] text-[#71717a] hover:text-white transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {/* Lista dos jogadores */}
              <div className="flex flex-col gap-1.5 bg-[#121214] p-2 rounded-lg border border-[#27272a] max-h-48 overflow-y-auto">
                {allKnownPlayerNames.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[#71717a]">
                    Nenhum jogador conectado na sala ainda. Digite os nomes dos jogadores abaixo para configurar a audiência.
                  </div>
                ) : (
                  allKnownPlayerNames.map((name) => {
                    const member = playerMembers.find((m) => m.name === name);
                    const isSelected = selectedNames.includes(name);
                    const isOnline = member?.isOnline !== false && Boolean(member);

                    return (
                      <div
                        key={name}
                        onClick={() => handleToggleName(name)}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-all ${
                          isSelected
                            ? isProjectMode
                              ? 'bg-purple-900/30 border border-purple-500/40 text-white'
                              : 'bg-emerald-900/30 border border-emerald-500/40 text-white'
                            : 'bg-[#18181b] hover:bg-[#202024] border border-transparent text-[#a1a1aa]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Checkbox visual */}
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                              isSelected
                                ? isProjectMode
                                  ? 'bg-purple-600 border-purple-500 text-white'
                                  : 'bg-emerald-600 border-emerald-500 text-white'
                                : 'border-[#3f3f46] bg-[#121214]'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          {/* Avatar Circle */}
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm"
                            style={{
                              backgroundColor: member?.color || '#8257e5',
                            }}
                          >
                            {name.charAt(0).toUpperCase()}
                          </div>

                          {/* Nome do Jogador */}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold truncate text-[#f4f4f5]">
                              {name}
                            </span>
                          </div>
                        </div>

                        {/* Status Online/Offline */}
                        <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                          {isOnline ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
                              <span>Online</span>
                            </span>
                          ) : (
                            <span className="text-[#71717a]">Offline</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Campo para adicionar nome personalizado / personagem */}
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  placeholder="Adicionar jogador ou personagem..."
                  value={customInputName}
                  onChange={(e) => setCustomInputName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomName();
                    }
                  }}
                  className="flex-1 bg-[#121214] border border-[#27272a] rounded px-3 py-1.5 text-xs text-white placeholder-[#71717a] outline-none focus:border-[#8257e5] transition-colors"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleAddCustomName}
                  disabled={!customInputName.trim()}
                  className="h-7 px-2.5 gap-1 bg-[#202024] border-[#323238] hover:bg-white/10 text-[#e1e1e6]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#27272a] bg-[#1c1c20]">
          <div>
            {!isProjectMode && item.isSharedWithPlayers && onUnshare && (
              <button
                type="button"
                onClick={() => {
                  onUnshare();
                  onClose();
                }}
                className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ocultar de todos</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-[#202024] border-[#323238] hover:bg-white/10 text-[#d4d4d8] text-xs h-8"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={audienceType === 'custom' && selectedNames.length === 0}
              className={`text-xs h-8 gap-1.5 shadow-md font-semibold text-white ${
                isProjectMode
                  ? 'bg-purple-600 hover:bg-purple-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {isProjectMode ? (
                <>
                  <Tv className="w-3.5 h-3.5" />
                  <span>
                    {audienceType === 'all'
                      ? 'Projetar para Todos'
                      : 'Projetar Selecionados'}
                  </span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>
                    {audienceType === 'all'
                      ? 'Revelar para Todos'
                      : 'Revelar Selecionados'}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
