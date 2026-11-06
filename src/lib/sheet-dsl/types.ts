/**
 * SGM-SDL (Sheet Domain-Specific Language)
 * Especificação de Tipos da Linguagem, Tokens, AST e Representação Intermediária (IR).
 *
 * Design Direto & Modular:
 * - Pouca verbosidade, alta densidade conceitual.
 * - Suporte agnóstico a múltiplos paradigmas (D20, Pool de Sucessos, d100 Roll-Under,
 *   Step-Die, Relógios/Trilhas, PbtA/Fate, Inventário Reativo e Diagramas Anatômicos).
 */

// ============================================================================
// 1. LOCALIZAÇÃO DE CÓDIGO E DIAGNÓSTICOS DE COMPILAÇÃO
// ============================================================================

export interface SourcePosition {
  line: number;   // 1-indexed
  column: number; // 1-indexed
  offset: number; // 0-indexed
}

export interface SourceSpan {
  start: SourcePosition;
  end: SourcePosition;
}

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface DSLDiagnostic {
  severity: DiagnosticSeverity;
  stage: 'lexer' | 'parser' | 'semantic' | 'runtime';
  message: string;
  span: SourceSpan;
  symbol?: string;
}

// ============================================================================
// 2. DEFINIÇÃO LÉXICA (TOKENS)
// ============================================================================

export type TokenType =
  | 'EOF'
  | 'NEWLINE'
  // Diretivas de Bloco (@attr, @res, @skill, etc.)
  | 'DIRECTIVE'
  // Identificadores e Literais
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'STRING'
  | 'STEP_DIE'      // d4, d6, d8, d10, d12, d20, d100, dF
  | 'TAG'           // #fogo, #ataque, #hope, #fear
  | 'FLAG'          // !lock, !active, !equipped, !carried, !stash, !infinite
  // Operadores de Atribuição e Definição
  | 'ASSIGN_CALC'   // =   (Fórmula reativa)
  | 'ASSIGN_PIN'    // :=  (Valor base cravado)
  | 'ASSIGN_LOCK'   // :!  (Valor absoluto travado contra modificadores)
  | 'ASSIGN_ADD'    // +=  (Modificador aditivo)
  | 'ASSIGN_SUB'    // -=  (Modificador subtrativo)
  | 'ARROW'         // ->  (Mapeamento de tabela / faixa / resultado)
  // Operadores Aritméticos, Lógicos e de Intervalo
  | 'PLUS'          // +
  | 'MINUS'         // -
  | 'STAR'          // *
  | 'SLASH'         // /
  | 'PERCENT'       // %
  | 'RANGE'         // ..  (ex: 18..20, 7..9)
  | 'EQ'            // ==
  | 'NEQ'           // !=
  | 'LTE'           // <=
  | 'GTE'           // >=
  | 'LT'            // <
  | 'GT'            // >
  | 'AND'           // &&
  | 'OR'            // ||
  | 'PIPE'          // | (Separador inline de declarações/propriedades)
  | 'QUESTION'      // ?
  | 'BANG'          // !   (Explosão de dado ou negação)
  | 'BANG_COMPOUND' // !!  (Explosão composta Shadowrun)
  | 'BANG_PEN'      // !p  (Explosão penetrante)
  // Delimitadores e Pontuação
  | 'LBRACE'        // {
  | 'RBRACE'        // }
  | 'LBRACKET'      // [
  | 'RBRACKET'      // ]
  | 'LPAREN'        // (
  | 'RPAREN'        // )
  | 'COLON'         // :
  | 'SEMICOLON'     // ;
  | 'COMMA'         // ,
  | 'DOT';          // .

export interface DSLToken {
  type: TokenType;
  value: string;
  span: SourceSpan;
}

// ============================================================================
// 3. CATEGORIAS CANÔNICAS DE BLOCOS DA DSL
// ============================================================================

