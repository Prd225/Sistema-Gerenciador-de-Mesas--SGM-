import React, { useCallback } from 'react';
import {
  AlertCircle,
  Layers,
  Plus,
  Palette,
  Eye,
  EyeOff,
  PanelTop,
  PanelBottom,
  PanelLeft,
  PanelRight,
} from 'lucide-react';
import {
  rollSheetFormula,
  resolveSheetFormulaForTray,
  isTabMatching,
  type ASTExpr,
  type ASTModuleLayoutMeta,
  type CompiledSheet,
  type TabNavPosition,
} from '@/lib/sheet-dsl';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import { useDiceTrayStore } from '@/store/useDiceTrayStore';
import { ProfileSection, type ProfileImageAdjustments } from './ProfileSection';
import { CountersSection } from './CountersSection';
import { AttributesStatsSection } from './AttributesStatsSection';
import { ResourcesTurnSection } from './ResourcesTurnSection';
import { DescriptorsSection } from './DescriptorsSection';
import { SkillsSection } from './SkillsSection';
import { AbilitiesSection } from './AbilitiesSection';
import { InventorySection } from './InventorySection';
import { DiagramsRulesSection } from './DiagramsRulesSection';
import { SlotsSection } from './SlotsSection';
import { TextSection } from './TextSection';
import {
  SHEET_THEMES,
  MODULE_COLOR_PALETTE,
  getThemeRootVars,
  getModuleColorVars,
  resolveColorToHex,
} from './theme';

interface VisualSheetViewProps {
  sheetId: string;
  sheet: CompiledSheet;
  activeTab?: string;
  onSelectTab?: (tabId: string) => void;
  availableTabs?: Array<{ id: string; label: string }>;
  onAddNewTab?: () => void;
  isEditMode?: boolean;
}

const DEFAULT_COL1_KINDS = new Set(['profile', 'attr', 'stat', 'desc', 'inv', 'text']);

type LayoutSectionBand =
  | {
    type: 'columns';
    col1: ASTModuleLayoutMeta[];
    col2: ASTModuleLayoutMeta[];
  }
  | {
    type: 'full';
    mod: ASTModuleLayoutMeta;
  };

