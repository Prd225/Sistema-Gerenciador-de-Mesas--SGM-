/**
 * SGM-SDL Semantic Analyzer, DAG Builder & Reactive Evaluator
 *
 * Responsabilidades:
 * 1. Construir a Tabela de Símbolos e o Grafo Acíclico Dirigido (DAG) de dependências.
 * 2. Detectar referências circulares via DFS de 3 cores sem travar a execução.
 * 3. Avaliar expressões, tabelas de lookup, dados escaláveis (Step-Die) e funções de inventário.
 * 4. Executar o Pipeline de Modificadores em Camadas (Base -> Itens -> Passivas -> Toggles/Regras -> !lock),
 *    registrando o rastreio completo (ModifierTrace) de cada bônus ou penalidade.
 */

import { parseSheetDSL } from './parser';
import type {
  ASTAbilityDecl,
  ASTEffectStmt,
  ASTExpr,
  ASTResourceDecl,
  ASTSheetDocument,
  ASTStatDecl,
  ASTTableDecl,
  CompiledSheet,
  DSLDiagnostic,
  EvaluatedAbility,
  EvaluatedCounterBlock,
  EvaluatedCounterItem,
  EvaluatedDiagram,
  EvaluatedItem,
  EvaluatedProfileBlock,
  EvaluatedResource,
  EvaluatedRule,
  EvaluatedSkill,
  EvaluatedSlotItem,
  EvaluatedSlotsBlock,
  EvaluatedStat,
  EvaluatedValue,
  SheetRuntimeOverrides,
  StepDieFaces,
} from './types';

const STEP_DIE_CHAIN: StepDieFaces[] = [4, 6, 8, 10, 12, 20];

interface EvalContext {
  selfVal?: EvaluatedValue;
  attrVal?: EvaluatedValue;
  attrName?: string;
  resultVal?: number;
  localVars?: Record<string, EvaluatedValue>;
}

export class SheetAnalyzer {
  private ast: ASTSheetDocument;
  private diagnostics: DSLDiagnostic[];
  private overrides: SheetRuntimeOverrides;

  // Tabelas internas durante avaliação
  private rankMap: Record<string, number> = {};
  private rankGroups: Record<string, Record<string, number>> = {};
  private tableMap: Record<string, ASTTableDecl> = {};
  private symbolValues: Record<string, EvaluatedValue> = {};

  // Estado Compilado
  private attributes: Record<string, EvaluatedStat> = {};
  private stats: Record<string, EvaluatedStat> = {};
  private resources: Record<string, EvaluatedResource> = {};
  private skills: Record<string, EvaluatedSkill> = {};
  private items: EvaluatedItem[] = [];
  private evaluatedRules: EvaluatedRule[] = [];
  private currentLoad = 0;
  private maxCapacity = 0;
  private overloadLimit = 0;

  constructor(
    ast: ASTSheetDocument,
    parserDiagnostics: DSLDiagnostic[] = [],
    overrides: SheetRuntimeOverrides = {},
  ) {
    this.ast = ast;
    this.diagnostics = [...parserDiagnostics];
    this.overrides = overrides;
  }

  public compile(): CompiledSheet {
    // 1. Registra Tabelas de Consulta e Graus (@table, @rank)
    for (const tbl of this.ast.tables) {
      this.tableMap[tbl.id] = tbl;
    }
    for (const grp of this.ast.ranks) {
      this.rankGroups[grp.id] = { ...grp.ranks };
      for (const [k, v] of Object.entries(grp.ranks)) {
        this.rankMap[k] = v;
        this.symbolValues[k] = v;
      }
    }

    // 2. Avalia Metadados (@meta) e injeta variáveis globais (level, nex, etc.)
    const metaProps: Record<string, EvaluatedValue> = {};
    for (const [k, expr] of Object.entries(this.ast.meta.props)) {
      const val = this.evalExpr(expr);
      metaProps[k] = val;
      this.symbolValues[k] = val;
    }

    // 3. Constrói o DAG e obtém a Ordem Topológica para Atributos e Status
    const allStatDecls = [...this.ast.attributes, ...this.ast.stats];
    const attrIds = new Set(this.ast.attributes.map((a) => a.id));
    const dependencyOrder = this.buildTopologicalOrder(allStatDecls);

    // 4. Camada 1: Avalia Valor Base de Atributos e Status na Ordem Topológica
    const statDeclMap = new Map<string, ASTStatDecl>();
    for (const d of allStatDecls) statDeclMap.set(d.id, d);

    for (const id of dependencyOrder) {
      const decl = statDeclMap.get(id);
      if (!decl) continue;
      const evaluated = this.evaluateBaseStatDecl(decl);
      if (attrIds.has(id)) {
        this.attributes[id] = evaluated;
      } else {
        this.stats[id] = evaluated;
      }
    }

    // 5. Camada 1b: Avalia Valor Base das Perícias (@skill)
    for (const skillDecl of this.ast.skills) {
      this.skills[skillDecl.id] = this.evaluateBaseSkillDecl(skillDecl);
    }

    // 6. Camada 1c: Avalia Inventário Inicial (Peso, Quantidade e Carga Atual)
    this.evaluateInventoryItems();
    this.recalculateInventoryBounds();

    // 7. Camada 1d: Avalia Recursos Base (@res)
    for (const resDecl of this.ast.resources) {
      this.resources[resDecl.id] = this.evaluateResourceDecl(resDecl);
    }

    // 8. Camada 2: Aplica Efeitos de Itens Equipados (!equipped)
    for (let i = 0; i < this.ast.inventory.items.length; i++) {
      const itemDecl = this.ast.inventory.items[i];
      const evalItem = this.items[i];
      if (evalItem && evalItem.state === 'equipped') {
        for (const eff of itemDecl.effects) {
          this.applyEffect(eff, evalItem.label);
        }
      }
    }

    // 9. Camada 3: Aplica Efeitos de Descritores Ativos e Habilidades Passivas / Toggles (!active)
    for (const desc of this.ast.descriptors) {
      const defaultActive =
        desc.meta.flags.includes('active') ||
        this.evalBoolProp(desc.meta.props.active, desc.effects.length > 0 && desc.kind !== 'consequence');
      const isActive =
        this.overrides.toggles && desc.id in this.overrides.toggles
          ? this.overrides.toggles[desc.id]
          : defaultActive;

      if (isActive) {
        for (const eff of desc.effects) {
          this.applyEffect(eff, desc.label || desc.id);
        }
      }
    }

    for (const ab of this.ast.abilities) {
      for (const eff of ab.passiveEffects) {
        this.applyEffect(eff, ab.label || ab.id);
      }
      const defaultToggled =
        ab.meta.flags.includes('active') || this.evalBoolProp(ab.meta.props.active, false);
      const isToggled =
        this.overrides.toggles && ab.id in this.overrides.toggles
          ? this.overrides.toggles[ab.id]
          : defaultToggled;

      if (isToggled) {
        for (const eff of ab.activeEffects) {
          this.applyEffect(eff, `${ab.label || ab.id} (Ativo)`);
        }
      }
    }

    // 10. Reavalia Status Derivados e Limites de Inventário após Buffs de Atributos
    this.recalculateDerivedStats(dependencyOrder, statDeclMap, attrIds);
    this.recalculateInventoryBounds();

    // 11. Camada 4: Avalia Regras Condicionais Reativas (@inv.rules e @rule)
    this.evaluatedRules = [];
    const taggedRules = [
      ...this.ast.inventory.rules.map((r, i) => ({ rule: r, source: 'inventory' as const, fallbackId: `Sobrecarga/Inv #${i + 1}` })),
      ...this.ast.rules.map((r, i) => ({ rule: r, source: 'global' as const, fallbackId: `Regra #${i + 1}` })),
    ];

    for (const { rule, source, fallbackId } of taggedRules) {
      const condVal = this.evalExpr(rule.condition);
      const active = this.isTruthy(condVal);
      const ruleLabel = rule.id || fallbackId;
      if (active) {
        for (const eff of rule.effects) {
          this.applyEffect(eff, ruleLabel);
        }
      }
      this.evaluatedRules.push({
        id: ruleLabel,
        conditionText: this.exprToRawCode(rule.condition),
        isActive: active,
        effectSummaries: rule.effects.map((e) => this.formatEffectSummary(e)),
        source,
      });
    }

    const evaluatedDiagrams: Record<string, EvaluatedDiagram> = {};
    for (const diag of this.ast.diagrams) {
      evaluatedDiagrams[diag.id] = this.evaluateDiagramDecl(diag);
    }

    // Reavalia dependentes caso alguma Regra Condicional ou Nó de Diagrama tenha alterado um atributo/status base
    this.recalculateDerivedStats(dependencyOrder, statDeclMap, attrIds);

    // 12. Atualiza Fórmulas Finais de Perícias, Recursos e Habilidades
    this.finalizeSkillsAndResources();

    const evaluatedAbilities = this.ast.abilities.map((ab) => this.evaluateAbilityDecl(ab));
    const evaluatedTurnSlots: Record<string, EvaluatedResource> = {};
    for (const slot of this.ast.turn.slots) {
      const baseSlot = this.evaluateResourceDecl(
        {
          type: 'ResourceDecl',
          ...slot,
        },
        false,
        false,
      );
      const turnOv = this.overrides.turnSlots?.[slot.id];
      if (turnOv && turnOv.current !== undefined) {
        baseSlot.current = Math.max(0, Math.min(baseSlot.max, turnOv.current));
      }
      evaluatedTurnSlots[slot.id] = baseSlot;
    }

    const resolutionMap: Record<string, (typeof this.ast.resolutions)[0]> = {};
    for (const r of this.ast.resolutions) {
      resolutionMap[r.id] = r;
    }

    const evaluatedSlots = this.evaluateSlotsBlocks();
    const evaluatedProfiles = this.evaluateProfileBlocks(metaProps);
    const evaluatedCounters = this.evaluateCounterBlocks();
    const tabs = [...this.ast.tabs];
    if (tabs.length === 0) {
      tabs.push({ id: 'Geral', label: 'Geral' });
    }

    const themeRaw = String(
      metaProps.theme ??
        metaProps.tema ??
        metaProps.cor ??
        metaProps.color ??
        '',
    ).toLowerCase();

    let theme: import('./types').SheetTheme = 'purple';
    if (
      themeRaw === 'red' ||
      themeRaw === 'vermelho' ||
      themeRaw === 'sangue' ||
      themeRaw === 'crimson'
    ) {
      theme = 'red';
    } else if (
      themeRaw === 'blue' ||
      themeRaw === 'azul' ||
      themeRaw === 'ciano' ||
      themeRaw === 'ocean'
    ) {
      theme = 'blue';
    } else if (
      themeRaw === 'green' ||
      themeRaw === 'verde' ||
      themeRaw === 'emerald' ||
      themeRaw === 'floresta'
    ) {
      theme = 'green';
    } else if (
      themeRaw === 'purple' ||
      themeRaw === 'roxo' ||
      themeRaw === 'violeta' ||
      themeRaw === 'arcano'
    ) {
      theme = 'purple';
    } else if (
      themeRaw === 'amber' ||
      themeRaw === 'amarelo' ||
      themeRaw === 'ouro' ||
      themeRaw === 'gold'
    ) {
      theme = 'amber';
    } else if (
      themeRaw === 'dark' ||
      themeRaw === 'cinza' ||
      themeRaw === 'classico' ||
      themeRaw === 'padrao'
    ) {
      theme = 'dark';
    } else {
      const allMetaTags = new Set(this.ast.meta.tags.map((t) => t.toLowerCase()));
      if (allMetaTags.has('vermelho') || allMetaTags.has('red') || allMetaTags.has('sangue')) {
        theme = 'red';
      } else if (allMetaTags.has('azul') || allMetaTags.has('blue')) {
        theme = 'blue';
      } else if (allMetaTags.has('verde') || allMetaTags.has('green')) {
        theme = 'green';
      } else if (allMetaTags.has('roxo') || allMetaTags.has('purple')) {
        theme = 'purple';
      } else if (allMetaTags.has('amber') || allMetaTags.has('amarelo')) {
        theme = 'amber';
      } else if (allMetaTags.has('cinza') || allMetaTags.has('dark') || allMetaTags.has('classico')) {
        theme = 'dark';
      }
    }

    return {
      meta: {
        name: String(metaProps.name ?? 'Sem Nome'),
        archetype: metaProps.archetype !== undefined ? String(metaProps.archetype) : undefined,
        system: metaProps.system !== undefined ? String(metaProps.system) : undefined,
        level: typeof metaProps.level === 'number' ? metaProps.level : undefined,
        theme,
        props: metaProps,
        tags: this.ast.meta.tags,
      },
      profiles: evaluatedProfiles,
      counters: evaluatedCounters,
      texts: this.evaluateTextBlocks(),
      moduleLayouts: this.ast.moduleLayouts,
      ranks: this.rankGroups,
      attributes: this.attributes,
      stats: this.stats,
      resources: this.resources,
      turn: {
        reset: this.ast.turn.reset,
        slots: evaluatedTurnSlots,
        conversions: this.ast.turn.conversions,
      },
      descriptors: this.ast.descriptors.map((d) => {
        const defaultActive =
          d.meta.flags.includes('active') ||
          this.evalBoolProp(d.meta.props.active, d.effects.length > 0 && d.kind !== 'consequence');
        const active =
          this.overrides.toggles && d.id in this.overrides.toggles
            ? this.overrides.toggles[d.id]
            : defaultActive;
        return {
          kind: d.kind,
          id: d.id,
          label: d.label || d.id,
          value: d.valueExpr ? this.evalExpr(d.valueExpr) : undefined,
          active,
          hasEffects: d.effects.length > 0 || d.kind === 'aspect' || d.kind === 'tag' || d.kind === 'consequence',
          effectSummaries: d.effects.map((e) => this.formatEffectSummary(e)),
          tags: d.meta.tags,
          tab: d.tab,
          blockTitle: d.blockTitle,
        };
      }),
      skills: this.skills,
      inventory: {
        unit: String(
          this.ast.inventory.config.unit
            ? this.evalExpr(this.ast.inventory.config.unit)
            : 'espacos',
        ),
        currentLoad: this.currentLoad,
        maxCapacity: this.maxCapacity,
        overloadLimit: this.overloadLimit,
        isOverloaded: this.currentLoad > this.maxCapacity,
        items: this.items,
        title: this.ast.inventory.title,
        tab: this.ast.inventory.tab,
      },
      abilities: evaluatedAbilities,
      slots: evaluatedSlots,
      diagrams: evaluatedDiagrams,
      tables: this.tableMap,
      resolutions: resolutionMap,
      rules: this.evaluatedRules,
      tabs,
      blockTitles: {
        attributes: this.ast.blockTitles.attributes,
        stats: this.ast.blockTitles.stats,
        resources: this.ast.blockTitles.resources,
        skills: this.ast.blockTitles.skills,
        inventory: this.ast.blockTitles.inventory,
        abilities: this.ast.blockTitles.abilities,
        slots: this.ast.blockTitles.slots,
        descriptors: this.ast.blockTitles.descriptors,
        counters: this.ast.blockTitles.counters,
        text: this.ast.blockTitles.text,
        turn: this.ast.blockTitles.turn,
      },
      diagnostics: this.diagnostics,
      dependencyOrder,
    };
  }

