// ============================================================================
// SGM-SDL — INTELIGÊNCIA ALGORÍTMICA DO EDITOR (SYNTAX HIGHLIGHT, FOLDING & AUTOCOMPLETE)
// Zero IA / 100% Determinístico (Análise Léxica, Tabela de Símbolos IR, Subsequência/Prefixo)
// ============================================================================

import type { CompiledSheet } from './types';

// ============================================================================
// 1. TIPOS DE SYNTAX HIGHLIGHTING
// ============================================================================

export type DSLHighlightTokenKind =
  | 'comment'
  | 'directive_tab'
  | 'directive_config'
  | 'directive_module'
  | 'subkeyword'
  | 'string'
  | 'dice'
  | 'number'
  | 'operator'
  | 'bracket'
  | 'punctuation'
  | 'prop_key'
  | 'layout_kw'
  | 'flag'
  | 'tag'
  | 'builtin_fn'
  | 'builtin_var'
  | 'symbol_decl'
  | 'symbol_ref'
  | 'fold_placeholder'
  | 'plain';

export interface DSLHighlightToken {
  kind: DSLHighlightTokenKind;
  text: string;
  hexColor?: string;
}

// ============================================================================
// 2. CATÁLOGO ESTÁTICO DA GRAMÁTICA SGM-SDL
// ============================================================================

const TAB_DIRECTIVES = new Set(['tab', 'aba', 'secao', 'section']);

const CONFIG_DIRECTIVES = new Set([
  'meta',
  'ficha',
  'sheet',
  'character',
  'personagem',
  'tema',
  'theme',
  'cores',
  'colors',
  'estilo',
  'style',
  'nav',
  'abas',
  'tabs',
  'navegacao',
  'navigation',
  'tab_flow',
  'tabflow',
  'fluxo_abas',
  'controle_abas',
  'tabbar',
  'tabs_nav',
]);

const MODULE_DIRECTIVES = new Set([
  'tab_flow',
  'tabflow',
  'fluxo_abas',
  'controle_abas',
  'tabbar',
  'tabs_nav',
  'attr',
  'attrs',
  'attributes',
  'atributos',
  'stat',
  'stats',
  'derived',
  'derivados',
  'status',
  'res',
  'resource',
  'resources',
  'recursos',
  'skill',
  'skills',
  'pericias',
  'inv',
  'inventory',
  'inventario',
  'gear',
  'equipamento',
  'ability',
  'abilities',
  'habilidades',
  'actions',
  'acoes',
  'moves',
  'movimentos',
  'powers',
  'poderes',
  'spells',
  'magias',
  'rituals',
  'rituais',
  'slots',
  'escaninhos',
  'caixas',
  'condicoes',
  'conditions',
  'counter',
  'counters',
  'contador',
  'contadores',
  'relogios',
  'clocks',
  'profile',
  'perfil',
  'retrato',
  'portrait',
  'identidade',
  'texto',
  'text',
  'notas',
  'notes',
  'bio',
  'lore',
  'anotacoes',
  'desc',
  'descriptors',
  'descritores',
  'aspects',
  'aspectos',
  'traits',
  'tracos',
  'turn',
  'turno',
  'economy',
  'economia',
  'rank',
  'ranks',
  'graus',
  'table',
  'tabela',
  'roll',
  'rolagem',
  'resolve',
  'resolution',
  'resolucao',
  'diagram',
  'diagrama',
  'body',
  'corpo',
  'mech',
  'rule',
  'rules',
  'regras',
]);

const SUBBLOCK_KEYWORDS = new Set([
  'item',
  'ability',
  'habilidade',
  'action',
  'acao',
  'spell',
  'magia',
  'ritual',
  'move',
  'movimento',
  'enhance',
  'aprimoramento',
  'upcast',
  'when',
  'quando',
  'active',
  'ativo',
  'rule',
  'regra',
  'tag',
  'aspect',
  'aspecto',
  'resistance',
  'resistencia',
  'immunity',
  'imunidade',
  'vulnerability',
  'vulnerabilidade',
  'consequence',
  'consequencia',
  'sense',
  'sentido',
  'slot',
  'escaninho',
  'condicao',
  'condition',
  'counter',
  'contador',
  'relogio',
  'clock',
  'convert',
  'converter',
  'node',
  'parte',
  'choice',
  'escolha',
  'default',
  'padrao',
]);

const LAYOUT_AND_STYLE_KEYWORDS = new Set([
  'col1',
  'col2',
  'left',
  'right',
  'esquerda',
  'direita',
  'full',
  'wide',
  'inteiro',
  'largura_total',
  'cards',
  'cartoes',
  'grid',
  'grade',
  'list',
  'lista',
  'compact',
  'compacto',
  'pyramid',
  'piramide',
  'tall',
  'alto',
  'expandido',
  'segments',
  'segmentos',
  'barras',
  'dots',
  'pontos',
  'bolinhas',
  'pie',
  'pizza',
  'relogio',
  'clock',
  'empty',
  'vazio',
  'filled',
  'preenchido',
  'ocupado',
  'damaged',
  'danificado',
  'ferido',
  'locked',
  'bloqueado',
  'trancado',
  'red',
  'vermelho',
  'amber',
  'laranja',
  'dourado',
  'purple',
  'roxo',
  'emerald',
  'green',
  'verde',
  'blue',
  'azul',
  'cyan',
  'ciano',
  'rose',
  'rosa',
  'dark',
  'escuro',
  'true',
  'false',
  'sim',
  'nao',
  'top',
  'bottom',
  'semicircle',
  'semicirculo',
  'inline',
  'flow',
  'cima',
  'baixo',
  'topo',
  'rodape',
  'inferior',
  'superior',
  'side',
  'none',
  'center',
  'stretch',
  'hidden',
  'sm',
  'md',
  'lg',
  'banner',
  'contain',
  'cover',
  'auto',
  'bar',
  'track',
  'pool',
]);

const BUILTIN_FUNCTIONS = new Set([
  'floor',
  'ceil',
  'round',
  'min',
  'max',
  'abs',
  'clamp',
  'step',
  'lookup',
  'load',
  'slots',
  'has',
  'if',
]);

const BUILTIN_VARS = new Set([
  'self',
  'attr',
  'level',
  'nivel',
  'nex',
  'carga_atual',
  'capacidade_max',
]);

// ============================================================================
// 3. EXTRAÇÃO DE SÍMBOLOS VIVOS DA FICHA (TABELA DE SÍMBOLOS)
// ============================================================================

export interface DSLSheetSymbol {
  id: string;
  label: string;
  category: 'attr' | 'stat' | 'resource' | 'skill' | 'rank' | 'counter' | 'tab';
  detail: string;
}

function formatSymbolValue(val: unknown): string {
  if (val && typeof val === 'object' && 'kind' in val && (val as { kind?: string }).kind === 'step_die') {
    const faces = (val as { faces?: number | string }).faces;
    return `d${faces ?? 6}`;
  }
  return String(val ?? 0);
}

export function extractSheetSymbols(compiled: CompiledSheet | null | undefined): {
  symbolSet: Set<string>;
  symbols: DSLSheetSymbol[];
} {
  const symbolSet = new Set<string>();
  const symbols: DSLSheetSymbol[] = [];

  if (!compiled) {
    return { symbolSet, symbols };
  }

  // Atributos
  for (const [id, attr] of Object.entries(compiled.attributes || {})) {
    symbolSet.add(id);
    symbols.push({
      id,
      label: attr.label || id,
      category: 'attr',
      detail: `Atributo (${formatSymbolValue(attr.finalValue)})`,
    });
  }

  // Status Derivados
  for (const [id, stat] of Object.entries(compiled.stats || {})) {
    if (symbolSet.has(id)) continue;
    symbolSet.add(id);
    symbols.push({
      id,
      label: stat.label || id,
      category: 'stat',
      detail: `Status = ${formatSymbolValue(stat.finalValue)}`,
    });
  }

  // Recursos
  for (const [id, res] of Object.entries(compiled.resources || {})) {
    if (symbolSet.has(id)) continue;
    symbolSet.add(id);
    symbols.push({
      id,
      label: res.label || id,
      category: 'resource',
      detail: `Recurso (${res.current}/${res.max})`,
    });
  }

  // Graus / Ranks
  for (const [groupName, group] of Object.entries(compiled.ranks || {})) {
    for (const [rankId, val] of Object.entries(group || {})) {
      if (symbolSet.has(rankId)) continue;
      symbolSet.add(rankId);
      symbols.push({
        id: rankId,
        label: rankId,
        category: 'rank',
        detail: `Grau ${groupName} (+${val})`,
      });
    }
  }

  // Perícias
  for (const [id, skill] of Object.entries(compiled.skills || {})) {
    if (symbolSet.has(id)) continue;
    symbolSet.add(id);
    const rawDisplay =
      skill.rawValue !== undefined &&
      (typeof skill.rawValue === 'string' ||
        (typeof skill.rawValue === 'object' && skill.rawValue.kind === 'step_die'))
        ? formatSymbolValue(skill.rawValue)
        : skill.bonus >= 0
          ? `+${skill.bonus}`
          : `${skill.bonus}`;
    symbols.push({
      id,
      label: skill.label || id,
      category: 'skill',
      detail: `Perícia (${skill.baseAttr ? `${skill.baseAttr}, ` : ''}${rawDisplay})`,
    });
  }

  // Contadores
  for (const block of compiled.counters || []) {
    for (const item of block.items || []) {
      if (symbolSet.has(item.id)) continue;
      symbolSet.add(item.id);
      symbols.push({
        id: item.id,
        label: item.label || item.id,
        category: 'counter',
        detail: `Contador (${item.current}/${item.max})`,
      });
    }
  }

  return { symbolSet, symbols };
}

// ============================================================================
// 4. TOKENIZADOR RÁPIDO LINHA A LINHA PARA SYNTAX HIGHLIGHTING
// ============================================================================

const FOLD_LINE_REGEX = /^\s*▸\s*\[\d+\s+linhas?\s+recolhidas?.*\]\s*«fold:([a-zA-Z0-9_:-]+)»\s*$/;
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const DICE_TOKEN_REGEX = /^(?:\d+)?d(?:\d+|F)(?:k[hl]\d+|d[hl]\d+|r[<>=]?\d+|!+)?$/i;

