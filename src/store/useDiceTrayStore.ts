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
  sideFaces: number[];
  isRolling: boolean;
  color: string;
  x: number; // Porcentagem 0..100 na bandeja
  y: number; // Porcentagem 0..100 na bandeja
  rotation: number;
  rotX?: number; // Pitch em graus (-35° a 35°)
  rotY?: number; // Yaw em graus (-35° a 35°)
  lift?: number; // Altura Z simulada (0 a 30px)
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
  ruleMode: 'sum',
};

// Gera números para as facetas visíveis adjacentes de cada tipo de dado
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
  for (let i = 0; i < count; i++) {
    if (faces === 100) {
      let step = Math.floor(Math.random() * 10) * 10;
      if (step === centerVal) step = (step + 10) % 100;
      res.push(step);
    } else {
      let r = Math.floor(Math.random() * faces) + 1;
      if (r === centerVal) r = (r % faces) + 1;
      res.push(r);
    }
  }
  return res;
}

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

    const initialVal = Math.floor(Math.random() * faces) + 1;
    const newDie: TrayDie = {
      id: generateId(),
      faces,
      currentValue: initialVal,
      animatedFace: initialVal,
      sideFaces: generateSideFaces(faces, initialVal),
      isRolling: false,
      color: color || DIE_COLORS[faces] || '#8257e5',
      x: pos.x,
      y: pos.y,
      rotation: 0,
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
    const { dice, modifier, undoStack } = get();
    const newSnapshot = takeSnapshot(dice, modifier);
    set({
      dice: dice.filter((d) => d.id !== dieId),
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
    const { dice, modifier, rules, undoStack } = get();
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
      return {
        ...d,
        currentValue: next,
        animatedFace: next,
        sideFaces: generateSideFaces(d.faces, next),
      };
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
      return {
        ...d,
        currentValue: clamped,
        animatedFace: clamped,
        sideFaces: generateSideFaces(d.faces, clamped),
      };
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

  // ROLAGEM PRINCIPAL COM FÍSICA 3D, COLISÕES MÚTUAS, QUICARES VIGOROSOS E TROCA DE FACES
  rollDice: (senderName, senderRole) => {
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

    diceAudio.playRoll(dice.length);

    const finalValues = dice.map((d) => Math.floor(Math.random() * d.faces) + 1);

    // Inicialização da física vigorosa (alta velocidade, rotações 3D e salto de impacto)
    const physics = dice.map((d, i) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 65; // 90..155 %/s
      const spinDirection = Math.random() > 0.5 ? 1 : -1;
      const rotSpeed = spinDirection * (850 + Math.random() * 850);
      const duration = 1250 + i * 180 + Math.random() * 160;

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
        lift: 20 + Math.random() * 8, // Salto 3D inicial
        duration,
        settled: false,
        lastFaceSwap: 0,
        faceInterval: 28,
        sideFaces: [...d.sideFaces],
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
      const dt = Math.min(40, now - lastFrameTime);
      lastFrameTime = now;
      const elapsed = now - startTime;

      let anyActive = false;

      // 1. Atualização de movimento e colisões com bordas da bandeja
      for (let idx = 0; idx < physics.length; idx++) {
        const p = physics[idx];
        if (elapsed >= p.duration) {
          p.settled = true;
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

        if (nx <= minX) {
          nx = minX;
          bounceForce = Math.abs(p.vx);
          p.vx = -p.vx * (0.86 + Math.random() * 0.06);
          p.vy += (Math.random() - 0.5) * 35;
          p.rotSpeed = -p.rotSpeed * 0.75 + (Math.random() - 0.5) * 500;
          p.lift = Math.min(26, p.lift + 12);
          bounced = true;
        } else if (nx >= maxX) {
          nx = maxX;
          bounceForce = Math.abs(p.vx);
          p.vx = -p.vx * (0.86 + Math.random() * 0.06);
          p.vy += (Math.random() - 0.5) * 35;
          p.rotSpeed = -p.rotSpeed * 0.75 + (Math.random() - 0.5) * 500;
          p.lift = Math.min(26, p.lift + 12);
          bounced = true;
        }

        if (ny <= minY) {
          ny = minY;
          bounceForce = Math.max(bounceForce, Math.abs(p.vy));
          p.vy = -p.vy * (0.86 + Math.random() * 0.06);
          p.vx += (Math.random() - 0.5) * 35;
          p.rotSpeed = -p.rotSpeed * 0.75 + (Math.random() - 0.5) * 500;
          p.lift = Math.min(26, p.lift + 12);
          bounced = true;
        } else if (ny >= maxY) {
          ny = maxY;
          bounceForce = Math.max(bounceForce, Math.abs(p.vy));
          p.vy = -p.vy * (0.86 + Math.random() * 0.06);
          p.vx += (Math.random() - 0.5) * 35;
          p.rotSpeed = -p.rotSpeed * 0.75 + (Math.random() - 0.5) * 500;
          p.lift = Math.min(26, p.lift + 12);
          bounced = true;
        }

        if (bounced) {
          diceAudio.playBounce(bounceForce / 60);
        }

        p.x = nx;
        p.y = ny;

        // Atrito e desaceleração progressiva
        p.vx *= 0.988;
        p.vy *= 0.988;
        p.rotSpeed *= 0.985;
        p.rotation += p.rotSpeed * (dt / 1000);

        // Amortecimento do salto 3D (lift)
        p.lift = Math.max(0, p.lift * 0.94);

        // Ângulos 3D de pitch e yaw baseados no movimento
        const currentSpeed = Math.hypot(p.vx, p.vy);
        const pitchSpeedFactor = Math.min(32, currentSpeed * 0.32);
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
              p1.vx -= impulse * nx * 0.9;
              p1.vy -= impulse * ny * 0.9;
              p2.vx += impulse * nx * 0.9;
              p2.vy += impulse * ny * 0.9;

              p1.lift = Math.min(24, p1.lift + 8);
              p2.lift = Math.min(24, p2.lift + 8);

              diceAudio.playDieCollision();
            }
          }
        }
      }

      // 3. Atualização das faces trocando a cada momento
      const nextDice = get().dice.map((d, idx) => {
        const p = physics[idx];
        if (!p) return d;

        if (!p.settled && elapsed < p.duration) {
          const progress = elapsed / p.duration;
          p.faceInterval = 28 + Math.pow(progress, 2.5) * 190;

          let newFace = d.animatedFace;
          let newSideFaces = p.sideFaces;

          if (now - p.lastFaceSwap > p.faceInterval) {
            newFace = Math.floor(Math.random() * d.faces) + 1;
            newSideFaces = generateSideFaces(d.faces, newFace);
            p.sideFaces = newSideFaces;
            p.lastFaceSwap = now;
          }

          return {
            ...d,
            x: Math.round(p.x * 10) / 10,
            y: Math.round(p.y * 10) / 10,
            rotation: Math.round(p.rotation * 10) / 10,
            rotX: Math.round(p.rotX * 10) / 10,
            rotY: Math.round(p.rotY * 10) / 10,
            lift: Math.round(p.lift * 10) / 10,
            animatedFace: newFace,
            sideFaces: newSideFaces,
            isRolling: true,
          };
        } else {
          return {
            ...d,
            x: Math.round(p.x * 10) / 10,
            y: Math.round(p.y * 10) / 10,
            rotation: 0,
            rotX: 0,
            rotY: 0,
            lift: 0,
            currentValue: finalValues[idx],
            animatedFace: finalValues[idx],
            sideFaces: generateSideFaces(d.faces, finalValues[idx]),
            isRolling: false,
          };
        }
      });

      set({ dice: nextDice });

      if (anyActive) {
        requestAnimationFrame(tick);
      } else {
        const settledDice = get().dice.map((d, idx) => ({
          ...d,
          currentValue: finalValues[idx],
          animatedFace: finalValues[idx],
          sideFaces: generateSideFaces(d.faces, finalValues[idx]),
          rotation: 0,
          rotX: 0,
          rotY: 0,
          lift: 0,
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