  private evaluateProfileBlocks(metaProps: Record<string, EvaluatedValue>): EvaluatedProfileBlock[] {
    const out: EvaluatedProfileBlock[] = [];

    for (const block of this.ast.profiles) {
      const evaluatedProps: Record<string, EvaluatedValue> = {};
      for (const [k, expr] of Object.entries(block.props)) {
        evaluatedProps[k.toLowerCase()] = this.evalExpr(expr);
      }

      const allFlagsAndTags = new Set([
        ...block.meta.tags.map((t) => t.toLowerCase()),
        ...block.meta.flags.map((f) => f.toLowerCase()),
      ]);

      const sizeRaw = String(
        evaluatedProps.size ?? evaluatedProps.tamanho ?? '',
      ).toLowerCase();
      let size: EvaluatedProfileBlock['size'] = 'md';
      if (
        sizeRaw === 'sm' ||
        sizeRaw === 'small' ||
        sizeRaw === 'pequeno' ||
        sizeRaw === 'pequena' ||
        sizeRaw === 'imagemzinha' ||
        allFlagsAndTags.has('sm') ||
        allFlagsAndTags.has('small') ||
        allFlagsAndTags.has('pequeno') ||
        allFlagsAndTags.has('pequena') ||
        allFlagsAndTags.has('imagemzinha')
      ) {
        size = 'sm';
      } else if (
        sizeRaw === 'lg' ||
        sizeRaw === 'large' ||
        sizeRaw === 'grande' ||
        sizeRaw === 'imagemzona' ||
        allFlagsAndTags.has('lg') ||
        allFlagsAndTags.has('large') ||
        allFlagsAndTags.has('grande') ||
        allFlagsAndTags.has('imagemzona')
      ) {
        size = 'lg';
      } else if (
        sizeRaw === 'banner' ||
        sizeRaw === 'capa' ||
        allFlagsAndTags.has('banner') ||
        allFlagsAndTags.has('capa')
      ) {
        size = 'banner';
      } else if (
        sizeRaw === 'avatar-only' ||
        sizeRaw === 'so_imagem' ||
        sizeRaw === 'imagem' ||
        allFlagsAndTags.has('avatar-only') ||
        allFlagsAndTags.has('so_imagem') ||
        allFlagsAndTags.has('only-image')
      ) {
        size = 'avatar-only';
      }

      const rawImg =
        evaluatedProps.image ??
        evaluatedProps.img ??
        evaluatedProps.avatar ??
        evaluatedProps.foto ??
        evaluatedProps.url ??
        metaProps.avatar ??
        metaProps.image;
      const imageUrl =
        typeof rawImg === 'string' && rawImg.trim().length > 0 ? rawImg.trim() : undefined;
      const showImage =
        !allFlagsAndTags.has('no_image') &&
        !allFlagsAndTags.has('sem_imagem') &&
        (imageUrl !== undefined ||
          'image' in evaluatedProps ||
          'img' in evaluatedProps ||
          'avatar' in evaluatedProps ||
          allFlagsAndTags.has('image') ||
          allFlagsAndTags.has('img') ||
          allFlagsAndTags.has('avatar') ||
          size === 'avatar-only' ||
          size === 'sm' ||
          size === 'lg' ||
          size === 'banner');

      const hasExplicitName =
        'name' in evaluatedProps ||
        'nome' in evaluatedProps ||
        allFlagsAndTags.has('name') ||
        allFlagsAndTags.has('nome');
      const nameVal = evaluatedProps.name ?? evaluatedProps.nome ?? (hasExplicitName ? metaProps.name : undefined);

      const hasExplicitArchetype =
        'archetype' in evaluatedProps ||
        'arquetipo' in evaluatedProps ||
        'arquétipo' in evaluatedProps ||
        'classe' in evaluatedProps ||
        'class' in evaluatedProps ||
        allFlagsAndTags.has('archetype') ||
        allFlagsAndTags.has('arquetipo') ||
        allFlagsAndTags.has('classe');
      const archVal =
        evaluatedProps.archetype ??
        evaluatedProps.arquetipo ??
        evaluatedProps['arquétipo'] ??
        evaluatedProps.classe ??
        evaluatedProps.class ??
        (hasExplicitArchetype ? metaProps.archetype : undefined);

      const hasExplicitSystem =
        'system' in evaluatedProps ||
        'sistema' in evaluatedProps ||
        allFlagsAndTags.has('system') ||
        allFlagsAndTags.has('sistema');
      const sysVal =
        evaluatedProps.system ??
        evaluatedProps.sistema ??
        (hasExplicitSystem ? metaProps.system : undefined);

      const hasExplicitLevel =
        'level' in evaluatedProps ||
        'nivel' in evaluatedProps ||
        'nível' in evaluatedProps ||
        'nex' in evaluatedProps ||
        allFlagsAndTags.has('level') ||
        allFlagsAndTags.has('nivel') ||
        allFlagsAndTags.has('nex');
      const lvlVal =
        evaluatedProps.level ??
        evaluatedProps.nivel ??
        evaluatedProps['nível'] ??
        evaluatedProps.nex ??
        (hasExplicitLevel ? metaProps.level ?? metaProps.nex : undefined);

      const hasExplicitDesc =
        'desc' in evaluatedProps ||
        'descricao' in evaluatedProps ||
        'descrição' in evaluatedProps ||
        'bio' in evaluatedProps ||
        'historia' in evaluatedProps ||
        allFlagsAndTags.has('desc') ||
        allFlagsAndTags.has('descricao') ||
        allFlagsAndTags.has('bio');
      const descVal =
        evaluatedProps.desc ??
        evaluatedProps.descricao ??
        evaluatedProps['descrição'] ??
        evaluatedProps.bio ??
        evaluatedProps.historia;

      const reservedProfileKeys = new Set([
        'image',
        'img',
        'avatar',
        'foto',
        'url',
        'name',
        'nome',
        'archetype',
        'arquetipo',
        'arquétipo',
        'classe',
        'class',
        'system',
        'sistema',
        'level',
        'nivel',
        'nível',
        'nex',
        'desc',
        'descricao',
        'descrição',
        'bio',
        'historia',
        'size',
        'tamanho',
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
        'display',
        'modo',
        'style',
        'align',
        'theme',
        'tema',
        ...SheetAnalyzer.RESERVED_META_KEYS,
      ]);

      const toNumOrUndef = (v: EvaluatedValue | undefined): number | undefined => {
        if (typeof v === 'number' && !Number.isNaN(v)) return v;
        if (typeof v === 'string' && v.trim() !== '') {
          const parsed = Number(v.replace(/px$/i, '').trim());
          if (!Number.isNaN(parsed)) return parsed;
        }
        return undefined;
      };

      const imgWidth = toNumOrUndef(
        evaluatedProps.w ?? evaluatedProps.width ?? evaluatedProps.largura,
      );
      const imgHeight = toNumOrUndef(
        evaluatedProps.h ?? evaluatedProps.height ?? evaluatedProps.altura,
      );
      const imgOffsetX = toNumOrUndef(
        evaluatedProps.x ?? evaluatedProps.px ?? evaluatedProps.offset_x,
      );
      const imgOffsetY = toNumOrUndef(
        evaluatedProps.y ?? evaluatedProps.py ?? evaluatedProps.offset_y,
      );
      const rawScale = toNumOrUndef(
        evaluatedProps.scale ?? evaluatedProps.zoom ?? evaluatedProps.escala,
      );
      const imgScale =
        rawScale !== undefined
          ? rawScale > 10
            ? rawScale / 100
            : rawScale
          : undefined;

      const rawFit = String(
        evaluatedProps.fit ?? evaluatedProps.ajuste ?? '',
      ).toLowerCase();
      let imgFit: 'contain' | 'cover' | 'auto' = 'contain';
      if (
        rawFit === 'cover' ||
        rawFit === 'preencher' ||
        rawFit === 'crop' ||
        allFlagsAndTags.has('cover') ||
        allFlagsAndTags.has('preencher')
      ) {
        imgFit = 'cover';
      } else if (
        rawFit === 'auto' ||
        rawFit === 'natural' ||
        rawFit === 'full_img' ||
        allFlagsAndTags.has('natural')
      ) {
        imgFit = 'auto';
      }

      const extraFields: Array<{ key: string; label: string; value: string }> = [];
      for (const [rawKey, expr] of Object.entries(block.props)) {
        const lower = rawKey.toLowerCase();
        if (!reservedProfileKeys.has(lower)) {
          const v = this.evalExpr(expr);
          if (v !== null && v !== undefined && String(v).trim() !== '') {
            extraFields.push({
              key: rawKey,
              label: rawKey.replace(/_/g, ' '),
              value: String(v),
            });
          }
        }
      }

      let textPos: import('./types').ProfileTextPosition = block.textPos ?? 'side';
      const posProp =
        evaluatedProps.text_pos ??
        evaluatedProps.pos ??
        evaluatedProps.layout ??
        evaluatedProps.alinhamento;
      if (posProp) {
        const s = String(posProp).toLowerCase();
        if (s === 'bottom' || s === 'baixo' || s === 'embaixo' || s === 'inferior') {
          textPos = 'bottom';
        } else if (s === 'top' || s === 'topo' || s === 'cima' || s === 'superior') {
          textPos = 'top';
        } else if (s === 'side' || s === 'lado' || s === 'lateral') {
          textPos = 'side';
        } else if (s === 'none' || s === 'so_imagem' || s === 'avatar-only' || s === 'sem_texto') {
          textPos = 'none';
        }
      }

      if (!block.textPos && !posProp) {
        if (
          allFlagsAndTags.has('bottom') ||
          allFlagsAndTags.has('baixo') ||
          allFlagsAndTags.has('embaixo')
        ) {
          textPos = 'bottom';
        } else if (
          allFlagsAndTags.has('top') ||
          allFlagsAndTags.has('topo') ||
          allFlagsAndTags.has('cima')
        ) {
          textPos = 'top';
        } else if (
          allFlagsAndTags.has('side') ||
          allFlagsAndTags.has('lado')
        ) {
          textPos = 'side';
        } else if (
          allFlagsAndTags.has('none') ||
          allFlagsAndTags.has('so_imagem') ||
          allFlagsAndTags.has('avatar-only')
        ) {
          textPos = 'none';
        } else if (block.tall || size === 'lg' || size === 'banner' || block.display === 'pyramid') {
          textPos = 'bottom';
        }
      }

      const isAvatarOnly =
        size === 'avatar-only' ||
        textPos === 'none' ||
        (!hasExplicitName &&
          !hasExplicitArchetype &&
          !hasExplicitSystem &&
          !hasExplicitLevel &&
          !hasExplicitDesc &&
          extraFields.length === 0);

      out.push({
        id: block.id,
        title: block.title,
        tab: block.tab,
        placement: block.placement,
        display: block.display,
        tall: block.tall,
        size,
        textPos,
        imageUrl,
        imgWidth,
        imgHeight,
        imgOffsetX,
        imgOffsetY,
        imgScale,
        imgFit,
        name: nameVal !== undefined ? String(nameVal) : undefined,
        archetype: archVal !== undefined ? String(archVal) : undefined,
        system: sysVal !== undefined ? String(sysVal) : undefined,
        level: lvlVal !== undefined && typeof lvlVal !== 'object' ? lvlVal : undefined,
        description: descVal !== undefined ? String(descVal) : undefined,
        showImage: showImage || isAvatarOnly,
        showName: !isAvatarOnly && hasExplicitName && nameVal !== undefined,
        showArchetype: !isAvatarOnly && hasExplicitArchetype && archVal !== undefined,
        showSystem: !isAvatarOnly && hasExplicitSystem && sysVal !== undefined,
        showLevel: !isAvatarOnly && hasExplicitLevel && lvlVal !== undefined,
        showDesc: !isAvatarOnly && hasExplicitDesc && descVal !== undefined,
        extraFields,
      });
    }

    return out;
  }

