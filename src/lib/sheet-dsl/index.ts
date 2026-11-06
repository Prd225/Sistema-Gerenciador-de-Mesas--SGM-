/**
 * SGM-SDL (Sheet Domain-Specific Language) - API Pública do Compilador & Motor de Dados
 */

export * from './types';
export { SheetLexer, tokenizeSheetDSL, DIRECTIVE_ALIASES } from './lexer';
export { SheetParser, parseSheetDSL } from './parser';
export { SheetAnalyzer, compileSheetDSL } from './analyzer';
export { SheetDiceEngine, rollSheetFormula, resolveSheetFormulaForTray } from './diceEngine';
export type { RolledDie, RollExecutionResult, OutcomeTier, TrayFormulaSetup } from './diceEngine';
export { SHEET_DSL_PRESETS } from './presets';
export type { SheetDSLPreset } from './presets';

