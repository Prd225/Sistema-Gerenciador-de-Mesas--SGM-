import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useModularSheetStore,
  BLANK_SHEET_DSL_TEMPLATE,
  type ModularSheetPresetChoice,
} from '@/store/useModularSheetStore';
import { useTokenStore } from '@/store/useTokenStore';
import { SHEET_DSL_PRESETS, compileSheetDSL } from '@/lib/sheet-dsl';
import { isPlayerMode } from '@/lib/roomRole';
import { timeAgo } from '@/lib/utils';
import {
  FileSpreadsheet,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Columns,
  Code2,
  Copy,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Users,
  Sparkles,
  Swords,
  FileCode,
  X,
  Layers,
  Palette,
} from 'lucide-react';
import { TokenAssignmentPopover } from './TokenAssignmentPopover';
import { VisualSheetView } from './VisualSheetView';
import { SHEET_THEMES, getThemeRootVars, type SheetTheme, type ThemeColors } from './theme';

const DSL_QUICK_SNIPPETS: Array<{ label: string; snippet: string }> = [
  {
    label: '+ @profile',
    snippet: `\n@profile "Nome" [col1, lg]\n  image: ""\n  archetype: "Classe"\n  level: 1\n  desc: "Descrição opcional"\n`,
  },
  {
    label: '+ @counter',
    snippet: `\n@counter [col2, segments]\n  acao_1 "Ação Especial": 2/3 [segments, amber]\n  acao_2 "Fôlego": 2/3        [dots, amber]\n  acao_3 "Relógio": 2/3       [pie, purple]\n`,
  },
  {
    label: '+ @tab',
    snippet: `\n@tab "Nova Aba"\n`,
  },
  {
    label: '+ @slots',
    snippet: `\n@slots "Inventário Rápido" [col2, cols: 3]\n  slot_1 "Espada": 3/3\n  slot_2 [state: empty]\n`,
  },
  {
    label: '+ @attr [list]',
    snippet: `\n@attr [col1, list]\n  Fisico "Físico"  := 4 [roll: "1d20 + self"]\n  Mental "Mental"  := 6 [roll: "1d20 + self"]\n  Emocao "Emoção"  := 4 [roll: "1d20 + self"]\n`,
  },
  {
    label: '+ @attr [pyramid]',
    snippet: `\n@attr [col1, pyramid]\n  AGI "Agilidade" := 4 [roll: "(self)d20kh1"]\n  FOR "Força"     := 2 [roll: "(self)d20kh1"]\n  INT "Intelecto" := 3 [roll: "(self)d20kh1"]\n`,
  },
  {
    label: '+ @stat',
    snippet: `\n@stat [col1]\n  DEF "Defesa" = 10 + DES\n`,
  },
  {
    label: '+ @res',
    snippet: `\n@res [col2]\n  PV "Vida": 20 / 20 [red]\n  PE "Esforço": 10 / 10 [amber]\n`,
  },
  {
    label: '+ @desc',
    snippet: `\n@desc [col1]\n  tag "Inspirado" [active: false] -> DEF += 2\n`,
  },
  {
    label: '+ @skill [full]',
    snippet: `\n@skill [full, list, roll: 1d20 + attr + self]\n  Percepcao (INT) := 2\n`,
  },
  {
    label: '+ @inv',
    snippet: `\n@inv [col1]\n  item "Poção" [weight: 1, qty: 2, !carried]\n`,
  },
  {
    label: '+ @ability',
    snippet: `\n@ability [col2]\n  ability "Golpe Poderoso" [type: "Livre", cost: 1 PE]\n    damage: 2d6\n    desc: "Adiciona dano extra ao ataque."\n`,
  },
];

