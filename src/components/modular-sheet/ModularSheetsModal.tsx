import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useModularSheetStore,
  BLANK_SHEET_DSL_TEMPLATE,
  getCombinedSheetSource,
  getSheetPages,
  type ModularSheetPresetChoice,
} from '@/store/useModularSheetStore';
import { useTokenStore } from '@/store/useTokenStore';
import { useDiceTrayStore } from '@/store/useDiceTrayStore';
import { SHEET_DSL_PRESETS, compileSheetDSL } from '@/lib/sheet-dsl';
import { isPlayerMode } from '@/lib/roomRole';
import { timeAgo } from '@/lib/utils';
import {
  FileSpreadsheet,
  Plus,
  Search,
  ChevronLeft,
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
  Palette,
  SlidersHorizontal,
} from 'lucide-react';
import { TokenAssignmentPopover } from './TokenAssignmentPopover';
import { VisualSheetView } from './VisualSheetView';
import { SheetDSLEditor } from './SheetDSLEditor';
import { SHEET_THEMES, getThemeRootVars, type SheetTheme, type ThemeColors } from './theme';

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
      id: 'mausritter',
      title: 'Mausritter',
      systemBadge: 'Preset Oficial 3',
      subtitle:
        'Espadas & Bigodes: d20 Roll-Under, Grade Física de Slots (Patas, Corpo, Mochila) e Mercenários.',
      highlights: [
        'Roll-Under (1d20 <= Attr)',
        'Slots Físicos & Condições',
        'Abas: Aventureiro, Inventário, Mercenários',
      ],
      accentCls:
        'border-amber-400 bg-amber-500/15',
      icon: <Sparkles className="w-5 h-5 text-amber-300" />,
    },
    {
      id: 'blank',
      title: 'Ficha Modular Livre',
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
  if (presetId === 'mausritter') {
    return SHEET_DSL_PRESETS.mausritter.source;
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
  const updateSheetPageContent = useModularSheetStore((s) => s.updateSheetPageContent);
  const addSheetPage = useModularSheetStore((s) => s.addSheetPage);
  const removeSheetPage = useModularSheetStore((s) => s.removeSheetPage);
  const renameSheetPage = useModularSheetStore((s) => s.renameSheetPage);
  const setActiveSheetPage = useModularSheetStore((s) => s.setActiveSheetPage);
  const duplicateSheet = useModularSheetStore((s) => s.duplicateSheet);
  const deleteSheet = useModularSheetStore((s) => s.deleteSheet);
  const resetRuntimeOverrides = useModularSheetStore(
    (s) => s.resetRuntimeOverrides,
  );

  const tokens = useTokenStore((s) => s.tokens);

  // Detecção de viewport mobile / retrato
  const [viewport, setViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return { isMobile: false, isLandscape: false, isMobilePortrait: false };
    }
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const isSmallHeight = window.innerHeight < 600;
    const isSmallWidth = window.innerWidth < 768;
    const isMobileLandscape = window.innerHeight <= 520 && window.innerWidth < 1024;
    const isMobileDevice =
      isSmallHeight || isSmallWidth || isMobileLandscape || (isTouch && window.innerWidth < 1024);
    const isLandscape = window.innerWidth > window.innerHeight;
    const isMobilePortrait = isMobileDevice && !isLandscape;
    return { isMobile: isMobileDevice, isLandscape, isMobilePortrait };
  });

  useEffect(() => {
    const handleResize = () => {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const isSmallHeight = window.innerHeight < 600;
      const isSmallWidth = window.innerWidth < 768;
      const isMobileLandscape = window.innerHeight <= 520 && window.innerWidth < 1024;
      const isMobileDevice =
        isSmallHeight || isSmallWidth || isMobileLandscape || (isTouch && window.innerWidth < 1024);
      const isLandscape = window.innerWidth > window.innerHeight;
      const isMobilePortrait = isMobileDevice && !isLandscape;
      setViewport({ isMobile: isMobileDevice, isLandscape, isMobilePortrait });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // No mobile retrato, desativa automaticamente a visualização dividida (apenas Visual ou DSL)
  useEffect(() => {
    if (viewport.isMobilePortrait && viewMode === 'split') {
      setViewMode('visual');
    }
  }, [viewport.isMobilePortrait, viewMode, setViewMode]);

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

  const [selectedTab, setSelectedTab] = useState<string>('Principal');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const activeSheet = useMemo(
    () => sheets.find((s) => s.id === activeSheetId) ?? null,
    [sheets, activeSheetId],
  );

  const sheetPages = useMemo(() => {
    if (!activeSheet) return [];
    return getSheetPages(activeSheet);
  }, [activeSheet]);

  const activePage = useMemo(() => {
    if (!sheetPages || sheetPages.length === 0) {
      return { id: 'page_main', name: 'Principal', content: activeSheet?.dslSource || '' };
    }
    const found = sheetPages.find((p) => p.id === activeSheet?.activePageId);
    return found || sheetPages[0];
  }, [sheetPages, activeSheet?.activePageId, activeSheet?.dslSource]);

  const compiledActiveSheet = useMemo(() => {
    if (!activeSheet) return null;
    const fullSource = getCombinedSheetSource(activeSheet);
    return compileSheetDSL(
      fullSource,
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

  // Fecha com a tecla Escape (se a bandeja de dados estiver aberta sobre a ficha, fecha a bandeja primeiro)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        const trayState = useDiceTrayStore.getState();
        if (trayState.isOpen) {
          trayState.setIsOpen(false);
          return;
        }
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
  const customThemeColors = compiledActiveSheet?.meta.customThemeColors;
  const themeVars = getThemeRootVars(activeThemeId, customThemeColors);

  const handleChangeTheme = (themeId: SheetTheme) => {
    if (!activeSheet) return;
    let src = activeSheet.dslSource;
    const metaRegex = /(@(?:meta|tema|theme|cores|palette|config)\b[^\n]*)/i;
    if (metaRegex.test(src)) {
      src = src.replace(metaRegex, (headerLine) => {
        let updated = headerLine.replace(/,?\s*(?:cor|color|accent|hex)\s*[:=]\s*"?#[0-9a-fA-F]{3,8}"?/gi, '');
        if (/theme\s*[:=]\s*"?[a-zA-Z0-9_#]+"?/i.test(updated)) {
          return updated.replace(/theme\s*[:=]\s*"?[a-zA-Z0-9_#]+"?/i, `theme: "${themeId}"`);
        }
        if (/tema\s*[:=]\s*"?[a-zA-Z0-9_#]+"?/i.test(updated)) {
          return updated.replace(/tema\s*[:=]\s*"?[a-zA-Z0-9_#]+"?/i, `theme: "${themeId}"`);
        }
        if (/cor\s*[:=]\s*"?[a-zA-Z0-9_#]+"?/i.test(updated)) {
          return updated.replace(/cor\s*[:=]\s*"?[a-zA-Z0-9_#]+"?/i, `theme: "${themeId}"`);
        }
        const bracketMatch = updated.match(/\[([^\]]*)\]/);
        if (bracketMatch) {
          const inner = bracketMatch[1].trim().replace(/^,|,$/g, '').trim();
          const newInner = inner ? `${inner}, theme: "${themeId}"` : `theme: "${themeId}"`;
          return updated.replace(/\[[^\]]*\]/, `[${newInner}]`);
        }
        return `${updated} [theme: "${themeId}"]`;
      });
    } else {
      src = `@meta "${activeSheet.name}" [theme: "${themeId}"]\n\n${src}`;
    }
    updateSheetSource(activeSheet.id, src);
  };

  const handleChangeCustomHex = (hex: string) => {
    if (!activeSheet) return;
    let src = activeSheet.dslSource;
    const metaRegex = /(@(?:meta|tema|theme|cores|palette|config)\b[^\n]*)/i;
    if (metaRegex.test(src)) {
      src = src.replace(metaRegex, (headerLine) => {
        if (/(?:cor|color|accent|hex)\s*[:=]\s*"?#[0-9a-fA-F]{3,8}"?/i.test(headerLine)) {
          return headerLine.replace(/(?:cor|color|accent|hex)\s*[:=]\s*"?#[0-9a-fA-F]{3,8}"?/i, `cor: "${hex}"`);
        }
        const bracketMatch = headerLine.match(/\[([^\]]*)\]/);
        if (bracketMatch) {
          const inner = bracketMatch[1].trim();
          const newInner = inner ? `${inner}, cor: "${hex}"` : `cor: "${hex}"`;
          return headerLine.replace(/\[[^\]]*\]/, `[${newInner}]`);
        }
        return `${headerLine} [cor: "${hex}"]`;
      });
    } else {
      src = `@meta "${activeSheet.name}" [cor: "${hex}"]\n\n${src}`;
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
        className={`px-3 sm:px-6 flex items-center justify-between gap-2 shrink-0 select-none border-b transition-colors ${
          viewport.isMobilePortrait ? 'h-12' : 'h-14'
        }`}
        style={{
          backgroundColor: 'var(--sheet-header-bg)',
          borderColor: 'var(--sheet-header-border)',
        }}
      >
        {view === 'sheet' && activeSheet && compiledActiveSheet ? (
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setView('list')}
              className={`${
                viewport.isMobilePortrait ? 'h-7 px-1.5' : 'h-8 px-2 sm:px-2.5'
              } border-[#323238] bg-[#121214] text-[#e1e1e6] hover:bg-white/10 gap-1 shrink-0`}
              title="Voltar à lista de fichas"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Fichas</span>
            </Button>

            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-[#ffd700] text-xs sm:text-base font-black truncate max-w-[110px] sm:max-w-xs">
                {activeSheet.name}
              </span>
              {compiledActiveSheet.meta.system && !viewport.isMobilePortrait && (
                <span className="px-2 py-0.5 rounded bg-[#8257e5]/25 border border-[#8257e5]/50 text-[#c4b5fd] text-[10px] font-bold uppercase shrink-0">
                  {compiledActiveSheet.meta.system}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#ffd700]/10 border border-[#ffd700]/30 flex items-center justify-center text-[#ffd700] shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-white text-xs sm:text-sm font-extrabold flex items-center gap-2">
                Gerenciador de Fichas Modulares
                <span className="text-[10px] font-mono text-[#8d8d99] font-normal hidden sm:inline">
                  SGM-SDL
                </span>
              </h1>
            </div>
          </div>
        )}

        {/* CONTROLES CENTRAIS / DIREITOS DO HEADER */}
        <div className="flex items-center gap-1.5 shrink-0">
          {view === 'sheet' && activeSheet ? (
            <>
              {/* No Desktop/Landscape, exibe controles avançados diretamente no topo */}
              {!viewport.isMobilePortrait && (
                <>
                  {/* Botão de atribuir Tokens */}
                  <TokenAssignmentPopover
                    sheetId={activeSheet.id}
                    assignedTokenIds={activeSheet.assignedTokenIds}
                  />

                  {/* Seletor Rápido de Tema de Cores + Código Hexadecimal */}
                  <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[#323238] bg-[#121214] px-2 py-1">
                    <Palette className="w-3.5 h-3.5 text-zinc-400 mr-0.5 shrink-0" />
                    {(Object.values(SHEET_THEMES) as ThemeColors[]).map((t) => {
                      const isCurrent =
                        !customThemeColors?.accent &&
                        (compiledActiveSheet?.meta.theme ?? 'purple') === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleChangeTheme(t.id)}
                          className={`w-3.5 h-3.5 rounded-full transition-transform ${
                            isCurrent
                              ? 'scale-110 border border-white'
                              : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: t.dotColor }}
                          title={`Tema: ${t.name}`}
                        />
                      );
                    })}
                    <div className="h-3.5 w-px bg-[#29292e] mx-0.5" />
                    <label
                      className="relative flex items-center gap-1 cursor-pointer text-[10px] font-mono text-zinc-300 hover:text-white px-1 py-0.5 rounded bg-[#18181b] border border-[#29292e]"
                      title="Cor hexadecimal personalizada da ficha (@meta [cor: '#hex'])"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/30 shrink-0"
                        style={{
                          backgroundColor:
                            customThemeColors?.accent || currentTheme.dotColor,
                        }}
                      />
                      <span>
                        {customThemeColors?.accent
                          ? customThemeColors.accent.toUpperCase()
                          : 'HEX'}
                      </span>
                      <input
                        type="color"
                        value={customThemeColors?.accent || currentTheme.dotColor}
                        onChange={(e) => handleChangeCustomHex(e.target.value)}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  {/* Botão de Modo de Edição Visual / Personalização de Módulos */}
                  <button
                    type="button"
                    onClick={() => setIsEditMode((v) => !v)}
                    className={`h-8 px-2.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      isEditMode
                        ? 'border-[var(--sheet-accent)] bg-[var(--sheet-accent)] text-white'
                        : 'border-[#323238] bg-[#121214] text-[#a8a8b3] hover:text-white'
                    }`}
                    title="Alternar modo de edição e personalização de módulos da ficha"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">
                      {isEditMode ? 'Concluir Edição' : 'Personalizar'}
                    </span>
                  </button>
                </>
              )}

              {/* Seletor de Modo: Visual | Dividido (apenas desktop/landscape) | DSL */}
              <div className="inline-flex rounded-lg border border-[#323238] bg-[#121214] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('visual')}
                  className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded text-xs font-bold transition-colors ${viewMode === 'visual'
                      ? currentTheme.buttonActive
                      : 'text-[#a8a8b3] hover:text-white'
                    }`}
                  title="Visualizar a Ficha Automatizada"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Visual</span>
                </button>
                {!viewport.isMobilePortrait && (
                  <button
                    type="button"
                    onClick={() => setViewMode('split')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-colors ${viewMode === 'split'
                        ? currentTheme.buttonActive
                        : 'text-[#a8a8b3] hover:text-white'
                      }`}
                    title="Editar DSL ao lado da Ficha Visual"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Dividido</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewMode('code')}
                  className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded text-xs font-bold transition-colors ${viewMode === 'code'
                      ? currentTheme.buttonActive
                      : 'text-[#a8a8b3] hover:text-white'
                    }`}
                  title="Editar código-fonte SGM-SDL"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>DSL</span>
                </button>
              </div>

              {!viewport.isMobilePortrait && (
                /* Restaurar Overrides */
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
              )}
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
            className="w-8 h-8 rounded-lg bg-[#202024] hover:bg-rose-600/80 border border-[#323238] hover:border-rose-500 text-[#a8a8b3] hover:text-white flex items-center justify-center transition-colors ml-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* SUB-HEADER / TOOLBAR DE AÇÕES MÓVEL (Apenas no Mobile Portrait com ficha aberta em modo visual) */}
      {view === 'sheet' && activeSheet && viewport.isMobilePortrait && viewMode === 'visual' && (
        <div
          className="px-2 py-1.5 flex items-center justify-between gap-1.5 border-b select-none shrink-0 w-full max-w-full overflow-x-auto no-scrollbar"
          style={{
            backgroundColor: 'var(--sheet-card-bg, #121214)',
            borderColor: 'var(--sheet-header-border, #29292e)',
          }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Personalizar Módulos */}
            <button
              type="button"
              onClick={() => setIsEditMode((v) => !v)}
              className={`h-7 px-2 rounded-md border text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0 ${
                isEditMode
                  ? 'border-[var(--sheet-accent)] bg-[var(--sheet-accent)] text-white'
                  : 'border-[#323238] bg-[#18181b] text-[#a8a8b3] hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{isEditMode ? 'Concluir' : 'Editar'}</span>
            </button>

            {/* Vincular Tokens */}
            <TokenAssignmentPopover
              sheetId={activeSheet.id}
              assignedTokenIds={activeSheet.assignedTokenIds}
              compact
            />

            {/* Seletor Rápido de Paleta / Cores */}
            <div className="flex items-center gap-1 rounded-md border border-[#323238] bg-[#18181b] px-1.5 py-0.5 shrink-0">
              <Palette className="w-3 h-3 text-zinc-400 mr-0.5" />
              {(Object.values(SHEET_THEMES) as ThemeColors[]).slice(0, 3).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleChangeTheme(t.id)}
                  className="w-3 h-3 rounded-full opacity-70 hover:opacity-100"
                  style={{ backgroundColor: t.dotColor }}
                  title={`Tema ${t.name}`}
                />
              ))}
              <label className="cursor-pointer flex items-center ml-0.5" title="Cor personalizada">
                <span
                  className="w-3 h-3 rounded-full border border-white/40"
                  style={{ backgroundColor: customThemeColors?.accent || currentTheme.dotColor }}
                />
                <input
                  type="color"
                  value={customThemeColors?.accent || currentTheme.dotColor}
                  onChange={(e) => handleChangeCustomHex(e.target.value)}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* Restaurar Overrides */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Deseja restaurar recursos e slots aos valores iniciais da DSL?')) {
                resetRuntimeOverrides(activeSheet.id);
              }
            }}
            title="Restaurar valores originais"
            className="h-7 w-7 rounded-md border border-[#323238] bg-[#18181b] text-zinc-400 hover:text-white flex items-center justify-center shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      )}

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
                className="h-10 bg-[#8257e5] hover:bg-[#9466ff] text-white font-bold text-xs gap-2 px-4"
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
          <div className={`flex-1 overflow-y-auto max-w-4xl mx-auto w-full flex flex-col justify-between ${
            viewport.isMobilePortrait ? 'p-4 space-y-4' : 'p-6 space-y-6'
          }`}>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Criar Nova Ficha Modular</h3>
                  <p className="text-xs text-[#8d8d99]">
                    Selecione um preset oficial ou inicie uma ficha customizada com SGM-SDL.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setView('list')}
                  className="border-[#323238] bg-[#18181b] text-[#e1e1e6] text-xs shrink-0"
                >
                  Voltar
                </Button>
              </div>

              {/* 1. Nome da Ficha */}
              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#a8a8b3]">
                  1. Nome do Personagem / Ficha:
                </label>
                <Input
                  value={newSheetName}
                  onChange={(e) => setNewSheetName(e.target.value)}
                  placeholder="Ex: Arthur Cervero, Valeros..."
                  className="h-10 text-sm bg-[#18181b] border-[#323238] text-white"
                />
              </div>

              {/* 2. Cards de Seleção de Preset */}
              <div className="space-y-2">
                <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#a8a8b3]">
                  2. Escolha o Modelo de Sistema:
                </label>
                <div className={`grid gap-3 ${viewport.isMobilePortrait ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                  {PRESET_CARDS.map((card) => {
                    const isSelected = selectedPreset === card.id;
                    return (
                      <div
                        key={card.id}
                        onClick={() => handleSelectPreset(card.id)}
                        className={`cursor-pointer rounded-2xl border-2 p-3.5 sm:p-4 flex flex-col justify-between transition-all ${isSelected
                          ? `${card.accentCls} scale-[1.01]`
                          : 'border-[#29292e] bg-[#18181b] hover:border-[#3f3f46]'
                          }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="p-1.5 sm:p-2 rounded-xl bg-[#121214] border border-[#29292e]">
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

                        <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1">
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

              {/* 3. Atribuir Tokens Imediatamente */}
              {tokens.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#a8a8b3]">
                    3. Vincular a Tokens na Mesa (Opcional):
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[#18181b] border border-[#29292e] max-h-40 overflow-y-auto">
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
            </div>

            {/* 4. Botão de Criar (com barra fixa/sticky no mobile portrait) */}
            <div className={`flex items-center gap-3 pt-3 border-t border-[#29292e] ${
              viewport.isMobilePortrait
                ? 'sticky bottom-0 bg-[#121214]/95 backdrop-blur-md -mx-4 -mb-4 p-3 z-20 justify-between'
                : 'justify-end'
            }`}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setView('list')}
                className={`border-[#323238] bg-transparent text-[#a8a8b3] hover:text-white ${
                  viewport.isMobilePortrait ? 'flex-1 h-10' : ''
                }`}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmCreate}
                className={`h-10 bg-[#8257e5] hover:bg-[#9466ff] text-white font-bold gap-2 ${
                  viewport.isMobilePortrait ? 'flex-[2]' : 'px-6'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar e Criar
              </Button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            3. INTERFACE DA FICHA ABERTA (SEM BARRA LATERAL FIXA, COM NAVEGAÇÃO META-MÓDULO)
           ------------------------------------------------------------------ */}
        {view === 'sheet' && activeSheet && compiledActiveSheet && (
          <div className="flex-1 min-h-0 flex overflow-hidden">
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
                  <SheetDSLEditor
                    key={`${activeSheet.id}_${activePage.id}`}
                    value={activePage.content}
                    onChange={(next) => updateSheetPageContent(activeSheet.id, activePage.id, next)}
                    compiledSheet={compiledActiveSheet}
                    compactLayout={viewMode === 'split'}
                    pages={sheetPages}
                    activePageId={activePage.id}
                    onSelectPage={(pageId) => setActiveSheetPage(activeSheet.id, pageId)}
                    onAddPage={(name) => addSheetPage(activeSheet.id, name)}
                    onRenamePage={(pageId, newName) => renameSheetPage(activeSheet.id, pageId, newName)}
                    onDeletePage={(pageId) => removeSheetPage(activeSheet.id, pageId)}
                  />
                </div>
              )}

              {/* Painel Central Visual */}
              {(viewMode === 'visual' || viewMode === 'split') && (
                <div
                  className={`flex-1 min-h-0 overflow-y-auto ${
                    viewport.isMobilePortrait ? 'p-2 pb-6 overflow-x-hidden w-full max-w-full' : 'p-4 sm:p-6'
                  } transition-colors ${viewMode === 'split' ? 'h-1/2 lg:h-full' : 'h-full'
                    }`}
                  style={{ backgroundColor: 'var(--sheet-bg)' }}
                >
                  <VisualSheetView
                    sheetId={activeSheet.id}
                    sheet={compiledActiveSheet}
                    activeTab={selectedTab}
                    onSelectTab={setSelectedTab}
                    availableTabs={availableTabs}
                    onAddNewTab={handleAddNewTab}
                    isEditMode={isEditMode}
                    compactLayout={viewMode === 'split'}
                    isMobilePortrait={viewport.isMobilePortrait}
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
