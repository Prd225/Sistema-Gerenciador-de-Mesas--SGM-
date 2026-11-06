// Motor de Som de Dados via Web Audio API
// - Eventos configuráveis em diceSoundConfig.ts (arquivos próprios do usuário)
// - Fallback procedural (sintetizado) para todo evento sem arquivo definido
// - 100% offline, buffers decodificados uma única vez e reaproveitados

import { DICE_SOUNDS, type DiceSoundEvent } from './diceSoundConfig';

interface PlayOpts {
  volume?: number; // multiplicador 0..2
  rate?: number; // playbackRate
  trackAsRoll?: boolean; // rastreia source ativa da rolagem para fade-out sincronizado
}

class DiceAudioEngine {
  private ctx: AudioContext | null = null;
  private decodeCtx: OfflineAudioContext | null = null;
  private master: GainNode | null = null;
  private isMuted = false;
  private buffers = new Map<string, AudioBuffer>();
  private loadingPromises = new Map<string, Promise<AudioBuffer | null>>();
  private lastPlay = new Map<DiceSoundEvent, number>();

  // Loop do "segurar para rolar"
  private holdSource: AudioBufferSourceNode | null = null;
  private holdGain: GainNode | null = null;
  private holdTimer: number | null = null;
  private holdIntensity = 0;

