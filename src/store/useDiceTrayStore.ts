import { create } from 'zustand';
import { generateId } from '@/lib/uuid';
import { diceAudio } from '@/lib/diceAudio';
import { diceHaptics } from '@/lib/diceHaptics';
import { socket } from '@/lib/socket';
import { diceDOMRegistry, setDieAnimating } from '@/lib/diceDOMRegistry';
import { useMultiplayerStore } from './useMultiplayerStore';

export type DieFaceCount = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export interface TrayDie {
  id: string;
  faces: DieFaceCount;
  currentValue: number;
  animatedFace: number;
  sideFaces: number[];
  isRolling: boolean;
  color: string;
  modifier?: number; // Modificador individual isolado do dado
  x: number; // Porcentagem 0..100 na bandeja
  y: number; // Porcentagem 0..100 na bandeja
  vx?: number;
  vy?: number;
  rotation: number;
  rotX?: number;
  rotY?: number;
  lift?: number;
}

export type RollOutcomeTier = 'crit' | 'extreme' | 'success' | 'fail' | 'fumble' | 'neutral';

export type DiceRuleMode = 'sum' | 'pool' | 'highest' | 'lowest' | 'roll_keep' | 'percentile';

export interface DiceTrayRules {
  critPositive: number; // Ex: 20
  critNegative: number; // Ex: 1
  successDC: number | null; // Ex: 15
  poolThreshold: number | null; // Ex: 6 (sucessos em parada de dados)
  keepCount: number; // Ex: 2 (quantos dados manter no Roll & Keep)
  keepMode: 'highest' | 'lowest';
  percentileTarget: number; // Ex: 50 (% alvo para testes de perícia d100)
  ruleMode: DiceRuleMode;
}

export interface DiceRollEntry {
  id: string;
  senderName: string;
  senderRole: 'gm' | 'player';
  visibility: 'public' | 'gm' | 'self';
  formula: string;
  dice: Array<{ id: string; faces: number; value: number; modifier?: number; color?: string }>;
  modifier: number;
  total: number;
  outcomeTier: RollOutcomeTier;
  outcomeLabel: string;
  timestamp: number;
}

export interface ActiveTraySnapshot {
  dice: TrayDie[];
  modifier: number;
}

export interface DiceTrayState {
  // Estado da Janela
  isOpen: boolean;
  isMinimized: boolean;
  activeTab: 'tray' | 'history' | 'rules';

  // Dados Ativos na Bandeja
  dice: TrayDie[];
  modifier: number;
  isRolling: boolean;
  lastRollResult: {
    total: number;
    diceTotal: number;
    modifier: number;
    formula: string;
    outcomeTier: RollOutcomeTier;
    outcomeLabel: string;
    breakdown: string;
  } | null;

  // Opções de Visibilidade & Áudio
  visibility: 'public' | 'gm' | 'self';
  soundEnabled: boolean;
  isOverlayEnabled: boolean;
  activeNotification: DiceRollEntry | null;

  // Regras de Crítico & Sucesso (definidas pelo Mestre)
  rules: DiceTrayRules;

  // Histórico & Desfazer / Refazer (limite de 5)
  history: DiceRollEntry[];
  undoStack: ActiveTraySnapshot[];
  redoStack: ActiveTraySnapshot[];
  selectedDieIds: string[];
  toggleSelectDie: (dieId: string) => void;
  clearSelectedDice: () => void;

  // Ações de Janela
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setIsMinimized: (isMin: boolean) => void;
  setActiveTab: (tab: 'tray' | 'history' | 'rules') => void;

  // Ações de Bandeja
  addDie: (faces: DieFaceCount, color?: string) => void;
  removeDie: (dieId: string) => void;
  setModifier: (mod: number) => void;
  setVisibility: (vis: 'public' | 'gm' | 'self') => void;
  setSoundEnabled: (enabled: boolean) => void;
  setIsOverlayEnabled: (enabled: boolean) => void;
  dismissNotification: () => void;
  clearLastRollResult: () => void;

  // Rolagem & Ajuste Pós-Resultado
  rollDice: (senderName?: string, senderRole?: 'gm' | 'player', intensity?: number) => void;
  incrementDie: (dieId: string) => void;
  decrementDie: (dieId: string) => void;
  setDieValue: (dieId: string, val: number) => void;
  setDieModifier: (dieId: string, modifier: number) => void;
  incrementDieModifier: (dieId: string) => void;
  decrementDieModifier: (dieId: string) => void;
  updateDiePosition: (dieId: string, x: number, y: number, rotation?: number, rotX?: number, rotY?: number) => void;

  // Regras
  setRules: (rules: Partial<DiceTrayRules>) => void;

  // Histórico & Undo/Redo
  undo: () => void;
  redo: () => void;
  clearTray: () => void;
  clearHistory: () => void;
  receiveRemoteRoll: (roll: DiceRollEntry) => void;
}

const DIE_COLORS: Record<DieFaceCount, string> = {
  4: '#f59e0b',  // Âmbar
  6: '#0284c7',  // Azul
  8: '#10b981',  // Verde
  10: '#8257e5', // Roxo
  12: '#e11d48', // Vermelho
  20: '#ffd700', // Dourado
  100: '#ec4899',// Rosa
};