  private evaluateTextBlocks(): import('./types').EvaluatedTextBlock[] {
    const out: import('./types').EvaluatedTextBlock[] = [];
    for (const block of this.ast.texts) {
      const paragraphs: string[] = [];
      for (const rawParagraph of block.content) {
        const interpolated = this.interpolateText(rawParagraph);
        paragraphs.push(interpolated);
      }
      const content = paragraphs.join('\n\n');
      out.push({
        id: block.id,
        title: block.title,
        tab: block.tab,
        placement: block.placement,
        display: block.display,
        tall: block.tall,
        content,
        paragraphs,
        tags: block.meta.tags,
      });
    }
    return out;
  }

  private evaluateCounterBlocks(): EvaluatedCounterBlock[] {
    const out: EvaluatedCounterBlock[] = [];
    for (const block of this.ast.counters) {
      const items: EvaluatedCounterItem[] = block.items.map((item) => {
        const ovKey = `${block.id}.${item.id}`;
        const ov =
          this.overrides.counters?.[ovKey] ?? this.overrides.counters?.[item.id];
        const max = Math.max(1, item.max);
        const current =
          ov && ov.current !== undefined
            ? Math.max(0, Math.min(max, ov.current))
            : Math.max(0, Math.min(max, item.current));
        return {
          id: item.id,
          label: item.label || item.id,
          current,
          max,
          style: item.style,
          color: item.color,
          tags: item.meta.tags,
        };
      });

      out.push({
        id: block.id,
        title: block.title,
        tab: block.tab,
        placement: block.placement,
        display: block.display,
        items,
      });
    }
    return out;
  }

