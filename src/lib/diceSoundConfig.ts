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
  | 'place' //      Dado colocado na bandeja
  | 'rollSingle' // Apenas 1 dado rolado
  | 'rollFew' //    2 a 4 dados rolados
  | 'rollMany' //   5 ou mais dados rolados
  | 'wallHit' //    Dado batendo na borda/canto da bandeja
  | 'dieHit' //     Dado batendo em outro dado
  | 'holdLoop' //   Botão "Rolar" sendo segurado (toca em loop, intensifica com o tempo)
  | 'select' //     Dado selecionado (clicado / pego)
  | 'release'; //   Dado solto (se null, reutiliza o som de 'place')

export interface DiceSoundEntry {
  src: string | string[] | null;
  volume: number; // 0..1
}

export const DICE_SOUNDS: Record<DiceSoundEvent, DiceSoundEntry> = {
  place: { src: null, volume: 0.8 },
  rollSingle: { src: null, volume: 0.9 },
  rollFew: { src: null, volume: 0.9 },
  rollMany: { src: null, volume: 0.9 },
  wallHit: { src: null, volume: 0.6 },
  dieHit: { src: null, volume: 0.5 },
  holdLoop: { src: null, volume: 0.5 },
  select: { src: null, volume: 0.6 },
  release: { src: null, volume: 0.8 }, // null => usa 'place'
};

