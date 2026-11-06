/**
 * SGM-SDL Universal Dice VM & Resolution Engine
 *
 * Executa qualquer expressão de dados e perfil de resolução da DSL:
 * - Aditivo linear & Keep/Drop (1d20 + 5, 3d20kh1 + 10, 2d20kl1)
 * - Explosões simples (!), compostas (!!), penetrantes (!p) e com limiar (!>=9)
 * - Paradas de Contagem de Sucessos (6d10 >= 6, com detecção de Críticos/Botches/Glitches)
 * - Roll-Under Percentual (1d100 <= 65 com cálculo automático de Bom 1/2 e Extremo 1/5)
 * - Step-Die + Wild Die (max(1d8!, 1d6!) com cálculo de Ampliações / Raises)
 * - Dados Fate / Fudge (4dF + 2)
 * - Dados Marcados / Dualidade (1d12#hope + 1d12#fear, Dados de Fome #hunger)
 * - Resolução por Faixas (@roll PbtA <=6, 7..9, >=10)
 */

import { parseSheetDSL } from './parser';
import type {
  ASTExpr,
  ASTResolutionDecl,
  CompiledSheet,
  DiceModifierNode,
  EvaluatedValue,
} from './types';

export interface RolledDie {
  faces: number | 'F';
  value: number;
  kept: boolean;
  exploded: boolean;
  rerolled: boolean;
  tag?: string;
  isSuccess?: boolean;
  isCritFace?: boolean;
  isBotchFace?: boolean;
}

export type OutcomeTier =
  | 'crit'
  | 'extreme'
  | 'hard'
  | 'success'
  | 'partial'
  | 'fail'
  | 'fumble'
  | 'neutral';

export interface RollExecutionResult {
  formula: string;
  total: number;
  dice: RolledDie[];
  mode: 'sum' | 'success_pool' | 'roll_under' | 'band_resolution' | 'duality';
  successCount?: number;
  targetNumber?: number;
  outcomeLabel?: string;
  outcomeTier: OutcomeTier;
  raises?: number;
  tagTotals: Record<string, number>;
  dualityResult?: 'hope' | 'fear' | 'critical';
  breakdown: string;
}

const MAX_EXPLOSIONS_PER_DIE = 30;

export class SheetDiceEngine {
  private sheet?: CompiledSheet;
  private rng: () => number;

  constructor(sheet?: CompiledSheet, customRng?: () => number) {
    this.sheet = sheet;
    this.rng = customRng ?? Math.random;
  }