export type CanonicalBlockKind =
  | 'meta'       // @meta, @sheet, @ficha
  | 'profile'    // @profile, @perfil, @img, @identidade
  | 'counter'    // @counter, @counters, @tracker, @contadores
  | 'table'      // @table, @tabela
  | 'attr'       // @attr, @attributes, @atributos
  | 'stat'       // @stat, @stats, @status, @defesas
  | 'res'        // @res, @resources, @recursos
  | 'rank'       // @rank, @ranks, @graus
  | 'roll'       // @roll, @resolution, @resolucao
  | 'turn'       // @turn, @action_economy, @turno
  | 'desc'       // @desc, @descriptors, @narrative, @descritores
  | 'skill'      // @skill, @skills, @pericias
  | 'inv'        // @inv, @inventory, @inventario
  | 'ability'    // @ability, @abilities, @actions, @moves, @magic, @habilidades, @acoes, @magias
  | 'diagram'    // @diagram, @quadro, @diagrama
  | 'rule'       // @rule, @rules, @regras
  | 'tab'        // @tab, @aba, @page, @pagina
  | 'slots'      // @slots, @segmentos, @segments, @caixas
  | 'text';      // @text, @texto, @note, @nota, @bio, @anotacoes

// --- Marcadores de Disposição Global e Visual de Módulos ---

export type ModulePlacement = 'col1' | 'col2' | 'full' | 'auto';

export type ModuleDisplayStyle =
  | 'cards'     // Grade de quadradinhos (padrão)
  | 'list'      // Lista limpa (Nome ............ Valor)
  | 'pyramid'   // Pirâmide empilhada centralizada
  | 'divided'   // Divisórias de parágrafo / linhas contínuas
  | 'stacked'   // Empilhado vertical
  | 'segments'  // Barras segmentadas (Imagem 2 topo-esq)
  | 'dots'      // Círculos / pontilhados (Imagem 2 baixo-esq)
  | 'pie';      // Pizza / Relógio circular fatiado (Imagem 2 dir)

export interface ASTModuleLayoutMeta {
  id: string;
  kind: CanonicalBlockKind;
  title?: string;
  tab?: string;
  placement: ModulePlacement;
  display: ModuleDisplayStyle;
  tall?: boolean;
  cols?: number;
  color?: string;
  order: number;
}

// ============================================================================
// 4. ÁRVORE SINTÁTICA ABSTRATA (AST)
// ============================================================================

export type AssignMode = 'calc' | 'pin' | 'lock' | 'add' | 'sub';

export type StepDieFaces = 4 | 6 | 8 | 10 | 12 | 20 | 100 | 'F';

export interface ASTMetadataMap {
  props: Record<string, ASTExpr>;
  tags: string[];
  flags: string[];
}

// --- Expressões (Pratt Parser AST) ---

export type DiceModifierNode =
  | { kind: 'keep_highest'; count: number }
  | { kind: 'keep_lowest'; count: number }
  | { kind: 'drop_highest'; count: number }
  | { kind: 'drop_lowest'; count: number }
  | { kind: 'explode'; mode: 'simple' | 'compound' | 'penetrating'; threshold?: number }
  | { kind: 'reroll'; value: number }
  | { kind: 'tag'; tag: string };

