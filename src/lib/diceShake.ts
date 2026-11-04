// Controlador do botão "Rolar Dados" com hover / segurar.
// - Hover: dados são "pegos" (sobem levemente) e balançam bem pouco
// - Segurar: balanço cresce gradualmente, botão vai do lilás ao vermelho escuro,
//            e as faces dos dados vão se alternando rapidamente (sensação de aleatoriedade)
// - Soltar: devolve a intensidade (0..1) para arremesso com impulso proporcional
// Tudo roda num único rAF escrevendo transforms e valores direto no DOM (zero re-render).

import { useDiceTrayStore, rollDieFace, generateSideFaces } from '@/store/useDiceTrayStore';
import { diceDOMRegistry, writeDiePose, setDieAnimating, REST_POSE } from './diceDOMRegistry';
import { diceAudio } from './diceAudio';

type Mode = 'idle' | 'hover' | 'hold';

const HOLD_MAX_MS = 1400; // tempo para atingir a intensidade máxima (1.4s)
const HOVER_AMP = 0.12;
const COLOR_FROM = [167, 139, 250]; // #a78bfa (lilás claro)
const COLOR_TO = [127, 29, 29]; //     #7f1d1d (vermelho escuro)

let mode: Mode = 'idle';
let amp = 0; // amplitude suavizada atual (0..1)
let holdStart = 0;
let lastFaceScramble = 0;
let raf = 0;
let last = 0;
let button: HTMLElement | null = null;
const touched = new Set<string>();

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 159.15; // 0..2π aprox.
}

function holdProgress(now: number): number {
  if (mode !== 'hold') return 0;
  const t = Math.min(1, (now - holdStart) / HOLD_MAX_MS);
  return 1 - Math.pow(1 - t, 2); // ease-out
}

function paintButton(progress: number) {
  if (!button) return;
  const c = COLOR_FROM.map((from, i) => Math.round(from + (COLOR_TO[i] - from) * progress));
  button.style.backgroundColor = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  button.style.transform = `scale(${1 - progress * 0.05})`;
}

function resetButton() {
  if (!button) return;
  button.style.backgroundColor = '';
  button.style.transform = '';
}

function restoreDice() {
  const { dice } = useDiceTrayStore.getState();
  dice.forEach((d) => {
    if (!touched.has(d.id)) return;
    const refs = diceDOMRegistry.get(d.id);
    if (!refs) return;
    setDieAnimating(refs, false);
    writeDiePose(refs, { ...REST_POSE, rot: d.rotation });

    // Restaura face e facetas originais se o segurar for cancelado sem rolar
    if (refs.mainNum.current) {
      refs.mainNum.current.textContent = `${d.currentValue}`;
    }
    d.sideFaces.forEach((sf, sIdx) => {
      const sideEl = refs.sideNums.current[sIdx];
      if (sideEl) sideEl.textContent = `${sf}`;
    });
  });
  touched.clear();
}

function loop(now: number) {
  const dtMs = Math.min(33, now - last || 16);
  last = now;
  const state = useDiceTrayStore.getState();

  // Durante a rolagem a física assume o controle; só aguardamos
  if (state.isRolling) {
    touched.clear();
    if (mode === 'idle') {
      raf = 0;
      amp = 0;
      return;
    }
    raf = requestAnimationFrame(loop);
    return;
  }

  const progress = holdProgress(now);
  const target = mode === 'hold' ? HOVER_AMP + (1 - HOVER_AMP) * progress : mode === 'hover' ? HOVER_AMP : 0;
  amp += (target - amp) * Math.min(1, dtMs * 0.015);

  if (mode === 'hold') {
    paintButton(progress);
    diceAudio.setHoldIntensity(progress);

    // Alterna os valores dos dados enquanto segura (sensação dinâmica de aleatoriedade)
    // Conforme o botão é segurado, o sorteio acelera de 140ms para até 32ms
    const scrambleInterval = Math.max(32, 140 - progress * 105);
    if (now - lastFaceScramble > scrambleInterval) {
      lastFaceScramble = now;
      for (const d of state.dice) {
        const refs = diceDOMRegistry.get(d.id);
        if (!refs) continue;
        const face = rollDieFace(d.faces);
        if (refs.mainNum.current) {
          refs.mainNum.current.textContent = `${face}`;
        }
        const sides = generateSideFaces(d.faces, face);
        sides.forEach((sf, sIdx) => {
          const sideEl = refs.sideNums.current[sIdx];
          if (sideEl) sideEl.textContent = `${sf}`;
        });
      }
    }
  }

  if (mode === 'idle' && amp < 0.004) {
    amp = 0;
    restoreDice();
    raf = 0;
    return;
  }

  const t = now;
  const pick = Math.min(1, amp / HOVER_AMP); // "pegar" os dados
  for (const d of state.dice) {
    const refs = diceDOMRegistry.get(d.id);
    if (!refs) continue;
    if (!touched.has(d.id)) {
      setDieAnimating(refs, true);
      touched.add(d.id);
    }
    const ph = hash(d.id);
    const w = 0.014 + amp * 0.038; // frequência cresce com a intensidade
    writeDiePose(refs, {
      dx: Math.sin(t * w * 1.4 + ph * 1.7) * amp * 8,
      dy: Math.cos(t * w * 1.2 + ph) * amp * 7,
      rot: d.rotation + Math.sin(t * w + ph) * amp * 32,
      tiltX: Math.sin(t * w * 0.9 + ph * 2.1) * amp * 24,
      tiltY: Math.cos(t * w * 1.3 + ph * 0.6) * amp * 24,
      lift: pick * 4 + amp * 16,
      stretch: 0,
      angle: 0,
      scale: 1 + amp * 0.04,
    });
  }

  raf = requestAnimationFrame(loop);
}

function ensureLoop() {
  if (raf) return;
  last = performance.now();
  raf = requestAnimationFrame(loop);
}

export const diceShake = {
  hoverStart() {
    if (mode !== 'idle') return;
    if (useDiceTrayStore.getState().dice.length === 0) return;
    mode = 'hover';
    ensureLoop();
  },

  hoverEnd() {
    if (mode === 'hover') mode = 'idle';
  },

  holdStart(btn: HTMLElement | null) {
    if (useDiceTrayStore.getState().dice.length === 0) return;
    button = btn;
    mode = 'hold';
    holdStart = performance.now();
    lastFaceScramble = 0;
    diceAudio.startHold();
    ensureLoop();
  },

  isHolding() {
    return mode === 'hold';
  },

  /** Solta o botão: para o balanço e retorna a intensidade acumulada (0..1). */
  release(stillHovering: boolean): number {
    const intensity = holdProgress(performance.now());
    diceAudio.stopHold();
    resetButton();
    button = null;
    touched.clear();
    amp = 0;
    mode = stillHovering ? 'hover' : 'idle';
    return intensity;
  },

  /** Cancela o segurar sem rolar (ex: perdeu o ponteiro). */
  cancel() {
    diceAudio.stopHold();
    resetButton();
    button = null;
    mode = 'idle';
  },
};
