// Registro Imperativo de Nós DOM dos Dados da Bandeja
// Permite que o loop de física rAF atualize GPU transforms e valores diretamente
// com ZERO re-renderizações React durante a rolagem (60..144 FPS estável)

export interface DieDOMRefs {
  cardEl: HTMLDivElement | null;
  innerEl: HTMLDivElement | null;
  shadowContactEl: HTMLDivElement | null;
  shadowCastEl: HTMLDivElement | null;
  mainNumEl: SVGTextElement | null;
  mainNumShadowEl: SVGTextElement | null;
  sideNumEls: (SVGTextElement | null)[];
}

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
  clear() {
    registry.clear();
  },
};