export function tokenizeDSLLine(line: string, declaredSymbols: Set<string>): DSLHighlightToken[] {
  if (!line) return [];

  // Linha especial de bloco recolhido (Fold Placeholder)
  if (FOLD_LINE_REGEX.test(line)) {
    const cleanDisplay = line.replace(/\s*«fold:[a-zA-Z0-9_:-]+»\s*$/, '');
    return [{ kind: 'fold_placeholder', text: cleanDisplay }];
  }

  const tokens: DSLHighlightToken[] = [];
  const len = line.length;
  let i = 0;
  let bracketDepth = 0;
  let hasSeenAssignOnLine = false;

  const pushPlain = (text: string) => {
    if (!text) return;
    const last = tokens[tokens.length - 1];
    if (last && last.kind === 'plain') {
      last.text += text;
    } else {
      tokens.push({ kind: 'plain', text });
    }
  };

  while (i < len) {
    const ch = line[i];
    const next = i + 1 < len ? line[i + 1] : '';

    // 1. Espaços em branco
    if (ch === ' ' || ch === '\t') {
      let start = i;
      while (i < len && (line[i] === ' ' || line[i] === '\t')) i++;
      pushPlain(line.slice(start, i));
      continue;
    }

    // 2. Comentários // ou /* */
    if (ch === '/' && next === '/') {
      tokens.push({ kind: 'comment', text: line.slice(i) });
      break;
    }
    if (ch === '/' && next === '*') {
      const closeIdx = line.indexOf('*/', i + 2);
      if (closeIdx === -1) {
        tokens.push({ kind: 'comment', text: line.slice(i) });
        break;
      } else {
        tokens.push({ kind: 'comment', text: line.slice(i, closeIdx + 2) });
        i = closeIdx + 2;
        continue;
      }
    }

    // 3. Comentário # (no início da linha ou seguido de espaço) ou Tag #ident
    if (ch === '#') {
      const isLineStart = tokens.every((t) => t.kind === 'plain');
      if (isLineStart && (next === ' ' || next === '\t' || next === '#' || next === '')) {
        tokens.push({ kind: 'comment', text: line.slice(i) });
        break;
      }
      if (next === ' ' || next === '\t') {
        tokens.push({ kind: 'comment', text: line.slice(i) });
        break;
      }
      // Tag ou Hex #...
      let start = i;
      i++;
      while (i < len && /[a-zA-Z0-9_\u00C0-\u017F-]/.test(line[i])) i++;
      const tagText = line.slice(start, i);
      const isHex = HEX_COLOR_REGEX.test(tagText);
      tokens.push({
        kind: 'tag',
        text: tagText,
        hexColor: isHex ? tagText : undefined,
      });
      continue;
    }

    // 4. Diretivas @...
    if (ch === '@') {
      let start = i;
      i++;
      while (i < len && /[a-zA-Z0-9_\u00C0-\u017F-]/.test(line[i])) i++;
      const fullDirective = line.slice(start, i);
      const rawName = fullDirective
        .slice(1)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      let kind: DSLHighlightTokenKind = 'directive_module';
      if (TAB_DIRECTIVES.has(rawName)) {
        kind = 'directive_tab';
      } else if (CONFIG_DIRECTIVES.has(rawName)) {
        kind = 'directive_config';
      } else if (MODULE_DIRECTIVES.has(rawName)) {
        kind = 'directive_module';
      }
      tokens.push({ kind, text: fullDirective });
      continue;
    }

    // 5. Flags !equipped, !active, etc.
    if (ch === '!' && /[a-zA-Z_\u00C0-\u017F]/.test(next)) {
      let start = i;
      i++;
      while (i < len && /[a-zA-Z0-9_\u00C0-\u017F-]/.test(line[i])) i++;
      tokens.push({ kind: 'flag', text: line.slice(start, i) });
      continue;
    }

    // 6. Strings "..." ou '...'
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let start = i;
      i++;
      while (i < len) {
        if (line[i] === '\\') {
          i += 2;
          continue;
        }
        if (line[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      const strText = line.slice(start, i);
      const inner = strText.slice(1, -1).trim();
      const hexColor = HEX_COLOR_REGEX.test(inner) ? inner : undefined;
      tokens.push({ kind: 'string', text: strText, hexColor });
      continue;
    }

    // 7. Operadores compostos e simples
    const twoChar = line.slice(i, i + 2);
    if (
      twoChar === ':=' ||
      twoChar === ':!' ||
      twoChar === '+=' ||
      twoChar === '-=' ||
      twoChar === '->' ||
      twoChar === '..' ||
      twoChar === '==' ||
      twoChar === '!=' ||
      twoChar === '<=' ||
      twoChar === '>=' ||
      twoChar === '&&' ||
      twoChar === '||'
    ) {
      if (twoChar === ':=' || twoChar === ':!' || twoChar === '+=' || twoChar === '-=' || twoChar === '->') {
        hasSeenAssignOnLine = true;
      }
      tokens.push({ kind: 'operator', text: twoChar });
      i += 2;
      continue;
    }

    if (ch === '=' || ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '<' || ch === '>') {
      if (ch === '=') hasSeenAssignOnLine = true;
      tokens.push({ kind: 'operator', text: ch });
      i++;
      continue;
    }

    // 8. Delimitadores de escopo
    if (ch === '[' || ch === ']' || ch === '(' || ch === ')' || ch === '{' || ch === '}') {
      if (ch === '[') bracketDepth++;
      if (ch === ']' && bracketDepth > 0) bracketDepth--;
      tokens.push({ kind: 'bracket', text: ch });
      i++;
      continue;
    }

    // 9. Pontuação
    if (ch === ',' || ch === ':' || ch === ';' || ch === '.' || ch === '|') {
      if (ch === ':') hasSeenAssignOnLine = true;
      tokens.push({ kind: 'punctuation', text: ch });
      i++;
      continue;
    }

    // 10. Dados (ex: 1d20kh1, 2d6, d20) ou Números ou Identificadores
    if (/[0-9a-zA-Z_\u00C0-\u017F]/.test(ch)) {
      let start = i;
      while (i < len && /[0-9a-zA-Z_\u00C0-\u017F!]/.test(line[i])) {
        // Só consome '!' no meio/fim se fizer parte de expressão de dado explosivo (ex: 4d6!)
        if (line[i] === '!' && !/^\d*d\d+/i.test(line.slice(start, i))) {
          break;
        }
        i++;
      }
      const word = line.slice(start, i);
      const lower = word
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      // Olha adiante ignorando espaços para saber se é chave `prop:` ou função `fn(` ou declaração `ID :=`
      let lookahead = i;
      while (lookahead < len && (line[lookahead] === ' ' || line[lookahead] === '\t')) {
        lookahead++;
      }
      const nextNonSpace = line.slice(lookahead, lookahead + 2);
      const nextChar = line[lookahead] || '';

      // Literal de dado (1d20, 2d6, d20kh1, dF)
      if (DICE_TOKEN_REGEX.test(word)) {
        tokens.push({ kind: 'dice', text: word });
        continue;
      }

      // Número puro (ex: 10, 1.5)
      if (/^\d+$/.test(word)) {
        if (line[i] === '.' && i + 1 < len && /\d/.test(line[i + 1])) {
          i++;
          while (i < len && /\d/.test(line[i])) i++;
          tokens.push({ kind: 'number', text: line.slice(start, i) });
        } else {
          tokens.push({ kind: 'number', text: word });
        }
        continue;
      }

      // Chave de propriedade seguida de ':' (mas não ':=' ou ':!')
      if (nextChar === ':' && nextNonSpace !== ':=' && nextNonSpace !== ':!') {
        tokens.push({ kind: 'prop_key', text: word });
        continue;
      }

      // Palavras-chave de layout/estilo dentro de [...]
      if (bracketDepth > 0 && LAYOUT_AND_STYLE_KEYWORDS.has(lower)) {
        tokens.push({ kind: 'layout_kw', text: word });
        continue;
      }

      // Sub-declarações no início da linha (item, ability, spell, action, enhance, when, rule...)
      const isFirstSemanticToken = tokens.every((t) => t.kind === 'plain');
      if (isFirstSemanticToken && SUBBLOCK_KEYWORDS.has(lower)) {
        tokens.push({ kind: 'subkeyword', text: word });
        continue;
      }
      if ((lower === 'active' || lower === 'ativo') && tokens.some((t) => t.kind === 'subkeyword')) {
        tokens.push({ kind: 'subkeyword', text: word });
        continue;
      }

      // Função embutida seguida de '('
      if (nextChar === '(' && BUILTIN_FUNCTIONS.has(lower)) {
        tokens.push({ kind: 'builtin_fn', text: word });
        continue;
      }

      // Variáveis embutidas (self, attr, level, nex)
      if (BUILTIN_VARS.has(lower)) {
        tokens.push({ kind: 'builtin_var', text: word });
        continue;
      }

      // Declaração de símbolo no início da linha antes de :=, :!, = ou (ATTR)
      if (
        isFirstSemanticToken &&
        !hasSeenAssignOnLine &&
        (nextNonSpace === ':=' ||
          nextNonSpace === ':!' ||
          nextChar === '=' ||
          nextChar === '(' ||
          nextChar === '[')
      ) {
        tokens.push({ kind: 'symbol_decl', text: word });
        continue;
      }

      // Referência a símbolo declarado na ficha (FOR, AGI, DEF, PV, treinado...)
      if (declaredSymbols.has(word)) {
        tokens.push({ kind: 'symbol_ref', text: word });
        continue;
      }

      if (LAYOUT_AND_STYLE_KEYWORDS.has(lower)) {
        tokens.push({ kind: 'layout_kw', text: word });
        continue;
      }

      tokens.push({ kind: 'plain', text: word });
      continue;
    }

    // Qualquer outro caractere
    pushPlain(ch);
    i++;
  }

  return tokens;
}

// ============================================================================
// 5. RASTREIO ESTRUTURAL E CODE FOLDING (POR ABA, MÓDULO E SUB-ITEM)
// ============================================================================

export type DSLFoldableKind = 'tab' | 'module' | 'subitem';

export interface DSLFoldableBlock {
  id: string;        // Chave estável resistente a edições em outras linhas
  kind: DSLFoldableKind;
  directive: string;
  label: string;
  tabName: string;
  startLine: number; // 0-indexed inclusive
  endLine: number;   // 0-indexed inclusive
  lineCount: number; // Quantidade de linhas que serão ocultadas (endLine - startLine)
  previewSummary: string;
}

export interface DSLStructureAnalysis {
  blocks: DSLFoldableBlock[];
  byStartLine: Map<number, DSLFoldableBlock>;
  byId: Map<string, DSLFoldableBlock>;
  tabs: DSLFoldableBlock[];
  modules: DSLFoldableBlock[];
  subitems: DSLFoldableBlock[];
}

function normalizeDirectiveName(raw: string): string {
  return raw
    .replace(/^@/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extractHeaderLabel(line: string, directive: string): string {
  // 1. Procura título antes dos colchetes [...] (ex: @attr "Atributos" [col1])
  const beforeBracket = line.split('[')[0] || '';
  const quoteMatch = beforeBracket.match(/"([^"]+)"|'([^']+)'/);
  if (quoteMatch) {
    const candidate = (quoteMatch[1] || quoteMatch[2] || '').trim();
    if (candidate && !/^#[0-9a-fA-F]{3,8}$/.test(candidate)) {
      return candidate;
    }
  }

  // 2. Procura propriedade explícita title: "..." ou titulo: "..." dentro de [...]
  const explicitTitleMatch = line.match(/\b(?:title|titulo)\s*:\s*(?:"([^"]+)"|'([^']+)')/i);
  if (explicitTitleMatch) {
    const candidate = (explicitTitleMatch[1] || explicitTitleMatch[2] || '').trim();
    if (candidate) return candidate;
  }

  // 3. Em @rank, @table, @diagram ou @roll sem aspas, captura o identificador (ex: @rank treino)
  const norm = normalizeDirectiveName(directive);
  if (
    norm === 'rank' ||
    norm === 'ranks' ||
    norm === 'graus' ||
    norm === 'table' ||
    norm === 'tabela' ||
    norm === 'diagram' ||
    norm === 'diagrama' ||
    norm === 'roll' ||
    norm === 'rolagem' ||
    norm === 'resolve' ||
    norm === 'resolution' ||
    norm === 'resolucao'
  ) {
    const identMatch = beforeBracket.replace(/^@[a-zA-Z0-9_\u00C0-\u017F-]+\s*/, '').match(/^([a-zA-Z_\u00C0-\u017F][a-zA-Z0-9_\u00C0-\u017F-]*)/);
    if (identMatch && identMatch[1]) {
      return identMatch[1];
    }
  }

  const friendlyNames: Record<string, string> = {
    meta: 'Metadados da Ficha',
    ficha: 'Metadados da Ficha',
    tema: 'Tema & Cores',
    theme: 'Tema & Cores',
    nav: 'Navegação de Abas',
    attr: 'Atributos',
    attributes: 'Atributos',
    atributos: 'Atributos',
    stat: 'Status Derivados',
    stats: 'Status Derivados',
    res: 'Recursos (Barras)',
    resources: 'Recursos (Barras)',
    recursos: 'Recursos (Barras)',
    skill: 'Perícias',
    skills: 'Perícias',
    pericias: 'Perícias',
    inv: 'Inventário & Carga',
    inventory: 'Inventário & Carga',
    ability: 'Habilidades & Magias',
    abilities: 'Habilidades & Magias',
    slots: 'Escaninhos & Condições',
    counter: 'Contadores & Relógios',
    counters: 'Contadores & Relógios',
    profile: 'Perfil & Retrato',
    perfil: 'Perfil & Retrato',
    texto: 'Bloco de Texto',
    text: 'Bloco de Texto',
    desc: 'Descritores & Traços',
    turn: 'Economia de Turno',
    rank: 'Graus de Treinamento',
    ranks: 'Graus de Treinamento',
    rule: 'Regras Condicionais',
    rules: 'Regras Condicionais',
    roll: 'Resolução de Rolagem',
    rolagem: 'Resolução de Rolagem',
    resolve: 'Resolução de Rolagem',
    resolution: 'Resolução de Rolagem',
    diagram: 'Diagrama Corporal',
    diagrama: 'Diagrama Corporal',
    table: 'Tabela de Consulta',
    tabela: 'Tabela de Consulta',
    tab_flow: 'Fluxo de Abas & Navegação',
    tabflow: 'Fluxo de Abas & Navegação',
    fluxo_abas: 'Fluxo de Abas & Navegação',
    controle_abas: 'Fluxo de Abas & Navegação',
  };
  return friendlyNames[norm] || directive;
}

function buildBlockPreview(lines: string[], startLine: number, endLine: number, kind: DSLFoldableKind): string {
  const items: string[] = [];
  for (let l = startLine + 1; l <= endLine; l++) {
    const raw = lines[l].trim();
    if (!raw || raw.startsWith('//') || raw.startsWith('#')) continue;

    if (kind === 'tab') {
      const dirMatch = raw.match(/^(@[a-zA-Z0-9_\u00C0-\u017F-]+)/);
      if (dirMatch) {
        items.push(dirMatch[1]);
      }
    } else {
      // Captura string de item/ability ou identificador declarado
      const strMatch = raw.match(/^(?:item|ability|action|spell|move|slot|counter|relogio)\s+"([^"]+)"/i);
      if (strMatch) {
        items.push(strMatch[1]);
      } else {
        const declMatch = raw.match(/^([a-zA-Z_\u00C0-\u017F][a-zA-Z0-9_\u00C0-\u017F]*)\s*(?::=|:!|=|\(|\[)/);
        if (declMatch && !SUBBLOCK_KEYWORDS.has(declMatch[1].toLowerCase())) {
          items.push(declMatch[1]);
        }
      }
    }
    if (items.length >= 6) break;
  }

  if (items.length === 0) return '';
  const joined = items.slice(0, 5).join(', ');
  return items.length > 5 ? `${joined}, …` : joined;
}

function toSafeIdSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || 'sec';
}

/**
 * Escaneia o código-fonte completo do DSL e identifica todas as regiões
 * que podem ser recolhidas/expandidas (Abas `@tab`, Módulos `@attr/@skill/...` e Sub-itens).
 */
export function analyzeDSLStructure(fullSource: string): DSLStructureAnalysis {
  const lines = fullSource.split('\n');
  const totalLines = lines.length;

  const rawDirectives: Array<{
    lineIndex: number;
    directive: string;
    normName: string;
    isTab: boolean;
    label: string;
  }> = [];

  for (let i = 0; i < totalLines; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(@[a-zA-Z0-9_\u00C0-\u017F-]+)/);
    if (match) {
      const directive = match[1];
      const normName = normalizeDirectiveName(directive);
      const isTab = TAB_DIRECTIVES.has(normName);
      const label = extractHeaderLabel(trimmed, directive);
      rawDirectives.push({ lineIndex: i, directive, normName, isTab, label });
    }
  }

  // Encontra última linha não-vazia num intervalo [from, to]
  const findLastContentLine = (from: number, to: number): number => {
    let end = to;
    while (end > from && lines[end].trim() === '') {
      end--;
    }
    return end;
  };

  const blocks: DSLFoldableBlock[] = [];
  const tabs: DSLFoldableBlock[] = [];
  const modules: DSLFoldableBlock[] = [];
  const subitems: DSLFoldableBlock[] = [];
  const keyCounts = new Map<string, number>();

  const nextStableId = (prefix: string): string => {
    const count = keyCounts.get(prefix) || 0;
    keyCounts.set(prefix, count + 1);
    return `${prefix}_${count}`;
  };

  let currentTabName = 'Principal';

  for (let idx = 0; idx < rawDirectives.length; idx++) {
    const curr = rawDirectives[idx];

    if (curr.isTab) {
      currentTabName = curr.label || 'Principal';
      let nextTabLine = totalLines - 1;
      for (let j = idx + 1; j < rawDirectives.length; j++) {
        if (rawDirectives[j].isTab) {
          nextTabLine = rawDirectives[j].lineIndex - 1;
          break;
        }
      }
      const endLine = findLastContentLine(curr.lineIndex, nextTabLine);
      if (endLine > curr.lineIndex) {
        const stableId = nextStableId(`tab_${toSafeIdSlug(currentTabName)}`);
        const block: DSLFoldableBlock = {
          id: stableId,
          kind: 'tab',
          directive: curr.directive,
          label: curr.label,
          tabName: currentTabName,
          startLine: curr.lineIndex,
          endLine,
          lineCount: endLine - curr.lineIndex,
          previewSummary: buildBlockPreview(lines, curr.lineIndex, endLine, 'tab'),
        };
        blocks.push(block);
        tabs.push(block);
      }
    } else {
      const nextDirLine =
        idx + 1 < rawDirectives.length ? rawDirectives[idx + 1].lineIndex - 1 : totalLines - 1;
      const endLine = findLastContentLine(curr.lineIndex, nextDirLine);
      const inlineTabMatch = lines[curr.lineIndex].match(
        /\b(?:tab|aba)\s*:\s*(?:"([^"]+)"|'([^']+)')/i,
      );
      const effectiveTabName = inlineTabMatch
        ? inlineTabMatch[1] || inlineTabMatch[2] || currentTabName
        : currentTabName;
      const stableModId = nextStableId(
        `mod_${toSafeIdSlug(effectiveTabName)}_${toSafeIdSlug(curr.normName)}`,
      );
      if (endLine > curr.lineIndex) {
        const block: DSLFoldableBlock = {
          id: stableModId,
          kind: 'module',
          directive: curr.directive,
          label: curr.label,
          tabName: effectiveTabName,
          startLine: curr.lineIndex,
          endLine,
          lineCount: endLine - curr.lineIndex,
          previewSummary: buildBlockPreview(lines, curr.lineIndex, endLine, 'module'),
        };
        blocks.push(block);
        modules.push(block);

        // Escaneia sub-itens multi-linha indentados dentro do módulo (item, ability, spell, action, move, ritual, node)
        let sLine = curr.lineIndex + 1;
        while (sLine <= endLine) {
          const rawLine = lines[sLine];
          const trimmedSub = rawLine.trim();
          const subMatch = trimmedSub.match(
            /^(item|ability|habilidade|action|acao|spell|magia|ritual|move|movimento|node|parte)\s+(?:"([^"]+)"|'([^']+)'|([a-zA-Z0-9_\u00C0-\u017F-]+))/i,
          );
          if (subMatch) {
            const subIndent = rawLine.search(/\S/);
            const subKeyword = subMatch[1];
            const subLabel = subMatch[2] || subMatch[3] || subMatch[4] || subKeyword;
            let subEnd = sLine;
            let k = sLine + 1;
            while (k <= endLine) {
              const kRaw = lines[k];
              const kTrim = kRaw.trim();
              if (!kTrim) {
                k++;
                continue;
              }
              const kIndent = kRaw.search(/\S/);
              if (kIndent > subIndent) {
                subEnd = k;
                k++;
              } else {
                break;
              }
            }
            if (subEnd > sLine) {
              const subId = nextStableId(`sub_${stableModId}_${toSafeIdSlug(subLabel)}`);
              const subBlock: DSLFoldableBlock = {
                id: subId,
                kind: 'subitem',
                directive: subKeyword,
                label: subLabel,
                tabName: currentTabName,
                startLine: sLine,
                endLine: subEnd,
                lineCount: subEnd - sLine,
                previewSummary: `${subKeyword} "${subLabel}"`,
              };
              blocks.push(subBlock);
              subitems.push(subBlock);
              sLine = subEnd + 1;
              continue;
            }
          }
          sLine++;
        }
      }
    }
  }

  const byStartLine = new Map<number, DSLFoldableBlock>();
  const byId = new Map<string, DSLFoldableBlock>();
  for (const b of blocks) {
    byStartLine.set(b.startLine, b);
    byId.set(b.id, b);
  }

  return { blocks, byStartLine, byId, tabs, modules, subitems };
}

