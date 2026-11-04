// Motor de Som de Dados via Web Audio API
// - Eventos configuráveis em diceSoundConfig.ts (arquivos próprios do usuário)
// - Fallback procedural (sintetizado) para todo evento sem arquivo definido
// - 100% offline, buffers decodificados uma única vez e reaproveitados

import { DICE_SOUNDS, type DiceSoundEvent } from './diceSoundConfig';

interface PlayOpts {
  volume?: number; // multiplicador 0..2
  rate?: number; // playbackRate
}

class DiceAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private isMuted = false;
  private buffers = new Map<string, AudioBuffer>();
  private loading = new Set<string>();
  private lastPlay = new Map<DiceSoundEvent, number>();

  // Loop do "segurar para rolar"
  private holdSource: AudioBufferSourceNode | null = null;
  private holdGain: GainNode | null = null;
  private holdTimer: number | null = null;
  private holdIntensity = 0;

  private initCtx(): boolean {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
      this.preloadAll();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return true;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) this.stopHold();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // ---------------------------------------------------------------------------
  // Carregamento de arquivos configurados
  // ---------------------------------------------------------------------------
  private sourcesOf(event: DiceSoundEvent): string[] {
    let src = DICE_SOUNDS[event].src;
    if (!src && event === 'release') src = DICE_SOUNDS.place.src;
    if (!src) return [];
    return Array.isArray(src) ? src : [src];
  }

  private preloadAll() {
    (Object.keys(DICE_SOUNDS) as DiceSoundEvent[]).forEach((ev) =>
      this.sourcesOf(ev).forEach((url) => this.load(url)),
    );
  }

  private load(url: string) {
    if (!this.ctx || this.buffers.has(url) || this.loading.has(url)) return;
    this.loading.add(url);
    fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((data) => this.ctx!.decodeAudioData(data))
      .then((buf) => this.buffers.set(url, buf))
      .catch(() => console.warn(`[diceAudio] Falha ao carregar som: ${url}`))
      .finally(() => this.loading.delete(url));
  }

  private bufferFor(event: DiceSoundEvent): AudioBuffer | null {
    const list = this.sourcesOf(event).filter((u) => this.buffers.has(u));
    if (list.length === 0) return null;
    return this.buffers.get(list[Math.floor(Math.random() * list.length)]) || null;
  }

  // Toca o arquivo configurado; retorna false se não houver (=> usar procedural)
  private playSample(event: DiceSoundEvent, opts: PlayOpts = {}): boolean {
    if (!this.ctx || !this.master) return false;
    const buf = this.bufferFor(event);
    if (!buf) return false;
    const entry = DICE_SOUNDS[event].src ? DICE_SOUNDS[event] : DICE_SOUNDS.place;
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    src.playbackRate.value = opts.rate ?? 0.94 + Math.random() * 0.12;
    gain.gain.value = entry.volume * (opts.volume ?? 1);
    src.connect(gain);
    gain.connect(this.master);
    src.start();
    return true;
  }

  private throttled(event: DiceSoundEvent, ms: number): boolean {
    const now = performance.now();
    if (now - (this.lastPlay.get(event) || 0) < ms) return true;
    this.lastPlay.set(event, now);
    return false;
  }

  // ---------------------------------------------------------------------------
  // API pública por evento
  // ---------------------------------------------------------------------------

  /** Dado colocado na bandeja */
  public playDieDrop() {
    if (this.isMuted || !this.initCtx()) return;
    if (this.playSample('place')) return;
    this.synthDrop(1);
  }

  /** Dado selecionado / pego com o mouse */
  public playSelect() {
    if (this.isMuted || !this.initCtx() || this.throttled('select', 60)) return;
    if (this.playSample('select')) return;
    const t = this.ctx!.currentTime;
    this.synthClack(t, 1.5, 0.07);
  }

  /** Dado solto após arrastar (mesmo som do 'place' por padrão) */
  public playRelease() {
    if (this.isMuted || !this.initCtx() || this.throttled('release', 60)) return;
    if (this.playSample('release')) return;
    this.synthDrop(0.75);
  }

  /** Rolagem: escolhe o evento conforme a quantidade de dados */
  public playRoll(diceCount = 1, intensity = 0) {
    if (this.isMuted || !this.initCtx()) return;
    const event: DiceSoundEvent =
      diceCount <= 1 ? 'rollSingle' : diceCount <= 4 ? 'rollFew' : 'rollMany';
    if (this.playSample(event, { volume: 1 + intensity * 0.3 })) return;
    this.synthRoll(diceCount, intensity);
  }

  /** Dado batendo na borda/canto da bandeja */
  public playBounce(force = 1) {
    if (this.isMuted || !this.initCtx() || this.throttled('wallHit', 50)) return;
    const vol = Math.min(1.4, Math.max(0.35, force));
    if (this.playSample('wallHit', { volume: vol })) return;
    const t = this.ctx!.currentTime;
    this.synthClack(t, 0.6 + Math.random() * 0.35, 0.13 * vol);
  }

  /** Dado batendo em outro dado */
  public playDieCollision() {
    if (this.isMuted || !this.initCtx() || this.throttled('dieHit', 55)) return;
    if (this.playSample('dieHit')) return;
    this.synthClack(this.ctx!.currentTime, 0.95 + Math.random() * 0.5, 0.14);
  }

  /** Início do "segurar para rolar" (loop que intensifica) */
  public startHold() {
    if (this.isMuted || !this.initCtx()) return;
    this.stopHold();
    this.holdIntensity = 0;
    const buf = this.bufferFor('holdLoop');
    if (buf && this.ctx && this.master) {
      this.holdSource = this.ctx.createBufferSource();
      this.holdGain = this.ctx.createGain();
      this.holdSource.buffer = buf;
      this.holdSource.loop = true;
      this.holdGain.gain.value = DICE_SOUNDS.holdLoop.volume * 0.4;
      this.holdSource.connect(this.holdGain);
      this.holdGain.connect(this.master);
      this.holdSource.start();
      return;
    }
    // Fallback procedural: chocalhar que acelera com a intensidade
    const rattle = () => {
      if (!this.ctx || this.isMuted) return;
      const i = this.holdIntensity;
      this.synthClack(this.ctx.currentTime, 0.8 + Math.random() * 0.6, 0.025 + i * 0.07);
      this.holdTimer = window.setTimeout(rattle, 150 - i * 105 + Math.random() * 40);
    };
    rattle();
  }

  /** Atualiza a intensidade do loop de segurar (0..1) */
  public setHoldIntensity(i: number) {
    this.holdIntensity = Math.max(0, Math.min(1, i));
    if (this.holdSource && this.holdGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.holdGain.gain.setTargetAtTime(
        DICE_SOUNDS.holdLoop.volume * (0.4 + this.holdIntensity * 0.6),
        t,
        0.05,
      );
      this.holdSource.playbackRate.setTargetAtTime(1 + this.holdIntensity * 0.35, t, 0.05);
    }
  }

  public stopHold() {
    if (this.holdTimer !== null) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
    if (this.holdSource) {
      try {
        this.holdSource.stop();
      } catch {}
      this.holdSource.disconnect();
      this.holdSource = null;
    }
    if (this.holdGain) {
      this.holdGain.disconnect();
      this.holdGain = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Síntese procedural (fallback)
  // ---------------------------------------------------------------------------
  private synthDrop(vol: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.synthClack(t, 1.4, 0.16 * vol);
    this.synthClack(t + 0.045, 1.0, 0.08 * vol);
    this.synthThud(t + 0.07, 0.18 * vol);
  }

  private synthRoll(diceCount: number, intensity: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const count = Math.min(10, Math.max(1, diceCount));
    const boost = 1 + intensity * 0.5;

    const initialClicks = 4 + count * 2;
    for (let i = 0; i < initialClicks; i++) {
      const off = (i / initialClicks) * 0.25 + Math.random() * 0.03;
      this.synthClack(now + off, 0.7 + Math.random() * 0.6, 0.12 * boost);
    }
    const rollClicks = 8 + count * 3;
    for (let i = 0; i < rollClicks; i++) {
      const p = i / rollClicks;
      const off = 0.25 + Math.pow(p, 1.4) * (0.75 + intensity * 0.4) + Math.random() * 0.04;
      this.synthClack(now + off, 0.6 + Math.random() * 0.7, Math.max(0.035, 0.14 * (1 - p * 0.65)) * boost);
    }
    const settle = Math.min(5, count);
    for (let s = 0; s < settle; s++) {
      this.synthThud(now + 0.8 + intensity * 0.4 + s * 0.09 + Math.random() * 0.06, 0.2 - s * 0.02);
    }
  }

  private synthClack(time: number, pitch = 1, volume = 0.15) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const f = (700 + Math.random() * 500) * pitch;
    osc.frequency.setValueAtTime(f, time);
    osc.frequency.exponentialRampToValueAtTime(f * 0.35, time + 0.04);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(time);
    osc.stop(time + 0.055);
  }

  private synthThud(time: number, volume = 0.25) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.11);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(time);
    osc.stop(time + 0.14);
  }

  /** Crítico positivo (fanfarra curta) */
  public playCrit() {
    if (this.isMuted || !this.initCtx() || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const t = now + idx * 0.07;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  /** Desastre crítico (grave sombrio) */
  public playFumble() {
    if (this.isMuted || !this.initCtx() || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.35);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.4);
  }
}

export const diceAudio = new DiceAudioEngine();
