// Controlador do botão "Rolar Dados" com hover / segurar.
// - Hover: dados são "pegos" (sobem levemente) e balançam bem pouco
// - Segurar: balanço cresce gradualmente e o botão vai do claro ao vermelho escuro
// - Soltar: devolve a intensidade (0..1) para a rolagem (puramente estético)
// Tudo roda num único rAF escrevendo transforms direto no DOM (zero re-render).

import { useDiceTrayStore } from '@/store/useDiceTrayStore';
import { diceDOMRegistry, writeDiePose, setDieAnimating, REST_POSE } from './diceDOMRegistry';
import { diceAudio } from './diceAudio';

type Mode = 'idle' | 'hover' | 'hold';

const HOLD_MAX_MS = 1800; // tempo para atingir a intensidade máxima
const HOVER_AMP = 0.12;
const COLOR_FROM = [167, 139, 250]; // #a78bfa (claro)
const COLOR_TO = [127, 29, 29]; //     #7f1d1d (vermelho escuro)

let mode: Mode = 'idle';
let amp = 0; // amplitude suavizada atual (0..1)
let holdStart = 0;
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
  button.style.transform = `scale(${1 - progress * 0.04})`;
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
  amp += (target - amp) * Math.min(1, dtMs * 0.012);

  if (mode === 'hold') {
    paintButton(progress);
    diceAudio.setHoldIntensity(progress);
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
    const w = 0.012 + amp * 0.03; // frequência cresce com a intensidade
    writeDiePose(refs, {
      dx: Math.sin(t * w * 1.3 + ph * 1.7) * amp * 5,
      dy: Math.cos(t * w * 1.1 + ph) * amp * 4,
      rot: d.rotation + Math.sin(t * w + ph) * amp * 22,
      tiltX: Math.sin(t * w * 0.9 + ph * 2.1) * amp * 18,
      tiltY: Math.cos(t * w * 1.2 + ph * 0.6) * amp * 18,
      lift: pick * 4 + amp * 10,
      stretch: 0,
      angle: 0,
      scale: 1,
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
    // A rolagem assume a pose a partir daqui (sem "voltar" ao repouso antes)
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

