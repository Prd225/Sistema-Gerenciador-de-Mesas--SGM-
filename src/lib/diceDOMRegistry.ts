// Registro imperativo dos nós DOM de cada dado da bandeja.
// Os loops de animação (rolagem e "segurar para rolar") escrevem transforms
// diretamente na GPU, sem passar pelo React. O React só renderiza estados de
// repouso. Toda escrita de pose passa por `writeDiePose`, então o estado do DOM
// nunca diverge entre React e animação.

import type { RefObject, MutableRefObject } from 'react';

export const DIE_SIZE = 84; // px

export interface DieDOMRefs {
  card: RefObject<HTMLDivElement | null>; //   posição (translate) — não rotaciona
  body: RefObject<HTMLDivElement | null>; //   rotação, inclinação 3D, altura
  shadow: RefObject<HTMLDivElement | null>; // sombra esfumaçada — não rotaciona
  mainNum: RefObject<SVGTextElement | null>;
  sideNums: MutableRefObject<(SVGTextElement | null)[]>;
}

export interface DiePose {
  dx: number; //       deslocamento em px a partir de left/top do React
  dy: number;
  rot: number; //      rotação no plano (graus)
  tiltX: number; //    inclinação 3D (graus)
  tiltY: number;
  lift: number; //     altura simulada (px)
  stretch: number; //  0..0.2 esticada na direção do movimento (opcional)
  angle: number; //    direção do movimento (graus)
  scale: number;
}

export const REST_POSE: DiePose = {
  dx: 0,
  dy: 0,
  rot: 0,
  tiltX: 0,
  tiltY: 0,
  lift: 0,
  stretch: 0,
  angle: 0,
  scale: 1,
};

const registry = new Map<string, DieDOMRefs>();

export const diceDOMRegistry = {
  register(id: string, refs: DieDOMRefs) {
    registry.set(id, refs);
  },
  unregister(id: string) {
    registry.delete(id);
  },
  get(id: string): DieDOMRefs | undefined {
    return registry.get(id);
  },
};

const r1 = (n: number) => Math.round(n * 10) / 10;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** Escreve a pose completa de um dado (card + corpo + sombra). */
export function writeDiePose(refs: DieDOMRefs, p: DiePose) {
  const card = refs.card.current;
  const body = refs.body.current;
  const shadow = refs.shadow.current;

  if (card) {
    card.style.transform = `translate3d(calc(-50% + ${r1(p.dx)}px), calc(-50% + ${r1(p.dy)}px), 0)`;
  }

  if (body) {
    const lift = p.lift;
    const grow = p.scale * (1 + lift * 0.006);
    let t = `translate3d(0, ${r1(-lift * 0.55)}px, 0) scale(${r3(grow)}) rotate(${r1(p.rot)}deg)`;
    if (p.tiltX !== 0 || p.tiltY !== 0) {
      t += ` perspective(550px) rotateX(${r1(p.tiltX)}deg) rotateY(${r1(p.tiltY)}deg)`;
    }
    body.style.transform = t;
  }

  if (shadow) {
    // Sombra esfumaçada suave: afasta levemente para baixo/direita, expande e atenua suavemente
    const lift = p.lift;
    shadow.style.transform = `translate3d(${r1(lift * 0.45)}px, ${r1(lift * 0.55)}px, 0) scale(${r3(1 + lift * 0.02)})`;
    shadow.style.opacity = `${r3(Math.max(0.18, 0.65 - lift * 0.02))}`;
  }
}

/** Liga/desliga a transição CSS do corpo (desligada durante loops de animação). */
export function setDieAnimating(refs: DieDOMRefs, animating: boolean) {
  const body = refs.body.current;
  const card = refs.card.current;
  const shadow = refs.shadow.current;
  const tr = animating ? 'none' : '';
  if (body) body.style.transition = tr;
  if (card) card.style.transition = tr;
  if (shadow) shadow.style.transition = tr;
}
