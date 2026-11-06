// ============================================================================
// CONFIGURAÇÃO DE SONS DA BANDEJA DE DADOS
// ============================================================================
// Para usar um som próprio:
//   1. Coloque o arquivo em  public/sounds/dice/  (mp3, ogg ou wav)
//   2. Troque o `null` do evento pelo caminho, ex: '/sounds/dice/place.mp3'
//   3. Pode passar uma LISTA de arquivos: cada execução sorteia uma variação
//      ex: ['/sounds/dice/hit-1.mp3', '/sounds/dice/hit-2.mp3']
//
// Enquanto estiver `null`, o evento usa o som sintetizado (procedural) atual.
// ============================================================================

export type DiceSoundEvent =
  | 'place' //         Dado colocado na bandeja
  | 'rollSingle' //    Apenas 1 dado rolado (clique rápido: giro + parada)
  | 'rollFew' //       2 a 4 dados rolados (clique rápido: giro + parada)
  | 'rollMany' //      5 ou mais dados rolados (clique rápido: giro + parada)
  | 'releaseSingle' // Soltar 1 dado na mesa após segurar/agitar
  | 'releaseFew' //    Soltar 2 a 4 dados na mesa após segurar/agitar
  | 'releaseMany' //   Soltar 5+ dados na mesa após segurar/agitar
  | 'wallHit' //       Dado batendo na borda/canto da bandeja
  | 'dieHit' //        Dado batendo em outro dado
  | 'holdLoop' //      Agitação padrão ao segurar o botão "Rolar"
  | 'holdSingle' //    Agitação progressiva de 1 dado ao segurar "Rolar"
  | 'holdFew' //       Agitação progressiva de 2 a 4 dados ao segurar "Rolar"
  | 'holdMany' //      Agitação progressiva de 5+ dados ao segurar "Rolar"
  | 'select' //        Dado selecionado (clicado / pego)
  | 'release'; //      Dado solto após arrastar (se null, reutiliza 'place')

export interface DiceSoundEntry {
  src: string | string[] | null;
  volume: number; // 0..1
}

export const DICE_SOUNDS: Record<DiceSoundEvent, DiceSoundEntry> = {
  // Pegar / selecionar dado (estalo curto e agudo de resina: 94ms–106ms)
  select: {
    src: [
      '/sounds/dice/pick-1.wav',
      '/sounds/dice/pick-2.wav',
      '/sounds/dice/pick-3.wav',
    ],
    volume: 0.7,
  },

  // Colocar dado na bandeja (impacto encorpado na superfície: 84ms–100ms)
  place: {
    src: [
      '/sounds/dice/place-1.wav',
      '/sounds/dice/place-2.wav',
      '/sounds/dice/place-3.wav',
    ],
    volume: 0.85,
  },

  // Soltar dado individual após arrastar na bandeja
  release: {
    src: [
      '/sounds/dice/release-single.wav',
      '/sounds/dice/place-2.wav',
      '/sounds/dice/place-3.wav',
    ],
    volume: 0.8,
  },

  // Quicar no canto / parede da bandeja (impactos mais secos e firmes de place_dice_4, 5 e 1)
  wallHit: {
    src: [
      '/sounds/dice/wall-hit-1.wav',
      '/sounds/dice/wall-hit-2.wav',
      '/sounds/dice/wall-hit-3.wav',
    ],
    volume: 0.65,
  },

  // Colisão dado contra dado (estalos mais brilhantes/agudos de pick_dice_4, 3 e 2)
  dieHit: {
    src: [
      '/sounds/dice/die-hit-1.wav',
      '/sounds/dice/die-hit-2.wav',
      '/sounds/dice/die-hit-3.wav',
    ],
    volume: 0.6,
  },

  // Rolagem direta (clique simples no botão Rolar: impacto e quiques imediatos na bandeja, sem som de chocalhar na mão)
  rollSingle: {
    src: [
      '/sounds/dice/roll-single-1.wav?v=4',
      '/sounds/dice/roll-single-2.wav?v=4',
      '/sounds/dice/roll-single-3.wav?v=4',
    ],
    volume: 0.9,
  },
  rollFew: {
    src: [
      '/sounds/dice/roll-few-1.wav?v=4',
      '/sounds/dice/roll-few-2.wav?v=4',
      '/sounds/dice/roll-few-3.wav?v=4',
    ],
    volume: 0.9,
  },
  rollMany: {
    src: [
      '/sounds/dice/roll-many-1.wav?v=4',
      '/sounds/dice/roll-many-2.wav?v=4',
      '/sounds/dice/roll-many-3.wav?v=4',
    ],
    volume: 0.9,
  },

  // Lançamento na mesa após segurar/agitar os dados no botão "Rolar"
  releaseSingle: {
    src: '/sounds/dice/release-single.wav?v=4',
    volume: 0.95,
  },
  releaseFew: {
    src: [
      '/sounds/dice/release-few-1.wav?v=4',
      '/sounds/dice/release-few-2.wav?v=4',
    ],
    volume: 0.95,
  },
  releaseMany: {
    src: [
      '/sounds/dice/release-many.wav?v=4',
      '/sounds/dice/release-few-2.wav?v=4',
    ],
    volume: 0.95,
  },

  // Segurar o botão "Rolar Dados" (gravações reais com aceleração progressiva)
  holdLoop: {
    src: '/sounds/dice/hold-loop.wav',
    volume: 0.75,
  },
  holdSingle: {
    src: '/sounds/dice/hold-single.wav',
    volume: 0.8,
  },
  holdFew: {
    src: '/sounds/dice/hold-few.wav',
    volume: 0.8,
  },
  holdMany: {
    src: '/sounds/dice/hold-many.wav',
    volume: 0.8,
  },
};