// ============================================================================
// 6. PROJEÇÃO BIDIRECIONAL DE FOLDING (EDIÇÃO SEGURA COM BLOCOS RECOLHIDOS)
// ============================================================================

export interface ProjectedLineInfo {
  projectedIndex: number;
  realLineNumber: number; // 1-indexed para o gutter
  isFoldPlaceholder: boolean;
  foldBlockId?: string;
  headerBlock?: DSLFoldableBlock;
  isHeaderFolded?: boolean;
}

export interface DSLFoldProjection {
  projectedSource: string;
  lineMap: ProjectedLineInfo[];
  hiddenBodiesByBlockId: Map<string, string[]>;
  realToProjectedLine: (realLineZeroBased: number) => number;
}

/**
 * Constrói o documento projetado para o editor a partir do `fullSource` e do conjunto de IDs de blocos recolhidos.
 */
export function buildFoldProjection(
  fullSource: string,
  structure: DSLStructureAnalysis,
  foldedBlockIds: Set<string>,
): DSLFoldProjection {
  const fullLines = fullSource.split('\n');
  const projectedLines: string[] = [];
  const lineMap: ProjectedLineInfo[] = [];
  const hiddenBodiesByBlockId = new Map<string, string[]>();
  const realToProj = new Array<number>(fullLines.length).fill(0);

  let i = 0;
  while (i < fullLines.length) {
    const block = structure.byStartLine.get(i);
    const isFolded = Boolean(block && foldedBlockIds.has(block.id) && block.endLine > i);

    const projIdx = projectedLines.length;
    realToProj[i] = projIdx;

    // Adiciona a linha de cabeçalho (ou linha normal)
    projectedLines.push(fullLines[i]);
    lineMap.push({
      projectedIndex: projIdx,
      realLineNumber: i + 1,
      isFoldPlaceholder: false,
      headerBlock: block,
      isHeaderFolded: isFolded,
    });

    if (block && isFolded) {
      const hiddenSlice = fullLines.slice(i + 1, block.endLine + 1);
      hiddenBodiesByBlockId.set(block.id, hiddenSlice);

      const summaryPart = block.previewSummary ? `: ${block.previewSummary}` : '';
      const unitLabel = block.lineCount === 1 ? 'linha recolhida' : 'linhas recolhidas';
      const placeholderLine = `  ▸ [${block.lineCount} ${unitLabel}${summaryPart}] «fold:${block.id}»`;

      const placeholderProjIdx = projectedLines.length;
      for (let h = i + 1; h <= block.endLine; h++) {
        realToProj[h] = placeholderProjIdx;
      }

      projectedLines.push(placeholderLine);
      lineMap.push({
        projectedIndex: placeholderProjIdx,
        realLineNumber: i + 2,
        isFoldPlaceholder: true,
        foldBlockId: block.id,
        headerBlock: block,
        isHeaderFolded: true,
      });

      i = block.endLine + 1;
    } else {
      i++;
    }
  }

  return {
    projectedSource: projectedLines.join('\n'),
    lineMap,
    hiddenBodiesByBlockId,
    realToProjectedLine: (realLineZeroBased: number) => {
      const clamped = Math.max(0, Math.min(fullLines.length - 1, realLineZeroBased));
      return realToProj[clamped] ?? 0;
    },
  };
}

/**
 * Reconstrói o `fullSource` quando o usuário edita o texto projetado.
 * - Se a linha sentinela `«fold:ID»` continua intacta, reinsere as linhas originais ocultas.
 * - Se o usuário começou a digitar dentro da linha sentinela (corrompendo o marcador),
 *   expande automaticamente o bloco preservando o que foi digitado para nunca perder código oculto.
 */
export function reconstructFullSourceFromProjection(
  editedProjectedSource: string,
  projection: DSLFoldProjection,
): { fullSource: string; unfoldedBlockIds: string[] } {
  if (projection.hiddenBodiesByBlockId.size === 0) {
    return { fullSource: editedProjectedSource, unfoldedBlockIds: [] };
  }

  const editedLines = editedProjectedSource.split('\n');
  const restoredLines: string[] = [];
  const unfoldedBlockIds: string[] = [];

  for (const line of editedLines) {
    const exactMatch = line.match(FOLD_LINE_REGEX);
    if (exactMatch) {
      const blockId = exactMatch[1];
      const hidden = projection.hiddenBodiesByBlockId.get(blockId);
      if (hidden) {
        restoredLines.push(...hidden);
        continue;
      }
    }

    // Verifica se o usuário editou parcialmente uma linha que tinha «fold:ID»
    const partialMatch = line.match(/«fold:([a-zA-Z0-9_:-]+)»/);
    if (partialMatch) {
      const blockId = partialMatch[1];
      const hidden = projection.hiddenBodiesByBlockId.get(blockId);
      if (hidden) {
        unfoldedBlockIds.push(blockId);
        restoredLines.push(...hidden);
        continue;
      }
    }

    restoredLines.push(line);
  }

  return {
    fullSource: restoredLines.join('\n'),
    unfoldedBlockIds,
  };
}

// ============================================================================
// 7. MOTOR DE AUTOCOMPLETE ALGORÍTMICO (TRIE / SUBSEQUÊNCIA / CONTEXTO LÉXICO)
// ============================================================================

export type DSLCompletionCategory =
  | 'directive'
  | 'snippet'
  | 'attr'
  | 'stat'
  | 'resource'
  | 'skill'
  | 'rank'
  | 'counter'
  | 'meta_key'
  | 'layout'
  | 'flag'
  | 'keyword'
  | 'function'
  | 'dice';

export interface DSLCompletionItem {
  id: string;
  label: string;
  insertText: string;
  cursorOffsetFromEnd?: number; // Quantos caracteres voltar a partir do fim do insertText (ex: dentro de aspas ou parênteses)
  category: DSLCompletionCategory;
  badge: string;
  detail: string;
  tier?: 1 | 2 | 3; // 1 = Criações/Tags do Módulo, 2 = Variáveis da Ficha, 3 = Outras Recomendações
}

export interface DSLCompletionResult {
  replaceStart: number;
  replaceEnd: number;
  query: string;
  contextLabel: string;
  items: DSLCompletionItem[];
}

interface StaticDirectiveCompletion {
  directive: string;
  label: string;
  detail: string;
  snippet?: string;
  snippetLabel?: string;
  cursorBack?: number;
}

const DIRECTIVE_COMPLETIONS: StaticDirectiveCompletion[] = [
  {
    directive: '@tab',
    label: '@tab "Nome da Aba"',
    detail: 'Cria ou alterna para uma aba da ficha',
    snippet: '@tab "Nova Aba"\n',
    cursorBack: 2,
  },
  {
    directive: '@attr',
    label: '@attr [col1, cards]',
    detail: 'Bloco de atributos primários (FOR, DES, INT...)',
    snippet: '@attr "Atributos" [col1, cards]\n  FOR "Força"    := 2 [roll: "1d20 + self"]\n  DES "Destreza" := 2 [roll: "1d20 + self"]',
  },
  {
    directive: '@stat',
    label: '@stat [col1]',
    detail: 'Status calculados e defesas (DEF, Deslocamento...)',
    snippet: '@stat [col1]\n  DEF "Defesa" = 10 + DES\n  Deslocamento := 9',
  },
  {
    directive: '@res',
    label: '@res [col2]',
    detail: 'Barras ou trilhas de recursos (PV, PM, PE, SAN...)',
    snippet: '@res [col2]\n  PV "Pontos de Vida": 20 / 20\n  PM "Pontos de Mana": 10 / 10',
  },
  {
    directive: '@skill',
    label: '@skill [col2, list]',
    detail: 'Lista de perícias com rolagem automática',
    snippet: '@skill [col2, list, roll: 1d20 + attr + self]\n  Acrobacia (DES) = 0\n  Atletismo (FOR) = 0\n  Percepcao "Percepção" (SAB) = 0',
  },
  {
    directive: '@inv',
    label: '@inv [col1]',
    detail: 'Inventário, equipamentos, armas e capacidade de carga',
    snippet: '@inv [col1]\n  max_load = 10 + FOR * 2\n  item "Espada Longa" [weight: 1, qty: 1, !equipped, #arma]\n    action "Ataque" [type: "Padrão"]\n      damage: 1d8 + FOR\n      desc: "Arma corpo a corpo."',
  },
  {
    directive: '@ability',
    label: '@ability [col2]',
    detail: 'Habilidades, ações de combate, poderes, magias ou rituais',
    snippet: '@ability [col2]\n  ability "Ataque Especial" [type: "Livre", cost: 1, active: false]\n    desc: "Soma bônus no teste ou dano."\n    when active -> DEF += 2',
  },
  {
    directive: '@slots',
    label: '@slots "Escaninhos" [col2, cols: 3]',
    detail: 'Grade de escaninhos, condições ou espaços rápidos',
    snippet: '@slots "Inventário Rápido" [col2, cols: 3]\n  slot_1 "Item Rápido": 1/1\n  slot_2 [state: empty]',
  },
  {
    directive: '@counter',
    label: '@counter [col2, segments]',
    detail: 'Contadores visuais em segmentos, pontos ou relógio (pie)',
    snippet: '@counter [col2, segments]\n  acao_1 "Ação Especial": 2/3 [segments]\n  relogio_1 "Relógio": 0/4    [pie]',
  },
  {
    directive: '@profile',
    label: '@profile "Nome" [col1, md]',
    detail: 'Retrato do personagem, arquétipo e resumo biográfico',
    snippet: '@profile "Nome" [col1, md]\n  image: ""\n  archetype: "Classe"\n  level: 1\n  desc: "Descrição breve."',
  },
  {
    directive: '@texto',
    label: '@texto "Anotações" [col2]',
    detail: 'Bloco de texto livre para notas, história ou regras da mesa',
    snippet: '@texto "Anotações" [col2]\n  Escreva suas notas livres ou regras aqui.',
  },
  {
    directive: '@desc',
    label: '@desc [col1]',
    detail: 'Resistências, sentidos, aspectos e tags reativas',
    snippet: '@desc [col1]\n  senses: ["Visão na Penumbra"]\n  tag "Inspirado" [active: false] -> DEF += 2',
  },
  {
    directive: '@rank',
    label: '@rank treino',
    detail: 'Tabela de graus de treinamento reutilizáveis nas perícias',
    snippet: '@rank treino\n  destreinado = 0\n  treinado = 2\n  veterano = 4\n  expert = 6',
  },
  {
    directive: '@turn',
    label: '@turn [col2, reset: "round"]',
    detail: 'Economia de ações por turno (Padrão, Movimento, Reação)',
    snippet: '@turn [col2, reset: "round"]\n  padrao "Padrão": slots(1 / 1)\n  movimento "Movimento": slots(1 / 1)\n  reacao "Reação": slots(1 / 1)',
  },
  {
    directive: '@rule',
    label: '@rule',
    detail: 'Regra reativa global condicional',
    snippet: '@rule\n  rule PV <= 5 -> DEF -= 2',
  },
  {
    directive: '@roll',
    label: '@roll padrao(attr)',
    detail: 'Resolução global de rolagem com faixas de sucesso (PbtA, FitD...)',
    snippet: '@roll padrao(attr) = 2d6 + attr\n  >= 10: "Sucesso Total"\n  7..9: "Sucesso Parcial"\n  <= 6: "Falha"',
  },
  {
    directive: '@diagram',
    label: '@diagram corpo [full, layout: "humanoid"]',
    detail: 'Diagrama anatômico / partes do corpo com acerto localizado',
    snippet: '@diagram corpo [full, layout: "humanoid", hit_roll: 1d10]\n  node "Cabeça" [hit: 1..1, mult: 2]\n    pv: 4 / 4\n    armor: 1',
  },
  {
    directive: '@table',
    label: '@table nome_tabela',
    detail: 'Tabela de progressão ou consulta via lookup(tabela, valor)',
    snippet: '@table bonus_nivel\n  1..4 -> 2\n  5..8 -> 3\n  default -> 4',
  },
  {
    directive: '@meta',
    label: '@meta "Personagem" [...]',
    detail: 'Define nome, sistema, nível e tema base da ficha',
    snippet: '@meta "Personagem" [archetype: "Classe", system: "Sistema", level: 1, theme: "amber"]',
  },
  {
    directive: '@tema',
    label: '@tema [cor: "#d97706"]',
    detail: 'Personaliza cores hexadecimais da ficha',
    snippet: '@tema [cor: "#d97706", bg: "#0c0a09", card: "#161311"]',
  },
  {
    directive: '@nav',
    label: '@nav [pos: "top", labels: true]',
    detail: 'Configura posição e alinhamento da barra de abas',
    snippet: '@nav [pos: "top", labels: true, align: "left"]',
  },
  {
    directive: '@tab_flow',
    label: '@tab_flow [pos: "semicircle", labels: true]',
    detail: 'Controlador modular de fluxo de abas (semicircle, bottom, top, left, right, inline)',
    snippet: '@tab_flow [pos: "semicircle", labels: true]',
  },
];