const DEFAULT_RULES: DiceTrayRules = {
  critPositive: 20,
  critNegative: 1,
  successDC: null,
  poolThreshold: null,
  keepCount: 2,
  keepMode: 'highest',
  percentileTarget: 50,
  ruleMode: 'sum',
};

// Algoritmo de aleatoriedade matematicamente uniforme e criptograficamente justo
// Elimina qualquer viés de módulo (modulo bias) usando Uint32Array e rejection sampling
export function rollDieFace(faces: DieFaceCount): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    const maxUint = 0xffffffff;
    const limit = maxUint - (maxUint % faces);
    let rand: number;
    do {
      window.crypto.getRandomValues(array);
      rand = array[0];
    } while (rand >= limit);
    return (rand % faces) + 1;
  }
  return Math.floor(Math.random() * faces) + 1;
}

// Gera números para as facetas visíveis adjacentes de cada tipo de dado sem duplicar a face frontal
export function generateSideFaces(faces: DieFaceCount, centerVal: number): number[] {
  const count =
    faces === 4
      ? 2
      : faces === 6
      ? 4
      : faces === 8
      ? 3
      : faces === 10 || faces === 100
      ? 4
      : faces === 12
      ? 5
      : 3;

  const res: number[] = [];
  const used = new Set<number>([centerVal]);

  for (let i = 0; i < count; i++) {
    if (faces === 100) {
      let step = (rollDieFace(10) - 1) * 10;
      if (step === 0) step = 100;
      if (used.has(step)) {
        step = ((step + 10) % 100) || 100;
      }
      used.add(step);
      res.push(step);
    } else {
      let candidate = rollDieFace(faces);
      let attempts = 0;
      while (used.has(candidate) && attempts < faces) {
        candidate = (candidate % faces) + 1;
        attempts++;
      }
      used.add(candidate);
      res.push(candidate);
    }
  }
  return res;
}

// Formata fórmula e discriminação detalhada com modificadores por dado e global
function formatFormulaAndBreakdown(dice: TrayDie[], globalModifier: number, rules?: DiceTrayRules) {
  if (rules?.ruleMode === 'roll_keep') {
    const keepCount = Math.max(1, Math.min(dice.length, rules.keepCount || 2));
    const sorted = [...dice].sort((a, b) => {
      const valA = a.currentValue + (a.modifier || 0);
      const valB = b.currentValue + (b.modifier || 0);
      return rules.keepMode === 'lowest' ? valA - valB : valB - valA;
    });
    const kept = sorted.slice(0, keepCount);
    const discarded = sorted.slice(keepCount);
    const keptParts = kept.map((d) => `${d.currentValue}${d.modifier ? (d.modifier > 0 ? `+${d.modifier}` : d.modifier) : ''}`);
    const discardedParts = discarded.map((d) => `${d.currentValue}${d.modifier ? (d.modifier > 0 ? `+${d.modifier}` : d.modifier) : ''}`);

    let formula = `Manter ${keepCount} (${rules.keepMode === 'lowest' ? 'Menores' : 'Maiores'}) de ${dice.length}d`;
    if (globalModifier !== 0) formula += globalModifier > 0 ? ` + ${globalModifier}` : ` - ${Math.abs(globalModifier)}`;

    let breakdown = `[${keptParts.join(' + ')}]`;
    if (discardedParts.length > 0) {
      breakdown += ` (descartados: ${discardedParts.join(', ')})`;
    }
    if (globalModifier !== 0) {
      breakdown += globalModifier > 0 ? ` + ${globalModifier}` : ` - ${Math.abs(globalModifier)}`;
    }
    return { formula, breakdown };
  }

  if (rules?.ruleMode === 'percentile') {
    const target = rules.percentileTarget ?? 50;
    const formula = `d100 vs ${target}%`;
    const diceTotal = dice.reduce((acc, d) => acc + d.currentValue + (d.modifier || 0), 0);
    let breakdown = `${diceTotal}`;
    if (globalModifier !== 0) {
      breakdown += globalModifier > 0 ? ` + ${globalModifier}` : ` - ${Math.abs(globalModifier)}`;
    }
    breakdown += ` [Alvo: ${target}% | 1/2: ${Math.floor(target / 2)} | 1/5: ${Math.floor(target / 5)}]`;
    return { formula, breakdown };
  }

  const formulaParts = dice.map((d) => {
    const mod = d.modifier || 0;
    if (mod === 0) return `d${d.faces}`;
    return `(d${d.faces}${mod > 0 ? `+${mod}` : mod})`;
  });
  if (globalModifier !== 0) {
    formulaParts.push(globalModifier > 0 ? `+(${globalModifier})` : `(${globalModifier})`);
  }
  const formula = formulaParts.join(' + ');

  const breakdownParts = dice.map((d) => {
    const mod = d.modifier || 0;
    if (mod === 0) return `${d.currentValue}`;
    return `(${d.currentValue}${mod > 0 ? `+${mod}` : mod})`;
  });
  if (globalModifier !== 0) {
    breakdownParts.push(globalModifier > 0 ? `+ ${globalModifier}` : `- ${Math.abs(globalModifier)}`);
  }
  const breakdown = breakdownParts.join(' + ');

  return { formula, breakdown };
}

