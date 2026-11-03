import { create } from 'zustand';
import { generateId } from '@/lib/uuid';
import { diceAudio } from '@/lib/diceAudio';
import { socket } from '@/lib/socket';
import { useMultiplayerStore } from './useMultiplayerStore';

export type DieFaceCount = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export interface TrayDie {
  id: string;
  faces: DieFaceCount;
  currentValue: number;
  animatedFace: number;
  isRolling: boolean;
  color: string;
  x: number; // Porcentagem 0..100 na bandeja
  y: number; // Porcentagem 0..100 na bandeja
  rotation: number;
}

export type RollOutcomeTier = 'crit' | 'extreme' | 'success' | 'fail' | 'fumble' | 'neutral';

export interface DiceTrayRules {
  critPositive: number; // Ex: 20
  critNegative: number; // Ex: 1
  successDC: number | null; // Ex: 15
  poolThreshold: number | null; // Ex: 6 (sucessos em parada de dados)
  ruleMode: 'sum' | 'pool' | 'highest' | 'lowest';
}

export interface DiceRollEntry {
  id: string;
  senderName: string;
  senderRole: 'gm' | 'player';
  visibility: 'public' | 'gm' | 'self';
  formula: string;
  dice: Array<{ id: string; faces: number; value: number; color?: string }>;
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

  // Rolagem & Ajuste Pós-Resultado
  rollDice: (senderName?: string, senderRole?: 'gm' | 'player') => void;
  incrementDie: (dieId: string) => void;
  decrementDie: (dieId: string) => void;
  setDieValue: (dieId: string, val: number) => void;
  updateDiePosition: (dieId: string, x: number, y: number, rotation?: number) => void;

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
  ruleMode: 'sum',
};