  private evaluateSlotsBlocks(): EvaluatedSlotsBlock[] {
    const evaluatedBlocks: EvaluatedSlotsBlock[] = [];
    for (const block of this.ast.slots) {
      const items: EvaluatedSlotItem[] = [];
      for (const s of block.slots) {
        let state = s.state;
        let current = s.current;
        let content = s.content;

        const slotKey = `${block.id}.${s.id}`;
        const ov = this.overrides.slots?.[slotKey] ?? this.overrides.slots?.[s.id];
        if (ov) {
          if (ov.state) state = ov.state;
          if (ov.current !== undefined) current = ov.current;
          if (ov.content !== undefined) content = ov.content;
        }

        items.push({
          id: s.id,
          label: s.label || s.id,
          state,
          content,
          current,
          max: s.max,
          tags: s.meta.tags,
        });
      }

      evaluatedBlocks.push({
        id: block.id,
        title: block.title,
        tab: block.tab,
        cols: block.cols ?? 3,
        slots: items,
      });
    }
    return evaluatedBlocks;
  }

  // ==========================================================================
  // 1. GRAFO ACÍCLICO DIRIGIDO (DAG) & DETECÇÃO DE CICLOS (DFS 3-CORES)
  // ==========================================================================

  private buildTopologicalOrder(decls: ASTStatDecl[]): string[] {
    const declMap = new Map<string, ASTStatDecl>();
    for (const d of decls) {
      declMap.set(d.id, d);
    }

    const adj = new Map<string, Set<string>>();
    for (const d of decls) {
      const refs = new Set<string>();
      this.collectIdentifiers(d.expr, refs);
      // Filtra apenas dependências que são outros nós de stat/attr
      const validDeps = new Set<string>();
      for (const r of refs) {
        if (r !== d.id && declMap.has(r)) {
          validDeps.add(r);
        }
      }
      adj.set(d.id, validDeps);
    }

    // 0 = Branco (Não visitado), 1 = Cinza (Na pilha atual), 2 = Preto (Concluído)
    const state = new Map<string, 0 | 1 | 2>();
    for (const d of decls) state.set(d.id, 0);

    const order: string[] = [];
    const pathStack: string[] = [];

    const dfs = (nodeId: string) => {
      state.set(nodeId, 1);
      pathStack.push(nodeId);

      const deps = adj.get(nodeId) ?? new Set();
      for (const dep of deps) {
        const depState = state.get(dep) ?? 0;
        if (depState === 0) {
          dfs(dep);
        } else if (depState === 1) {
          // Ciclo detectado!
          const cycleStartIdx = pathStack.indexOf(dep);
          const cyclePath = [...pathStack.slice(cycleStartIdx), dep].join(' -> ');
          const decl = declMap.get(nodeId)!;
          this.diagnostics.push({
            severity: 'error',
            stage: 'semantic',
            message: `Dependência circular detectada: ${cyclePath}.`,
            span: decl.span,
            symbol: nodeId,
          });
        }
      }

      pathStack.pop();
      state.set(nodeId, 2);
      order.push(nodeId);
    };

    for (const d of decls) {
      if (state.get(d.id) === 0) {
        dfs(d.id);
      }
    }

    return order;
  }

  private collectIdentifiers(expr: ASTExpr, out: Set<string>): void {
    switch (expr.type) {
      case 'Ident':
        out.add(expr.name);
        break;
      case 'MemberExpr':
        out.add(expr.object);
        break;
      case 'UnaryExpr':
        this.collectIdentifiers(expr.operand, out);
        break;
      case 'BinaryExpr':
        this.collectIdentifiers(expr.left, out);
        this.collectIdentifiers(expr.right, out);
        break;
      case 'RangeExpr':
        this.collectIdentifiers(expr.min, out);
        this.collectIdentifiers(expr.max, out);
        break;
      case 'TernaryExpr':
        this.collectIdentifiers(expr.condition, out);
        this.collectIdentifiers(expr.consequent, out);
        this.collectIdentifiers(expr.alternate, out);
        break;
      case 'CallExpr':
        for (const arg of expr.args) this.collectIdentifiers(arg, out);
        break;
      case 'ArrayExpr':
        for (const el of expr.elements) this.collectIdentifiers(el, out);
        break;
      case 'DiceExpr':
        this.collectIdentifiers(expr.count, out);
        if (expr.faces !== 'F') this.collectIdentifiers(expr.faces, out);
        break;
    }
  }

  // ==========================================================================
  // 2. AVALIADOR DE DECLARAÇÕES E CAMADAS DE MODIFICADORES
  // ==========================================================================

  private static readonly RESERVED_META_KEYS = new Set([
    'roll',
    'rolagem',
    'min',
    'max',
    'temp',
    'color',
    'cor',
    'tab',
    'aba',
    'title',
    'titulo',
    'cols',
    'colunas',
    'reset',
    'active',
    'ativo',
    'type',
    'tipo',
    'cost',
    'custo',
    'resource',
    'recurso',
    'range',
    'alcance',
    'circle',
    'circulo',
    'element',
    'elemento',
    'requires',
    'requer',
    'weight',
    'peso',
    'qty',
    'qtd',
    'category',
    'categoria',
    'state',
    'estado',
    'col',
    'coluna',
    'span',
    'placement',
    'pos',
    'layout',
    'display',
    'modo',
    'view',
    'estilo',
    'style',
    'size',
    'tamanho',
  ]);

  private static readonly COLOR_TAG_ALIASES: Record<string, string> = {
    red: 'red',
    vermelho: 'red',
    crimson: 'crimson',
    sangue: 'crimson',
    blue: 'blue',
    azul: 'blue',
    amber: 'amber',
    amarelo: 'amber',
    dourado: 'amber',
    purple: 'purple',
    roxo: 'purple',
    green: 'green',
    verde: 'green',
    emerald: 'green',
    cyan: 'blue',
    ciano: 'blue',
  };

  private evaluateBaseStatDecl(decl: ASTStatDecl): EvaluatedStat {
    const val = this.evalExpr(decl.expr);
    const isLocked = decl.mode === 'lock' || decl.meta.flags.includes('lock');
    const numVal = this.toNumber(val);

    this.symbolValues[decl.id] = val;

    const children: Record<string, EvaluatedValue> = {};
    // Sub-propriedades inline nos colchetes: [bom: floor(self / 2), extremo: floor(self / 5)]
    for (const [propKey, propExpr] of Object.entries(decl.meta.props)) {
      if (!SheetAnalyzer.RESERVED_META_KEYS.has(propKey.toLowerCase())) {
        const propVal = this.evalExpr(propExpr, { selfVal: val });
        children[propKey] = propVal;
        this.symbolValues[`${decl.id}.${propKey}`] = propVal;
      }
    }
    for (const child of decl.children) {
      const childVal = this.evalExpr(child.expr, { selfVal: val });
      children[child.id] = childVal;
      this.symbolValues[`${decl.id}.${child.id}`] = childVal;
    }

    let rollFormula: string | undefined;
    let rollAst: ASTExpr | undefined;
    const rollExpr = decl.meta.props.roll ?? decl.meta.props.rolagem;
    if (rollExpr) {
      rollAst = rollExpr;
      if (rollExpr.type === 'StringLit') {
        rollFormula = rollExpr.value;
      } else {
        rollFormula = this.exprToRawCode(rollExpr);
      }
      rollFormula = rollFormula.replace(/\(self\)/g, String(val)).replace(/\bself\b/g, String(val));
    }

    return {
      id: decl.id,
      label: decl.label || decl.id,
      baseValue: val,
      finalValue: val,
      mode: decl.mode,
      locked: isLocked,
      traces: [{ source: 'Base', op: decl.mode, value: numVal }],
      children,
      tags: decl.meta.tags,
      rollFormula,
      rollAst,
      tab: decl.tab,
      blockTitle: decl.blockTitle,
    };
  }

  private evaluateBaseSkillDecl(decl: ASTSheetDocument['skills'][0]): EvaluatedSkill {
    const baseAttrVal = decl.baseAttr ? this.symbolValues[decl.baseAttr] ?? 0 : undefined;
    const rawVal = this.evalExpr(decl.expr, {
      attrVal: baseAttrVal,
      attrName: decl.baseAttr,
    });
    const bonus = this.toNumber(rawVal);
    const isLocked = decl.mode === 'lock' || decl.meta.flags.includes('lock');

    this.symbolValues[decl.id] = bonus;

    const children: Record<string, EvaluatedValue> = {};
    for (const [propKey, propExpr] of Object.entries(decl.meta.props)) {
      if (!SheetAnalyzer.RESERVED_META_KEYS.has(propKey.toLowerCase())) {
        const propVal = this.evalExpr(propExpr, { selfVal: bonus, attrVal: baseAttrVal });
        children[propKey] = propVal;
        this.symbolValues[`${decl.id}.${propKey}`] = propVal;
      }
    }
    for (const child of decl.children) {
      const childVal = this.evalExpr(child.expr, { selfVal: bonus, attrVal: baseAttrVal });
      children[child.id] = childVal;
      this.symbolValues[`${decl.id}.${child.id}`] = childVal;
    }

    const rollAst = decl.rollOverride ?? this.ast.defaultSkillRoll;
    const rollFormula = this.formatRollFormula(rollAst, decl.baseAttr, baseAttrVal, bonus);

    return {
      id: decl.id,
      label: decl.label || decl.id,
      baseAttr: decl.baseAttr,
      baseAttrValue: baseAttrVal,
      bonus,
      mode: decl.mode,
      locked: isLocked,
      traces: [{ source: 'Base', op: decl.mode, value: bonus }],
      rollFormula,
      rollAst,
      children,
      tags: decl.meta.tags,
      tab: decl.tab,
      blockTitle: decl.blockTitle,
    };
  }

