// Motor de Som Procedural de Dados via Web Audio API
// Efeitos ultra-realistas de colisão, feltro, chacoalhar e impacto
// 100% offline, sem arquivos externos ou atrasos de rede

class DiceAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Som de dados chacoalhando e caindo no feltro
  public playRoll(diceCount: number = 1) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const count = Math.min(8, Math.max(1, diceCount));

      // Múltiplos estalidos simulando dados colidindo entre si
      for (let i = 0; i < count * 3; i++) {
        const timeOffset = Math.random() * 0.45;
        this.playClack(now + timeOffset, Math.random() * 0.5 + 0.5);
      }

      // Impacto final na madeira/feltro
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        this.playThud(this.ctx.currentTime);
      }, 350 + count * 40);
    } catch {
      // Ignora falhas de autoplay
    }
  }

  // Estalido agudo (colisão de resina/acrílico)
  private playClack(time: number, pitchMult: number = 1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = (650 + Math.random() * 450) * pitchMult;
    osc.frequency.setValueAtTime(baseFreq, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, time + 0.04);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.06);
  }

  // Impacto grave (feltro / bandeja de madeira)
  private playThud(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  // Som de Crítico Positivo (fanfarra / brilho)
  public playCrit() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const time = now + idx * 0.07;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(time);
        osc.stop(time + 0.28);
      });
    } catch {}
  }

  // Som de Desastre Crítico (grave sombrio)
  public playFumble() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.35);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {}
  }
}

export const diceAudio = new DiceAudioEngine();