  /**
   * Executa uma string de fórmula da DSL (ex: "(AGI)d20kh1 + Pontaria", "6d10 >= 6", "pbta_move(2)")
   * ou um ASTExpr diretamente.
   */
  public roll(
    formulaOrAst: string | ASTExpr,
    localVars: Record<string, number> = {},
  ): RollExecutionResult {
    const expr: ASTExpr =
      typeof formulaOrAst === 'string'
        ? this.parseFormulaToExpr(formulaOrAst)
        : formulaOrAst;

    // 1. Verifica se é uma chamada para um perfil @roll declarado na ficha (ex: pbta_move(Esperto))
    if (expr.type === 'CallExpr' && this.sheet?.resolutions[expr.callee]) {
      const profile = this.sheet.resolutions[expr.callee];
      return this.executeResolutionProfile(profile, expr.args, localVars);
    }

    // 2. Verifica se é uma Parada de Contagem de Sucessos (ex: (FOR + Briga)d10 >= 6)
    if (
      expr.type === 'BinaryExpr' &&
      (expr.op === '>=' || expr.op === '>') &&
      expr.left.type === 'DiceExpr' &&
      !expr.left.modifiers.some((m) => m.kind === 'keep_highest' || m.kind === 'keep_lowest')
    ) {
      const poolCount = this.evalNumeric(expr.left.count, localVars);
      if (poolCount > 1) {
        return this.executeSuccessPool(expr.left, expr.op, expr.right, localVars);
      }
    }

    // 3. Verifica se é um teste Roll-Under Percentual / Direto (ex: 1d100 <= 65)
    if (
      expr.type === 'BinaryExpr' &&
      (expr.op === '<=' || expr.op === '<') &&
      expr.left.type === 'DiceExpr'
    ) {
      return this.executeRollUnder(expr.left, expr.op, expr.right, localVars);
    }

    // 4. Avaliação Geral (Soma, Keep/Drop, Step-Die, Fate, Dualidade)
    const collectedDice: RolledDie[] = [];
    const tagTotals: Record<string, number> = {};
    const total = this.evalRollNode(expr, localVars, collectedDice, tagTotals);

    const formulaStr = typeof formulaOrAst === 'string' ? formulaOrAst : this. summarizeDice(collectedDice, total);

    // Detecta Dualidade (Daggerheart: #hope vs #fear)
    let dualityResult: 'hope' | 'fear' | 'critical' | undefined;
    let outcomeLabel: string | undefined;
    let outcomeTier: OutcomeTier = 'neutral';

    if ('hope' in tagTotals && 'fear' in tagTotals) {
      if (tagTotals.hope === tagTotals.fear) {
        dualityResult = 'critical';
        outcomeLabel = `Crítico de Dualidade (${total})!`;
        outcomeTier = 'crit';
      } else if (tagTotals.hope > tagTotals.fear) {
        dualityResult = 'hope';
        outcomeLabel = `${total} com Esperança (Hope ${tagTotals.hope} vs Fear ${tagTotals.fear})`;
        outcomeTier = 'success';
      } else {
        dualityResult = 'fear';
        outcomeLabel = `${total} com Medo (Fear ${tagTotals.fear} vs Hope ${tagTotals.hope})`;
        outcomeTier = 'partial';
      }
    } else {
      // Detecta 20 natural / 1 natural no d20 principal mantido
      const keptD20 = collectedDice.filter((d) => d.kept && d.faces === 20);
      if (keptD20.length === 1) {
        if (keptD20[0].value === 20) {
          outcomeTier = 'crit';
          outcomeLabel = '20 Natural!';
        } else if (keptD20[0].value === 1) {
          outcomeTier = 'fumble';
          outcomeLabel = '1 Natural!';
        }
      }
    }

    return {
      formula: formulaStr,
      total,
      dice: collectedDice,
      mode: dualityResult ? 'duality' : 'sum',
      outcomeLabel,
      outcomeTier,
      tagTotals,
      dualityResult,
      breakdown: this.buildBreakdown(collectedDice, total),
    };
  }

  /**
   * Executa um perfil @roll customizado (ex: PbtA 2d6, Call of Cthulhu d100, Savage Worlds)
   */
  private executeResolutionProfile(
    profile: ASTResolutionDecl,
    argExprs: ASTExpr[],
    outerVars: Record<string, number>,
  ): RollExecutionResult {
    const boundVars: Record<string, number> = { ...outerVars };
    for (let i = 0; i < profile.params.length; i++) {
      const paramName = profile.params[i];
      const argVal = argExprs[i] ? this.evalNumeric(argExprs[i], outerVars) : 0;
      boundVars[paramName] = argVal;
    }

    const collectedDice: RolledDie[] = [];
    const tagTotals: Record<string, number> = {};
    const total = this.evalRollNode(profile.rollExpr, boundVars, collectedDice, tagTotals);

    boundVars.result = total;

    let matchedLabel = `Resultado: ${total}`;
    let matchedTier: OutcomeTier = 'neutral';

    for (const band of profile.bands) {
      if (this.matchesBand(band.matcher, total, boundVars)) {
        matchedLabel = this.interpolateBandLabel(band.label, boundVars);
        const tierExpr = band.meta.props.tier;
        if (tierExpr && (tierExpr.type === 'StringLit' || tierExpr.type === 'Ident')) {
          matchedTier = (tierExpr.type === 'StringLit' ? tierExpr.value : tierExpr.name) as OutcomeTier;
        } else {
          matchedTier = 'success';
        }
        break;
      }
    }

    return {
      formula: `${profile.id}(${argExprs.map((a) => this.evalNumeric(a, outerVars)).join(', ')})`,
      total,
      dice: collectedDice,
      mode: 'band_resolution',
      outcomeLabel: matchedLabel,
      outcomeTier: matchedTier,
      tagTotals,
      breakdown: this.buildBreakdown(collectedDice, total),
    };
  }