export type ASTExpr =
  | { type: 'NumberLit'; value: number; span: SourceSpan }
  | { type: 'StringLit'; value: string; span: SourceSpan }
  | { type: 'StepDieLit'; faces: StepDieFaces; span: SourceSpan }
  | { type: 'Ident'; name: string; span: SourceSpan }
  | { type: 'MemberExpr'; object: string; property: string; span: SourceSpan }
  | { type: 'UnaryExpr'; op: '+' | '-' | '!'; operand: ASTExpr; span: SourceSpan }
  | {
    type: 'BinaryExpr';
    op: '+' | '-' | '*' | '/' | '%' | '==' | '!=' | '<=' | '>=' | '<' | '>' | '&&' | '||';
    left: ASTExpr;
    right: ASTExpr;
    span: SourceSpan;
  }
  | { type: 'RangeExpr'; min: ASTExpr; max: ASTExpr; span: SourceSpan }
  | { type: 'TernaryExpr'; condition: ASTExpr; consequent: ASTExpr; alternate: ASTExpr; span: SourceSpan }
  | { type: 'CallExpr'; callee: string; args: ASTExpr[]; span: SourceSpan }
  | { type: 'ArrayExpr'; elements: ASTExpr[]; span: SourceSpan }
  | {
    type: 'DiceExpr';
    count: ASTExpr;
    faces: ASTExpr | 'F';
    modifiers: DiceModifierNode[];
    span: SourceSpan;
  };

// --- Nós de Declaração Modular ---

export interface ASTStatDecl {
  type: 'StatDecl';
  id: string;
  label?: string;
  mode: AssignMode;
  expr: ASTExpr;
  meta: ASTMetadataMap;
  children: ASTStatDecl[];
  tab?: string;
  blockTitle?: string;
  span: SourceSpan;
}

export type ResourceKind = 'bar' | 'track' | 'clock' | 'slots' | 'counter' | 'pool';

export interface ASTResourceDecl {
  type: 'ResourceDecl';
  id: string;
  label?: string;
  kind: ResourceKind;
  currentExpr: ASTExpr;
  maxExpr?: ASTExpr;
  states?: string[]; // Para tracks (ex: [".", "/", "X"])
  meta: ASTMetadataMap;
  tab?: string;
  blockTitle?: string;
  span: SourceSpan;
}

export interface ASTTableRow {
  matcher: ASTExpr; // NumberLit, RangeExpr (1..4) ou StringLit ("default")
  result: ASTExpr;
  meta: ASTMetadataMap;
  span: SourceSpan;
}

export interface ASTTableDecl {
  type: 'TableDecl';
  id: string;
  rows: ASTTableRow[];
  span: SourceSpan;
}

export interface ASTRankGroupDecl {
  type: 'RankGroupDecl';
  id: string;
  ranks: Record<string, number>;
  span: SourceSpan;
}

export interface ASTOutcomeBand {
  matcher: ASTExpr; // Ex: >= 10, 7..9, <= 6, == 1, Ident("default")
  label: string;
  meta: ASTMetadataMap;
  effects: ASTEffectStmt[];
  span: SourceSpan;
}

export interface ASTResolutionDecl {
  type: 'ResolutionDecl';
  id: string;
  params: string[];
  rollExpr: ASTExpr;
  bands: ASTOutcomeBand[];
  span: SourceSpan;
}

export interface ASTTurnSlotDecl {
  id: string;
  label?: string;
  kind: ResourceKind;
  currentExpr: ASTExpr;
  maxExpr?: ASTExpr;
  meta: ASTMetadataMap;
  span: SourceSpan;
}

export interface ASTTurnConversion {
  name: string;
  consumes: Array<{ count: number; slotId: string }>;
  span: SourceSpan;
}

export interface ASTTurnBlock {
  reset: string; // "turn" | "round" | "scene"
  slots: ASTTurnSlotDecl[];
  conversions: ASTTurnConversion[];
}

export type DescriptorKind = 'aspect' | 'tag' | 'resistance' | 'immunity' | 'vulnerability' | 'consequence' | 'sense';

export interface ASTDescriptorDecl {
  type: 'DescriptorDecl';
  kind: DescriptorKind;
  id: string;
  label?: string;
  valueExpr?: ASTExpr;
  meta: ASTMetadataMap;
  effects: ASTEffectStmt[];
  tab?: string;
  blockTitle?: string;
  span: SourceSpan;
}

