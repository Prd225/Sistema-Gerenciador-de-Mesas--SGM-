// Motor de Som Procedural de Dados via Web Audio API
// Efeitos ultra-realistas de colisão, feltro, chacoalhar e impacto
// 100% offline, sem arquivos externos ou atrasos de rede

class DiceAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastBounceTime: number = 0;
  private lastCollisionTime: number = 0;

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

  // Som de um dado caindo e assentando no feltro (usado ao adicionar dado na bandeja)
  public playDieDrop() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Estalido de contato inicial da resina
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.035);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);

      // 2. Micro repique secundário
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const t2 = this.ctx.currentTime;
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(750, t2);
        osc2.frequency.exponentialRampToValueAtTime(320, t2 + 0.03);
        gain2.gain.setValueAtTime(0.1, t2);
        gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.035);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(t2);
        osc2.stop(t2 + 0.04);
      }, 40);

      // 3. Batida suave e absorção no feltro
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        this.playThud(this.ctx.currentTime, 0.2);
      }, 70);
    } catch {}
  }

  // Som de colisão com a borda de couro/madeira da bandeja (com força/volume variável)
  public playBounce(volMultiplier: number = 1.0) {
    if (this.isMuted) return;
    const now = performance.now();
    // Limita frequência para não sobrecarregar em múltiplos quiques
    if (now - this.lastBounceTime < 35) return;
    this.lastBounceTime = now;

    try {
      this.initCtx();
      if (!this.ctx) return;
      const audioTime = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const freq = 420 + Math.random() * 320;
      osc.frequency.setValueAtTime(freq, audioTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.35, audioTime + 0.045);

      const targetVol = Math.min(0.25, 0.14 * Math.max(0.4, volMultiplier));
      gain.gain.setValueAtTime(targetVol, audioTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(audioTime);
      osc.stop(audioTime + 0.055);
    } catch {}
  }

  // Som de colisão entre dois dados (estalido seco de resina ao se chocarem)
  public playDieCollision() {
    if (this.isMuted) return;
    const now = performance.now();
    if (now - this.lastCollisionTime < 40) return;
    this.lastCollisionTime = now;

    try {
      this.initCtx();
      if (!this.ctx) return;
      this.playClack(this.ctx.currentTime, 0.95 + Math.random() * 0.5, 0.16);
    } catch {}
  }

  // Cascata progressiva de dados rolando, batendo entre si e assentando
  public playRoll(diceCount: number = 1) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const count = Math.min(10, Math.max(1, diceCount));

      // Fase 1: Chocalho inicial rápido (arremesso)
      const initialClicks = 4 + count * 2;
      for (let i = 0; i < initialClicks; i++) {
        const timeOffset = (i / initialClicks) * 0.25 + Math.random() * 0.03;
        this.playClack(now + timeOffset, 0.7 + Math.random() * 0.6, 0.14);
      }

      // Fase 2: Rolagem contínua progressiva no feltro (dados se chocando)
      const rollClicks = 8 + count * 4;
      for (let i = 0; i < rollClicks; i++) {
        const progress = i / rollClicks;
        // Intervalo vai se alargando suavemente (desaceleração)
        const timeOffset = 0.25 + Math.pow(progress, 1.4) * 0.75 + Math.random() * 0.04;
        const volume = Math.max(0.04, 0.16 * (1 - progress * 0.65));
        const pitch = 0.6 + Math.random() * 0.7;
        this.playClack(now + timeOffset, pitch, volume);
      }

      // Fase 3: Assentamento final escalonado dos dados (impactos no feltro)
      const settlingSteps = Math.min(5, count);
      for (let s = 0; s < settlingSteps; s++) {
        const thudOffset = 800 + s * 90 + Math.random() * 60;
        setTimeout(() => {
          if (!this.ctx || this.isMuted) return;
          this.playThud(this.ctx.currentTime, 0.22 - s * 0.02);
        }, thudOffset);
      }
    } catch {
      // Ignora falhas de autoplay
    }
  }

  // Estalido agudo (colisão de resina/acrílico)
  private playClack(time: number, pitchMult: number = 1, volume: number = 0.15) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = (700 + Math.random() * 500) * pitchMult;
    osc.frequency.setValueAtTime(baseFreq, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.35, time + 0.04);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.055);
  }

  // Impacto grave (feltro / bandeja de madeira)
  private playThud(time: number, volume: number = 0.25) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.11);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.14);
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