  /**
   * Executa parada de contagem de sucessos (Ex: Vampiro V5 / Storyteller / Shadowrun / Year Zero)
   */
  private executeSuccessPool(
    diceExpr: Extract<ASTExpr, { type: 'DiceExpr' }>,
    op: '>=' | '>',
    targetExpr: ASTExpr,
    localVars: Record<string, number>,
  ): RollExecutionResult {
    const target = this.evalNumeric(targetExpr, localVars);
    const threshold = op === '>' ? target + 1 : target;
    const collectedDice: RolledDie[] = [];
    const tagTotals: Record<string, number> = {};

    this.rollDiceNode(diceExpr, localVars, collectedDice, tagTotals);

    let successes = 0;
    let ones = 0;
    let maxFaceCount = 0;

    for (const die of collectedDice) {
      if (!die.kept) continue;
      if (die.value >= threshold) {
        die.isSuccess = true;
        successes++;
      }
      if (die.value === 1) {
        die.isBotchFace = true;
        ones++;
      }
      if (typeof die.faces === 'number' && die.value === die.faces) {
        die.isCritFace = true;
        maxFaceCount++;
      }
    }

    let outcomeTier: OutcomeTier = successes > 0 ? 'success' : 'fail';
    let outcomeLabel = `${successes} Sucesso(s) (Alvo >= ${threshold})`;

    if (successes === 0 && ones > 0) {
      outcomeTier = 'fumble';
      outcomeLabel = `Falha Crítica / Bestial (0 sucessos e ${ones} dado(s) '1')!`;
    } else if (maxFaceCount >= 2) {
      outcomeTier = 'crit';
      outcomeLabel = `Sucesso Crítico! (${successes} sucessos, ${maxFaceCount} máximos)`;
    }

    return {
      formula: `${collectedDice.length}d${diceExpr.faces === 'F' ? 'F' : this.evalNumeric(diceExpr.faces, localVars)} >= ${threshold}`,
      total: successes,
      dice: collectedDice,
      mode: 'success_pool',
      successCount: successes,
      targetNumber: threshold,
      outcomeLabel,
      outcomeTier,
      tagTotals,
      breakdown: `[${collectedDice.map((d) => d.value).join(', ')}] -> ${successes} sucesso(s)`,
    };
  }

  /**
   * Executa teste Roll-Under (Ex: Call of Cthulhu d100, GURPS 3d6 <= Perícia)
   */
  private executeRollUnder(
    diceExpr: Extract<ASTExpr, { type: 'DiceExpr' }>,
    op: '<=' | '<',
    targetExpr: ASTExpr,
    localVars: Record<string, number>,
  ): RollExecutionResult {
    const target = this.evalNumeric(targetExpr, localVars);
    const limit = op === '<' ? target - 1 : target;
    const collectedDice: RolledDie[] = [];
    const tagTotals: Record<string, number> = {};

    const rolledVal = this.rollDiceNode(diceExpr, localVars, collectedDice, tagTotals);

    const hardLimit = Math.floor(limit / 2);
    const extremeLimit = Math.floor(limit / 5);

    let outcomeTier: OutcomeTier = 'fail';
    let outcomeLabel = `Fracasso (${rolledVal} > ${limit})`;

    if (rolledVal === 1) {
      outcomeTier = 'crit';
      outcomeLabel = `Crítico (01 <= ${limit})!`;
    } else if (rolledVal <= extremeLimit) {
      outcomeTier = 'extreme';
      outcomeLabel = `Sucesso Extremo (${rolledVal} <= ${extremeLimit})!`;
    } else if (rolledVal <= hardLimit) {
      outcomeTier = 'hard';
      outcomeLabel = `Sucesso Bom/Difícil (${rolledVal} <= ${hardLimit})`;
    } else if (rolledVal <= limit) {
      outcomeTier = 'success';
      outcomeLabel = `Sucesso Regular (${rolledVal} <= ${limit})`;
    } else if (rolledVal >= 96 && (limit < 50 || rolledVal === 100)) {
      outcomeTier = 'fumble';
      outcomeLabel = `Desastre (${rolledVal})!`;
    }

    return {
      formula: `1d100 <= ${limit}`,
      total: rolledVal,
      dice: collectedDice,
      mode: 'roll_under',
      targetNumber: limit,
      outcomeLabel,
      outcomeTier,
      tagTotals,
      breakdown: `Rolado ${rolledVal} contra Alvo ${limit} (Bom ${hardLimit} / Extremo ${extremeLimit})`,
    };
  }