export interface ASTSkillDecl {
  type: 'SkillDecl';
  id: string;
  label?: string;
  baseAttr?: string;
  mode: AssignMode;
  expr: ASTExpr;
  rollOverride?: ASTExpr;
  meta: ASTMetadataMap;
  children: ASTStatDecl[];
  tab?: string;
  blockTitle?: string;
  span: SourceSpan;
}

export interface ASTEffectStmt {
  target: string; // Ex: "DEF", "PV.max", "Luta"
  op: AssignMode; // 'add' (+=), 'sub' (-=), 'pin' (:=), 'lock' (:!), 'calc' (=)
  expr: ASTExpr;
  span: SourceSpan;
}

export interface ASTEnhancementDecl {
  id: string;
  label: string;
  meta: ASTMetadataMap; // [cost: 2, resource: "PE", requires: "2o Circulo"]
  props: Record<string, ASTExpr>;
  effects: ASTEffectStmt[];
  span: SourceSpan;
}

export type AbilityCategory = 'ability' | 'action' | 'move' | 'spell';

export interface ASTAbilityDecl {
  type: 'AbilityDecl';
  category: AbilityCategory;
  id: string;
  label: string;
  meta: ASTMetadataMap;
  props: Record<string, ASTExpr>; // test, damage, desc, trigger, range, cost
  passiveEffects: ASTEffectStmt[];
  activeEffects: ASTEffectStmt[]; // Aplicados quando !active está presente ou condição satisfeita
  bands: ASTOutcomeBand[];        // Para Moves (PbtA) ou Magias com graus de sucesso
  choices: string[];              // Opções de escolha de Move (Hold)
  enhancements: ASTEnhancementDecl[]; // Aprimoramentos (+PE / +PM / Upcast)
  tab?: string;
  blockTitle?: string;
  span: SourceSpan;
}

export interface ASTItemDecl {
  type: 'ItemDecl';
  id: string;
  label: string;
  meta: ASTMetadataMap; // [weight: 2, qty: 1, category: 2, #equipped / #carried / #stash]
  props: Record<string, ASTExpr>;
  effects: ASTEffectStmt[]; // Aplicados automaticamente se !equipped
  actions: ASTAbilityDecl[];
  span: SourceSpan;
}

export interface ASTInventorySpec {
  config: Record<string, ASTExpr>; // max_load, overload_limit, unit
  items: ASTItemDecl[];
  rules: ASTRuleDecl[];
  title?: string;
  tab?: string;
}

export interface ASTSlotItemDecl {
  id: string;
  label: string;
  state: 'empty' | 'filled' | 'damaged' | 'locked';
  content?: string;
  current?: number;
  max?: number;
  colSpan?: number;
  isCondition?: boolean;
  meta: ASTMetadataMap;
  span: SourceSpan;
}

export interface ASTSlotsBlockDecl {
  type: 'SlotsBlockDecl';
  id: string;
  title?: string;
  tab?: string;
  cols?: number;
  slots: ASTSlotItemDecl[];
  meta: ASTMetadataMap;
  span: SourceSpan;
}

export interface ASTDiagramNodeDecl {
  id: string;
  label: string;
  meta: ASTMetadataMap; // [hit: 1..2, mult: 2]
  resources: ASTResourceDecl[];
  stats: ASTStatDecl[];
  rules: ASTRuleDecl[];
  span: SourceSpan;
}

export interface ASTDiagramDecl {
  type: 'DiagramDecl';
  id: string;
  meta: ASTMetadataMap;
  nodes: ASTDiagramNodeDecl[];
  tab?: string;
  span: SourceSpan;
}

export interface ASTRuleDecl {
  type: 'RuleDecl';
  id?: string;
  condition: ASTExpr;
  effects: ASTEffectStmt[];
  span: SourceSpan;
}

export type ProfileTextPosition = 'bottom' | 'top' | 'side' | 'none';

