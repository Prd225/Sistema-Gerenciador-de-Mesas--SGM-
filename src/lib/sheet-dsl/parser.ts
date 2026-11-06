/**
 * SGM-SDL Parser (Analisador Sintático Híbrido: Recursive Descent + Pratt Parser)
 *
 * Arquitetura:
 * 1. Reconhecedores Modulares de Bloco (Recursive Descent):
 *    Cada diretiva (@attr, @res, @skill, @inv, @ability, @table, @roll, @turn, @diagram, @rule)
 *    possui seu próprio reconhecedor isolado e tolerante a falhas (Panic-Mode Recovery).
 * 2. Reconhecedor de Expressões (Pratt Parser / Top-Down Operator Precedence):
 *    Resolve aritmética, chamadas de função, acesso a propriedades (FOR.mod),
 *    intervalos (18..20), ternários e notações complexas de dados ((AGI)d20kh1, 4d6!, 6d10>=6).
 */

import { tokenizeSheetDSL } from './lexer';
import type {
  AbilityCategory,
  AssignMode,
  ASTAbilityDecl,
  ASTCounterItemDecl,
  ASTDescriptorDecl,
  ASTDiagramDecl,
  ASTDiagramNodeDecl,
  ASTEffectStmt,
  ASTEnhancementDecl,
  ASTExpr,
  ASTItemDecl,
  ASTMetadataMap,
  ASTOutcomeBand,
  ASTRankGroupDecl,
  ASTResolutionDecl,
  ASTResourceDecl,
  ASTRuleDecl,
  ASTSheetDocument,
  ASTSkillDecl,
  ASTSlotItemDecl,
  ASTStatDecl,
  ASTTableDecl,
  ASTTableRow,
  ASTTurnConversion,
  ASTTurnSlotDecl,
  CanonicalBlockKind,
  DescriptorKind,
  DiceModifierNode,
  DSLDiagnostic,
  DSLToken,
  ModuleDisplayStyle,
  ModulePlacement,
  ResourceKind,
  SourceSpan,
  StepDieFaces,
  TokenType,
} from './types';

export interface ParseResult {
  ast: ASTSheetDocument;
  diagnostics: DSLDiagnostic[];
}

const RESOURCE_KINDS = new Set<ResourceKind>([
  'bar',
  'track',
  'clock',
  'slots',
  'counter',
  'pool',
]);

const DESCRIPTOR_KINDS: Record<string, DescriptorKind> = {
  aspect: 'aspect',
  aspecto: 'aspect',
  tag: 'tag',
  resistance: 'resistance',
  resistencia: 'resistance',
  immunity: 'immunity',
  imunidade: 'immunity',
  vulnerability: 'vulnerability',
  vulnerabilidade: 'vulnerability',
  consequence: 'consequence',
  consequencia: 'consequence',
  trauma: 'consequence',
  sense: 'sense',
  sentido: 'sense',
};

const ABILITY_CATEGORIES: Record<string, AbilityCategory> = {
  ability: 'ability',
  habilidade: 'ability',
  passiva: 'ability',
  poder: 'ability',
  action: 'action',
  acao: 'action',
  ataque: 'action',
  move: 'move',
  movimento: 'move',
  spell: 'spell',
  magia: 'spell',
  ritual: 'spell',
};

export class SheetParser {
  private tokens: DSLToken[];
  private pos = 0;
  private diagnostics: DSLDiagnostic[];
  private currentTabContext?: string;

  constructor(tokens: DSLToken[], lexerDiagnostics: DSLDiagnostic[] = []) {
    this.tokens = tokens;
    this.diagnostics = [...lexerDiagnostics];
  }

  public parseDocument(): ParseResult {
    const doc: ASTSheetDocument = {
      meta: this.emptyMeta(),
      profiles: [],
      counters: [],
      texts: [],
      tables: [],
      ranks: [],
      resolutions: [],
      attributes: [],
      stats: [],
      resources: [],
      turn: {
        reset: 'round',
        slots: [],
        conversions: [],
      },
      descriptors: [],
      skills: [],
      inventory: {
        config: {},
        items: [],
        rules: [],
      },
      abilities: [],
      diagrams: [],
      rules: [],
      slots: [],
      tabs: [],
      blockTitles: {},
      moduleLayouts: [],
    };

    this.skipSeparators();

    while (!this.isAtEnd()) {
      try {
        if (this.match('RBRACE')) {
          this.skipSeparators();
          continue;
        }
        const tok = this.peek();

        if (tok.type === 'DIRECTIVE') {
          this.advance();
          const kind = tok.value as CanonicalBlockKind;
          this.parseDirectiveBlock(kind, doc);
        } else if (tok.type === 'IDENTIFIER') {
          // Declaração solta no topo do arquivo -> trata como @stat
          const stat = this.parseStatDecl();
          if (stat) doc.stats.push(stat);
        } else {
          this.error(tok, `Token inesperado '${tok.value || tok.type}' no nível raiz.`);
          this.synchronizeToNextStatement();
        }
      } catch {
        this.synchronizeToNextStatement();
      }
      this.skipSeparators();
    }

    return {
      ast: doc,
      diagnostics: this.diagnostics,
    };
  }

  // ==========================================================================
  // 1. DESPACHANTE E RECONHECEDORES DE BLOCOS (@attr, @res, @skill, etc.)
  // ==========================================================================

  private parseDirectiveBlock(kind: CanonicalBlockKind, doc: ASTSheetDocument): void {
    switch (kind) {
      case 'meta':
        this.parseMetaDirective(doc);
        break;
      case 'profile':
        this.parseProfileBlock(doc);
        break;
      case 'counter':
        this.parseCounterBlock(doc);
        break;
      case 'table': {
        const tbl = this.parseTableDirective();
        if (tbl) doc.tables.push(tbl);
        break;
      }
      case 'rank': {
        const rnk = this.parseRankDirective();
        if (rnk) doc.ranks.push(rnk);
        break;
      }
      case 'roll': {
        const res = this.parseResolutionDirective();
        if (res) doc.resolutions.push(res);
        break;
      }
      case 'attr':
        this.parseStatsBlock(doc.attributes, 'attr', doc);
        break;
      case 'stat':
        this.parseStatsBlock(doc.stats, 'stat', doc);
        break;
      case 'res':
        this.parseResourcesBlock(doc.resources, doc);
        break;
      case 'turn':
        this.parseTurnBlock(doc);
        break;
      case 'desc':
        this.parseDescriptorsBlock(doc.descriptors, doc);
        break;
      case 'skill':
        this.parseSkillsBlock(doc);
        break;
      case 'inv':
        this.parseInventoryBlock(doc);
        break;
      case 'ability':
        this.parseAbilitiesBlock(doc.abilities, doc);
        break;
      case 'diagram': {
        const diag = this.parseDiagramDirective(doc);
        if (diag) doc.diagrams.push(diag);
        break;
      }
      case 'rule':
        this.parseRulesBlock(doc.rules, doc);
        break;
      case 'tab':
        this.parseTabBlock(doc);
        break;
      case 'slots':
        this.parseSlotsBlock(doc);
        break;
      case 'text':
        this.parseTextBlock(doc);
        break;
    }
  }

  /**
   * @meta "Nome do Personagem" [archetype: "Guerreiro", level: 5]
   * ou linhas diretas key: value abaixo de @meta
   */
  private parseMetaDirective(doc: ASTSheetDocument): void {
    if (this.check('STRING') || this.check('IDENTIFIER')) {
      const nameTok = this.advance();
      const rawVal = nameTok.value.trim();
      const lowerVal = rawVal.toLowerCase();
      const isHex = /^#?[0-9a-fA-F]{6}$/.test(rawVal) || /^#[0-9a-fA-F]{3,8}$/.test(rawVal);
      const isNavPos = ['top', 'bottom', 'left', 'right', 'topo', 'baixo', 'esquerda', 'direita', 'hidden', 'oculto'].includes(lowerVal);

      if (isHex) {
        doc.meta.props.color = {
          type: 'StringLit',
          value: rawVal.startsWith('#') ? rawVal : `#${rawVal}`,
          span: nameTok.span,
        };
      } else if (isNavPos) {
        doc.meta.props.tabs_pos = {
          type: 'StringLit',
          value: lowerVal,
          span: nameTok.span,
        };
      } else {
        doc.meta.props.name = {
          type: 'StringLit',
          value: nameTok.value,
          span: nameTok.span,
        };
      }
    }

    if (this.check('LBRACKET')) {
      this.mergeMeta(doc.meta, this.parseMetadataBracket());
    }

    this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd()) {
      if (this.check('TAG')) {
        doc.meta.tags.push(this.advance().value);
      } else if (this.check('FLAG')) {
        doc.meta.flags.push(this.advance().value);
      } else if (this.check('IDENTIFIER')) {
        const key = this.advance().value;
        if (this.match('COLON') || this.match('ASSIGN_CALC') || this.match('ASSIGN_PIN')) {
          doc.meta.props[key] = this.parseExpr(0);
        }
      } else {
        this.advance();
      }
      this.skipSeparators();
    }