  private evalRollNode(
    expr: ASTExpr,
    localVars: Record<string, number>,
    collectedDice: RolledDie[],
    tagTotals: Record<string, number>,
  ): number {
    switch (expr.type) {
      case 'NumberLit':
        return expr.value;

      case 'StepDieLit':
        return this.rollDiceNode(
          {
            type: 'DiceExpr',
            count: { type: 'NumberLit', value: 1, span: expr.span },
            faces: expr.faces === 'F' ? 'F' : { type: 'NumberLit', value: expr.faces, span: expr.span },
            modifiers: [],
            span: expr.span,
          },
          localVars,
          collectedDice,
          tagTotals,
        );

      case 'Ident': {
        if (expr.name in localVars) return localVars[expr.name];
        const sheetVal = this.resolveSheetSymbol(expr.name);
        if (typeof sheetVal === 'object' && sheetVal.kind === 'step_die') {
          return this.rollDiceNode(
            {
              type: 'DiceExpr',
              count: { type: 'NumberLit', value: 1, span: expr.span },
              faces: sheetVal.faces === 'F' ? 'F' : { type: 'NumberLit', value: sheetVal.faces, span: expr.span },
              modifiers: [{ kind: 'explode', mode: 'simple' }],
              span: expr.span,
            },
            localVars,
            collectedDice,
            tagTotals,
          );
        }
        return typeof sheetVal === 'number' ? sheetVal : Number(sheetVal) || 0;
      }

      case 'MemberExpr': {
        const key = `${expr.object}.${expr.property}`;
        if (key in localVars) return localVars[key];
        const val = this.resolveSheetSymbol(key);
        return typeof val === 'number' ? val : Number(val) || 0;
      }

      case 'UnaryExpr': {
        const v = this.evalRollNode(expr.operand, localVars, collectedDice, tagTotals);
        if (expr.op === '-') return -v;
        if (expr.op === '!') return v === 0 ? 1 : 0;
        return v;
      }

      case 'BinaryExpr': {
        const l = this.evalRollNode(expr.left, localVars, collectedDice, tagTotals);
        const r = this.evalRollNode(expr.right, localVars, collectedDice, tagTotals);
        switch (expr.op) {
          case '+':
            return l + r;
          case '-':
            return l - r;
          case '*':
            return l * r;
          case '/':
            return r !== 0 ? l / r : 0;
          case '%':
            return r !== 0 ? l % r : 0;
          case '>=':
            return l >= r ? 1 : 0;
          case '<=':
            return l <= r ? 1 : 0;
          case '>':
            return l > r ? 1 : 0;
          case '<':
            return l < r ? 1 : 0;
          case '==':
            return l === r ? 1 : 0;
          case '!=':
            return l !== r ? 1 : 0;
          default:
            return 0;
        }
      }

      case 'CallExpr': {
        const fn = expr.callee.toLowerCase();
        const vals = expr.args.map((a) => this.evalRollNode(a, localVars, collectedDice, tagTotals));
        if (fn === 'floor') return Math.floor(vals[0] ?? 0);
        if (fn === 'ceil') return Math.ceil(vals[0] ?? 0);
        if (fn === 'round') return Math.round(vals[0] ?? 0);
        if (fn === 'max') return vals.length > 0 ? Math.max(...vals) : 0;
        if (fn === 'min') return vals.length > 0 ? Math.min(...vals) : 0;
        return vals[0] ?? 0;
      }

      case 'DiceExpr':
        return this.rollDiceNode(expr, localVars, collectedDice, tagTotals);

      default:
        return 0;
    }
  }