  private evaluateResourceDecl(
    decl: ASTResourceDecl,
    applyOverride = true,
    registerGlobalSymbols = true,
  ): EvaluatedResource {
    const baseCurVal = this.toNumber(this.evalExpr(decl.currentExpr));
    const maxVal = decl.maxExpr ? this.toNumber(this.evalExpr(decl.maxExpr)) : baseCurVal;
    const minVal = decl.meta.props.min ? this.toNumber(this.evalExpr(decl.meta.props.min)) : 0;
    const baseTempVal = decl.meta.props.temp ? this.toNumber(this.evalExpr(decl.meta.props.temp)) : 0;
    const colorExpr = decl.meta.props.color ?? decl.meta.props.cor;
    let color: string | undefined;
    if (colorExpr) {
      color = colorExpr.type === 'Ident' ? colorExpr.name : String(this.evalExpr(colorExpr));
      if (SheetAnalyzer.COLOR_TAG_ALIASES[color.toLowerCase()]) {
        color = SheetAnalyzer.COLOR_TAG_ALIASES[color.toLowerCase()];
      }
    } else {
      for (const tag of decl.meta.tags) {
        const mapped = SheetAnalyzer.COLOR_TAG_ALIASES[tag.toLowerCase()];
        if (mapped) {
          color = mapped;
          break;
        }
      }
    }

    const ov = applyOverride ? this.overrides.resources?.[decl.id] : undefined;
    let curVal = ov?.current !== undefined ? ov.current : baseCurVal;
    const tempVal = ov?.temp !== undefined ? ov.temp : baseTempVal;

    let boxes: string[] | undefined;
    if (decl.kind === 'track') {
      const states = decl.states && decl.states.length > 0 ? decl.states : ['.', '/', 'X'];
      const filledState = states[1] ?? '/';
      const emptyState = states[0] ?? '.';
      const boxCount = Math.max(0, maxVal);
      if (ov?.boxes && ov.boxes.length === boxCount) {
        boxes = [...ov.boxes];
        curVal = boxes.filter((b) => b !== emptyState).length;
      } else {
        boxes = Array.from({ length: boxCount }, (_, idx) =>
          idx < curVal ? filledState : emptyState,
        );
      }
    }

    if (registerGlobalSymbols) {
      this.symbolValues[decl.id] = curVal;
      this.symbolValues[`${decl.id}.current`] = curVal;
      this.symbolValues[`${decl.id}.max`] = maxVal;
      this.symbolValues[`${decl.id}.temp`] = tempVal;
    }

    return {
      id: decl.id,
      label: decl.label || decl.id,
      kind: decl.kind,
      current: curVal,
      max: maxVal,
      min: minVal,
      temp: tempVal,
      states: decl.states,
      boxes,
      color,
      tags: decl.meta.tags,
      tab: decl.tab,
      blockTitle: decl.blockTitle,
    };
  }

  private evaluateInventoryItems(): void {
    this.items = [];
    this.currentLoad = 0;

    for (const itemDecl of this.ast.inventory.items) {
      const weight = itemDecl.meta.props.weight
        ? this.toNumber(this.evalExpr(itemDecl.meta.props.weight))
        : itemDecl.meta.props.peso
          ? this.toNumber(this.evalExpr(itemDecl.meta.props.peso))
          : 1;

      const baseQty = itemDecl.meta.props.qty
        ? this.toNumber(this.evalExpr(itemDecl.meta.props.qty))
        : itemDecl.meta.props.qtd
          ? this.toNumber(this.evalExpr(itemDecl.meta.props.qtd))
          : 1;

      let state: 'equipped' | 'carried' | 'stash' = 'carried';
      const stateProp = itemDecl.meta.props.state
        ? String(this.evalExpr(itemDecl.meta.props.state)).toLowerCase()
        : undefined;

      if (itemDecl.meta.flags.includes('stash') || stateProp === 'stash' || stateProp === 'guardado') {
        state = 'stash';
      } else if (itemDecl.meta.flags.includes('carried') || stateProp === 'carried' || stateProp === 'mochila') {
        state = 'carried';
      } else if (
        itemDecl.meta.flags.includes('equipped') ||
        stateProp === 'equipped' ||
        stateProp === 'equipado' ||
        itemDecl.effects.length > 0
      ) {
        state = 'equipped';
      }

      const itemOv = this.overrides.itemStates?.[itemDecl.id];
      const qty = itemOv?.qty !== undefined ? Math.max(0, itemOv.qty) : baseQty;
      if (itemOv?.state) {
        state = itemOv.state;
      }

      const totalWeight = state === 'stash' ? 0 : Math.max(0, weight * qty);
      this.currentLoad += totalWeight;

      const desc = itemDecl.props.desc ? this.interpolateText(String(this.evalExpr(itemDecl.props.desc))) : undefined;
      const category = itemDecl.meta.props.category
        ? (this.evalExpr(itemDecl.meta.props.category) as string | number)
        : undefined;

      this.items.push({
        id: itemDecl.id,
        label: itemDecl.label || itemDecl.id,
        weight,
        qty,
        totalWeight,
        state,
        category,
        desc,
        effectSummaries: itemDecl.effects.map((e) => this.formatEffectSummary(e)),
        tags: itemDecl.meta.tags,
        actions: itemDecl.actions.map((act) => this.evaluateAbilityDecl(act)),
      });
    }

    this.symbolValues.current_load = this.currentLoad;
    this.symbolValues.carga_atual = this.currentLoad;
  }

  private recalculateInventoryBounds(): void {
    const cfg = this.ast.inventory.config;
    const maxExpr = cfg.max_load ?? cfg.max_capacity ?? cfg.capacidade;

    if (maxExpr) {
      this.maxCapacity = this.toNumber(this.evalExpr(maxExpr));
      this.symbolValues.max_load = this.maxCapacity;
      this.symbolValues.max_capacity = this.maxCapacity;
    } else {
      const forVal = this.toNumber(this.symbolValues.FOR ?? this.symbolValues.Forca ?? 1);
      this.maxCapacity = forVal > 0 ? forVal * 5 : 2;
      this.symbolValues.max_load = this.maxCapacity;
      this.symbolValues.max_capacity = this.maxCapacity;
    }

    const overExpr = cfg.overload_limit ?? cfg.limite_sobrecarga;
    this.overloadLimit = overExpr
      ? this.toNumber(this.evalExpr(overExpr))
      : this.maxCapacity * 2;
    this.symbolValues.overload_limit = this.overloadLimit;

    if (cfg.current_load) {
      this.currentLoad = this.toNumber(this.evalExpr(cfg.current_load));
      this.symbolValues.current_load = this.currentLoad;
    }
  }

  private applyEffect(eff: ASTEffectStmt, sourceLabel: string): void {
    const val = this.evalExpr(eff.expr);
    const numDelta = this.toNumber(val);

    // 1. Verifica se o alvo é uma sub-propriedade de recurso (ex: PV.max, PV.temp, PV.current)
    if (eff.target.includes('.')) {
      const [objName, propName] = eff.target.split('.');
      const res = this.resources[objName];
      if (res) {
        if (propName === 'max') {
          if (eff.op === 'add') res.max += numDelta;
          else if (eff.op === 'sub') res.max -= numDelta;
          else res.max = numDelta;
          this.symbolValues[`${objName}.max`] = res.max;
        } else if (propName === 'current') {
          if (eff.op === 'add') res.current += numDelta;
          else if (eff.op === 'sub') res.current -= numDelta;
          else res.current = numDelta;
          this.symbolValues[objName] = res.current;
          this.symbolValues[`${objName}.current`] = res.current;
        } else if (propName === 'temp') {
          if (eff.op === 'add') res.temp += numDelta;
          else if (eff.op === 'sub') res.temp -= numDelta;
          else res.temp = numDelta;
          this.symbolValues[`${objName}.temp`] = res.temp;
        }
        return;
      }
    }

    // 2. Verifica se o alvo é um Atributo ou Status
    const targetStat = this.attributes[eff.target] ?? this.stats[eff.target];
    if (targetStat) {
      if (targetStat.locked && eff.op !== 'lock') {
        return; // Ignora modificações se estiver travado com !lock / :!
      }

      if (eff.op === 'lock') {
        targetStat.finalValue = val;
        targetStat.locked = true;
      } else if (eff.op === 'pin' || eff.op === 'calc') {
        targetStat.finalValue = val;
      } else if (typeof targetStat.finalValue === 'object' && targetStat.finalValue.kind === 'step_die') {
        // Bônus em Step-Die sobe ou desce o passo do dado!
        const stepDelta = eff.op === 'sub' ? -numDelta : numDelta;
        targetStat.finalValue = this.stepDie(targetStat.finalValue.faces, stepDelta);
      } else {
        const curNum = this.toNumber(targetStat.finalValue);
        targetStat.finalValue = eff.op === 'sub' ? curNum - numDelta : curNum + numDelta;
      }

      targetStat.traces.push({
        source: sourceLabel,
        op: eff.op,
        value: eff.op === 'sub' ? -numDelta : numDelta,
      });
      this.symbolValues[eff.target] = targetStat.finalValue;
      return;
    }

    // 3. Verifica se o alvo é uma Perícia (@skill)
    const targetSkill = this.skills[eff.target];
    if (targetSkill) {
      if (targetSkill.locked && eff.op !== 'lock') return;

      if (eff.op === 'lock') {
        targetSkill.bonus = numDelta;
        targetSkill.locked = true;
      } else if (eff.op === 'pin' || eff.op === 'calc') {
        targetSkill.bonus = numDelta;
      } else {
        targetSkill.bonus = eff.op === 'sub' ? targetSkill.bonus - numDelta : targetSkill.bonus + numDelta;
      }

      targetSkill.traces.push({
        source: sourceLabel,
        op: eff.op,
        value: eff.op === 'sub' ? -numDelta : numDelta,
      });
      this.symbolValues[eff.target] = targetSkill.bonus;
      return;
    }

    // 4. Variável dinâmica criada sob demanda em @stats
    this.symbolValues[eff.target] = val;
    this.stats[eff.target] = {
      id: eff.target,
      label: eff.target,
      baseValue: 0,
      finalValue: eff.op === 'sub' ? -numDelta : val,
      mode: eff.op,
      locked: eff.op === 'lock',
      traces: [{ source: sourceLabel, op: eff.op, value: eff.op === 'sub' ? -numDelta : numDelta }],
      children: {},
      tags: [],
    };
  }