  // Source principal da rolagem ativa (permite sincronizar término com a física)
  private rollSource: AudioBufferSourceNode | null = null;
  private rollGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Pré-carrega e pré-decodifica todos os arquivos .wav em background logo ao iniciar,
      // usando OfflineAudioContext (que não exige gesto do usuário), garantindo que o
      // primeiro som ao abrir a bandeja já use o áudio real e nunca o sintetizador placeholder.
      const startPreload = () => this.preloadAll();
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(startPreload, { timeout: 600 });
      } else {
        setTimeout(startPreload, 80);
      }

      // Aquece o AudioContext no primeiro gesto do usuário em qualquer lugar do app
      const unlock = () => {
        this.initCtx();
        window.removeEventListener('pointerdown', unlock, true);
        window.removeEventListener('keydown', unlock, true);
      };
      window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
      window.addEventListener('keydown', unlock, { capture: true, passive: true });
    }
  }

  private getDecoder(): BaseAudioContext | null {
    if (this.ctx) return this.ctx;
    if (!this.decodeCtx && typeof window !== 'undefined') {
      const OfflineCtx =
        window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
      if (OfflineCtx) {
        this.decodeCtx = new OfflineCtx(1, 1, 44100);
      }
    }
    return this.decodeCtx;
  }

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

  private load(url: string): Promise<AudioBuffer | null> {
    if (this.buffers.has(url)) {
      return Promise.resolve(this.buffers.get(url)!);
    }
    const existing = this.loadingPromises.get(url);
    if (existing) return existing;

    const decoder = this.getDecoder();
    if (!decoder) return Promise.resolve(null);

    const promise = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((data) => decoder.decodeAudioData(data))
      .then((buf) => {
        this.buffers.set(url, buf);
        return buf;
      })
      .catch(() => {
        console.warn(`[diceAudio] Falha ao carregar som: ${url}`);
        return null;
      })
      .finally(() => {
        this.loadingPromises.delete(url);
      });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  private bufferFor(event: DiceSoundEvent): AudioBuffer | null {
    const sources = this.sourcesOf(event);
    sources.forEach((u) => {
      if (!this.buffers.has(u) && !this.loadingPromises.has(u)) {
        this.load(u);
      }
    });
    const list = sources.filter((u) => this.buffers.has(u));
    if (list.length === 0) return null;
    return this.buffers.get(list[Math.floor(Math.random() * list.length)]) || null;
  }

  private playDecodedBuffer(buf: AudioBuffer, entryVolume: number, opts: PlayOpts = {}) {
    if (!this.ctx || !this.master || this.isMuted) return;
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    src.playbackRate.value = opts.rate ?? 0.94 + Math.random() * 0.12;
    gain.gain.value = entryVolume * (opts.volume ?? 1);
    src.connect(gain);
    gain.connect(this.master);
    if (opts.trackAsRoll) {
      this.stopRollFadeOut(40);
      this.rollSource = src;
      this.rollGain = gain;
      src.onended = () => {
        if (this.rollSource === src) {
          this.rollSource = null;
          this.rollGain = null;
        }
      };
    }
    src.start();
  }

  // Toca o arquivo configurado; se ainda estiver terminando de decodificar, aguarda a Promise
  // ao invés de cair no sintetizador placeholder!
  private playSample(event: DiceSoundEvent, opts: PlayOpts = {}): boolean {
    if (!this.ctx || !this.master) return false;
    const sources = this.sourcesOf(event);
    if (sources.length === 0) return false;

    const entry = DICE_SOUNDS[event].src ? DICE_SOUNDS[event] : DICE_SOUNDS.place;
    const buf = this.bufferFor(event);
    if (buf) {
      this.playDecodedBuffer(buf, entry.volume, opts);
      return true;
    }

    // Se há arquivos configurados mas ainda estão decodificando no primeiro instante,
    // aguarda a decodificação e toca imediatamente (nunca usa o som placeholder)
    const targetUrl = sources[Math.floor(Math.random() * sources.length)];
    this.load(targetUrl).then((loadedBuf) => {
      if (loadedBuf) {
        this.playDecodedBuffer(loadedBuf, entry.volume, opts);
      }
    });
    return true;
  }

  /** Faz fade-out suave do áudio de rolagem quando todos os dados assentam na mesa */
  public stopRollFadeOut(fadeMs = 110) {
    if (!this.ctx || !this.rollSource || !this.rollGain) return;
    const src = this.rollSource;
    const gain = this.rollGain;
    this.rollSource = null;
    this.rollGain = null;
    try {
      const now = this.ctx.currentTime;
      const dur = Math.max(0.02, fadeMs / 1000);
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.stop(now + dur + 0.01);
    } catch {}
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

  /** Rolagem: corta imediatamente qualquer som de "mexer dados" (hold) e toca apenas a queda/quique na bandeja */
  public playRoll(diceCount = 1, intensity = 0) {
    this.stopHold();
    if (this.isMuted || !this.initCtx()) return;
    if (intensity >= 0.18) {
      const releaseEvent: DiceSoundEvent =
        diceCount <= 1 ? 'releaseSingle' : diceCount <= 4 ? 'releaseFew' : 'releaseMany';
      if (
        this.playSample(releaseEvent, {
          volume: 1 + intensity * 0.25,
          rate: 0.98 + Math.random() * 0.04,
          trackAsRoll: true,
        })
      )
        return;
    }
    const event: DiceSoundEvent =
      diceCount <= 1 ? 'rollSingle' : diceCount <= 4 ? 'rollFew' : 'rollMany';
    // Em clique rápido (sem segurar), mantém playbackRate = 1.0 (±1%) para travar
    // o impacto de queda do áudio (~1180ms) exatamente com a frenagem visual na bandeja
    if (
      this.playSample(event, {
        volume: 1 + intensity * 0.25,
        rate: 0.99 + Math.random() * 0.02,
        trackAsRoll: true,
      })
    )
      return;
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

  /** Início do "segurar para rolar" (usa a gravação progressiva conforme a quantidade de dados) */
  public startHold(diceCount = 2) {
    if (this.isMuted || !this.initCtx()) return;
    this.stopHold();
    this.holdIntensity = 0;
    const preferredEvent: DiceSoundEvent =
      diceCount <= 1 ? 'holdSingle' : diceCount <= 4 ? 'holdFew' : 'holdMany';
    const preferredSources = this.sourcesOf(preferredEvent);
    const entry =
      preferredSources.length > 0 ? DICE_SOUNDS[preferredEvent] : DICE_SOUNDS.holdLoop;

    const startWithBuf = (buf: AudioBuffer) => {
      if (!this.ctx || !this.master || this.isMuted) return;
      this.stopHold();
      this.holdSource = this.ctx.createBufferSource();
      this.holdGain = this.ctx.createGain();
      this.holdSource.buffer = buf;
      this.holdSource.loop = true;
      this.holdGain.gain.value = entry.volume * 0.55;
      this.holdSource.connect(this.holdGain);
      this.holdGain.connect(this.master);
      this.holdSource.start();
    };

    const buf = this.bufferFor(preferredEvent) || this.bufferFor('holdLoop');
    if (buf) {
      startWithBuf(buf);
      return;
    }

    const urls = preferredSources.length > 0 ? preferredSources : this.sourcesOf('holdLoop');
    if (urls.length > 0) {
      this.load(urls[0]).then((loaded) => {
        if (loaded) startWithBuf(loaded);
      });
      return;
    }
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
