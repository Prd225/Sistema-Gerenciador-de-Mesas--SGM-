import React, { useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  rollSheetFormula,
  type ASTExpr,
  type ASTModuleLayoutMeta,
  type CompiledSheet,
} from '@/lib/sheet-dsl';
import { generateId } from '@/lib/uuid';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import { type SheetRollHistoryEntry } from './types';
import { RollResultBanner } from './RollResultBanner';
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
import { SHEET_THEMES, getThemeRootVars } from './theme';

interface VisualSheetViewProps {
  sheetId: string;
  sheet: CompiledSheet;
  activeTab?: string;
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

export function VisualSheetView({ sheetId, sheet, activeTab }: VisualSheetViewProps) {
  const [rollHistory, setRollHistory] = useState<SheetRollHistoryEntry[]>([]);
  const { updateSheetSource, setCounterCurrent } = useModularSheetStore();
  const currentTheme = SHEET_THEMES[sheet.meta.theme ?? 'purple'] || SHEET_THEMES.purple;

  const handleExecuteRoll = useCallback(
    (title: string, formulaOrAst: string | ASTExpr, subtitle?: string) => {
      try {
        const result = rollSheetFormula(formulaOrAst, sheet);
        const entry: SheetRollHistoryEntry = {
          id: generateId(),
          title,
          subtitle,
          result,
          timestamp: Date.now(),
        };
        setRollHistory((prev) => [entry, ...prev].slice(0, 25));
        return result;
      } catch (err) {
        console.error('[SGM-SDL] Falha ao executar rolagem:', err);
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

      // Monta as linhas de imagem e ajustes pixel-perfect
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

  const isMainTab = !activeTab || activeTab === 'Principal' || activeTab === 'Geral';

  // Deduplica módulos de mesma espécie que renderizam agrupados (ex: attr, stat, res, turn, desc, skill, ability, inv, diagram)
  // preservando instâncias individuais para profile, counter e slots.
  const seenSingletonKinds = new Set<string>();
  const visibleModules: ASTModuleLayoutMeta[] = [];

  for (const mod of sheet.moduleLayouts) {
    const matchesTab = isMainTab
      ? !mod.tab || mod.tab === 'Geral' || mod.tab === 'Principal'
      : mod.tab === activeTab;
    if (!matchesTab) continue;

    if (mod.kind === 'rule' || mod.kind === 'meta' || mod.kind === 'tab') continue;

    if (mod.kind === 'profile' || mod.kind === 'counter' || mod.kind === 'slots' || mod.kind === 'text') {
      visibleModules.push(mod);
    } else {
      if (!seenSingletonKinds.has(mod.kind)) {
        seenSingletonKinds.add(mod.kind);
        visibleModules.push(mod);
      }
    }
  }

  // Agrupa módulos em bandas de 2 Colunas (col1 / col2) intercaladas com módulos Full-Width (horizontal)
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

  const renderModule = (mod: ASTModuleLayoutMeta): React.ReactNode => {
    const wrapperClass = mod.tall ? 'min-h-[420px] flex flex-col' : '';

    switch (mod.kind) {
      case 'profile': {
        const prof = sheet.profiles.find((p) => p.id === mod.id);
        if (!prof) return null;
        return (
          <div key={`${mod.kind}_${mod.id}_${mod.order}`} className={wrapperClass}>
            <ProfileSection
              profile={prof}
              onUpdateProfileImage={handleUpdateProfileImage}
            />
          </div>
        );
      }
      case 'counter': {
        const cntBlock = sheet.counters.find((c) => c.id === mod.id);
        if (!cntBlock) return null;
        return (
          <div key={`${mod.kind}_${mod.id}_${mod.order}`} className={wrapperClass}>
            <CountersSection
              blocks={[cntBlock]}
              onSetCounterCurrent={(counterKey, cur) =>
                setCounterCurrent(sheetId, counterKey, cur)
              }
            />
          </div>
        );
      }
      case 'attr':
        return (
          <div key={`attr_${mod.order}`} className={wrapperClass}>
            <AttributesStatsSection
              sheet={sheet}
              onExecuteRoll={handleExecuteRoll}
              activeTab={activeTab}
              mode="attr"
              displayOverride={mod.display}
            />
          </div>
        );
      case 'stat':
        return (
          <div key={`stat_${mod.order}`} className={wrapperClass}>
            <AttributesStatsSection
              sheet={sheet}
              onExecuteRoll={handleExecuteRoll}
              activeTab={activeTab}
              mode="stat"
              displayOverride={mod.display}
            />
          </div>
        );
      case 'res':
        return (
          <div key={`res_${mod.order}`} className={wrapperClass}>
            <ResourcesTurnSection
              sheetId={sheetId}
              sheet={sheet}
              activeTab={activeTab}
              mode="res"
              displayOverride={mod.display}
            />
          </div>
        );
      case 'turn':
        return (
          <div key={`turn_${mod.order}`} className={wrapperClass}>
            <ResourcesTurnSection
              sheetId={sheetId}
              sheet={sheet}
              activeTab={activeTab}
              mode="turn"
              displayOverride={mod.display}
            />
          </div>
        );
      case 'slots': {
        const slotBlock = sheet.slots.find((s) => s.id === mod.id);
        if (!slotBlock) return null;
        const singleSlotSheet = { ...sheet, slots: [slotBlock] };
        return (
          <div key={`slots_${mod.id}_${mod.order}`} className={wrapperClass}>
            <SlotsSection
              sheetId={sheetId}
              sheet={singleSlotSheet}
              activeTab={activeTab}
            />
          </div>
        );
      }
      case 'desc':
        return (
          <div key={`desc_${mod.order}`} className={wrapperClass}>
            <DescriptorsSection
              sheetId={sheetId}
              sheet={sheet}
              activeTab={activeTab}
            />
          </div>
        );
      case 'skill':
        return (
          <div key={`skill_${mod.order}`} className={wrapperClass}>
            <SkillsSection
              sheet={sheet}
              onExecuteRoll={handleExecuteRoll}
              activeTab={activeTab}
              displayOverride={mod.display}
            />
          </div>
        );
      case 'ability':
        return (
          <div key={`ability_${mod.order}`} className={wrapperClass}>
            <AbilitiesSection
              sheetId={sheetId}
              sheet={sheet}
              onExecuteRoll={handleExecuteRoll}
              activeTab={activeTab}
            />
          </div>
        );
      case 'inv':
        return (
          <div key={`inv_${mod.order}`} className={wrapperClass}>
            <InventorySection
              sheetId={sheetId}
              sheet={sheet}
              onExecuteRoll={handleExecuteRoll}
              activeTab={activeTab}
            />
          </div>
        );
      case 'diagram':
        return (
          <div key={`diagram_${mod.order}`} className={wrapperClass}>
            <DiagramsRulesSection
              sheetId={sheetId}
              sheet={sheet}
              onExecuteRoll={handleExecuteRoll}
            />
          </div>
        );
      case 'text': {
        const txtBlock = sheet.texts.find((t) => t.id === mod.id);
        if (!txtBlock) return null;
        return (
          <div key={`text_${mod.id}_${mod.order}`} className={wrapperClass}>
            <TextSection block={txtBlock} />
          </div>
        );
      }
      default:
        return null;
    }
  };

  const errorsAndWarnings = sheet.diagnostics;

  return (
    <div
      className="space-y-4 pb-8 max-w-[1400px] mx-auto w-full transition-colors"
      data-theme={currentTheme.id}
      style={getThemeRootVars(sheet.meta.theme ?? 'purple')}
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
                [Linha {d.span.start.line}:{d.span.start.column}] ({d.stage}) {d.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <RollResultBanner
        history={rollHistory}
        onClearHistory={() => setRollHistory([])}
        onExecuteRoll={handleExecuteRoll}
      />

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
}