  private recalculateDerivedStats(
    order: string[],
    declMap: Map<string, ASTStatDecl>,
    attrIds: Set<string>,
  ): void {
    for (const id of order) {
      const decl = declMap.get(id);
      if (!decl) continue;
      const target = attrIds.has(id) ? this.attributes[id] : this.stats[id];
      if (!target || target.locked) continue;

      // Se for uma fórmula calculada ('calc'), reavalia a base com os novos símbolos
      if (decl.mode === 'calc') {
        const newBase = this.evalExpr(decl.expr);
        const modSum = target.traces
          .slice(1)
          .reduce((acc, t) => acc + t.value, 0);
        target.baseValue = newBase;
        target.traces[0] = { source: 'Base', op: 'calc', value: this.toNumber(newBase) };
        target.finalValue =
          typeof newBase === 'number' ? newBase + modSum : newBase;
        this.symbolValues[id] = target.finalValue;
      }

      // Reavalia sub-propriedades inline e filhas (ex: FOR.mod, FOR.bom)
      for (const [propKey, propExpr] of Object.entries(decl.meta.props)) {
        if (!SheetAnalyzer.RESERVED_META_KEYS.has(propKey.toLowerCase())) {
          const propVal = this.evalExpr(propExpr, { selfVal: target.finalValue });
          target.children[propKey] = propVal;
          this.symbolValues[`${id}.${propKey}`] = propVal;
        }
      }
      for (const child of decl.children) {
        const childVal = this.evalExpr(child.expr, { selfVal: target.finalValue });
        target.children[child.id] = childVal;
        this.symbolValues[`${id}.${child.id}`] = childVal;
      }
    }
  }

  private finalizeSkillsAndResources(): void {
    for (const skillDecl of this.ast.skills) {
      const sk = this.skills[skillDecl.id];
      if (!sk) continue;
      const baseAttrVal = sk.baseAttr ? this.symbolValues[sk.baseAttr] : undefined;
      sk.baseAttrValue = baseAttrVal;

      if (skillDecl.mode === 'calc' && !sk.locked) {
        const newBase = this.toNumber(
          this.evalExpr(skillDecl.expr, { attrVal: baseAttrVal, attrName: sk.baseAttr }),
        );
        const modSum = sk.traces.slice(1).reduce((acc, t) => acc + t.value, 0);
        sk.traces[0] = { source: 'Base', op: 'calc', value: newBase };
        sk.bonus = newBase + modSum;
        this.symbolValues[sk.id] = sk.bonus;
      }

      for (const [propKey, propExpr] of Object.entries(skillDecl.meta.props)) {
        if (!SheetAnalyzer.RESERVED_META_KEYS.has(propKey.toLowerCase())) {
          const propVal = this.evalExpr(propExpr, {
            selfVal: sk.bonus,
            attrVal: baseAttrVal,
          });
          sk.children[propKey] = propVal;
          this.symbolValues[`${sk.id}.${propKey}`] = propVal;
        }
      }
      for (const child of skillDecl.children) {
        const childVal = this.evalExpr(child.expr, {
          selfVal: sk.bonus,
          attrVal: baseAttrVal,
        });
        sk.children[child.id] = childVal;
        this.symbolValues[`${sk.id}.${child.id}`] = childVal;
      }

      sk.rollFormula = this.formatRollFormula(sk.rollAst, sk.baseAttr, baseAttrVal, sk.bonus);
    }

    for (const resDecl of this.ast.resources) {
      const existing = this.resources[resDecl.id];
      if (!existing) continue;
      if (resDecl.maxExpr) {
        const baseMax = this.toNumber(this.evalExpr(resDecl.maxExpr));
        // Preserva diferenças de bônus aplicadas diretamente em PV.max
        const prevBaseMax = this.toNumber(this.evalExpr(resDecl.maxExpr));
        if (existing.max === prevBaseMax) {
          existing.max = baseMax;
        }
        this.symbolValues[`${resDecl.id}.max`] = existing.max;
      }
    }
  }

  private evaluateAbilityDecl(decl: ASTAbilityDecl): EvaluatedAbility {
    const defaultActive =
      decl.meta.flags.includes('active') || this.evalBoolProp(decl.meta.props.active, false);
    const isActive =
      this.overrides.toggles && decl.id in this.overrides.toggles
        ? this.overrides.toggles[decl.id]
        : defaultActive;
    const isToggleable =
      decl.activeEffects.length > 0 ||
      decl.meta.flags.includes('active') ||
      decl.meta.props.active !== undefined;

    const actionTypeProp = decl.meta.props.type ?? decl.meta.props.tipo ?? decl.props.type ?? decl.props.execution;
    const actionType = actionTypeProp ? String(this.evalExpr(actionTypeProp)) : undefined;

    const rangeProp = decl.meta.props.range ?? decl.meta.props.alcance ?? decl.props.range;
    const range = rangeProp ? String(this.evalExpr(rangeProp)) : undefined;

    const rawDesc = decl.props.desc
      ? String(this.evalExpr(decl.props.desc))
      : decl.props.trigger
        ? String(this.evalExpr(decl.props.trigger))
        : '';
    const desc = this.interpolateText(rawDesc);

    const testAst = decl.props.test ?? decl.props.teste ?? decl.props.roll ?? decl.meta.props.roll;
    const testFormula = testAst ? this.exprToFormulaString(testAst) : undefined;

    const damageAst = decl.props.damage ?? decl.props.dano ?? decl.props.heal ?? decl.props.cura;
    const damageFormula = damageAst ? this.exprToFormulaString(damageAst) : undefined;

    let cost: { amount: number; resource: string } | undefined;
    const costExpr = decl.meta.props.cost ?? decl.meta.props.custo ?? decl.props.cost;
    if (costExpr) {
      const resProp = decl.meta.props.resource ?? decl.meta.props.recurso;
      cost = {
        amount: this.toNumber(this.evalExpr(costExpr)),
        resource: resProp
          ? resProp.type === 'Ident'
            ? resProp.name
            : String(this.evalExpr(resProp))
          : 'PE',
      };
    }

    const effectSummaries = [
      ...decl.passiveEffects.map((e) => this.formatEffectSummary(e)),
      ...decl.activeEffects.map((e) => `${this.formatEffectSummary(e)} (quando ativo)`),
    ];

    return {
      id: decl.id,
      label: decl.label || decl.id,
      category: decl.category,
      active: isActive,
      isToggleable,
      actionType,
      cost,
      range,
      desc,
      testFormula,
      testAst,
      damageFormula,
      damageAst,
      effectSummaries,
      choices: decl.choices,
      enhancements: decl.enhancements.map((enh) => {
        const enhResProp = enh.meta.props.resource ?? enh.meta.props.recurso;
        return {
          id: enh.id,
          label: enh.label,
          cost: enh.meta.props.cost ? this.toNumber(this.evalExpr(enh.meta.props.cost)) : undefined,
          resource: enhResProp
            ? enhResProp.type === 'Ident'
              ? enhResProp.name
              : String(this.evalExpr(enhResProp))
            : 'PE',
          requires: enh.meta.props.requires ? String(this.evalExpr(enh.meta.props.requires)) : undefined,
          desc: enh.props.desc ? this.interpolateText(String(this.evalExpr(enh.props.desc))) : undefined,
          damage: enh.props.damage ? this.exprToFormulaString(enh.props.damage) : undefined,
        };
      }),
      tags: decl.meta.tags,
      tab: decl.tab,
      blockTitle: decl.blockTitle,
    };
  }