export interface ASTProfileBlockDecl {
  type: 'ProfileBlockDecl';
  id: string;
  title?: string;
  tab?: string;
  placement: ModulePlacement;
  display: ModuleDisplayStyle;
  tall?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'banner' | 'avatar-only';
  textPos?: ProfileTextPosition;
  props: Record<string, ASTExpr>;
  meta: ASTMetadataMap;
  span: SourceSpan;
}

export interface ASTTextBlockDecl {
  type: 'TextBlockDecl';
  id: string;
  title?: string;
  tab?: string;
  placement: ModulePlacement;
  display: ModuleDisplayStyle;
  tall?: boolean;
  content: string[];
  props: Record<string, ASTExpr>;
  meta: ASTMetadataMap;
  span: SourceSpan;
}

export interface ASTCounterItemDecl {
  id: string;
  label: string;
  current: number;
  max: number;
  style: 'segments' | 'dots' | 'pie';
  color?: string;
  meta: ASTMetadataMap;
  span: SourceSpan;
}

export interface ASTCounterBlockDecl {
  type: 'CounterBlockDecl';
  id: string;
  title?: string;
  tab?: string;
  placement: ModulePlacement;
  display: ModuleDisplayStyle;
  tall?: boolean;
  cols?: number;
  items: ASTCounterItemDecl[];
  meta: ASTMetadataMap;
  span: SourceSpan;
}

export interface ASTSheetDocument {
  meta: ASTMetadataMap;
  profiles: ASTProfileBlockDecl[];
  counters: ASTCounterBlockDecl[];
  texts: ASTTextBlockDecl[];
  tables: ASTTableDecl[];
  ranks: ASTRankGroupDecl[];
  resolutions: ASTResolutionDecl[];
  attributes: ASTStatDecl[];
  stats: ASTStatDecl[];
  resources: ASTResourceDecl[];
  turn: ASTTurnBlock;
  descriptors: ASTDescriptorDecl[];
  defaultSkillRoll?: ASTExpr;
  skills: ASTSkillDecl[];
  inventory: ASTInventorySpec;
  abilities: ASTAbilityDecl[];
  diagrams: ASTDiagramDecl[];
  rules: ASTRuleDecl[];
  slots: ASTSlotsBlockDecl[];
  tabs: Array<{ id: string; label: string }>;
  blockTitles: Record<string, string>;
  moduleLayouts: ASTModuleLayoutMeta[];
}

// ============================================================================
// 5. REPRESENTAÇÃO INTERMEDIÁRIA COMPILADA (IR / ESTADO VIVO REATIVO)
// ============================================================================

export type EvaluatedValue = number | string | { kind: 'step_die'; faces: StepDieFaces };

export interface ModifierTrace {
  source: string; // Ex: "Base", "Proteção Pesada", "Fúria", "Sobrecarga"
  op: AssignMode;
  value: number;
}

export interface EvaluatedStat {
  id: string;
  label: string;
  baseValue: EvaluatedValue;
  finalValue: EvaluatedValue;
  displayFraction?: string;
  mode: AssignMode;
  locked: boolean;
  traces: ModifierTrace[];
  children: Record<string, EvaluatedValue>;
  tags: string[];
  rollFormula?: string;
  rollAst?: ASTExpr;
  tab?: string;
  blockTitle?: string;
}

export interface EvaluatedResource {
  id: string;
  label: string;
  kind: ResourceKind;
  current: number;
  max: number;
  min: number;
  temp: number;
  states?: string[];
  boxes?: string[]; // Estado atual de cada caixa em um track
  color?: string;
  tags: string[];
  tab?: string;
  blockTitle?: string;
}

export interface EvaluatedSkill {
  id: string;
  label: string;
  baseAttr?: string;
  baseAttrValue?: EvaluatedValue;
  bonus: number;
  mode: AssignMode;
  locked: boolean;
  traces: ModifierTrace[];
  rollFormula: string;
  rollAst?: ASTExpr;
  children: Record<string, EvaluatedValue>;
  tags: string[];
  tab?: string;
  blockTitle?: string;
}