const BRACKET_META_COMPLETIONS: Array<{
  label: string;
  insertText: string;
  cursorBack?: number;
  badge: string;
  detail: string;
  blocks?: string[];
  headerOnly?: boolean;
  itemOnly?: boolean;
}> = [
  // Posicionamento e layout de cabeçalho de módulo
  { label: 'col1', insertText: 'col1', badge: 'layout', detail: 'Posiciona o módulo na Coluna 1 (Esquerda)', headerOnly: true },
  { label: 'col2', insertText: 'col2', badge: 'layout', detail: 'Posiciona o módulo na Coluna 2 (Direita)', headerOnly: true },
  { label: 'full', insertText: 'full', badge: 'layout', detail: 'Ocupa a largura total das duas colunas', headerOnly: true },
  { label: 'cards', insertText: 'cards', badge: 'estilo', detail: 'Exibe os itens em grade de cartões', headerOnly: true },
  { label: 'list', insertText: 'list', badge: 'estilo', detail: 'Exibe os itens em lista compacta', headerOnly: true },
  { label: 'pyramid', insertText: 'pyramid', badge: 'estilo', detail: 'Exibe atributos em pirâmide', blocks: ['attr'], headerOnly: true },
  { label: 'tall', insertText: 'tall', badge: 'layout', detail: 'Permite altura expandida para o módulo', headerOnly: true },
  { label: 'tab: "Geral"', insertText: 'tab: "Geral"', cursorBack: 1, badge: 'aba', detail: 'Vincula este módulo a uma aba específica', headerOnly: true },
  { label: 'cor: "#10b981"', insertText: 'cor: "#10b981"', cursorBack: 1, badge: 'cor', detail: 'Cor de destaque hexadecimal personalizada' },
  // Controle de abas e navegação (@tab_flow / @nav / @meta)
  { label: 'pos: "semicircle"', insertText: 'pos: "semicircle"', cursorBack: 1, badge: 'abas', detail: 'Semi-círculo central embaixo com menu radial em tela cheia', blocks: ['tab_flow', 'nav', 'meta'], headerOnly: true },
  { label: 'pos: "bottom"', insertText: 'pos: "bottom"', cursorBack: 1, badge: 'abas', detail: 'Barra de abas fixada na parte inferior (padrão mobile)', blocks: ['tab_flow', 'nav', 'meta'], headerOnly: true },
  { label: 'pos: "top"', insertText: 'pos: "top"', cursorBack: 1, badge: 'abas', detail: 'Barra de abas fixada no topo da ficha', blocks: ['tab_flow', 'nav', 'meta'], headerOnly: true },
  { label: 'pos: "left"', insertText: 'pos: "left"', cursorBack: 1, badge: 'abas', detail: 'Barra de abas na lateral esquerda', blocks: ['tab_flow', 'nav', 'meta'], headerOnly: true },
  { label: 'pos: "right"', insertText: 'pos: "right"', cursorBack: 1, badge: 'abas', detail: 'Barra de abas na lateral direita', blocks: ['tab_flow', 'nav', 'meta'], headerOnly: true },
  { label: 'pos: "inline"', insertText: 'pos: "inline"', cursorBack: 1, badge: 'abas', detail: 'Barra de abas como módulo comum no fluxo da ficha', blocks: ['tab_flow', 'nav', 'meta'], headerOnly: true },
  { label: 'semicircle', insertText: 'semicircle', badge: 'abas', detail: 'Posiciona navegação como semi-círculo central', blocks: ['tab_flow', 'nav', 'meta'], headerOnly: true },
  { label: 'bottom', insertText: 'bottom', badge: 'abas', detail: 'Posiciona abas na parte inferior', blocks: ['tab_flow', 'nav', 'meta'], headerOnly: true },
  { label: 'top', insertText: 'top', badge: 'abas', detail: 'Posiciona abas no topo', blocks: ['tab_flow', 'nav', 'meta'], headerOnly: true },
  { label: 'inline', insertText: 'inline', badge: 'abas', detail: 'Exibe controle de abas inline na ficha', blocks: ['tab_flow', 'nav', 'meta'], headerOnly: true },
  { label: 'labels: true', insertText: 'labels: true', badge: 'abas', detail: 'Exibe nomes das abas junto aos ícones', blocks: ['tab_flow', 'nav', 'meta'], headerOnly: true },
  { label: 'labels: false', insertText: 'labels: false', badge: 'abas', detail: 'Exibe apenas ícones das abas', blocks: ['tab_flow', 'nav', 'meta'], headerOnly: true },
  // Propriedades de rolagem
  { label: 'roll: self', insertText: 'roll: self', badge: 'rolagem', detail: 'Rola diretamente o próprio dado/valor do atributo (ex: 1d6, d8)', blocks: ['attr', 'stat', 'skill'] },
  { label: 'roll: "1d20 + self"', insertText: 'roll: "1d20 + self"', cursorBack: 1, badge: 'rolagem', detail: 'Fórmula de rolagem ao clicar no atributo/status', blocks: ['attr', 'stat'] },
  { label: 'roll: 1d20 + attr + self', insertText: 'roll: 1d20 + attr + self', badge: 'rolagem', detail: 'Fórmula padrão de rolagem das perícias', blocks: ['skill'] },
  { label: 'roll: (attr)d20kh1 + self', insertText: 'roll: (attr)d20kh1 + self', badge: 'rolagem', detail: 'Parada de dados do atributo mantendo o maior + bônus', blocks: ['skill'] },
  { label: 'roll: "(self)d20kh1"', insertText: 'roll: "(self)d20kh1"', cursorBack: 1, badge: 'rolagem', detail: 'Parada de d20 mantendo o maior', blocks: ['attr', 'stat'] },
  { label: '!lock', insertText: '!lock', badge: 'flag', detail: 'Trava o valor impedindo alterações por efeitos externos', blocks: ['attr', 'stat', 'skill'], itemOnly: true },
  // Recursos (@res)
  { label: 'min: 0', insertText: 'min: 0', badge: 'recurso', detail: 'Valor mínimo permitido para o recurso', blocks: ['res'], itemOnly: true },
  { label: 'temp: 0', insertText: 'temp: 0', badge: 'recurso', detail: 'Pontos temporários extras do recurso', blocks: ['res'], itemOnly: true },
  // Inventário (@inv)
  { label: 'weight: 1', insertText: 'weight: 1', badge: 'item', detail: 'Peso ou espaços ocupados pelo item', blocks: ['inv'], itemOnly: true },
  { label: 'qty: 1', insertText: 'qty: 1', badge: 'item', detail: 'Quantidade de unidades do item', blocks: ['inv'], itemOnly: true },
  { label: 'category: 1', insertText: 'category: 1', badge: 'item', detail: 'Categoria/prestígio do equipamento', blocks: ['inv'], itemOnly: true },
  { label: '!equipped', insertText: '!equipped', badge: 'flag', detail: 'Item equipado (soma peso e ativa bônus passivos)', blocks: ['inv'], itemOnly: true },
  { label: '!carried', insertText: '!carried', badge: 'flag', detail: 'Item carregado na mochila (soma peso)', blocks: ['inv'], itemOnly: true },
  { label: '!stash', insertText: '!stash', badge: 'flag', detail: 'Item guardado na reserva (peso 0 na carga)', blocks: ['inv'], itemOnly: true },
  { label: '!consumable', insertText: '!consumable', badge: 'flag', detail: 'Item consumível com botão de uso rápido', blocks: ['inv'], itemOnly: true },
  { label: '#arma', insertText: '#arma', badge: 'tag', detail: 'Tag de categoria arma', blocks: ['inv'], itemOnly: true },
  { label: '#armadura', insertText: '#armadura', badge: 'tag', detail: 'Tag de categoria armadura/proteção', blocks: ['inv'], itemOnly: true },
  { label: '#escudo', insertText: '#escudo', badge: 'tag', detail: 'Tag de categoria escudo', blocks: ['inv'], itemOnly: true },
  // Habilidades (@ability) e Ações de Item
  { label: 'type: "Padrão"', insertText: 'type: "Padrão"', cursorBack: 1, badge: 'ação', detail: 'Ação Padrão', blocks: ['ability', 'inv'], itemOnly: true },
  { label: 'type: "Movimento"', insertText: 'type: "Movimento"', cursorBack: 1, badge: 'ação', detail: 'Ação de Movimento', blocks: ['ability', 'inv'], itemOnly: true },
  { label: 'type: "Livre"', insertText: 'type: "Livre"', cursorBack: 1, badge: 'ação', detail: 'Ação Livre', blocks: ['ability', 'inv'], itemOnly: true },
  { label: 'type: "Reação"', insertText: 'type: "Reação"', cursorBack: 1, badge: 'ação', detail: 'Ação de Reação', blocks: ['ability', 'inv'], itemOnly: true },
  { label: 'type: "Completa"', insertText: 'type: "Completa"', cursorBack: 1, badge: 'ação', detail: 'Ação Completa', blocks: ['ability', 'inv'], itemOnly: true },
  { label: 'cost: 1', insertText: 'cost: 1', badge: 'custo', detail: 'Custo numérico de ativação da habilidade', blocks: ['ability'], itemOnly: true },
  { label: 'resource: "PM"', insertText: 'resource: "PM"', cursorBack: 1, badge: 'recurso', detail: 'Recurso consumido pela habilidade', blocks: ['ability'], itemOnly: true },
  { label: 'range: "Curto"', insertText: 'range: "Curto"', cursorBack: 1, badge: 'alcance', detail: 'Alcance da habilidade ou magia (Pessoal, Toque, Curto, Médio, Longo)', blocks: ['ability'], itemOnly: true },
  { label: 'active: false', insertText: 'active: false', badge: 'toggle', detail: 'Define estado inicial de habilidade/tag alternável', blocks: ['ability', 'desc'], itemOnly: true },
  { label: '!active', insertText: '!active', badge: 'flag', detail: 'Inicia com o efeito sustentado ativo', blocks: ['ability', 'desc'], itemOnly: true },
  { label: 'requires: "2º Círculo"', insertText: 'requires: ""', cursorBack: 1, badge: 'req', detail: 'Requisito do aprimoramento (enhance)', blocks: ['ability'], itemOnly: true },
  // Escaninhos (@slots) e Contadores (@counter)
  { label: 'cols: 3', insertText: 'cols: 3', badge: 'grade', detail: 'Número de colunas da grade', blocks: ['slots', 'counter'], headerOnly: true },
  { label: 'state: empty', insertText: 'state: empty', badge: 'estado', detail: 'Escaninho vazio', blocks: ['slots'], itemOnly: true },
  { label: 'state: filled', insertText: 'state: filled', badge: 'estado', detail: 'Escaninho preenchido/ocupado', blocks: ['slots'], itemOnly: true },
  { label: 'state: damaged', insertText: 'state: damaged', badge: 'estado', detail: 'Escaninho danificado/ferido', blocks: ['slots'], itemOnly: true },
  { label: 'state: locked', insertText: 'state: locked', badge: 'estado', detail: 'Escaninho bloqueado/trancado', blocks: ['slots'], itemOnly: true },
  { label: 'double', insertText: 'double', badge: 'slot', detail: 'Ocupa 2 colunas na grade de escaninhos', blocks: ['slots'], itemOnly: true },
  { label: '!condition', insertText: '!condition', badge: 'flag', detail: 'Marca o escaninho como caixa de condição', blocks: ['slots'], itemOnly: true },
  { label: 'segments', insertText: 'segments', badge: 'contador', detail: 'Contador em barras segmentadas', blocks: ['counter'] },
  { label: 'dots', insertText: 'dots', badge: 'contador', detail: 'Contador em pontos circulares', blocks: ['counter'] },
  { label: 'pie', insertText: 'pie', badge: 'contador', detail: 'Relógio circular fatiado (Progress Clock)', blocks: ['counter'] },
  // Economia de Turno (@turn) e Diagrama (@diagram)
  { label: 'reset: "round"', insertText: 'reset: "round"', cursorBack: 1, badge: 'turno', detail: 'Ciclo de recarga das ações (round, scene, turn)', blocks: ['turn'], headerOnly: true },
  { label: 'layout: "humanoid"', insertText: 'layout: "humanoid"', cursorBack: 1, badge: 'layout', detail: 'Disposição anatômica humanoide', blocks: ['diagram'], headerOnly: true },
  { label: 'hit_roll: 1d10', insertText: 'hit_roll: 1d10', badge: 'rolagem', detail: 'Dado de localização de acerto no diagrama', blocks: ['diagram'], headerOnly: true },
  { label: 'hit: 1..2', insertText: 'hit: 1..2', badge: 'acerto', detail: 'Faixa do dado que atinge esta parte do corpo', blocks: ['diagram'], itemOnly: true },
  { label: 'mult: 2', insertText: 'mult: 2', badge: 'dano', detail: 'Multiplicador de dano ao atingir esta parte', blocks: ['diagram'], itemOnly: true },
  // Cores nomeadas para recursos e contadores
  { label: 'amber', insertText: 'amber', badge: 'cor', detail: 'Cor âmbar / dourada', blocks: ['counter', 'res'] },
  { label: 'red', insertText: 'red', badge: 'cor', detail: 'Cor vermelha / carmesim', blocks: ['counter', 'res'] },
  { label: 'emerald', insertText: 'emerald', badge: 'cor', detail: 'Cor verde esmeralda', blocks: ['counter', 'res'] },
  { label: 'purple', insertText: 'purple', badge: 'cor', detail: 'Cor roxa / violeta', blocks: ['counter', 'res'] },
  { label: 'blue', insertText: 'blue', badge: 'cor', detail: 'Cor azul', blocks: ['counter', 'res'] },
  { label: 'cyan', insertText: 'cyan', badge: 'cor', detail: 'Cor ciano', blocks: ['counter', 'res'] },
  { label: 'pink', insertText: 'pink', badge: 'cor', detail: 'Cor rosa', blocks: ['counter', 'res'] },
  { label: 'orange', insertText: 'orange', badge: 'cor', detail: 'Cor laranja', blocks: ['counter', 'res'] },
  // Navegação (@nav), Tema (@tema), Metadados (@meta) e Perfil (@profile)
  { label: 'pos: "top"', insertText: 'pos: "top"', badge: 'nav', detail: 'Abas no topo da ficha (top, left, right, bottom, hidden)', blocks: ['nav'] },
  { label: 'pos: "left"', insertText: 'pos: "left"', badge: 'nav', detail: 'Abas na lateral esquerda', blocks: ['nav'] },
  { label: 'labels: true', insertText: 'labels: true', badge: 'nav', detail: 'Exibe rótulos de texto nas abas', blocks: ['nav'] },
  { label: 'align: "left"', insertText: 'align: "left"', badge: 'nav', detail: 'Alinhamento das abas (left, center, right, stretch)', blocks: ['nav'] },
  { label: 'bg: "#0c0a09"', insertText: 'bg: "#0c0a09"', cursorBack: 1, badge: 'tema', detail: 'Cor de fundo principal da ficha', blocks: ['tema', 'meta'] },
  { label: 'card: "#161311"', insertText: 'card: "#161311"', cursorBack: 1, badge: 'tema', detail: 'Cor de fundo dos cartões de módulo', blocks: ['tema', 'meta'] },
  { label: 'border: "#292524"', insertText: 'border: "#292524"', cursorBack: 1, badge: 'tema', detail: 'Cor da borda dos cartões', blocks: ['tema', 'meta'] },
  { label: 'item: "#1c1917"', insertText: 'item: "#1c1917"', cursorBack: 1, badge: 'tema', detail: 'Cor de fundo dos itens internos', blocks: ['tema', 'meta'] },
  { label: 'text: "#f5f5f4"', insertText: 'text: "#f5f5f4"', cursorBack: 1, badge: 'tema', detail: 'Cor principal do texto', blocks: ['tema', 'meta'] },
  { label: 'sm', insertText: 'sm', badge: 'perfil', detail: 'Retrato pequeno', blocks: ['profile'], headerOnly: true },
  { label: 'md', insertText: 'md', badge: 'perfil', detail: 'Retrato médio', blocks: ['profile'], headerOnly: true },
  { label: 'lg', insertText: 'lg', badge: 'perfil', detail: 'Retrato grande', blocks: ['profile'], headerOnly: true },
  { label: 'banner', insertText: 'banner', badge: 'perfil', detail: 'Retrato em formato banner/capa', blocks: ['profile'], headerOnly: true },
  { label: 'side', insertText: 'side', badge: 'perfil', detail: 'Texto posicionado ao lado do retrato', blocks: ['profile'], headerOnly: true },
  { label: 'bottom', insertText: 'bottom', badge: 'perfil', detail: 'Texto posicionado abaixo do retrato', blocks: ['profile'], headerOnly: true },
];