  private rollDiceNode(
    expr: Extract<ASTExpr, { type: 'DiceExpr' }>,
    localVars: Record<string, number>,
    collectedDice: RolledDie[],
    tagTotals: Record<string, number>,
  ): number {
    let rawCount = Math.round(this.evalNumeric(expr.count, localVars));
    const faces: number | 'F' =
      expr.faces === 'F' ? 'F' : Math.max(1, Math.round(this.evalNumeric(expr.faces, localVars)));

    let modifiers: DiceModifierNode[] = [...expr.modifiers];

    // Regra de Atributo <= 0 em paradas d20kh1 (0 -> 2d20kl1, -1 -> 3d20kl1)
    const hasKeepHighest = modifiers.some((m) => m.kind === 'keep_highest');
    if (rawCount <= 0 && hasKeepHighest && faces === 20) {
      rawCount = Math.abs(rawCount) + 2;
      modifiers = modifiers.map((m) =>
        m.kind === 'keep_highest' ? { kind: 'keep_lowest', count: m.count } : m,
      );
    } else if (rawCount <= 0) {
      rawCount = 1;
    }

    const tagMod = modifiers.find((m): m is { kind: 'tag'; tag: string } => m.kind === 'tag');
    const explodeMod = modifiers.find(
      (m): m is Extract<DiceModifierNode, { kind: 'explode' }> => m.kind === 'explode',
    );
    const rerollMod = modifiers.find(
      (m): m is { kind: 'reroll'; value: number } => m.kind === 'reroll',
    );

    const subPool: RolledDie[] = [];

    for (let i = 0; i < rawCount; i++) {
      let val = this.rollSingleFace(faces);
      let rerolled = false;

      if (rerollMod && faces !== 'F' && val <= rerollMod.value) {
        val = this.rollSingleFace(faces);
        rerolled = true;
      }

      const dieEntry: RolledDie = {
        faces,
        value: val,
        kept: true,
        exploded: false,
        rerolled,
        tag: tagMod?.tag,
      };
      subPool.push(dieEntry);

      // Processa Explosão (!, !!, !p, !>=N)
      if (explodeMod && faces !== 'F' && faces > 1) {
        const threshold = explodeMod.threshold ?? faces;
        let explosions = 0;
        let lastRoll = val;

        while (lastRoll >= threshold && explosions < MAX_EXPLOSIONS_PER_DIE) {
          explosions++;
          dieEntry.exploded = true;
          lastRoll = this.rollSingleFace(faces);

          if (explodeMod.mode === 'compound') {
            dieEntry.value += lastRoll;
          } else if (explodeMod.mode === 'penetrating') {
            subPool.push({
              faces,
              value: Math.max(1, lastRoll - 1),
              kept: true,
              exploded: true,
              rerolled: false,
              tag: tagMod?.tag,
            });
          } else {
            subPool.push({
              faces,
              value: lastRoll,
              kept: true,
              exploded: true,
              rerolled: false,
              tag: tagMod?.tag,
            });
          }
        }
      }
    }

    // Aplica filtros Keep / Drop (kh, kl, dh, dl)
    for (const mod of modifiers) {
      if (
        mod.kind === 'keep_highest' ||
        mod.kind === 'keep_lowest' ||
        mod.kind === 'drop_highest' ||
        mod.kind === 'drop_lowest'
      ) {
        const activeIndices = subPool
          .map((d, idx) => ({ idx, val: d.value }))
          .sort((a, b) => b.val - a.val); // Maior para menor

        const keepSet = new Set<number>();
        if (mod.kind === 'keep_highest') {
          activeIndices.slice(0, mod.count).forEach((x) => keepSet.add(x.idx));
        } else if (mod.kind === 'keep_lowest') {
          activeIndices.slice(-mod.count).forEach((x) => keepSet.add(x.idx));
        } else if (mod.kind === 'drop_highest') {
          activeIndices.slice(mod.count).forEach((x) => keepSet.add(x.idx));
        } else if (mod.kind === 'drop_lowest') {
          activeIndices.slice(0, Math.max(0, activeIndices.length - mod.count)).forEach((x) => keepSet.add(x.idx));
        }

        subPool.forEach((d, idx) => {
          d.kept = keepSet.has(idx);
        });
      }
    }

    const subTotal = subPool
      .filter((d) => d.kept)
      .reduce((acc, d) => acc + d.value, 0);

    if (tagMod) {
      tagTotals[tagMod.tag] = (tagTotals[tagMod.tag] ?? 0) + subTotal;
    }

    collectedDice.push(...subPool);
    return subTotal;
  }