const PRESET_CARDS: Array<{
  id: ModularSheetPresetChoice;
  title: string;
  systemBadge: string;
  subtitle: string;
  highlights: string[];
  accentCls: string;
  icon: React.ReactNode;
}> = [
    {
      id: 'ordem_paranormal',
      title: 'Ordem Paranormal',
      systemBadge: 'Preset Oficial 1',
      subtitle:
        'Parada de d20 (Keep Highest), Tag Roll explícita, Coldres & Bolsos Rápidos e PV/PE/SAN.',
      highlights: [
        '[roll: "(self)d20kh1"]',
        'Coldres & Bolsos (@slots)',
        'PV / PE / SAN Automatizados',
      ],
      accentCls:
        'border-[#8257e5] bg-[#8257e5]/15',
      icon: <Sparkles className="w-5 h-5 text-[#c4b5fd]" />,
    },
    {
      id: 'tormenta20',
      title: 'Tormenta 20',
      systemBadge: 'Preset Oficial 2',
      subtitle:
        'Sistema D20 com Metade do Nível automática, Pontos de Mana (PM), Aprimoramentos e Defesa.',
      highlights: [
        '1d20 + ½ Nível + Attr + Treino',
        'PV & PM por Nível',
        'Equipamentos com +DEF',
      ],
      accentCls:
        'border-amber-400 bg-amber-500/15',
      icon: <Swords className="w-5 h-5 text-amber-300" />,
    },
    {
      id: 'blank',
      title: 'Ficha Modular Livre (DSL)',
      systemBadge: 'Customizado',
      subtitle:
        'Esqueleto limpo em SGM-SDL com suporte a abas, slots Mausritter, dados e regras modulares.',
      highlights: ['100% Editável via Texto', 'Abas e Slots Modulares'],
      accentCls:
        'border-emerald-400 bg-emerald-500/15',
      icon: <FileCode className="w-5 h-5 text-emerald-300" />,
    },
  ];

function getPresetInitialDSL(presetId: ModularSheetPresetChoice): string {
  if (presetId === 'ordem_paranormal') {
    return SHEET_DSL_PRESETS.ordem_paranormal.source;
  }
  if (presetId === 'tormenta20') {
    return SHEET_DSL_PRESETS.tormenta20.source;
  }
  return BLANK_SHEET_DSL_TEMPLATE;
}

