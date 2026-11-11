import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { CompiledSheet, DSLDiagnostic } from '@/lib/sheet-dsl/types';
import {
  analyzeDSLStructure,
  buildFoldProjection,
  reconstructFullSourceFromProjection,
  extractSheetSymbols,
  tokenizeDSLLine,
  getDSLCompletions,
  type DSLCompletionItem,
  type DSLFoldableBlock,
  type DSLHighlightToken,
} from '@/lib/sheet-dsl/editorIntelligence';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  ListTree,
  Search,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';

interface SheetDSLEditorProps {
  value: string;
  onChange: (nextSource: string) => void;
  compiledSheet: CompiledSheet;
  quickSnippets?: Array<{ label: string; snippet: string }>;
  compactLayout?: boolean;
}

const LINE_HEIGHT = 20;
const EDITOR_PAD_TOP = 10;
const EDITOR_PAD_LEFT = 12;
const EDITOR_FONT_FAMILY = 'Consolas, "Cascadia Mono", "Courier New", monospace';
const EDITOR_FONT_SIZE = '12.5px';

function getTokenColorClass(token: DSLHighlightToken): string {
  switch (token.kind) {
    case 'comment':
      return 'text-[#6b7280] italic';
    case 'directive_tab':
      return 'text-[#f59e0b]';
    case 'directive_config':
      return 'text-[#38bdf8]';
    case 'directive_module':
      return 'text-[#c084fc]';
    case 'subkeyword':
      return 'text-[#fb7185]';
    case 'string':
      return 'text-[#86efac]';
    case 'dice':
      return 'text-[#fcd34d]';
    case 'number':
      return 'text-[#fdba74]';
    case 'operator':
      return 'text-[#7dd3fc]';
    case 'prop_key':
      return 'text-[#93c5fd]';
    case 'layout_kw':
      return 'text-[#5eead4]';
    case 'flag':
      return 'text-[#f9a8d4]';
    case 'tag':
      return 'text-[#a5b4fc]';
    case 'builtin_fn':
      return 'text-[#67e8f9]';
    case 'builtin_var':
      return 'text-[#fda4af]';
    case 'symbol_decl':
      return 'text-[#f4f4f5]';
    case 'symbol_ref':
      return 'text-[#fde68a]';
    case 'bracket':
      return 'text-[#a1a1aa]';
    case 'punctuation':
      return 'text-[#71717a]';
    case 'fold_placeholder':
      return 'text-[#a1a1aa]';
    default:
      return 'text-[#d4d4d8]';
  }
}

function getCompletionBadgeStyle(category: DSLCompletionItem['category']): string {
  switch (category) {
    case 'directive':
      return 'bg-[#2e1065] text-[#d8b4fe] border-[#4c1d95]';
    case 'snippet':
      return 'bg-[#1e293b] text-[#93c5fd] border-[#334155]';
    case 'attr':
      return 'bg-[#3b2506] text-[#fcd34d] border-[#78350f]';
    case 'stat':
      return 'bg-[#082f49] text-[#7dd3fc] border-[#0369a1]';
    case 'resource':
      return 'bg-[#3f1118] text-[#fda4af] border-[#881337]';
    case 'skill':
      return 'bg-[#062e24] text-[#6ee7b7] border-[#065f46]';
    case 'rank':
      return 'bg-[#27272a] text-[#e4e4e7] border-[#3f3f46]';
    case 'dice':
      return 'bg-[#3b2506] text-[#fde68a] border-[#78350f]';
    case 'flag':
      return 'bg-[#3b0d2c] text-[#f9a8d4] border-[#701a75]';
    default:
      return 'bg-[#1f1f23] text-[#a1a1aa] border-[#3f3f46]';
  }
}