  private rollSingleFace(faces: number | 'F'): number {
    if (faces === 'F') {
      const r = Math.floor(this.rng() * 3); // 0, 1, 2
      return r - 1; // -1, 0, +1
    }
    return Math.floor(this.rng() * faces) + 1;
  }

  private matchesBand(matcher: ASTExpr, result: number, vars: Record<string, number>): boolean {
    if (matcher.type === 'Ident' && matcher.name === 'default') return true;
    if (matcher.type === 'NumberLit') return result === matcher.value;
    if (matcher.type === 'RangeExpr') {
      const min = this.evalNumeric(matcher.min, vars);
      const max = this.evalNumeric(matcher.max, vars);
      return result >= min && result <= max;
    }
    if (matcher.type === 'BinaryExpr') {
      const l = this.evalNumeric(matcher.left, { ...vars, result });
      const r = this.evalNumeric(matcher.right, { ...vars, result });
      switch (matcher.op) {
        case '>=':
          return l >= r;
        case '<=':
          return l <= r;
        case '>':
          return l > r;
        case '<':
          return l < r;
        case '==':
          return l === r;
        case '!=':
          return l !== r;
      }
    }
    return false;
  }

  private interpolateBandLabel(label: string, vars: Record<string, number>): string {
    return label.replace(/\{([^{}]+)\}/g, (_, exprStr: string) => {
      try {
        const expr = this.parseFormulaToExpr(exprStr);
        return String(this.evalNumeric(expr, vars));
      } catch {
        return `{${exprStr}}`;
      }
    });
  }

  private evalNumeric(expr: ASTExpr, localVars: Record<string, number>): number {
    return this.evalRollNode(expr, localVars, [], {});
  }

  private resolveSheetSymbol(name: string): EvaluatedValue {
    if (!this.sheet) return 0;
    if (name.includes('.')) {
      const [obj, prop] = name.split('.');
      if (this.sheet.attributes[obj] && prop in this.sheet.attributes[obj].children) {
        return this.sheet.attributes[obj].children[prop];
      }
      if (this.sheet.stats[obj] && prop in this.sheet.stats[obj].children) {
        return this.sheet.stats[obj].children[prop];
      }
      if (this.sheet.skills[obj] && prop in this.sheet.skills[obj].children) {
        return this.sheet.skills[obj].children[prop];
      }
      if (this.sheet.resources[obj]) {
        if (prop === 'current') return this.sheet.resources[obj].current;
        if (prop === 'max') return this.sheet.resources[obj].max;
        if (prop === 'temp') return this.sheet.resources[obj].temp;
      }
    }
    if (this.sheet.attributes[name]) return this.sheet.attributes[name].finalValue;
    if (this.sheet.stats[name]) return this.sheet.stats[name].finalValue;
    if (this.sheet.skills[name]) return this.sheet.skills[name].bonus;
    if (this.sheet.resources[name]) return this.sheet.resources[name].current;
    if (name in this.sheet.meta.props) return this.sheet.meta.props[name];
    return 0;
  }