export function VisualSheetView({
  sheetId,
  sheet,
  activeTab,
  onSelectTab,
  availableTabs,
  onAddNewTab,
  isEditMode = false,
}: VisualSheetViewProps) {
  const {
    updateSheetSource,
    setCounterCurrent,
    updateTabNavConfig,
    updateModuleColor,
  } = useModularSheetStore();

  const currentTheme = SHEET_THEMES[sheet.meta.theme ?? 'purple'] || SHEET_THEMES.purple;

  // Delega as rolagens para a Bandeja de Dados (DiceTrayWindow) sobre a ficha
  const handleExecuteRoll = useCallback(
    (title: string, formulaOrAst: string | ASTExpr, subtitle?: string) => {
      try {
        const setup = resolveSheetFormulaForTray(formulaOrAst, sheet);
        useDiceTrayStore.getState().openWithSheetRoll({
          title,
          subtitle,
          formula: setup.resolvedFormula,
          dice: setup.dice,
          modifier: setup.modifier,
          rules: {
            ruleMode: setup.ruleMode,
            keepCount: setup.keepCount ?? 2,
            keepMode: setup.keepMode ?? 'highest',
            successDC: setup.successDC ?? null,
            poolThreshold: setup.poolThreshold ?? null,
            percentileTarget: setup.percentileTarget ?? 50,
            rollUnderTarget: setup.rollUnderTarget ?? null,
          },
        });
        return rollSheetFormula(formulaOrAst, sheet);
      } catch (err) {
        console.error('[SGM-SDL] Falha ao preparar rolagem na bandeja:', err);
        return null;
      }
    },
    [sheet],
  );

  const handleUpdateProfileImage = useCallback(
    (adj: ProfileImageAdjustments) => {
      const currentSheetRecord = useModularSheetStore
        .getState()
        .sheets.find((s) => s.id === sheetId);
      if (!currentSheetRecord) return;

      let src = currentSheetRecord.dslSource;
      const profileRegex =
        /(@(?:profile|perfil|img|imagem|avatar|retrato|identidade)\b[^\n]*\n)((?:[ \t]+[^\n]*\n?)*)/i;

      const adjLines: string[] = [];
      if (adj.imageUrl) {
        adjLines.push(`  image: "${adj.imageUrl}"`);
      }
      if (adj.w !== undefined && adj.w > 0) {
        adjLines.push(`  w: ${adj.w}`);
      }
      if (adj.h !== undefined && adj.h > 0) {
        adjLines.push(`  h: ${adj.h}`);
      }
      if (adj.x !== undefined && adj.x !== 0) {
        adjLines.push(`  x: ${adj.x}`);
      }
      if (adj.y !== undefined && adj.y !== 0) {
        adjLines.push(`  y: ${adj.y}`);
      }
      if (adj.scale !== undefined && adj.scale !== 1) {
        adjLines.push(`  scale: ${adj.scale}`);
      }
      if (adj.fit && adj.fit !== 'contain') {
        adjLines.push(`  fit: "${adj.fit}"`);
      }
      if (adj.textPos) {
        adjLines.push(`  text_pos: "${adj.textPos}"`);
      }

      const keysToFilter = new Set([
        'image',
        'img',
        'avatar',
        'foto',
        'url',
        'w',
        'width',
        'largura',
        'h',
        'height',
        'altura',
        'x',
        'px',
        'offset_x',
        'y',
        'py',
        'offset_y',
        'scale',
        'zoom',
        'escala',
        'fit',
        'ajuste',
        'text_pos',
        'textpos',
        'pos',
        'layout',
        'alinhamento',
      ]);

      if (profileRegex.test(src)) {
        src = src.replace(
          profileRegex,
          (_m, headerLine: string, bodyLines: string) => {
            const preservedLines = bodyLines
              .split('\n')
              .filter((line) => {
                const trimmed = line.trim();
                if (!trimmed) return false;
                const match = trimmed.match(/^([a-zA-Z_]+)\s*[:=]/);
                if (match && keysToFilter.has(match[1].toLowerCase())) {
                  return false;
                }
                return true;
              });

            const newBody = [...preservedLines, ...adjLines].join('\n') + '\n';
            return `${headerLine}${newBody}`;
          },
        );
      } else {
        const newBody = adjLines.join('\n');
        src = `@profile "${sheet.meta.name}" [col1]\n${newBody}\n\n${src}`;
      }
      updateSheetSource(sheetId, src);
    },
    [sheetId, sheet.meta.name, updateSheetSource],
  );

  // Deduplica módulos de mesma espécie que renderizam agrupados
  const seenSingletonKinds = new Set<string>();
  const visibleModules: ASTModuleLayoutMeta[] = [];

  for (const mod of sheet.moduleLayouts) {
    const matchesTab = isTabMatching(mod.tab, activeTab);
    if (!matchesTab) continue;

    if (mod.kind === 'rule' || mod.kind === 'meta' || mod.kind === 'tab') continue;

    if (
      mod.kind === 'profile' ||
      mod.kind === 'counter' ||
      mod.kind === 'slots' ||
      mod.kind === 'text'
    ) {
      visibleModules.push(mod);
    } else {
      if (!seenSingletonKinds.has(mod.kind)) {
        seenSingletonKinds.add(mod.kind);
        visibleModules.push(mod);
      }
    }
  }

  // Agrupa módulos em bandas de 2 Colunas (col1 / col2) intercaladas com módulos Full-Width
  const bands: LayoutSectionBand[] = [];
  for (const mod of visibleModules) {
    if (mod.placement === 'full') {
      bands.push({ type: 'full', mod });
    } else {
      const targetCol =
        mod.placement === 'col1'
          ? 'col1'
          : mod.placement === 'col2'
            ? 'col2'
            : DEFAULT_COL1_KINDS.has(mod.kind)
              ? 'col1'
              : 'col2';

      const lastBand = bands[bands.length - 1];
      if (!lastBand || lastBand.type !== 'columns') {
        bands.push({
          type: 'columns',
          col1: targetCol === 'col1' ? [mod] : [],
          col2: targetCol === 'col2' ? [mod] : [],
        });
      } else {
        if (targetCol === 'col1') lastBand.col1.push(mod);
        else lastBand.col2.push(mod);
      }
    }
  }

  const renderModuleContent = (mod: ASTModuleLayoutMeta): React.ReactNode => {
    switch (mod.kind) {
      case 'profile': {
        const prof = sheet.profiles.find((p) => p.id === mod.id);
        if (!prof) return null;
        return (
          <ProfileSection
            sheetId={sheetId}
            profile={prof}
            onUpdateProfileImage={handleUpdateProfileImage}
            isEditMode={isEditMode}
          />
        );
      }
      case 'counter': {
        const cntBlock = sheet.counters.find((c) => c.id === mod.id);
        if (!cntBlock) return null;
        return (
          <CountersSection
            blocks={[cntBlock]}
            onSetCounterCurrent={(counterKey, cur) =>
              setCounterCurrent(sheetId, counterKey, cur)
            }
          />
        );
      }
      case 'attr':
        return (
          <AttributesStatsSection
            sheetId={sheetId}
            sheet={sheet}
            onExecuteRoll={handleExecuteRoll}
            activeTab={activeTab}
            mode="attr"
            displayOverride={mod.display}
            isEditMode={isEditMode}
          />
        );
      case 'stat':
        return (
          <AttributesStatsSection
            sheetId={sheetId}
            sheet={sheet}
            onExecuteRoll={handleExecuteRoll}
            activeTab={activeTab}
            mode="stat"
            displayOverride={mod.display}
            isEditMode={isEditMode}
          />
        );
      case 'res':
        return (
          <ResourcesTurnSection
            sheetId={sheetId}
            sheet={sheet}
            activeTab={activeTab}
            mode="res"
            displayOverride={mod.display}
          />
        );
      case 'turn':
        return (
          <ResourcesTurnSection
            sheetId={sheetId}
            sheet={sheet}
            activeTab={activeTab}
            mode="turn"
            displayOverride={mod.display}
          />
        );
      case 'slots': {
        const slotBlock = sheet.slots.find((s) => s.id === mod.id);
        if (!slotBlock) return null;
        const singleSlotSheet = { ...sheet, slots: [slotBlock] };
        return (
          <SlotsSection
            sheetId={sheetId}
            sheet={singleSlotSheet}
            activeTab={activeTab}
            isEditMode={isEditMode}
          />
        );
      }
      case 'desc':
        return (
          <DescriptorsSection
            sheetId={sheetId}
            sheet={sheet}
            activeTab={activeTab}
            isEditMode={isEditMode}
          />
        );
      case 'skill':
        return (
          <SkillsSection
            sheetId={sheetId}
            sheet={sheet}
            onExecuteRoll={handleExecuteRoll}
            activeTab={activeTab}
            displayOverride={mod.display}
            isEditMode={isEditMode}
          />
        );
      case 'ability':
        return (
          <AbilitiesSection
            sheetId={sheetId}
            sheet={sheet}
            onExecuteRoll={handleExecuteRoll}
            activeTab={activeTab}
            isEditMode={isEditMode}
          />
        );
      case 'inv':
        return (
          <InventorySection
            sheetId={sheetId}
            sheet={sheet}
            onExecuteRoll={handleExecuteRoll}
            activeTab={activeTab}
            isEditMode={isEditMode}
          />
        );
      case 'diagram':
        return (
          <DiagramsRulesSection
            sheetId={sheetId}
            sheet={sheet}
            onExecuteRoll={handleExecuteRoll}
          />
        );
      case 'text': {
        const txtBlock = sheet.texts.find((t) => t.id === mod.id);
        if (!txtBlock) return null;
        return (
          <TextSection
            sheetId={sheetId}
            block={txtBlock}
            isEditMode={isEditMode}
          />
        );
      }
      default:
        return null;
    }
  };

  const renderModule = (mod: ASTModuleLayoutMeta): React.ReactNode => {
    const content = renderModuleContent(mod);
    if (!content) return null;

    const wrapperClass = mod.tall ? 'min-h-[420px] flex flex-col' : '';
    const modColorVars = getModuleColorVars(mod.color);
    const currentModHex = resolveColorToHex(mod.color);

    return (
      <div
        key={`${mod.kind}_${mod.id ?? ''}_${mod.order}`}
        className={`space-y-1.5 ${wrapperClass}`}
        style={modColorVars}
      >
        {/* Barra de cor dedicada do módulo: visível apenas no modo Personalizar, sem sobrepor nada */}
        {isEditMode && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1 rounded-lg border bg-zinc-950/90 border-zinc-800/80 text-[10px]">
            <span className="font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <Palette className="w-3 h-3 text-zinc-500" />
              <span>Cor (@{mod.kind})</span>
            </span>

            <div className="flex flex-wrap items-center gap-1">
              {MODULE_COLOR_PALETTE.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => updateModuleColor(sheetId, mod.order, c.hex)}
                  className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                    currentModHex?.toLowerCase() === c.hex.toLowerCase()
                      ? 'scale-110 border-white'
                      : 'border-white/20 opacity-75 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
              <label
                className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[9px] font-mono text-zinc-300 hover:text-white cursor-pointer ml-0.5"
                title="Escolher código hexadecimal para este módulo"
              >
                {currentModHex ? currentModHex.toUpperCase() : 'HEX'}
                <input
                  type="color"
                  value={currentModHex || '#8257e5'}
                  onChange={(e) =>
                    updateModuleColor(sheetId, mod.order, e.target.value)
                  }
                  className="sr-only"
                />
              </label>
              {mod.color && (
                <button
                  type="button"
                  onClick={() => updateModuleColor(sheetId, mod.order, undefined)}
                  className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-400 hover:text-rose-300"
                  title="Restaurar cor padrão da ficha"
                >
                  Padrão
                </button>
              )}
            </div>
          </div>
        )}

        {content}
      </div>
    );
  };

  const errorsAndWarnings = sheet.diagnostics;
  const tabNav = sheet.meta.tabNav ?? {
    position: 'top',
    showLabels: true,
    align: 'left',
  };
  const isVerticalTabs =
    tabNav.position === 'left' || tabNav.position === 'right';

  const renderTabNavigationMetaModule = () => {
    if (!availableTabs || !onSelectTab || tabNav.position === 'hidden') {
      return null;
    }
    if (!isEditMode && availableTabs.length <= 1) {
      return null;
    }

    const alignCls =
      tabNav.align === 'center'
        ? 'justify-center'
        : tabNav.align === 'right'
          ? 'justify-end'
          : 'justify-start';

    const positionButtons: Array<{
      pos: TabNavPosition;
      icon: React.ReactNode;
      title: string;
    }> = [
        { pos: 'top', icon: <PanelTop className="w-3 h-3" />, title: 'Abas no Topo' },
        { pos: 'left', icon: <PanelLeft className="w-3 h-3" />, title: 'Abas à Esquerda' },
        { pos: 'right', icon: <PanelRight className="w-3 h-3" />, title: 'Abas à Direita' },
        { pos: 'bottom', icon: <PanelBottom className="w-3 h-3" />, title: 'Abas na Base' },
      ];

    if (isVerticalTabs) {
      return (
        <aside
          className={`shrink-0 flex flex-col justify-between rounded-xl border p-2 gap-2 ${tabNav.showLabels ? 'w-44' : 'w-12 items-center'
            }`}
          style={{
            backgroundColor: 'var(--sheet-card-bg, #18181b)',
            borderColor: 'var(--sheet-card-border, #29292e)',
          }}
        >
          <div className="space-y-1.5 w-full">
            {availableTabs.map((tab, idx) => {
              const isActive = isTabMatching(tab.id, activeTab);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  title={tab.label}
                  className={`w-full rounded-lg px-2.5 py-2 text-xs font-extrabold uppercase tracking-wide flex items-center transition-colors ${tabNav.showLabels ? 'justify-start gap-2' : 'justify-center'
                    } ${isActive
                      ? 'text-white border'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  style={
                    isActive
                      ? {
                        backgroundColor: 'var(--sheet-accent)',
                        borderColor: 'var(--sheet-accent)',
                      }
                      : undefined
                  }
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  {tabNav.showLabels ? (
                    <span className="break-words text-left leading-tight">{tab.label}</span>
                  ) : (
                    <span className="text-[10px] font-mono">{idx + 1}</span>
                  )}
                </button>
              );
            })}

            {isEditMode && onAddNewTab && (
              <button
                type="button"
                onClick={onAddNewTab}
                title="Adicionar nova aba"
                className="w-full rounded-lg border border-dashed px-2.5 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 flex items-center justify-center gap-1.5 transition-colors"
                style={{ borderColor: 'var(--sheet-card-border, #29292e)' }}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                {tabNav.showLabels && <span>Nova Aba</span>}
              </button>
            )}
          </div>

          {isEditMode && (
            <div
              className={`pt-2 border-t flex ${tabNav.showLabels
                  ? 'items-center justify-between'
                  : 'flex-col items-center gap-1'
                }`}
              style={{ borderColor: 'var(--sheet-card-border, #29292e)' }}
            >
              <div className="flex items-center gap-0.5">
                {positionButtons.map((b) => (
                  <button
                    key={b.pos}
                    type="button"
                    onClick={() =>
                      updateTabNavConfig(sheetId, { position: b.pos })
                    }
                    title={b.title}
                    className={`p-1 rounded transition-colors ${tabNav.position === b.pos
                        ? 'text-white bg-white/10'
                        : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                  >
                    {b.icon}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  updateTabNavConfig(sheetId, { showLabels: !tabNav.showLabels })
                }
                title={
                  tabNav.showLabels ? 'Ocultar nomes das abas' : 'Mostrar nomes das abas'
                }
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                {tabNav.showLabels ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </aside>
      );
    }

    return (
      <div
        className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b"
        style={{ borderColor: 'var(--sheet-card-border, #29292e)' }}
      >
        <div
          className={`flex flex-wrap items-center gap-1.5 flex-1 min-w-0 ${alignCls}`}
        >
          {availableTabs.map((tab, idx) => {
            const isActive = isTabMatching(tab.id, activeTab);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                title={tab.label}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-colors flex items-center gap-1.5 shrink-0 ${tabNav.align === 'stretch' ? 'flex-1 justify-center' : ''
                  } ${isActive
                    ? 'text-white border'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                style={
                  isActive
                    ? {
                      backgroundColor: 'var(--sheet-accent)',
                      borderColor: 'var(--sheet-accent)',
                    }
                    : undefined
                }
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                {tabNav.showLabels ? (
                  <span>{tab.label}</span>
                ) : (
                  <span className="font-mono text-[11px]">{idx + 1}</span>
                )}
              </button>
            );
          })}

          {isEditMode && onAddNewTab && (
            <button
              type="button"
              onClick={onAddNewTab}
              title="Adicionar nova aba"
              className="px-2.5 py-1.5 rounded-lg border border-dashed text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 flex items-center gap-1 transition-colors shrink-0"
              style={{ borderColor: 'var(--sheet-card-border, #29292e)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              {tabNav.showLabels && <span>Nova Aba</span>}
            </button>
          )}
        </div>

        {/* Controles do Meta-Módulo de Abas (Posição e Mostrar/Ocultar Nomes): apenas no modo Personalizar */}
        {isEditMode && (
          <div
            className="flex items-center gap-1 rounded-lg border px-1.5 py-1 shrink-0"
            style={{
              backgroundColor: 'var(--sheet-card-bg, #18181b)',
              borderColor: 'var(--sheet-card-border, #29292e)',
            }}
          >
            {positionButtons.map((b) => (
              <button
                key={b.pos}
                type="button"
                onClick={() => updateTabNavConfig(sheetId, { position: b.pos })}
                title={b.title}
                className={`p-1 rounded transition-colors ${tabNav.position === b.pos
                    ? 'text-white bg-white/10'
                    : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                {b.icon}
              </button>
            ))}
            <div className="h-3 w-px bg-zinc-800 mx-0.5" />
            <button
              type="button"
              onClick={() =>
                updateTabNavConfig(sheetId, { showLabels: !tabNav.showLabels })
              }
              title={
                tabNav.showLabels ? 'Ocultar nomes das abas' : 'Mostrar nomes das abas'
              }
              className="px-1.5 py-0.5 rounded text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              {tabNav.showLabels ? (
                <>
                  <Eye className="w-3 h-3" />
                  <span className="hidden sm:inline">Nomes</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" />
                  <span className="hidden sm:inline">Ícones</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  const mainBandsContent = (
    <div className="flex-1 min-w-0 space-y-4">
      {bands.map((band, idx) => {
        if (band.type === 'full') {
          return (
            <div key={`band_full_${idx}`} className="w-full">
              {renderModule(band.mod)}
            </div>
          );
        }

        const hasCol1 = band.col1.length > 0;
        const hasCol2 = band.col2.length > 0;

        if (!hasCol1 && !hasCol2) return null;

        return (
          <div
            key={`band_cols_${idx}`}
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
          >
            <div className="lg:col-span-6 space-y-4">
              {band.col1.map((mod) => renderModule(mod))}
            </div>
            <div className="lg:col-span-6 space-y-4">
              {band.col2.map((mod) => renderModule(mod))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      className="space-y-4 pb-8 max-w-[1400px] mx-auto w-full transition-colors"
      data-theme={currentTheme.id}
      style={getThemeRootVars(
        sheet.meta.theme ?? 'purple',
        sheet.meta.customThemeColors,
      )}
    >
      {errorsAndWarnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Diagnósticos da DSL ({errorsAndWarnings.length})</span>
          </div>
          <div className="max-h-20 overflow-y-auto space-y-0.5 text-[11px] font-mono text-amber-100">
            {errorsAndWarnings.map((d, i) => (
              <div key={i}>
                [Linha {d.span.start.line}:{d.span.start.column}] ({d.stage}){' '}
                {d.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {tabNav.position === 'top' && renderTabNavigationMetaModule()}

      {isVerticalTabs ? (
        <div className="flex flex-col md:flex-row items-start gap-4">
          {tabNav.position === 'left' && renderTabNavigationMetaModule()}
          {mainBandsContent}
          {tabNav.position === 'right' && renderTabNavigationMetaModule()}
        </div>
      ) : (
        mainBandsContent
      )}

      {tabNav.position === 'bottom' && renderTabNavigationMetaModule()}
    </div>
  );
}