function renderTextWithSearchHighlight(text: string, searchQuery: string): React.ReactNode {
  if (!searchQuery || !text) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = searchQuery.toLowerCase();
  if (!lowerText.includes(lowerQuery)) return text;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let matchIdx = lowerText.indexOf(lowerQuery, cursor);
  let keyCounter = 0;

  while (matchIdx !== -1) {
    if (matchIdx > cursor) {
      parts.push(text.slice(cursor, matchIdx));
    }
    parts.push(
      <mark
        key={keyCounter++}
        className="bg-[#854d0e] text-[#fef08a] rounded-none p-0 m-0"
      >
        {text.slice(matchIdx, matchIdx + searchQuery.length)}
      </mark>,
    );
    cursor = matchIdx + searchQuery.length;
    matchIdx = lowerText.indexOf(lowerQuery, cursor);
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

export function SheetDSLEditor({
  value,
  onChange,
  compiledSheet,
  quickSnippets = [],
  compactLayout = false,
}: SheetDSLEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const measureSpanRef = useRef<HTMLSpanElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Estado de blocos recolhidos (por chave estável)
  const [foldedIds, setFoldedIds] = useState<Set<string>>(() => new Set());
  const [showOutlinePanel, setShowOutlinePanel] = useState<boolean>(() => {
    if (compactLayout) return false;
    if (typeof window !== 'undefined' && window.innerWidth < 768) return false;
    return true;
  });
  const [outlineTabFilter, setOutlineTabFilter] = useState<string>('ALL');

  useEffect(() => {
    if (compactLayout || (typeof window !== 'undefined' && window.innerWidth < 768)) {
      setShowOutlinePanel(false);
    } else {
      setShowOutlinePanel(true);
    }
  }, [compactLayout]);

  // Busca local no DSL
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMatchIdx, setActiveMatchIdx] = useState<number>(0);

  // Posição do cursor e linha ativa (no texto projetado)
  const [cursorOffset, setCursorOffset] = useState<number>(0);
  const [activeProjectedLine, setActiveProjectedLine] = useState<number>(0);
  const [charWidth, setCharWidth] = useState<number>(7.5);
  const [scrollPos, setScrollPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Estado do Autocomplete Algorítmico
  const [completionOpen, setCompletionOpen] = useState<boolean>(false);
  const [forceCompletion, setForceCompletion] = useState<boolean>(false);
  const [hasNavigatedCompletion, setHasNavigatedCompletion] = useState<boolean>(false);
  const [selectedCompletionIdx, setSelectedCompletionIdx] = useState<number>(0);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  // Mede largura exata de caractere monoespaçado
  useEffect(() => {
    if (measureSpanRef.current) {
      const rect = measureSpanRef.current.getBoundingClientRect();
      if (rect.width > 0) {
        setCharWidth(rect.width / 10);
      }
    }
  }, []);

  // 1. Análise estrutural (Abas, Módulos e Sub-itens)
  const structure = useMemo(() => analyzeDSLStructure(value), [value]);

  // 2. Projeção de Código com Folding
  const projection = useMemo(
    () => buildFoldProjection(value, structure, foldedIds),
    [value, structure, foldedIds],
  );

  // 3. Tabela de símbolos vivos da ficha compilada
  const { symbolSet } = useMemo(() => extractSheetSymbols(compiledSheet), [compiledSheet]);

  // 4. Linhas tokenizadas para Syntax Highlighting
  const projectedLines = useMemo(
    () => projection.projectedSource.split('\n'),
    [projection.projectedSource],
  );

  const highlightedLines = useMemo(
    () => projectedLines.map((line) => tokenizeDSLLine(line, symbolSet)),
    [projectedLines, symbolSet],
  );

  // 5. Diagnósticos indexados por linha real (1-indexed)
  const diagnosticsByRealLine = useMemo(() => {
    const map = new Map<number, DSLDiagnostic[]>();
    for (const d of compiledSheet.diagnostics || []) {
      const lineNum = d.span?.start?.line || 1;
      const list = map.get(lineNum) || [];
      list.push(d);
      map.set(lineNum, list);
    }
    return map;
  }, [compiledSheet.diagnostics]);

  // 6. Ocorrências de busca no fullSource
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const matches: Array<{ realLine: number; col: number }> = [];
    const rawLines = value.split('\n');
    for (let l = 0; l < rawLines.length; l++) {
      const lower = rawLines[l].toLowerCase();
      let idx = lower.indexOf(q);
      while (idx !== -1) {
        matches.push({ realLine: l, col: idx });
        idx = lower.indexOf(q, idx + q.length);
      }
    }
    return matches;
  }, [value, searchQuery]);

  // 7. Sugestões de Autocomplete Algorítmico
  const completionResult = useMemo(() => {
    if (!completionOpen && !forceCompletion) return null;
    return getDSLCompletions(
      projection.projectedSource,
      cursorOffset,
      compiledSheet,
      forceCompletion,
    );
  }, [
    completionOpen,
    forceCompletion,
    projection.projectedSource,
    cursorOffset,
    compiledSheet,
  ]);

  useEffect(() => {
    setSelectedCompletionIdx(0);
    setHasNavigatedCompletion(false);
  }, [completionResult?.query, completionResult?.contextLabel]);

  // Sincroniza scroll entre textarea, backdrop de highlight e gutter
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const top = e.currentTarget.scrollTop;
    const left = e.currentTarget.scrollLeft;
    if (backdropRef.current) {
      backdropRef.current.scrollTop = top;
      backdropRef.current.scrollLeft = left;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = top;
    }
    setScrollPos({ top, left });
  }, []);

  const syncCursorFromTextarea = useCallback(
    (el: HTMLTextAreaElement, allowAutoOpen = false) => {
      const pos = el.selectionStart ?? 0;
      setCursorOffset(pos);
      const lineIdx = el.value.slice(0, pos).split('\n').length - 1;
      setActiveProjectedLine(lineIdx);
      if (!allowAutoOpen) {
        setCompletionOpen(false);
        setForceCompletion(false);
      }
    },
    [],
  );

  // Alterna recolhimento de um único bloco
  const toggleFoldBlock = useCallback((blockId: string) => {
    setFoldedIds((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
    setCompletionOpen(false);
    setForceCompletion(false);
  }, []);

  // Ações de redução em massa para rastreio rápido
  const foldByMode = useCallback(
    (mode: 'tabs' | 'modules' | 'subitems' | 'expand_all') => {
      if (mode === 'expand_all') {
        setFoldedIds(new Set());
        return;
      }
      const next = new Set<string>();
      if (mode === 'tabs') {
        for (const t of structure.tabs) next.add(t.id);
      } else if (mode === 'modules') {
        for (const m of structure.modules) next.add(m.id);
      } else if (mode === 'subitems') {
        for (const s of structure.subitems) next.add(s.id);
      }
      setFoldedIds(next);
      setCompletionOpen(false);
      setForceCompletion(false);
    },
    [structure],
  );

  // Navega diretamente para uma linha real (0-indexed), expandindo blocos pais se necessário
  const jumpToRealLine = useCallback(
    (realLineZeroBased: number, col = 0) => {
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        setShowOutlinePanel(false);
      }
      // Verifica se a linha alvo está oculta dentro de algum bloco recolhido
      const blocksToUnfold: string[] = [];
      for (const b of structure.blocks) {
        if (foldedIds.has(b.id) && realLineZeroBased > b.startLine && realLineZeroBased <= b.endLine) {
          blocksToUnfold.push(b.id);
        }
      }

      let nextFolded = foldedIds;
      if (blocksToUnfold.length > 0) {
        nextFolded = new Set(foldedIds);
        for (const id of blocksToUnfold) nextFolded.delete(id);
        setFoldedIds(nextFolded);
      }

      requestAnimationFrame(() => {
        const tempProj = buildFoldProjection(value, structure, nextFolded);
        const targetProjLine = tempProj.realToProjectedLine(realLineZeroBased);
        const lines = tempProj.projectedSource.split('\n');
        let charPos = 0;
        for (let i = 0; i < targetProjLine && i < lines.length; i++) {
          charPos += lines[i].length + 1;
        }
        charPos += Math.min(col, (lines[targetProjLine] || '').length);

        const ta = textareaRef.current;
        if (ta) {
          ta.focus();
          ta.setSelectionRange(charPos, charPos);
          const targetScrollTop = Math.max(0, targetProjLine * LINE_HEIGHT - ta.clientHeight / 3);
          ta.scrollTop = targetScrollTop;
          if (backdropRef.current) backdropRef.current.scrollTop = targetScrollTop;
          if (gutterRef.current) gutterRef.current.scrollTop = targetScrollTop;
          setScrollPos((prev) => ({ ...prev, top: targetScrollTop }));
          setCursorOffset(charPos);
          setActiveProjectedLine(targetProjLine);
        }
      });
    },
    [foldedIds, structure, value],
  );

  // Navegação entre resultados da busca
  const stepSearchMatch = useCallback(
    (delta: number) => {
      if (searchMatches.length === 0) return;
      const nextIdx = (activeMatchIdx + delta + searchMatches.length) % searchMatches.length;
      setActiveMatchIdx(nextIdx);
      const target = searchMatches[nextIdx];
      jumpToRealLine(target.realLine, target.col);
    },
    [searchMatches, activeMatchIdx, jumpToRealLine],
  );

  // Edição do texto projetado -> reconstrói fullSource preservando blocos ocultos
  const applyProjectedEdit = useCallback(
    (nextProjectedText: string, nextCursorPos: number, openAutocomplete = true) => {
      const { fullSource, unfoldedBlockIds } = reconstructFullSourceFromProjection(
        nextProjectedText,
        projection,
      );

      if (unfoldedBlockIds.length > 0) {
        setFoldedIds((prev) => {
          const next = new Set(prev);
          for (const id of unfoldedBlockIds) next.delete(id);
          return next;
        });
      }

      onChange(fullSource);
      setCursorOffset(nextCursorPos);
      const nextLine = nextProjectedText.slice(0, nextCursorPos).split('\n').length - 1;
      setActiveProjectedLine(nextLine);
      setCompletionOpen(openAutocomplete);
      if (!openAutocomplete) setForceCompletion(false);

      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (ta && document.activeElement === ta) {
          ta.setSelectionRange(nextCursorPos, nextCursorPos);
        }
      });
    },
    [onChange, projection],
  );

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextVal = e.target.value;
      const nextPos = e.target.selectionStart ?? 0;
      applyProjectedEdit(nextVal, nextPos, true);
    },
    [applyProjectedEdit],
  );

  // Aceita item do Autocomplete Algorítmico
  const acceptCompletion = useCallback(
    (item: DSLCompletionItem) => {
      if (!completionResult) return;
      const src = projection.projectedSource;
      const before = src.slice(0, completionResult.replaceStart);
      const after = src.slice(completionResult.replaceEnd);
      const inserted = item.insertText;
      const nextProjected = `${before}${inserted}${after}`;
      const cursorBack = item.cursorOffsetFromEnd || 0;
      const nextCursor = before.length + inserted.length - cursorBack;

      setCompletionOpen(false);
      setForceCompletion(false);
      applyProjectedEdit(nextProjected, nextCursor, false);
      textareaRef.current?.focus();
    },
    [completionResult, projection.projectedSource, applyProjectedEdit],
  );

  // Clique em linha sentinela de fold expande automaticamente o bloco
  const handleTextareaClick = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      const ta = e.currentTarget;
      const pos = ta.selectionStart ?? 0;
      const lineIdx = ta.value.slice(0, pos).split('\n').length - 1;
      const info = projection.lineMap[lineIdx];

      if (info?.isFoldPlaceholder && info.foldBlockId) {
        const block = structure.byId.get(info.foldBlockId);
        toggleFoldBlock(info.foldBlockId);
        if (block) {
          requestAnimationFrame(() => jumpToRealLine(block.startLine + 1, 2));
        }
        return;
      }

      syncCursorFromTextarea(ta, false);
    },
    [projection.lineMap, structure.byId, toggleFoldBlock, jumpToRealLine, syncCursorFromTextarea],
  );

  // Tratamento de atalhos de teclado (Autocomplete, Tab, Auto-indent, Ctrl+Space, Ctrl+F)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = e.currentTarget;

      // Ctrl+F -> Busca no DSL
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setSearchOpen(true);
        requestAnimationFrame(() => searchInputRef.current?.focus());
        return;
      }

      // Ctrl+Space -> Força abertura do Autocomplete Algorítmico
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        setCursorOffset(ta.selectionStart ?? 0);
        setCompletionOpen(true);
        setForceCompletion(true);
        setHasNavigatedCompletion(true);
        return;
      }

      // Navegação no Autocomplete aberto
      if (completionResult && completionResult.items.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHasNavigatedCompletion(true);
          setSelectedCompletionIdx((prev) => (prev + 1) % completionResult.items.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHasNavigatedCompletion(true);
          setSelectedCompletionIdx(
            (prev) => (prev - 1 + completionResult.items.length) % completionResult.items.length,
          );
          return;
        }
        if (
          e.key === 'Tab' ||
          (e.key === 'Enter' && (completionResult.query.length > 0 || hasNavigatedCompletion))
        ) {
          e.preventDefault();
          const chosen = completionResult.items[selectedCompletionIdx] || completionResult.items[0];
          if (chosen) acceptCompletion(chosen);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setCompletionOpen(false);
          setForceCompletion(false);
          setHasNavigatedCompletion(false);
          return;
        }
      }

      // Indentação com Tab / Shift+Tab
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = ta.selectionStart ?? 0;
        const end = ta.selectionEnd ?? 0;
        const src = ta.value;

        if (start === end && !e.shiftKey) {
          const nextText = `${src.slice(0, start)}  ${src.slice(end)}`;
          applyProjectedEdit(nextText, start + 2, false);
          return;
        }

        // Indent / Outdent em múltiplas linhas
        const lineStart = src.lastIndexOf('\n', start - 1) + 1;
        const blockText = src.slice(lineStart, end);
        const blockLines = blockText.split('\n');
        const transformed = blockLines.map((l) => {
          if (e.shiftKey) {
            return l.startsWith('  ') ? l.slice(2) : l.startsWith('\t') ? l.slice(1) : l;
          }
          return `  ${l}`;
        });
        const joined = transformed.join('\n');
        const nextText = `${src.slice(0, lineStart)}${joined}${src.slice(end)}`;
        const nextEnd = lineStart + joined.length;
        applyProjectedEdit(nextText, nextEnd, false);
        return;
      }

      // Auto-indentação limpa ao pressionar Enter
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const start = ta.selectionStart ?? 0;
        const end = ta.selectionEnd ?? 0;
        if (start === end) {
          const src = ta.value;
          const lineStart = src.lastIndexOf('\n', start - 1) + 1;
          const currentLineUpToCursor = src.slice(lineStart, start);
          const indentMatch = currentLineUpToCursor.match(/^([ \t]*)/);
          let nextIndent = indentMatch ? indentMatch[1] : '';
          const trimmed = currentLineUpToCursor.trim();

          // Indenta +2 espaços ao abrir bloco @module (exceto @tab/@nav/@tema) ou sub-bloco item/ability/action/spell/enhance
          if (
            /^@(?!tab\b|aba\b|nav\b|tema\b|theme\b)[a-zA-Z0-9_\u00C0-\u017F-]+/i.test(trimmed) &&
            nextIndent.length === 0
          ) {
            nextIndent = '  ';
          } else if (/^(item|ability|habilidade|action|acao|spell|magia|ritual|move|enhance)\b/i.test(trimmed)) {
            nextIndent = `${nextIndent}  `;
          }

          e.preventDefault();
          const insertion = `\n${nextIndent}`;
          const nextText = `${src.slice(0, start)}${insertion}${src.slice(end)}`;
          const shouldSuggestModuleItems = nextIndent.length > 0 && trimmed.length > 0;
          applyProjectedEdit(nextText, start + insertion.length, shouldSuggestModuleItems);
          if (shouldSuggestModuleItems) {
            setForceCompletion(true);
            setHasNavigatedCompletion(false);
          }
          return;
        }
      }

      // Atualiza linha ativa após setas de navegação
      if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'Home' ||
        e.key === 'End'
      ) {
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            syncCursorFromTextarea(textareaRef.current, false);
          }
        });
      }
    },
    [
      completionResult,
      selectedCompletionIdx,
      hasNavigatedCompletion,
      acceptCompletion,
      applyProjectedEdit,
      syncCursorFromTextarea,
    ],
  );

  // Inserção de Quick Snippet no final ou na posição atual
  const insertQuickSnippet = useCallback(
    (snippet: string) => {
      const nextFull = `${value.trimEnd()}\n${snippet}`;
      onChange(nextFull);
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (ta) {
          ta.focus();
          ta.scrollTop = ta.scrollHeight;
        }
      });
    },
    [value, onChange],
  );

  // Coordenadas do popover de Autocomplete
  const completionPopoverStyle = useMemo((): React.CSSProperties => {
    if (!completionResult) return { display: 'none' };
    const before = projection.projectedSource.slice(0, completionResult.replaceStart);
    const lines = before.split('\n');
    const lineIdx = lines.length - 1;
    const colIdx = lines[lineIdx].length;

    const gutterWidth = 52;
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
    const outlineWidth = showOutlinePanel && !isMobile ? 192 : 0;
    const rawLeft = outlineWidth + gutterWidth + EDITOR_PAD_LEFT + colIdx * charWidth - scrollPos.left;
    const rawTop = EDITOR_PAD_TOP + (lineIdx + 1) * LINE_HEIGHT - scrollPos.top;

    const containerW = editorContainerRef.current?.clientWidth || 600;
    const containerH = editorContainerRef.current?.clientHeight || 400;

    if (containerW < 520 || isMobile) {
      const popW = Math.min(320, containerW - 16);
      const left = Math.max(8, (containerW - popW) / 2);
      const popH = Math.min(160, completionResult.items.length * 26 + 26);
      const isNearBottom = rawTop > containerH * 0.55;
      const top = isNearBottom
        ? Math.max(8, rawTop - popH - 6)
        : Math.min(containerH - popH - 8, rawTop + 4);

      return {
        left: `${left}px`,
        top: `${Math.max(6, top)}px`,
        width: `${popW}px`,
        maxWidth: 'calc(100vw - 16px)',
      };
    }

    const popW = 340;
    const popH = Math.min(248, completionResult.items.length * 28 + 30);

    const clampedLeft = Math.max(
      outlineWidth + gutterWidth + 4,
      Math.min(rawLeft, Math.max(outlineWidth + gutterWidth + 4, containerW - popW - 12)),
    );
    const shouldFlipUp = rawTop + popH > containerH - 8 && rawTop - LINE_HEIGHT - popH > 4;
    const finalTop = shouldFlipUp ? rawTop - LINE_HEIGHT - popH - 4 : rawTop + 2;

    return {
      left: `${clampedLeft}px`,
      top: `${Math.max(4, finalTop)}px`,
      width: `${popW}px`,
    };
  }, [completionResult, projection.projectedSource, charWidth, scrollPos, showOutlinePanel]);

  // Agrupamento de módulos por aba para o painel de Mapa Estrutural
  const outlineGroups = useMemo(() => {
    const tabNames: string[] = [];
    const seen = new Set<string>();

    // Garante Principal se houver módulos antes do primeiro @tab
    for (const m of structure.modules) {
      if (!seen.has(m.tabName)) {
        seen.add(m.tabName);
        tabNames.push(m.tabName);
      }
    }
    for (const t of structure.tabs) {
      if (!seen.has(t.tabName)) {
        seen.add(t.tabName);
        tabNames.push(t.tabName);
      }
    }

    return tabNames.map((tabName) => {
      const tabBlock = structure.tabs.find((t) => t.tabName === tabName);
      const childModules = structure.modules.filter((m) => m.tabName === tabName);
      return { tabName, tabBlock, childModules };
    });
  }, [structure]);

  const filteredOutlineGroups = useMemo(() => {
    if (outlineTabFilter === 'ALL') return outlineGroups;
    return outlineGroups.filter((g) => g.tabName === outlineTabFilter);
  }, [outlineGroups, outlineTabFilter]);

  const currentRealLineNumber = projection.lineMap[activeProjectedLine]?.realLineNumber || 1;
  const totalRealLines = useMemo(() => value.split('\n').length, [value]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#101013] text-[#d4d4d8] select-none">
      {/* Span invisível para aferição exata da largura de 10 caracteres monoespaçados */}
      <span
        ref={measureSpanRef}
        aria-hidden="true"
        className="fixed -top-[9999px] -left-[9999px] pointer-events-none invisible whitespace-pre"
        style={{ fontFamily: EDITOR_FONT_FAMILY, fontSize: EDITOR_FONT_SIZE }}
      >
        MMMMMMMMMM
      </span>

      {/* BARRA SUPERIOR 1: Snippets Rápidos + Status do Compilador */}
      {quickSnippets.length > 0 && (
        <div className="px-2.5 py-1 border-b border-[#242429] bg-[#141418] flex items-center justify-between gap-1.5 shrink-0">
          {/* Versão Mobile: Dropdown compacto de 1 linha para não poluir */}
          <div className="flex sm:hidden items-center gap-1.5 flex-1 min-w-0">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  insertQuickSnippet(e.target.value);
                  e.target.value = '';
                }
              }}
              className="h-6 px-2 rounded bg-[#1c1c22] border border-[#2d2d35] text-[10px] font-mono text-[#c4b5fd] focus:outline-none max-w-[150px]"
            >
              <option value="" disabled>
                + Inserir Bloco...
              </option>
              {quickSnippets.map((item) => (
                <option key={item.label} value={item.snippet}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Versão Desktop: Botões diretos */}
          <div className="hidden sm:flex flex-wrap items-center gap-1">
            {quickSnippets.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => insertQuickSnippet(item.snippet)}
                className="px-1.5 py-0.5 rounded bg-[#1c1c22] hover:bg-[#272730] border border-[#2d2d35] text-[10px] font-mono text-[#c4b5fd] transition-colors"
                title={`Inserir modelo ${item.label} ao final do DSL`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (compiledSheet.diagnostics.length > 0) {
                setShowDiagnostics((v) => !v);
              }
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono border shrink-0 ${
              compiledSheet.diagnostics.length === 0
                ? 'bg-[#0f2419] border-[#164e33] text-[#6ee7b7] cursor-default'
                : 'bg-[#2b1f0e] border-[#78350f] text-[#fcd34d] hover:bg-[#382812] cursor-pointer'
            }`}
          >
            {compiledSheet.diagnostics.length === 0
              ? 'Compilado OK'
              : `${compiledSheet.diagnostics.length} aviso(s)`}
          </button>
        </div>
      )}

      {/* BARRA SUPERIOR 2: Controles de Rastreio, Dobramento & Busca (Linha Única sem wrap) */}
      <div className="px-2.5 py-1 border-b border-[#242429] bg-[#16161b] flex items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowOutlinePanel((v) => !v)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-colors shrink-0 ${
              showOutlinePanel
                ? 'bg-[#272730] border-[#3f3f4a] text-[#f4f4f5]'
                : 'bg-[#1a1a20] border-[#27272f] text-[#a1a1aa] hover:text-[#e4e4e7]'
            }`}
            title="Mostrar/ocultar Mapa Estrutural de Abas e Módulos"
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Mapa</span>
          </button>

          <div className="h-3.5 w-px bg-[#27272f] mx-0.5" />

          <button
            type="button"
            onClick={() => foldByMode('tabs')}
            disabled={structure.tabs.length === 0}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1a1a20] hover:bg-[#25252e] disabled:opacity-40 border border-[#2a2a33] text-[10px] font-mono text-[#fbbf24] transition-colors shrink-0"
            title="Minimizar todas as Abas (@tab)"
          >
            <ChevronsDownUp className="w-3 h-3" />
            <span>Abas ({structure.tabs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => foldByMode('modules')}
            disabled={structure.modules.length === 0}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1a1a20] hover:bg-[#25252e] disabled:opacity-40 border border-[#2a2a33] text-[10px] font-mono text-[#c084fc] transition-colors shrink-0"
            title="Minimizar todos os Módulos (@attr, @skill, @inv, @ability...)"
          >
            <ChevronsDownUp className="w-3 h-3" />
            <span>Módulos ({structure.modules.length})</span>
          </button>

          {structure.subitems.length > 0 && (
            <button
              type="button"
              onClick={() => foldByMode('subitems')}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1a1a20] hover:bg-[#25252e] border border-[#2a2a33] text-[10px] font-mono text-[#fb7185] transition-colors shrink-0"
              title="Minimizar apenas sub-itens multi-linha"
            >
              <ChevronsDownUp className="w-3 h-3" />
              <span>Itens ({structure.subitems.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => foldByMode('expand_all')}
            disabled={foldedIds.size === 0}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1a1a20] hover:bg-[#25252e] disabled:opacity-40 border border-[#2a2a33] text-[10px] font-mono text-[#d4d4d8] transition-colors shrink-0"
            title="Expandir todas as áreas recolhidas"
          >
            <ChevronsUpDown className="w-3 h-3" />
            <span>Expandir</span>
          </button>
        </div>

        {/* Busca rápida no DSL */}
        <div className="flex items-center gap-1.5 shrink-0">
          {searchOpen ? (
            <div className="flex items-center gap-1 bg-[#111115] border border-[#32323c] rounded px-1.5 py-0.5">
              <Search className="w-3 h-3 text-[#71717a] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveMatchIdx(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    stepSearchMatch(e.shiftKey ? -1 : 1);
                  } else if (e.key === 'Escape') {
                    setSearchOpen(false);
                    setSearchQuery('');
                    textareaRef.current?.focus();
                  }
                }}
                placeholder="Rastrear termo..."
                className="w-28 sm:w-36 bg-transparent text-[11px] font-mono text-[#e4e4e7] placeholder:text-[#52525b] focus:outline-none"
              />
              {searchQuery && (
                <span className="text-[10px] font-mono text-[#a1a1aa] px-1">
                  {searchMatches.length > 0 ? `${activeMatchIdx + 1}/${searchMatches.length}` : '0/0'}
                </span>
              )}
              <button
                type="button"
                onClick={() => stepSearchMatch(-1)}
                disabled={searchMatches.length === 0}
                className="p-0.5 text-[#a1a1aa] hover:text-white disabled:opacity-30"
                title="Ocorrência anterior (Shift+Enter)"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => stepSearchMatch(1)}
                disabled={searchMatches.length === 0}
                className="p-0.5 text-[#a1a1aa] hover:text-white disabled:opacity-30"
                title="Próxima ocorrência (Enter)"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                  textareaRef.current?.focus();
                }}
                className="p-0.5 text-[#71717a] hover:text-[#e4e4e7]"
                title="Fechar busca (Esc)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearchOpen(true);
                requestAnimationFrame(() => searchInputRef.current?.focus());
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1a1a20] hover:bg-[#25252e] border border-[#2a2a33] text-[10px] font-mono text-[#a1a1aa] hover:text-[#e4e4e7] transition-colors"
              title="Buscar símbolo ou texto no DSL (Ctrl+F)"
            >
              <Search className="w-3 h-3" />
              <span>Buscar</span>
            </button>
          )}
        </div>
      </div>

      {/* ÁREA PRINCIPAL DO EDITOR: Mapa Estrutural + Gutter + Camada de Highlight + Textarea */}
      <div ref={editorContainerRef} className="relative flex-1 flex min-h-0 overflow-hidden">
        {/* PAINEL LATERAL DE MAPA ESTRUTURAL (Drawer no Mobile, Fixo no Desktop) */}
        {showOutlinePanel && (
          <>
            {/* Backdrop escuro no celular */}
            <div
              className="sm:hidden absolute inset-0 bg-black/60 z-30 backdrop-blur-xs"
              onClick={() => setShowOutlinePanel(false)}
            />
            <aside className="absolute sm:relative inset-y-0 left-0 z-40 w-64 sm:w-48 shrink-0 border-r border-[#242429] bg-[#131317] flex flex-col min-h-0 shadow-2xl sm:shadow-none animate-in slide-in-from-left duration-150">
              <div className="px-2 py-1.5 border-b border-[#222228] flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8e8e98]">
                  Estrutura
                </span>
                <div className="flex items-center gap-1">
                  {outlineGroups.length > 1 && (
                    <select
                      value={outlineTabFilter}
                      onChange={(e) => setOutlineTabFilter(e.target.value)}
                      className="bg-[#1b1b21] border border-[#2c2c35] rounded px-1 py-0.5 text-[10px] font-mono text-[#d4d4d8] focus:outline-none max-w-[105px] truncate"
                      title="Filtrar estrutura por Aba"
                    >
                      <option value="ALL">Todas abas</option>
                      {outlineGroups.map((g) => (
                        <option key={g.tabName} value={g.tabName}>
                          {g.tabName}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowOutlinePanel(false)}
                    className="sm:hidden p-0.5 text-zinc-400 hover:text-white"
                    title="Fechar Mapa"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            <div className="flex-1 overflow-y-auto py-1 px-1 space-y-1">
              {filteredOutlineGroups.length === 0 ? (
                <div className="px-2 py-3 text-[11px] text-[#71717a] font-mono">
                  Nenhum bloco @ declarado.
                </div>
              ) : (
                filteredOutlineGroups.map((group) => {
                  const isTabFolded = Boolean(group.tabBlock && foldedIds.has(group.tabBlock.id));
                  return (
                    <div key={group.tabName} className="space-y-0.5">
                      {/* Cabeçalho da Aba no Mapa */}
                      <div className="flex items-center gap-0.5 rounded bg-[#19191f] border border-[#25252d] px-1 py-0.5">
                        {group.tabBlock ? (
                          <button
                            type="button"
                            onClick={() => toggleFoldBlock(group.tabBlock!.id)}
                            className="p-0.5 text-[#f59e0b] hover:bg-[#272730] rounded shrink-0"
                            title={
                              isTabFolded
                                ? `Expandir aba ${group.tabName}`
                                : `Minimizar aba ${group.tabName}`
                            }
                          >
                            {isTabFolded ? (
                              <ChevronRight className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        ) : (
                          <span className="w-4 shrink-0 text-center text-[10px] text-[#f59e0b]">•</span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            jumpToRealLine(group.tabBlock ? group.tabBlock.startLine : 0)
                          }
                          className="flex-1 text-left truncate text-[11px] font-mono text-[#fbbf24] hover:underline"
                          title={`Ir para aba "${group.tabName}"`}
                        >
                          {group.tabName}
                        </button>

                        {group.tabBlock && (
                          <span className="text-[9px] font-mono text-[#6b7280] shrink-0 pr-0.5">
                            L{group.tabBlock.startLine + 1}
                          </span>
                        )}
                      </div>

                      {/* Módulos pertencentes a esta Aba */}
                      {!isTabFolded &&
                        group.childModules.map((mod: DSLFoldableBlock) => {
                          const isModFolded = foldedIds.has(mod.id);
                          const isCursorInside =
                            currentRealLineNumber - 1 >= mod.startLine &&
                            currentRealLineNumber - 1 <= mod.endLine;

                          return (
                            <div
                              key={mod.id}
                              className={`flex items-center gap-0.5 pl-2 pr-1 py-0.5 rounded text-[11px] font-mono transition-colors ${
                                isCursorInside
                                  ? 'bg-[#252530] text-[#f4f4f5]'
                                  : 'text-[#a1a1aa] hover:bg-[#1b1b22] hover:text-[#e4e4e7]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleFoldBlock(mod.id)}
                                className="p-0.5 text-[#8e8e98] hover:text-[#e4e4e7] rounded shrink-0"
                                title={
                                  isModFolded
                                    ? `Expandir ${mod.directive}`
                                    : `Minimizar ${mod.directive}`
                                }
                              >
                                {isModFolded ? (
                                  <ChevronRight className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => jumpToRealLine(mod.startLine)}
                                className="flex-1 text-left truncate"
                                title={`${mod.directive} — ${mod.label} (Linha ${mod.startLine + 1})`}
                              >
                                <span className="text-[#c084fc]">{mod.directive}</span>
                                {mod.label && mod.label !== mod.directive && (
                                  <span className="text-[#8e8e98] ml-1 text-[10px]">
                                    {mod.label}
                                  </span>
                                )}
                              </button>

                              <span className="text-[9px] text-[#52525b] shrink-0">
                                {mod.startLine + 1}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </>
      )}

        {/* GUTTER SINCRONIZADO (Números de Linha Reais + Botões de Fold + Indicador de Aviso) */}
        <div
          ref={gutterRef}
          onWheel={(e) => {
            if (textareaRef.current) {
              textareaRef.current.scrollTop += e.deltaY;
            }
          }}
          className="w-[52px] shrink-0 overflow-hidden bg-[#121216] border-r border-[#222228] select-none"
          style={{
            paddingTop: `${EDITOR_PAD_TOP}px`,
            paddingBottom: '32px',
          }}
        >
          {projection.lineMap.map((info) => {
            const isActive = info.projectedIndex === activeProjectedLine;
            const diags = diagnosticsByRealLine.get(info.realLineNumber);
            const hasDiag = Boolean(diags && diags.length > 0);
            const block = info.headerBlock;

            return (
              <div
                key={info.projectedIndex}
                className={`flex items-center justify-end pr-1.5 gap-0.5 font-mono text-[11px] ${
                  isActive ? 'bg-[#1d1d24] text-[#e4e4e7]' : 'text-[#52525b]'
                }`}
                style={{ height: `${LINE_HEIGHT}px`, lineHeight: `${LINE_HEIGHT}px` }}
              >
                {hasDiag && !info.isFoldPlaceholder && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0 mr-auto ml-1.5"
                    title={diags!.map((d) => d.message).join('\n')}
                  />
                )}

                {info.isFoldPlaceholder ? (
                  <span className="text-[10px] text-[#71717a]">⋯</span>
                ) : (
                  <span>{info.realLineNumber}</span>
                )}

                {/* Botão de Fold / Unfold na margem */}
                {!info.isFoldPlaceholder && block ? (
                  <button
                    type="button"
                    onClick={() => toggleFoldBlock(block.id)}
                    className={`w-3.5 h-3.5 flex items-center justify-center rounded hover:bg-[#2c2c36] shrink-0 ${
                      block.kind === 'tab'
                        ? 'text-[#f59e0b]'
                        : block.kind === 'module'
                          ? 'text-[#c084fc]'
                          : 'text-[#8e8e98]'
                    }`}
                    title={
                      info.isHeaderFolded
                        ? `Expandir ${block.directive} (${block.lineCount} linhas)`
                        : `Minimizar ${block.directive} (${block.lineCount} linhas)`
                    }
                  >
                    {info.isHeaderFolded ? (
                      <ChevronRight className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                ) : info.isFoldPlaceholder && info.foldBlockId ? (
                  <button
                    type="button"
                    onClick={() => toggleFoldBlock(info.foldBlockId!)}
                    className="w-3.5 h-3.5 flex items-center justify-center rounded hover:bg-[#2c2c36] text-[#a1a1aa] shrink-0"
                    title="Expandir bloco recolhido"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="w-3.5 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* CAMADA COMBINADA: BACKDROP DE SYNTAX HIGHLIGHT + TEXTAREA TRANSPARENTE */}
        <div className="relative flex-1 min-w-0 min-h-0 bg-[#101013]">
          {/* Camada de Pintura Sintática (<pre> espelhado) */}
          <div
            ref={backdropRef}
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden pointer-events-none select-none"
            style={{
              paddingTop: `${EDITOR_PAD_TOP}px`,
              paddingBottom: '32px',
              paddingLeft: `${EDITOR_PAD_LEFT}px`,
              paddingRight: '24px',
              fontFamily: EDITOR_FONT_FAMILY,
              fontSize: EDITOR_FONT_SIZE,
              lineHeight: `${LINE_HEIGHT}px`,
              tabSize: 2,
              whiteSpace: 'pre',
            }}
          >
            <div className="inline-block min-w-full">
            {highlightedLines.map((tokens, lineIdx) => {
              const info = projection.lineMap[lineIdx];
              const isActive = lineIdx === activeProjectedLine;
              const isTabHeader =
                !info?.isFoldPlaceholder && info?.headerBlock?.kind === 'tab';
              const isModuleHeader =
                !info?.isFoldPlaceholder && info?.headerBlock?.kind === 'module';
              const hasDiag =
                !info?.isFoldPlaceholder &&
                Boolean(info && diagnosticsByRealLine.has(info.realLineNumber));

              let rowBg = '';
              if (info?.isFoldPlaceholder) {
                rowBg = 'bg-[#1b1b22] border-y border-[#2b2b36]';
              } else if (isTabHeader) {
                rowBg = 'bg-[#f59e0b]/[0.07] border-t border-[#f59e0b]/25';
              } else if (isActive) {
                rowBg = 'bg-[#18181f]';
              } else if (isModuleHeader) {
                rowBg = 'bg-[#c084fc]/[0.03]';
              }

              return (
                <div
                  key={lineIdx}
                  className={`min-w-full ${rowBg} ${
                    hasDiag ? 'underline decoration-wavy decoration-[#f59e0b]' : ''
                  }`}
                  style={{ height: `${LINE_HEIGHT}px`, lineHeight: `${LINE_HEIGHT}px` }}
                >
                  {tokens.length === 0 ? (
                    '\u200B'
                  ) : (
                    tokens.map((tok, tIdx) => (
                      <span
                        key={tIdx}
                        className={getTokenColorClass(tok)}
                        style={
                          tok.hexColor
                            ? {
                                textDecoration: 'underline',
                                textDecorationColor: tok.hexColor,
                                textDecorationThickness: '2px',
                                textUnderlineOffset: '2px',
                              }
                            : undefined
                        }
                      >
                        {searchQuery
                          ? renderTextWithSearchHighlight(tok.text, searchQuery)
                          : tok.text}
                      </span>
                    ))
                  )}
                </div>
              );
            })}
            </div>
          </div>

          {/* Camada de Entrada Nativa (<textarea>) */}
          <textarea
            ref={textareaRef}
            value={projection.projectedSource}
            onChange={handleTextareaChange}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onClick={handleTextareaClick}
            onBlur={() => {
              // Pequeno atraso para permitir clique com mouse no item do autocomplete
              setTimeout(() => {
                setCompletionOpen(false);
                setForceCompletion(false);
              }, 150);
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
            placeholder="Escreva a definição da ficha modular em SGM-SDL (digite @ para ver blocos ou Ctrl+Espaço)..."
            className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-[#f4f4f5] selection:bg-[#3b82f6]/30 focus:outline-none resize-none overflow-auto"
            style={{
              paddingTop: `${EDITOR_PAD_TOP}px`,
              paddingBottom: '32px',
              paddingLeft: `${EDITOR_PAD_LEFT}px`,
              paddingRight: '24px',
              fontFamily: EDITOR_FONT_FAMILY,
              fontSize: EDITOR_FONT_SIZE,
              lineHeight: `${LINE_HEIGHT}px`,
              tabSize: 2,
              whiteSpace: 'pre',
            }}
          />
        </div>

        {/* POPOVER DE AUTOCOMPLETE ALGORÍTMICO (Sem efeitos/brilhos, chapado e objetivo) */}
        {completionResult && completionResult.items.length > 0 && (
          <div
            style={completionPopoverStyle}
            className="absolute z-30 bg-[#18181d] border border-[#32323d] rounded overflow-hidden select-none"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="px-2 py-0.5 sm:py-1 bg-[#131317] border-b border-[#26262f] flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-[#8e8e98]">
              <span className="truncate">{completionResult.contextLabel}</span>
              <span className="text-[#6b7280] shrink-0 ml-2">Tab insere</span>
            </div>

            <div className="max-h-[160px] sm:max-h-[224px] overflow-y-auto divide-y divide-[#202027]">
              {completionResult.items.map((item, idx) => {
                const isSelected = idx === selectedCompletionIdx;
                const prevTier = idx > 0 ? completionResult.items[idx - 1]?.tier : undefined;
                const showTierDivider = item.tier !== undefined && item.tier !== prevTier;
                const tierTitle =
                  item.tier === 1
                    ? '1º • Criações / Tags'
                    : item.tier === 2
                      ? '2º • Variáveis'
                      : '3º • Outros';

                return (
                  <React.Fragment key={item.id}>
                    {showTierDivider && (
                      <div className="px-2 py-0.5 bg-[#121216] text-[8px] sm:text-[9px] font-mono uppercase tracking-wider text-[#71717a]">
                        {tierTitle}
                      </div>
                    )}
                    <button
                      type="button"
                      onMouseEnter={() => setSelectedCompletionIdx(idx)}
                      onClick={() => acceptCompletion(item)}
                      className={`w-full px-2 py-0.5 sm:py-1 text-left flex items-center justify-between gap-1.5 text-[10px] sm:text-[11px] font-mono transition-colors ${
                        isSelected
                          ? 'bg-[#272733] text-[#f4f4f5]'
                          : 'bg-[#18181d] text-[#d4d4d8] hover:bg-[#202028]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`px-1 py-0 rounded border text-[8px] leading-3 shrink-0 ${getCompletionBadgeStyle(
                            item.category,
                          )}`}
                        >
                          {item.badge}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span className="text-[9px] text-[#71717a] truncate max-w-[120px] shrink-0 hidden sm:inline">
                        {item.detail}
                      </span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* PAINEL DE DIAGNÓSTICOS CLICÁVEIS (Se houver avisos e estiver aberto) */}
      {showDiagnostics && compiledSheet.diagnostics.length > 0 && (
        <div className="max-h-28 overflow-y-auto border-t border-[#27272f] bg-[#141418] divide-y divide-[#1f1f26] shrink-0">
          {compiledSheet.diagnostics.map((diag, idx) => {
            const lineNum = diag.span?.start?.line || 1;
            const colNum = diag.span?.start?.column || 1;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => jumpToRealLine(Math.max(0, lineNum - 1), Math.max(0, colNum - 1))}
                className="w-full px-3 py-1 text-left flex items-center gap-2 hover:bg-[#1c1c23] text-[11px] font-mono text-[#fcd34d]"
              >
                <AlertTriangle className="w-3 h-3 shrink-0 text-[#f59e0b]" />
                <span className="text-[#8e8e98] shrink-0">
                  L{lineNum}:{colNum}
                </span>
                <span className="truncate text-[#e4e4e7]">{diag.message}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* RODAPÉ DE STATUS ENXUTO */}
      <div className="px-3 py-1 border-t border-[#222228] bg-[#131317] flex items-center justify-between text-[10px] font-mono text-[#71717a] shrink-0">
        <div className="flex items-center gap-3">
          <span>
            Linha {currentRealLineNumber}/{totalRealLines}
          </span>
          {foldedIds.size > 0 && (
            <span className="text-[#a1a1aa]">
              {foldedIds.size} {foldedIds.size === 1 ? 'área recolhida' : 'áreas recolhidas'}
            </span>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span>@ Blocos</span>
          <span>Ctrl+Espaço Autocompletar</span>
          <span>Ctrl+F Rastrear</span>
        </div>
      </div>
    </div>
  );
}