export interface EvaluatedItem {
  id: string;
  label: string;
  weight: number;
  qty: number;
  totalWeight: number;
  state: 'equipped' | 'carried' | 'stash';
  category?: number | string;
  desc?: string;
  effectSummaries: string[];
  tags: string[];
  actions: EvaluatedAbility[];
}

export interface EvaluatedEnhancement {
  id: string;
  label: string;
  cost?: number;
  resource?: string;
  requires?: string;
  desc?: string;
  damage?: string;
}

export interface EvaluatedAbility {
  id: string;
  label: string;
  category: AbilityCategory;
  active: boolean;
  isToggleable: boolean;
  actionType?: string; // "Padrão", "Movimento", "Reação", "Livre", "Passiva", "1◆", "2◆◆"
  cost?: { amount: number; resource: string };
  range?: string;
  desc: string;
  testFormula?: string;
  testAst?: ASTExpr;
  damageFormula?: string;
  damageAst?: ASTExpr;
  effectSummaries: string[];
  choices: string[];
  enhancements: EvaluatedEnhancement[];
  tags: string[];
  tab?: string;
  blockTitle?: string;
}

export interface EvaluatedSlotItem {
  id: string;
  label: string;
  state: 'empty' | 'filled' | 'damaged' | 'locked';
  content?: string;
  current?: number;
  max?: number;
  tags: string[];
  colSpan?: number;
  isCondition?: boolean;
}

/**
 * Determina se um item ou módulo associado a uma aba pertence à aba atualmente ativa.
 * Previne vazamentos de abas secundárias para a aba principal ou vice-versa.
 */
export function isTabMatching(itemTab: string | undefined, activeTab?: string): boolean {
  const isMainTab = !activeTab || activeTab === 'Principal' || activeTab === 'Geral';
  if (isMainTab) {
    return !itemTab || itemTab === 'Principal' || itemTab === 'Geral';
  }
  return itemTab === activeTab;
}

export interface EvaluatedSlotsBlock {
  id: string;
  title?: string;
  tab?: string;
  cols: number;
  slots: EvaluatedSlotItem[];
}

export interface EvaluatedDiagramNode {
  id: string;
  label: string;
  hitRange?: string;
  damageMult: number;
  resources: Record<string, EvaluatedResource>;
  stats: Record<string, EvaluatedStat>;
}

export interface EvaluatedDiagram {
  id: string;
  layout: string;
  hitRoll?: string;
  nodes: EvaluatedDiagramNode[];
}

export interface EvaluatedRule {
  id: string;
  conditionText: string;
  isActive: boolean;
  effectSummaries: string[];
  source: 'global' | 'inventory' | 'diagram';
}

export interface EvaluatedProfileBlock {
  id: string;
  title?: string;
  tab?: string;
  placement: ModulePlacement;
  display: ModuleDisplayStyle;
  tall?: boolean;
  size: 'sm' | 'md' | 'lg' | 'banner' | 'avatar-only';
  textPos: ProfileTextPosition;
  imageUrl?: string;
  imgWidth?: number;
  imgHeight?: number;
  imgOffsetX?: number;
  imgOffsetY?: number;
  imgScale?: number;
  imgFit?: 'contain' | 'cover' | 'auto';
  name?: string;
  archetype?: string;
  system?: string;
  level?: number | string;
  description?: string;
  extraFields: Array<{ key: string; label: string; value: string }>;
  showImage: boolean;
  showName: boolean;
  showArchetype: boolean;
  showSystem: boolean;
  showLevel: boolean;
  showDesc: boolean;
}

export interface EvaluatedTextBlock {
  id: string;
  blockIndex: number;
  title?: string;
  tab?: string;
  placement: ModulePlacement;
  display: ModuleDisplayStyle;
  tall?: boolean;
  content: string;
  paragraphs: string[];
  tags: string[];
}