export default function ModularSheetsModal() {
  const isOpen = useModularSheetStore((s) => s.isOpen);
  const view = useModularSheetStore((s) => s.view);
  const activeSheetId = useModularSheetStore((s) => s.activeSheetId);
  const viewMode = useModularSheetStore((s) => s.viewMode);
  const sheets = useModularSheetStore((s) => s.sheets);

  const closeManager = useModularSheetStore((s) => s.closeManager);
  const setView = useModularSheetStore((s) => s.setView);
  const setViewMode = useModularSheetStore((s) => s.setViewMode);
  const openSheet = useModularSheetStore((s) => s.openSheet);
  const createSheet = useModularSheetStore((s) => s.createSheet);
  const updateSheetSource = useModularSheetStore((s) => s.updateSheetSource);
  const duplicateSheet = useModularSheetStore((s) => s.duplicateSheet);
  const deleteSheet = useModularSheetStore((s) => s.deleteSheet);
  const resetRuntimeOverrides = useModularSheetStore(
    (s) => s.resetRuntimeOverrides,
  );

  const tokens = useTokenStore((s) => s.tokens);

  // Estado da Aba "gerenciar fichas"
  const [listSearch, setListSearch] = useState('');

  // Estado da Aba "criar nova ficha"
  const [selectedPreset, setSelectedPreset] =
    useState<ModularSheetPresetChoice>('ordem_paranormal');
  const [newSheetName, setNewSheetName] = useState('');
  const [draftDsl, setDraftDsl] = useState<string>(() =>
    getPresetInitialDSL('ordem_paranormal'),
  );
  const [draftTokenIds, setDraftTokenIds] = useState<string[]>([]);

  // Estado da barra lateral de abas (Imagens 1 & 2)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('Principal');

  const activeSheet = useMemo(
    () => sheets.find((s) => s.id === activeSheetId) ?? null,
    [sheets, activeSheetId],
  );

  const compiledActiveSheet = useMemo(() => {
    if (!activeSheet) return null;
    return compileSheetDSL(
      activeSheet.dslSource,
      activeSheet.runtimeOverrides,
    );
  }, [activeSheet]);

  // Sincroniza aba selecionada com as abas da ficha ativa
  useEffect(() => {
    if (compiledActiveSheet) {
      const tabs = compiledActiveSheet.tabs;
      if (tabs.length > 0 && !tabs.some((t) => t.id === selectedTab)) {
        setSelectedTab(tabs[0].id);
      }
    }
  }, [compiledActiveSheet, selectedTab]);

  // Fecha com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeManager();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeManager]);

  if (!isOpen || isPlayerMode()) return null;

  const handleSelectPreset = (preset: ModularSheetPresetChoice) => {
    setSelectedPreset(preset);
    setDraftDsl(getPresetInitialDSL(preset));
  };

  const handleStartCreateView = () => {
    setSelectedPreset('ordem_paranormal');
    setNewSheetName('');
    setDraftDsl(getPresetInitialDSL('ordem_paranormal'));
    setDraftTokenIds([]);
    setView('create');
  };

  const handleConfirmCreate = () => {
    createSheet({
      name: newSheetName.trim() || undefined,
      presetId: selectedPreset,
      customDsl: draftDsl,
      assignTokenIds: draftTokenIds,
    });
    setViewMode('visual');
  };

  const toggleDraftToken = (tokenId: string) => {
    setDraftTokenIds((prev) =>
      prev.includes(tokenId)
        ? prev.filter((id) => id !== tokenId)
        : [...prev, tokenId],
    );
  };

  const handleAddNewTab = () => {
    if (!activeSheet) return;
    const tabNum = (compiledActiveSheet?.tabs.length ?? 0) + 1;
    const newTabName = `Aba ${tabNum}`;
    const newSnippet = `\n@tab "${newTabName}"\n// Adicione módulos desta aba aqui (@attr, @skill, @slots, etc.)\n`;
    updateSheetSource(activeSheet.id, `${activeSheet.dslSource.trimEnd()}\n${newSnippet}`);
    setSelectedTab(newTabName);
  };

  const filteredSheets = sheets.filter((s) => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.dslSource.toLowerCase().includes(q)
    );
  });

  const availableTabs = compiledActiveSheet?.tabs.length
    ? compiledActiveSheet.tabs
    : [{ id: 'Principal', label: 'Principal' }];

  const activeThemeId: SheetTheme = compiledActiveSheet?.meta.theme ?? 'purple';
  const currentTheme = SHEET_THEMES[activeThemeId] || SHEET_THEMES.purple;
  const themeVars = getThemeRootVars(activeThemeId);

  const handleChangeTheme = (themeId: SheetTheme) => {
    if (!activeSheet) return;
    let src = activeSheet.dslSource;
    const metaRegex = /(@meta\b[^\n]*)/i;
    if (metaRegex.test(src)) {
      src = src.replace(metaRegex, (headerLine) => {
        if (/theme\s*[:=]\s*"?[a-zA-Z_]+"?/i.test(headerLine)) {
          return headerLine.replace(/theme\s*[:=]\s*"?[a-zA-Z_]+"?/i, `theme: "${themeId}"`);
        }
        if (/tema\s*[:=]\s*"?[a-zA-Z_]+"?/i.test(headerLine)) {
          return headerLine.replace(/tema\s*[:=]\s*"?[a-zA-Z_]+"?/i, `theme: "${themeId}"`);
        }
        if (/cor\s*[:=]\s*"?[a-zA-Z_]+"?/i.test(headerLine)) {
          return headerLine.replace(/cor\s*[:=]\s*"?[a-zA-Z_]+"?/i, `theme: "${themeId}"`);
        }
        const bracketMatch = headerLine.match(/\[([^\]]*)\]/);
        if (bracketMatch) {
          const inner = bracketMatch[1].trim();
          const newInner = inner ? `${inner}, theme: "${themeId}"` : `theme: "${themeId}"`;
          return headerLine.replace(/\[[^\]]*\]/, `[${newInner}]`);
        }
        return `${headerLine} [theme: "${themeId}"]`;
      });
    } else {
      src = `@meta "${activeSheet.name}" [theme: "${themeId}"]\n\n${src}`;
    }
    updateSheetSource(activeSheet.id, src);
  };

  return (
    <div
      className="fixed inset-0 z-[100] text-[#e1e1e6] flex flex-col overflow-hidden animate-in fade-in duration-150 transition-colors"
      style={{
        backgroundColor: 'var(--sheet-bg)',
        ...themeVars,
      }}
    >
      {/* ====================================================================
          BARRA DE TOPO DA TELA CHEIA (FULLSCREEN HEADER)
         ==================================================================== */}
      <header
        className="h-14 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 select-none border-b transition-colors"
        style={{
          backgroundColor: 'var(--sheet-header-bg)',
          borderColor: 'var(--sheet-header-border)',
        }}
      >
        {view === 'sheet' && activeSheet && compiledActiveSheet ? (
          <div className="flex items-center gap-3 min-w-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setView('list')}
              className="h-8 px-2.5 border-[#323238] bg-[#121214] text-[#e1e1e6] hover:bg-white/10 gap-1.5 shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Fichas</span>
            </Button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[#ffd700] text-base font-black truncate">
                {activeSheet.name}
              </span>
              {compiledActiveSheet.meta.system && (
                <span className="px-2 py-0.5 rounded bg-[#8257e5]/25 border border-[#8257e5]/50 text-[#c4b5fd] text-[10px] font-bold uppercase shrink-0">
                  {compiledActiveSheet.meta.system}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ffd700]/10 border border-[#ffd700]/30 flex items-center justify-center text-[#ffd700]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-white text-sm font-extrabold flex items-center gap-2">
                Gerenciador de Fichas Modulares
                <span className="text-[10px] font-mono text-[#8d8d99] font-normal">
                  (SGM-SDL)
                </span>
              </h1>
            </div>
          </div>
        )}

        {/* CONTROLES CENTRAIS / DIREITOS DO HEADER */}
        <div className="flex items-center gap-2">
          {view === 'sheet' && activeSheet ? (
            <>
              {/* Botão de atribuir Tokens */}
              <TokenAssignmentPopover
                sheetId={activeSheet.id}
                assignedTokenIds={activeSheet.assignedTokenIds}
              />

              {/* Seletor Rápido de Tema de Cores */}
              <div className="hidden sm:flex items-center gap-1 rounded-lg border border-[#323238] bg-[#121214] px-2 py-1">
                <Palette className="w-3.5 h-3.5 text-zinc-400 mr-1 shrink-0" />
                {(Object.values(SHEET_THEMES) as ThemeColors[]).map((t) => {
                  const isCurrent = (compiledActiveSheet?.meta.theme ?? 'purple') === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleChangeTheme(t.id)}
                      className={`w-4 h-4 rounded-full transition-all ${
                        isCurrent
                          ? 'scale-125 ring-2 ring-white shadow-md'
                          : 'opacity-50 hover:opacity-100 hover:scale-110'
                      }`}
                      style={{ backgroundColor: t.dotColor }}
                      title={`Tema: ${t.name}`}
                    />
                  );
                })}
              </div>

              {/* Seletor de Modo: Visual | Dividido | DSL */}
              <div className="inline-flex rounded-lg border border-[#323238] bg-[#121214] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('visual')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-colors ${
                    viewMode === 'visual'
                      ? currentTheme.buttonActive
                      : 'text-[#a8a8b3] hover:text-white'
                  }`}
                  title="Visualizar a Ficha Automatizada"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Visual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-colors ${
                    viewMode === 'split'
                      ? currentTheme.buttonActive
                      : 'text-[#a8a8b3] hover:text-white'
                  }`}
                  title="Editar DSL ao lado da Ficha Visual"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Dividido</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('code')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-colors ${
                    viewMode === 'code'
                      ? currentTheme.buttonActive
                      : 'text-[#a8a8b3] hover:text-white'
                  }`}
                  title="Editar código-fonte SGM-SDL"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">DSL</span>
                </button>
              </div>

              {/* Restaurar Overrides */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (
                    window.confirm(
                      'Deseja restaurar todos os recursos gastos e slots desta ficha para os valores iniciais da DSL?',
                    )
                  ) {
                    resetRuntimeOverrides(activeSheet.id);
                  }
                }}
                className="h-8 px-2.5 border-[#323238] bg-[#121214] text-[#a8a8b3] hover:text-white text-xs gap-1"
                title="Restaurar valores originais"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Restaurar</span>
              </Button>
            </>
          ) : (
            <div className="inline-flex rounded-lg border border-[#323238] bg-[#121214] p-0.5">
              <button
                type="button"
                onClick={() => setView('list')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${view === 'list'
                    ? 'bg-[#8257e5] text-white'
                    : 'text-[#a8a8b3] hover:text-white'
                  }`}
              >
                Fichas ({sheets.length})
              </button>
              <button
                type="button"
                onClick={handleStartCreateView}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-bold transition-colors ${view === 'create'
                    ? 'bg-[#8257e5] text-white'
                    : 'text-[#a8a8b3] hover:text-white'
                  }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Ficha
              </button>
            </div>
          )}

          {/* BOTÃO DE FECHAR TELA CHEIA */}
          <button
            type="button"
            onClick={closeManager}
            title="Fechar (Esc)"
            className="w-8 h-8 rounded-lg bg-[#202024] hover:bg-rose-600/80 border border-[#323238] hover:border-rose-500 text-[#a8a8b3] hover:text-white flex items-center justify-center transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ====================================================================
          CORPO PRINCIPAL (LISTA | CRIAR | FICHA EM TELA CHEIA)
         ==================================================================== */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {/* ------------------------------------------------------------------
            1. LISTA DE FICHAS DA MESA
           ------------------------------------------------------------------ */}
        {view === 'list' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[260px] max-w-md">
                <Search className="w-4 h-4 text-[#8d8d99] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Buscar ficha por nome ou sistema..."
                  className="h-10 pl-9 text-xs bg-[#18181b] border-[#323238] text-[#e1e1e6]"
                />
              </div>

              <Button
                type="button"
                onClick={handleStartCreateView}
                className="h-10 bg-[#8257e5] hover:bg-[#9466ff] text-white font-bold text-xs gap-2 px-4 shadow-lg shadow-[#8257e5]/20"
              >
                <Plus className="w-4 h-4" />
                Criar Nova Ficha
              </Button>
            </div>

            {filteredSheets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#323238] bg-[#18181b]/50 p-12 text-center space-y-4">
                <FileSpreadsheet className="w-12 h-12 text-[#71717a] mx-auto stroke-[1.2]" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    Nenhuma Ficha Encontrada
                  </h3>
                  <p className="text-xs text-[#8d8d99] max-w-sm mx-auto">
                    Crie sua primeira ficha modular usando presets prontos (Ordem, Tormenta) ou texto livre SGM-SDL.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleStartCreateView}
                  className="bg-[#8257e5] hover:bg-[#9466ff] text-white font-bold text-xs gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Criar Ficha com Preset
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSheets.map((sheetRec) => {
                  const assignedTokens = tokens.filter((t) =>
                    sheetRec.assignedTokenIds.includes(t.id),
                  );

                  return (
                    <div
                      key={sheetRec.id}
                      className="group rounded-2xl border border-[#29292e] bg-[#18181b] hover:border-[#8257e5]/60 hover:bg-[#1a1923] p-4 flex flex-col justify-between transition-all shadow-md space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-extrabold text-white text-base truncate group-hover:text-[#c4b5fd] transition-colors">
                            {sheetRec.name}
                          </h4>
                          <span className="text-[10px] font-mono text-[#71717a] shrink-0">
                            {timeAgo(sheetRec.updatedAt)}
                          </span>
                        </div>

                        {/* Tokens Vinculados */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#8d8d99]">
                          <Users className="w-3.5 h-3.5 text-[#a78bfa]" />
                          {assignedTokens.length > 0 ? (
                            <span>
                              {assignedTokens.length} token(s):{' '}
                              <strong className="text-[#e1e1e6]">
                                {assignedTokens.map((t) => t.name).join(', ')}
                              </strong>
                            </span>
                          ) : (
                            <span className="italic text-[#71717a]">
                              Nenhum token vinculado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botões de Ação do Card */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#29292e]">
                        <Button
                          type="button"
                          onClick={() => openSheet(sheetRec.id)}
                          className="h-8 bg-[#8257e5] hover:bg-[#9466ff] text-white text-xs font-bold gap-1.5 px-3"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Abrir Ficha
                        </Button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => duplicateSheet(sheetRec.id)}
                            title="Duplicar ficha"
                            className="p-1.5 rounded hover:bg-[#202024] text-[#8d8d99] hover:text-white transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Deseja apagar a ficha "${sheetRec.name}"?`)) {
                                deleteSheet(sheetRec.id);
                              }
                            }}
                            title="Excluir ficha"
                            className="p-1.5 rounded hover:bg-rose-500/20 text-[#8d8d99] hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------
            2. INTERFACE PARA CRIAR UMA FICHA NOVA COM PRESETS
           ------------------------------------------------------------------ */}
        {view === 'create' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Criar Nova Ficha Modular</h3>
                <p className="text-xs text-[#8d8d99]">
                  Selecione um preset oficial ou inicie uma ficha customizada com SGM-SDL.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setView('list')}
                className="border-[#323238] bg-[#18181b] text-[#e1e1e6]"
              >
                Voltar à Lista
              </Button>
            </div>

            {/* Nome da Ficha */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#a8a8b3]">
                Nome do Personagem / Ficha:
              </label>
              <Input
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                placeholder="Ex: Arthur Cervero, Valeros..."
                className="h-10 text-sm bg-[#18181b] border-[#323238] text-white"
              />
            </div>

            {/* Cards de Seleção de Preset */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-[#a8a8b3]">
                Escolha o Modelo de Sistema:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PRESET_CARDS.map((card) => {
                  const isSelected = selectedPreset === card.id;
                  return (
                    <div
                      key={card.id}
                      onClick={() => handleSelectPreset(card.id)}
                      className={`cursor-pointer rounded-2xl border-2 p-4 flex flex-col justify-between transition-all ${isSelected
                          ? `${card.accentCls} scale-[1.01]`
                          : 'border-[#29292e] bg-[#18181b] hover:border-[#3f3f46]'
                        }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="p-2 rounded-xl bg-[#121214] border border-[#29292e]">
                            {card.icon}
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#121214] text-[#a8a8b3] border border-[#29292e]">
                            {card.systemBadge}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-white text-sm">{card.title}</h4>
                          <p className="text-[11px] text-[#8d8d99] mt-1 leading-snug">
                            {card.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/5 space-y-1">
                        {card.highlights.map((h, i) => (
                          <div key={i} className="text-[10px] text-[#a78bfa] font-mono flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-[#a78bfa]" />
                            {h}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Atribuir Tokens Imediatamente */}
            {tokens.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[#a8a8b3]">
                  Vincular a Tokens na Mesa (Opcional):
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[#18181b] border border-[#29292e]">
                  {tokens.map((token) => {
                    const isAssigned = draftTokenIds.includes(token.id);
                    return (
                      <button
                        key={token.id}
                        type="button"
                        onClick={() => toggleDraftToken(token.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-colors ${isAssigned
                            ? 'border-[#8257e5] bg-[#8257e5]/20 text-[#c4b5fd]'
                            : 'border-[#323238] bg-[#121214] text-[#8d8d99] hover:text-white'
                          }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: token.colorFill || token.colorBorder || '#8257e5' }}
                        />
                        {token.fullName || token.name}
                        {isAssigned && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botão de Criar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#29292e]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setView('list')}
                className="border-[#323238] bg-transparent text-[#a8a8b3] hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmCreate}
                className="h-10 bg-[#8257e5] hover:bg-[#9466ff] text-white font-bold gap-2 px-6 shadow-lg shadow-[#8257e5]/20"
              >
                <Plus className="w-4 h-4" />
                Criar e Abrir Ficha
              </Button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            3. INTERFACE DA FICHA ABERTA COM ABAS LATERAIS RETRÁTEIS
               (IMAGENS 1 & 2 DE REFERÊNCIA VISUAL DO USUÁRIO)
           ------------------------------------------------------------------ */}
        {view === 'sheet' && activeSheet && compiledActiveSheet && (
          <div className="flex-1 min-h-0 flex overflow-hidden">
            {/* BARRA LATERAL RETRÁTIL DE ABAS VERTICAIS À ESQUERDA (IMAGEM 1) */}
            <aside
              className={`border-r flex flex-col justify-between shrink-0 transition-all duration-200 z-10 ${
                isSidebarCollapsed ? 'w-12' : 'w-44 sm:w-48'
              }`}
              style={{
                backgroundColor: 'var(--sheet-sidebar-bg)',
                borderColor: 'var(--sheet-sidebar-border)',
              }}
            >
              {/* Cabeçalho da Barra Lateral com Toggle Embutido (Sem corte/sobreposição) */}
              <div
                className="flex items-center justify-between p-2 border-b shrink-0 transition-colors"
                style={{ borderColor: 'var(--sheet-sidebar-border)' }}
              >
                {!isSidebarCollapsed && (
                  <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 truncate">
                    <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Abas</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  title={isSidebarCollapsed ? 'Expandir abas' : 'Recolher abas'}
                  className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors ml-auto flex items-center justify-center shrink-0"
                >
                  {isSidebarCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronLeft className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Lista Vertical de Abas */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {availableTabs.map((tab) => {
                  const isActive = selectedTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedTab(tab.id)}
                      title={tab.label}
                      className={`w-full rounded-xl px-3 py-2.5 text-xs font-extrabold flex items-center transition-all ${
                        isSidebarCollapsed ? 'justify-center' : 'justify-start gap-2'
                      } ${
                        isActive
                          ? currentTheme.tabActive
                          : 'text-[#a8a8b3] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Layers className="w-4 h-4 shrink-0" />
                      {!isSidebarCollapsed && (
                        <span className="truncate uppercase tracking-wide">
                          {tab.label}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Botão [+] para Adicionar Nova Aba */}
                <button
                  type="button"
                  onClick={handleAddNewTab}
                  title="Adicionar nova aba"
                  className={`w-full rounded-xl border border-dashed hover:bg-white/5 text-[#71717a] hover:text-white px-3 py-2 text-xs font-bold flex items-center justify-center transition-colors ${
                    isSidebarCollapsed ? 'h-10' : 'gap-1.5'
                  }`}
                  style={{
                    borderColor: 'var(--sheet-card-border)',
                  }}
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Nova Aba</span>}
                </button>
              </div>
            </aside>

            {/* MIOLO CENTRAL: DIVIDIDO OU VISUAL OU DSL */}
            <div
              className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden transition-colors"
              style={{ backgroundColor: 'var(--sheet-bg)' }}
            >
              {/* Painel do Editor DSL (se em modo split ou code) */}
              {(viewMode === 'split' || viewMode === 'code') && (
                <div
                  className={`flex flex-col min-h-0 ${viewMode === 'split'
                      ? 'lg:w-[45%] border-b lg:border-b-0 lg:border-r h-1/2 lg:h-full'
                      : 'w-full h-full'
                    }`}
                  style={{
                    backgroundColor: 'var(--sheet-code-bg)',
                    borderColor: 'var(--sheet-card-border)',
                  }}
                >
                  {/* Atalhos Rápidos da DSL */}
                  <div
                    className="px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 transition-colors"
                    style={{
                      backgroundColor: 'var(--sheet-sidebar-bg)',
                      borderColor: 'var(--sheet-card-border)',
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-1">
                      {DSL_QUICK_SNIPPETS.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() =>
                            updateSheetSource(
                              activeSheet.id,
                              `${activeSheet.dslSource.trimEnd()}\n${item.snippet}`,
                            )
                          }
                          className="px-2 py-0.5 rounded border text-[10px] font-mono font-bold hover:brightness-125 transition-all"
                          style={{
                            backgroundColor: 'var(--sheet-item-bg)',
                            borderColor: 'var(--sheet-item-border)',
                            color: 'var(--sheet-accent-text)',
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold ${compiledActiveSheet.diagnostics.length === 0
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                        }`}
                    >
                      {compiledActiveSheet.diagnostics.length === 0
                        ? '● Compilado OK'
                        : `▲ ${compiledActiveSheet.diagnostics.length} aviso(s)`}
                    </span>
                  </div>

                  <textarea
                    value={activeSheet.dslSource}
                    onChange={(e) =>
                      updateSheetSource(activeSheet.id, e.target.value)
                    }
                    spellCheck={false}
                    className="flex-1 w-full p-4 text-xs font-mono leading-relaxed text-[#e1e1e6] focus:outline-none resize-none overflow-y-auto transition-colors"
                    style={{ backgroundColor: 'var(--sheet-code-bg)' }}
                    placeholder="Escreva a definição da ficha modular em SGM-SDL..."
                  />
                </div>
              )}

              {/* Painel Central Visual (4 Quadrantes conforme Imagens 1 & 2) */}
              {(viewMode === 'visual' || viewMode === 'split') && (
                <div
                  className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 transition-colors ${viewMode === 'split' ? 'h-1/2 lg:h-full' : 'h-full'
                    }`}
                  style={{ backgroundColor: 'var(--sheet-bg)' }}
                >
                  <VisualSheetView
                    sheetId={activeSheet.id}
                    sheet={compiledActiveSheet}
                    activeTab={selectedTab}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