const BLOCK_BODY_SNIPPETS: Record<
  string,
  Array<{ label: string; insertText: string; cursorBack?: number; badge: string; detail: string; subContext?: 'any' | 'item' | 'ability' | 'node' }>
> = {
  attr: [
    {
      label: 'NOVO_ATTR "Nome do Atributo" := 2 [roll: "1d20 + self"]',
      insertText: 'NOVO_ATTR "Nome do Atributo" := 2 [roll: "1d20 + self"]',
      badge: 'criar atributo',
      detail: 'Cria um novo atributo primário com rolagem clicável',
    },
    {
      label: 'NOVO_ATTR "Atributo Parada" := 2 [roll: "(self)d20kh1"]',
      insertText: 'NOVO_ATTR "Atributo" := 2 [roll: "(self)d20kh1"]',
      badge: 'criar atributo',
      detail: 'Cria atributo que rola parada de d20 mantendo o maior',
    },
    {
      label: 'NOVO_ATTR "Atributo Step-Die" := d6 [roll: "self!"]',
      insertText: 'NOVO_ATTR "Atributo" := d6 [roll: "self!"]',
      badge: 'step-die',
      detail: 'Cria atributo baseado em tipo de dado (d4, d6, d8, d10, d12)',
    },
  ],
  stat: [
    {
      label: 'NOVO_STAT "Status Calculado" = 10',
      insertText: 'NOVO_STAT "Novo Status" = 10',
      badge: 'criar status',
      detail: 'Cria um status derivado calculado por fórmula',
    },
    {
      label: 'NOVO_STAT "Status Fixo" := 9',
      insertText: 'NOVO_STAT "Novo Status" := 9',
      badge: 'criar status',
      detail: 'Cria um status derivado com valor base fixo',
    },
    {
      label: 'Iniciativa "Iniciativa" = 0 [roll: "1d20 + self"]',
      insertText: 'Iniciativa "Iniciativa" = 0 [roll: "1d20 + self"]',
      badge: 'status rolável',
      detail: 'Cria um status derivado com botão de rolagem direta',
    },
  ],
  res: [
    {
      label: 'RECURSO "Nome do Recurso": 20 / 20',
      insertText: 'RECURSO "Nome do Recurso": 20 / 20',
      badge: 'criar barra',
      detail: 'Cria barra de recurso que herda a cor do módulo @res ou do tema',
    },
    {
      label: 'RECURSO "Barra Colorida": 20 / 20 [cor: "#ef4444"]',
      insertText: 'RECURSO "Barra Colorida": 20 / 20 [cor: "#ef4444"]',
      cursorBack: 2,
      badge: 'barra c/ cor',
      detail: 'Cria barra de recurso com cor hexadecimal própria',
    },
    {
      label: 'trilha "Trilha de Caixas": track(4, [".", "/", "X"])',
      insertText: 'trilha "Trilha de Caixas": track(4, [".", "/", "X"])',
      badge: 'criar trilha',
      detail: 'Cria trilha de estados clicáveis (ex: Ferimentos / Condições)',
    },
  ],
  counter: [
    {
      label: 'cont_1 "Novo Contador": 0/4 [segments]',
      insertText: 'cont_1 "Novo Contador": 0/4 [segments]',
      badge: 'criar barras',
      detail: 'Cria contador em barras segmentadas clicáveis',
    },
    {
      label: 'pontos_1 "Pontos": 2/3 [dots]',
      insertText: 'pontos_1 "Pontos": 2/3 [dots]',
      badge: 'criar pontos',
      detail: 'Cria contador em pontos circulares clicáveis',
    },
    {
      label: 'relogio_1 "Relógio": 0/6 [pie]',
      insertText: 'relogio_1 "Relógio": 0/6 [pie]',
      badge: 'criar relógio',
      detail: 'Cria relógio circular fatiado (Progress Clock)',
    },
  ],
  skill: [
    {
      label: 'NovaPericia "Nome da Perícia" (ATTR) = 0',
      insertText: 'NovaPericia "Nova Perícia" () = 0',
      cursorBack: 5,
      badge: 'criar perícia',
      detail: 'Declara uma nova perícia vinculada a um atributo-base',
    },
    {
      label: 'NovaPericia (ATTR) := 2 [roll: 1d20 + attr + self]',
      insertText: 'NovaPericia () := 2 [roll: 1d20 + attr + self]',
      cursorBack: 33,
      badge: 'perícia c/ roll',
      detail: 'Declara perícia com fórmula de rolagem customizada',
    },
  ],
  inv: [
    {
      label: 'item "Novo Item" [weight: 1, qty: 1, !carried]',
      insertText: 'item "Novo Item" [weight: 1, qty: 1, !carried]\n    desc: ""',
      cursorBack: 1,
      badge: 'criar item',
      detail: 'Declara um novo item carregado na mochila',
    },
    {
      label: 'item "Arma / Equipamento" [weight: 1, qty: 1, !equipped, #arma]',
      insertText: 'item "Nova Arma" [weight: 1, qty: 1, !equipped, #arma]\n    action "Ataque" [type: "Padrão"]\n      damage: 1d8\n      desc: ""',
      cursorBack: 1,
      badge: 'criar arma',
      detail: 'Declara arma equipada com ação de ataque e dano',
    },
    {
      label: 'item "Consumível" [weight: 0.5, qty: 2, !carried, !consumable]',
      insertText: 'item "Poção / Consumível" [weight: 0.5, qty: 2, !carried, !consumable]\n    desc: ""',
      cursorBack: 1,
      badge: 'consumível',
      detail: 'Declara item consumível com botão de uso rápido',
    },
    {
      label: 'action "Ataque / Uso" [type: "Padrão"]',
      insertText: 'action "Ataque" [type: "Padrão"]\n      test: 1d20\n      damage: 1d8',
      badge: 'criar ação',
      detail: 'Adiciona sub-ação de ataque ou uso dentro do item atual',
      subContext: 'item',
    },
    {
      label: 'desc: "..."',
      insertText: 'desc: ""',
      cursorBack: 1,
      badge: 'prop item',
      detail: 'Descrição textual do item ou ação',
      subContext: 'item',
    },
    {
      label: 'damage: 1d8',
      insertText: 'damage: 1d8',
      badge: 'prop item',
      detail: 'Fórmula de dano do item ou ação',
      subContext: 'item',
    },
    {
      label: 'test: 1d20',
      insertText: 'test: ',
      badge: 'prop item',
      detail: 'Perícia ou fórmula de teste de ataque do item',
      subContext: 'item',
    },
    {
      label: 'unit = "espacos"',
      insertText: 'unit = "espacos"',
      cursorBack: 1,
      badge: 'config inv',
      detail: 'Define a unidade de medida da carga (ex: espacos, kg, slots)',
    },
    {
      label: 'max_load = 10',
      insertText: 'max_load = 10',
      badge: 'config inv',
      detail: 'Define a capacidade máxima de carga do inventário',
    },
    {
      label: 'overload_limit = max_load * 2',
      insertText: 'overload_limit = max_load * 2',
      badge: 'config inv',
      detail: 'Define o limite máximo de sobrecarga',
    },
    {
      label: 'rule load() > max_load -> ...',
      insertText: 'rule load() > max_load -> ',
      badge: 'regra carga',
      detail: 'Regra automática disparada quando a carga excede o limite',
    },
  ],
  ability: [
    {
      label: 'ability "Nova Habilidade" [type: "Padrão", cost: 1]',
      insertText: 'ability "Nova Habilidade" [type: "Padrão", cost: 1]\n    desc: ""',
      cursorBack: 1,
      badge: 'criar habilidade',
      detail: 'Declara uma nova habilidade ou poder',
    },
    {
      label: 'action "Nova Ação" [type: "Padrão"]',
      insertText: 'action "Nova Ação" [type: "Padrão"]\n    test: 1d20\n    damage: 1d8\n    desc: ""',
      cursorBack: 1,
      badge: 'criar ação',
      detail: 'Declara uma ação de combate com teste e dano',
    },
    {
      label: 'spell "Nova Magia / Ritual" [type: "Padrão", cost: 1, range: "Curto"]',
      insertText: 'spell "Nova Magia" [type: "Padrão", cost: 1, range: "Curto"]\n    desc: ""',
      cursorBack: 1,
      badge: 'criar magia',
      detail: 'Declara uma magia, feitiço ou ritual',
    },
    {
      label: 'move "Novo Movimento" [type: "Ação"]',
      insertText: 'move "Novo Movimento" [type: "Ação"]\n    test: 2d6\n    desc: ""',
      cursorBack: 1,
      badge: 'criar move',
      detail: 'Declara um movimento narrativo (estilo PbtA)',
    },
    {
      label: 'enhance "+1: Aprimoramento" [cost: 1]',
      insertText: 'enhance "+1: Aprimoramento" [cost: 1]\n      desc: ""',
      cursorBack: 1,
      badge: 'criar enhance',
      detail: 'Adiciona aprimoramento escalável à habilidade/magia atual',
      subContext: 'ability',
    },
    {
      label: 'when active -> ALVO += 2',
      insertText: 'when active -> ',
      badge: 'efeito ativo',
      detail: 'Modificador aplicado enquanto a habilidade estiver ativa',
      subContext: 'ability',
    },
    {
      label: 'choice "Opção A", "Opção B"',
      insertText: 'choice "Opção 1", "Opção 2"',
      badge: 'escolha',
      detail: 'Adiciona seletor de escolhas modulares na habilidade',
      subContext: 'ability',
    },
    {
      label: 'desc: "..."',
      insertText: 'desc: ""',
      cursorBack: 1,
      badge: 'prop',
      detail: 'Texto descritivo da habilidade ou aprimoramento (aceita {formulas})',
      subContext: 'ability',
    },
    {
      label: 'test: Pericia',
      insertText: 'test: ',
      badge: 'prop',
      detail: 'Perícia ou fórmula de rolagem de teste da habilidade',
      subContext: 'ability',
    },
    {
      label: 'damage: 2d6',
      insertText: 'damage: ',
      badge: 'prop',
      detail: 'Fórmula de dano ou cura da habilidade',
      subContext: 'ability',
    },
    {
      label: 'range: "Curto"',
      insertText: 'range: "Curto"',
      cursorBack: 1,
      badge: 'prop',
      detail: 'Alcance da habilidade',
      subContext: 'ability',
    },
  ],
  slots: [
    {
      label: 'slot_1 "Item Rápido": 1/1',
      insertText: 'slot_1 "Novo Item": 1/1',
      badge: 'criar slot',
      detail: 'Adiciona um escaninho preenchido com contador de usos',
    },
    {
      label: 'slot_vazio [state: empty]',
      insertText: 'slot_vazio [state: empty]',
      badge: 'slot vazio',
      detail: 'Adiciona um escaninho livre/vazio',
    },
    {
      label: 'slot_pesado "Item Pesado" [state: filled, double]',
      insertText: 'slot_pesado "Item Pesado" [state: filled, double]',
      badge: 'slot duplo',
      detail: 'Adiciona escaninho que ocupa 2 colunas na grade',
    },
    {
      label: 'cond_1 "Condição" [state: empty, !condition]',
      insertText: 'cond_1 "Abalado" [state: empty, !condition]',
      badge: 'criar condição',
      detail: 'Adiciona uma caixa de condição (ex: Abalado, Fatigado)',
    },
  ],
  profile: [
    { label: 'name: "..."', insertText: 'name: ""', cursorBack: 1, badge: 'prop perfil', detail: 'Nome exibido no cartão de perfil' },
    { label: 'archetype: "..."', insertText: 'archetype: ""', cursorBack: 1, badge: 'prop perfil', detail: 'Classe, origem ou arquétipo' },
    { label: 'system: "..."', insertText: 'system: ""', cursorBack: 1, badge: 'prop perfil', detail: 'Sistema de RPG exibido no perfil' },
    { label: 'level: 1', insertText: 'level: 1', badge: 'prop perfil', detail: 'Nível ou NEX do personagem' },
    { label: 'image: "https://..."', insertText: 'image: ""', cursorBack: 1, badge: 'prop perfil', detail: 'URL da imagem do retrato' },
    { label: 'desc: "..."', insertText: 'desc: ""', cursorBack: 1, badge: 'prop perfil', detail: 'Biografia ou descrição curta' },
    { label: 'fit: "cover"', insertText: 'fit: "cover"', cursorBack: 1, badge: 'prop imagem', detail: 'Ajuste da imagem (cover, contain, auto)' },
    { label: 'text_pos: "side"', insertText: 'text_pos: "side"', cursorBack: 1, badge: 'prop layout', detail: 'Posição do texto (side, bottom, top, none)' },
    { label: 'scale: 1', insertText: 'scale: 1', badge: 'prop imagem', detail: 'Escala/zoom da imagem do retrato' },
  ],
  meta: [
    { label: 'name: "..."', insertText: 'name: ""', cursorBack: 1, badge: 'prop meta', detail: 'Nome principal da ficha' },
    { label: 'system: "..."', insertText: 'system: ""', cursorBack: 1, badge: 'prop meta', detail: 'Nome do sistema de regras' },
    { label: 'archetype: "..."', insertText: 'archetype: ""', cursorBack: 1, badge: 'prop meta', detail: 'Classe, trilha ou arquétipo' },
    { label: 'level: 1', insertText: 'level: 1', badge: 'prop meta', detail: 'Nível do personagem' },
    { label: 'theme: "amber"', insertText: 'theme: "amber"', cursorBack: 1, badge: 'prop meta', detail: 'Tema visual (amber, red, purple, blue, green, dark)' },
  ],
  tema: [
    { label: 'cor: "#d97706"', insertText: 'cor: "#d97706"', cursorBack: 1, badge: 'cor destaque', detail: 'Cor hexadecimal de destaque (accent)' },
    { label: 'bg: "#0c0a09"', insertText: 'bg: "#0c0a09"', cursorBack: 1, badge: 'cor fundo', detail: 'Cor hexadecimal do fundo da ficha' },
    { label: 'card: "#161311"', insertText: 'card: "#161311"', cursorBack: 1, badge: 'cor cartão', detail: 'Cor hexadecimal dos cartões de módulo' },
    { label: 'border: "#292524"', insertText: 'border: "#292524"', cursorBack: 1, badge: 'cor borda', detail: 'Cor hexadecimal das bordas' },
    { label: 'item: "#1c1917"', insertText: 'item: "#1c1917"', cursorBack: 1, badge: 'cor item', detail: 'Cor hexadecimal dos itens internos' },
    { label: 'text: "#f5f5f4"', insertText: 'text: "#f5f5f4"', cursorBack: 1, badge: 'cor texto', detail: 'Cor hexadecimal principal dos textos' },
  ],
  nav: [
    { label: 'pos: "top"', insertText: 'pos: "top"', cursorBack: 1, badge: 'nav', detail: 'Posição das abas (top, left, right, bottom, hidden)' },
    { label: 'labels: true', insertText: 'labels: true', badge: 'nav', detail: 'Exibe ou oculta o texto das abas (true / false)' },
    { label: 'align: "left"', insertText: 'align: "left"', cursorBack: 1, badge: 'nav', detail: 'Alinhamento das abas (left, center, right, stretch)' },
  ],
  desc: [
    { label: 'tag "Condição / Efeito" [active: false] -> ', insertText: 'tag "Nova Tag" [active: false] -> ', badge: 'criar tag', detail: 'Cria tag alternável com efeito reativo na ficha' },
    { label: 'aspect "Aspecto Narrativo"', insertText: 'aspect ""', cursorBack: 1, badge: 'criar aspecto', detail: 'Declara um aspecto ou traço narrativo' },
    { label: 'consequence "Consequência / Trauma"', insertText: 'consequence "Ferimento" [active: true] -> ', badge: 'consequência', detail: 'Declara uma consequência ou condição negativa' },
    { label: 'sense "Visão no Escuro"', insertText: 'sense "Visão no Escuro"', cursorBack: 1, badge: 'criar sentido', detail: 'Declara um sentido especial individual' },
    { label: 'resistance "Tipo de Dano" = 5', insertText: 'resistance "Corte" = 5', badge: 'resistência', detail: 'Declara redução/resistência a um tipo de dano' },
    { label: 'immunity "Condição ou Dano"', insertText: 'immunity ""', cursorBack: 1, badge: 'imunidade', detail: 'Declara uma imunidade' },
    { label: 'vulnerability "Tipo de Dano"', insertText: 'vulnerability ""', cursorBack: 1, badge: 'vulnerabilidade', detail: 'Declara uma vulnerabilidade' },
    { label: 'senses: ["Visão no Escuro"]', insertText: 'senses: ["Visão no Escuro"]', badge: 'lista sentidos', detail: 'Declara lista de sentidos especiais' },
    { label: 'resistances: [Corte: 5, Fogo: 5]', insertText: 'resistances: [Corte: 5]', badge: 'mapa resist', detail: 'Declara mapa de resistências a dano' },
  ],
  turn: [
    { label: 'padrao "Padrão": slots(1 / 1)', insertText: 'padrao "Padrão": slots(1 / 1)', badge: 'criar ação', detail: 'Cria slot de Ação Padrão na economia de turno' },
    { label: 'movimento "Movimento": slots(1 / 1)', insertText: 'movimento "Movimento": slots(1 / 1)', badge: 'criar ação', detail: 'Cria slot de Ação de Movimento' },
    { label: 'reacao "Reação": slots(1 / 1)', insertText: 'reacao "Reação": slots(1 / 1)', badge: 'criar ação', detail: 'Cria slot de Reação por rodada' },
    { label: 'livre "Livre": slots(1 / 1)', insertText: 'livre "Livre": slots(1 / 1)', badge: 'criar ação', detail: 'Cria slot de Ação Livre' },
    { label: 'convert "Ação Completa" -> 1 padrao, 1 movimento', insertText: 'convert "Ação Completa" -> 1 padrao, 1 movimento', badge: 'conversão', detail: 'Regra de conversão de ações no turno' },
  ],
  rank: [
    { label: 'destreinado = 0', insertText: 'destreinado = 0', badge: 'criar grau', detail: 'Define grau de treinamento com bônus +0' },
    { label: 'treinado = 2', insertText: 'treinado = 2', badge: 'criar grau', detail: 'Define grau de treinamento com bônus +2' },
    { label: 'veterano = 4', insertText: 'veterano = 4', badge: 'criar grau', detail: 'Define grau de treinamento com bônus +4' },
    { label: 'expert = 6', insertText: 'expert = 6', badge: 'criar grau', detail: 'Define grau de treinamento com bônus +6' },
  ],
  rule: [
    { label: 'rule Condicao -> Alvo += 1', insertText: 'rule  -> ', cursorBack: 4, badge: 'criar regra', detail: 'Cria regra condicional reativa global' },
    { label: 'when Condicao -> Alvo -= 2', insertText: 'when  -> ', cursorBack: 4, badge: 'criar regra', detail: 'Cria regra condicional reativa com when' },
  ],
  diagram: [
    {
      label: 'node "Parte do Corpo" [hit: 1..2, mult: 1]',
      insertText: 'node "Nova Parte" [hit: 1..2, mult: 1]\n    pv: 6 / 6\n    armor: 0',
      badge: 'criar parte',
      detail: 'Declara uma parte anatômica no diagrama corporal',
    },
    { label: 'pv: 6 / 6', insertText: 'pv: 6 / 6', badge: 'prop parte', detail: 'Pontos de vida da parte do corpo', subContext: 'node' },
    { label: 'armor: 2', insertText: 'armor: 2', badge: 'prop parte', detail: 'Armadura / RD da parte do corpo', subContext: 'node' },
    { label: 'when wounded -> ', insertText: 'when wounded -> ', badge: 'gatilho', detail: 'Efeito aplicado quando a parte fica ferida', subContext: 'node' },
    { label: 'when broken -> ', insertText: 'when broken -> ', badge: 'gatilho', detail: 'Efeito aplicado quando a parte é destruída (0 PV)', subContext: 'node' },
  ],
  table: [
    { label: '1..4 -> 2', insertText: '1..4 -> 2', badge: 'faixa tabela', detail: 'Mapeia um intervalo numérico para um resultado' },
    { label: 'default -> 0', insertText: 'default -> 0', badge: 'padrão tabela', detail: 'Valor padrão caso nenhuma faixa anterior corresponda' },
  ],
};