// Calcula Patamar e Rótulo do Resultado baseado nas Regras
function evaluateOutcome(
  dice: TrayDie[],
  modifier: number,
  rules: DiceTrayRules,
): { total: number; diceTotal: number; outcomeTier: RollOutcomeTier; outcomeLabel: string } {
  const d20Die = dice.find((d) => d.faces === 20);

  if (rules.ruleMode === 'pool' && rules.poolThreshold !== null) {
    const successCount = dice.filter((d) => d.currentValue >= (rules.poolThreshold ?? 6)).length;
    const total = successCount + modifier;
    const outcomeTier: RollOutcomeTier = total > 0 ? 'success' : 'fail';
    const outcomeLabel = `${total} Sucesso(s)`;
    return { total, diceTotal: successCount, outcomeTier, outcomeLabel };
  }

  if (rules.ruleMode === 'highest') {
    const highest = Math.max(...dice.map((d) => d.currentValue), 0);
    const total = highest + modifier;
    const isCrit = d20Die && d20Die.currentValue >= rules.critPositive;
    const isFumble = d20Die && d20Die.currentValue <= rules.critNegative;
    const outcomeTier: RollOutcomeTier = isCrit ? 'crit' : isFumble ? 'fumble' : 'neutral';
    const outcomeLabel = isCrit ? 'Crítico Positivo!' : isFumble ? 'Desastre Crítico!' : `Maior Dado (${highest})`;
    return { total, diceTotal: highest, outcomeTier, outcomeLabel };
  }

  if (rules.ruleMode === 'lowest') {
    const lowest = Math.min(...dice.map((d) => d.currentValue), 0);
    const total = lowest + modifier;
    return { total, diceTotal: lowest, outcomeTier: 'neutral', outcomeLabel: `Menor Dado (${lowest})` };
  }

  // Padrão: Soma dos Dados + Modificador
  const diceTotal = dice.reduce((acc, d) => acc + d.currentValue, 0);
  const total = diceTotal + modifier;

  // Verificação de Crítico Positivo e Fumble no d20 ou maior dado
  const isD20Crit = d20Die ? d20Die.currentValue >= rules.critPositive : false;
  const isD20Fumble = d20Die ? d20Die.currentValue <= rules.critNegative : false;

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

  dice: [
    {
      id: generateId(),
      faces: 20,
      currentValue: 20,
      animatedFace: 20,
      isRolling: false,
      color: DIE_COLORS[20],
      x: 35,
      y: 40,
      rotation: 0,
    },
  ],
  modifier: 0,
  isRolling: false,
  lastRollResult: null,

  visibility: 'public',
  soundEnabled:
    typeof window !== 'undefined'
      ? localStorage.getItem('sgm_dice_tray_sound') !== 'false'
      : true,
  isOverlayEnabled:
    typeof window !== 'undefined'
      ? localStorage.getItem('sgm_dice_tray_overlay') !== 'false'
      : true,
  activeNotification: null,

  rules: DEFAULT_RULES,
  history: [],
  undoStack: [],
  redoStack: [],

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsMinimized: (isMinimized) => set({ isMinimized }),
  setActiveTab: (activeTab) => set({ activeTab }),

  setSoundEnabled: (soundEnabled) => {
    localStorage.setItem('sgm_dice_tray_sound', String(soundEnabled));
    diceAudio.setMuted(!soundEnabled);
    set({ soundEnabled });
  },

  setIsOverlayEnabled: (isOverlayEnabled) => {
    localStorage.setItem('sgm_dice_tray_overlay', String(isOverlayEnabled));
    set({ isOverlayEnabled });
  },

  setVisibility: (visibility) => set({ visibility }),
  dismissNotification: () => set({ activeNotification: null }),

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

  // Adicionar Dado na Bandeja (com som táctil de dado caindo no feltro)
  addDie: (faces, color) => {
    const { dice, modifier, undoStack } = get();
    const newSnapshot = takeSnapshot(dice, modifier);
    const pos = getRandomTrayPosition(dice.length);

    // Reproduz efeito sonoro realista de dado caindo no feltro
    diceAudio.playDieDrop();

    const newDie: TrayDie = {
      id: generateId(),
      faces,
      currentValue: Math.floor(Math.random() * faces) + 1,
      animatedFace: Math.floor(Math.random() * faces) + 1,
      isRolling: false,
      color: color || DIE_COLORS[faces] || '#8257e5',
      x: pos.x,
      y: pos.y,
      rotation: 0, // Inicia retinho
    };

    set({
      dice: [...dice, newDie],
      undoStack: [newSnapshot, ...undoStack].slice(0, 5),
      redoStack: [],
    });
  },

  // Remover Dado
  removeDie: (dieId) => {
    const { dice, modifier, undoStack } = get();
    const newSnapshot = takeSnapshot(dice, modifier);
    set({
      dice: dice.filter((d) => d.id !== dieId),
      undoStack: [newSnapshot, ...undoStack].slice(0, 5),
      redoStack: [],
    });
  },

  // Atualizar posição e rotação do dado (arrasto livre e alinhamento)
  updateDiePosition: (dieId, x, y, rotation) => {
    set((state) => ({
      dice: state.dice.map((d) =>
        d.id === dieId
          ? {
              ...d,
              x,
              y,
              rotation: rotation !== undefined ? rotation : d.rotation,
            }
          : d,
      ),
    }));
  },

  // Incrementar valor do dado (Ajuste pós-resultado)
  incrementDie: (dieId) => {
    const { dice, modifier, rules, undoStack } = get();
    const newSnapshot = takeSnapshot(dice, modifier);
    const updatedDice = dice.map((d) => {
      if (d.id !== dieId) return d;
      const next = d.currentValue >= d.faces ? 1 : d.currentValue + 1;
      return { ...d, currentValue: next, animatedFace: next };
    });

    const evaluated = evaluateOutcome(updatedDice, modifier, rules);
    set({
      dice: updatedDice,
      lastRollResult: {
        total: evaluated.total,
        diceTotal: evaluated.diceTotal,
        modifier,
        formula: updatedDice.map((d) => `d${d.faces}`).join(' + ') + (modifier !== 0 ? ` + (${modifier})` : ''),
        outcomeTier: evaluated.outcomeTier,
        outcomeLabel: evaluated.outcomeLabel,
        breakdown: updatedDice.map((d) => `${d.currentValue}`).join(' + ') + (modifier !== 0 ? ` + ${modifier}` : ''),
      },
      undoStack: [newSnapshot, ...undoStack].slice(0, 5),
      redoStack: [],
    });
  },

  // Decrementar valor do dado (Ajuste pós-resultado)
  decrementDie: (dieId) => {
    const { dice, modifier, rules, undoStack } = get();
    const newSnapshot = takeSnapshot(dice, modifier);
    const updatedDice = dice.map((d) => {
      if (d.id !== dieId) return d;
      const next = d.currentValue <= 1 ? d.faces : d.currentValue - 1;
      return { ...d, currentValue: next, animatedFace: next };
    });

    const evaluated = evaluateOutcome(updatedDice, modifier, rules);
    set({
      dice: updatedDice,
      lastRollResult: {
        total: evaluated.total,
        diceTotal: evaluated.diceTotal,
        modifier,
        formula: updatedDice.map((d) => `d${d.faces}`).join(' + ') + (modifier !== 0 ? ` + (${modifier})` : ''),
        outcomeTier: evaluated.outcomeTier,
        outcomeLabel: evaluated.outcomeLabel,
        breakdown: updatedDice.map((d) => `${d.currentValue}`).join(' + ') + (modifier !== 0 ? ` + ${modifier}` : ''),
      },
      undoStack: [newSnapshot, ...undoStack].slice(0, 5),
      redoStack: [],
    });
  },

  // Definir valor exato
  setDieValue: (dieId, val) => {
    const { dice, modifier, rules, undoStack } = get();
    const newSnapshot = takeSnapshot(dice, modifier);
    const updatedDice = dice.map((d) => {
      if (d.id !== dieId) return d;
      const clamped = Math.max(1, Math.min(d.faces, val));
      return { ...d, currentValue: clamped, animatedFace: clamped };
    });

    const evaluated = evaluateOutcome(updatedDice, modifier, rules);
    set({
      dice: updatedDice,
      lastRollResult: {
        total: evaluated.total,
        diceTotal: evaluated.diceTotal,
        modifier,
        formula: updatedDice.map((d) => `d${d.faces}`).join(' + ') + (modifier !== 0 ? ` + (${modifier})` : ''),
        outcomeTier: evaluated.outcomeTier,
        outcomeLabel: evaluated.outcomeLabel,
        breakdown: updatedDice.map((d) => `${d.currentValue}`).join(' + ') + (modifier !== 0 ? ` + ${modifier}` : ''),
      },
      undoStack: [newSnapshot, ...undoStack].slice(0, 5),
      redoStack: [],
    });
  },

  // ROLAGEM PRINCIPAL COM FÍSICA REALISTA, RICOHETE NOS CANTOS E GIRO COMPLETO
  rollDice: (senderName, senderRole) => {
    const { dice, modifier, rules, visibility, undoStack, history } = get();
    if (dice.length === 0 || get().isRolling) return;

    // Identificação precisa do usuário (Jogador real ou Mestre)
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

    // Guarda snapshot de undo (limite de 5)
    const newSnapshot = takeSnapshot(dice, modifier);
    const newUndo = [newSnapshot, ...undoStack].slice(0, 5);

    // Barulhão progressivo de dados rolando
    diceAudio.playRoll(dice.length);

    // Valores finais sorteados
    const finalValues = dice.map((d) => Math.floor(Math.random() * d.faces) + 1);

    // Inicialização da física individualizada para cada dado:
    // Velocidades aleatórias, giros de 360° a 1080° e tempos de parada escalonados
    const physics = dice.map((d, i) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 28 + Math.random() * 26; // 28..54 % por segundo
      const spinDirection = Math.random() > 0.5 ? 1 : -1;
      // Rotação completa vigorosa (720 a 1440 graus por segundo)
      const rotSpeed = spinDirection * (720 + Math.random() * 720);
      // Duração escalonada: cada dado para em momento diferente!
      const duration = 900 + i * 160 + Math.random() * 120; // 900ms a 1600ms

      return {
        id: d.id,
        x: d.x,
        y: d.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: d.rotation,
        rotSpeed,
        duration,
        settled: false,
        lastFaceSwap: 0,
        faceInterval: 35,
      };
    });

    set({
      isRolling: true,
      undoStack: newUndo,
      redoStack: [],
      dice: dice.map((d) => ({ ...d, isRolling: true })),
    });

    const startTime = performance.now();
    let lastFrameTime = startTime;

    const tick = (now: number) => {
      const dt = Math.min(45, now - lastFrameTime);
      lastFrameTime = now;
      const elapsed = now - startTime;

      let anyActive = false;

      const nextDice = get().dice.map((d, idx) => {
        const p = physics[idx];
        if (!p) return d;

        if (elapsed < p.duration) {
          anyActive = true;
          let nx = p.x + p.vx * (dt / 1000);
          let ny = p.y + p.vy * (dt / 1000);

          // Ricochete nos cantos e bordas da bandeja
          const minX = 14;
          const maxX = 86;
          const minY = 16;
          const maxY = 84;

          if (nx <= minX) {
            nx = minX;
            p.vx = -p.vx * 0.72;
            diceAudio.playBounce();
          } else if (nx >= maxX) {
            nx = maxX;
            p.vx = -p.vx * 0.72;
            diceAudio.playBounce();
          }

          if (ny <= minY) {
            ny = minY;
            p.vy = -p.vy * 0.72;
            diceAudio.playBounce();
          } else if (ny >= maxY) {
            ny = maxY;
            p.vy = -p.vy * 0.72;
            diceAudio.playBounce();
          }

          // Atrito e desaceleração gradual no feltro
          p.vx *= 0.982;
          p.vy *= 0.982;
          p.rotSpeed *= 0.980;

          // Rotação completa
          p.rotation += p.rotSpeed * (dt / 1000);
          p.x = nx;
          p.y = ny;

          // Troca de faces desacelerando progressivamente
          let newFace = d.animatedFace;
          const progress = elapsed / p.duration;
          p.faceInterval = 35 + Math.pow(progress, 2) * 140; // 35ms -> 175ms

          if (now - p.lastFaceSwap > p.faceInterval) {
            newFace = Math.floor(Math.random() * d.faces) + 1;
            p.lastFaceSwap = now;
          }

          return {
            ...d,
            x: Math.round(nx * 10) / 10,
            y: Math.round(ny * 10) / 10,
            rotation: Math.round(p.rotation * 10) / 10,
            animatedFace: newFace,
            isRolling: true,
          };
        } else {
          // Dado assentado no resultado final
          return {
            ...d,
            x: Math.round(p.x * 10) / 10,
            y: Math.round(p.y * 10) / 10,
            rotation: 0, // Fica perfeitamente retinho após rolar
            currentValue: finalValues[idx],
            animatedFace: finalValues[idx],
            isRolling: false,
          };
        }
      });

      set({ dice: nextDice });

      if (anyActive) {
        requestAnimationFrame(tick);
      } else {
        // TODOS OS DADOS ASSENTARAM
        const settledDice = get().dice.map((d, idx) => ({
          ...d,
          currentValue: finalValues[idx],
          animatedFace: finalValues[idx],
          rotation: 0, // Alinhado reto e nítido
          isRolling: false,
        }));

        const evaluated = evaluateOutcome(settledDice, modifier, rules);

        if (evaluated.outcomeTier === 'crit') {
          diceAudio.playCrit();
        } else if (evaluated.outcomeTier === 'fumble') {
          diceAudio.playFumble();
        }

        const breakdown =
          settledDice.map((d) => `${d.currentValue}`).join(' + ') +
          (modifier !== 0 ? ` + ${modifier}` : '');
        const formula =
          settledDice.map((d) => `d${d.faces}`).join(' + ') +
          (modifier !== 0 ? ` + (${modifier})` : '');

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
          activeNotification: newEntry,
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
