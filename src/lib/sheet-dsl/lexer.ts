/**
 * SGM-SDL Lexer (Analisador Léxico / Tokenizer)
 *
 * Responsável por converter o código-fonte textual da ficha em um fluxo linear
 * de tokens tipados em O(N), preservando coordenadas exatas (linha, coluna, offset)
 * e oferecendo mapeamento bilíngue (PT/EN) de diretivas.
 */

import type {
  CanonicalBlockKind,
  DSLDiagnostic,
  DSLToken,
  SourcePosition,
  TokenType,
} from './types';

/**
 * Mapa de normalização de diretivas (@bloco) para o conceito canônico da DSL.
 * Permite sintaxe enxuta e bilíngue sem duplicar lógica no Parser.
 */
export const DIRECTIVE_ALIASES: Record<string, CanonicalBlockKind> = {
  // Metadados da Ficha, Tema Hexadecimal e Meta-Módulo de Navegação de Abas
  meta: 'meta',
  sheet: 'meta',
  ficha: 'meta',
  config: 'meta',
  tema: 'meta',
  theme: 'meta',
  cores: 'meta',
  palette: 'meta',
  estilo: 'meta',
  style: 'meta',
  nav: 'meta',
  navegacao: 'meta',
  tabbar: 'meta',
  tabs_nav: 'meta',

  // Tabelas de Consulta (Lookups)
  table: 'table',
  tables: 'table',
  tabela: 'table',
  tabelas: 'table',

  // Atributos Primários
  attr: 'attr',
  attrs: 'attr',
  attributes: 'attr',
  atributo: 'attr',
  atributos: 'attr',

  // Status / Defesas / Derivados
  stat: 'stat',
  stats: 'stat',
  status: 'stat',
  defesas: 'stat',
  derivados: 'stat',

  // Recursos (Barras, Trilhas, Relógios, Slots, Contadores)
  res: 'res',
  resource: 'res',
  resources: 'res',
  recurso: 'res',
  recursos: 'res',

  // Graus / Ranks de Treinamento
  rank: 'rank',
  ranks: 'rank',
  grau: 'rank',
  graus: 'rank',
  treino: 'rank',

  // Perfis de Resolução de Dados (Faixas PbtA, d100 CoC, Pools)
  roll: 'roll',
  rolls: 'roll',
  resolution: 'roll',
  resolucao: 'roll',

  // Economia de Ações por Turno / Rodada
  turn: 'turn',
  action_economy: 'turn',
  turno: 'turn',

  // Descritores, Aspectos (Fate), Tags, Resistências e Consequências
  desc: 'desc',
  descriptors: 'desc',
  narrative: 'desc',
  descritores: 'desc',
  narrativa: 'desc',
  aspectos: 'desc',

  // Perícias / Proficiências
  skill: 'skill',
  skills: 'skill',
  pericia: 'skill',
  pericias: 'skill',

  // Inventário e Carga Automatizada
  inv: 'inv',
  inventory: 'inv',
  inventario: 'inv',
  itens: 'inv',

  // Habilidades, Ações, Movimentos (PbtA) e Magias/Rituais
  ability: 'ability',
  abilities: 'ability',
  action: 'ability',
  actions: 'ability',
  move: 'ability',
  moves: 'ability',
  magic: 'ability',
  powers: 'ability',
  habilidade: 'ability',
  habilidades: 'ability',
  acao: 'ability',
  acoes: 'ability',
  movimentos: 'ability',
  magia: 'ability',
  magias: 'ability',
  rituais: 'ability',

  // Quadros e Diagramas Espaciais / Anatômicos
  diagram: 'diagram',
  diagrams: 'diagram',
  quadro: 'diagram',
  quadros: 'diagram',
  diagrama: 'diagram',
  anatomia: 'diagram',

  // Regras Condicionais Globais
  rule: 'rule',
  rules: 'rule',
  regra: 'rule',
  regras: 'rule',

  // Abas de Layout Modular
  tab: 'tab',
  tabs: 'tab',
  aba: 'tab',
  abas: 'tab',
  page: 'tab',
  pages: 'tab',
  pagina: 'tab',
  paginas: 'tab',

  // Slots / Segmentos / Caixas (ex: Mausritter, Blades in the Dark, Relógios)
  slots: 'slots',
  slot: 'slots',
  caixas: 'slots',

  // Perfil / Retrato / Identidade Modular (@profile, @img)
  profile: 'profile',
  perfil: 'profile',
  img: 'profile',
  imagem: 'profile',
  avatar: 'profile',
  retrato: 'profile',
  identidade: 'profile',

  // Contadores Segmentados / Pontilhados / Pizza (@counter, @tracker)
  counter: 'counter',
  counters: 'counter',
  contador: 'counter',
  contadores: 'counter',
  tracker: 'counter',
  trackers: 'counter',
  segment: 'counter',
  segments: 'counter',
  segmento: 'counter',
  segmentos: 'counter',

  // Bloco de Texto / Notas / Bio Livre (@text, @texto, @nota, @bio)
  text: 'text',
  texts: 'text',
  texto: 'text',
  textos: 'text',
  note: 'text',
  notes: 'text',
  nota: 'text',
  notas: 'text',
  anotacao: 'text',
  anotacoes: 'text',
  anotações: 'text',
  bio: 'text',
  biografia: 'text',
  lore: 'text',
  historia: 'text',
  história: 'text',
};

