// Sistema de Vibração Dinâmica e Tátil para Dispositivos Móveis
// Integração segura com a Web Vibration API (navigator.vibrate)

class DiceHaptics {
  private lastBounceTime = 0;
  private lastCollisionTime = 0;
  private lastChargePulse = 0;

  private isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator &&
      typeof navigator.vibrate === 'function'
    );
  }

  // Micro-vibração progressiva enquanto o botão "Rolar Dados" é segurado
  chargePulse(progress: number) {
    if (!this.isSupported()) return;
    const now = performance.now();
    // Quanto maior o progresso (0..1), mais frequentes e nítidos os pulsos táteis
    // 0 -> a cada 170ms pulso de 8ms
    // 1 -> a cada 55ms pulso de 14ms
    const interval = Math.max(55, 170 - progress * 115);
    if (now - this.lastChargePulse >= interval) {
      this.lastChargePulse = now;
      try {
        const ms = Math.round(8 + progress * 6);
        navigator.vibrate(ms);
      } catch {}
    }
  }

  // Vibração enérgica no instante do lançamento dos dados
  launch(intensity = 0) {
    if (!this.isSupported()) return;
    try {
      if (intensity > 0.6) {
        // Lançamento forte / carga máxima: rajada intensa de 3 pulsos táteis
        navigator.vibrate([35, 25, 45, 20, 25]);
      } else if (intensity > 0.25) {
        // Lançamento médio
        navigator.vibrate([28, 20, 32]);
      } else {
        // Clique rápido / arremesso leve padrão
        navigator.vibrate(25);
      }
    } catch {}
  }

  // Vibração dinâmica quando os dados batem nas paredes/beiradas da tela
  bounce(bounceForce: number) {
    if (!this.isSupported()) return;
    const now = performance.now();
    // Limita taxa de vibrações de rebote para não saturar o motor tátil (mínimo 45ms)
    if (now - this.lastBounceTime < 45) return;
    this.lastBounceTime = now;

    try {
      // Força de impacto proporcional ao rebote físico
      const duration = Math.min(24, Math.max(7, Math.round(bounceForce * 0.35)));
      navigator.vibrate(duration);
    } catch {}
  }

  // Vibração curta e nítida quando dois dados colidem entre si
  collision() {
    if (!this.isSupported()) return;
    const now = performance.now();
    if (now - this.lastCollisionTime < 75) return;
    this.lastCollisionTime = now;

    try {
      navigator.vibrate(6); // Click tátil
    } catch {}
  }

  // Vibração ao soltar ou adicionar um dado na bandeja
  drop() {
    if (!this.isSupported()) return;
    try {
      navigator.vibrate(12);
    } catch {}
  }

  // Vibração ao selecionar ou pegar um dado
  pickup() {
    if (!this.isSupported()) return;
    try {
      navigator.vibrate(8);
    } catch {}
  }

  // Vibração de finalização quando todos os dados assentam na mesa
  settle() {
    if (!this.isSupported()) return;
    try {
      navigator.vibrate([10, 25, 12]);
    } catch {}
  }

  // Cancela qualquer vibração em andamento
  stop() {
    if (!this.isSupported()) return;
    try {
      navigator.vibrate(0);
    } catch {}
  }
}

export const diceHaptics = new DiceHaptics();