// Calcula Patamar e Rótulo do Resultado baseado nas Regras (suporta vantagens e múltiplos d20)
function evaluateOutcome(
  dice: TrayDie[],
  modifier: number,
  rules: DiceTrayRules,
): { total: number; diceTotal: number; outcomeTier: RollOutcomeTier; outcomeLabel: string } {
  const d20Dice = dice.filter((d) => d.faces === 20);

  // 1. Roll & Keep
  if (rules.ruleMode === 'roll_keep') {
    const keepCount = Math.max(1, Math.min(dice.length, rules.keepCount || 2));
    const sorted = [...dice].sort((a, b) => {
      const valA = a.currentValue + (a.modifier || 0);
      const valB = b.currentValue + (b.modifier || 0);
      return rules.keepMode === 'lowest' ? valA - valB : valB - valA;
    });
    const kept = sorted.slice(0, keepCount);
    const diceTotal = kept.reduce((acc, d) => acc + d.currentValue + (d.modifier || 0), 0);
    const total = diceTotal + modifier;
    const isCrit = d20Dice.some((d) => d.currentValue >= rules.critPositive);
    const isFumble = !isCrit && d20Dice.some((d) => d.currentValue <= rules.critNegative);
    const outcomeTier: RollOutcomeTier = isCrit ? 'crit' : isFumble ? 'fumble' : 'neutral';
    const outcomeLabel = `Roll & Keep (${keepCount} ${rules.keepMode === 'lowest' ? 'Menores' : 'Maiores'})`;
    return { total, diceTotal, outcomeTier, outcomeLabel };
  }

  // 2. Verificação de Porcentagem (d100 / Call of Cthulhu / BRP)
  if (rules.ruleMode === 'percentile') {
    const diceTotal = dice.reduce((acc, d) => acc + d.currentValue + (d.modifier || 0), 0);
    const total = diceTotal + modifier;
    const target = rules.percentileTarget ?? 50;

    let outcomeTier: RollOutcomeTier = 'neutral';
    let outcomeLabel = '';

    if (total <= rules.critPositive) {
      outcomeTier = 'crit';
      outcomeLabel = `SUCESSO CRÍTICO (${total} ≤ ${rules.critPositive})`;
    } else if (total >= rules.critNegative) {
      outcomeTier = 'fumble';
      outcomeLabel = `DESASTRE CRÍTICO (${total} ≥ ${rules.critNegative})`;
    } else if (total <= Math.floor(target / 5)) {
      outcomeTier = 'extreme';
      outcomeLabel = `SUCESSO EXTREMO (${total} ≤ ${Math.floor(target / 5)})`;
    } else if (total <= Math.floor(target / 2)) {
      outcomeTier = 'success';
      outcomeLabel = `SUCESSO DIFÍCIL (${total} ≤ ${Math.floor(target / 2)})`;
    } else if (total <= target) {
      outcomeTier = 'success';
      outcomeLabel = `SUCESSO REGULAR (${total} ≤ ${target})`;
    } else {
      outcomeTier = 'fail';
      outcomeLabel = `FALHA (${total} > ${target})`;
    }

    return { total, diceTotal, outcomeTier, outcomeLabel };
  }

  if (rules.ruleMode === 'pool' && rules.poolThreshold !== null) {
    const successCount = dice.filter(
      (d) => d.currentValue + (d.modifier || 0) >= (rules.poolThreshold ?? 6),
    ).length;
    const total = successCount + modifier;
    const outcomeTier: RollOutcomeTier = total > 0 ? 'success' : 'fail';
    const outcomeLabel = `${total} Sucesso(s)`;
    return { total, diceTotal: successCount, outcomeTier, outcomeLabel };
  }

  if (rules.ruleMode === 'highest') {
    const highest = Math.max(...dice.map((d) => d.currentValue + (d.modifier || 0)), 0);
    const total = highest + modifier;
    const isCrit = d20Dice.some((d) => d.currentValue >= rules.critPositive);
    const isFumble = !isCrit && d20Dice.some((d) => d.currentValue <= rules.critNegative);
    const outcomeTier: RollOutcomeTier = isCrit ? 'crit' : isFumble ? 'fumble' : 'neutral';
    const outcomeLabel = isCrit ? 'Crítico Positivo!' : isFumble ? 'Desastre Crítico!' : `Maior Dado (${highest})`;
    return { total, diceTotal: highest, outcomeTier, outcomeLabel };
  }

  if (rules.ruleMode === 'lowest') {
    const lowest = Math.min(...dice.map((d) => d.currentValue + (d.modifier || 0)), 0);
    const total = lowest + modifier;
    return { total, diceTotal: lowest, outcomeTier: 'neutral', outcomeLabel: `Menor Dado (${lowest})` };
  }

  // Padrão: Soma dos Dados + Modificadores Isolados + Modificador Global
  const diceTotal = dice.reduce((acc, d) => acc + d.currentValue + (d.modifier || 0), 0);
  const total = diceTotal + modifier;

  // Verificação de Crítico Positivo e Fumble no d20 (avalia todos os d20s em caso de vantagem)
  const isD20Crit = d20Dice.some((d) => d.currentValue >= rules.critPositive);
  const isD20Fumble = !isD20Crit && d20Dice.some((d) => d.currentValue <= rules.critNegative);

  if (isD20Crit) {
    return { total, diceTotal, outcomeTier: 'crit', outcomeLabel: 'CRÍTICO POSITIVO!' };
  }
  if (isD20Fumble) {
    return { total, diceTotal, outcomeTier: 'fumble', outcomeLabel: 'DESASTRE CRÍTICO!' };
  }

  // Verificação de DC (Dificuldade do Teste)
  if (rules.successDC !== null) {
    if (total >= rules.successDC) {
      return { total, diceTotal, outcomeTier: 'success', outcomeLabel: `Sucesso no Teste (DC ${rules.successDC})` };
    }
    return { total, diceTotal, outcomeTier: 'fail', outcomeLabel: `Falha no Teste (DC ${rules.successDC})` };
  }

  return { total, diceTotal, outcomeTier: 'neutral', outcomeLabel: 'Resultado Final' };
}