  private evaluateDiagramDecl(decl: ASTSheetDocument['diagrams'][0]): EvaluatedDiagram {
    const layout = decl.meta.props.layout ? String(this.evalExpr(decl.meta.props.layout)) : 'grid';
    const hitRoll = decl.meta.props.hit_roll ? this.exprToFormulaString(decl.meta.props.hit_roll) : undefined;

    return {
      id: decl.id,
      layout,
      hitRoll,
      nodes: decl.nodes.map((node) => {
        const localVars: Record<string, EvaluatedValue> = {};
        const nodeResources: Record<string, EvaluatedResource> = {};
        for (const r of node.resources) {
          const evalRes = this.evaluateResourceDecl(r, false, false);
          const diagOv = this.overrides.diagramResources?.[`${node.id}.${r.id}`];
          if (diagOv && diagOv.current !== undefined) {
            evalRes.current = Math.max(evalRes.min, Math.min(evalRes.max, diagOv.current));
          }
          nodeResources[r.id] = evalRes;
          localVars[r.id] = evalRes.current;
          localVars[`${r.id}.current`] = evalRes.current;
          localVars[`${r.id}.max`] = evalRes.max;
        }
        const nodeStats: Record<string, EvaluatedStat> = {};
        for (const s of node.stats) {
          const val = this.evalExpr(s.expr, { localVars });
          const numVal = this.toNumber(val);
          const isLocked = s.mode === 'lock' || s.meta.flags.includes('lock');
          nodeStats[s.id] = {
            id: s.id,
            label: s.label || s.id,
            baseValue: val,
            finalValue: val,
            mode: s.mode,
            locked: isLocked,
            traces: [{ source: 'Base', op: s.mode, value: numVal }],
            children: {},
            tags: s.meta.tags,
          };
          localVars[s.id] = val;
        }

        for (let rIdx = 0; rIdx < node.rules.length; rIdx++) {
          const rule = node.rules[rIdx];
          const condVal = this.evalExpr(rule.condition, { localVars });
          const active = this.isTruthy(condVal);
          const ruleLabel = rule.id || `${node.label || node.id} #${rIdx + 1}`;
          if (active) {
            for (const eff of rule.effects) {
              this.applyEffect(eff, ruleLabel);
            }
          }
          this.evaluatedRules.push({
            id: ruleLabel,
            conditionText: `${node.label || node.id}: ${this.exprToRawCode(rule.condition)}`,
            isActive: active,
            effectSummaries: rule.effects.map((e) => this.formatEffectSummary(e)),
            source: 'diagram',
          });
        }

        const hitExpr = node.meta.props.hit_range ?? node.meta.props.hit;
        const hitRange = hitExpr ? this.exprToFormulaString(hitExpr) : undefined;
        const multExpr = node.meta.props.mult_damage ?? node.meta.props.mult;
        const damageMult = multExpr ? this.toNumber(this.evalExpr(multExpr)) : 1;

        return {
          id: node.id,
          label: node.label || node.id,
          hitRange,
          damageMult,
          resources: nodeResources,
          stats: nodeStats,
        };
      }),
    };
  }

  // ==========================================================================
  // 3. AVALIADOR DE EXPRESSÕES E FUNÇÕES NATIVAS DO SISTEMA
  // ==========================================================================

  public evalExpr(expr: ASTExpr, ctx: EvalContext = {}): EvaluatedValue {
    switch (expr.type) {
      case 'NumberLit':
        return expr.value;

      case 'StringLit':
        return expr.value;

      case 'StepDieLit':
        return { kind: 'step_die', faces: expr.faces };

      case 'Ident': {
        if (expr.name === 'self' && ctx.selfVal !== undefined) return ctx.selfVal;
        if (expr.name === 'attr' && ctx.attrVal !== undefined) return ctx.attrVal;
        if (expr.name === 'result' && ctx.resultVal !== undefined) return ctx.resultVal;
        if (expr.name === 'true') return 1;
        if (expr.name === 'false') return 0;
        if (ctx.localVars && expr.name in ctx.localVars) return ctx.localVars[expr.name];
        if (expr.name in this.symbolValues) return this.symbolValues[expr.name];
        if (expr.name in this.rankMap) return this.rankMap[expr.name];
        return 0;
      }

      case 'MemberExpr': {
        const key = `${expr.object}.${expr.property}`;
        if (ctx.localVars && key in ctx.localVars) return ctx.localVars[key];
        if (key in this.symbolValues) return this.symbolValues[key];
        const objStat = this.attributes[expr.object] ?? this.stats[expr.object];
        if (objStat && expr.property in objStat.children) {
          return objStat.children[expr.property];
        }
        const objRes = this.resources[expr.object];
        if (objRes) {
          if (expr.property === 'current' || expr.property === 'atual') return objRes.current;
          if (expr.property === 'max' || expr.property === 'maximo') return objRes.max;
          if (expr.property === 'temp') return objRes.temp;
        }
        return 0;
      }

      case 'UnaryExpr': {
        const val = this.evalExpr(expr.operand, ctx);
        if (expr.op === '-') return -this.toNumber(val);
        if (expr.op === '+') return this.toNumber(val);
        if (expr.op === '!') return this.isTruthy(val) ? 0 : 1;
        return 0;
      }

      case 'BinaryExpr': {
        const left = this.evalExpr(expr.left, ctx);
        const right = this.evalExpr(expr.right, ctx);
        const lNum = this.toNumber(left);
        const rNum = this.toNumber(right);

        switch (expr.op) {
          case '+':
            return lNum + rNum;
          case '-':
            return lNum - rNum;
          case '*':
            return lNum * rNum;
          case '/':
            return rNum !== 0 ? lNum / rNum : 0;
          case '%':
            return rNum !== 0 ? lNum % rNum : 0;
          case '==':
            return left === right || lNum === rNum ? 1 : 0;
          case '!=':
            return left !== right && lNum !== rNum ? 1 : 0;
          case '<=':
            return lNum <= rNum ? 1 : 0;
          case '>=':
            return lNum >= rNum ? 1 : 0;
          case '<':
            return lNum < rNum ? 1 : 0;
          case '>':
            return lNum > rNum ? 1 : 0;
          case '&&':
            return this.isTruthy(left) && this.isTruthy(right) ? 1 : 0;
          case '||':
            return this.isTruthy(left) || this.isTruthy(right) ? 1 : 0;
        }
        return 0;
      }

      case 'RangeExpr': {
        const min = this.toNumber(this.evalExpr(expr.min, ctx));
        const max = this.toNumber(this.evalExpr(expr.max, ctx));
        if (ctx.resultVal !== undefined) {
          return ctx.resultVal >= min && ctx.resultVal <= max ? 1 : 0;
        }
        return min;
      }

      case 'TernaryExpr': {
        const cond = this.evalExpr(expr.condition, ctx);
        return this.isTruthy(cond)
          ? this.evalExpr(expr.consequent, ctx)
          : this.evalExpr(expr.alternate, ctx);
      }

      case 'CallExpr':
        return this.evalFunctionCall(expr.callee.toLowerCase(), expr.args, ctx);

      case 'ArrayExpr':
        return expr.elements.length;

      case 'DiceExpr':
        return this.exprToFormulaString(expr, ctx);
    }
  }

  private evalFunctionCall(name: string, args: ASTExpr[], ctx: EvalContext): EvaluatedValue {
    switch (name) {
      case 'floor':
        return Math.floor(this.toNumber(args[0] ? this.evalExpr(args[0], ctx) : 0));
      case 'ceil':
        return Math.ceil(this.toNumber(args[0] ? this.evalExpr(args[0], ctx) : 0));
      case 'round':
        return Math.round(this.toNumber(args[0] ? this.evalExpr(args[0], ctx) : 0));
      case 'abs':
        return Math.abs(this.toNumber(args[0] ? this.evalExpr(args[0], ctx) : 0));
      case 'min': {
        const vals = args.map((a) => this.toNumber(this.evalExpr(a, ctx)));
        return vals.length > 0 ? Math.min(...vals) : 0;
      }
      case 'max': {
        const vals = args.map((a) => this.toNumber(this.evalExpr(a, ctx)));
        return vals.length > 0 ? Math.max(...vals) : 0;
      }
      case 'clamp': {
        const v = this.toNumber(args[0] ? this.evalExpr(args[0], ctx) : 0);
        const lo = this.toNumber(args[1] ? this.evalExpr(args[1], ctx) : 0);
        const hi = this.toNumber(args[2] ? this.evalExpr(args[2], ctx) : 100);
        return Math.min(hi, Math.max(lo, v));
      }
      case 'lookup':
      case 'tabela': {
        if (args.length < 2) return 0;
        const tblName =
          args[0].type === 'Ident'
            ? args[0].name
            : String(this.evalExpr(args[0], ctx));
        const inputVal = this.toNumber(this.evalExpr(args[1], ctx));
        return this.lookupTableValue(tblName, inputVal);
      }
      case 'step': {
        if (args.length < 1) return { kind: 'step_die', faces: 4 };
        const base = this.evalExpr(args[0], ctx);
        const delta = args[1] ? this.toNumber(this.evalExpr(args[1], ctx)) : 1;
        const startFaces: StepDieFaces =
          typeof base === 'object' && base.kind === 'step_die'
            ? base.faces
            : (this.toNumber(base) as StepDieFaces);
        return this.stepDie(startFaces, delta);
      }
      case 'load':
      case 'carga':
      case 'sum':
        return this.currentLoad;
      case 'qty':
      case 'qtd': {
        if (!args[0]) return 0;
        const itemId =
          args[0].type === 'Ident'
            ? args[0].name
            : String(this.evalExpr(args[0], ctx));
        const found = this.items.find(
          (i) => i.id.toLowerCase() === itemId.toLowerCase() || i.label.toLowerCase() === itemId.toLowerCase(),
        );
        return found && found.state !== 'stash' ? found.qty : 0;
      }
      case 'has':
      case 'possui': {
        if (!args[0]) return 0;
        const itemId =
          args[0].type === 'Ident'
            ? args[0].name
            : String(this.evalExpr(args[0], ctx));
        const found = this.items.find(
          (i) => i.id.toLowerCase() === itemId.toLowerCase() || i.label.toLowerCase() === itemId.toLowerCase(),
        );
        return found && found.state !== 'stash' && found.qty > 0 ? 1 : 0;
      }
      default:
        return 0;
    }
  }