  private parseFormulaToExpr(formula: string): ASTExpr {
    const { ast } = parseSheetDSL(`_roll = ${formula}`);
    const first = ast.stats[0];
    if (first) return first.expr;
    return {
      type: 'NumberLit',
      value: 0,
      span: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 1, offset: 0 },
      },
    };
  }

  private summarizeDice(dice: RolledDie[], total: number): string {
    if (dice.length === 0) return String(total);
    return `${dice.length}d${dice[0].faces}`;
  }

  private buildBreakdown(dice: RolledDie[], total: number): string {
    if (dice.length === 0) return `${total}`;
    const dicePart = dice
      .map((d) => {
        const base = d.faces === 'F' ? (d.value > 0 ? '+1' : d.value < 0 ? '-1' : '0') : String(d.value);
        const tag = d.tag ? `#${d.tag}` : '';
        const exp = d.exploded ? '!' : '';
        return d.kept ? `${base}${exp}${tag}` : `~${base}~`;
      })
      .join(', ');
    return `[${dicePart}] = ${total}`;
  }

  public extractTraySetup(
    formulaOrAst: string | ASTExpr,
    localVars: Record<string, number> = {},
  ): TrayFormulaSetup {
    let expr: ASTExpr =
      typeof formulaOrAst === 'string'
        ? this.parseFormulaToExpr(formulaOrAst)
        : formulaOrAst;

    const activeVars: Record<string, number> = { ...localVars };

    // Se for chamada a perfil @roll (ex: pbta_move(2)), desempacota o rollExpr com os argumentos
    if (expr.type === 'CallExpr' && this.sheet?.resolutions[expr.callee]) {
      const profile = this.sheet.resolutions[expr.callee];
      for (let i = 0; i < profile.params.length; i++) {
        const paramName = profile.params[i];
        activeVars[paramName] = expr.args[i] ? this.evalNumeric(expr.args[i], localVars) : 0;
      }
      expr = profile.rollExpr;
    }

    const diceList: Array<{ faces: 4 | 6 | 8 | 10 | 12 | 20 | 100 }> = [];
    let modifier = 0;
    let ruleMode: TrayFormulaSetup['ruleMode'] = 'sum';
    let keepCount: number | undefined;
    let keepMode: 'highest' | 'lowest' | undefined;
    let successDC: number | null = null;
    let poolThreshold: number | null = null;
    let percentileTarget: number | undefined;
    let rollUnderTarget: number | null = null;
    const formulaParts: string[] = [];

    const collectDiceAndMod = (node: ASTExpr, sign: 1 | -1) => {
      if (node.type === 'BinaryExpr' && (node.op === '+' || node.op === '-')) {
        collectDiceAndMod(node.left, sign);
        collectDiceAndMod(node.right, node.op === '+' ? sign : (sign === 1 ? -1 : 1));
        return;
      }
      if (node.type === 'UnaryExpr' && (node.op === '+' || node.op === '-')) {
        collectDiceAndMod(node.operand, node.op === '+' ? sign : (sign === 1 ? -1 : 1));
        return;
      }
      if (node.type === 'DiceExpr') {
        const count = Math.max(1, Math.min(20, Math.round(this.evalNumeric(node.count, activeVars))));
        const rawFaces =
          node.faces === 'F' ? 6 : Math.round(this.evalNumeric(node.faces, activeVars));
        const faces = snapToValidDieFaces(rawFaces);
        for (let i = 0; i < count; i++) {
          diceList.push({ faces });
        }

        let modSuffix = '';
        for (const m of node.modifiers) {
          if (m.kind === 'keep_highest') {
            modSuffix += `kh${m.count}`;
            if (m.count === 1) {
              ruleMode = 'highest';
            } else {
              ruleMode = 'roll_keep';
              keepCount = m.count;
              keepMode = 'highest';
            }
          } else if (m.kind === 'keep_lowest') {
            modSuffix += `kl${m.count}`;
            if (m.count === 1) {
              ruleMode = 'lowest';
            } else {
              ruleMode = 'roll_keep';
              keepCount = m.count;
              keepMode = 'lowest';
            }
          }
        }
        formulaParts.push(`${sign < 0 ? '- ' : formulaParts.length > 0 ? '+ ' : ''}${count}d${faces}${modSuffix}`);
        return;
      }

      if (node.type === 'CallExpr' && (node.callee === 'max' || node.callee === 'min')) {
        for (const arg of node.args) {
          collectDiceAndMod(arg, sign);
        }
        ruleMode = node.callee === 'max' ? 'highest' : 'lowest';
        return;
      }

      const val = Math.round(this.evalNumeric(node, activeVars));
      if (!Number.isNaN(val) && val !== 0) {
        modifier += sign * val;
      }
    };

    if (
      expr.type === 'BinaryExpr' &&
      (expr.op === '<=' || expr.op === '<' || expr.op === '>=' || expr.op === '>')
    ) {
      const rawTarget = Math.round(this.evalNumeric(expr.right, activeVars));
      collectDiceAndMod(expr.left, 1);

      if (expr.op === '<=' || expr.op === '<') {
        const limit = expr.op === '<' ? rawTarget - 1 : rawTarget;
        if (diceList.length > 0 && diceList[0].faces === 100) {
          ruleMode = 'percentile';
          percentileTarget = limit;
        } else {
          ruleMode = 'roll_under';
          rollUnderTarget = limit;
        }
      } else {
        const threshold = expr.op === '>' ? rawTarget + 1 : rawTarget;
        if (diceList.length > 1 && modifier === 0 && ruleMode === 'sum') {
          ruleMode = 'pool';
          poolThreshold = threshold;
        } else {
          ruleMode = 'sum';
          successDC = threshold;
        }
      }
    } else {
      collectDiceAndMod(expr, 1);
    }

    if (diceList.length === 0) {
      diceList.push({ faces: 20 });
      formulaParts.push('1d20');
    }

    let resolvedFormula = formulaParts.join(' ');
    if (modifier !== 0) {
      resolvedFormula += modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;
    }
    if (ruleMode === 'roll_under' && rollUnderTarget !== null) {
      resolvedFormula += ` <= ${rollUnderTarget}`;
    } else if (ruleMode === 'percentile' && percentileTarget !== undefined) {
      resolvedFormula += ` <= ${percentileTarget}%`;
    } else if (ruleMode === 'pool' && poolThreshold !== null) {
      resolvedFormula += ` >= ${poolThreshold}`;
    } else if (successDC !== null) {
      resolvedFormula += ` >= ${successDC}`;
    }

    return {
      dice: diceList,
      modifier,
      ruleMode,
      keepCount,
      keepMode,
      successDC,
      poolThreshold,
      percentileTarget,
      rollUnderTarget,
      resolvedFormula,
    };
  }
}