export interface EvaluatedCounterItem {
  id: string;
  label: string;
  current: number;
  max: number;
  style: 'segments' | 'dots' | 'pie';
  color?: string;
  tags: string[];
}

export interface EvaluatedCounterBlock {
  id: string;
  title?: string;
  tab?: string;
  placement: ModulePlacement;
  display: ModuleDisplayStyle;
  tall?: boolean;
  cols?: number;
  items: EvaluatedCounterItem[];
}

export interface SheetRuntimeOverrides {
  resources?: Record<string, { current?: number; temp?: number; boxes?: string[] }>;
  turnSlots?: Record<string, { current?: number }>;
  itemStates?: Record<string, { qty?: number; state?: 'equipped' | 'carried' | 'stash' }>;
  toggles?: Record<string, boolean>;
  diagramResources?: Record<string, { current?: number }>;
  slots?: Record<string, { state?: 'empty' | 'filled' | 'damaged' | 'locked'; current?: number; content?: string }>;
  counters?: Record<string, { current?: number }>;
  activeTab?: string;
}

export type SheetTheme = 'dark' | 'purple' | 'red' | 'blue' | 'green' | 'amber';

export type TabNavPosition = 'top' | 'bottom' | 'left' | 'right' | 'hidden';
export type TabNavAlign = 'left' | 'center' | 'right' | 'stretch';

export interface CustomThemeHexColors {
  accent?: string;
  bg?: string;
  cardBg?: string;
  cardBorder?: string;
  itemBg?: string;
  itemBorder?: string;
  headerBg?: string;
  text?: string;
}

export interface TabNavMetaConfig {
  position: TabNavPosition;
  showLabels: boolean;
  align: TabNavAlign;
}

export interface CompiledSheet {
  meta: {
    name: string;
    archetype?: string;
    system?: string;
    level?: number;
    theme: SheetTheme;
    customThemeColors?: CustomThemeHexColors;
    tabNav: TabNavMetaConfig;
    props: Record<string, EvaluatedValue>;
    tags: string[];
  };
  profiles: EvaluatedProfileBlock[];
  counters: EvaluatedCounterBlock[];
  texts: EvaluatedTextBlock[];
  moduleLayouts: ASTModuleLayoutMeta[];
  ranks: Record<string, Record<string, number>>;
  attributes: Record<string, EvaluatedStat>;
  stats: Record<string, EvaluatedStat>;
  resources: Record<string, EvaluatedResource>;
  turn: {
    reset: string;
    slots: Record<string, EvaluatedResource>;
    conversions: ASTTurnConversion[];
  };
  descriptors: Array<{
    kind: DescriptorKind;
    id: string;
    label: string;
    value?: EvaluatedValue;
    active: boolean;
    hasEffects: boolean;
    effectSummaries: string[];
    tags: string[];
    tab?: string;
    blockTitle?: string;
  }>;
  skills: Record<string, EvaluatedSkill>;
  inventory: {
    unit: string;
    currentLoad: number;
    maxCapacity: number;
    overloadLimit: number;
    isOverloaded: boolean;
    items: EvaluatedItem[];
    title?: string;
    tab?: string;
  };
  abilities: EvaluatedAbility[];
  slots: EvaluatedSlotsBlock[];
  diagrams: Record<string, EvaluatedDiagram>;
  tables: Record<string, ASTTableDecl>;
  resolutions: Record<string, ASTResolutionDecl>;
  rules: EvaluatedRule[];
  tabs: Array<{ id: string; label: string }>;
  blockTitles: {
    attributes?: string;
    stats?: string;
    resources?: string;
    skills?: string;
    inventory?: string;
    abilities?: string;
    slots?: string;
    descriptors?: string;
    profile?: string;
    counters?: string;
    text?: string;
    turn?: string;
    rules?: string;
  };
  diagnostics: DSLDiagnostic[];
  dependencyOrder: string[];
}