  public lookupTableValue(tableId: string, input: number): EvaluatedValue {
    const tbl = this.tableMap[tableId];
    if (!tbl) return 0;

    for (const row of tbl.rows) {
      const m = row.matcher;
      if (m.type === 'Ident' && m.name === 'default') {
        return this.evalExpr(row.result, { resultVal: input });
      }
      if (m.type === 'NumberLit' && m.value === input) {
        return this.evalExpr(row.result, { resultVal: input });
      }
      if (m.type === 'RangeExpr') {
        const min = this.toNumber(this.evalExpr(m.min));
        const max = this.toNumber(this.evalExpr(m.max));
        if (input >= min && input <= max) {
          return this.evalExpr(row.result, { resultVal: input });
        }
      }
      if (m.type === 'BinaryExpr') {
        const match = this.evalExpr(m, { resultVal: input });
        if (this.isTruthy(match)) {
          return this.evalExpr(row.result, { resultVal: input });
        }
      }
    }

    return 0;
  }

  private stepDie(faces: StepDieFaces, delta: number): { kind: 'step_die'; faces: StepDieFaces } {
    if (faces === 'F') return { kind: 'step_die', faces: 'F' };
    const idx = STEP_DIE_CHAIN.indexOf(faces);
    const startIdx = idx === -1 ? 0 : idx;
    const nextIdx = Math.min(STEP_DIE_CHAIN.length - 1, Math.max(0, startIdx + delta));
    return { kind: 'step_die', faces: STEP_DIE_CHAIN[nextIdx] };
  }

  // ==========================================================================
  // 4. FORMATAÇÃO DE FÓRMULAS DE ROLAGEM E INTERPOLAÇÃO DE TEXTO
  // ==========================================================================

  private formatRollFormula(
    rollAst: ASTExpr | undefined,
    baseAttrName: string | undefined,
    baseAttrVal: EvaluatedValue | undefined,
    skillBonus: number,
  ): string {
    if (!rollAst) {
      // Padrão universal quando não especificado: 1d20 + bônus
      if (typeof baseAttrVal === 'object' && baseAttrVal.kind === 'step_die') {
        return skillBonus !== 0
          ? `1d${baseAttrVal.faces}! + ${skillBonus}`
          : `1d${baseAttrVal.faces}!`;
      }
      return skillBonus >= 0 ? `1d20 + ${skillBonus}` : `1d20 - ${Math.abs(skillBonus)}`;
    }

    return this.exprToFormulaString(rollAst, {
      selfVal: skillBonus,
      attrVal: baseAttrVal ?? 1,
      attrName: baseAttrName,
    });
  }

  public exprToFormulaString(expr: ASTExpr, ctx: EvalContext = {}): string {
    switch (expr.type) {
      case 'NumberLit':
        return String(expr.value);
      case 'StringLit':
        return expr.value;
      case 'StepDieLit':
        return `1d${expr.faces}`;
      case 'Ident': {
        const val = this.evalExpr(expr, ctx);
        if (typeof val === 'object' && val.kind === 'step_die') {
          return `1d${val.faces}`;
        }
        return String(val);
      }
      case 'MemberExpr':
        return String(this.evalExpr(expr, ctx));
      case 'RangeExpr':
        return `${this.exprToFormulaString(expr.min, ctx)}..${this.exprToFormulaString(expr.max, ctx)}`;
      case 'DiceExpr': {
        let rawCount = this.toNumber(this.evalExpr(expr.count, ctx));
        const facesStr =
          expr.faces === 'F' ? 'F' : String(this.toNumber(this.evalExpr(expr.faces, ctx)));

        // Regra de paradas d20kh1 com Atributo <= 0 (ex: Ordem Paranormal: 0 -> 2d20kl1, -1 -> 3d20kl1)
        const hasKeepHighest = expr.modifiers.some((m) => m.kind === 'keep_highest');
        let effectiveModifiers = [...expr.modifiers];
        if (rawCount <= 0 && hasKeepHighest && facesStr === '20') {
          rawCount = Math.abs(rawCount) + 2;
          effectiveModifiers = effectiveModifiers.map((m) =>
            m.kind === 'keep_highest' ? { kind: 'keep_lowest', count: m.count } : m,
          );
        } else if (rawCount <= 0) {
          rawCount = 1;
        }

        const modSuffix = effectiveModifiers
          .map((m) => {
            if (m.kind === 'keep_highest') return `kh${m.count}`;
            if (m.kind === 'keep_lowest') return `kl${m.count}`;
            if (m.kind === 'drop_highest') return `dh${m.count}`;
            if (m.kind === 'drop_lowest') return `dl${m.count}`;
            if (m.kind === 'reroll') return `r${m.value}`;
            if (m.kind === 'explode') {
              const bang = m.mode === 'compound' ? '!!' : m.mode === 'penetrating' ? '!p' : '!';
              return m.threshold !== undefined ? `${bang}>=${m.threshold}` : bang;
            }
            if (m.kind === 'tag') return `#${m.tag}`;
            return '';
          })
          .join('');

        return `${rawCount}d${facesStr}${modSuffix}`;
      }
      case 'BinaryExpr': {
        const leftStr = this.exprToFormulaString(expr.left, ctx);
        const rightStr = this.exprToFormulaString(expr.right, ctx);
        if (expr.op === '+' && rightStr.startsWith('-')) {
          return `${leftStr} - ${rightStr.slice(1)}`;
        }
        if ((expr.op === '+' || expr.op === '-') && rightStr === '0') {
          return leftStr;
        }
        return `${leftStr} ${expr.op} ${rightStr}`;
      }
      case 'CallExpr': {
        const argsStr = expr.args.map((a) => this.exprToFormulaString(a, ctx)).join(', ');
        return `${expr.callee}(${argsStr})`;
      }
      default:
        return String(this.evalExpr(expr, ctx));
    }
  }

  private interpolateText(text: string): string {
    const withBraces = text.replace(/\{([^{}]+)\}/g, (_, innerExpr: string) => {
      try {
        const { ast } = parseSheetDSL(`_tmp = ${innerExpr}`);
        const firstStat = ast.stats[0];
        if (!firstStat) return `{${innerExpr}}`;
        const val = this.evalExpr(firstStat.expr);
        if (typeof val === 'object' && val.kind === 'step_die') {
          return `d${val.faces}`;
        }
        return String(val);
      } catch {
        return `{${innerExpr}}`;
      }
    });

    return withBraces.replace(/\$([A-Za-z_][A-Za-z0-9_.]*)/g, (fullMatch, varName: string) => {
      if (varName in this.symbolValues) {
        const val = this.symbolValues[varName];
        if (typeof val === 'object' && val.kind === 'step_die') {
          return `d${val.faces}`;
        }
        return String(val);
      }
      return fullMatch;
    });
  }

  private formatEffectSummary(eff: ASTEffectStmt): string {
    const valStr = this.exprToRawCode(eff.expr);
    switch (eff.op) {
      case 'add':
        return `${eff.target} +${valStr}`;
      case 'sub':
        return `${eff.target} -${valStr}`;
      case 'pin':
        return `${eff.target} := ${valStr}`;
      case 'lock':
        return `${eff.target} :! ${valStr}`;
      default:
        return `${eff.target} = ${valStr}`;
    }
  }

  private exprToRawCode(expr: ASTExpr): string {
    switch (expr.type) {
      case 'NumberLit':
        return String(expr.value);
      case 'StringLit':
        return `"${expr.value}"`;
      case 'StepDieLit':
        return `d${expr.faces}`;
      case 'Ident':
        return expr.name;
      case 'MemberExpr':
        return `${expr.object}.${expr.property}`;
      case 'UnaryExpr':
        return `${expr.op}${this.exprToRawCode(expr.operand)}`;
      case 'BinaryExpr':
        return `${this.exprToRawCode(expr.left)} ${expr.op} ${this.exprToRawCode(expr.right)}`;
      case 'RangeExpr':
        return `${this.exprToRawCode(expr.min)}..${this.exprToRawCode(expr.max)}`;
      case 'TernaryExpr':
        return `${this.exprToRawCode(expr.condition)} ? ${this.exprToRawCode(expr.consequent)} : ${this.exprToRawCode(expr.alternate)}`;
      case 'CallExpr':
        return `${expr.callee}(${expr.args.map((a) => this.exprToRawCode(a)).join(', ')})`;
      case 'ArrayExpr':
        return `[${expr.elements.map((a) => this.exprToRawCode(a)).join(', ')}]`;
      case 'DiceExpr':
        return this.exprToFormulaString(expr);
    }
  }

  // ==========================================================================
  // 5. UTILITÁRIOS DE CONVERSÃO DE TIPOS
  // ==========================================================================

  private toNumber(val: EvaluatedValue | undefined): number {
    if (val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'object' && val.kind === 'step_die') {
      return val.faces === 'F' ? 0 : val.faces;
    }
    const parsed = Number(val);
    return isNaN(parsed) ? 0 : parsed;
  }

  private isTruthy(val: EvaluatedValue | undefined): boolean {
    if (val === undefined) return false;
    if (typeof val === 'number') return val !== 0;
    if (typeof val === 'string') return val.length > 0 && val !== '0' && val !== 'false';
    return true;
  }

  private evalBoolProp(expr: ASTExpr | undefined, fallback: boolean): boolean {
    if (!expr) return fallback;
    return this.isTruthy(this.evalExpr(expr));
  }
}

export function compileSheetDSL(
  source: string,
  overrides: SheetRuntimeOverrides = {},
): CompiledSheet {
  const { ast, diagnostics } = parseSheetDSL(source);
  const analyzer = new SheetAnalyzer(ast, diagnostics, overrides);
  return analyzer.compile();
}
