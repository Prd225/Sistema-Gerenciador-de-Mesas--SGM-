import type { ASTExpr, EvaluatedValue, RollExecutionResult } from '@/lib/sheet-dsl';

export interface SheetRollHistoryEntry {
  id: string;
  title: string;
  subtitle?: string;
  result: RollExecutionResult;
  timestamp: number;
}

export type OnExecuteRoll = (
  title: string,
  formulaOrAst: string | ASTExpr,
  subtitle?: string,
) => RollExecutionResult | null;

export function formatEvaluatedValue(
  val: EvaluatedValue | undefined,
  forceSign = false,
): string {
  if (val === undefined) return '0';
  if (typeof val === 'object' && val.kind === 'step_die') {
    return `d${val.faces}`;
  }
  if (typeof val === 'number') {
    const rounded = Number.isInteger(val) ? val : Number(val.toFixed(2));
    if (forceSign && rounded >= 0) return `+${rounded}`;
    return String(rounded);
  }
  return String(val);
}