export interface TrayFormulaSetup {
  dice: Array<{ faces: 4 | 6 | 8 | 10 | 12 | 20 | 100 }>;
  modifier: number;
  ruleMode: 'sum' | 'pool' | 'highest' | 'lowest' | 'roll_keep' | 'percentile' | 'roll_under';
  keepCount?: number;
  keepMode?: 'highest' | 'lowest';
  successDC?: number | null;
  poolThreshold?: number | null;
  percentileTarget?: number;
  rollUnderTarget?: number | null;
  resolvedFormula: string;
}

function snapToValidDieFaces(raw: number): 4 | 6 | 8 | 10 | 12 | 20 | 100 {
  const valid: Array<4 | 6 | 8 | 10 | 12 | 20 | 100> = [4, 6, 8, 10, 12, 20, 100];
  if (valid.includes(raw as 4 | 6 | 8 | 10 | 12 | 20 | 100)) {
    return raw as 4 | 6 | 8 | 10 | 12 | 20 | 100;
  }
  let closest: 4 | 6 | 8 | 10 | 12 | 20 | 100 = 20;
  let minDiff = Infinity;
  for (const v of valid) {
    const diff = Math.abs(v - raw);
    if (diff < minDiff) {
      minDiff = diff;
      closest = v;
    }
  }
  return closest;
}

export function rollSheetFormula(
  formulaOrAst: string | ASTExpr,
  sheet?: CompiledSheet,
  localVars?: Record<string, number>,
  customRng?: () => number,
): RollExecutionResult {
  const engine = new SheetDiceEngine(sheet, customRng);
  return engine.roll(formulaOrAst, localVars);
}

export function resolveSheetFormulaForTray(
  formulaOrAst: string | ASTExpr,
  sheet?: CompiledSheet,
  localVars?: Record<string, number>,
): TrayFormulaSetup {
  const engine = new SheetDiceEngine(sheet);
  return engine.extractTraySetup(formulaOrAst, localVars);
}