    this.match('RBRACE');
  }

  /**
   * @profile "Arthur Cervero" [col1, size: lg]
   *   image: "https://..."
   *   archetype: "Especialista"
   *   level: 50
   *   desc: "Investigador veterano"
   * Ou sintaxe curta de imagem: @img "https://..." [lg]
   */
  private parseProfileBlock(doc: ASTSheetDocument): void {
    const startTok = this.peek();
    const id = `profile_${doc.profiles.length + 1}`;
    let inlineText: string | undefined;

    if (this.check('STRING')) {
      inlineText = this.advance().value;
    }

    const header = this.parseBlockHeader();
    if (header.tab && !doc.tabs.some((t) => t.id === header.tab)) {
      doc.tabs.push({ id: header.tab, label: header.tab });
    }
    const resolvedTitle =
      header.title === '__DEFAULT__' ? 'Perfil' : header.title;

    const props: Record<string, ASTExpr> = { ...header.meta.props };
    if (inlineText) {
      const looksLikePathOrUrl =
        inlineText.startsWith('http://') ||
        inlineText.startsWith('https://') ||
        inlineText.startsWith('data:image') ||
        inlineText.startsWith('file://') ||
        inlineText.startsWith('/') ||
        /^[a-zA-Z]:[\\/]/.test(inlineText) ||
        /\.(png|jpe?g|webp|gif|svg|avif|bmp)$/i.test(inlineText);

      if (looksLikePathOrUrl) {
        props.image = { type: 'StringLit', value: inlineText, span: startTok.span };
      } else if (!props.name) {
        props.name = { type: 'StringLit', value: inlineText, span: startTok.span };
      }
    }

    const hasBrace = this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd() && !(hasBrace && this.check('RBRACE'))) {
      if (this.check('TAG')) {
        header.meta.tags.push(this.advance().value);
      } else if (this.check('FLAG')) {
        header.meta.flags.push(this.advance().value);
      } else if (this.check('IDENTIFIER')) {
        const key = this.advance().value;
        if (this.match('COLON') || this.match('ASSIGN_CALC') || this.match('ASSIGN_PIN')) {
          props[key] = this.parseExpr(0);
        } else {
          header.meta.flags.push(key);
        }
      } else {
        this.advance();
      }
      this.skipSeparators();
    }

    if (hasBrace) this.match('RBRACE');

    const allMarkers = new Set([
      ...header.meta.tags.map((t) => t.toLowerCase()),
      ...header.meta.flags.map((f) => f.toLowerCase()),
      header.display.toLowerCase(),
    ]);

    let textPos: import('./types').ProfileTextPosition | undefined;
    const posVal = props.text_pos ?? props.pos ?? props.layout ?? props.alinhamento;
    if (posVal) {
      const posStr =
        posVal.type === 'StringLit'
          ? posVal.value.toLowerCase()
          : posVal.type === 'Ident'
            ? posVal.name.toLowerCase()
            : '';
      if (posStr === 'bottom' || posStr === 'baixo' || posStr === 'embaixo' || posStr === 'inferior') {
        textPos = 'bottom';
      } else if (posStr === 'top' || posStr === 'topo' || posStr === 'cima' || posStr === 'superior') {
        textPos = 'top';
      } else if (posStr === 'side' || posStr === 'lado' || posStr === 'lateral') {
        textPos = 'side';
      } else if (posStr === 'none' || posStr === 'so_imagem' || posStr === 'avatar-only' || posStr === 'sem_texto') {
        textPos = 'none';
      }
    }
    if (!textPos) {
      if (allMarkers.has('bottom') || allMarkers.has('baixo') || allMarkers.has('embaixo') || allMarkers.has('inferior')) {
        textPos = 'bottom';
      } else if (allMarkers.has('top') || allMarkers.has('topo') || allMarkers.has('cima') || allMarkers.has('superior')) {
        textPos = 'top';
      } else if (allMarkers.has('side') || allMarkers.has('lado') || allMarkers.has('lateral')) {
        textPos = 'side';
      } else if (allMarkers.has('none') || allMarkers.has('so_imagem') || allMarkers.has('avatar-only') || allMarkers.has('sem_texto') || allMarkers.has('img_only')) {
        textPos = 'none';
      }
    }

    doc.profiles.push({
      type: 'ProfileBlockDecl',
      id,
      title: resolvedTitle && resolvedTitle !== inlineText ? resolvedTitle : undefined,
      tab: header.tab,
      placement: header.placement,
      display: header.display,
      tall: header.tall,
      textPos,
      props,
      meta: header.meta,
      span: this.mergeSpans(startTok.span, this.previous().span),
    });

    this.registerModuleLayout(doc, 'profile', id, header, resolvedTitle);
  }

  /**
   * @text "Histórico & Conceito" [col1, tall]
   *   "Arthur Cervero é um investigador veterano assombrado pelos eventos de Carpazinha."
   *   - Pista misteriosa encontrada na mansão antiga.
   *   - Ritual de Sangue catalogado nos arquivos confidenciais.
   */
  private parseTextBlock(doc: ASTSheetDocument): void {
    const startTok = this.peek();
    const id = `text_${doc.texts.length + 1}`;
    let inlineTitle: string | undefined;

    if (this.check('STRING')) {
      inlineTitle = this.advance().value;
    }

    const header = this.parseBlockHeader();
    if (header.tab && !doc.tabs.some((t) => t.id === header.tab)) {
      doc.tabs.push({ id: header.tab, label: header.tab });
    }
    const resolvedTitle =
      header.title && header.title !== '__DEFAULT__'
        ? header.title
        : inlineTitle || (header.title === '__DEFAULT__' ? 'Anotações' : undefined);

    if (resolvedTitle && !doc.blockTitles.text) {
      doc.blockTitles.text = resolvedTitle;
    }

    const content: string[] = [];
    const props: Record<string, ASTExpr> = { ...header.meta.props };

    const hasBrace = this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd() && !(hasBrace && this.check('RBRACE'))) {
      if (this.check('TAG')) {
        header.meta.tags.push(this.advance().value);
        this.skipSeparators();
        continue;
      }
      if (this.check('FLAG')) {
        header.meta.flags.push(this.advance().value);
        this.skipSeparators();
        continue;
      }
      if (this.check('STRING')) {
        content.push(this.advance().value);
        this.skipSeparators();
        continue;
      }

      // Linha de texto livre, bullet point (- item) ou chave: valor
      const lineTokens: string[] = [];
      while (
        !this.isAtEnd() &&
        !this.check('NEWLINE') &&
        !this.check('RBRACE') &&
        !this.check('DIRECTIVE')
      ) {
        const t = this.advance();
        lineTokens.push(t.value);
      }
      const rawLine = lineTokens.join(' ').trim();
      if (rawLine) {
        content.push(rawLine);
      }
      this.skipSeparators();
    }

    if (hasBrace) this.match('RBRACE');

    doc.texts.push({
      type: 'TextBlockDecl',
      id,
      title: resolvedTitle,
      tab: header.tab,
      placement: header.placement,
      display: header.display,
      tall: header.tall,
      content,
      props,
      meta: header.meta,
      span: this.mergeSpans(startTok.span, this.previous().span),
    });

    this.registerModuleLayout(doc, 'text', id, header, resolvedTitle);
  }

  /**
   * @counter "Ações Especiais" [col2, segments]
   *   acao_1 "Ação Especial": 2/3 [segments, amber]
   *   acao_2 "Fôlego": 2/3 [dots, amber]
   *   acao_3 "Ritual": 2/3 [pie, purple]
   */
  private parseCounterBlock(doc: ASTSheetDocument): void {
    const startTok = this.peek();
    const id = `counter_${doc.counters.length + 1}`;
    const header = this.parseBlockHeader();
    if (header.tab && !doc.tabs.some((t) => t.id === header.tab)) {
      doc.tabs.push({ id: header.tab, label: header.tab });
    }
    const resolvedTitle =
      header.title === '__DEFAULT__' ? 'Contadores' : header.title;
    if (resolvedTitle) {
      doc.blockTitles.counters = resolvedTitle;
    }

    const defaultStyle: 'segments' | 'dots' | 'pie' =
      header.display === 'dots' || header.display === 'pie' || header.display === 'segments'
        ? header.display
        : 'segments';

    const items: ASTCounterItemDecl[] = [];
    const hasBrace = this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd() && !(hasBrace && this.check('RBRACE'))) {
      this.matchAny('MINUS', 'STAR');
      const item = this.parseCounterItemDecl(defaultStyle);
      if (item) items.push(item);
      this.skipSeparators();
    }

    if (hasBrace) this.match('RBRACE');

    doc.counters.push({
      type: 'CounterBlockDecl',
      id,
      title: resolvedTitle,
      tab: header.tab,
      placement: header.placement,
      display: header.display,
      items,
      meta: header.meta,
      span: this.mergeSpans(startTok.span, this.previous().span),
    });

    this.registerModuleLayout(doc, 'counter', id, header, resolvedTitle);
  }

  private parseCounterItemDecl(
    defaultStyle: 'segments' | 'dots' | 'pie',
  ): ASTCounterItemDecl | null {
    const startTok = this.peek();
    const id = this.consumeIdentifierOrString('Esperado identificador do contador.');
    if (!id) {
      this.synchronizeToNextStatement();
      return null;
    }

    let label = id;
    if (this.check('STRING')) {
      label = this.advance().value;
    }

    this.matchAny('COLON', 'ASSIGN_CALC', 'ASSIGN_PIN');

    let current = 0;
    let max = 3;

    if (this.check('NUMBER')) {
      const first = Number(this.advance().value);
      if (this.match('SLASH') && this.check('NUMBER')) {
        current = first;
        max = Number(this.advance().value);
      } else {
        current = first;
        max = first;
      }
    }

    const meta = this.parseOptionalMetaAndFlags();
    const allItemTokens = new Set([
      ...meta.tags.map((t) => t.toLowerCase()),
      ...meta.flags.map((f) => f.toLowerCase()),
      meta.props.style?.type === 'StringLit'
        ? meta.props.style.value.toLowerCase()
        : meta.props.style?.type === 'Ident'
          ? meta.props.style.name.toLowerCase()
          : '',
      meta.props.display?.type === 'StringLit'
        ? meta.props.display.value.toLowerCase()
        : meta.props.display?.type === 'Ident'
          ? meta.props.display.name.toLowerCase()
          : '',
      meta.props.modo?.type === 'StringLit'
        ? meta.props.modo.value.toLowerCase()
        : meta.props.modo?.type === 'Ident'
          ? meta.props.modo.name.toLowerCase()
          : '',
    ]);

    let style: 'segments' | 'dots' | 'pie' = defaultStyle;
    if (
      allItemTokens.has('dots') ||
      allItemTokens.has('circles') ||
      allItemTokens.has('circulos') ||
      allItemTokens.has('círculos') ||
      allItemTokens.has('pontilhado') ||
      allItemTokens.has('bolinhas')
    ) {
      style = 'dots';
    } else if (
      allItemTokens.has('pie') ||
      allItemTokens.has('pizza') ||
      allItemTokens.has('clock') ||
      allItemTokens.has('relogio') ||
      allItemTokens.has('relógio')
    ) {
      style = 'pie';
    } else if (
      allItemTokens.has('segments') ||
      allItemTokens.has('segmentos') ||
      allItemTokens.has('barras')
    ) {
      style = 'segments';
    }

    let color: string | undefined;
    if (meta.props.color) {
      color =
        meta.props.color.type === 'StringLit'
          ? meta.props.color.value
          : meta.props.color.type === 'Ident'
            ? meta.props.color.name
            : undefined;
    } else if (meta.props.cor) {
      color =
        meta.props.cor.type === 'StringLit'
          ? meta.props.cor.value
          : meta.props.cor.type === 'Ident'
            ? meta.props.cor.name
            : undefined;
    } else {
      for (const c of ['amber', 'gold', 'yellow', 'red', 'green', 'emerald', 'blue', 'cyan', 'purple', 'violet', 'pink', 'orange']) {
        if (allItemTokens.has(c)) {
          color = c;
          break;
        }
      }
    }

    return {
      id,
      label,
      current,
      max: Math.max(1, max),
      style,
      color,
      meta,
      span: this.mergeSpans(startTok.span, this.previous().span),
    };
  }

  /**
   * @table bonus_prof
   * 1..4 -> 2
   * 5..8 -> 3
   */
  private parseTableDirective(): ASTTableDecl | null {
    const startSpan = this.peek().span;
    const id = this.consumeIdentifierOrString('Esperado identificador para @table.');
    if (!id) return null;

    const rows: ASTTableRow[] = [];
    this.matchAny('COLON', 'LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd()) {
      const rowStart = this.peek().span;
      const matcher = this.parseMatcherExpr();
      if (!this.match('ARROW')) {
        this.synchronizeToNextStatement();
        this.skipSeparators();
        continue;
      }
      const result = this.parseExpr(0);
      const meta = this.parseOptionalMetaAndFlags();

      rows.push({
        matcher,
        result,
        meta,
        span: this.mergeSpans(rowStart, this.previous().span),
      });
      this.skipSeparators();
    }

    this.match('RBRACE');
    return {
      type: 'TableDecl',
      id,
      rows,
      span: this.mergeSpans(startSpan, this.previous().span),
    };
  }

  /**
   * @rank treino
   * destreinado = 0 | treinado = 5 | veterano = 10 | expert = 15
   */
  private parseRankDirective(): ASTRankGroupDecl | null {
    const startSpan = this.peek().span;
    let id = 'default';
    if (
      (this.check('IDENTIFIER') || this.check('STRING')) &&
      this.peekNext().type !== 'ASSIGN_CALC' &&
      this.peekNext().type !== 'ASSIGN_PIN' &&
      this.peekNext().type !== 'ARROW'
    ) {
      id = this.advance().value;
    }

    const ranks: Record<string, number> = {};
    this.matchAny('COLON', 'LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd()) {
      const key = this.consumeIdentifierOrString('Esperado nome do grau em @rank.');
      if (key && (this.match('ASSIGN_CALC') || this.match('ASSIGN_PIN') || this.match('COLON') || this.match('ARROW'))) {
        let sign = 1;
        if (this.match('MINUS')) sign = -1;
        else if (this.match('PLUS')) sign = 1;
        const numTok = this.consume('NUMBER', 'Esperado valor numérico para o grau.');
        ranks[key] = sign * Number(numTok.value || 0);
      } else {
        this.synchronizeToNextStatement();
      }
      this.skipSeparators();
    }

    this.match('RBRACE');
    return {
      type: 'RankGroupDecl',
      id,
      ranks,
      span: this.mergeSpans(startSpan, this.previous().span),
    };
  }

  /**
   * @roll pbta (mod)
   * roll: 2d6 + mod
   * >= 10 -> "Sucesso Pleno" [tier: "success"]
   * 7..9  -> "Sucesso Parcial" [tier: "partial"]
   * <= 6  -> "Falha" [tier: "fail"]
   */
  private parseResolutionDirective(): ASTResolutionDecl | null {
    const startSpan = this.peek().span;
    const id = this.consumeIdentifierOrString('Esperado nome do perfil em @roll.');
    if (!id) return null;

    const params: string[] = [];
    if (this.match('LPAREN')) {
      while (!this.check('RPAREN') && !this.isAtEnd()) {
        if (this.check('IDENTIFIER')) {
          params.push(this.advance().value);
        }
        if (!this.match('COMMA')) break;
      }
      this.consume('RPAREN', "Esperado ')' após parâmetros de @roll.");
    }

    this.matchAny('COLON', 'LBRACE');
    this.skipSeparators();

    let rollExpr: ASTExpr = { type: 'DiceExpr', count: { type: 'NumberLit', value: 1, span: startSpan }, faces: { type: 'NumberLit', value: 20, span: startSpan }, modifiers: [], span: startSpan };
    const bands: ASTOutcomeBand[] = [];

    while (!this.isAtBlockEnd()) {
      if (this.check('IDENTIFIER') && (this.peek().value === 'roll' || this.peek().value === 'rolagem' || this.peek().value === 'dados')) {
        this.advance();
        this.matchAny('COLON', 'ASSIGN_CALC');
        rollExpr = this.parseExpr(0);
      } else if (this.check('IDENTIFIER') && this.peek().value === 'outcomes') {
        this.advance();
        this.matchAny('COLON', 'LBRACE');
        this.skipSeparators();
        while (!this.isAtBlockEnd()) {
          const band = this.parseOutcomeBand();
          if (band) bands.push(band);
          this.skipSeparators();
        }
        this.match('RBRACE');
      } else {
        const band = this.parseOutcomeBand();
        if (band) bands.push(band);
      }
      this.skipSeparators();
    }

    this.match('RBRACE');
    return {
      type: 'ResolutionDecl',
      id,
      params,
      rollExpr,
      bands,
      span: this.mergeSpans(startSpan, this.previous().span),
    };
  }

  private parseOutcomeBand(): ASTOutcomeBand | null {
    const startSpan = this.peek().span;
    const matcher = this.parseMatcherExpr();
    if (!this.match('ARROW')) {
      this.synchronizeToNextStatement();
      return null;
    }

    let label = '';
    if (this.check('STRING') || this.check('IDENTIFIER')) {
      label = this.advance().value;
    }
    const meta = this.parseOptionalMetaAndFlags();
    const effects: ASTEffectStmt[] = [];

    if (this.match('ARROW') || this.check('LBRACE')) {
      this.parseEffectsBlockInto(effects);
    }

    return {
      matcher,
      label,
      meta,
      effects,
      span: this.mergeSpans(startSpan, this.previous().span),
    };
  }

  private parseBlockHeader(): {
    title?: string;
    tab?: string;
    placement: ModulePlacement;
    display: ModuleDisplayStyle;
    tall: boolean;
    cols?: number;
    color?: string;
    meta: ASTMetadataMap;
  } {
    let title: string | undefined;
    if (this.check('STRING')) {
      title = this.advance().value;
    }
    const meta = this.parseOptionalMetaAndFlags();
    if (!title && meta.props.title) {
      if (meta.props.title.type === 'StringLit') title = meta.props.title.value;
      else if (meta.props.title.type === 'Ident') title = meta.props.title.name;
    } else if (!title && meta.props.titulo) {
      if (meta.props.titulo.type === 'StringLit') title = meta.props.titulo.value;
      else if (meta.props.titulo.type === 'Ident') title = meta.props.titulo.name;
    } else if (
      !title &&
      (meta.tags.includes('title') ||
        meta.tags.includes('titulo') ||
        meta.flags.includes('title') ||
        meta.flags.includes('titulo'))
    ) {
      title = '__DEFAULT__';
    }
    let tab = this.currentTabContext;
    if (meta.props.tab && meta.props.tab.type === 'StringLit') {
      tab = meta.props.tab.value;
    } else if (meta.props.aba && meta.props.aba.type === 'StringLit') {
      tab = meta.props.aba.value;
    }

    const extractTokenStr = (expr?: ASTExpr): string => {
      if (!expr) return '';
      if (expr.type === 'StringLit') return expr.value.toLowerCase();
      if (expr.type === 'Ident') return expr.name.toLowerCase();
      if (expr.type === 'NumberLit') return String(expr.value);
      return '';
    };

    const allMarkers = new Set([
      ...meta.tags.map((t) => t.toLowerCase()),
      ...meta.flags.map((f) => f.toLowerCase()),
      extractTokenStr(meta.props.col),
      extractTokenStr(meta.props.coluna),
      extractTokenStr(meta.props.span),
      extractTokenStr(meta.props.placement),
      extractTokenStr(meta.props.pos),
      extractTokenStr(meta.props.layout),
      extractTokenStr(meta.props.display),
      extractTokenStr(meta.props.modo),
      extractTokenStr(meta.props.view),
      extractTokenStr(meta.props.estilo),
    ]);

    let placement: ModulePlacement = 'auto';
    if (
      allMarkers.has('full') ||
      allMarkers.has('wide') ||
      allMarkers.has('horizontal') ||
      allMarkers.has('span2') ||
      allMarkers.has('ambas') ||
      allMarkers.has('total')
    ) {
      placement = 'full';
    } else if (
      allMarkers.has('col1') ||
      allMarkers.has('left') ||
      allMarkers.has('esquerda') ||
      allMarkers.has('esq') ||
      allMarkers.has('1')
    ) {
      placement = 'col1';
    } else if (
      allMarkers.has('col2') ||
      allMarkers.has('right') ||
      allMarkers.has('direita') ||
      allMarkers.has('dir') ||
      allMarkers.has('2')
    ) {
      placement = 'col2';
    }

    let display: ModuleDisplayStyle = 'cards';
    if (allMarkers.has('list') || allMarkers.has('lista')) {
      display = 'list';
    } else if (allMarkers.has('pyramid') || allMarkers.has('piramide') || allMarkers.has('pirâmide')) {
      display = 'pyramid';
    } else if (
      allMarkers.has('divided') ||
      allMarkers.has('divisorias') ||
      allMarkers.has('divisórias') ||
      allMarkers.has('paragraph') ||
      allMarkers.has('paragrafo') ||
      allMarkers.has('lines') ||
      allMarkers.has('linhas')
    ) {
      display = 'divided';
    } else if (allMarkers.has('stacked') || allMarkers.has('empilhado') || allMarkers.has('pilha')) {
      display = 'stacked';
    } else if (allMarkers.has('segments') || allMarkers.has('segmentos') || allMarkers.has('barras')) {
      display = 'segments';
    } else if (
      allMarkers.has('dots') ||
      allMarkers.has('circles') ||
      allMarkers.has('circulos') ||
      allMarkers.has('círculos') ||
      allMarkers.has('pontilhado') ||
      allMarkers.has('bolinhas')
    ) {
      display = 'dots';
    } else if (
      allMarkers.has('pie') ||
      allMarkers.has('pizza') ||
      allMarkers.has('clock') ||
      allMarkers.has('relogio') ||
      allMarkers.has('relógio')
    ) {
      display = 'pie';
    }

    const tall =
      allMarkers.has('tall') ||
      allMarkers.has('vertical') ||
      allMarkers.has('infinite') ||
      allMarkers.has('infinito') ||
      allMarkers.has('longo');

    let cols: number | undefined;
    if (meta.props.cols && meta.props.cols.type === 'NumberLit') {
      cols = meta.props.cols.value;
    } else if (meta.props.colunas && meta.props.colunas.type === 'NumberLit') {
      cols = meta.props.colunas.value;
    }

    let color: string | undefined;
    const rawColorExpr =
      meta.props.color ??
      meta.props.cor ??
      meta.props.accent ??
      meta.props.hex ??
      meta.props.theme ??
      meta.props.tema;
    if (rawColorExpr) {
      const cStr = extractTokenStr(rawColorExpr).trim();
      if (cStr) {
        color = /^[0-9a-fA-F]{3,8}$/.test(cStr) ? `#${cStr}` : cStr;
      }
    }
    if (!color) {
      const namedColors = new Set([
        'purple', 'roxo', 'violet', 'violeta',
        'red', 'vermelho', 'rose', 'rubi',
        'blue', 'azul', 'sky', 'cyan', 'ciano',
        'green', 'verde', 'emerald', 'esmeralda',
        'amber', 'ambar', 'âmbar', 'gold', 'dourado', 'yellow', 'amarelo', 'orange', 'laranja',
        'pink', 'rosa', 'dark', 'zinc', 'cinza',
      ]);
      for (const t of meta.tags) {
        const lower = t.toLowerCase();
        if (/^[0-9a-fA-F]{3}$/.test(lower) || /^[0-9a-fA-F]{6}$/.test(lower)) {
          color = `#${lower}`;
          break;
        }
        if (namedColors.has(lower)) {
          color = lower;
          break;
        }
      }
      if (!color) {
        for (const f of meta.flags) {
          const lower = f.toLowerCase();
          if (namedColors.has(lower)) {
            color = lower;
            break;
          }
        }
      }
    }

    return { title, tab, placement, display, tall, cols, color, meta };
  }

  private registerModuleLayout(
    doc: ASTSheetDocument,
    kind: CanonicalBlockKind,
    id: string,
    header: ReturnType<SheetParser['parseBlockHeader']>,
    resolvedTitle?: string,
  ): void {
    doc.moduleLayouts.push({
      id,
      kind,
      title: resolvedTitle,
      tab: header.tab,
      placement: header.placement,
      display: header.display,
      tall: header.tall,
      cols: header.cols,
      color: header.color,
      order: doc.moduleLayouts.length,
    });
  }

  /**
   * @tab "Nome da Aba"
   * Sem chaves: define o contexto de aba ativa para todos os blocos seguintes até outra @tab.
   * Com chaves (legado): aplica apenas dentro do bloco { ... }.
   */
  private parseTabBlock(doc: ASTSheetDocument): void {
    let tabName = 'Aba';
    if (this.check('STRING') || this.check('IDENTIFIER')) {
      tabName = this.advance().value;
    }
    const meta = this.parseOptionalMetaAndFlags();
    if (meta.props.label && meta.props.label.type === 'StringLit') {
      tabName = meta.props.label.value;
    } else if (meta.props.title && meta.props.title.type === 'StringLit') {
      tabName = meta.props.title.value;
    }

    if (!doc.tabs.some((t) => t.id === tabName)) {
      doc.tabs.push({ id: tabName, label: tabName });
    }

    const prevTab = this.currentTabContext;
    this.currentTabContext = tabName;

    if (this.match('LBRACE')) {
      this.skipSeparators();
      while (!this.check('RBRACE') && !this.isAtEnd()) {
        try {
          const tok = this.peek();
          if (tok.type === 'DIRECTIVE') {
            this.advance();
            const kind = tok.value as CanonicalBlockKind;
            this.parseDirectiveBlock(kind, doc);
          } else {
            this.advance();
          }
        } catch {
          this.synchronizeToNextStatement();
        }
        this.skipSeparators();
      }
      this.match('RBRACE');
      this.currentTabContext = prevTab;
    }
  }

  private parseSlotsBlock(doc: ASTSheetDocument): void {
    const startTok = this.peek();
    let id = `slots_${doc.slots.length + 1}`;
    let customTitle: string | undefined;

    if (this.check('STRING')) {
      customTitle = this.advance().value;
      id = customTitle;
    } else if (
      this.check('IDENTIFIER') &&
      (this.peekNext().type === 'STRING' || this.peekNext().type === 'LBRACKET')
    ) {
      id = this.advance().value;
      if (this.check('STRING')) {
        customTitle = this.advance().value;
      }
    }

    const header = this.parseBlockHeader();
    const title =
      customTitle ?? (header.title === '__DEFAULT__' ? 'Slots' : header.title);
    const tab = header.tab;
    if (tab && !doc.tabs.some((t) => t.id === tab)) {
      doc.tabs.push({ id: tab, label: tab });
    }
    if (title) {
      doc.blockTitles.slots = title;
    }

    let cols = 3;
    if (header.meta.props.cols && header.meta.props.cols.type === 'NumberLit') {
      cols = header.meta.props.cols.value;
    } else if (header.meta.props.colunas && header.meta.props.colunas.type === 'NumberLit') {
      cols = header.meta.props.colunas.value;
    }

    const slots: ASTSlotItemDecl[] = [];
    this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd()) {
      this.matchAny('MINUS', 'STAR');
      const slotItem = this.parseSlotItemDecl();
      if (slotItem) slots.push(slotItem);
      this.skipSeparators();
    }

    this.match('RBRACE');

    doc.slots.push({
      type: 'SlotsBlockDecl',
      id,
      title,
      tab,
      cols,
      slots,
      meta: header.meta,
      span: this.mergeSpans(startTok.span, this.previous().span),
    });

    this.registerModuleLayout(doc, 'slots', id, header, title);
  }

  private parseSlotItemDecl(): ASTSlotItemDecl | null {
    const startTok = this.peek();
    const id = this.consumeIdentifierOrString('Esperado identificador do slot.');
    if (!id) {
      this.synchronizeToNextStatement();
      return null;
    }

    let label = id;
    if (this.check('STRING')) {
      label = this.advance().value;
    }

    let shorthandState: 'empty' | 'filled' | 'damaged' | 'locked' | undefined;
    let shorthandCur: number | undefined;
    let shorthandMax: number | undefined;

    // Suporte a sintaxe direta: slot_1 "Fuzil": 5/5 ou slot_5: empty
    if (this.match('COLON') || this.match('ASSIGN_CALC') || this.match('ASSIGN_PIN')) {
      if (this.check('NUMBER')) {
        shorthandCur = Number(this.advance().value);
        shorthandState = 'filled';
        if (this.match('SLASH') && this.check('NUMBER')) {
          shorthandMax = Number(this.advance().value);
        } else {
          shorthandMax = shorthandCur;
        }
      } else if (this.check('IDENTIFIER') || this.check('STRING')) {
        const word = this.advance().value.toLowerCase();
        if (word === 'empty' || word === 'vazio') shorthandState = 'empty';
        else if (word === 'filled' || word === 'ocupado') shorthandState = 'filled';
        else if (word === 'damaged' || word === 'danificado') shorthandState = 'damaged';
        else if (word === 'locked' || word === 'bloqueado' || word === 'travado') shorthandState = 'locked';
        else {
          label = word;
          shorthandState = 'filled';
        }
      }
    }

    const meta = this.parseOptionalMetaAndFlags();

    let state: 'empty' | 'filled' | 'damaged' | 'locked' = shorthandState ?? 'empty';
    if (meta.flags.includes('damaged') || meta.flags.includes('danificado') || meta.tags.includes('damaged') || meta.tags.includes('danificado')) {
      state = 'damaged';
    } else if (meta.flags.includes('locked') || meta.flags.includes('bloqueado') || meta.flags.includes('travado') || meta.tags.includes('locked') || meta.tags.includes('bloqueado')) {
      state = 'locked';
    } else if (meta.flags.includes('empty') || meta.flags.includes('vazio') || meta.tags.includes('empty') || meta.tags.includes('vazio')) {
      state = 'empty';
    } else if (meta.flags.includes('filled') || meta.flags.includes('ocupado') || meta.tags.includes('filled') || label !== id) {
      if (!shorthandState) state = 'filled';
    }

    if (meta.props.state) {
      const sVal =
        meta.props.state.type === 'StringLit'
          ? meta.props.state.value
          : meta.props.state.type === 'Ident'
            ? meta.props.state.name
            : '';
      if (sVal === 'empty' || sVal === 'filled' || sVal === 'damaged' || sVal === 'locked') {
        state = sVal;
      }
    }

    let current: number | undefined = shorthandCur;
    if (meta.props.current && meta.props.current.type === 'NumberLit') {
      current = meta.props.current.value;
    }
    let max: number | undefined = shorthandMax;
    if (meta.props.max && meta.props.max.type === 'NumberLit') {
      max = meta.props.max.value;
    }

    let content: string | undefined;
    if (meta.props.content && meta.props.content.type === 'StringLit') {
      content = meta.props.content.value;
    } else if (label !== id) {
      content = label;
    }

    let colSpan: number | undefined;
    if (meta.props.span && meta.props.span.type === 'NumberLit') {
      colSpan = meta.props.span.value;
    } else if (meta.props.cols && meta.props.cols.type === 'NumberLit') {
      colSpan = meta.props.cols.value;
    } else if (
      meta.flags.includes('double') ||
      meta.flags.includes('largo') ||
      meta.flags.includes('2slots') ||
      meta.tags.includes('double') ||
      meta.tags.includes('2slots')
    ) {
      colSpan = 2;
    }

    const isCondition =
      meta.flags.includes('condition') ||
      meta.flags.includes('condicao') ||
      meta.flags.includes('fatigue') ||
      meta.flags.includes('fadiga') ||
      meta.tags.includes('condicao') ||
      meta.tags.includes('condition') ||
      meta.tags.includes('fatigue');

    return {
      id,
      label,
      state,
      content,
      current,
      max,
      colSpan,
      isCondition,
      meta,
      span: this.mergeSpans(startTok.span, this.previous().span),
    };
  }

  /**
   * @attr / @stat (sem chaves!)
   * FOR "Força" = 16 [mod: floor((self - 10)/2)]
   */
  private parseStatsBlock(
    targetList: ASTStatDecl[],
    blockKind: 'attr' | 'stat',
    doc: ASTSheetDocument,
  ): void {
    const header = this.parseBlockHeader();
    if (header.tab && !doc.tabs.some((t) => t.id === header.tab)) {
      doc.tabs.push({ id: header.tab, label: header.tab });
    }
    const resolvedTitle =
      header.title === '__DEFAULT__'
        ? blockKind === 'attr'
          ? 'Atributos'
          : 'Status'
        : header.title;
    if (resolvedTitle) {
      if (blockKind === 'attr') doc.blockTitles.attributes = resolvedTitle;
      else doc.blockTitles.stats = resolvedTitle;
    }

    this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd()) {
      const decl = this.parseStatDecl();
      if (decl) {
        if (header.tab) decl.tab = header.tab;
        if (resolvedTitle) decl.blockTitle = resolvedTitle;
        if (!decl.meta.props.roll && header.meta.props.roll) {
          decl.meta.props.roll = header.meta.props.roll;
        }
        targetList.push(decl);
      }
      this.skipSeparators();
    }

    this.match('RBRACE');

    this.registerModuleLayout(doc, blockKind, blockKind, header, resolvedTitle);
  }

  private parseStatDecl(): ASTStatDecl | null {
    const startTok = this.peek();
    const id = this.consumeIdentifierOrString('Esperado identificador de atributo/status.');
    if (!id) {
      this.synchronizeToNextStatement();
      return null;
    }

    let label: string | undefined;
    if (this.check('STRING')) {
      label = this.advance().value;
    }

    const mode = this.parseAssignOp();
    const expr = this.parseExpr(0);
    const meta = this.parseOptionalMetaAndFlags();
    const children: ASTStatDecl[] = [];

    // Suporte a sub-propriedades prefixadas por ponto (.bom = floor(self/2)) ou legado { ... }
    if (this.match('LBRACE')) {
      this.skipSeparators();
      while (!this.check('RBRACE') && !this.isAtEnd()) {
        const child = this.parseStatDecl();
        if (child) children.push(child);
        this.skipSeparators();
      }
      this.match('RBRACE');
    } else {
      while (true) {
        const savedPos = this.pos;
        this.skipSeparators();
        if (this.match('DOT')) {
          const child = this.parseStatDecl();
          if (child) children.push(child);
        } else {
          this.pos = savedPos;
          break;
        }
      }
    }

    return {
      type: 'StatDecl',
      id,
      label,
      mode,
      expr,
      meta,
      children,
      span: this.mergeSpans(startTok.span, this.previous().span),
    };
  }

  /**
   * @res
   * PV "Vida": 24 / 20 + VIG * 4 [color: "red"]
   * Vitalidade: track(7, [".", "/", "X"])
   * Infeccao: clock(2 / 6)
   * Destino: counter(3)
   */
  private parseResourcesBlock(targetList: ASTResourceDecl[], doc: ASTSheetDocument): void {
    const header = this.parseBlockHeader();
    if (header.tab && !doc.tabs.some((t) => t.id === header.tab)) {
      doc.tabs.push({ id: header.tab, label: header.tab });
    }
    const resolvedTitle = header.title === '__DEFAULT__' ? 'Recursos' : header.title;
    if (resolvedTitle) {
      doc.blockTitles.resources = resolvedTitle;
    }

    this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd()) {
      const res = this.parseResourceDecl();
      if (res) {
        if (header.tab) res.tab = header.tab;
        if (resolvedTitle) res.blockTitle = resolvedTitle;
        targetList.push(res);
      }
      this.skipSeparators();
    }

    this.match('RBRACE');

    this.registerModuleLayout(doc, 'res', 'res', header, resolvedTitle);
  }

  private parseResourceDecl(): ASTResourceDecl | null {
    const startTok = this.peek();
    const id = this.consumeIdentifierOrString('Esperado identificador do recurso.');
    if (!id) {
      this.synchronizeToNextStatement();
      return null;
    }

    let label: string | undefined;
    if (this.check('STRING')) {
      label = this.advance().value;
    }

    // Aceita ':', '=', ':='
    this.matchAny('COLON', 'ASSIGN_CALC', 'ASSIGN_PIN');

    let kind: ResourceKind = 'bar';
    let currentExpr: ASTExpr = { type: 'NumberLit', value: 0, span: startTok.span };
    let maxExpr: ASTExpr | undefined;
    let states: string[] | undefined;

    if (this.check('IDENTIFIER') && RESOURCE_KINDS.has(this.peek().value.toLowerCase() as ResourceKind)) {
      kind = this.advance().value.toLowerCase() as ResourceKind;
      this.consume('LPAREN', `Esperado '(' após construtor de recurso '${kind}'.`);

      if (kind === 'bar' || kind === 'clock' || kind === 'slots') {
        // Suporta bar(24 / 20 + VIG * 4) ou bar(24, 20 + VIG * 4) ou bar(20 + VIG * 4)
        const firstExpr = this.parseResourceBoundExpr();
        if (this.match('SLASH') || this.match('COMMA')) {
          currentExpr = firstExpr;
          maxExpr = this.parseExpr(0);
        } else {
          currentExpr = firstExpr;
          maxExpr = firstExpr;
        }
      } else if (kind === 'track') {
        // track(7, [".", "/", "X"]) ou track(VIG + 3, states: [".", "/", "X"])
        maxExpr = this.parseExpr(0);
        currentExpr = { type: 'NumberLit', value: 0, span: startTok.span };
        while (this.match('COMMA')) {
          if (this.check('IDENTIFIER') && this.peekNext().type === 'COLON') {
            const propName = this.advance().value.toLowerCase();
            this.advance(); // ':'
            if (propName === 'states' || propName === 'estados') {
              states = this.parseStringArray();
            } else if (propName === 'filled' || propName === 'current' || propName === 'atual') {
              currentExpr = this.parseExpr(0);
            } else {
              this.parseExpr(0);
            }
          } else if (this.check('LBRACKET')) {
            states = this.parseStringArray();
          } else {
            currentExpr = this.parseExpr(0);
          }
        }
      } else {
        // counter(3) ou pool(3d8)
        currentExpr = this.parseExpr(0);
        if (this.match('COMMA') || this.match('SLASH')) {
          maxExpr = this.parseExpr(0);
        }
      }

      this.consume('RPAREN', `Esperado ')' para fechar '${kind}(...)'.`);
    } else {
      // Sintaxe curta: PV = 24 / 30 ou PV = 30
      const first = this.parseResourceBoundExpr();
      if (this.match('SLASH')) {
        currentExpr = first;
        maxExpr = this.parseExpr(0);
      } else {
        currentExpr = first;
        maxExpr = first;
      }
    }

    const meta = this.parseOptionalMetaAndFlags();

    return {
      type: 'ResourceDecl',
      id,
      label,
      kind,
      currentExpr,
      maxExpr,
      states,
      meta,
      span: this.mergeSpans(startTok.span, this.previous().span),
    };
  }

  /**
   * Em recursos como `bar(24 / 20 + VIG)`, a primeira barra `/` separa `atual / maximo`.
   * Por isso lemos o lado esquerdo sem que `/` seja engolido como divisão se for o separador principal,
   * exceto se estiver entre parênteses `bar((CON+TAM)/10 / (CON+TAM)/10)`.
   */
  private parseResourceBoundExpr(): ASTExpr {
    return this.parseExpr(45); // Acima de SLASH (40) no nível raiz do primeiro argumento
  }

  /**
   * @turn [reset: "round"]
   *   padrao "Ação Padrão": 1/1
   *   movimento "Movimento": 1/1
   *   convert "Completa" -> 1 padrao, 1 movimento
   */
  private parseTurnBlock(doc: ASTSheetDocument): void {
    const header = this.parseBlockHeader();
    if (header.tab && !doc.tabs.some((t) => t.id === header.tab)) {
      doc.tabs.push({ id: header.tab, label: header.tab });
    }
    const resolvedTitle = header.title === '__DEFAULT__' ? 'Turno' : header.title;
    if (resolvedTitle) {
      doc.blockTitles.turn = resolvedTitle;
    }
    const resetProp = header.meta.props.reset;
    if (resetProp && (resetProp.type === 'StringLit' || resetProp.type === 'Ident')) {
      doc.turn.reset = resetProp.type === 'StringLit' ? resetProp.value : resetProp.name;
    }

    const hasBrace = this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd() && !(hasBrace && this.check('RBRACE'))) {
      const word = this.peek().value.toLowerCase();
      if (this.check('IDENTIFIER') && (word === 'convert' || word === 'conversion' || word === 'conversao')) {
        const startSpan = this.advance().span;
        const name = this.consumeIdentifierOrString('Esperado nome da conversão de turno.') || 'Completa';
        this.matchAny('ARROW', 'COLON', 'ASSIGN_CALC');

        // Suporta consumes(1 padrao, 1 movimento) ou direto 1 padrao, 1 movimento
        if (this.check('IDENTIFIER') && this.peek().value.toLowerCase() === 'consumes') {
          this.advance();
        }
        const hasParen = this.match('LPAREN');
        const consumes: Array<{ count: number; slotId: string }> = [];

        while (!this.isAtEnd() && !this.check('NEWLINE') && !this.check('PIPE') && !this.check('RBRACE') && !this.check('RPAREN')) {
          let count = 1;
          if (this.check('NUMBER')) {
            count = Number(this.advance().value);
          }
          const slotId = this.consumeIdentifierOrString('Esperado tipo de ação consumida.');
          if (slotId) {
            consumes.push({ count, slotId });
          }
          if (!this.match('COMMA') && !this.match('PLUS')) break;
        }
        if (hasParen) this.match('RPAREN');

        const conv: ASTTurnConversion = {
          name,
          consumes,
          span: this.mergeSpans(startSpan, this.previous().span),
        };
        doc.turn.conversions.push(conv);
      } else {
        const res = this.parseResourceDecl();
        if (res) {
          const slot: ASTTurnSlotDecl = {
            id: res.id,
            label: res.label,
            kind: res.kind,
            currentExpr: res.currentExpr,
            maxExpr: res.maxExpr,
            meta: res.meta,
            span: res.span,
          };
          doc.turn.slots.push(slot);
        }
      }
      this.skipSeparators();
    }

    if (hasBrace) this.match('RBRACE');

    this.registerModuleLayout(doc, 'turn', 'turn', header, resolvedTitle);
  }

  /**
   * @desc
   *   aspect "Conceito": "Detetive Ocultista" [!active] -> roll_bonus += 2
   *   tag "Olhos do Véu" [!active] -> roll_bonus += 1
   *   resistance Corte = 10
   *   consequence "Costela Trincada" = -2 [!active]
   */
  private parseDescriptorsBlock(targetList: ASTDescriptorDecl[], doc: ASTSheetDocument): void {
    const header = this.parseBlockHeader();
    if (header.tab && !doc.tabs.some((t) => t.id === header.tab)) {
      doc.tabs.push({ id: header.tab, label: header.tab });
    }
    const resolvedTitle = header.title === '__DEFAULT__' ? 'Descritores' : header.title;
    if (resolvedTitle) {
      doc.blockTitles.descriptors = resolvedTitle;
    }

    const hasBrace = this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd() && !(hasBrace && this.check('RBRACE'))) {
      const startTok = this.peek();
      const firstWord = startTok.value.toLowerCase();

      // Suporte para listas agrupadas: resistances: [Corte: 10, Fogo: 5]
      if (
        this.check('IDENTIFIER') &&
        (firstWord === 'resistances' ||
          firstWord === 'resistencias' ||
          firstWord === 'immunities' ||
          firstWord === 'imunidades' ||
          firstWord === 'vulnerabilities' ||
          firstWord === 'vulnerabilidades' ||
          firstWord === 'senses' ||
          firstWord === 'sentidos') &&
        (this.peekNext().type === 'COLON' || this.peekNext().type === 'ASSIGN_CALC')
      ) {
        this.advance(); // keyword
        this.advance(); // ':'
        const groupKind: DescriptorKind =
          firstWord.startsWith('resist')
            ? 'resistance'
            : firstWord.startsWith('immun') || firstWord.startsWith('imun')
              ? 'immunity'
              : firstWord.startsWith('vuln')
                ? 'vulnerability'
                : 'sense';

        if (this.match('LBRACKET')) {
          while (!this.check('RBRACKET') && !this.isAtEnd()) {
            const itemStart = this.peek().span;
            let itemId = '';
            if (this.check('TAG') || this.check('IDENTIFIER') || this.check('STRING')) {
              itemId = this.advance().value;
            }
            let valExpr: ASTExpr | undefined;
            if (this.match('COLON') || this.match('ASSIGN_CALC') || this.match('ASSIGN_PIN')) {
              valExpr = this.parseExpr(0);
            }
            if (itemId) {
              targetList.push({
                type: 'DescriptorDecl',
                kind: groupKind,
                id: itemId,
                label: itemId,
                valueExpr: valExpr,
                meta: this.emptyMeta(),
                effects: [],
                tab: header.tab,
                blockTitle: resolvedTitle,
                span: this.mergeSpans(itemStart, this.previous().span),
              });
            }
            if (!this.match('COMMA')) break;
          }
          this.consume('RBRACKET', "Esperado ']' na lista de descritores.");
        }
        this.skipSeparators();
        continue;
      }

      // Declaração individual: aspect / tag / consequence / resistance <id> ...
      let kind: DescriptorKind = 'tag';
      if (this.check('IDENTIFIER') && DESCRIPTOR_KINDS[firstWord]) {
        kind = DESCRIPTOR_KINDS[firstWord];
        this.advance();
      }

      const id = this.consumeIdentifierOrString('Esperado identificador ou nome do descritor.');
      if (!id) {
        this.synchronizeToNextStatement();
        continue;
      }

      let label: string | undefined;
      if (this.check('STRING')) {
        label = this.advance().value;
      }

      let valueExpr: ASTExpr | undefined;
      if (this.match('COLON') || this.match('ASSIGN_CALC') || this.match('ASSIGN_PIN')) {
        if (!this.check('LBRACKET') && !this.check('LBRACE')) {
          valueExpr = this.parseExpr(0);
        }
      }

      const meta = this.parseOptionalMetaAndFlags();
      const effects: ASTEffectStmt[] = [];

      if (this.match('ARROW')) {
        this.parseEffectsBlockInto(effects);
      } else if (this.match('LBRACE')) {
        this.skipSeparators();
        while (!this.check('RBRACE') && !this.isAtEnd()) {
          if (this.check('IDENTIFIER') && (this.peek().value === 'invoke' || this.peek().value === 'compel')) {
            this.advance();
            if (this.check('LBRACKET')) this.parseMetadataBracket();
            this.match('ARROW');
            this.parseEffectsBlockInto(effects);
          } else {
            const eff = this.parseEffectStmt();
            if (eff) effects.push(eff);
          }
          this.skipSeparators();
        }
        this.consume('RBRACE', "Esperado '}' ao fechar descritor.");
      }

      targetList.push({
        type: 'DescriptorDecl',
        kind,
        id,
        label: label ?? (valueExpr?.type === 'StringLit' ? valueExpr.value : id),
        valueExpr,
        meta,
        effects,
        tab: header.tab,
        blockTitle: resolvedTitle,
        span: this.mergeSpans(startTok.span, this.previous().span),
      });

      this.skipSeparators();
    }

    if (hasBrace) this.match('RBRACE');

    this.registerModuleLayout(doc, 'desc', 'desc', header, resolvedTitle);
  }

  /**
   * @skill [roll: (attr)d20kh1 + self]
   *   Luta (FOR) = 10 + 2
   *   Ocultismo (INT): expert
   */
  private parseSkillsBlock(doc: ASTSheetDocument): void {
    const header = this.parseBlockHeader();
    if (header.tab && !doc.tabs.some((t) => t.id === header.tab)) {
      doc.tabs.push({ id: header.tab, label: header.tab });
    }
    const resolvedTitle = header.title === '__DEFAULT__' ? 'Perícias' : header.title;
    if (resolvedTitle) {
      doc.blockTitles.skills = resolvedTitle;
    }
    if (header.meta.props.roll) {
      doc.defaultSkillRoll = header.meta.props.roll;
    } else if (header.meta.props.rolagem) {
      doc.defaultSkillRoll = header.meta.props.rolagem;
    }

    const hasBrace = this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd() && !(hasBrace && this.check('RBRACE'))) {
      const skill = this.parseSkillDecl();
      if (skill) {
        if (header.tab) skill.tab = header.tab;
        if (resolvedTitle) skill.blockTitle = resolvedTitle;
        if (!skill.rollOverride && doc.defaultSkillRoll) {
          skill.rollOverride = doc.defaultSkillRoll;
        }
        doc.skills.push(skill);
      }
      this.skipSeparators();
    }

    if (hasBrace) this.match('RBRACE');

    this.registerModuleLayout(doc, 'skill', 'skill', header, resolvedTitle);
  }

  private parseSkillDecl(): ASTSkillDecl | null {
    const startTok = this.peek();
    const id = this.consumeIdentifierOrString('Esperado identificador da perícia.');
    if (!id) {
      this.synchronizeToNextStatement();
      return null;
    }

    let label: string | undefined;
    if (this.check('STRING')) {
      label = this.advance().value;
    }

    let baseAttr: string | undefined;
    if (this.match('LPAREN')) {
      if (this.check('IDENTIFIER')) {
        baseAttr = this.advance().value;
      }
      this.consume('RPAREN', "Esperado ')' após atributo-base da perícia.");
    }

    const mode = this.parseAssignOp();
    const expr = this.parseExpr(0);
    const meta = this.parseOptionalMetaAndFlags();

    let rollOverride: ASTExpr | undefined = meta.props.roll ?? meta.props.rolagem;
    if (this.match('ARROW')) {
      if (this.check('IDENTIFIER') && this.peek().value === 'roll') {
        this.advance();
        this.consume('LPAREN', "Esperado '(' após roll.");
        rollOverride = this.parseExpr(0);
        this.consume('RPAREN', "Esperado ')' após expressão de rolagem.");
      } else {
        rollOverride = this.parseExpr(0);
      }
    }

    const children: ASTStatDecl[] = [];
    if (this.match('LBRACE')) {
      this.skipSeparators();
      while (!this.check('RBRACE') && !this.isAtEnd()) {
        const child = this.parseStatDecl();
        if (child) children.push(child);
        this.skipSeparators();
      }
      this.consume('RBRACE', "Esperado '}' após sub-propriedades da perícia.");
    } else {
      // Sub-propriedades sem chaves começando com ponto: .bom = floor(self / 2)
      while (!this.isAtEnd()) {
        let savedPos = this.pos;
        this.skipSeparators();
        if (this.check('DOT')) {
          this.advance();
          const child = this.parseStatDecl();
          if (child) children.push(child);
        } else {
          this.pos = savedPos;
          break;
        }
      }
    }

    return {
      type: 'SkillDecl',
      id,
      label,
      baseAttr,
      mode,
      expr,
      rollOverride,
      meta,
      children,
      span: this.mergeSpans(startTok.span, this.previous().span),
    };
  }

  /**
   * @inv
   *   max_load = FOR * 5
   *   item "Proteção Leve" [weight: 2, qty: 1, !equipped]
   *     DEF += 5
   *   rule load() > max_load -> DEF -= 5
   */
  private parseInventoryBlock(doc: ASTSheetDocument): void {
    const header = this.parseBlockHeader();
    if (header.tab && !doc.tabs.some((t) => t.id === header.tab)) {
      doc.tabs.push({ id: header.tab, label: header.tab });
    }
    const resolvedTitle = header.title === '__DEFAULT__' ? 'Inventário' : header.title;
    if (resolvedTitle) {
      doc.blockTitles.inventory = resolvedTitle;
      doc.inventory.title = resolvedTitle;
    }
    if (header.tab) {
      doc.inventory.tab = header.tab;
    }

    const hasBrace = this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd() && !(hasBrace && this.check('RBRACE'))) {
      this.matchAny('MINUS', 'STAR');
      const word = this.peek().value.toLowerCase();

      if (this.check('IDENTIFIER') && word === 'items') {
        this.advance();
        const hasItemsBrace = this.match('LBRACE');
        this.skipSeparators();
        while (!this.isAtBlockEnd() && !(hasItemsBrace && this.check('RBRACE'))) {
          this.matchAny('MINUS', 'STAR');
          if (this.isAtRuleStart() || this.isAtInventoryConfigKey()) break;
          const item = this.parseItemDecl();
          if (item) doc.inventory.items.push(item);
          this.skipSeparators();
        }
        if (hasItemsBrace) this.match('RBRACE');
      } else if (this.check('IDENTIFIER') && word === 'item') {
        const item = this.parseItemDecl();
        if (item) doc.inventory.items.push(item);
      } else if (this.isAtRuleStart()) {
        const rule = this.parseRuleDecl();
        if (rule) doc.inventory.rules.push(rule);
      } else if (this.check('IDENTIFIER')) {
        const key = this.advance().value;
        if (this.match('COLON') || this.match('ASSIGN_CALC') || this.match('ASSIGN_PIN')) {
          doc.inventory.config[key] = this.parseExpr(0);
        } else {
          this.synchronizeToNextStatement();
        }
      } else {
        this.synchronizeToNextStatement();
      }

      this.skipSeparators();
    }

    if (hasBrace) this.match('RBRACE');

    this.registerModuleLayout(doc, 'inv', 'inv', header, resolvedTitle);
  }

  private parseItemDecl(): ASTItemDecl | null {
    const startTok = this.peek();
    if (this.check('IDENTIFIER') && this.peek().value.toLowerCase() === 'item') {
      this.advance();
    }

    const id = this.consumeIdentifierOrString('Esperado nome ou identificador do item.');
    if (!id) {
      this.synchronizeToNextStatement();
      return null;
    }

    let label = id;
    if (this.check('STRING')) {
      label = this.advance().value;
    }

    const meta = this.parseOptionalMetaAndFlags();
    const props: Record<string, ASTExpr> = {};
    const effects: ASTEffectStmt[] = [];
    const actions: ASTAbilityDecl[] = [];

    if (this.match('ARROW')) {
      this.parseEffectsBlockInto(effects);
    }

    const hasBrace = this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtEnd()) {
      if (hasBrace) {
        if (this.check('RBRACE')) break;
      } else {
        if (this.isAtItemBoundary()) break;
      }

      const word = this.peek().value.toLowerCase();

      if (this.check('IDENTIFIER') && (word === 'effect' || word === 'efeito')) {
        this.advance();
        this.match('COLON');
        this.parseEffectsBlockInto(effects);
      } else if (this.check('IDENTIFIER') && ABILITY_CATEGORIES[word]) {
        const act = this.parseAbilityDecl(true);
        if (act) actions.push(act);
      } else if (this.isEffectStatementStart()) {
        const eff = this.parseEffectStmt();
        if (eff) effects.push(eff);
      } else if (this.check('IDENTIFIER')) {
        const propKey = this.advance().value;
        if (this.match('COLON') || this.match('ASSIGN_CALC')) {
          props[propKey] = this.parseExpr(0);
        } else {
          this.synchronizeToNextStatement();
        }
      } else {
        this.synchronizeToNextStatement();
      }
      this.skipSeparators();
    }

    if (hasBrace) this.match('RBRACE');

    return {
      type: 'ItemDecl',
      id,
      label,
      meta,
      props,
      effects,
      actions,
      span: this.mergeSpans(startTok.span, this.previous().span),
    };
  }

  /**
   * @ability
   *   ability "Casca Grossa" [#defesa] -> DEF += VIG | PV.max += VIG * 2
   *   action "Espada" [type: "Padrão", cost: 1 PE]
   *     test: (FOR)d20kh1 + Luta
   *     damage: 1d8 + FOR
   *   spell "Decadência" [circle: 1, cost: 1 PE]
   *     damage: 2d8 + 2
   *     enhance "Discente" [cost: 2] -> damage: 3d8 + 2
   */
  private parseAbilitiesBlock(targetList: ASTAbilityDecl[], doc: ASTSheetDocument): void {
    const header = this.parseBlockHeader();
    if (header.tab && !doc.tabs.some((t) => t.id === header.tab)) {
      doc.tabs.push({ id: header.tab, label: header.tab });
    }
    const resolvedTitle = header.title === '__DEFAULT__' ? 'Habilidades' : header.title;
    if (resolvedTitle) {
      doc.blockTitles.abilities = resolvedTitle;
    }

    const hasBrace = this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd() && !(hasBrace && this.check('RBRACE'))) {
      const ab = this.parseAbilityDecl(false);
      if (ab) {
        if (header.tab) ab.tab = header.tab;
        if (resolvedTitle) ab.blockTitle = resolvedTitle;
        targetList.push(ab);
      }
      this.skipSeparators();
    }

    if (hasBrace) this.match('RBRACE');

    this.registerModuleLayout(doc, 'ability', 'ability', header, resolvedTitle);
  }

  private parseAbilityDecl(insideItem = false): ASTAbilityDecl | null {
    const startTok = this.peek();
    let category: AbilityCategory = 'ability';

    if (this.check('IDENTIFIER') && ABILITY_CATEGORIES[this.peek().value.toLowerCase()]) {
      category = ABILITY_CATEGORIES[this.advance().value.toLowerCase()];
    }

    const id = this.consumeIdentifierOrString('Esperado nome da habilidade/ação.');
    if (!id) {
      this.synchronizeToNextStatement();
      return null;
    }

    let label = id;
    if (this.check('STRING')) {
      label = this.advance().value;
    }

    const meta = this.parseOptionalMetaAndFlags();
    const props: Record<string, ASTExpr> = {};
    const passiveEffects: ASTEffectStmt[] = [];
    const activeEffects: ASTEffectStmt[] = [];
    const bands: ASTOutcomeBand[] = [];
    const choices: string[] = [];
    const enhancements: ASTEnhancementDecl[] = [];

    if (this.match('ARROW')) {
      const targetEffects = meta.flags.includes('active') ? activeEffects : passiveEffects;
      this.parseEffectsBlockInto(targetEffects);
    }

    const hasBrace = this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtEnd()) {
      if (hasBrace) {
        if (this.check('RBRACE')) break;
      } else {
        if (this.isAtBlockEnd()) break;
        if (insideItem && this.isAtItemBoundary()) break;
        if (this.isAtAbilityHeader(insideItem)) break;
      }

      const word = this.peek().value.toLowerCase();

      if (this.check('IDENTIFIER') && (word === 'effect' || word === 'efeito')) {
        this.advance();
        this.match('COLON');
        this.parseEffectsBlockInto(passiveEffects);
      } else if (this.check('IDENTIFIER') && (word === 'when' || word === 'active' || word === 'ativo')) {
        this.advance();
        if (this.check('IDENTIFIER') && (this.peek().value.toLowerCase() === 'active' || this.peek().value.toLowerCase() === 'ativo')) {
          this.advance();
        }
        this.matchAny('ARROW', 'COLON');
        this.parseEffectsBlockInto(activeEffects);
      } else if (this.check('IDENTIFIER') && (word === 'enhance' || word === 'aprimoramento' || word === 'upcast')) {
        const enh = this.parseEnhancementDecl(insideItem);
        if (enh) enhancements.push(enh);
      } else if (this.check('IDENTIFIER') && (word === 'choices' || word === 'escolhas')) {
        this.advance();
        if (this.check('STRING')) this.advance();
        if (this.check('LBRACKET')) this.parseMetadataBracket();
        this.match('COLON');
        const hasChoicesBrace = this.match('LBRACE');
        this.skipSeparators();
        while (!this.isAtEnd()) {
          if (hasChoicesBrace) {
            if (this.check('RBRACE')) break;
          } else {
            if (!this.check('MINUS') && !this.check('STAR')) break;
          }
          this.matchAny('MINUS', 'STAR');
          if (this.check('STRING') || this.check('IDENTIFIER')) {
            choices.push(this.advance().value);
          } else {
            this.advance();
          }
          this.skipSeparators();
        }
        if (hasChoicesBrace) this.match('RBRACE');
      } else if (this.check('MINUS') || this.check('STAR')) {
        // Lista de escolhas direta (ex: - "Escolha 1")
        this.advance();
        if (this.check('STRING') || this.check('IDENTIFIER')) {
          choices.push(this.advance().value);
        }
      } else if (this.check('IDENTIFIER') && word === 'on') {
        this.advance();
        const matcher = this.parseMatcherExpr();
        this.matchAny('ARROW', 'COLON');
        const bandEffects: ASTEffectStmt[] = [];
        this.parseEffectsBlockInto(bandEffects);
        bands.push({
          matcher,
          label: '',
          meta: this.emptyMeta(),
          effects: bandEffects,
          span: matcher.span,
        });
      } else if (this.isEffectStatementStart()) {
        // Efeito direto sem precisar de bloco effect { ... }
        const eff = this.parseEffectStmt();
        if (eff) {
          if (meta.flags.includes('active')) {
            activeEffects.push(eff);
          } else {
            passiveEffects.push(eff);
          }
        }
      } else if (this.check('IDENTIFIER')) {
        const key = this.advance().value.toLowerCase();
        if (this.match('COLON') || this.match('ASSIGN_CALC') || this.match('ASSIGN_PIN')) {
          props[key] = this.parseExpr(0);
          if (this.check('LBRACKET')) {
            const inlineMeta = this.parseMetadataBracket();
            this.mergeMeta(meta, inlineMeta);
          }
        } else {
          this.synchronizeToNextStatement();
        }
      } else {
        this.synchronizeToNextStatement();
      }
      this.skipSeparators();
    }

    if (hasBrace) this.match('RBRACE');

    return {
      type: 'AbilityDecl',
      category,
      id,
      label,
      meta,
      props,
      passiveEffects,
      activeEffects,
      bands,
      choices,
      enhancements,
      span: this.mergeSpans(startTok.span, this.previous().span),
    };
  }

  private parseEnhancementDecl(insideItem = false): ASTEnhancementDecl | null {
    const startSpan = this.advance().span; // Consome 'enhance'
    const id = this.consumeIdentifierOrString('Esperado nome do aprimoramento.');
    if (!id) return null;

    const meta = this.parseOptionalMetaAndFlags();
    const props: Record<string, ASTExpr> = {};
    const effects: ASTEffectStmt[] = [];

    this.match('ARROW');
    const hasBrace = this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtEnd()) {
      if (hasBrace) {
        if (this.check('RBRACE')) break;
      } else {
        if (this.isAtBlockEnd()) break;
        if (insideItem && this.isAtItemBoundary()) break;
        if (this.isAtAbilityHeader(insideItem)) break;
        const w = this.peek().value.toLowerCase();
        if (this.check('IDENTIFIER') && (w === 'enhance' || w === 'aprimoramento' || w === 'upcast' || w === 'choices' || w === 'escolhas')) {
          break;
        }
      }

      if (this.isEffectStatementStart()) {
        const eff = this.parseEffectStmt();
        if (eff) effects.push(eff);
      } else if (this.check('IDENTIFIER')) {
        const key = this.advance().value.toLowerCase();
        if (this.match('COLON') || this.match('ASSIGN_CALC')) {
          props[key] = this.parseExpr(0);
          if (this.check('LBRACKET')) {
            this.mergeMeta(meta, this.parseMetadataBracket());
          }
        } else {
          this.synchronizeToNextStatement();
        }
      } else {
        this.synchronizeToNextStatement();
      }
      this.skipSeparators();
    }

    if (hasBrace) this.match('RBRACE');

    return {
      id,
      label: id,
      meta,
      props,
      effects,
      span: this.mergeSpans(startSpan, this.previous().span),
    };
  }

  /**
   * @diagram "Anatomia" [layout: "humanoid", hit_roll: 1d10]
   *   node "Cabeca" "Cabeça" [hit: 1, mult: 2]
   *     PV: 8/8
   *     Armadura = 11
   */
  private parseDiagramDirective(doc: ASTSheetDocument): ASTDiagramDecl | null {
    const startSpan = this.peek().span;
    const id = this.consumeIdentifierOrString('Esperado nome do @diagram.') || 'Diagrama';
    const header = this.parseBlockHeader();
    if (header.tab && !doc.tabs.some((t) => t.id === header.tab)) {
      doc.tabs.push({ id: header.tab, label: header.tab });
    }
    const resolvedTitle = header.title === '__DEFAULT__' ? id : header.title;
    const meta = header.meta;
    const nodes: ASTDiagramNodeDecl[] = [];

    const hasBrace = this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd() && !(hasBrace && this.check('RBRACE'))) {
      const node = this.parseDiagramNode();
      if (node) nodes.push(node);
      this.skipSeparators();
    }

    if (hasBrace) this.match('RBRACE');

    this.registerModuleLayout(doc, 'diagram', id, header, resolvedTitle);

    return {
      type: 'DiagramDecl',
      id,
      meta,
      nodes,
      span: this.mergeSpans(startSpan, this.previous().span),
    };
  }

  private parseDiagramNode(): ASTDiagramNodeDecl | null {
    const startTok = this.peek();
    if (this.check('IDENTIFIER') && (this.peek().value.toLowerCase() === 'node' || this.peek().value.toLowerCase() === 'parte')) {
      this.advance();
    }

    const id = this.consumeIdentifierOrString('Esperado identificador do nó do diagrama.');
    if (!id) {
      this.synchronizeToNextStatement();
      return null;
    }

    let label = id;
    if (this.check('STRING')) {
      label = this.advance().value;
    }

    const meta = this.parseOptionalMetaAndFlags();
    const resources: ASTResourceDecl[] = [];
    const stats: ASTStatDecl[] = [];
    const rules: ASTRuleDecl[] = [];

    const hasBrace = this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtEnd()) {
      if (hasBrace) {
        if (this.check('RBRACE')) break;
      } else {
        if (this.isAtBlockEnd()) break;
        const w = this.peek().value.toLowerCase();
        if (this.check('IDENTIFIER') && (w === 'node' || w === 'parte')) break;
      }

      if (this.isAtRuleStart()) {
        const r = this.parseRuleDecl();
        if (r) rules.push(r);
      } else if (this.check('IDENTIFIER') && this.peekNext().type === 'COLON') {
        const res = this.parseResourceDecl();
        if (res) resources.push(res);
      } else {
        const st = this.parseStatDecl();
        if (st) stats.push(st);
      }
      this.skipSeparators();
    }

    if (hasBrace) this.match('RBRACE');

    return {
      id,
      label,
      meta,
      resources,
      stats,
      rules,
      span: this.mergeSpans(startTok.span, this.previous().span),
    };
  }

  /**
   * @rule
   *   when load() > max_load -> DEF -= 5
   *   ? PV.current <= 0 -> DEF :! 0
   */
  private parseRulesBlock(targetList: ASTRuleDecl[], doc: ASTSheetDocument): void {
    const header = this.parseBlockHeader();
    const resolvedTitle = header.title === '__DEFAULT__' ? 'Regras' : header.title;
    if (resolvedTitle) {
      doc.blockTitles.rules = resolvedTitle;
    }

    const hasBrace = this.match('LBRACE');
    this.skipSeparators();

    while (!this.isAtBlockEnd() && !(hasBrace && this.check('RBRACE'))) {
      const rule = this.parseRuleDecl();
      if (rule) targetList.push(rule);
      this.skipSeparators();
    }

    if (hasBrace) this.match('RBRACE');

    this.registerModuleLayout(doc, 'rule', 'rule', header, resolvedTitle);
  }

  private parseRuleDecl(): ASTRuleDecl | null {
    const startTok = this.peek();
    if (this.check('IDENTIFIER')) {
      const w = this.peek().value.toLowerCase();
      if (w === 'when' || w === 'rule' || w === 'regra' || w === 'se') {
        this.advance();
      }
    } else if (this.check('QUESTION')) {
      this.advance();
    }

    const condition = this.parseExpr(0);
    this.matchAny('ARROW', 'COLON');
    const effects: ASTEffectStmt[] = [];
    this.parseEffectsBlockInto(effects);

    return {
      type: 'RuleDecl',
      condition,
      effects,
      span: this.mergeSpans(startTok.span, this.previous().span),
    };
  }

  private parseEffectsBlockInto(target: ASTEffectStmt[]): void {
    if (this.match('LBRACE')) {
      this.skipSeparators();
      while (!this.check('RBRACE') && !this.isAtEnd()) {
        const eff = this.parseEffectStmt();
        if (eff) target.push(eff);
        this.skipSeparators();
      }
      this.consume('RBRACE', "Esperado '}' ao fechar bloco de efeitos.");
    } else {
      const firstEff = this.parseEffectStmt();
      if (firstEff) target.push(firstEff);
      while (this.match('SEMICOLON') || this.match('PIPE')) {
        if (this.isAtEnd() || this.check('NEWLINE') || this.check('DIRECTIVE')) break;
        const nextEff = this.parseEffectStmt();
        if (nextEff) target.push(nextEff);
      }
    }
  }

  private parseEffectStmt(): ASTEffectStmt | null {
    const startTok = this.peek();
    const first = this.consumeIdentifierOrString('Esperado alvo do efeito.');
    if (!first) {
      this.synchronizeToNextStatement();
      return null;
    }

    let target = first;
    while (this.match('DOT')) {
      const sub = this.consumeIdentifierOrString('Esperado sub-propriedade no alvo do efeito.');
      if (sub) target += `.${sub}`;
    }

    const op = this.parseAssignOp();
    const expr = this.parseExpr(0);

    return {
      target,
      op,
      expr,
      span: this.mergeSpans(startTok.span, this.previous().span),
    };
  }

  // ==========================================================================
  // 2. PRATT PARSER (EXPRESSÕES ARITMÉTICAS, LÓGICAS E DE DADOS)
  // ==========================================================================

  /**
   * Analisa expressões respeitando o Poder de Ligação (Binding Power - minBp).
   */
  public parseExpr(minBp = 0): ASTExpr {
    let left = this.parsePrefix();

    while (!this.isAtEnd()) {
      const tok = this.peek();

      // 1. Operador Pós-fixo / Infixo de Dados: <countExpr> d<Faces> [modifiers...]
      // Ex: 2d20kh1, (AGI)d20kh1, (FOR + Briga)d10
      if (tok.type === 'STEP_DIE' && 60 >= minBp) {
        const dieTok = this.advance();
        left = this.parseDiceSuffix(left, dieTok);
        continue;
      }

      // 2. Acesso a Membro: FOR.mod, PV.max (BP 70)
      if (tok.type === 'DOT' && 70 >= minBp) {
        this.advance();
        const propTok = this.peek();
        const propName = this.consumeIdentifierOrString('Esperado nome da propriedade após ".".') || '';
        if (left.type === 'Ident') {
          left = {
            type: 'MemberExpr',
            object: left.name,
            property: propName,
            span: this.mergeSpans(left.span, propTok.span),
          };
        }
        continue;
      }

      // 3. Operadores Binários Infixos
      const infixBp = this.getInfixBindingPower(tok.type);
      if (infixBp !== null) {
        const [leftBp, rightBp] = infixBp;
        if (leftBp < minBp) break;

        this.advance(); // Consome operador

        if (tok.type === 'RANGE') {
          const right = this.parseExpr(rightBp);
          left = {
            type: 'RangeExpr',
            min: left,
            max: right,
            span: this.mergeSpans(left.span, right.span),
          };
          continue;
        }

        if (tok.type === 'QUESTION') {
          const consequent = this.parseExpr(0);
          this.consume('COLON', "Esperado ':' no operador ternário '? :'.");
          const alternate = this.parseExpr(rightBp);
          left = {
            type: 'TernaryExpr',
            condition: left,
            consequent,
            alternate,
            span: this.mergeSpans(left.span, alternate.span),
          };
          continue;
        }

        const right = this.parseExpr(rightBp);
        left = {
          type: 'BinaryExpr',
          op: tok.value as Extract<ASTExpr, { type: 'BinaryExpr' }>['op'],
          left,
          right,
          span: this.mergeSpans(left.span, right.span),
        };
        continue;
      }

      break;
    }

    return left;
  }

  private parsePrefix(): ASTExpr {
    const tok = this.peek();

    // 1. Literal Numérico
    if (tok.type === 'NUMBER') {
      this.advance();
      return {
        type: 'NumberLit',
        value: Number(tok.value),
        span: tok.span,
      };
    }

    // 2. Literal de String
    if (tok.type === 'STRING') {
      this.advance();
      return {
        type: 'StringLit',
        value: tok.value,
        span: tok.span,
      };
    }

    // 3. Tag como valor (#sobrecarregado, #fogo)
    if (tok.type === 'TAG') {
      this.advance();
      return {
        type: 'StringLit',
        value: `#${tok.value}`,
        span: tok.span,
      };
    }

    // 4. Dado Prefixado Isolado (ex: d8, d6!, d20kh1)
    if (tok.type === 'STEP_DIE') {
      this.advance();
      const facesVal: StepDieFaces = tok.value === 'F' ? 'F' : (Number(tok.value) as StepDieFaces);

      // Verifica se possui modificadores de rolagem imediata (!, !!, !p, kh1, #hope)
      if (this.hasImmediateDiceModifier()) {
        const oneLit: ASTExpr = { type: 'NumberLit', value: 1, span: tok.span };
        return this.parseDiceSuffix(oneLit, tok);
      }

      return {
        type: 'StepDieLit',
        faces: facesVal,
        span: tok.span,
      };
    }

    // 5. Operadores Unários (+, -, !)
    if (tok.type === 'MINUS' || tok.type === 'PLUS' || tok.type === 'BANG') {
      this.advance();
      const operand = this.parseExpr(55);
      return {
        type: 'UnaryExpr',
        op: tok.value as '+' | '-' | '!',
        operand,
        span: this.mergeSpans(tok.span, operand.span),
      };
    }

    // 6. Agrupamento entre Parênteses (expr)
    if (tok.type === 'LPAREN') {
      this.advance();
      const inner = this.parseExpr(0);
      const close = this.consume('RPAREN', "Esperado ')' após expressão.");
      return {
        ...inner,
        span: this.mergeSpans(tok.span, close.span),
      };
    }

    // 7. Array Literal [a, b, c]
    if (tok.type === 'LBRACKET') {
      this.advance();
      const elements: ASTExpr[] = [];
      while (!this.check('RBRACKET') && !this.isAtEnd()) {
        elements.push(this.parseExpr(0));
        if (!this.match('COMMA')) break;
      }
      const close = this.consume('RBRACKET', "Esperado ']' ao fechar array.");
      return {
        type: 'ArrayExpr',
        elements,
        span: this.mergeSpans(tok.span, close.span),
      };
    }

    // 8. Identificador ou Chamada de Função fn(a, b)
    if (tok.type === 'IDENTIFIER') {
      this.advance();
      if (this.match('LPAREN')) {
        const args: ASTExpr[] = [];
        while (!this.check('RPAREN') && !this.isAtEnd()) {
          args.push(this.parseExpr(0));
          if (!this.match('COMMA')) break;
        }
        const close = this.consume('RPAREN', `Esperado ')' após argumentos de '${tok.value}'.`);
        return {
          type: 'CallExpr',
          callee: tok.value,
          args,
          span: this.mergeSpans(tok.span, close.span),
        };
      }

      return {
        type: 'Ident',
        name: tok.value,
        span: tok.span,
      };
    }

    // Fallback seguro com erro sintático registrado
    this.error(tok, `Expressão inválida próxima a '${tok.value || tok.type}'.`);
    this.advance();
    return {
      type: 'NumberLit',
      value: 0,
      span: tok.span,
    };
  }

  /**
   * Constrói um nó `DiceExpr` e consome modificadores pós-fixos de dados:
   * - Keep / Drop: kh1, kl1, dh1, dl1
   * - Reroll: r1
   * - Explosão: !, !!, !p, !>=9
   * - Tag de Dualidade / Fome: #hope, #fear, #hunger
   */
  private parseDiceSuffix(countExpr: ASTExpr, dieTok: DSLToken): ASTExpr {
    const faces: ASTExpr | 'F' =
      dieTok.value === 'F'
        ? 'F'
        : {
          type: 'NumberLit',
          value: Number(dieTok.value),
          span: dieTok.span,
        };

    const modifiers: DiceModifierNode[] = [];
    let endSpan = dieTok.span;

    while (!this.isAtEnd()) {
      const next = this.peek();

      // Modificadores khN, klN, dhN, dlN, rN
      if (next.type === 'IDENTIFIER' && /^(kh|kl|dh|dl|r)(\d+)$/i.test(next.value)) {
        const modTok = this.advance();
        endSpan = modTok.span;
        const m = modTok.value.match(/^(kh|kl|dh|dl|r)(\d+)$/i)!;
        const prefix = m[1].toLowerCase();
        const num = Number(m[2]);

        if (prefix === 'kh') modifiers.push({ kind: 'keep_highest', count: num });
        else if (prefix === 'kl') modifiers.push({ kind: 'keep_lowest', count: num });
        else if (prefix === 'dh') modifiers.push({ kind: 'drop_highest', count: num });
        else if (prefix === 'dl') modifiers.push({ kind: 'drop_lowest', count: num });
        else if (prefix === 'r') modifiers.push({ kind: 'reroll', value: num });
        continue;
      }

      // Explosões (!, !!, !p, !>=9)
      if (next.type === 'BANG' || next.type === 'BANG_COMPOUND' || next.type === 'BANG_PEN') {
        const bangTok = this.advance();
        endSpan = bangTok.span;
        const mode =
          bangTok.type === 'BANG_COMPOUND'
            ? 'compound'
            : bangTok.type === 'BANG_PEN'
              ? 'penetrating'
              : 'simple';

        let threshold: number | undefined;
        if (this.match('GTE') && this.check('NUMBER')) {
          const numTok = this.advance();
          endSpan = numTok.span;
          threshold = Number(numTok.value);
        }
        modifiers.push({ kind: 'explode', mode, threshold });
        continue;
      }

      // Tag de dado (#hope, #fear, #hunger)
      if (next.type === 'TAG') {
        const tagTok = this.advance();
        endSpan = tagTok.span;
        modifiers.push({ kind: 'tag', tag: tagTok.value });
        continue;
      }

      break;
    }

    return {
      type: 'DiceExpr',
      count: countExpr,
      faces,
      modifiers,
      span: this.mergeSpans(countExpr.span, endSpan),
    };
  }

  private hasImmediateDiceModifier(): boolean {
    const next = this.peek();
    if (next.type === 'BANG' || next.type === 'BANG_COMPOUND' || next.type === 'BANG_PEN' || next.type === 'TAG') {
      return true;
    }
    if (next.type === 'IDENTIFIER' && /^(kh|kl|dh|dl|r)\d+$/i.test(next.value)) {
      return true;
    }
    return false;
  }

  /**
   * Reconhece padrões de comparação implícita em tabelas e faixas (ex: `>= 10`, `<= floor(self/2)`, `7..9`).
   */
  private parseMatcherExpr(): ASTExpr {
    const tok = this.peek();
    if (
      tok.type === 'GTE' ||
      tok.type === 'LTE' ||
      tok.type === 'GT' ||
      tok.type === 'LT' ||
      tok.type === 'EQ' ||
      tok.type === 'NEQ'
    ) {
      const opTok = this.advance();
      const right = this.parseExpr(0);
      return {
        type: 'BinaryExpr',
        op: opTok.value as Extract<ASTExpr, { type: 'BinaryExpr' }>['op'],
        left: { type: 'Ident', name: 'result', span: opTok.span },
        right,
        span: this.mergeSpans(opTok.span, right.span),
      };
    }
    return this.parseExpr(0);
  }

  private getInfixBindingPower(type: TokenType): [number, number] | null {
    switch (type) {
      case 'STAR':
      case 'SLASH':
      case 'PERCENT':
        return [40, 41];
      case 'PLUS':
      case 'MINUS':
        return [30, 31];
      case 'RANGE':
        return [25, 26];
      case 'LT':
      case 'GT':
      case 'LTE':
      case 'GTE':
      case 'EQ':
      case 'NEQ':
        return [20, 21];
      case 'AND':
        return [15, 16];
      case 'OR':
        return [12, 13];
      case 'QUESTION':
        return [10, 9]; // Associativo à direita
      default:
        return null;
    }
  }

  // ==========================================================================
  // 3. AUXILIARES DE METADADOS, OPERADORES E RECUPERAÇÃO DE ERROS
  // ==========================================================================

  private parseAssignOp(): AssignMode {
    if (this.match('ASSIGN_PIN')) return 'pin';
    if (this.match('ASSIGN_LOCK')) return 'lock';
    if (this.match('ASSIGN_ADD')) return 'add';
    if (this.match('ASSIGN_SUB')) return 'sub';
    if (this.match('ASSIGN_CALC') || this.match('COLON')) return 'calc';
    return 'calc';
  }

  private parseOptionalMetaAndFlags(): ASTMetadataMap {
    const meta = this.emptyMeta();

    while (true) {
      if (this.check('LBRACKET')) {
        this.mergeMeta(meta, this.parseMetadataBracket());
      } else if (this.check('FLAG')) {
        meta.flags.push(this.advance().value);
      } else if (this.check('TAG')) {
        meta.tags.push(this.advance().value);
      } else {
        break;
      }
    }

    return meta;
  }

  private parseMetadataBracket(): ASTMetadataMap {
    const meta = this.emptyMeta();
    this.consume('LBRACKET', "Esperado '['.");

    while (!this.check('RBRACKET') && !this.isAtEnd()) {
      if (this.check('TAG')) {
        meta.tags.push(this.advance().value);
      } else if (this.check('FLAG')) {
        meta.flags.push(this.advance().value);
      } else if (this.check('IDENTIFIER') || this.check('STRING')) {
        const key = this.advance().value;
        if (this.match('COLON') || this.match('ASSIGN_CALC')) {
          meta.props[key] = this.parseExpr(0);
          // Atalho para custo de recurso inline: [cost: 2 PE] ou [custo: 1 PM]
          const keyLow = key.toLowerCase();
          if (
            (keyLow === 'cost' || keyLow === 'custo') &&
            this.check('IDENTIFIER') &&
            this.peekNext().type !== 'COLON' &&
            this.peekNext().type !== 'ASSIGN_CALC'
          ) {
            const resTok = this.advance();
            meta.props.resource = {
              type: 'Ident',
              name: resTok.value,
              span: resTok.span,
            };
          }
        } else {
          meta.tags.push(key);
        }
      } else {
        this.advance();
      }
      this.matchAny('COMMA', 'SEMICOLON', 'PIPE');
    }

    this.consume('RBRACKET', "Esperado ']' para fechar metadados.");
    return meta;
  }

  private parseStringArray(): string[] {
    const result: string[] = [];
    if (this.match('LBRACKET')) {
      while (!this.check('RBRACKET') && !this.isAtEnd()) {
        if (this.check('STRING') || this.check('IDENTIFIER')) {
          result.push(this.advance().value);
        } else {
          this.advance();
        }
        if (!this.match('COMMA')) break;
      }
      this.consume('RBRACKET', "Esperado ']' após lista de estados.");
    }
    return result;
  }

  private emptyMeta(): ASTMetadataMap {
    return { props: {}, tags: [], flags: [] };
  }

  private mergeMeta(target: ASTMetadataMap, source: ASTMetadataMap): void {
    Object.assign(target.props, source.props);
    for (const t of source.tags) {
      if (!target.tags.includes(t)) target.tags.push(t);
    }
    for (const f of source.flags) {
      if (!target.flags.includes(f)) target.flags.push(f);
    }
  }

  private consumeIdentifierOrString(message: string): string | null {
    if (this.check('IDENTIFIER') || this.check('STRING')) {
      return this.advance().value;
    }
    this.error(this.peek(), message);
    return null;
  }

  /**
   * Indica fim natural de um bloco top-level sem chaves:
   * próxima diretiva `@bloco` / `[Bloco]`, chave de fechamento opcional `}`, ou `EOF`.
   */
  private isAtBlockEnd(): boolean {
    if (this.isAtEnd()) return true;
    const t = this.peek().type;
    return t === 'DIRECTIVE' || t === 'RBRACE';
  }

  /**
   * Detecta se os próximos tokens iniciam uma atribuição/modificador de efeito
   * (ex: `DEF += 5`, `PV.max += VIG * 2`, `resistances.Balistico += 5`, `DEF :! 0`).
   */
  private isEffectStatementStart(): boolean {
    if (!this.check('IDENTIFIER')) return false;
    let look = this.pos + 1;
    while (
      look < this.tokens.length &&
      this.tokens[look].type === 'DOT' &&
      look + 1 < this.tokens.length &&
      (this.tokens[look + 1].type === 'IDENTIFIER' || this.tokens[look + 1].type === 'STRING')
    ) {
      look += 2;
    }
    if (look >= this.tokens.length) return false;
    const nextType = this.tokens[look].type;
    return (
      nextType === 'ASSIGN_ADD' ||
      nextType === 'ASSIGN_SUB' ||
      nextType === 'ASSIGN_PIN' ||
      nextType === 'ASSIGN_LOCK'
    );
  }

  /**
   * Detecta se estamos no início de uma nova declaração de habilidade/ação/magia/movimento.
   */
  private isAtAbilityHeader(insideItem = false): boolean {
    if (!this.check('IDENTIFIER')) return false;
    const w = this.peek().value.toLowerCase();
    if (!ABILITY_CATEGORIES[w]) return false;
    const next = this.peekNext().type;
    if (next === 'COLON' || next === 'ASSIGN_CALC') return false;
    // Se estivermos dentro de um item, `action "Ataque"` também inicia uma nova ação do item
    return next === 'STRING' || next === 'IDENTIFIER' || (insideItem && next === 'LBRACKET');
  }

  /**
   * Detecta se um item do inventário chegou ao fim (próximo `item`, `rule`/`when`/`?`, config do inventário, ou fim do bloco).
   */
  private isAtItemBoundary(): boolean {
    if (this.isAtBlockEnd()) return true;
    if (this.isAtRuleStart()) return true;
    if (this.isAtInventoryConfigKey()) return true;
    if ((this.check('MINUS') || this.check('STAR')) && this.peekNext().type === 'IDENTIFIER' && this.peekNext().value.toLowerCase() === 'item') {
      return true;
    }
    if (this.check('IDENTIFIER') && this.peek().value.toLowerCase() === 'item') {
      return true;
    }
    return false;
  }

  private isAtRuleStart(): boolean {
    if (this.check('QUESTION')) return true;
    if (this.check('IDENTIFIER')) {
      const w = this.peek().value.toLowerCase();
      return w === 'when' || w === 'rule' || w === 'regra' || w === 'se';
    }
    return false;
  }

  private isAtInventoryConfigKey(): boolean {
    if (!this.check('IDENTIFIER')) return false;
    const w = this.peek().value.toLowerCase();
    const next = this.peekNext().type;
    return (
      (w === 'unit' || w === 'unidade' || w === 'max_load' || w === 'carga_max' || w === 'overload_limit' || w === 'sobrecarga') &&
      (next === 'COLON' || next === 'ASSIGN_CALC' || next === 'ASSIGN_PIN')
    );
  }

  private skipSeparators(): void {
    while (this.match('NEWLINE') || this.match('SEMICOLON') || this.match('COMMA') || this.match('PIPE')) {
      // Consome separadores consecutivos
    }
  }

  private synchronizeToNextStatement(): void {
    while (!this.isAtEnd()) {
      const t = this.peek().type;
      if (t === 'NEWLINE' || t === 'SEMICOLON' || t === 'PIPE') {
        this.advance();
        return;
      }
      if (t === 'RBRACE' || t === 'DIRECTIVE') {
        return;
      }
      this.advance();
    }
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private matchAny(...types: TokenType[]): boolean {
    for (const t of types) {
      if (this.check(t)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): DSLToken {
    if (this.check(type)) return this.advance();
    const current = this.peek();
    this.error(current, message);
    return current;
  }

  private peek(): DSLToken {
    return this.tokens[this.pos];
  }

  private peekNext(): DSLToken {
    return this.pos + 1 < this.tokens.length ? this.tokens[this.pos + 1] : this.tokens[this.pos];
  }

  private previous(): DSLToken {
    return this.tokens[Math.max(0, this.pos - 1)];
  }

  private advance(): DSLToken {
    if (!this.isAtEnd()) this.pos++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private error(token: DSLToken, message: string): void {
    this.diagnostics.push({
      severity: 'error',
      stage: 'parser',
      message,
      span: token.span,
      symbol: token.value,
    });
  }

  private mergeSpans(a: SourceSpan, b: SourceSpan): SourceSpan {
    return {
      start: a.start,
      end: b.end,
    };
  }
}

export function parseSheetDSL(source: string): ParseResult {
  const { tokens, diagnostics } = tokenizeSheetDSL(source);
  const parser = new SheetParser(tokens, diagnostics);
  return parser.parseDocument();
}