// Cria uma snapshot para histórico de Undo/Redo
function takeSnapshot(dice: TrayDie[], modifier: number): ActiveTraySnapshot {
  return {
    dice: dice.map((d) => ({ ...d })),
    modifier,
  };
}

// Posicionamento aleatório inteligente dentro da bandeja
function getRandomTrayPosition(existingCount: number): { x: number; y: number; rotation: number } {
  const cols = 4;
  const row = Math.floor(existingCount / cols);
  const col = existingCount % cols;

  const baseX = 18 + col * 20;
  const baseY = 22 + (row % 3) * 26;

  const jitterX = (Math.random() - 0.5) * 8;
  const jitterY = (Math.random() - 0.5) * 8;
  const rotation = Math.round((Math.random() - 0.5) * 24);

  return {
    x: Math.max(14, Math.min(84, baseX + jitterX)),
    y: Math.max(18, Math.min(78, baseY + jitterY)),
    rotation,
  };
}

export const useDiceTrayStore = create<DiceTrayState>((set, get) => ({
  isOpen: false,
  isMinimized: false,
  activeTab: 'tray',

  dice: [],
  modifier: 0,
  isRolling: false,
  lastRollResult: null,

  visibility: 'public',
  soundEnabled: true,
  isOverlayEnabled: true,
  activeNotification: null,

  rules: DEFAULT_RULES,

  history: [],
  undoStack: [],
  redoStack: [],
  selectedDieIds: [],
  toggleSelectDie: (dieId) =>
    set((state) => ({
      selectedDieIds: state.selectedDieIds.includes(dieId)
        ? state.selectedDieIds.filter((id) => id !== dieId)
        : [...state.selectedDieIds, dieId],
    })),
  clearSelectedDice: () => set({ selectedDieIds: [] }),

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen, isMinimized: false })),
  setIsMinimized: (isMinimized) => set({ isMinimized }),
  setActiveTab: (activeTab) => set({ activeTab }),

  setVisibility: (visibility) => set({ visibility }),
  setSoundEnabled: (soundEnabled) => {
    diceAudio.setMuted(!soundEnabled);
    set({ soundEnabled });
  },
  setIsOverlayEnabled: (isOverlayEnabled) => set({ isOverlayEnabled }),
  dismissNotification: () => set({ activeNotification: null }),
  clearLastRollResult: () => set({ lastRollResult: null }),

  setModifier: (modifier) => {
    const { dice, undoStack } = get();
    const newSnapshot = takeSnapshot(dice, get().modifier);
    const newUndo = [newSnapshot, ...undoStack].slice(0, 5);
    set({ modifier, undoStack: newUndo, redoStack: [] });
  },

  setRules: (partialRules) =>
    set((state) => ({
      rules: { ...state.rules, ...partialRules },
    })),

  // Adicionar Dado na Bandeja
  addDie: (faces, color) => {
    const { dice, modifier, undoStack } = get();
    const newSnapshot = takeSnapshot(dice, modifier);
    const pos = getRandomTrayPosition(dice.length);

    diceAudio.playDieDrop();
    diceHaptics.drop();

    const initialVal = rollDieFace(faces);
    const newDie: TrayDie = {
      id: generateId(),
      faces,
      currentValue: initialVal,
      animatedFace: initialVal,
      sideFaces: generateSideFaces(faces, initialVal),
      isRolling: false,
      color: color || DIE_COLORS[faces] || '#8257e5',
      modifier: 0,
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      rotation: pos.rotation,
      rotX: 0,
      rotY: 0,
      lift: 0,
    };

    set({
      dice: [...dice, newDie],
      undoStack: [newSnapshot, ...undoStack].slice(0, 5),
      redoStack: [],
    });
  },

  // Remover Dado
  removeDie: (dieId) => {
    const { dice, modifier, undoStack, selectedDieIds } = get();
    const newSnapshot = takeSnapshot(dice, modifier);
    set({
      dice: dice.filter((d) => d.id !== dieId),
      selectedDieIds: selectedDieIds.filter((id) => id !== dieId),
      undoStack: [newSnapshot, ...undoStack].slice(0, 5),
      redoStack: [],
    });
  },

  // Atualizar posição e rotação do dado (arrasto livre e alinhamento)
  updateDiePosition: (dieId, x, y, rotation, rotX, rotY) => {
    set((state) => ({
      dice: state.dice.map((d) =>
        d.id === dieId
          ? {
              ...d,
              x,
              y,
              vx: 0,
              vy: 0,
              rotation: rotation !== undefined ? rotation : d.rotation,
              rotX: rotX !== undefined ? rotX : 0,
              rotY: rotY !== undefined ? rotY : 0,
              lift: 0,
            }
          : d,
      ),
    }));
  },

  // Incrementar valor do dado (Ajuste pós-resultado)
  incrementDie: (dieId) => {
    const { dice, modifier, undoStack } = get();
    const newSnapshot = takeSnapshot(dice, modifier);
    const updatedDice = dice.map((d) => {
      if (d.id !== dieId) return d;
      const next = d.currentValue >= d.faces ? 1 : d.currentValue + 1;
      return {
        ...d,
        currentValue: next,
        animatedFace: next,
        sideFaces: generateSideFaces(d.faces, next),
      };
    });

    set({
      dice: updatedDice,
      undoStack: [newSnapshot, ...undoStack].slice(0, 5),
      redoStack: [],
    });
  },

  // Decrementar valor do dado (Ajuste pós-resultado)
  decrementDie: (dieId) => {
    const { dice, modifier, undoStack } = get();
    const newSnapshot = takeSnapshot(dice, modifier);
    const updatedDice = dice.map((d) => {
      if (d.id !== dieId) return d;
      const next = d.currentValue <= 1 ? d.faces : d.currentValue - 1;
      return {
        ...d,
        currentValue: next,
        animatedFace: next,
        sideFaces: generateSideFaces(d.faces, next),
      };
    });

    set({
      dice: updatedDice,
      undoStack: [newSnapshot, ...undoStack].slice(0, 5),
      redoStack: [],
    });
  },

  // Definir valor exato
  setDieValue: (dieId, val) => {
    const { dice, modifier, undoStack } = get();
    const newSnapshot = takeSnapshot(dice, modifier);
    const updatedDice = dice.map((d) => {
      if (d.id !== dieId) return d;
      const clamped = Math.max(1, Math.min(d.faces, val));
      return {
        ...d,
        currentValue: clamped,
        animatedFace: clamped,
        sideFaces: generateSideFaces(d.faces, clamped),
      };
    });

    set({
      dice: updatedDice,
      undoStack: [newSnapshot, ...undoStack].slice(0, 5),
      redoStack: [],
    });
  },

  // Modificador Isolado do Dado
  setDieModifier: (dieId, mod) => {
    const { dice, modifier, undoStack } = get();
    const newSnapshot = takeSnapshot(dice, modifier);
    const clamped = Math.max(-99, Math.min(99, mod));
    const updatedDice = dice.map((d) => (d.id === dieId ? { ...d, modifier: clamped } : d));
    set({
      dice: updatedDice,
      undoStack: [newSnapshot, ...undoStack].slice(0, 5),
      redoStack: [],
    });
  },

  incrementDieModifier: (dieId) => {
    const target = get().dice.find((d) => d.id === dieId);
    if (!target) return;
    get().setDieModifier(dieId, (target.modifier || 0) + 1);
  },

  decrementDieModifier: (dieId) => {
    const target = get().dice.find((d) => d.id === dieId);
    if (!target) return;
    get().setDieModifier(dieId, (target.modifier || 0) - 1);
  },

  // ROLAGEM PRINCIPAL A 144 FPS COM IMPULSO PROPORCIONAL AO TEMPO SEGURADO
  rollDice: (senderName, senderRole, intensity = 0) => {
    const { dice, modifier, rules, visibility, undoStack, history } = get();
    if (dice.length === 0 || get().isRolling) return;

    let realSenderName = senderName;
    let realSenderRole = senderRole;
    if (!realSenderName || realSenderName === 'Eu') {
      const mpState = useMultiplayerStore.getState();
      realSenderName = mpState.userName?.trim()
        ? mpState.userName.trim()
        : mpState.role === 'player'
        ? 'Jogador'
        : 'Mestre';
      realSenderRole = mpState.role === 'player' ? 'player' : 'gm';
    }

    const newSnapshot = takeSnapshot(dice, modifier);
    const newUndo = [newSnapshot, ...undoStack].slice(0, 5);

    // Suporte a rolar apenas dados selecionados (ou todos caso nenhum esteja selecionado)
    const { selectedDieIds } = get();
    const isPartialRoll = selectedDieIds.length > 0;
    const diceToRoll = isPartialRoll ? dice.filter((d) => selectedDieIds.includes(d.id)) : dice;

    diceAudio.playRoll(diceToRoll.length, intensity);

    // Gera valores novos apenas para os dados que estão rolando
    const finalValues = dice.map((d) => {
      const isRollingThis = diceToRoll.some((r) => r.id === d.id);
      return isRollingThis ? rollDieFace(d.faces) : d.currentValue;
    });

    const speedBoost = 1 + Math.pow(intensity || 0, 1.25) * 2.5;
    const physics = dice.map((d, i) => {
      const isRollingThis = diceToRoll.some((r) => r.id === d.id);
      if (!isRollingThis) {
        return {
          id: d.id,
          x: d.x,
          y: d.y,
          vx: 0,
          vy: 0,
          rotation: d.rotation,
          rotSpeed: 0,
          rotX: 0,
          rotY: 0,
          lift: 0,
          duration: 0,
          settled: true,
          lastFaceSwap: 0,
          faceInterval: 99999,
          sideFaces: [...d.sideFaces],
        };
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = (110 + Math.random() * 70) * speedBoost;
      const spinDirection = Math.random() > 0.5 ? 1 : -1;
      const rotSpeed = spinDirection * (1000 + Math.random() * 900) * (1 + Math.pow(intensity || 0, 1.2) * 1.8);
      const duration = (1350 + i * 160 + Math.random() * 150) * (1 + (intensity || 0) * 0.65);

      return {
        id: d.id,
        x: d.x,
        y: d.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: d.rotation,
        rotSpeed,
        rotX: 0,
        rotY: 0,
        lift: 18 + Math.random() * 8 + (intensity || 0) * 16,
        duration,
        settled: false,
        lastFaceSwap: 0,
        faceInterval: 28,
        sideFaces: [...d.sideFaces],
      };
    });

    // Inicia estado de rolagem (UMA ÚNICA re-renderização React para ligar isRolling)
    set({
      isRolling: true,
      lastRollResult: null,
      undoStack: newUndo,
      redoStack: [],
      dice: dice.map((d) => ({ ...d, isRolling: true })),
    });

    // Desliga transições CSS em todos os dados durante o loop de física
    physics.forEach((p) => {
      const dom = diceDOMRegistry.get(p.id);
      if (dom) setDieAnimating(dom, true);
    });

    const startTime = performance.now();
    let lastFrameTime = startTime;

    const tick = (now: number) => {
      const rawDt = now - lastFrameTime;
      const dt = Math.min(24, Math.max(10, rawDt));
      lastFrameTime = now;
      const elapsed = now - startTime;

      let anyActive = false;

      // 1. Atualização de física e desaceleração gradual realista até parada natural
      for (let idx = 0; idx < physics.length; idx++) {
        const p = physics[idx];
        if (p.settled) continue;

        const isBraking = elapsed >= p.duration;
        const currentSpeed = Math.hypot(p.vx, p.vy);
        const rotMagnitude = Math.abs(p.rotSpeed);

        // Critério de repouso suave: velocidade < 1.0 px/s, rotação < 6 deg/s e lift amortecido
        // Ou timeout de segurança (duration + 850ms)
        if (isBraking && ((currentSpeed < 1.0 && rotMagnitude < 6 && p.lift < 0.15) || elapsed >= p.duration + 850)) {
          p.settled = true;
          p.vx = 0;
          p.vy = 0;
          p.rotSpeed = 0;
          p.lift = 0;
          p.rotX = 0;
          p.rotY = 0;
          continue;
        }

        anyActive = true;

        let nx = p.x + p.vx * (dt / 1000);
        let ny = p.y + p.vy * (dt / 1000);

        const minX = 12;
        const maxX = 88;
        const minY = 14;
        const maxY = 86;

        let bounced = false;
        let bounceForce = 0;

        const restitution = isBraking
          ? 0.45
          : 0.86 + Math.min(0.06, (intensity || 0) * 0.05);

        if (nx <= minX) {
          nx = minX;
          bounceForce = Math.abs(p.vx);
          p.vx = -p.vx * restitution;
          p.vy += (Math.random() - 0.5) * (isBraking ? 15 : (45 + (intensity || 0) * 65));
          p.rotSpeed = -p.rotSpeed * 0.72 + (Math.random() - 0.5) * (isBraking ? 120 : (700 + (intensity || 0) * 900));
          p.lift = Math.min(32, p.lift + (isBraking ? 2 : 10 + (intensity || 0) * 8));
          bounced = true;
        } else if (nx >= maxX) {
          nx = maxX;
          bounceForce = Math.abs(p.vx);
          p.vx = -p.vx * restitution;
          p.vy += (Math.random() - 0.5) * (isBraking ? 15 : (45 + (intensity || 0) * 65));
          p.rotSpeed = -p.rotSpeed * 0.72 + (Math.random() - 0.5) * (isBraking ? 120 : (700 + (intensity || 0) * 900));
          p.lift = Math.min(32, p.lift + (isBraking ? 2 : 10 + (intensity || 0) * 8));
          bounced = true;
        }

        if (ny <= minY) {
          ny = minY;
          bounceForce = Math.max(bounceForce, Math.abs(p.vy));
          p.vy = -p.vy * restitution;
          p.vx += (Math.random() - 0.5) * (isBraking ? 15 : (45 + (intensity || 0) * 65));
          p.rotSpeed = -p.rotSpeed * 0.72 + (Math.random() - 0.5) * (isBraking ? 120 : (700 + (intensity || 0) * 900));
          p.lift = Math.min(32, p.lift + (isBraking ? 2 : 10 + (intensity || 0) * 8));
          bounced = true;
        } else if (ny >= maxY) {
          ny = maxY;
          bounceForce = Math.max(bounceForce, Math.abs(p.vy));
          p.vy = -p.vy * restitution;
          p.vx += (Math.random() - 0.5) * (isBraking ? 15 : (45 + (intensity || 0) * 65));
          p.rotSpeed = -p.rotSpeed * 0.72 + (Math.random() - 0.5) * (isBraking ? 120 : (700 + (intensity || 0) * 900));
          p.lift = Math.min(32, p.lift + (isBraking ? 2 : 10 + (intensity || 0) * 8));
          bounced = true;
        }

        if (bounced && !isBraking) {
          diceAudio.playBounce(Math.min(2.5, bounceForce / 45));
          diceHaptics.bounce(bounceForce);
        }

        p.x = nx;
        p.y = ny;

        // Desaceleração suave por atrito: aumenta progressivamente até os dados quase pararem
        if (isBraking) {
          p.vx *= 0.925;
          p.vy *= 0.925;
          p.rotSpeed *= 0.90;
          p.lift = Math.max(0, p.lift * 0.84);
        } else {
          const progress = Math.min(1, elapsed / p.duration);
          const friction = progress < 0.6
            ? 0.988 + Math.min(0.005, (intensity || 0) * 0.005)
            : 0.988 - (progress - 0.6) * 0.065;
          p.vx *= friction;
          p.vy *= friction;
          p.rotSpeed *= (0.985 - progress * 0.035);
          p.lift = Math.max(0, p.lift * 0.94);
        }

        p.rotation += p.rotSpeed * (dt / 1000);

        // Ângulos 3D de pitch e yaw proporcionais à velocidade restante
        const pitchSpeedFactor = Math.min(28, currentSpeed * 0.25);
        p.rotX = Math.sin(elapsed * 0.015 + idx * 2.3) * pitchSpeedFactor;
        p.rotY = Math.cos(elapsed * 0.015 + idx * 2.3) * pitchSpeedFactor;
      }

      // 2. Colisão mútua entre dados (se misturam com vigor e quicam entre si)
      for (let i = 0; i < physics.length; i++) {
        for (let j = i + 1; j < physics.length; j++) {
          const p1 = physics[i];
          const p2 = physics[j];
          if (p1.settled && p2.settled) continue;

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = 11.5;

          if (dist < minDist && dist > 0.01) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = (minDist - dist) * 0.5;

            p1.x -= nx * overlap;
            p1.y -= ny * overlap;
            p2.x += nx * overlap;
            p2.y += ny * overlap;

            const kx = p1.vx - p2.vx;
            const ky = p1.vy - p2.vy;
            const impulse = nx * kx + ny * ky;

            if (impulse > 0) {
              p1.vx -= impulse * nx * 0.95;
              p1.vy -= impulse * ny * 0.95;
              p2.vx += impulse * nx * 0.95;
              p2.vy += impulse * ny * 0.95;

              p1.lift = Math.min(30, p1.lift + 8 + (intensity || 0) * 6);
              p2.lift = Math.min(30, p2.lift + 8 + (intensity || 0) * 6);

              diceAudio.playDieCollision();
              diceHaptics.collision();
            }
          }
        }
      }

      // 3. Atualização direta do DOM via GPU transforms (Zero re-renderizações React durante o giro)
      for (let idx = 0; idx < physics.length; idx++) {
        const p = physics[idx];
        const dom = diceDOMRegistry.get(p.id);
        if (!dom) continue;

        if (dom.card.current) {
          dom.card.current.style.left = `${Math.round(p.x * 10) / 10}%`;
          dom.card.current.style.top = `${Math.round(p.y * 10) / 10}%`;
          dom.card.current.style.transform = `translate3d(-50%, -50%, 0)`;
        }

        if (dom.body.current) {
          dom.body.current.style.transform = `
            translate3d(0, ${Math.round(-p.lift * 0.55 * 10) / 10}px, 0)
            rotate(${Math.round(p.rotation * 10) / 10}deg)
            perspective(550px)
            rotateX(${Math.round(p.rotX * 10) / 10}deg)
            rotateY(${Math.round(p.rotY * 10) / 10}deg)
            scale(1.04)
          `;
        }

        if (dom.shadow.current) {
          dom.shadow.current.style.transform = `translate3d(${Math.round(p.lift * 0.45 * 10) / 10}px, ${Math.round(p.lift * 0.55 * 10) / 10}px, 0) scale(${Math.round((1 + p.lift * 0.02) * 100) / 100})`;
          dom.shadow.current.style.opacity = `${Math.max(0.18, 0.65 - p.lift * 0.02)}`;
        }

        // Troca rápida de faces no SVG com desaceleração e revelação da face final
        if (!p.settled) {
          if (elapsed >= p.duration * 0.82) {
            // Revela e fixa a face final sorteada enquanto o dado desliza até parar completamente
            const finalVal = finalValues[idx];
            if (dom.mainNum.current && dom.mainNum.current.textContent !== `${finalVal}`) {
              dom.mainNum.current.textContent = `${finalVal}`;
              const sideFaces = generateSideFaces(dice[idx].faces, finalVal);
              sideFaces.forEach((sf, sIdx) => {
                const sideEl = dom.sideNums.current[sIdx];
                if (sideEl) sideEl.textContent = `${sf}`;
              });
            }
          } else if (now - p.lastFaceSwap > p.faceInterval) {
            const progress = elapsed / p.duration;
            p.faceInterval = 28 + Math.pow(progress, 2.2) * 160;
            const dieDef = dice[idx];
            const newFace = rollDieFace(dieDef.faces);
            const newSideFaces = generateSideFaces(dieDef.faces, newFace);
            p.sideFaces = newSideFaces;
            p.lastFaceSwap = now;

            if (dom.mainNum.current) dom.mainNum.current.textContent = `${newFace}`;
            p.sideFaces.forEach((sf, sIdx) => {
              const sideEl = dom.sideNums.current[sIdx];
              if (sideEl) sideEl.textContent = `${sf}`;
            });
          }
        }
      }

      if (anyActive) {
        requestAnimationFrame(tick);
      } else {
        // Limpa estilos inline de animação do DOM e restaura transição CSS
        physics.forEach((p) => {
          const dom = diceDOMRegistry.get(p.id);
          if (dom) {
            setDieAnimating(dom, false);
            if (dom.body.current) dom.body.current.style.transform = '';
            if (dom.shadow.current) {
              dom.shadow.current.style.transform = '';
              dom.shadow.current.style.opacity = '';
            }
          }
        });

        // Único React re-render com os valores e posições finais assentados
        // Mantém as posições e a angulação natural de repouso onde cada dado parou
        const settledDice = get().dice.map((d, idx) => ({
          ...d,
          x: Math.round(physics[idx].x * 10) / 10,
          y: Math.round(physics[idx].y * 10) / 10,
          currentValue: finalValues[idx],
          animatedFace: finalValues[idx],
          sideFaces: generateSideFaces(d.faces, finalValues[idx]),
          rotation: Math.round(((physics[idx].rotation % 360) + 360) % 360),
          rotX: 0,
          rotY: 0,
          lift: 0,
          vx: 0,
          vy: 0,
          isRolling: false,
        }));

        const evaluated = evaluateOutcome(settledDice, modifier, rules);
        diceHaptics.settle();

        if (evaluated.outcomeTier === 'crit') {
          diceAudio.playCrit();
        } else if (evaluated.outcomeTier === 'fumble') {
          diceAudio.playFumble();
        }

        const { formula, breakdown } = formatFormulaAndBreakdown(settledDice, modifier, rules);

        const newEntry: DiceRollEntry = {
          id: generateId(),
          senderName: realSenderName,
          senderRole: realSenderRole || 'gm',
          visibility,
          formula,
          dice: settledDice.map((d) => ({
            id: d.id,
            faces: d.faces,
            value: d.currentValue,
            modifier: d.modifier || 0,
            color: d.color,
          })),
          modifier,
          total: evaluated.total,
          outcomeTier: evaluated.outcomeTier,
          outcomeLabel: evaluated.outcomeLabel,
          timestamp: Date.now(),
        };

        set({
          isRolling: false,
          dice: settledDice,
          lastRollResult: {
            total: evaluated.total,
            diceTotal: evaluated.diceTotal,
            modifier,
            formula,
            outcomeTier: evaluated.outcomeTier,
            outcomeLabel: evaluated.outcomeLabel,
            breakdown,
          },
          history: [newEntry, ...history].slice(0, 50),
          // activeNotification não é enviado para si próprio (apenas jogadores remotos recebem o banner no topo)
        });

        if (socket && socket.connected) {
          socket.emit('dice:roll' as any, newEntry);
        }
      }
    };

    requestAnimationFrame(tick);
  },

  // Desfazer (Undo - limite 5)
  undo: () => {
    const { undoStack, redoStack, dice, modifier } = get();
    if (undoStack.length === 0) return;

    const previous = undoStack[0];
    const newUndo = undoStack.slice(1);
    const currentSnapshot = takeSnapshot(dice, modifier);

    set({
      dice: previous.dice,
      modifier: previous.modifier,
      undoStack: newUndo,
      redoStack: [currentSnapshot, ...redoStack].slice(0, 5),
    });
  },

  // Refazer (Redo - limite 5)
  redo: () => {
    const { undoStack, redoStack, dice, modifier } = get();
    if (redoStack.length === 0) return;

    const next = redoStack[0];
    const newRedo = redoStack.slice(1);
    const currentSnapshot = takeSnapshot(dice, modifier);

    set({
      dice: next.dice,
      modifier: next.modifier,
      undoStack: [currentSnapshot, ...undoStack].slice(0, 5),
      redoStack: newRedo,
    });
  },

  // Limpar Bandeja
  clearTray: () => {
    const { dice, modifier, undoStack } = get();
    if (dice.length === 0) return;
    const newSnapshot = takeSnapshot(dice, modifier);
    set({
      dice: [],
      selectedDieIds: [],
      lastRollResult: null,
      undoStack: [newSnapshot, ...undoStack].slice(0, 5),
      redoStack: [],
    });
  },

  // Limpar Histórico
  clearHistory: () => set({ history: [] }),

  // Recebe rolagem remota de outro jogador ou mestre
  receiveRemoteRoll: (roll) => {
    set((state) => ({
      history: [roll, ...state.history].slice(0, 50),
      activeNotification: state.isOverlayEnabled ? roll : null,
    }));
  },
}));