export function normalizeDirectiveKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const KNOWN_FLAGS = new Set([
  'lock',
  'trava',
  'travado',
  'fixed',
  'active',
  'ativo',
  'equipped',
  'equipado',
  'carried',
  'mochila',
  'stash',
  'guardado',
  'infinite',
  'infinito',
  'consumable',
  'consumivel',
  'burn',
  'queimado',
]);

export interface LexerResult {
  tokens: DSLToken[];
  diagnostics: DSLDiagnostic[];
}

export class SheetLexer {
  private source: string;
  private length: number;
  private offset = 0;
  private line = 1;
  private column = 1;
  private bracketDepth = 0;
  private tokens: DSLToken[] = [];
  private diagnostics: DSLDiagnostic[] = [];

  constructor(source: string) {
    this.source = source;
    this.length = source.length;
  }

  public tokenize(): LexerResult {
    while (!this.isAtEnd()) {
      this.scanToken();
    }

    const eofPos = this.currentPos();
    this.tokens.push({
      type: 'EOF',
      value: '',
      span: { start: eofPos, end: eofPos },
    });

    return {
      tokens: this.tokens,
      diagnostics: this.diagnostics,
    };
  }

  private scanToken(): void {
    this.skipHorizontalWhitespace();
    if (this.isAtEnd()) return;

    const start = this.currentPos();
    const ch = this.peek();

    // 1. Quebras de linha (significativas como separador de declarações fora de []/())
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && this.peekNext() === '\n') {
        this.advance();
      }
      this.advanceNewline();
      if (this.bracketDepth === 0) {
        const last = this.tokens[this.tokens.length - 1];
        if (last && last.type !== 'NEWLINE' && last.type !== 'LBRACE') {
          this.tokens.push({
            type: 'NEWLINE',
            value: '\n',
            span: { start, end: this.currentPos() },
          });
        }
      }
      return;
    }

    // 2. Comentários com //
    if (ch === '/' && this.peekNext() === '/') {
      this.skipLineComment();
      return;
    }

    // 3. Comentários de bloco /* ... */
    if (ch === '/' && this.peekNext() === '*') {
      this.skipBlockComment(start);
      return;
    }

    // 4. Comentário # vs Tag #identificador
    if (ch === '#') {
      const next = this.peekNext();
      const isLineStart =
        this.tokens.length === 0 ||
        this.tokens[this.tokens.length - 1].type === 'NEWLINE' ||
        this.tokens[this.tokens.length - 1].type === 'LBRACE';

      // Se '#' estiver no início da linha (fora de colchetes) ou for seguido de espaço/outro '#', é comentário
      if (
        (isLineStart && this.bracketDepth === 0) ||
        next === ' ' ||
        next === '\t' ||
        next === '#' ||
        next === '=' ||
        next === '-' ||
        next === '\n' ||
        next === '\r' ||
        next === '\0'
      ) {
        this.skipLineComment();
        return;
      }

      // Caso contrário, é uma TAG (#fogo, #ataque, #hope)
      this.advance(); // Consome '#'
      const tagName = this.readIdentifier();
      if (tagName.length > 0) {
        this.emit('TAG', tagName, start);
      }
      return;
    }

    // 5. Diretiva de Bloco (@attr, @res, @skill, @perícias, etc.)
    if (ch === '@') {
      this.advance(); // Consome '@'
      const rawName = this.readIdentifier();
      const normalized = normalizeDirectiveKey(rawName);
      const canonical = DIRECTIVE_ALIASES[normalized];
      if (!canonical) {
        this.diagnostics.push({
          severity: 'warning',
          stage: 'lexer',
          message: `Diretiva '@${rawName}' desconhecida. Assumindo bloco '@stat'.`,
          span: { start, end: this.currentPos() },
          symbol: `@${rawName}`,
        });
        this.emit('DIRECTIVE', 'stat', start);
      } else {
        this.emit('DIRECTIVE', canonical, start);
      }
      return;
    }

    // 6. Strings entre aspas duplas ou simples
    if (ch === '"' || ch === "'") {
      this.scanString(ch, start);
      return;
    }

    // 7. Números (Inteiros ou Decimais)
    if (this.isDigit(ch)) {
      this.scanNumber(start);
      return;
    }

    // 8. Operadores Compostos e Pontuação
    switch (ch) {
      case ':':
        this.advance();
        if (this.match('=')) {
          this.emit('ASSIGN_PIN', ':=', start);
        } else if (this.match('!')) {
          this.emit('ASSIGN_LOCK', ':!', start);
        } else {
          this.emit('COLON', ':', start);
        }
        return;

      case '=':
        this.advance();
        if (this.match('=')) {
          this.emit('EQ', '==', start);
        } else {
          this.emit('ASSIGN_CALC', '=', start);
        }
        return;

      case '+':
        this.advance();
        if (this.match('=')) {
          this.emit('ASSIGN_ADD', '+=', start);
        } else {
          this.emit('PLUS', '+', start);
        }
        return;

      case '-':
        this.advance();
        if (this.match('=')) {
          this.emit('ASSIGN_SUB', '-=', start);
        } else if (this.match('>')) {
          this.emit('ARROW', '->', start);
        } else {
          this.emit('MINUS', '-', start);
        }
        return;

      case '*':
        this.advance();
        this.emit('STAR', '*', start);
        return;

      case '/':
        this.advance();
        this.emit('SLASH', '/', start);
        return;

      case '%':
        this.advance();
        this.emit('PERCENT', '%', start);
        return;

      case '.':
        this.advance();
        if (this.match('.')) {
          this.emit('RANGE', '..', start);
        } else {
          this.emit('DOT', '.', start);
        }
        return;

      case '<':
        this.advance();
        if (this.match('=')) {
          this.emit('LTE', '<=', start);
        } else {
          this.emit('LT', '<', start);
        }
        return;

      case '>':
        this.advance();
        if (this.match('=')) {
          this.emit('GTE', '>=', start);
        } else {
          this.emit('GT', '>', start);
        }
        return;

      case '&':
        this.advance();
        if (this.match('&')) {
          this.emit('AND', '&&', start);
        } else {
          this.emit('AND', '&', start);
        }
        return;

      case '|':
        this.advance();
        if (this.match('|')) {
          this.emit('OR', '||', start);
        } else {
          this.emit('PIPE', '|', start);
        }
        return;

      case '?':
        this.advance();
        this.emit('QUESTION', '?', start);
        return;

      case '!':
        this.advance();
        if (this.match('=')) {
          this.emit('NEQ', '!=', start);
          return;
        }
        if (this.match('!')) {
          this.emit('BANG_COMPOUND', '!!', start);
          return;
        }
        if (this.isIdentStart(this.peek())) {
          const word = this.readIdentifier().toLowerCase();
          if (word === 'p') {
            this.emit('BANG_PEN', '!p', start);
            return;
          }
          if (KNOWN_FLAGS.has(word)) {
            this.emit('FLAG', this.normalizeFlag(word), start);
            return;
          }
          // Flag customizada do usuário
          this.emit('FLAG', word, start);
          return;
        }
        this.emit('BANG', '!', start);
        return;

      case '{':
        this.advance();
        this.emit('LBRACE', '{', start);
        return;

      case '}':
        this.advance();
        this.emit('RBRACE', '}', start);
        return;

      case '[': {
        // Suporte a cabeçalhos estilo Markdown no início da linha: [Atributos], [Recursos], [Ações], etc.
        const isLineStart =
          this.tokens.length === 0 ||
          this.tokens[this.tokens.length - 1].type === 'NEWLINE';
        if (isLineStart && this.bracketDepth === 0) {
          const rest = this.source.slice(this.offset);
          const secMatch = rest.match(/^\[\s*([\p{L}_]+)\s*\]/u);
          if (secMatch) {
            const normSec = normalizeDirectiveKey(secMatch[1]);
            const canonicalSec = DIRECTIVE_ALIASES[normSec];
            if (canonicalSec) {
              for (let i = 0; i < secMatch[0].length; i++) {
                this.advance();
              }
              this.emit('DIRECTIVE', canonicalSec, start);
              return;
            }
          }
        }
        this.advance();
        this.bracketDepth++;
        this.emit('LBRACKET', '[', start);
        return;
      }

      case ']':
        this.advance();
        this.bracketDepth = Math.max(0, this.bracketDepth - 1);
        this.emit('RBRACKET', ']', start);
        return;

      case '(':
        this.advance();
        this.bracketDepth++;
        this.emit('LPAREN', '(', start);
        return;

      case ')':
        this.advance();
        this.bracketDepth = Math.max(0, this.bracketDepth - 1);
        this.emit('RPAREN', ')', start);
        return;

      case ';':
        this.advance();
        this.emit('SEMICOLON', ';', start);
        return;

      case ',':
        this.advance();
        this.emit('COMMA', ',', start);
        return;
    }

    // 9. Identificadores ou Notação de Dados (ex: d20, d8, dF, d20kh1)
    if (this.isIdentStart(ch)) {
      this.scanIdentifierOrDie(start);
      return;
    }

    // 10. Caractere desconhecido: registra aviso e avança sem travar
    const invalidChar = this.advance();
    this.diagnostics.push({
      severity: 'warning',
      stage: 'lexer',
      message: `Caractere inesperado '${invalidChar}' ignorado.`,
      span: { start, end: this.currentPos() },
    });
  }

  /**
   * Distingue entre um identificador comum (ex: DEF, destreza, dano)
   * e um literal de dado/modificador de dado (ex: d20, d8, dF, d20kh1).
   */
  private scanIdentifierOrDie(start: SourcePosition): void {
    const rest = this.source.slice(this.offset);

    // Verifica se começa com d<Faces> seguido opcionalmente de modificadores de dado (kh, kl, dh, dl, r)
    const dieMatch = rest.match(
      /^d(100|20|12|10|8|6|4|F|\d+)((?:(?:kh|kl|dh|dl|r)\d+)*)(?![\p{L}\p{N}_])/iu,
    );

    if (dieMatch) {
      const facesRaw = dieMatch[1].toUpperCase();
      const consumeLen = 1 + dieMatch[1].length; // "d" + faces
      for (let i = 0; i < consumeLen; i++) {
        this.advance();
      }
      this.emit('STEP_DIE', facesRaw, start);

      // Se houver sufixos colados como kh1, kl1, dh1, dl1, r1, emite cada um como IDENTIFIER
      let suffixes = dieMatch[2];
      while (suffixes.length > 0) {
        const modMatch = suffixes.match(/^(kh|kl|dh|dl|r)(\d+)/i);
        if (!modMatch) break;
        const modStart = this.currentPos();
        const modStr = modMatch[0].toLowerCase();
        for (let i = 0; i < modStr.length; i++) {
          this.advance();
        }
        this.emit('IDENTIFIER', modStr, modStart);
        suffixes = suffixes.slice(modStr.length);
      }
      return;
    }

    const ident = this.readIdentifier();
    this.emit('IDENTIFIER', ident, start);
  }

  private scanNumber(start: SourcePosition): void {
    let numStr = '';
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      numStr += this.advance();
    }

    // Verifica decimal (mas cuidado para não consumir '..' de RangeExpr 1..4)
    if (this.peek() === '.' && this.peekNext() !== '.' && this.isDigit(this.peekNext())) {
      numStr += this.advance(); // '.'
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        numStr += this.advance();
      }
    }

    this.emit('NUMBER', numStr, start);
  }

  private scanString(quote: string, start: SourcePosition): void {
    this.advance(); // Consome aspa inicial
    let value = '';

    while (!this.isAtEnd() && this.peek() !== quote) {
      const ch = this.peek();
      if (ch === '\n' || ch === '\r') {
        break; // Strings de linha única recuperam graciosamente no fim da linha
      }
      if (ch === '\\') {
        this.advance();
        if (!this.isAtEnd()) {
          const escaped = this.advance();
          if (escaped === quote || escaped === '\\') {
            value += escaped;
          } else {
            value += '\\' + escaped;
          }
        }
      } else {
        value += this.advance();
      }
    }

    if (this.peek() === quote) {
      this.advance(); // Consome aspa final
    } else {
      this.diagnostics.push({
        severity: 'error',
        stage: 'lexer',
        message: 'String não fechada antes do fim da linha.',
        span: { start, end: this.currentPos() },
      });
    }

    this.emit('STRING', value, start);
  }

  private readIdentifier(): string {
    let ident = '';
    while (!this.isAtEnd() && this.isIdentPart(this.peek())) {
      ident += this.advance();
    }
    return ident;
  }

  private normalizeFlag(word: string): string {
    switch (word) {
      case 'trava':
      case 'travado':
      case 'fixed':
        return 'lock';
      case 'ativo':
        return 'active';
      case 'equipado':
        return 'equipped';
      case 'mochila':
        return 'carried';
      case 'guardado':
        return 'stash';
      case 'infinito':
        return 'infinite';
      case 'consumivel':
        return 'consumable';
      case 'queimado':
        return 'burn';
      default:
        return word;
    }
  }

  private skipHorizontalWhitespace(): void {
    while (!this.isAtEnd()) {
      const ch = this.peek();
      if (ch === ' ' || ch === '\t') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private skipLineComment(): void {
    while (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
      this.advance();
    }
  }

  private skipBlockComment(start: SourcePosition): void {
    this.advance(); // '/'
    this.advance(); // '*'
    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peekNext() === '/') {
        this.advance();
        this.advance();
        return;
      }
      if (this.peek() === '\n') {
        this.advanceNewline();
      } else {
        this.advance();
      }
    }
    this.diagnostics.push({
      severity: 'error',
      stage: 'lexer',
      message: 'Comentário de bloco /* não fechado.',
      span: { start, end: this.currentPos() },
    });
  }

  private isIdentStart(ch: string): boolean {
    if (!ch || ch === '\0') return false;
    return /[\p{L}_]/u.test(ch);
  }

  private isIdentPart(ch: string): boolean {
    if (!ch || ch === '\0') return false;
    return /[\p{L}\p{N}_]/u.test(ch);
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isAtEnd(): boolean {
    return this.offset >= this.length;
  }

  private peek(): string {
    return this.offset < this.length ? this.source[this.offset] : '\0';
  }

  private peekNext(): string {
    return this.offset + 1 < this.length ? this.source[this.offset + 1] : '\0';
  }

  private advance(): string {
    const ch = this.source[this.offset++];
    this.column++;
    return ch;
  }

  private advanceNewline(): void {
    this.offset++;
    this.line++;
    this.column = 1;
  }

  private match(expected: string): boolean {
    if (this.isAtEnd() || this.source[this.offset] !== expected) {
      return false;
    }
    this.offset++;
    this.column++;
    return true;
  }

  private currentPos(): SourcePosition {
    return {
      line: this.line,
      column: this.column,
      offset: this.offset,
    };
  }

  private emit(type: TokenType, value: string, start: SourcePosition): void {
    const end = this.currentPos();
    this.tokens.push({
      type,
      value,
      span: { start, end },
    });
  }
}

export function tokenizeSheetDSL(source: string): LexerResult {
  return new SheetLexer(source).tokenize();
}
