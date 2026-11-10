(globalThis as any).window = globalThis;
(globalThis as any).addEventListener = () => {};
(globalThis as any).removeEventListener = () => {};
(globalThis as any).location = {
  origin: 'http://localhost:5173',
  hostname: 'localhost',
  protocol: 'http:',
  search: '',
  href: 'http://localhost:5173/',
};
(globalThis as any).localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};
(globalThis as any).document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: () => ({ style: {} }),
};

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Dynamic imports after browser globals are polyfilled
async function generateManual() {
  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const {
    compileSheetDSL,
    extractSheetSymbols,
    tokenizeDSLLine,
    analyzeDSLStructure,
    buildFoldProjection,
    getDSLCompletions,
  } = await import('../src/lib/sheet-dsl/index');
  const { useModularSheetStore } = await import('../src/store/useModularSheetStore');
  const { VisualSheetView } = await import('../src/components/modular-sheet/VisualSheetView');
  const { SheetDSLEditor } = await import('../src/components/modular-sheet/SheetDSLEditor');

  const workspaceRoot = path.resolve(process.cwd());
  const assetsDir = path.join(workspaceRoot, 'dist', 'assets');
  const cssFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.css'));
  if (cssFiles.length === 0) {
    throw new Error('No compiled CSS found in dist/assets. Run npm run build first.');
  }
  const compiledCss = fs.readFileSync(path.join(assetsDir, cssFiles[0]), 'utf8');

  // Helper: escape HTML
  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Exact token color mapping from SheetDSLEditor.tsx
  function getTokenHexColor(kind: string): string {
    switch (kind) {
      case 'comment':
        return '#6b7280; font-style: italic';
      case 'directive_tab':
        return '#f59e0b; font-weight: 700';
      case 'directive_config':
        return '#38bdf8; font-weight: 700';
      case 'directive_module':
        return '#c084fc; font-weight: 700';
      case 'subkeyword':
        return '#fb7185; font-weight: 600';
      case 'string':
        return '#86efac';
      case 'dice':
        return '#fcd34d; font-weight: 700';
      case 'number':
        return '#fdba74';
      case 'operator':
        return '#7dd3fc; font-weight: 600';
      case 'prop_key':
        return '#93c5fd';
      case 'layout_kw':
        return '#5eead4; font-weight: 600';
      case 'flag':
        return '#f9a8d4; font-weight: 600';
      case 'tag':
        return '#a5b4fc; font-weight: 600';
      case 'builtin_fn':
        return '#67e8f9; font-weight: 600';
      case 'builtin_var':
        return '#fda4af; font-weight: 700';
      case 'symbol_decl':
        return '#f4f4f5; font-weight: 700';
      case 'symbol_ref':
        return '#fde68a; font-weight: 600';
      case 'bracket':
        return '#a1a1aa';
      case 'punctuation':
        return '#71717a';
      case 'fold_placeholder':
        return '#a1a1aa; background: rgba(130, 87, 229, 0.14); border-radius: 4px; padding: 1px 6px';
      default:
        return '#d4d4d8';
    }
  }

  // Render syntax-highlighted DSL code block using the real SGM-SDL tokenizer
  function renderDslCodeBlock(dsl: string, title = 'Código SGM-SDL'): string {
    const trimmed = dsl.trim();
    const compiled = compileSheetDSL(trimmed);
    const { symbolSet } = extractSheetSymbols(compiled);
    const lines = trimmed.split('\n');

    const renderedLines = lines
      .map((line, idx) => {
        const tokens = tokenizeDSLLine(line, symbolSet);
        const tokenSpans =
          tokens.length === 0
            ? '&nbsp;'
            : tokens
                .map(
                  (t) =>
                    `<span style="color:${getTokenHexColor(t.kind)}">${escapeHtml(t.text)}</span>`,
                )
                .join('');
        return `<div class="dsl-line"><span class="dsl-lineno">${idx + 1}</span><span class="dsl-code">${tokenSpans}</span></div>`;
      })
      .join('');

    return `
      <div class="dsl-editor-box">
        <div class="dsl-editor-header">
          <div class="dsl-dots"><span></span><span></span><span></span></div>
          <span class="dsl-editor-title">${escapeHtml(title)}</span>
          <span class="dsl-editor-badge">SGM-SDL</span>
        </div>
        <div class="dsl-editor-body">${renderedLines}</div>
      </div>
    `;
  }

  // Render real VisualSheetView UI from a DSL snippet
  let sheetCounter = 1;
  function renderSheetUiPreview(
    dsl: string,
    options?: {
      caption?: string;
      activeTab?: string;
      showTabs?: boolean;
      isEditMode?: boolean;
      runtimeOverrides?: Record<string, any>;
      compactLayout?: boolean;
    },
  ): string {
    const id = `manual_sheet_${sheetCounter++}`;
    const trimmed = dsl.trim();
    const overrides = options?.runtimeOverrides ?? {};
    const compiled = compileSheetDSL(trimmed, overrides);

    useModularSheetStore.setState({
      sheets: [
        {
          id,
          name: compiled.meta.name || 'Exemplo',
          dslSource: trimmed,
          runtimeOverrides: overrides,
          assignedTokenIds: [],
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    });

    const tabs =
      options?.showTabs
        ? compiled.tabs.length > 0
          ? compiled.tabs
          : [{ id: 'Principal', label: 'Principal' }]
        : undefined;

    const activeTab = options?.activeTab ?? tabs?.[0]?.id ?? compiled.tabs[0]?.id;

    const markup = renderToStaticMarkup(
      React.createElement(VisualSheetView, {
        sheetId: id,
        sheet: compiled,
        onOpenDiceTrayWithFormula: () => {},
        activeTab,
        availableTabs: tabs,
        onSelectTab: tabs ? () => {} : undefined,
        onAddNewTab: options?.isEditMode ? () => {} : undefined,
        isEditMode: options?.isEditMode ?? false,
        compactLayout: options?.compactLayout ?? false,
      }),
    );

    const modeBadge = options?.isEditMode
      ? '<span class="ui-frame-badge edit">Modo: Personalizar Layout</span>'
      : '<span class="ui-frame-badge">Interface Visual Renderizada pelo SGM</span>';

    return `
      <div class="ui-preview-frame">
        <div class="ui-frame-topbar">
          <div class="ui-frame-left">
            <span class="ui-dot"></span>
            <span class="ui-frame-caption">${escapeHtml(options?.caption || 'Resultado na Interface Visual da Ficha')}</span>
          </div>
          ${modeBadge}
        </div>
        <div class="ui-frame-canvas">
          <div class="ui-zoom-container">
            ${markup}
          </div>
        </div>
      </div>
    `;
  }

  // Render side-by-side or stacked Code + Visual UI example block
  function renderExamplePair(params: {
    badge: string;
    title: string;
    description: string;
    dsl: string;
    caption?: string;
    activeTab?: string;
    showTabs?: boolean;
    isEditMode?: boolean;
    runtimeOverrides?: Record<string, any>;
    layout?: 'stacked' | 'split';
  }): string {
    const codeHtml = renderDslCodeBlock(params.dsl, `DSL — ${params.title}`);
    const uiHtml = renderSheetUiPreview(params.dsl, {
      caption: params.caption ?? `Interface — ${params.title}`,
      activeTab: params.activeTab,
      showTabs: params.showTabs,
      isEditMode: params.isEditMode,
      runtimeOverrides: params.runtimeOverrides,
    });

    return `
      <div class="example-card">
        <div class="example-header">
          <span class="example-badge">${escapeHtml(params.badge)}</span>
          <h3 class="example-title">${escapeHtml(params.title)}</h3>
        </div>
        <p class="example-desc">${params.description}</p>
        <div class="${params.layout === 'split' ? 'example-grid-split' : 'example-grid-stacked'}">
          ${codeHtml}
          ${uiHtml}
        </div>
      </div>
    `;
  }

  // Render authentic Editor + Structure + Folding + Autocomplete popup preview
  function renderEditorWithAutocompleteDemo(): string {
    const demoDsl = `@tab "Combate"
@meta "Arthur Cervero" [archetype: "Combatente", system: "Ordem Paranormal", level: 5]

@attr "Atributos" [col1, cards]
  FOR "Força"     := 1d8 [roll: self]
  AGI "Agilidade" := 3   [roll: "(self)d20kh1"]
  VIG "Vigor"     := 2   [roll: "(self)d20kh1"]

@stat "Status Derivados" [col1]
  DEF "Defesa" = 10 + AGI
  Deslocamento := 9

@res "Recursos Vitais" [col2]
  PV "Pontos de Vida": 36 / 36 [red]
  PE "Pontos de Esforço": 12 / 12 [amber]

@skill "Perícias" [col2, list, roll: (attr)d20kh1 + self]
  Luta (FOR) := 5
  Pontaria (AGI) := 5`;

    const compiled = compileSheetDSL(demoDsl);
    const structure = analyzeDSLStructure(demoDsl);
    // Fold @stat block to demonstrate code folding in the editor
    const statMod = structure.modules.find((m) => m.directive === '@stat');
    const foldedSet = new Set<string>(statMod ? [statMod.id] : []);
    const projection = buildFoldProjection(demoDsl, structure, foldedSet);
    const { symbolSet } = extractSheetSymbols(compiled);

    // Generate real autocomplete items inside @skill
    const acContextSource = demoDsl + '\n  ';
    const completions = getDSLCompletions(
      acContextSource,
      acContextSource.length,
      compiled,
      true,
    );

    const outlineItemsHtml = structure.blocks
      .filter((b) => b.kind === 'tab' || b.kind === 'module')
      .map((b) => {
        const isFolded = foldedSet.has(b.id);
        if (b.kind === 'tab') {
          return `<div class="ed-outline-tab"><span>• ${escapeHtml(b.label)}</span><span class="ed-ln">${b.startLine + 1}</span></div>`;
        }
        return `
          <div class="ed-outline-mod ${isFolded ? 'folded' : ''}">
            <span class="ed-chev">${isFolded ? '▸' : '▾'}</span>
            <span class="ed-dir">${escapeHtml(b.directive)}</span>
            <span class="ed-lbl">${escapeHtml(b.label)}</span>
            <span class="ed-ln">${b.startLine + 1}</span>
          </div>
        `;
      })
      .join('');

    const projLines = projection.projectedSource.split('\n');
    const editorLinesHtml = projLines
      .map((line, idx) => {
        const info = projection.lineMap[idx];
        const tokens = tokenizeDSLLine(line, symbolSet);
        const spans =
          tokens.length === 0
            ? '&nbsp;'
            : tokens
                .map(
                  (t) =>
                    `<span style="color:${getTokenHexColor(t.kind)}">${escapeHtml(t.text)}</span>`,
                )
                .join('');
        const foldIcon = info?.headerBlock
          ? `<span class="ed-gutter-fold">${info.isHeaderFolded ? '▸' : '▾'}</span>`
          : `<span class="ed-gutter-fold"></span>`;
        return `<div class="ed-code-row ${info?.isFoldPlaceholder ? 'is-folded-row' : ''}"><span class="ed-gutter-ln">${info?.realLineNumber ?? idx + 1}</span>${foldIcon}<span class="ed-code-text">${spans}</span></div>`;
      })
      .join('');

    const acItemsHtml = (completions?.items ?? []).slice(0, 7).map((item, idx) => {
      const tierLabel =
        item.tier === 1 ? '1º CRIAR / TAG' : item.tier === 2 ? '2º VARIÁVEL' : '3º EXTRA';
      const tierCls = item.tier === 1 ? 't1' : item.tier === 2 ? 't2' : 't3';
      return `
        <div class="ed-ac-row ${idx === 0 ? 'selected' : ''}">
          <div class="ed-ac-main">
            <span class="ed-ac-tier ${tierCls}">${tierLabel}</span>
            <span class="ed-ac-label">${escapeHtml(item.label)}</span>
            <span class="ed-ac-badge">${escapeHtml(item.badge)}</span>
          </div>
          <div class="ed-ac-detail">${escapeHtml(item.detail)}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="ui-preview-frame">
        <div class="ui-frame-topbar">
          <div class="ui-frame-left">
            <span class="ui-dot"></span>
            <span class="ui-frame-caption">Interface do Editor SGM-SDL: Painel ESTRUTURA + Code Folding + Autocomplete Algorítmico em 3 Camadas</span>
          </div>
          <span class="ui-frame-badge">Editor SGM-SDL</span>
        </div>
        <div class="ed-demo-shell">
          <div class="ed-demo-sidebar">
            <div class="ed-demo-side-hdr">
              <span>ESTRUTURA</span>
              <span class="ed-side-actions">[- Abas] [- Módulos] [+ Tudo]</span>
            </div>
            <div class="ed-demo-side-list">
              ${outlineItemsHtml}
            </div>
          </div>
          <div class="ed-demo-main">
            <div class="ed-demo-toolbar">
              <span class="ed-tb-pill">+ @profile</span>
              <span class="ed-tb-pill">+ @attr</span>
              <span class="ed-tb-pill">+ @stat</span>
              <span class="ed-tb-pill">+ @res</span>
              <span class="ed-tb-pill">+ @skill</span>
              <span class="ed-tb-pill">+ @inv</span>
              <span class="ed-tb-pill">+ @ability</span>
              <span class="ed-tb-pill">+ @turn</span>
            </div>
            <div class="ed-demo-code-area">
              ${editorLinesHtml}
              <div class="ed-code-row active-cursor-line">
                <span class="ed-gutter-ln">20</span>
                <span class="ed-gutter-fold"></span>
                <span class="ed-code-text">&nbsp;&nbsp;<span class="ed-cursor">|</span></span>
              </div>
              <div class="ed-ac-popup">
                <div class="ed-ac-hdr">
                  <span>${escapeHtml(completions?.contextLabel || '@skill — 1º Criações/Tags • 2º Variáveis • 3º Outros')}</span>
                  <span>Tab / Enter para inserir</span>
                </div>
                ${acItemsHtml}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render full Split View (Editor + Visual Sheet side by side) for Chapter 0
  function renderSplitViewOverview(): string {
    const fullDsl = `@meta "Kaelen Vance" [archetype: "Ocultista Conduíte", system: "Ordem Paranormal", level: 4, theme: "purple"]

@profile "Kaelen Vance" [col1, sm, side]
  archetype: "Ocultista • 20% NEX"
  level: 4
  desc: "Investigador especializado em rituais de Energia e Conhecimento."

@attr "Atributos" [col1, cards]
  AGI "Agilidade" := 2 [roll: "(self)d20kh1"]
  FOR "Força"     := 1 [roll: "(self)d20kh1"]
  INT "Intelecto" := 3 [roll: "(self)d20kh1"]
  PRE "Presença"  := 3 [roll: "(self)d20kh1"]
  VIG "Vigor"     := 2 [roll: "(self)d20kh1"]

@stat "Defesas & Status" [col1]
  DEF "Defesa" = 10 + AGI
  DT_Ritual "DT de Rituais" = 10 + level + PRE

@res "Recursos Vitais" [col2]
  PV "Pontos de Vida": 24 / 24 [red]
  PE "Pontos de Esforço": 18 / 18 [amber]
  SAN "Sanidade": 32 / 32 [purple]

@turn [col2, reset: "round"]
  padrao "Padrão": slots(1 / 1)
  movimento "Movimento": slots(1 / 1)
  reacao "Reação": slots(1 / 1)
  convert "Ação Completa" -> 1 padrao, 1 movimento`;

    const compiled = compileSheetDSL(fullDsl);
    useModularSheetStore.setState({
      sheets: [
        {
          id: 'split_overview',
          name: 'Kaelen Vance',
          dslSource: fullDsl,
          runtimeOverrides: {},
          assignedTokenIds: [],
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    });

    const editorHtml = renderToStaticMarkup(
      React.createElement(SheetDSLEditor, {
        value: fullDsl,
        onChange: () => {},
        compiledSheet: compiled,
        compactLayout: true,
      }),
    );

    const visualHtml = renderToStaticMarkup(
      React.createElement(VisualSheetView, {
        sheetId: 'split_overview',
        sheet: compiled,
        onOpenDiceTrayWithFormula: () => {},
        compactLayout: false,
      }),
    );

    return `
      <div class="ui-preview-frame">
        <div class="ui-frame-topbar">
          <div class="ui-frame-left">
            <span class="ui-dot"></span>
            <span class="ui-frame-caption">Visão Geral do Sistema de Fichas Modulares (Modo Dividido: Código DSL + Interface Visual em Tempo Real)</span>
          </div>
          <span class="ui-frame-badge">Modo: Dividido (Split View)</span>
        </div>
        <div class="split-showcase-grid">
          <div class="split-showcase-left">${editorHtml}</div>
          <div class="split-showcase-right"><div class="ui-zoom-container">${visualHtml}</div></div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // BUILD CHAPTERS CONTENT
  // =========================================================================

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
  <meta charset="UTF-8" />
  <title>Manual Completo de Referência Visual — SGM-SDL (Sheet Domain-Specific Language)</title>
  <style>
    ${compiledCss}

    @page {
      size: A4 portrait;
      margin: 10mm 10mm 12mm 10mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background-color: #09090b;
      color: #f4f4f5;
      font-family: 'Geist Variable', 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 11px;
      line-height: 1.48;
    }

    .doc-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }

    /* Force desktop 12-column layout inside rendered SGM previews even on A4 page width */
    .ui-zoom-container {
      zoom: 0.78;
      width: 100%;
    }
    .ui-zoom-container .lg\\:grid-cols-12,
    .ui-zoom-container .xl\\:grid-cols-12 {
      grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
    }
    .ui-zoom-container .lg\\:col-span-6,
    .ui-zoom-container .xl\\:col-span-6 {
      grid-column: span 6 / span 6 !important;
    }
    .ui-zoom-container .lg\\:col-span-12,
    .ui-zoom-container .xl\\:col-span-12 {
      grid-column: span 12 / span 12 !important;
    }
    .ui-zoom-container .lg\\:col-start-7,
    .ui-zoom-container .xl\\:col-start-7 {
      grid-column-start: 7 !important;
    }
    .ui-zoom-container .md\\:flex-row {
      flex-direction: row !important;
    }
    .ui-zoom-container .sm\\:flex-row {
      flex-direction: row !important;
    }
    .ui-zoom-container .sm\\:inline {
      display: inline !important;
    }
    .ui-zoom-container .pb-8 {
      padding-bottom: 0.25rem !important;
    }

    /* Cover & Header */
    .cover-banner {
      background: linear-gradient(135deg, #18181b 0%, #09090b 65%, #1e1b4b 100%);
      border: 1px solid #27272a;
      border-left: 5px solid #8b5cf6;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 14px;
    }
    .cover-kicker {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #c4b5fd;
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.35);
      padding: 3px 9px;
      border-radius: 999px;
      margin-bottom: 8px;
    }
    .cover-title {
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }
    .cover-subtitle {
      font-size: 12px;
      color: #a1a1aa;
      margin: 0 0 12px 0;
    }
    .cover-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .cover-pill {
      font-family: Consolas, monospace;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 5px;
      background: #18181b;
      border: 1px solid #3f3f46;
      color: #d8b4fe;
    }

    /* Chapter Section */
    .chapter {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 2px solid #27272a;
    }
    .chapter.page-break {
      page-break-before: always;
      break-before: page;
      border-top: none;
      margin-top: 0;
      padding-top: 0;
    }
    .chapter-header {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #121216;
      border: 1px solid #27272a;
      border-left: 4px solid #8b5cf6;
      border-radius: 9px;
      padding: 9px 14px;
      margin-bottom: 10px;
    }
    .chapter-num {
      font-family: Consolas, monospace;
      font-size: 11px;
      font-weight: 800;
      color: #c4b5fd;
      background: rgba(139, 92, 246, 0.18);
      border: 1px solid rgba(139, 92, 246, 0.4);
      padding: 2px 8px;
      border-radius: 6px;
      white-space: nowrap;
    }
    .chapter-title {
      font-size: 15px;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
    }
    .chapter-aliases {
      margin-left: auto;
      font-family: Consolas, monospace;
      font-size: 10px;
      color: #a1a1aa;
      background: #18181b;
      border: 1px solid #27272a;
      padding: 2px 8px;
      border-radius: 5px;
    }

    .chapter-intro {
      margin: 0 0 10px 0;
      color: #d4d4d8;
      font-size: 11px;
    }

    /* Reference Tables */
    .ref-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 10.5px;
      background: #121215;
      border: 1px solid #27272a;
      border-radius: 8px;
      overflow: hidden;
    }
    .ref-table th {
      background: #18181c;
      color: #e4e4e7;
      font-weight: 800;
      text-align: left;
      padding: 6px 9px;
      border-bottom: 1px solid #27272a;
      text-transform: uppercase;
      font-size: 9.5px;
      letter-spacing: 0.05em;
    }
    .ref-table td {
      padding: 5px 9px;
      border-bottom: 1px solid #1f1f23;
      color: #d4d4d8;
      vertical-align: top;
    }
    .ref-table tr:last-child td {
      border-bottom: none;
    }
    .ref-table code, p code, li code {
      font-family: Consolas, 'Cascadia Mono', monospace;
      font-size: 10px;
      background: #1e1e24;
      border: 1px solid #32323a;
      color: #e9d5ff;
      padding: 1px 5px;
      border-radius: 4px;
    }

    /* Example Card */
    .example-card {
      background: #111114;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 12px;
    }
    .dsl-editor-box,
    .ui-preview-frame,
    .ref-table,
    .chapter-header {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .example-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .example-badge {
      font-family: Consolas, monospace;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #6ee7b7;
      background: rgba(16, 185, 129, 0.14);
      border: 1px solid rgba(16, 185, 129, 0.35);
      padding: 1.5px 7px;
      border-radius: 4px;
    }
    .example-title {
      font-size: 12.5px;
      font-weight: 800;
      color: #f4f4f5;
      margin: 0;
    }
    .example-desc {
      margin: 0 0 8px 0;
      color: #a1a1aa;
      font-size: 10.5px;
    }
    .example-grid-stacked {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .example-grid-split {
      display: grid;
      grid-template-columns: 44% 56%;
      gap: 10px;
      align-items: start;
    }

    /* Syntax Highlighted DSL Box */
    .dsl-editor-box {
      background: #0c0c0e;
      border: 1px solid #27272a;
      border-radius: 8px;
      overflow: hidden;
    }
    .dsl-editor-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: #16161a;
      border-bottom: 1px solid #27272a;
    }
    .dsl-dots {
      display: flex;
      gap: 4px;
    }
    .dsl-dots span {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: #3f3f46;
    }
    .dsl-dots span:nth-child(1) { background: #ef4444; }
    .dsl-dots span:nth-child(2) { background: #f59e0b; }
    .dsl-dots span:nth-child(3) { background: #10b981; }
    .dsl-editor-title {
      font-size: 9.5px;
      font-weight: 700;
      color: #a1a1aa;
      margin-left: 4px;
    }
    .dsl-editor-badge {
      margin-left: auto;
      font-family: Consolas, monospace;
      font-size: 9px;
      font-weight: 700;
      color: #c084fc;
      background: rgba(192, 132, 252, 0.12);
      padding: 1px 5px;
      border-radius: 4px;
    }
    .dsl-editor-body {
      padding: 7px 10px;
      font-family: Consolas, 'Cascadia Mono', 'Courier New', monospace;
      font-size: 10.5px;
      line-height: 1.45;
    }
    .dsl-line {
      display: flex;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .dsl-lineno {
      width: 22px;
      flex-shrink: 0;
      color: #52525b;
      text-align: right;
      padding-right: 8px;
      user-select: none;
      font-size: 9.5px;
    }
    .dsl-code {
      flex: 1;
      min-width: 0;
    }

    /* Visual UI Frame */
    .ui-preview-frame {
      background: #0d0d10;
      border: 1px solid #2e2e36;
      border-radius: 8px;
      overflow: hidden;
    }
    .ui-frame-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 10px;
      background: #18181d;
      border-bottom: 1px solid #27272a;
    }
    .ui-frame-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ui-dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: #10b981;
    }
    .ui-frame-caption {
      font-size: 9.5px;
      font-weight: 700;
      color: #d4d4d8;
    }
    .ui-frame-badge {
      font-size: 9px;
      font-weight: 700;
      color: #34d399;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 1px 6px;
      border-radius: 4px;
    }
    .ui-frame-badge.edit {
      color: #fcd34d;
      background: rgba(245, 158, 11, 0.15);
      border-color: rgba(245, 158, 11, 0.35);
    }
    .ui-frame-canvas {
      padding: 10px;
      background: #111214;
    }

    /* Split View Showcase */
    .split-showcase-grid {
      display: grid;
      grid-template-columns: 45% 55%;
      gap: 0;
      background: #0d0d10;
      max-height: 510px;
      overflow: hidden;
    }
    .split-showcase-left {
      border-right: 1px solid #27272a;
      zoom: 0.72;
      max-height: 700px;
      overflow: hidden;
    }
    .split-showcase-right {
      padding: 10px;
      background: #111214;
    }

    /* Editor Demo Shell (Chapter 1) */
    .ed-demo-shell {
      display: grid;
      grid-template-columns: 185px 1fr;
      background: #0c0c0e;
      min-height: 330px;
    }
    .ed-demo-sidebar {
      background: #111114;
      border-right: 1px solid #27272a;
      padding: 8px;
      font-size: 10px;
    }
    .ed-demo-side-hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9px;
      font-weight: 800;
      color: #a1a1aa;
      padding-bottom: 6px;
      margin-bottom: 6px;
      border-bottom: 1px solid #27272a;
    }
    .ed-side-actions {
      font-size: 8px;
      color: #71717a;
      font-family: Consolas, monospace;
    }
    .ed-outline-tab {
      display: flex;
      justify-content: space-between;
      padding: 3px 6px;
      border-radius: 4px;
      background: #18181b;
      border: 1px solid #27272a;
      color: #f59e0b;
      font-weight: 700;
      margin-bottom: 4px;
      font-family: Consolas, monospace;
    }
    .ed-outline-mod {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2.5px 6px 2.5px 10px;
      border-radius: 4px;
      font-family: Consolas, monospace;
      font-size: 9.5px;
      color: #d4d4d8;
    }
    .ed-outline-mod.folded {
      background: rgba(139, 92, 246, 0.14);
      border: 1px solid rgba(139, 92, 246, 0.3);
    }
    .ed-chev { color: #71717a; width: 10px; }
    .ed-dir { color: #c084fc; font-weight: 700; }
    .ed-lbl { color: #a1a1aa; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
    .ed-ln { color: #52525b; font-size: 8.5px; margin-left: auto; }

    .ed-demo-main {
      display: flex;
      flex-direction: column;
    }
    .ed-demo-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 5px 8px;
      background: #141418;
      border-bottom: 1px solid #27272a;
    }
    .ed-tb-pill {
      font-family: Consolas, monospace;
      font-size: 9px;
      padding: 1.5px 6px;
      border-radius: 4px;
      background: #1e1e24;
      border: 1px solid #2e2e36;
      color: #c4b5fd;
    }
    .ed-demo-code-area {
      position: relative;
      padding: 8px 10px 140px 10px;
      font-family: Consolas, monospace;
      font-size: 10.5px;
      line-height: 1.45;
    }
    .ed-code-row {
      display: flex;
      align-items: center;
    }
    .ed-code-row.active-cursor-line {
      background: rgba(139, 92, 246, 0.12);
      border-radius: 3px;
    }
    .ed-gutter-ln {
      width: 22px;
      text-align: right;
      color: #52525b;
      padding-right: 6px;
      font-size: 9px;
    }
    .ed-gutter-fold {
      width: 14px;
      color: #71717a;
      font-size: 9px;
      text-align: center;
    }
    .ed-cursor {
      color: #c084fc;
      font-weight: 900;
    }
    .ed-ac-popup {
      margin-top: 4px;
      margin-left: 36px;
      width: 430px;
      background: #141418;
      border: 1px solid #3f3f46;
      border-radius: 7px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    }
    .ed-ac-hdr {
      display: flex;
      justify-content: space-between;
      padding: 4px 8px;
      background: #1c1c22;
      border-bottom: 1px solid #27272a;
      font-size: 8.5px;
      font-weight: 700;
      color: #a1a1aa;
    }
    .ed-ac-row {
      padding: 3.5px 8px;
      border-bottom: 1px solid #1f1f25;
    }
    .ed-ac-row.selected {
      background: #231d38;
      border-left: 3px solid #8b5cf6;
    }
    .ed-ac-main {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ed-ac-tier {
      font-size: 8px;
      font-weight: 800;
      padding: 0.5px 4px;
      border-radius: 3px;
    }
    .ed-ac-tier.t1 { background: #14532d; color: #86efac; }
    .ed-ac-tier.t2 { background: #1e3a8a; color: #93c5fd; }
    .ed-ac-tier.t3 { background: #27272a; color: #d4d4d8; }
    .ed-ac-label {
      font-weight: 700;
      color: #f4f4f5;
      font-size: 10px;
    }
    .ed-ac-badge {
      margin-left: auto;
      font-size: 8.5px;
      padding: 0.5px 5px;
      border-radius: 3px;
      background: #27272a;
      color: #c4b5fd;
    }
    .ed-ac-detail {
      font-size: 8.5px;
      color: #a1a1aa;
      font-family: 'Geist Variable', sans-serif;
    }
  </style>
</head>
<body>
  <div class="doc-container">

    <!-- =================================================================== -->
    <!-- CAPA & VISÃO GERAL                                                  -->
    <!-- =================================================================== -->
    <div class="cover-banner">
      <span class="cover-kicker">Documentação Oficial • SGM v7.0</span>
      <h1 class="cover-title">Manual Completo da Linguagem SGM-SDL</h1>
      <p class="cover-subtitle">
        Referência técnica e visual direta da DSL de Fichas Modulares do Sistema Gerenciador de Mesas. Cada módulo, tag, construtor, operador e função demonstrado com código real e renderização exata da interface do sistema.
      </p>
      <div class="cover-pills">
        <span class="cover-pill">@meta</span>
        <span class="cover-pill">@tema</span>
        <span class="cover-pill">@nav / @tab</span>
        <span class="cover-pill">@profile</span>
        <span class="cover-pill">@attr</span>
        <span class="cover-pill">@stat</span>
        <span class="cover-pill">@res</span>
        <span class="cover-pill">@turn</span>
        <span class="cover-pill">@rank</span>
        <span class="cover-pill">@skill</span>
        <span class="cover-pill">@inv</span>
        <span class="cover-pill">@ability</span>
        <span class="cover-pill">@counter</span>
        <span class="cover-pill">@slots</span>
        <span class="cover-pill">@desc</span>
        <span class="cover-pill">@diagram</span>
        <span class="cover-pill">@roll</span>
        <span class="cover-pill">@rule</span>
        <span class="cover-pill">@table</span>
        <span class="cover-pill">@texto</span>
      </div>
    </div>

    ${renderSplitViewOverview()}

    <!-- =================================================================== -->
    <!-- CAPÍTULO 1: AMBIENTE DO EDITOR, ESTRUTURA, FOLDING E AUTOCOMPLETE   -->
    <!-- =================================================================== -->
    <section class="chapter">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 01</span>
        <h2 class="chapter-title">Editor SGM-SDL, Rastreio Estrutural (Folding) e Autocomplete Algorítmico</h2>
        <span class="chapter-aliases">Aba Código / Dividido</span>
      </div>
      <p class="chapter-intro">
        O editor de código da ficha possui <strong>Syntax Highlighting</strong> léxico, painel lateral <strong>ESTRUTURA</strong> com recolhimento por Aba (<code>@tab</code>), Módulo (<code>@attr</code>, <code>@skill</code>...) ou Sub-bloco (<code>item</code>, <code>ability</code>), e um <strong>Autocomplete Algorítmico Contextual</strong> que ordena as sugestões estritamente em 3 camadas:
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Prioridade no Autocomplete</th>
            <th>O que exibe</th>
            <th>Exemplos Práticos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1º — Criações & Tags do Módulo Atual (Tier 1)</strong></td>
            <td>Declarações válidas do bloco onde o cursor está, sub-itens e tags/propriedades de <code>[...]</code> daquele módulo.</td>
            <td>Em <code>@skill</code>: <code>NovaPericia (FOR) = treinado</code>. Em <code>@inv</code>: <code>item "Novo Item" [...]</code>, <code>!equipped</code>, <code>!consumable</code>. Em <code>@turn</code>: <code>convert "Ação Completa" -> ...</code></td>
          </tr>
          <tr>
            <td><strong>2º — Variáveis Vivas da Ficha (Tier 2)</strong></td>
            <td>Todos os símbolos declarados na ficha atual e variáveis de contexto embutidas.</td>
            <td><code>FOR</code>, <code>AGI</code>, <code>DEF</code>, <code>PV</code>, <code>treinado</code>, <code>self</code>, <code>attr</code>, <code>level</code>, <code>carga_atual</code>.</td>
          </tr>
          <tr>
            <td><strong>3º — Funções, Dados e Outros Módulos (Tier 3)</strong></td>
            <td>Funções matemáticas/condicionais, expressões de dados e abertura de novos blocos <code>@</code>.</td>
            <td><code>floor(x)</code>, <code>clamp(v, min, max)</code>, <code>lookup(tab, v)</code>, <code>1d20 + self</code>, <code>(self)d20kh1</code>, <code>@ability</code>.</td>
          </tr>
        </tbody>
      </table>

      ${renderEditorWithAutocompleteDemo()}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 2: FUNDAMENTOS DA SINTAXE, OPERADORES, VARIÁVEIS E DADOS   -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 02</span>
        <h2 class="chapter-title">Fundamentos da Sintaxe: Operadores, Variáveis de Contexto e Dados</h2>
        <span class="chapter-aliases">:= • = • :! • -> • self • attr</span>
      </div>
      <p class="chapter-intro">
        Todo bloco começa com uma diretiva <code>@modulo "Título Opcional" [configurações, #tags, !flags]</code>. Dentro do bloco, cada linha declara um símbolo, recurso ou sub-item usando um dos operadores abaixo:
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Operador / Variável</th>
            <th>Nome</th>
            <th>Comportamento Exato na Ficha</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>ID := valor</code></td>
            <td>Atribuição Base Editável (Pin)</td>
            <td>Define um valor base que o jogador pode alterar diretamente na interface visual (botões <code>-</code>/<code>+</code> ou clique no número). Aceita números (<code>2</code>) ou dados (<code>1d6</code>, <code>d8</code>).</td>
          </tr>
          <tr>
            <td><code>ID = expressão</code> ou <code>ID: expr</code></td>
            <td>Fórmula Derivada Calculada</td>
            <td>Recalcula automaticamente sempre que qualquer variável referenciada mudar (ex.: <code>DEF = 10 + AGI</code>). Exibe a fórmula abaixo do nome no card.</td>
          </tr>
          <tr>
            <td><code>ID :! valor</code> ou <code>[!lock]</code></td>
            <td>Valor Travado (Lock)</td>
            <td>Exibe um ícone de cadeado e <strong>impede que efeitos externos</strong> (<code>+=</code>, <code>-=</code> de itens, habilidades ou regras) alterem esse atributo/status.</td>
          </tr>
          <tr>
            <td><code>-> ALVO += expr</code> / <code>-=</code> / <code>=</code></td>
            <td>Efeito Reativo</td>
            <td>Aplica bônus, penalidade ou substituição sobre outro símbolo da ficha (ex.: <code>-> DEF += 2</code>, <code>-> PV.max += 10</code>, <code>-> Luta.roll = "2d20kh1 + self"</code>).</td>
          </tr>
          <tr>
            <td><code>self</code></td>
            <td>Valor Próprio</td>
            <td>Dentro de <code>[roll: ...]</code> ou subpropriedades, representa o valor final (ou dado, como <code>1d6</code> / <code>d8</code>) do próprio atributo, status ou perícia.</td>
          </tr>
          <tr>
            <td><code>attr</code></td>
            <td>Atributo-Base da Perícia</td>
            <td>Em <code>@skill</code>, retorna automaticamente o valor final (ou dado) do atributo vinculado entre parênteses, ex.: <code>Luta (FOR)</code>.</td>
          </tr>
          <tr>
            <td><code>level</code> / <code>nivel</code> / <code>nex</code></td>
            <td>Nível do Personagem</td>
            <td>Retorna o valor numérico de <code>level</code> definido no cabeçalho <code>@meta</code>.</td>
          </tr>
          <tr>
            <td><code>1d20</code>, <code>(self)d20kh1</code>, <code>d6</code>, <code>4d6!</code></td>
            <td>Literais de Dados e Step Dice</td>
            <td>Suporta dados padrão (<code>2d6</code>), manter maior/menor (<code>kh1</code>, <code>kl1</code>), explosão (<code>!</code>), rerrolagem (<code>r1</code>) e dados escalonados (<code>d4</code>, <code>d6</code>, <code>d8</code>, <code>d10</code>, <code>d12</code>, <code>d20</code>, <code>dF</code>).</td>
          </tr>
        </tbody>
      </table>

      ${renderExamplePair({
        badge: 'Sintaxe Base',
        title: 'Diferença Visual entre := (Editável), = (Fórmula Calculada), :! (Travado) e Efeito Reativo (->)',
        description:
          'Observe como FOR (:=) exibe controles +/-, DEF (= 10 + AGI) exibe a fórmula de origem e fica destacada em âmbar por receber +2 do Escudo equipado, enquanto RD (:! 5) exibe o cadeado e ignora alterações externas.',
        dsl: `@attr "Atributos Base (:=)" [col1, cards]
  FOR "Força"     := 3 [roll: 1d20 + self]
  AGI "Agilidade" := 2 [roll: 1d20 + self]

@stat "Status: Calculado (=) vs Travado (:!)" [col2, cards]
  DEF "Defesa" = 10 + AGI
  Ataque "Bônus de Ataque" = FOR + 2 [roll: 1d20 + self]
  RD "Redução de Dano" :! 5

@desc "Buff Ativo Aplicando Efeito (->)" [full]
  tag "Postura Defensiva" [active: true] -> DEF += 2; RD += 10`,
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 3: @meta E @tema (PERSONALIZAÇÃO DE CORES E MODO EDITAR)   -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 03</span>
        <h2 class="chapter-title">Metadados da Ficha (<code>@meta</code>) e Temas de Cores (<code>@tema</code>)</h2>
        <span class="chapter-aliases">@meta / @ficha • @tema / @theme</span>
      </div>
      <p class="chapter-intro">
        <code>@meta</code> define a identificação da ficha e o tema base (<code>amber</code>, <code>red</code>, <code>emerald</code>, <code>purple</code>, <code>blue</code>, <code>cyan</code>, <code>dark</code>). <code>@tema</code> permite sobrescrever qualquer cor da interface com códigos hexadecimais, e cada módulo individual também aceita sua própria cor (ex.: <code>@attr [cor: "#10b981"]</code>).
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Propriedade</th>
            <th>Onde usar</th>
            <th>Descrição Direta</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>archetype: "..."</code> (ou <code>classe</code>, <code>origem</code>)</td>
            <td><code>@meta</code> / <code>@profile</code></td>
            <td>Define a classe, ocupação ou arquétipo do personagem.</td>
          </tr>
          <tr>
            <td><code>system: "..."</code> (ou <code>sistema</code>)</td>
            <td><code>@meta</code></td>
            <td>Nome do sistema de RPG exibido no cabeçalho da ficha.</td>
          </tr>
          <tr>
            <td><code>level: N</code> (ou <code>nivel</code>, <code>nex</code>)</td>
            <td><code>@meta</code></td>
            <td>Define a variável global <code>level</code> / <code>nivel</code> / <code>nex</code> acessível em qualquer fórmula.</td>
          </tr>
          <tr>
            <td><code>theme: "amber"</code> (ou <code>tema</code>)</td>
            <td><code>@meta</code></td>
            <td>Aplica uma paleta predefinida (<code>amber</code>, <code>red</code>, <code>emerald</code>, <code>purple</code>, <code>blue</code>, <code>cyan</code>, <code>dark</code>).</td>
          </tr>
          <tr>
            <td><code>cor: "#hex"</code>, <code>bg: "#hex"</code>, <code>card: "#hex"</code>, <code>border: "#hex"</code>, <code>item: "#hex"</code>, <code>text: "#hex"</code></td>
            <td><code>@tema</code> / <code>@meta</code> / Qualquer Módulo</td>
            <td>Personaliza destaque principal (<code>cor</code>), fundo da ficha (<code>bg</code>), fundo dos módulos (<code>card</code>), bordas (<code>border</code>), fundo dos sub-itens (<code>item</code>) e texto (<code>text</code>).</td>
          </tr>
        </tbody>
      </table>

      ${renderExamplePair({
        badge: '@meta + @tema',
        title: 'Tema Hexadecimal Customizado (@tema) + Cor Individual por Módulo',
        description:
          'Ficha configurada com paleta hexadecimal personalizada em @tema e cor esmeralda específica no módulo @res.',
        dsl: `@meta "Valerius" [archetype: "Paladino Juramentado", system: "Tormenta20", level: 6]
@tema [cor: "#f59e0b", bg: "#0c0a09", card: "#181310", border: "#3b2818", item: "#221a15", text: "#fef3c7"]

@attr "Atributos Dourados" [col1, cards]
  FOR "Força"    := 4 [roll: 1d20 + self]
  CAR "Carisma"  := 3 [roll: 1d20 + self]

@res "Recursos com Cor Própria" [col2, cor: "#10b981"]
  PV "Pontos de Vida": 54 / 54 [red]
  PM "Pontos de Mana": 24 / 24 [amber]`,
      })}

      ${renderExamplePair({
        badge: 'Modo Personalizar',
        title: 'Interface com o Modo "Personalizar Layout" Ativo (Controles Visuais de Coluna e Cor)',
        description:
          'Ao ativar o botão "Personalizar" no topo da ficha, cada módulo exibe controles rápidos para mover a ordem (↑/↓), alternar entre col1 / col2 / full, escolher cor da paleta ou código HEX e adicionar novos itens sem digitar código.',
        dsl: `@meta "Lyra" [system: "Custom", level: 3, theme: "purple"]
@attr "Atributos" [col1, cards, cor: "#06b6d4"]
  AGI "Agilidade" := 3 [roll: 1d20 + self]
  INT "Intelecto" := 4 [roll: 1d20 + self]

@stat "Status" [col2]
  DEF "Defesa" = 10 + AGI`,
        isEditMode: true,
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 4: @tab E @nav (NAVEGAÇÃO POR ABAS)                        -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 04</span>
        <h2 class="chapter-title">Sistema de Abas (<code>@tab</code>) e Barra de Navegação (<code>@nav</code>)</h2>
        <span class="chapter-aliases">@tab / @aba / @secao • @nav</span>
      </div>
      <p class="chapter-intro">
        Use <code>@tab "Nome da Aba"</code> para separar a ficha em páginas organizadas (todos os módulos declarados abaixo de <code>@tab</code> pertencem àquela aba). Use <code>@nav</code> para controlar onde a barra de abas aparece e como é alinhada.
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Comando / Propriedade</th>
            <th>Valores Aceitos</th>
            <th>Efeito na Interface</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>@tab "Nome"</code></td>
            <td>Texto com o nome da aba</td>
            <td>Inicia uma seção de aba; todos os módulos seguintes ficam dentro dela até o próximo <code>@tab</code>.</td>
          </tr>
          <tr>
            <td><code>[tab: "Nome"]</code></td>
            <td>Em qualquer cabeçalho de módulo</td>
            <td>Envia um módulo específico para outra aba mesmo sem mudar a posição dele no arquivo.</td>
          </tr>
          <tr>
            <td><code>pos: "top" | "left" | "right" | "bottom" | "hidden"</code></td>
            <td>Em <code>@nav [...]</code></td>
            <td>Posiciona o menu de abas no topo, lateral esquerda, lateral direita, rodapé ou oculta a barra.</td>
          </tr>
          <tr>
            <td><code>align: "left" | "center" | "right" | "stretch"</code></td>
            <td>Em <code>@nav [...]</code></td>
            <td>Alinha os botões de aba ou faz cada aba esticar igualmente (<code>stretch</code>).</td>
          </tr>
          <tr>
            <td><code>labels: true | false</code></td>
            <td>Em <code>@nav [...]</code></td>
            <td>Quando <code>false</code>, exibe apenas ícones numerados compactos para economizar espaço.</td>
          </tr>
        </tbody>
      </table>

      ${renderExamplePair({
        badge: '@nav + @tab (Topo)',
        title: 'Abas no Topo com Esticamento Uniforme (pos: "top", align: "stretch")',
        description:
          'Múltiplas abas declaradas com @tab e barra configurada no topo ocupando toda a largura.',
        dsl: `@nav [pos: "top", align: "stretch", labels: true]

@tab "1. Geral & Atributos"
@attr "Atributos" [col1, cards]
  FOR "Força" := 3
  DES "Destreza" := 2
@res "Vitalidade" [col2]
  PV "Vida": 28 / 28 [red]

@tab "2. Combate & Armas"
@stat "Combate" [col1]
  DEF "Defesa" = 12

@tab "3. Grimório"
@ability "Magias" [full]
  spell "Bola de Fogo" [cost: 3 PM]
    damage: 6d6

@tab "4. História & Notas"
@texto "Biografia" [full]
  Nascido nas montanhas do norte.`,
        showTabs: true,
        activeTab: '1. Geral & Atributos',
      })}

      ${renderExamplePair({
        badge: '@nav + @tab (Lateral)',
        title: 'Abas na Lateral Esquerda (pos: "left", labels: true)',
        description:
          'Quando pos: "left" ou pos: "right" é usado em @nav, a barra de abas vira uma coluna vertical ao lado dos módulos.',
        dsl: `@nav [pos: "left", labels: true]

@tab "Ficha Principal"
@attr "Atributos" [col1, list]
  FOR "Força"    := 1d8 [roll: self]
  AGI "Agilidade":= 1d6 [roll: self]
@stat "Status" [col2]
  DEF "Defesa" = 14

@tab "Inventário"
@inv [full]
  item "Lanterna" [weight: 1, qty: 1]

@tab "Anotações"
@texto "Pistas" [full]
  Investigar o armazém abandonado.`,
        showTabs: true,
        activeTab: 'Ficha Principal',
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 5: LAYOUT DE COLUNAS, DISPLAY, COLS E TALL                 -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 05</span>
        <h2 class="chapter-title">Posicionamento de Módulos: <code>col1</code>, <code>col2</code>, <code>full</code>, <code>cols: N</code> e <code>tall</code></h2>
        <span class="chapter-aliases">col1 • col2 • full • cards • list • pyramid • tall</span>
      </div>
      <p class="chapter-intro">
        Todo cabeçalho de módulo aceita tags de posicionamento e estilo dentro de <code>[...]</code>. A ficha agrupa módulos consecutivos de <code>col1</code> e <code>col2</code> em bandas lado a lado, e interrompe a banda sempre que encontra um módulo <code>full</code>.
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Tag / Propriedade</th>
            <th>Aliases Aceitos</th>
            <th>Comportamento Visual</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>col1</code> / <code>col2</code> / <code>full</code></td>
            <td><code>left</code>, <code>esquerda</code> / <code>right</code>, <code>direita</code> / <code>wide</code>, <code>inteiro</code></td>
            <td>Posiciona o módulo na coluna da esquerda (50%), coluna da direita (50%) ou largura total (100%).</td>
          </tr>
          <tr>
            <td><code>cards</code> / <code>list</code> / <code>pyramid</code></td>
            <td><code>cartoes</code>, <code>grid</code> / <code>lista</code>, <code>compact</code> / <code>piramide</code></td>
            <td>Altera a visualização interna do módulo entre grade de cartões, lista horizontal compacta ou pirâmide escalonada.</td>
          </tr>
          <tr>
            <td><code>cols: N</code></td>
            <td><code>colunas: N</code>, <code>columns: N</code></td>
            <td>Fixa exatamente <code>N</code> colunas na grade interna do módulo (ex.: <code>cols: 2</code>, <code>cols: 4</code>).</td>
          </tr>
          <tr>
            <td><code>tall</code></td>
            <td><code>alto</code>, <code>expandido</code></td>
            <td>Faz o card do módulo esticar para igualar a altura da coluna vizinha e empilha itens em coluna vertical quando aplicável, sem criar espaço morto vazio.</td>
          </tr>
        </tbody>
      </table>

      ${renderExamplePair({
        badge: 'Layout & Disposição',
        title: 'Combinação de col1 [tall], col2 e full com cols: 4',
        description:
          'À esquerda, @attr usa [col1, tall] para acompanhar a altura dos dois módulos da direita (@res + @stat em col2). Abaixo, @slots usa [full, cols: 4] para ocupar toda a largura em 4 colunas exatas.',
        dsl: `@attr "Atributos (col1 + tall)" [col1, cards, tall]
  FOR "Força"    := 3 [roll: 1d20 + self]
  AGI "Agilidade":= 2 [roll: 1d20 + self]
  INT "Intelecto":= 4 [roll: 1d20 + self]

@res "Recursos (col2)" [col2]
  PV "Vida": 30 / 30 [red]
  PM "Mana": 20 / 20 [blue]

@stat "Status Derivados (col2)" [col2, cols: 2]
  DEF "Defesa" = 10 + AGI
  Iniciativa = AGI [roll: 1d20 + self]

@slots "Cinto Tático em Largura Total (full + cols: 4)" [full, cols: 4]
  s1 "Poção de Vida": 1/1 [state: filled]
  s2 "Bomba de Fumaça": 1/1 [state: filled]
  s3 "Arpéu": 1/1 [state: damaged]
  s4 "Slot Extra" [state: empty]`,
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 6: MÓDULO @profile                                         -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 06</span>
        <h2 class="chapter-title">Módulo <code>@profile</code>: Retrato, Identidade e Biografia</h2>
        <span class="chapter-aliases">@profile • @perfil • @retrato</span>
      </div>
      <p class="chapter-intro">
        Exibe o card de identificação do personagem com retrato, nome, arquétipo, nível, descrição biográfica e quaisquer campos adicionais declarados como <code>Chave: "Valor"</code>.
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Configuração / Campo</th>
            <th>Opções</th>
            <th>Efeito Visual</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tamanho da Imagem no Cabeçalho</td>
            <td><code>sm</code>, <code>md</code>, <code>lg</code>, <code>banner</code></td>
            <td>Define o tamanho da moldura do retrato (pequeno, médio, grande ou faixa horizontal de capa).</td>
          </tr>
          <tr>
            <td>Disposição do Texto</td>
            <td><code>side</code>, <code>bottom</code>, <code>none</code></td>
            <td>Posiciona os dados ao lado da imagem (<code>side</code>), abaixo da imagem (<code>bottom</code>) ou exibe apenas a imagem (<code>none</code>).</td>
          </tr>
          <tr>
            <td>Enquadramento da Imagem</td>
            <td><code>cover</code>, <code>contain</code></td>
            <td>Preenche todo o quadro (<code>cover</code>) ou exibe a imagem inteira sem corte (<code>contain</code>).</td>
          </tr>
          <tr>
            <td>Campos Internos</td>
            <td><code>image</code>, <code>archetype</code>, <code>level</code>, <code>system</code>, <code>desc</code> + Campos Livres</td>
            <td>Qualquer propriedade extra (ex.: <code>Origem: "Acadêmico"</code>, <code>Patente: "Operador"</code>) vira uma etiqueta no perfil.</td>
          </tr>
        </tbody>
      </table>

      ${renderExamplePair({
        badge: '@profile',
        title: 'Comparativo: Retrato Lateral [col1, md, side] vs Banner de Capa [col2, banner, bottom]',
        description:
          'Dois blocos @profile demonstrando a disposição lateral clássica com campos extras e o formato banner com texto abaixo.',
        dsl: `@profile "Helena Vasconcelos" [col1, md, side]
  archetype: "Especialista • Médica de Campo"
  level: 5
  system: "Ordem Paranormal"
  Origem: "Profissional da Saúde"
  Patente: "Agente Especial"
  desc: "Veterana de três operações críticas, sempre carrega seu kit cirúrgico modificado."

@profile " Barão Malakor" [col2, banner, bottom]
  archetype: "Guerreiro da Corte Sombria"
  level: 8
  Reino: "Valacria"
  Divindade: "Arsenal"
  desc: "Comandante da guarda blindada do norte."`,
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 7: MÓDULO @attr (ATRIBUTOS NUMÉRICOS, DADOS E PIRÂMIDE)    -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 07</span>
        <h2 class="chapter-title">Módulo <code>@attr</code>: Atributos Numéricos, Atributos por Dados (<code>d6</code>, <code>1d8</code>) e Modos Visuais</h2>
        <span class="chapter-aliases">@attr • @attributes • @atributos</span>
      </div>
      <p class="chapter-intro">
        <code>@attr</code> declara os atributos primários do personagem. Eles podem ser <strong>numéricos</strong> (ex.: <code>FOR := 3</code> ou <code>FOR := 16</code> com sub-modificador) ou <strong>baseados diretamente em Dados</strong> (ex.: <code>FOR := 1d6</code>, <code>AGI := d8</code>, <code>INT := 2d6</code>) usando <code>self</code> na rolagem.
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Padrão de Sintaxe em <code>@attr</code></th>
            <th>Exemplo de Código</th>
            <th>O que acontece ao clicar em Rolar</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Atributo por Dado Puro (Step Die ou NdX)</strong></td>
            <td><code>FOR "Força" := 1d6 [roll: self]</code><br/><code>AGI "Agilidade" := d8</code></td>
            <td>Envia exatamente <code>1d6</code> ou <code>1d8</code> para a bandeja de dados (sem injetar <code>1d20</code>). Os botões <code>-</code>/<code>+</code> escalonam <code>d4 ↔ d6 ↔ d8 ↔ d10 ↔ d12 ↔ d20</code>.</td>
          </tr>
          <tr>
            <td><strong>Atributo por Dado + Bônus</strong></td>
            <td><code>INT "Intelecto" := 2d6 [roll: self + 2]</code></td>
            <td>Rola os dados do próprio atributo somando o modificador: <code>2d6 + 2</code>.</td>
          </tr>
          <tr>
            <td><strong>Parada de Dados (Pool Keep Highest)</strong></td>
            <td><code>PRE "Presença" := 3 [roll: "(self)d20kh1"]</code></td>
            <td>Rola <code>3d20</code> mantendo o maior (e se o atributo for <code>0</code>, aplica automaticamente a regra <code>2d20kl1</code> mantendo o menor).</td>
          </tr>
          <tr>
            <td><strong>Atributo com Sub-Propriedade (D&D / T20)</strong></td>
            <td><code>FOR "Força" := 16 [mod: floor((self - 10) / 2), roll: 1d20 + FOR.mod]</code></td>
            <td>Exibe o valor principal <code>16</code> e o sub-badge <code>MOD: 3</code> dentro do card, permitindo referenciar <code>FOR.mod</code> em toda a ficha.</td>
          </tr>
        </tbody>
      </table>

      ${renderExamplePair({
        badge: '@attr com Dados (self)',
        title: 'Atributos Definidos Diretamente por Dados (d4, 1d6, d8, 1d10, 2d6) + Rolagem com self',
        description:
          'Sistemas como Savage Worlds, Kids on Bikes, Ryuutama ou sistemas autorais onde o atributo é um dado. O uso de [roll: self] (ou sem [roll]) rola exatamente o dado do atributo.',
        dsl: `@attr "Atributos por Dados (Step Dice & NdX)" [full, cards, cols: 5]
  FOR "Força"     := 1d6  [roll: self, cor: "red"]
  AGI "Agilidade" := d8   [roll: self, cor: "emerald"]
  VIG "Vigor"     := 1d10 [roll: self, cor: "amber"]
  INT "Intelecto" := d12  [roll: self + 1, cor: "blue"]
  ESP "Espírito"  := 2d6  [roll: self, cor: "purple"]`,
      })}

      ${renderExamplePair({
        badge: '@attr Modos Visuais',
        title: 'Sub-Modificadores (FOR.mod), Modo Pirâmide [pyramid] e Modo Lista [list]',
        description:
          'Múltiplos blocos @attr na mesma aba demonstrando sub-valores calculados (mod dentro do card), disposição em Pirâmide ([pyramid]) e Lista Compacta ([list]).',
        dsl: `@attr "Atributos Clássicos com Sub-Modificador (cards)" [col1, cards, cols: 2]
  FOR "Força"     := 16 [mod: floor((self - 10) / 2), roll: 1d20 + FOR.mod]
  DES "Destreza"  := 14 [mod: floor((self - 10) / 2), roll: 1d20 + DES.mod]

@attr "Atributos em Pirâmide [pyramid]" [col2, pyramid]
  Mente "Mente"   := 4 [roll: (self)d20kh1]
  Corpo "Corpo"   := 3 [roll: (self)d20kh1]
  Alma  "Alma"    := 2 [roll: (self)d20kh1]

@attr "Atributos em Lista Compacta [list]" [full, list]
  Fisico "Físico" := 1d8 [roll: self]
  Social "Social" := 1d6 [roll: self]
  Mental "Mental" := 1d10 [roll: self]`,
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 8: MÓDULO @stat (STATUS DERIVADOS E DEFESAS)               -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 08</span>
        <h2 class="chapter-title">Módulo <code>@stat</code>: Status Derivados, Fórmulas, Rolagens e Travas (<code>!lock</code>)</h2>
        <span class="chapter-aliases">@stat • @stats • @derived • @status • @combat</span>
      </div>
      <p class="chapter-intro">
        <code>@stat</code> armazena valores secundários, defesas, deslocamento, iniciativa ou dados de dano bônus. Suporta fórmulas automáticas (<code>=</code>), valores editáveis (<code>:=</code>), travas contra efeitos (<code>:!</code> ou <code>[!lock]</code>) e rolagens diretas (<code>[roll: ...]</code>).
      </p>

      ${renderExamplePair({
        badge: '@stat',
        title: 'Status Derivados em Cartões [cards] vs Lista [list] com Rolagem e !lock',
        description:
          'DEF e DT_Magia são calculadas automaticamente por fórmula; Iniciativa e DanoMarcial possuem botão de rolagem direta; RD está travada com !lock.',
        dsl: `@attr "Base" [col1, list]
  AGI "Agilidade" := 3
  INT "Intelecto" := 4

@stat "Status de Combate [cards]" [col1, cards, cols: 2]
  DEF "Defesa" = 10 + AGI * 2
  Iniciativa "Iniciativa" = AGI [roll: 1d20 + self]
  DanoMarcial "Dado Marcial" := 1d8 [roll: self]
  RD "Redução Física" := 5 [!lock]

@stat "Status em Lista [list]" [col2, list]
  DT_Magia "DT de Magias" = 10 + INT + level
  Deslocamento "Deslocamento (m)" := 9
  Passiva "Percepção Passiva" = 10 + INT`,
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 9: MÓDULO @res (OS 6 CONSTRUTORES DE RECURSOS)             -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 09</span>
        <h2 class="chapter-title">Módulo <code>@res</code>: Os 6 Construtores de Recursos (<code>bar</code>, <code>track</code>, <code>clock</code>, <code>slots</code>, <code>pool</code>, <code>counter</code>)</h2>
        <span class="chapter-aliases">@res • @resources • @recursos • @vitals • @bars</span>
      </div>
      <p class="chapter-intro">
        <code>@res</code> gerencia todos os recursos consumíveis ou progressivos da ficha. Cada linha pode usar um dos <strong>6 construtores nativos</strong> abaixo:
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Construtor</th>
            <th>Sintaxe em <code>@res</code></th>
            <th>Comportamento na Interface Visual</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Barra de Progresso</strong></td>
            <td><code>PV "Vida": 24 / (20 + VIG * 2) [red, temp: 4]</code><br/>ou <code>PV: bar(24, 24)</code></td>
            <td>Barra preenchida com porcentagem, badge de pontos temporários (<code>+4 TEMP</code>), clique no valor para digitar e botões rápidos <code>-5</code>, <code>-1</code>, <code>+1</code>, <code>+5</code>.</td>
          </tr>
          <tr>
            <td><strong>2. Trilha de Estados (Track)</strong></td>
            <td><code>Ferimentos: track(4, [".", "/", "X"]) [red]</code></td>
            <td>Caixas clicáveis que ciclam entre os estados definidos no array (ex.: vazio <code>.</code> → superficial <code>/</code> → letal <code>X</code>).</td>
          </tr>
          <tr>
            <td><strong>3. Relógio Circular (Clock)</strong></td>
            <td><code>Tensao "Tensão": clock(3 / 6) [amber]</code></td>
            <td>Relógio SVG fatiado interativo com botões <code>-1</code> e <code>+1</code>.</td>
          </tr>
          <tr>
            <td><strong>4. Slots Clicáveis</strong></td>
            <td><code>Sorte "Pontos de Sorte": slots(2 / 3) [emerald]</code></td>
            <td>Fileira de marcadores individuais clicáveis para marcar/desmarcar usos.</td>
          </tr>
          <tr>
            <td><strong>5. Parada de Dados (Pool)</strong></td>
            <td><code>DadosFe "Dados de Fé": pool(3d8) [purple]</code></td>
            <td>Reserva de dados consumíveis com botão integrado <strong>"Rolar 3d8"</strong> que lança a quantidade atual de dados na bandeja.</td>
          </tr>
          <tr>
            <td><strong>6. Contador Livre (Unbounded)</strong></td>
            <td><code>XP "Experiência": counter(1450) [cyan]</code></td>
            <td>Contador numérico livre sem barra e sem teto máximo, com botões <code>-5</code>, <code>-1</code>, <code>+1</code>, <code>+5</code>.</td>
          </tr>
        </tbody>
      </table>

      ${renderExamplePair({
        badge: '@res (6 Construtores)',
        title: 'Todos os 6 Tipos de Recursos em @res Renderizados Simultaneamente',
        description:
          'Demonstração visual dos 6 construtores de @res: Barra com Temp (PV), Trilha Multi-Estado (Ferimentos), Relógio (Tensão), Slots (Sorte), Pool de Dados Rolável (Dados de Fé) e Contador Sem Teto (Ouro/XP).',
        dsl: `@res "Painel Completo dos 6 Construtores de @res" [full, cols: 3]
  PV "Pontos de Vida": 18 / 24 [red, temp: 5]
  Ferimentos "Trilha de Dano": track(4, [".", "/", "X"]) [red]
  Tensao "Relógio de Crise": clock(4 / 6) [amber]
  Sorte "Bênçãos Diárias": slots(2 / 3) [emerald]
  DadosFe "Dados de Fé (Pool)": pool(3d8) [purple]
  XP "Experiência Acumulada": counter(1250) [cyan]`,
        runtimeOverrides: {
          resources: {
            Ferimentos: { current: 2, trackStates: ['X', '/', '.', '.'] },
          },
        },
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 10: MÓDULO @turn E CONVERSÕES (convert)                    -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 10</span>
        <h2 class="chapter-title">Módulo <code>@turn</code>: Economia de Ações e Ações Compostas (<code>convert</code>)</h2>
        <span class="chapter-aliases">@turn • @economy • @turno • @acoes</span>
      </div>
      <p class="chapter-intro">
        <code>@turn</code> controla as ações disponíveis por rodada/cena e permite declarar <strong>ações compostas</strong> usando <code>convert "Nome" -> N slot1, M slot2</code>. Ao clicar no botão gerado pelo <code>convert</code>, o sistema desconta todos os slots exigidos de uma só vez.
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Elemento em <code>@turn</code></th>
            <th>Sintaxe</th>
            <th>Funcionamento Direto</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Política de Recarga</td>
            <td><code>@turn [reset: "round" | "scene" | "turn" | "session"]</code></td>
            <td>Indica o ciclo de renovação das ações no botão <strong>Resetar</strong>.</td>
          </tr>
          <tr>
            <td>Slot de Ação</td>
            <td><code>padrao "Padrão": slots(1 / 1)</code></td>
            <td>Cria um botão de ação clicável na barra de turno (clique consome 1 uso; quando chega a 0 fica riscado).</td>
          </tr>
          <tr>
            <td>Ação Composta (<code>convert</code>)</td>
            <td><code>convert "Ação Completa" -> 1 padrao, 1 movimento</code></td>
            <td>Cria um botão na linha <strong>Compostas:</strong> que gasta simultaneamente <code>1 Padrão + 1 Movimento</code>. Se qualquer um dos dois já tiver sido gasto, o botão composto fica desabilitado automaticamente.</td>
          </tr>
        </tbody>
      </table>

      ${renderExamplePair({
        badge: '@turn + convert (Disponível)',
        title: '1. Turno com Todas as Ações Disponíveis (Botões convert Habilitados)',
        description:
          'Como Padrão (1/1), Movimento (1/1) e Reação (2/2) têm saldo disponível, os botões "Ação Completa (-1 Padrão + 1 Movimento)" e "Defesa Total (-1 Padrão + 1 Reação)" ficam ativos em âmbar.',
        dsl: `@turn [full, reset: "round"]
  padrao "Padrão": slots(1 / 1)
  movimento "Movimento": slots(1 / 1)
  reacao "Reação": slots(2 / 2)
  livre "Livre": slots(1 / 1)
  convert "Ação Completa" -> 1 padrao, 1 movimento
  convert "Defesa Total" -> 1 padrao, 1 reacao`,
      })}

      ${renderExamplePair({
        badge: '@turn + convert (Gasto)',
        title: '2. Após Clicar em "Ação Completa" (Desconta Padrão + Movimento Juntos e Risca o Botão)',
        description:
          'Após acionar "Ação Completa", tanto Padrão (0/1) quanto Movimento (0/1) foram zerados simultaneamente, e os botões compostos que dependem deles ficam automaticamente desabilitados e riscados até clicar em Resetar.',
        dsl: `@turn [full, reset: "round"]
  padrao "Padrão": slots(1 / 1)
  movimento "Movimento": slots(1 / 1)
  reacao "Reação": slots(2 / 2)
  livre "Livre": slots(1 / 1)
  convert "Ação Completa" -> 1 padrao, 1 movimento
  convert "Defesa Total" -> 1 padrao, 1 reacao`,
        runtimeOverrides: {
          turnSlots: {
            padrao: { current: 0 },
            movimento: { current: 0 },
          },
        },
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 11: MÓDULOS @rank E @skill (PERÍCIAS)                      -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 11</span>
        <h2 class="chapter-title">Módulos <code>@rank</code> e <code>@skill</code>: Graus de Treinamento e Perícias</h2>
        <span class="chapter-aliases">@rank / @graus • @skill / @skills / @pericias</span>
      </div>
      <p class="chapter-intro">
        <code>@rank</code> cria tabelas nomeadas de graus de treinamento (ex.: <code>destreinado = 0</code>, <code>treinado = 5</code>). <code>@skill</code> declara as perícias do personagem vinculadas a um atributo-base <code>(ATTR)</code>, suportando tanto bônus numéricos quanto <strong>perícias baseadas em dados</strong> (ex.: <code>Luta (FOR) := d8</code>).
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Sintaxe em <code>@skill</code></th>
            <th>Exemplo</th>
            <th>Como a Rolagem é Resolvida</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Fórmula Padrão no Cabeçalho</td>
            <td><code>@skill [roll: 1d20 + attr + self]</code></td>
            <td>Aplica a fórmula a todas as perícias do bloco, substituindo <code>attr</code> pelo atributo-base e <code>self</code> pelo bônus/dado da perícia.</td>
          </tr>
          <tr>
            <td>Perícia usando <code>@rank</code></td>
            <td><code>Luta (FOR) = treinado</code></td>
            <td>Lê o valor do grau <code>treinado</code> declarado em <code>@rank</code> e permite trocar o grau pelo seletor na interface.</td>
          </tr>
          <tr>
            <td>Perícia Definida por Dado</td>
            <td><code>Pontaria (AGI) := d8 [roll: attr + self]</code></td>
            <td>Exibe <code>d8</code> no badge da perícia e rola o dado do atributo + o dado da perícia (ex.: <code>1d6 + 1d8</code>).</td>
          </tr>
          <tr>
            <td>Subpropriedade de Perícia</td>
            <td><code>Percepcao (SAB) := 5</code><br/><code>&nbsp;&nbsp;passiva = 10 + self</code></td>
            <td>Calcula e exibe <code>passiva: 15</code> no card da perícia e registra o símbolo <code>Percepcao.passiva</code>.</td>
          </tr>
        </tbody>
      </table>

      ${renderExamplePair({
        badge: '@rank + @skill',
        title: 'Perícias em Lista [list] com @rank vs Perícias em Cartões [cards] com Dados (d6, d8)',
        description:
          'À esquerda, perícias usando graus de @rank em lista compacta. À direita, perícias em modo [cards] misturando bônus numéricos, dados escalonados (d6, d8) e sub-propriedades.',
        dsl: `@rank treino
  destreinado = 0
  treinado = 5
  veterano = 10
  expert = 15

@attr "Atributos" [full, list]
  FOR "Força" := 1d6 [roll: self]
  AGI "Agilidade" := 3
  INT "Intelecto" := 4

@skill "Perícias com @rank [list]" [col1, list, roll: (attr)d20kh1 + self]
  Acrobacia (AGI) = treinado
  Furtividade (AGI) = veterano
  Ocultismo (INT) = expert
  Atletismo (FOR) = destreinado [!lock]

@skill "Perícias em Cartões & Dados [cards]" [col2, cards, roll: attr + self]
  Luta "Combate Corpo a Corpo" (FOR) := d8
  Investigacao "Investigação" (INT) := 4 [roll: 1d20 + attr + self]
    passiva = 10 + self`,
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 12: MÓDULO @inv (INVENTÁRIO, CARGA, ARMAS E !consumable)   -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 12</span>
        <h2 class="chapter-title">Módulo <code>@inv</code>: Inventário, Carga, Equipamentos, Armas e <code>!consumable</code></h2>
        <span class="chapter-aliases">@inv • @inventory • @inventario • @equip</span>
      </div>
      <p class="chapter-intro">
        <code>@inv</code> calcula automaticamente o peso total carregado, aplica regras de sobrecarga, ativa efeitos passivos quando um item está <code>!equipped</code>, gera botões de <strong>Teste</strong> e <strong>Dano</strong> para sub-ações (<code>action</code>) e adiciona o botão <strong>Consumir (-1)</strong> para itens com a flag <code>!consumable</code>.
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Flag / Propriedade de <code>item</code></th>
            <th>Sintaxe</th>
            <th>Comportamento Exato</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>!equipped</code> / <code>!carried</code> / <code>!stash</code></td>
            <td>Estado do item (clicável na UI)</td>
            <td><strong>Equipado</strong>: soma peso na carga e <strong>ativa os efeitos passivos</strong> do item.<br/><strong>Mochila (<code>!carried</code>)</strong>: soma peso, mas não ativa bônus de equipado.<br/><strong>Reserva (<code>!stash</code>)</strong>: guardado fora do corpo — <strong>peso 0 na carga</strong>.</td>
          </tr>
          <tr>
            <td><code>!consumable</code> (ou <code>!consumivel</code>)</td>
            <td><code>item "Poção" [qty: 3, !consumable]</code></td>
            <td>Exibe o botão <strong>Consumir (-1)</strong> no card do item, reduzindo <code>qty</code> em 1 a cada clique.</td>
          </tr>
          <tr>
            <td><code>weight: N</code>, <code>qty: N</code>, <code>category: N</code></td>
            <td>Dentro de <code>[...]</code> do item</td>
            <td>Define peso unitário (peso total = <code>weight * qty</code>), quantidade e categoria/prestígio (exibido em algarismos romanos: Cat. I, II, III...).</td>
          </tr>
          <tr>
            <td><code>action "Nome" [type: "Padrão"]</code></td>
            <td>Sub-bloco dentro de <code>item</code></td>
            <td>Aceita <code>test: fórmula</code> (ou perícia) e <code>damage: fórmula</code>, criando botões clicáveis de rolagem dentro do item.</td>
          </tr>
        </tbody>
      </table>

      ${renderExamplePair({
        badge: '@inv Completo',
        title: 'Barra de Carga, Arma com Ações de Teste/Dano, Armadura Reativa, !consumable e !stash',
        description:
          'A Katana equipada exibe seus botões de Teste e Dano; o Colete equipado aplica +2 na Defesa; o Kit Médico possui !consumable (exibindo o botão Consumir -1); a Mochila de Acampamento está em !stash (não soma na carga).',
        dsl: `@attr [col1, list]
  FOR "Força" := 2
  AGI "Agilidade" := 3

@stat [col2, list]
  DEF "Defesa" = 10 + AGI

@inv "Inventário & Equipamento Tático" [full]
  unit = "espaços"
  max_load = 5 + FOR * 5
  overload_limit = max_load * 2
  rule load() > max_load -> DEF -= 2

  item "Katana Cerimonial" [weight: 2, qty: 1, category: 2, !equipped, #arma, #corte]
    desc: "Lâmina dobrada artesanalmente. Concede +1 em Defesa quando empunhada."
    effect: DEF += 1
    action "Corte Rápido" [type: "Padrão"]
      test: 1d20 + AGI + 5
      damage: 1d10 + AGI
    action "Golpe Letal" [type: "Completa"]
      test: 2d20kh1 + AGI + 5
      damage: 2d10 + AGI + 4

  item "Colete Balístico Leve" [weight: 2, qty: 1, category: 1, !equipped, #armadura]
    desc: "Proteção tática ocultável."
    effect: DEF += 2

  item "Cicatrizante Acelerado" [weight: 1, qty: 3, !carried, !consumable]
    desc: "Spray regenerativo. Recupera 2d8+2 PV ao aplicar."
    damage: 2d8 + 2

  item "Caixa de Suprimentos Pesada" [weight: 8, qty: 1, !stash]
    desc: "Guardada no porta-malas da van (não conta na carga atual)."`,
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 13: MÓDULO @ability (HABILIDADES, MAGIAS, ENHANCE, BANDS)  -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 13</span>
        <h2 class="chapter-title">Módulo <code>@ability</code>: Habilidades, Magias, Aprimoramentos (<code>enhance</code>), Toggles e Faixas</h2>
        <span class="chapter-aliases">@ability • @abilities • @habilidades • @spells • @rituals • @moves</span>
      </div>
      <p class="chapter-intro">
        <code>@ability</code> modela poderes de classe, magias, rituais e movimentos narrativos. Ele desconta recursos automaticamente ao clicar em <strong>Usar (-Custo)</strong>, alterna buffs sustentados via <code>when active -> ...</code>, soma custos de aprimoramentos (<code>enhance</code>) selecionados e exibe faixas de sucesso (<code>>= 10</code>, <code>7..9</code>, <code><= 6</code>).
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Recurso de <code>@ability</code></th>
            <th>Sintaxe</th>
            <th>Resultado na Interface</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Categorias de Declaração</td>
            <td><code>ability</code>, <code>action</code>, <code>spell</code>, <code>ritual</code>, <code>move</code>, <code>passive</code>, <code>reaction</code></td>
            <td>Define a categoria semântica da habilidade no bloco.</td>
          </tr>
          <tr>
            <td>Custo de Recurso</td>
            <td><code>[cost: 2 PM]</code> ou <code>[cost: 2, resource: "PM"]</code></td>
            <td>Cria o botão <strong>Usar (-2 PM)</strong> que deduz diretamente da barra <code>PM</code> em <code>@res</code> (e avisa se o saldo for insuficiente).</td>
          </tr>
          <tr>
            <td>Efeito Sustentado / Toggle</td>
            <td><code>[active: true]</code> + <code>when active -> DEF += 2</code></td>
            <td>Cria o botão <strong>Ativo / Ativar</strong> que aplica ou remove os efeitos sobre a ficha em tempo real.</td>
          </tr>
          <tr>
            <td>Aprimoramentos (<code>enhance</code>)</td>
            <td><code>enhance "Discente (+3 PM)" [cost: 3, requires: "2º Círculo"]</code></td>
            <td>Cria caixas de seleção clicáveis dentro da magia; marcar um aprimoramento soma o custo dele no botão <strong>Usar</strong> e atualiza a rolagem de dano!</td>
          </tr>
          <tr>
            <td>Faixas de Resultado (Bands)</td>
            <td><code>>= 10: "Sucesso Total"</code><br/><code>7..9: "Sucesso Parcial"</code><br/><code><= 6: "Falha"</code></td>
            <td>Renderiza a tabela de faixas de resolução (estilo PbtA / Dungeon World) dentro do card da habilidade.</td>
          </tr>
        </tbody>
      </table>

      ${renderExamplePair({
        badge: '@ability Completo',
        title: 'Habilidade Sustentada (when active), Ritual com Aprimoramentos (enhance) e Movimento com Faixas',
        description:
          'Três habilidades demonstrando todos os recursos de @ability: toggle ativo alterando a Defesa, ritual com aprimoramentos de custo cumulativo e movimento com faixas de sucesso >= 10, 7..9 e <= 6.',
        dsl: `@res [full, cols: 2]
  PV "Vida": 30 / 30 [red]
  PE "Pontos de Esforço": 15 / 15 [amber]

@stat [full, list]
  DEF "Defesa" = 12
  Ataque "Ataque" = 5

@ability "Habilidades, Rituais & Movimentos" [full]
  ability "Fúria de Batalha" [type: "Livre", cost: 2 PE, active: true, #combate]
    desc: "Enquanto sustentada, concede +2 na Defesa e +3 em Ataque."
    when active -> DEF += 2; Ataque += 3

  ritual "Decadência" [type: "Padrão", cost: 1 PE, range: "Toque", duration: "Instantânea", resistance: "Fortitude reduz à metade", #morte]
    desc: "Espirais de cinza corroem o alvo causando dano de Morte."
    damage: 2d8 + 2
    enhance "Discente (+2 PE)" [cost: 2, requires: "2º Círculo"]
      desc: "Muda a resistência para nenhuma e realiza um ataque corpo a corpo junto ao ritual."
      damage: 3d8 + 3
    enhance "Verdadeiro (+5 PE)" [cost: 5, requires: "3º Círculo e Afinidade"]
      desc: "Muda o alcance para curto e afeta todos os inimigos na área."
      damage: 5d8 + 5

  move "Canalizar o Véu" [type: "Padrão", cost: 1 PE]
    desc: "Role 2d6 + Presença para dobrar a realidade local."
    roll: 2d6 + 3
    >= 10: "Sucesso Pleno: O efeito ocorre sem custos colaterais."
    7..9: "Sucesso Parcial: Escolha 1 complicação menor."
    <= 6: "Falha Crítica: O Véu reage contra você."
    choices:
      - "Atrair atenção de uma entidade próxima"
      - "Sofrer 1d4 de dano mental"
      - "Consumir +1 PE adicional"`,
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 14: MÓDULOS @counter E @slots                              -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 14</span>
        <h2 class="chapter-title">Módulos <code>@counter</code> (Contadores & Relógios) e <code>@slots</code> (Escaninhos & Condições)</h2>
        <span class="chapter-aliases">@counter / @relogios • @slots / @escaninhos</span>
      </div>
      <p class="chapter-intro">
        <code>@counter</code> cria contadores visuais interativos nos estilos <code>segments</code> (barras), <code>dots</code> (pontos) ou <code>pie</code> (relógio fatiado). <code>@slots</code> cria grades de escaninhos clicáveis para inventário rápido (Mausritter/Year Zero), espaços de magia ou condições de status.
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Módulo</th>
            <th>Tags / Estados Suportados</th>
            <th>Interação na Interface</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>@counter</code></td>
            <td>Estilos: <code>segments</code>, <code>dots</code>, <code>pie</code> (ou <code>clock</code>)<br/>Cores: <code>amber</code>, <code>red</code>, <code>emerald</code>, <code>purple</code>, <code>blue</code>, <code>cyan</code>, <code>pink</code>, <code>orange</code>, <code>#hex</code></td>
            <td>Clicar em um segmento/ponto/fatia ou nos botões <code>-</code>/<code>+</code> altera o progresso atual.</td>
          </tr>
          <tr>
            <td><code>@slots</code></td>
            <td>Estados: <code>state: empty | filled | damaged | locked</code><br/>Extras: <code>double</code> (ocupa 2 colunas), <code>!condition</code> (marca de condição)</td>
            <td>Clicar no badge de estado alterna ciclicamente entre <strong>Vazio → Ocupado → Danificado → Bloqueado</strong>; clicar no título renomeia o escaninho.</td>
          </tr>
        </tbody>
      </table>

      ${renderExamplePair({
        badge: '@counter + @slots',
        title: 'Os 3 Estilos de @counter (segments, dots, pie) e Todos os Estados de @slots',
        description:
          'À esquerda, @counter com barras segmentadas, pontos e relógios circulares. À direita, @slots mostrando escaninhos preenchidos, vazios, danificados, bloqueados, duplos (double) e condições (!condition).',
        dsl: `@counter "Contadores & Relógios de Progresso" [col1, cols: 1]
  foco "Pontos de Foco": 3/5 [segments, cyan]
  municao "Munição Especial": 4/6 [dots, amber]
  ritual_relogio "Despertar da Relíquia": 5/8 [pie, purple]
  alarme "Nível de Alerta da Base": 2/4 [pie, red]

@slots "Escaninhos de Corpo & Condições" [col2, cols: 2]
  mao_dir "Espada Curta (Mão Hábil)": 3/3 [state: filled]
  mao_esq "Escudo de Madeira": 2/3 [state: damaged]
  armadura "Cota de Malha Pesada (2 Slots)": 4/4 [state: filled, double]
  mochila_1 "Tocha": 2/3 [state: filled]
  mochila_2 "Espaço Livre" [state: empty]
  ferimento "Exausto (Ocupa Slot)" [state: filled, !condition]
  bloqueado "Slot Trancado por Sobrecarga" [state: locked]`,
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 15: MÓDULO @desc (DESCRITORES E TAGS REATIVAS)             -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 15</span>
        <h2 class="chapter-title">Módulo <code>@desc</code>: Resistências, Sentidos, Aspectos e Tags Reativas</h2>
        <span class="chapter-aliases">@desc • @descriptors • @descritores • @aspects • @traits</span>
      </div>
      <p class="chapter-intro">
        <code>@desc</code> agrupa características descritivas (sentidos, resistências, imunidades, vulnerabilidades, aspectos) e <strong>tags/consequências reativas</strong> que podem ser ativadas ou desativadas na ficha para aplicar modificadores automáticos (<code>-></code>).
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Sintaxe em <code>@desc</code></th>
            <th>Exemplo</th>
            <th>Efeito na Interface</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Listas Rápidas por Categoria</td>
            <td><code>senses: ["Visão no Escuro", "Faro"]</code><br/><code>resistances: ["Corte 5", "Fogo 10"]</code><br/><code>immunities: ["Veneno"]</code><br/><code>vulnerabilities: ["Sangue"]</code></td>
            <td>Renderiza chips coloridos categorizados por tipo (Sentido em ciano, Resistência em esmeralda, Imunidade em azul, Vulnerabilidade em vermelho).</td>
          </tr>
          <tr>
            <td>Tag / Aspecto / Consequência Reativa</td>
            <td><code>tag "Inspirado" [active: true] -> Luta += 2; DEF += 2</code><br/><code>consequence "Costela Trincada" [active: true] -> FOR -= 1</code></td>
            <td>Exibe um card interativo com botão <strong>Ativo / Inativo</strong> e mostra exatamente os efeitos aplicados sobre os status da ficha.</td>
          </tr>
        </tbody>
      </table>

      ${renderExamplePair({
        badge: '@desc Reativo',
        title: 'Sentidos, Resistências, Imunidades, Vulnerabilidades e Tags Reativas Modificando Status',
        description:
          'Veja como a tag ativa "Bênção da Guerra" (+2 DEF, +2 FOR) e a consequência ativa "Braço Ferido" (-1 FOR) recalculam automaticamente FOR e DEF no módulo ao lado.',
        dsl: `@attr "Atributos Afetados por @desc" [col1, cards, cols: 2]
  FOR "Força" := 3 [roll: 1d20 + self]
  AGI "Agilidade" := 2 [roll: 1d20 + self]

@stat "Defesa Afetada" [col1, list]
  DEF "Defesa" = 10 + AGI

@desc "Descritores, Resistências & Condições Reativas" [col2]
  senses: ["Visão no Escuro 18m", "Percepção às Cegas"]
  resistances: ["Corte 5", "Perfuração 5", "Mental 10"]
  immunities: ["Medo", "Veneno"]
  vulnerabilities: ["Dano de Energia"]
  aspect "Juramento da Ordem: Nunca abandonar um aliado"
  tag "Bênção da Guerra" [active: true] -> DEF += 2; FOR += 2
  consequence "Braço Ferido" [active: true] -> FOR -= 1
  tag "Camuflagem Urbana" [active: false] -> DEF += 4`,
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 16: @diagram, @roll, @rule E @table                        -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 16</span>
        <h2 class="chapter-title">Módulos Avançados: <code>@diagram</code>, <code>@roll</code>, <code>@rule</code> e <code>@table</code></h2>
        <span class="chapter-aliases">@diagram • @roll / @resolve • @rule / @regras • @table / @tabela</span>
      </div>
      <p class="chapter-intro">
        Estes quatro módulos cobrem mecânicas avançadas de localização de dano anatômico, motores de resolução em faixas, regras globais condicionais e tabelas de progressão por nível.
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Módulo</th>
            <th>Sintaxe Principal</th>
            <th>O que faz na Ficha</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>@diagram</code></td>
            <td><code>@diagram corpo [layout: "humanoid", hit_roll: 1d10]</code><br/><code>&nbsp;&nbsp;node "Cabeça" [hit: 1..1, mult: 2]</code><br/><code>&nbsp;&nbsp;&nbsp;&nbsp;pv: 4 / 4</code><br/><code>&nbsp;&nbsp;&nbsp;&nbsp;armor: 2</code></td>
            <td>Renderiza o diagrama corporal com silhueta humanoide colorida por estado de dano, barras de PV/Armadura por parte do corpo e botão <strong>Sortear Localização</strong>.</td>
          </tr>
          <tr>
            <td><code>@roll</code> (ou <code>@resolve</code>)</td>
            <td><code>@roll PbtA(attr) = 2d6 + attr [title: "Resolução PbtA"]</code><br/><code>&nbsp;&nbsp;>= 10: "Sucesso Total"</code><br/><code>&nbsp;&nbsp;7..9: "Sucesso Parcial"</code><br/><code>&nbsp;&nbsp;<= 6: "Falha"</code></td>
            <td>Renderiza um painel de resolução global com botão <strong>Testar</strong> e todas as faixas de resultado e efeitos.</td>
          </tr>
          <tr>
            <td><code>@rule</code></td>
            <td><code>@rule "Regras de Combate"</code><br/><code>&nbsp;&nbsp;rule PV <= 10 -> DEF -= 2 #gravemente_ferido</code></td>
            <td>Avalia continuamente a condição booleana (ex.: <code>PV <= 10</code>); quando verdadeira, exibe <strong>ATIVA</strong> e aplica os efeitos automaticamente.</td>
          </tr>
          <tr>
            <td><code>@table</code> + <code>lookup()</code></td>
            <td><code>@table dado_marcial</code><br/><code>&nbsp;&nbsp;1..4 -> 4</code><br/><code>&nbsp;&nbsp;5..8 -> 6</code></td>
            <td>Define uma tabela de consulta usada em qualquer fórmula via <code>lookup(dado_marcial, level)</code>.</td>
          </tr>
        </tbody>
      </table>

      ${renderExamplePair({
        badge: '@diagram',
        title: 'Diagrama Corporal Anatômico (@diagram) com PV por Membro, Armadura e Sorteio de Acerto',
        description:
          'Cada parte do corpo possui sua faixa de acerto no d10, multiplicador de dano, armadura (AR) e barra de PV própria que altera a cor na silhueta conforme sofre dano.',
        dsl: `@diagram corpo "Anatomia & Dano Localizado" [full, layout: "humanoid", hit_roll: 1d10]
  node "Cabeça" [hit: 1..1, mult: 2]
    pv: 4 / 6
    armor: 2
  node "Torso" [hit: 2..5, mult: 1]
    pv: 12 / 12
    armor: 4
  node "Braço Direito" [hit: 6..6, mult: 1]
    pv: 2 / 6
    armor: 1
  node "Braço Esquerdo" [hit: 7..7, mult: 1]
    pv: 6 / 6
    armor: 1
  node "Perna Direita" [hit: 8..9, mult: 1]
    pv: 0 / 8
    armor: 2
  node "Perna Esquerda" [hit: 10..10, mult: 1]
    pv: 8 / 8
    armor: 2`,
      })}

      ${renderExamplePair({
        badge: '@roll + @rule + @table',
        title: 'Resolução em Faixas (@roll), Regras Condicionais Globais (@rule) e Consulta em Tabela (@table)',
        description:
          'Como PV está em 8/24 (abaixo da metade), a primeira regra condicional em @rule fica automaticamente ATIVA (verde) e reduz a Defesa em -2, enquanto a segunda regra (PV <= 3) permanece INATIVA.',
        dsl: `@meta "Teste de Regras" [level: 6]

@table bonus_proficiencia
  1..4 -> 2
  5..8 -> 3
  default -> 4

@res [col1]
  PV "Pontos de Vida": 8 / 24 [red]

@stat [col1, list]
  Proficiencia "Bônus da @table (Nível 6)" = lookup(bonus_proficiencia, level)
  DEF "Defesa (Afetada pela @rule)" = 14

@roll PbtA(attr) = 2d6 + attr [col2, title: "Motor de Resolução PbtA (2d6)"]
  >= 10 -> "Sucesso Pleno: Você alcança seu objetivo sem complicações."
  7..9  -> "Sucesso com Custo: O Mestre oferece uma escolha difícil."
  <= 6  -> "Falha: Prepare-se para o movimento do Mestre."

@rule "Regras Condicionais Automáticas" [col2]
  rule PV <= 12 -> DEF -= 2 #ferido
  rule PV <= 3  -> DEF -= 5 #morrendo`,
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 17: MÓDULO @texto E FUNÇÕES EMBUTIDAS                      -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 17</span>
        <h2 class="chapter-title">Módulo <code>@texto</code> e Todas as Funções Embutidas da DSL</h2>
        <span class="chapter-aliases">@texto / @notes • floor • clamp • lookup • has • load • if</span>
      </div>
      <p class="chapter-intro">
        <code>@texto</code> cria blocos de anotações livres editáveis diretamente na interface visual. Abaixo está a tabela completa de todas as funções matemáticas e condicionais nativas da SGM-SDL, seguida de um exemplo visual combinando ambas.
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Função Embutida</th>
            <th>Assinatura e Uso</th>
            <th>Retorno Exato</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>floor(x)</code> / <code>ceil(x)</code> / <code>round(x)</code></td>
            <td><code>floor((FOR - 10) / 2)</code></td>
            <td>Arredonda um número para baixo (<code>floor</code>), para cima (<code>ceil</code>) ou para o inteiro mais próximo (<code>round</code>).</td>
          </tr>
          <tr>
            <td><code>min(a, b)</code> / <code>max(a, b)</code> / <code>abs(x)</code></td>
            <td><code>max(FOR, AGI)</code></td>
            <td>Retorna o menor valor, o maior valor ou o valor absoluto sem sinal.</td>
          </tr>
          <tr>
            <td><code>clamp(valor, min, max)</code></td>
            <td><code>clamp(DEF, 10, 30)</code></td>
            <td>Garante que o resultado nunca fique abaixo de <code>min</code> nem acima de <code>max</code>.</td>
          </tr>
          <tr>
            <td><code>step(indice, d4, d6, d8, d10, d12)</code></td>
            <td><code>step(FOR, d4, d6, d8, d10, d12)</code></td>
            <td>Seleciona um dado ou valor de uma lista escalonada conforme o índice (1º item = índice 1).</td>
          </tr>
          <tr>
            <td><code>lookup(id_tabela, chave)</code></td>
            <td><code>lookup(bonus_nivel, level)</code></td>
            <td>Procura <code>chave</code> nas linhas e faixas (<code>1..4</code>) de um bloco <code>@table</code> e retorna o resultado correspondente.</td>
          </tr>
          <tr>
            <td><code>load()</code> / <code>slots()</code></td>
            <td><code>load()</code></td>
            <td>Retorna a carga/peso total atual calculada a partir dos itens equipados e carregados em <code>@inv</code>.</td>
          </tr>
          <tr>
            <td><code>has("Nome ou ID do Item")</code></td>
            <td><code>has("Escudo Pesado")</code></td>
            <td>Retorna <code>1</code> (verdadeiro) se o personagem possui o item no inventário (com <code>qty > 0</code> e fora de <code>!stash</code>), ou <code>0</code> caso contrário.</td>
          </tr>
          <tr>
            <td><code>if(cond, entao, senao)</code> ou <code>cond ? a : b</code></td>
            <td><code>if(has("Escudo"), 12, 10)</code></td>
            <td>Retorna o segundo argumento se a condição for verdadeira, ou o terceiro argumento se for falsa.</td>
          </tr>
        </tbody>
      </table>

      ${renderExamplePair({
        badge: '@texto + Funções',
        title: 'Funções Matemáticas e Condicionais (floor, max, clamp, has, load, if) + Bloco @texto',
        description:
          'Demonstração ao vivo das funções calculando atributos derivados com base nos itens do inventário (has e load) ao lado de um bloco @texto.',
        dsl: `@attr [col1, list]
  FOR "Força" := 16
  AGI "Agilidade" := 18

@inv [col1]
  max_load = 10
  item "Escudo Torre" [weight: 3, qty: 1, !equipped]

@stat "Status Calculados com Funções da DSL" [col2, cards, cols: 2]
  ModFOR "floor((FOR-10)/2)" = floor((FOR - 10) / 2)
  Melhor "max(FOR, AGI)" = max(FOR, AGI)
  BonusEscudo "if(has('Escudo Torre'), 4, 0)" = if(has("Escudo Torre"), 4, 0)
  CargaAtual "Função load()" = load()

@texto "Diário de Campanha & Notas da Sessão" [col2]
  Sessão 12 - Atravessamos o Passo da Serpente.
  - Chave rúnica encontrada no altar subterrâneo.
  - Lembrar de renovar provisões antes de entrar na cidadela.`,
      })}
    </section>

    <!-- =================================================================== -->
    <!-- CAPÍTULO 18: DICIONÁRIO GERAL DE MÓDULOS, ALIASES, TAGS E FLAGS     -->
    <!-- =================================================================== -->
    <section class="chapter page-break">
      <div class="chapter-header">
        <span class="chapter-num">CAPÍTULO 18</span>
        <h2 class="chapter-title">Dicionário Geral de Todos os Módulos (<code>@</code>), Aliases, Flags (<code>!</code>) e Tags (<code>#</code>)</h2>
        <span class="chapter-aliases">Referência Rápida Completa</span>
      </div>
      <p class="chapter-intro">
        Tabela de consulta rápida com todos os módulos da SGM-SDL, seus aliases em Português e Inglês, e todas as flags/tags especiais reconhecidas pelo compilador.
      </p>
      <table class="ref-table">
        <thead>
          <tr>
            <th>Diretiva Principal</th>
            <th>Aliases Aceitos (PT-BR / EN)</th>
            <th>Finalidade Direta</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>@meta</code></td>
            <td><code>@ficha</code>, <code>@character</code>, <code>@personagem</code></td>
            <td>Define nome, arquétipo, sistema, nível (<code>level</code>) e tema base da ficha.</td>
          </tr>
          <tr>
            <td><code>@tema</code></td>
            <td><code>@theme</code></td>
            <td>Define cores hexadecimais customizadas (<code>cor</code>, <code>bg</code>, <code>card</code>, <code>border</code>, <code>item</code>, <code>text</code>).</td>
          </tr>
          <tr>
            <td><code>@nav</code></td>
            <td><code>@navegacao</code>, <code>@tabs_nav</code></td>
            <td>Configura posição (<code>top</code>, <code>left</code>, <code>right</code>, <code>bottom</code>, <code>hidden</code>), alinhamento e rótulos das abas.</td>
          </tr>
          <tr>
            <td><code>@tab</code></td>
            <td><code>@aba</code>, <code>@secao</code>, <code>@section</code></td>
            <td>Cria ou alterna para uma aba da ficha.</td>
          </tr>
          <tr>
            <td><code>@profile</code></td>
            <td><code>@perfil</code>, <code>@retrato</code></td>
            <td>Card de retrato, arquétipo, nível, biografia e metadados extras.</td>
          </tr>
          <tr>
            <td><code>@attr</code></td>
            <td><code>@attributes</code>, <code>@atributos</code></td>
            <td>Atributos primários (numéricos ou baseados em dados como <code>1d6</code>, <code>d8</code>).</td>
          </tr>
          <tr>
            <td><code>@stat</code></td>
            <td><code>@stats</code>, <code>@derived</code>, <code>@status</code>, <code>@combat</code></td>
            <td>Status derivados, defesas, deslocamento, iniciativa e bônus calculados.</td>
          </tr>
          <tr>
            <td><code>@res</code></td>
            <td><code>@resources</code>, <code>@recursos</code>, <code>@vitals</code>, <code>@bars</code></td>
            <td>Recursos em <code>bar</code>, <code>track</code>, <code>clock</code>, <code>slots</code>, <code>pool</code> (rolável) ou <code>counter</code> (sem teto).</td>
          </tr>
          <tr>
            <td><code>@turn</code></td>
            <td><code>@economy</code>, <code>@turno</code>, <code>@acoes</code></td>
            <td>Economia de ações por turno e conversões compostas (<code>convert</code>).</td>
          </tr>
          <tr>
            <td><code>@rank</code></td>
            <td><code>@ranks</code>, <code>@graus</code></td>
            <td>Tabela de graus de treinamento reutilizáveis nas perícias.</td>
          </tr>
          <tr>
            <td><code>@skill</code></td>
            <td><code>@skills</code>, <code>@pericias</code></td>
            <td>Perícias vinculadas a atributos com rolagem automática via <code>attr</code> e <code>self</code>.</td>
          </tr>
          <tr>
            <td><code>@inv</code></td>
            <td><code>@inventory</code>, <code>@inventario</code>, <code>@equip</code>, <code>@gear</code></td>
            <td>Inventário, cálculo de carga, equipamentos reativos, armas e consumíveis.</td>
          </tr>
          <tr>
            <td><code>@ability</code></td>
            <td><code>@abilities</code>, <code>@habilidades</code>, <code>@actions</code>, <code>@powers</code>, <code>@spells</code>, <code>@rituals</code>, <code>@moves</code></td>
            <td>Habilidades, magias, rituais, aprimoramentos (<code>enhance</code>), toggles (<code>when active</code>) e faixas.</td>
          </tr>
          <tr>
            <td><code>@counter</code></td>
            <td><code>@counters</code>, <code>@contadores</code>, <code>@relogios</code>, <code>@clocks</code></td>
            <td>Contadores visuais em segmentos (<code>segments</code>), pontos (<code>dots</code>) ou relógio (<code>pie</code>).</td>
          </tr>
          <tr>
            <td><code>@slots</code></td>
            <td><code>@escaninhos</code>, <code>@condicoes</code>, <code>@conditions</code></td>
            <td>Grade de escaninhos de estado clicável (<code>empty</code>, <code>filled</code>, <code>damaged</code>, <code>locked</code>).</td>
          </tr>
          <tr>
            <td><code>@desc</code></td>
            <td><code>@descriptors</code>, <code>@descritores</code>, <code>@aspects</code>, <code>@traits</code></td>
            <td>Sentidos, resistências, imunidades, vulnerabilidades, aspectos e tags reativas.</td>
          </tr>
          <tr>
            <td><code>@diagram</code></td>
            <td><code>@diagrama</code>, <code>@body</code>, <code>@corpo</code></td>
            <td>Diagrama anatômico com PV/Armadura por parte do corpo e sorteio de localização.</td>
          </tr>
          <tr>
            <td><code>@roll</code></td>
            <td><code>@rolagem</code>, <code>@resolve</code>, <code>@resolution</code>, <code>@resolucao</code></td>
            <td>Perfil global de resolução de rolagem com faixas de sucesso (<code>>= 10</code>, <code>7..9</code>, <code><= 6</code>).</td>
          </tr>
          <tr>
            <td><code>@rule</code></td>
            <td><code>@rules</code>, <code>@regras</code>, <code>@mech</code></td>
            <td>Regras condicionais globais avaliadas automaticamente em tempo real.</td>
          </tr>
          <tr>
            <td><code>@table</code></td>
            <td><code>@tabela</code></td>
            <td>Tabela de progressão consultada via <code>lookup(tabela, valor)</code>.</td>
          </tr>
          <tr>
            <td><code>@texto</code></td>
            <td><code>@text</code>, <code>@notes</code>, <code>@bio</code>, <code>@lore</code>, <code>@anotacoes</code></td>
            <td>Bloco de texto livre para anotações, história e regras de mesa.</td>
          </tr>
        </tbody>
      </table>

      <table class="ref-table">
        <thead>
          <tr>
            <th>Flag (<code>!</code>) ou Tag (<code>#</code>)</th>
            <th>Módulo Alvo</th>
            <th>Efeito Direto</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>!lock</code> (ou operador <code>:!</code>)</td>
            <td><code>@attr</code>, <code>@stat</code>, <code>@skill</code></td>
            <td>Trava o valor impedindo modificações por efeitos externos (<code>+=</code>, <code>-=</code>, <code>=</code>).</td>
          </tr>
          <tr>
            <td><code>!equipped</code> / <code>!carried</code> / <code>!stash</code></td>
            <td><code>@inv</code> (<code>item</code>)</td>
            <td>Define se o item inicia Equipado (ativa bônus + soma peso), na Mochila (soma peso) ou na Reserva (peso 0).</td>
          </tr>
          <tr>
            <td><code>!consumable</code> (ou <code>!consumivel</code>)</td>
            <td><code>@inv</code> (<code>item</code>)</td>
            <td>Exibe o botão rápido <strong>Consumir (-1)</strong> no card do item.</td>
          </tr>
          <tr>
            <td><code>!active</code> (ou <code>active: true</code>)</td>
            <td><code>@ability</code>, <code>@desc</code></td>
            <td>Inicia a habilidade sustentada ou tag reativa com o efeito ligado.</td>
          </tr>
          <tr>
            <td><code>!condition</code> + <code>double</code></td>
            <td><code>@slots</code></td>
            <td>Marca o escaninho como condição de status (<code>!condition</code>) ou faz ocupar 2 colunas (<code>double</code>).</td>
          </tr>
          <tr>
            <td><code>#arma</code>, <code>#armadura</code>, <code>#escudo</code>, <code>#combate</code>...</td>
            <td><code>@inv</code>, <code>@ability</code>, <code>@rule</code></td>
            <td>Exibe etiquetas categorizadas no card e permite filtrar ou identificar regras/efeitos.</td>
          </tr>
        </tbody>
      </table>
    </section>

  </div>
</body>
</html>`;

  const htmlOutPath = path.join(workspaceRoot, 'Manual_Completo_SGM_SDL.html');
  const pdfOutPath = path.join(workspaceRoot, 'Manual_Completo_SGM_SDL.pdf');

  fs.writeFileSync(htmlOutPath, htmlContent, 'utf8');
  console.log('HTML generated at:', htmlOutPath, 'Size:', htmlContent.length);

  // Convert HTML to PDF via Microsoft Edge or Google Chrome headless
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browserBin = fs.existsSync(edgePath) ? edgePath : chromePath;

  const fileUrl = 'file:///' + htmlOutPath.replace(/\\/g, '/');
  console.log('Printing to PDF using:', browserBin);

  execFileSync(
    browserBin,
    [
      '--headless',
      '--disable-gpu',
      '--no-pdf-header-footer',
      `--print-to-pdf=${pdfOutPath}`,
      fileUrl,
    ],
    { stdio: 'inherit' },
  );

  const stat = fs.statSync(pdfOutPath);
  console.log('PDF successfully generated at:', pdfOutPath, 'Size (bytes):', stat.size);
}

generateManual().catch((err) => {
  console.error(err);
  process.exit(1);
});