function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Pontuador determinístico por Prefixo Exato > Prefixo Normalizado > Fronteira de Palavra > Subsequência Ordenada.
 * Retorna 0 se não houver correspondência.
 */
export function scoreCompletionMatch(query: string, candidate: string): number {
  if (!query) return 100;
  const q = normalizeForSearch(query);
  const c = normalizeForSearch(candidate);

  if (c === q) return 1200;
  if (candidate.startsWith(query)) return 1000 - candidate.length;
  if (c.startsWith(q)) return 900 - candidate.length;

  // Verifica se sem '@' ou '!' bate com prefixo
  const cStripped = c.replace(/^[@!#]/, '');
  const qStripped = q.replace(/^[@!#]/, '');
  if (qStripped && cStripped.startsWith(qStripped)) {
    return 850 - candidate.length;
  }

  // Substring contígua
  const subIdx = c.indexOf(qStripped || q);
  if (subIdx !== -1) {
    return 650 - subIdx * 10 - candidate.length;
  }

  // Subsequência ordenada de caracteres (ex: "atb" -> "@ability", "frt" -> "Fortitude")
  const targetQ = qStripped || q;
  let qi = 0;
  let consecutiveBonus = 0;
  for (let ci = 0; ci < c.length && qi < targetQ.length; ci++) {
    if (c[ci] === targetQ[qi]) {
      qi++;
      if (ci > 0 && c[ci - 1] === targetQ[qi - 2]) {
        consecutiveBonus += 15;
      }
    }
  }

  if (qi === targetQ.length) {
    return 300 + consecutiveBonus - candidate.length;
  }

  return 0;
}

interface EnclosingContextInfo {
  moduleKind: string;
  moduleHeaderLineIdx: number;
  subKind: 'none' | 'item' | 'ability' | 'node';
  subLabel?: string;
}

function findEnclosingContext(lines: string[], cursorLineIdx: number): EnclosingContextInfo {
  let moduleKind = 'root';
  let moduleHeaderLineIdx = -1;

  for (let l = cursorLineIdx; l >= 0; l--) {
    const trimmed = lines[l].trim();
    const match = trimmed.match(/^@([a-zA-Z0-9_\u00C0-\u017F-]+)/);
    if (match) {
      const raw = normalizeForSearch(match[1]);
      if (TAB_DIRECTIVES.has(raw)) continue;
      moduleHeaderLineIdx = l;
      if (raw === 'attrs' || raw === 'attributes' || raw === 'atributos') moduleKind = 'attr';
      else if (raw === 'stats' || raw === 'derived' || raw === 'derivados' || raw === 'status') moduleKind = 'stat';
      else if (raw === 'resource' || raw === 'resources' || raw === 'recursos') moduleKind = 'res';
      else if (raw === 'skills' || raw === 'pericias') moduleKind = 'skill';
      else if (raw === 'inventory' || raw === 'inventario' || raw === 'gear' || raw === 'equipamento') moduleKind = 'inv';
      else if (
        raw === 'abilities' ||
        raw === 'habilidades' ||
        raw === 'actions' ||
        raw === 'acoes' ||
        raw === 'powers' ||
        raw === 'poderes' ||
        raw === 'spells' ||
        raw === 'magias' ||
        raw === 'rituals' ||
        raw === 'rituais' ||
        raw === 'moves' ||
        raw === 'movimentos'
      ) {
        moduleKind = 'ability';
      } else if (raw === 'escaninhos' || raw === 'caixas' || raw === 'condicoes' || raw === 'conditions') moduleKind = 'slots';
      else if (raw === 'counters' || raw === 'contador' || raw === 'contadores' || raw === 'relogios' || raw === 'clocks') moduleKind = 'counter';
      else if (raw === 'perfil' || raw === 'retrato' || raw === 'portrait' || raw === 'identidade') moduleKind = 'profile';
      else if (raw === 'text' || raw === 'notas' || raw === 'notes' || raw === 'bio' || raw === 'lore') moduleKind = 'texto';
      else if (raw === 'descriptors' || raw === 'descritores' || raw === 'aspects' || raw === 'traits') moduleKind = 'desc';
      else if (raw === 'turno' || raw === 'economy' || raw === 'economia') moduleKind = 'turn';
      else if (raw === 'ranks' || raw === 'graus') moduleKind = 'rank';
      else if (raw === 'rules' || raw === 'regras') moduleKind = 'rule';
      else if (raw === 'diagrama' || raw === 'body' || raw === 'corpo' || raw === 'mech') moduleKind = 'diagram';
      else if (raw === 'tabela') moduleKind = 'table';
      else if (raw === 'ficha' || raw === 'sheet' || raw === 'character' || raw === 'personagem') moduleKind = 'meta';
      else if (raw === 'theme' || raw === 'cores' || raw === 'colors' || raw === 'estilo' || raw === 'style') moduleKind = 'tema';
      else if (raw === 'abas' || raw === 'tabs' || raw === 'navegacao' || raw === 'navigation') moduleKind = 'nav';
      else moduleKind = raw;
      break;
    }
  }

  let subKind: EnclosingContextInfo['subKind'] = 'none';
  let subLabel: string | undefined;

  if (moduleHeaderLineIdx !== -1 && cursorLineIdx > moduleHeaderLineIdx) {
    const currentRaw = lines[cursorLineIdx] || '';
    const currentIndent = currentRaw.trim() === '' ? currentRaw.length : currentRaw.search(/\S/);

    for (let l = cursorLineIdx; l > moduleHeaderLineIdx; l--) {
      const rawLine = lines[l];
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;
      const lineIndent = rawLine.search(/\S/);
      if (l < cursorLineIdx && lineIndent >= currentIndent && currentIndent <= 2) {
        continue;
      }
      const subMatch = trimmed.match(
        /^(item|ability|habilidade|action|acao|spell|magia|ritual|move|movimento|node|parte)\b(?:\s+(?:"([^"]+)"|'([^']+)'|([a-zA-Z0-9_\u00C0-\u017F-]+)))?/i,
      );
      if (subMatch && (l === cursorLineIdx || currentIndent > lineIndent)) {
        const kw = normalizeForSearch(subMatch[1]);
        subLabel = subMatch[2] || subMatch[3] || subMatch[4];
        if (kw === 'item') subKind = 'item';
        else if (kw === 'node' || kw === 'parte') subKind = 'node';
        else subKind = 'ability';
        break;
      }
    }
  }

  return { moduleKind, moduleHeaderLineIdx, subKind, subLabel };
}

/**
 * Calcula sugestões de autocomplete determinísticas para a posição atual do cursor no código projetado.
 * Ordem estrita em 3 camadas (Tiers):
 *   1º (Tier 1 - Score 10000+): Possíveis criações, propriedades e tags apropriadas do módulo atual.
 *   2º (Tier 2 - Score 5000+): Variáveis e símbolos declarados na ficha + variáveis de contexto.
 *   3º (Tier 3 - Score 1000+): Outras recomendações (funções matemáticas, rolagens de dados, outros blocos @).
 */
export function getDSLCompletions(
  sourceText: string,
  cursorOffset: number,
  compiled: CompiledSheet | null | undefined,
  forceOpen = false,
): DSLCompletionResult | null {
  const beforeCursor = sourceText.slice(0, cursorOffset);
  const linesUntilCursor = beforeCursor.split('\n');
  const currentLineIndex = linesUntilCursor.length - 1;
  const linePrefix = linesUntilCursor[currentLineIndex];

  // Não sugere dentro de comentários
  const commentSlashIdx = linePrefix.indexOf('//');
  if (commentSlashIdx !== -1) return null;
  if (/^\s*#\s/.test(linePrefix)) return null;

  // Não sugere em linha de fold placeholder
  const allLines = sourceText.split('\n');
  const fullCurrentLine = allLines[currentLineIndex] || '';
  if (FOLD_LINE_REGEX.test(fullCurrentLine)) return null;

  // Verifica se está dentro de aspas (exceto se forceOpen)
  const quoteCount = (linePrefix.match(/"/g) || []).length;
  if (quoteCount % 2 === 1 && !forceOpen) {
    return null;
  }

  const ctx = findEnclosingContext(allLines, currentLineIndex);
  const enclosingBlock = ctx.moduleKind;
  const isOnModuleHeaderLine = currentLineIndex === ctx.moduleHeaderLineIdx;
  const { symbols } = extractSheetSymbols(compiled);

  // Identifica o token parcial imediatamente antes do cursor
  const tokenMatch = linePrefix.match(/([@!#]?[a-zA-Z0-9_\u00C0-\u017F-]*)$/);
  const query = tokenMatch ? tokenMatch[1] : '';
  const replaceStart = cursorOffset - query.length;
  const replaceEnd = cursorOffset;

  // Helper para adicionar Variáveis da Ficha (Tier 2)
  const appendTier2Variables = (
    scored: Array<{ score: number; item: DSLCompletionItem }>,
    q: string,
    allowEmptyQuery: boolean,
  ) => {
    const badgeMap: Record<DSLSheetSymbol['category'], string> = {
      attr: 'var • atributo',
      stat: 'var • status',
      resource: 'var • recurso',
      skill: 'var • perícia',
      rank: 'var • grau',
      counter: 'var • contador',
      tab: 'aba',
    };

    for (const sym of symbols) {
      if (sym.category === 'tab') continue;
      const s = q
        ? Math.max(scoreCompletionMatch(q, sym.id), scoreCompletionMatch(q, sym.label) - 40)
        : allowEmptyQuery
          ? 100
          : 0;
      if (s <= 0) continue;

      let catBoost = 100;
      if (sym.category === 'attr') catBoost = 350;
      else if (sym.category === 'rank' && enclosingBlock === 'skill') catBoost = 400;
      else if (sym.category === 'stat') catBoost = 280;
      else if (sym.category === 'resource') catBoost = 240;

      scored.push({
        score: 5000 + catBoost + s,
        item: {
          id: `sym_${sym.id}`,
          label: sym.id,
          insertText: sym.id,
          category: sym.category,
          badge: badgeMap[sym.category],
          detail: `${sym.label} — ${sym.detail}`,
          tier: 2,
        },
      });

      // Sub-propriedade .max para recursos quando o usuário digita ponto ou busca recurso
      if (sym.category === 'resource' && q.length >= 1) {
        const sMax = scoreCompletionMatch(q, `${sym.id}.max`);
        if (sMax > 0) {
          scored.push({
            score: 5000 + 200 + sMax,
            item: {
              id: `sym_${sym.id}_max`,
              label: `${sym.id}.max`,
              insertText: `${sym.id}.max`,
              category: 'resource',
              badge: 'var • máx',
              detail: `Valor máximo de ${sym.label}`,
              tier: 2,
            },
          });
        }
      }
    }

    const builtinVars: Array<{ label: string; detail: string; blocks?: string[] }> = [
      { label: 'self', detail: 'Valor do próprio item/atributo/bônus', blocks: ['attr', 'stat', 'skill'] },
      { label: 'self.dice', detail: 'Converte o valor próprio em dado de N faces (ex: 6 → 1d6)', blocks: ['attr', 'stat', 'skill'] },
      { label: '1d(self)', detail: 'Rola 1 dado com o número de faces do valor próprio (ex: 6 → 1d6)', blocks: ['attr', 'stat', 'skill'] },
      { label: 'attr', detail: 'Valor do atributo-base da perícia', blocks: ['skill'] },
      { label: 'attr.dice', detail: 'Converte o atributo-base em dado de N faces (ex: 8 → 1d8)', blocks: ['skill'] },
      { label: '1d(attr)', detail: 'Rola 1 dado com o número de faces do atributo-base', blocks: ['skill'] },
      { label: 'level', detail: 'Nível definido em @meta' },
      { label: 'carga_atual', detail: 'Carga total carregada no inventário', blocks: ['inv', 'rule', 'stat'] },
      { label: 'max_load', detail: 'Capacidade máxima de carga do inventário', blocks: ['inv', 'rule', 'stat'] },
    ];

    for (const bv of builtinVars) {
      if (bv.blocks && !bv.blocks.includes(enclosingBlock) && !q) continue;
      const s = q ? scoreCompletionMatch(q, bv.label) : allowEmptyQuery ? 80 : 0;
      if (s <= 0) continue;
      const ctxBoost = bv.blocks?.includes(enclosingBlock) ? 380 : 120;
      scored.push({
        score: 5000 + ctxBoost + s,
        item: {
          id: `bvar_${bv.label}`,
          label: bv.label,
          insertText: bv.label,
          category: 'keyword',
          badge: 'variável',
          detail: bv.detail,
          tier: 2,
        },
      });
    }
  };

  // Helper para adicionar Outras Recomendações (Tier 3: Funções, Dados e Outros Módulos @)
  const appendTier3Others = (
    scored: Array<{ score: number; item: DSLCompletionItem }>,
    q: string,
    includeDirectives: boolean,
    allowEmptyQuery: boolean,
  ) => {
    const otherExtras: Array<{
      label: string;
      insertText: string;
      cursorBack?: number;
      category: DSLCompletionCategory;
      badge: string;
      detail: string;
    }> = [
      { label: '1d20 + self', insertText: '1d20 + self', category: 'dice', badge: 'dado', detail: 'Rolagem d20 + valor próprio' },
      { label: 'self.dice', insertText: 'self.dice', category: 'dice', badge: 'dado', detail: 'Transforma valor numérico no lado do dado (ex: 6 → 1d6)' },
      { label: '1d(self)', insertText: '1d(self)', category: 'dice', badge: 'dado', detail: 'Dado cujo lado é o valor de self (ex: 1d(self) + 1d10)' },
      { label: '(self)d20kh1', insertText: '(self)d20kh1', category: 'dice', badge: 'dado', detail: 'Parada de d20 mantendo o maior' },
      { label: '(attr)d20kh1 + self', insertText: '(attr)d20kh1 + self', category: 'dice', badge: 'dado', detail: 'Parada de d20 do atributo + bônus' },
      { label: '1d20', insertText: '1d20', category: 'dice', badge: 'dado', detail: 'Dado de 20 faces' },
      { label: '2d6', insertText: '2d6', category: 'dice', badge: 'dado', detail: 'Dois dados de 6 faces' },
      { label: '1d8', insertText: '1d8', category: 'dice', badge: 'dado', detail: 'Dado de 8 faces' },
      { label: 'floor(x)', insertText: 'floor()', cursorBack: 1, category: 'function', badge: 'função', detail: 'Arredonda valor para baixo' },
      { label: 'ceil(x)', insertText: 'ceil()', cursorBack: 1, category: 'function', badge: 'função', detail: 'Arredonda valor para cima' },
      { label: 'max(a, b)', insertText: 'max(, )', cursorBack: 3, category: 'function', badge: 'função', detail: 'Maior valor entre dois números' },
      { label: 'min(a, b)', insertText: 'min(, )', cursorBack: 3, category: 'function', detail: 'Menor valor entre dois números', badge: 'função' },
      { label: 'clamp(val, min, max)', insertText: 'clamp(, 0, 10)', cursorBack: 7, category: 'function', badge: 'função', detail: 'Limita valor entre mínimo e máximo' },
      { label: 'load()', insertText: 'load()', category: 'function', badge: 'função', detail: 'Retorna a carga atual do inventário' },
      { label: 'has("Item")', insertText: 'has("")', cursorBack: 2, category: 'function', badge: 'função', detail: 'Retorna 1 se o personagem possui o item' },
      { label: 'lookup(tabela, val)', insertText: 'lookup(, )', cursorBack: 3, category: 'function', badge: 'função', detail: 'Consulta valor em uma @table' },
    ];

    for (const ex of otherExtras) {
      const s = q ? scoreCompletionMatch(q, ex.label) : allowEmptyQuery ? 50 : 0;
      if (s > 0) {
        scored.push({
          score: 1200 + s,
          item: {
            id: `other_fn_${ex.label}`,
            label: ex.label,
            insertText: ex.insertText,
            cursorOffsetFromEnd: ex.cursorBack,
            category: ex.category,
            badge: ex.badge,
            detail: ex.detail,
            tier: 3,
          },
        });
      }
    }

    if (includeDirectives) {
      for (const d of DIRECTIVE_COMPLETIONS) {
        const s = q ? scoreCompletionMatch(q, d.directive) : allowEmptyQuery ? 40 : 0;
        if (s > 0) {
          scored.push({
            score: 1000 + s,
            item: {
              id: `other_dir_${d.directive}`,
              label: d.directive,
              insertText: `${d.directive} `,
              category: 'directive',
              badge: 'outro @bloco',
              detail: d.detail,
              tier: 3,
            },
          });
        }
      }
    }
  };

  // -------------------------------------------------------------------------
  // CASO 1: Usuário digitou explicitamente '@' (ou está fora de qualquer módulo no root)
  // -------------------------------------------------------------------------
  if (query.startsWith('@') || (enclosingBlock === 'root' && (/^\s*$/.test(linePrefix) && forceOpen))) {
    const scored: Array<{ score: number; item: DSLCompletionItem }> = [];
    for (const d of DIRECTIVE_COMPLETIONS) {
      const s = scoreCompletionMatch(query, d.directive);
      if (s > 0) {
        if (d.snippet) {
          scored.push({
            score: 10000 + s + 60,
            item: {
              id: `snip_${d.directive}`,
              label: `${d.label} (criar módulo)`,
              insertText: d.snippet,
              cursorOffsetFromEnd: d.cursorBack,
              category: 'snippet',
              badge: 'criar módulo',
              detail: d.detail,
              tier: 1,
            },
          });
        }
        scored.push({
          score: 10000 + s + 30,
          item: {
            id: `dir_${d.directive}`,
            label: d.directive,
            insertText: `${d.directive} `,
            category: 'directive',
            badge: '@bloco',
            detail: d.detail,
            tier: 1,
          },
        });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    if (scored.length === 0) return null;
    return {
      replaceStart,
      replaceEnd,
      query,
      contextLabel: 'Criar Módulo SGM-SDL',
      items: scored.slice(0, 12).map((x) => x.item),
    };
  }

  // -------------------------------------------------------------------------
  // CASO 2: Dentro de colchetes de metadados/tags `[...]`
  // -------------------------------------------------------------------------
  const lastOpenBracket = linePrefix.lastIndexOf('[');
  const lastCloseBracket = linePrefix.lastIndexOf(']');
  if (lastOpenBracket > lastCloseBracket) {
    const insideBracketPrefix = linePrefix.slice(lastOpenBracket + 1);
    const afterFormulaPropInBracket =
      /(?:roll|rolagem|test|teste|damage|dano|cost|custo|min|max|temp|weight|peso|qty|qtd)\s*:\s*[^,\]]*$/i.test(
        insideBracketPrefix,
      );

    if (!afterFormulaPropInBracket) {
      if (!query && !forceOpen && !/\[\s*$|,\s*$/.test(linePrefix)) {
        return null;
      }

      const scored: Array<{ score: number; item: DSLCompletionItem }> = [];

      // TIER 1: Tags, Flags e Propriedades apropriadas para o módulo atual (e se é cabeçalho vs item)
      for (const meta of BRACKET_META_COMPLETIONS) {
        if (meta.headerOnly && !isOnModuleHeaderLine) continue;
        if (meta.itemOnly && isOnModuleHeaderLine) continue;

        const isForCurrentBlock =
          (meta.blocks && meta.blocks.includes(enclosingBlock)) ||
          (!meta.blocks && isOnModuleHeaderLine);

        if (!isForCurrentBlock && !query) continue;

        const s = scoreCompletionMatch(query, meta.label);
        if (s <= 0) continue;

        // Se pertence ao módulo atual -> Tier 1 (10000+), senão Tier 3 (1000+)
        const tier: 1 | 3 = isForCurrentBlock ? 1 : 3;
        const baseTierScore = tier === 1 ? 10000 + (meta.blocks?.includes(enclosingBlock) ? 300 : 150) : 1000;

        scored.push({
          score: baseTierScore + s,
          item: {
            id: `meta_${meta.label}`,
            label: meta.label,
            insertText: meta.insertText,
            cursorOffsetFromEnd: meta.cursorBack,
            category: meta.label.startsWith('!') ? 'flag' : 'meta_key',
            badge: meta.badge,
            detail: meta.detail,
            tier,
          },
        });
      }

      // Em @ability dentro de [...], sugere custo com os recursos reais da ficha (ex: cost: 1 PM)
      if (enclosingBlock === 'ability' && !isOnModuleHeaderLine) {
        const resSymbols = symbols.filter((s) => s.category === 'resource');
        for (const r of resSymbols) {
          const costLabel = `cost: 1 ${r.id}`;
          const s = scoreCompletionMatch(query, costLabel);
          if (s > 0) {
            scored.push({
              score: 10000 + 380 + s,
              item: {
                id: `meta_cost_res_${r.id}`,
                label: costLabel,
                insertText: costLabel,
                category: 'resource',
                badge: 'custo recurso',
                detail: `Consome ${r.label} (${r.id}) ao ativar`,
                tier: 1,
              },
            });
          }
        }
      }

      scored.sort((a, b) => b.score - a.score);
      if (scored.length === 0) return null;
      return {
        replaceStart,
        replaceEnd,
        query,
        contextLabel: isOnModuleHeaderLine
          ? `Configurações & Tags do Cabeçalho @${enclosingBlock}`
          : `Tags & Propriedades de @${enclosingBlock}`,
        items: scored.slice(0, 12).map((x) => x.item),
      };
    }
  }

  // -------------------------------------------------------------------------
  // CASO 3: Dentro de parênteses de atributo-base em `@skill`: ex: `Luta (|)`
  // -------------------------------------------------------------------------
  const lastOpenParen = linePrefix.lastIndexOf('(');
  const lastCloseParen = linePrefix.lastIndexOf(')');
  const isBeforeAssign = !/(:=|:!|\+=|-=|=)/.test(linePrefix);
  if (enclosingBlock === 'skill' && lastOpenParen > lastCloseParen && isBeforeAssign) {
    const attrs = symbols.filter((s) => s.category === 'attr');
    const scored: Array<{ score: number; item: DSLCompletionItem }> = [];
    for (const a of attrs) {
      const s = scoreCompletionMatch(query, a.id);
      if (s > 0) {
        scored.push({
          score: 10000 + s,
          item: {
            id: `skill_attr_${a.id}`,
            label: a.id,
            insertText: a.id,
            category: 'attr',
            badge: 'atributo-base',
            detail: `${a.label} — ${a.detail}`,
            tier: 1,
          },
        });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    if (scored.length > 0) {
      return {
        replaceStart,
        replaceEnd,
        query,
        contextLabel: 'Atributo-Base da Perícia (@skill)',
        items: scored.slice(0, 10).map((x) => x.item),
      };
    }
  }

  // -------------------------------------------------------------------------
  // CASO 4: Em expressão / fórmula (após `=`, `:=`, `+=`, `-=`, `->`, `roll:`, `damage:`, `test:`, `when`, `:`)
  // -------------------------------------------------------------------------
  const isFormulaContext =
    /(?::=|:!|\+=|-=|->|=|(?:roll|rolagem|damage|dano|test|teste|max_load|overload_limit|when|cost|custo)\s*:?)\s*[^[\]]*$/i.test(
      linePrefix,
    ) ||
    ((enclosingBlock === 'res' || enclosingBlock === 'turn' || enclosingBlock === 'counter' || enclosingBlock === 'slots') &&
      /:\s*[^[\]]*$/.test(linePrefix));

  if (isFormulaContext) {
    const justTypedOperator = /(?::=|:!|\+=|-=|->|=|:\s*)\s*$/.test(linePrefix);
    if (!query && !forceOpen && !justTypedOperator) return null;

    const scored: Array<{ score: number; item: DSLCompletionItem }> = [];

    // TIER 1: Construções específicas do módulo atual para o lado direito (RHS)
    if (enclosingBlock === 'attr' || enclosingBlock === 'stat' || enclosingBlock === 'skill') {
      const diceBuilders = [
        { label: '1d6', insertText: '1d6', badge: 'dado', detail: 'Define o atributo/perícia como 1d6 (rolável via self)' },
        { label: '1d8', insertText: '1d8', badge: 'dado', detail: 'Define o atributo/perícia como 1d8 (rolável via self)' },
        { label: '1d10', insertText: '1d10', badge: 'dado', detail: 'Define o atributo/perícia como 1d10 (rolável via self)' },
        { label: '1d12', insertText: '1d12', badge: 'dado', detail: 'Define o atributo/perícia como 1d12 (rolável via self)' },
        { label: 'd6', insertText: 'd6', badge: 'step die', detail: 'Dado escalonado d6 (d4 ↔ d6 ↔ d8 ↔ d10 ↔ d12)' },
      ];
      for (const db of diceBuilders) {
        const s = scoreCompletionMatch(query, db.label);
        if (s > 0) {
          scored.push({
            score: 10000 + 260 + s,
            item: {
              id: `stat_rhs_${db.label}`,
              label: db.label,
              insertText: db.insertText,
              category: 'dice',
              badge: db.badge,
              detail: db.detail,
              tier: 1,
            },
          });
        }
      }
    } else if (enclosingBlock === 'res') {
      const resBuilders = [
        { label: '20 / 20', insertText: '20 / 20', badge: 'barra', detail: 'Define valor atual / valor máximo do recurso' },
        { label: 'bar(20, 20)', insertText: 'bar(20, 20)', badge: 'barra', detail: 'Define barra de recurso (atual, máximo)' },
        { label: 'track(4, [".", "/", "X"])', insertText: 'track(4, [".", "/", "X"])', badge: 'trilha', detail: 'Define trilha de caixas com estados clicáveis' },
        { label: 'clock(0 / 6)', insertText: 'clock(0 / 6)', badge: 'relógio', detail: 'Define relógio de progresso circular (atual / fatias)' },
        { label: 'slots(3 / 3)', insertText: 'slots(3 / 3)', badge: 'slots', detail: 'Define marcadores de uso clicáveis (atual / máximo)' },
        { label: 'pool(3d6)', insertText: 'pool(3d6)', badge: 'pool', detail: 'Define parada de dados consumíveis e roláveis' },
        { label: 'counter(0)', insertText: 'counter(0)', badge: 'contador', detail: 'Define contador numérico livre sem teto máximo' },
      ];
      for (const rb of resBuilders) {
        const s = scoreCompletionMatch(query, rb.label);
        if (s > 0) {
          scored.push({
            score: 10000 + 300 + s,
            item: {
              id: `res_rhs_${rb.label}`,
              label: rb.label,
              insertText: rb.insertText,
              category: 'snippet',
              badge: rb.badge,
              detail: rb.detail,
              tier: 1,
            },
          });
        }
      }
    } else if (enclosingBlock === 'turn') {
      const s = scoreCompletionMatch(query, 'slots(1 / 1)');
      if (s > 0) {
        scored.push({
          score: 10000 + 400 + s,
          item: {
            id: 'turn_rhs_slots',
            label: 'slots(1 / 1)',
            insertText: 'slots(1 / 1)',
            category: 'snippet',
            badge: 'ação turno',
            detail: 'Define quantidade de usos por turno (atual / máximo)',
            tier: 1,
          },
        });
      }
    } else if (enclosingBlock === 'counter') {
      const counterRhs = [
        { label: '0/4 [segments]', insertText: '0/4 [segments]', badge: 'segmentos', detail: 'Contador em barras segmentadas' },
        { label: '0/3 [dots]', insertText: '0/3 [dots]', badge: 'pontos', detail: 'Contador em pontos circulares' },
        { label: '0/6 [pie]', insertText: '0/6 [pie]', badge: 'relógio', detail: 'Relógio de progresso fatiado' },
      ];
      for (const cr of counterRhs) {
        const s = scoreCompletionMatch(query, cr.label);
        if (s > 0) {
          scored.push({
            score: 10000 + 300 + s,
            item: {
              id: `cnt_rhs_${cr.label}`,
              label: cr.label,
              insertText: cr.insertText,
              category: 'snippet',
              badge: cr.badge,
              detail: cr.detail,
              tier: 1,
            },
          });
        }
      }
    }

    // TIER 2: Variáveis e Símbolos declarados na ficha
    appendTier2Variables(scored, query, true);

    // TIER 3: Outras recomendações (Funções matemáticas e expressões de dados)
    appendTier3Others(scored, query, false, false);

    scored.sort((a, b) => b.score - a.score);
    if (scored.length === 0) return null;
    return {
      replaceStart,
      replaceEnd,
      query,
      contextLabel: `Expressão em @${enclosingBlock} (1º Módulo • 2º Variáveis • 3º Funções/Dados)`,
      items: scored.slice(0, 12).map((x) => x.item),
    };
  }

  // -------------------------------------------------------------------------
  // CASO 5: Dentro do corpo de um módulo (@attr, @stat, @res, @skill, @inv, @ability, @slots, @counter, @desc, @turn, @profile...)
  // Ordem estrita:
  //   1º (Tier 1): Possíveis criações (novo item, sub-bloco, propriedade ou tag apropriada do módulo atual)
  //   2º (Tier 2): Variáveis declaradas na ficha
  //   3º (Tier 3): Outras recomendações (funções, dados, abertura de outros módulos @)
  // -------------------------------------------------------------------------
  const isAtLineStartOrToken = /^\s*[@!#a-zA-Z0-9_\u00C0-\u017F-]*$/.test(linePrefix);
  if (isAtLineStartOrToken && (query.length >= 1 || forceOpen || enclosingBlock !== 'root')) {
    // Se não digitou nada e não foi acionado (nem por Enter/forceOpen), aguarda
    if (!query && !forceOpen) return null;

    const scored: Array<{ score: number; item: DSLCompletionItem }> = [];
    const blockSnippets = BLOCK_BODY_SNIPPETS[enclosingBlock] || [];

    // 1. TIER 1: Criações e propriedades nativas do módulo atual
    for (const snip of blockSnippets) {
      const s = scoreCompletionMatch(query, snip.label);
      if (s <= 0) continue;

      // Boost adicional se o usuário estiver dentro de um sub-bloco (ex: dentro de `item "..."` ou `ability "..."`)
      let subBoost = 250;
      if (ctx.subKind !== 'none' && snip.subContext === ctx.subKind) {
        subBoost = 480;
      } else if (ctx.subKind === 'none' && !snip.subContext) {
        subBoost = 380;
      }

      scored.push({
        score: 10000 + subBoost + s,
        item: {
          id: `tier1_body_${enclosingBlock}_${snip.label}`,
          label: snip.label,
          insertText: snip.insertText,
          cursorOffsetFromEnd: snip.cursorBack,
          category: 'snippet',
          badge: snip.badge,
          detail: snip.detail,
          tier: 1,
        },
      });
    }

    // Em @skill, gera criações de perícia já preenchidas com os atributos reais da ficha!
    if (enclosingBlock === 'skill') {
      const attrSymbols = symbols.filter((s) => s.category === 'attr');
      const rankSymbols = symbols.filter((s) => s.category === 'rank');
      const defaultRank = rankSymbols[0]?.id ?? '0';
      for (const a of attrSymbols.slice(0, 6)) {
        const dynamicLabel = `NovaPericia (${a.id}) = ${defaultRank}`;
        const s = Math.max(scoreCompletionMatch(query, dynamicLabel), scoreCompletionMatch(query, a.id));
        if (s > 0) {
          scored.push({
            score: 10000 + 420 + s,
            item: {
              id: `tier1_skill_attr_${a.id}`,
              label: dynamicLabel,
              insertText: dynamicLabel,
              category: 'snippet',
              badge: `criar (${a.id})`,
              detail: `Cria perícia vinculada ao atributo ${a.label} (${a.id})`,
              tier: 1,
            },
          });
        }
      }
    }

    // Também inclui no TIER 1 as tags/flags do módulo atual caso o usuário digite `!` ou `#`
    if (query.startsWith('!') || query.startsWith('#')) {
      for (const meta of BRACKET_META_COMPLETIONS) {
        if (!meta.label.startsWith('!') && !meta.label.startsWith('#')) continue;
        if (meta.blocks && !meta.blocks.includes(enclosingBlock)) continue;
        const s = scoreCompletionMatch(query, meta.label);
        if (s > 0) {
          scored.push({
            score: 10000 + 300 + s,
            item: {
              id: `tier1_flag_${meta.label}`,
              label: meta.label,
              insertText: meta.insertText,
              category: 'flag',
              badge: meta.badge,
              detail: meta.detail,
              tier: 1,
            },
          });
        }
      }
    }

    // 2. TIER 2: Variáveis e Símbolos declarados na ficha (para criar efeitos `DEF += 2` ou referenciar variáveis)
    appendTier2Variables(scored, query, query.length >= 1);

    // 3. TIER 3: Outras recomendações (Funções, Dados e outros blocos @)
    appendTier3Others(scored, query, true, false);

    scored.sort((a, b) => b.score - a.score);
    if (scored.length === 0) return null;

    const subInfo = ctx.subKind !== 'none' && ctx.subLabel ? ` ▸ ${ctx.subLabel}` : '';
    return {
      replaceStart,
      replaceEnd,
      query,
      contextLabel:
        enclosingBlock !== 'root'
          ? `@${enclosingBlock}${subInfo} — 1º Criações/Tags • 2º Variáveis • 3º Outros`
          : 'Comandos SGM-SDL',
      items: scored.slice(0, 12).map((x) => x.item),
    };
  }

  return null;
}
