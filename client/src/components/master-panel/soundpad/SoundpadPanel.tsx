import { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Repeat,
  Volume2,
  VolumeX,
  Headphones,
  Radio,
  Music,
  Sparkles,
  Lock,
  Swords,
  Beer,
  Skull,
  CloudRain,
  Flame,
  ArrowRight,
  ShieldCheck,
  Disc3,
} from 'lucide-react';
import { useAudioStore } from '@/store/useAudioStore';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import {
  RPG_AUDIO_PRESETS,
  parseAudioInput,
  type SoundPreset,
} from './audioPresets';

export default function SoundpadPanel() {
  const currentTrack = useAudioStore((state) => state.currentTrack);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const volume = useAudioStore((state) => state.volume);
  const localVolume = useAudioStore((state) => state.localVolume);
  const isLocalMuted = useAudioStore((state) => state.isLocalMuted);
  const loop = useAudioStore((state) => state.loop);

  const playTrack = useAudioStore((state) => state.playTrack);
  const togglePlayPause = useAudioStore((state) => state.togglePlayPause);
  const stop = useAudioStore((state) => state.stop);
  const setRoomVolume = useAudioStore((state) => state.setRoomVolume);
  const setLocalVolume = useAudioStore((state) => state.setLocalVolume);
  const toggleLocalMute = useAudioStore((state) => state.toggleLocalMute);
  const toggleLoop = useAudioStore((state) => state.toggleLoop);

  const role = useMultiplayerStore((state) => state.role);
  const isConnected = useMultiplayerStore((state) => state.isConnected);

  // Se estiver em sala multiplayer e for jogador, aplica modo restrito
  const isPlayer = isConnected && role === 'player';
  const isGm = !isPlayer;

  // Estado local para input de URL
  const [urlInput, setUrlInput] = useState('');
  const [urlSourceType, setUrlSourceType] = useState<'youtube' | 'spotify'>(
    'youtube',
  );
  const [urlError, setUrlError] = useState<string | null>(null);

  // Carregar e tocar URL digitada pelo Mestre
  const handleLoadCustomUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    try {
      const parsed = parseAudioInput(urlInput.trim());
      playTrack(parsed.track);
      setUrlInput('');
      setUrlError(null);
    } catch {
      setUrlError('URL inválida. Tente um link do YouTube ou Spotify.');
    }
  };

  // Tocar preset selecionado pelo Mestre
  const handlePlayPreset = (
    preset: SoundPreset,
    source: 'youtube' | 'spotify' = 'youtube',
  ) => {
    if (!isGm) return;
    const track =
      source === 'youtube' ? preset.youtubeTrack : preset.spotifyTrack;
    playTrack(track);
  };

  // Ícone dinâmico para presets
  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'swords':
        return Swords;
      case 'beer':
        return Beer;
      case 'skull':
        return Skull;
      case 'rain':
        return CloudRain;
      case 'flame':
        return Flame;
      default:
        return Music;
    }
  };

  // Determina embed do Spotify caso a faixa atual seja do Spotify
  const getSpotifyEmbedUrl = () => {
    if (!currentTrack || currentTrack.source !== 'spotify') return null;
    const parsed = parseAudioInput(currentTrack.url);
    return parsed.embedUrl;
  };

  const spotifyEmbedUrl = getSpotifyEmbedUrl();

  return (
    <div className="flex flex-col h-full bg-canvas overflow-hidden select-none">
      {/* Cabeçalho do Soundpad */}
      <div className="flex items-center justify-between p-3.5 border-b border-subtle bg-surface/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-purple/20 rounded-lg text-brand-purple">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-main leading-tight">
                Soundpad SGM
              </h2>
              {isPlaying && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-green/20 text-brand-green border border-brand-green/30 animate-pulse">
                  <Radio className="w-2.5 h-2.5" /> AO VIVO
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-custom mt-0.5">
              Áudio e trilha sonora em tempo real para toda a mesa
            </p>
          </div>
        </div>

        {/* Badge de permissão / papel */}
        {isPlayer ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-app border border-subtle text-muted-custom text-xs font-medium">
            <Lock className="w-3.5 h-3.5 text-brand-purple" />
            <span>Sincronizado com o Mestre</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-purple/15 border border-brand-purple/30 text-brand-purple text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Controle do Mestre</span>
          </div>
        )}
      </div>

      {/* Aviso Sutil para Jogadores */}
      {isPlayer && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-brand-purple/10 border-b border-brand-purple/20 text-xs text-brand-purple">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-brand-gold animate-spin" />
            <span>
              <strong>Sincronizado com a trilha do Mestre:</strong> O áudio da
              sala é controlado exclusivamente pelo Mestre. Você pode ajustar
              seu volume local abaixo.
            </span>
          </div>
        </div>
      )}

      {/* Área de Conteúdo com Scroll */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* Card de Reprodução Atual (Now Playing) */}
        <div className="relative bg-surface-elevated border border-subtle rounded-xl p-4 shadow-md overflow-hidden">
          {/* Efeito sutil de fundo animado quando tocando */}
          {isPlaying && (
            <div className="absolute inset-0 bg-gradient-to-r from-brand-purple/10 via-transparent to-brand-gold/5 pointer-events-none animate-pulse" />
          )}

          <div className="relative flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border ${
                    isPlaying
                      ? 'bg-brand-purple/20 border-brand-purple text-brand-purple shadow-sm'
                      : 'bg-app border-subtle text-muted-custom'
                  }`}
                >
                  <Disc3
                    className={`w-6 h-6 ${isPlaying ? 'animate-spin' : ''}`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-bold text-muted-custom">
                      Tocando Agora
                    </span>
                    {currentTrack?.source && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          currentTrack.source === 'youtube'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : currentTrack.source === 'spotify'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30'
                        }`}
                      >
                        {currentTrack.source === 'youtube'
                          ? 'YouTube'
                          : currentTrack.source === 'spotify'
                            ? 'Spotify'
                            : 'Áudio Direto'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-main truncate mt-0.5">
                    {currentTrack?.title || 'Nenhuma faixa selecionada'}
                  </h3>
                  <p className="text-xs text-muted-custom truncate">
                    {currentTrack?.artist ||
                      (isGm
                        ? 'Escolha um preset ou insira uma URL abaixo'
                        : 'Aguardando o Mestre iniciar a trilha sonora')}
                  </p>
                </div>
              </div>

              {/* Botão de Loop */}
              <button
                type="button"
                disabled={!isGm}
                onClick={toggleLoop}
                className={`p-2 rounded-lg border transition-all ${
                  loop
                    ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
                    : 'bg-app border-subtle text-muted-custom hover:text-main'
                } ${!isGm ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={
                  !isGm
                    ? 'Loop controlado pelo Mestre'
                    : loop
                      ? 'Loop ativado'
                      : 'Ativar loop da faixa'
                }
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Embed Interativo do Spotify caso a faixa atual seja Spotify */}
            {spotifyEmbedUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-subtle bg-black/40">
                <iframe
                  src={spotifyEmbedUrl}
                  width="100%"
                  height="80"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  title="Player do Spotify"
                  className="rounded-lg"
                />
              </div>
            )}

            {/* Visualizador de Áudio Animado */}
            {isPlaying && (
              <div className="flex items-end gap-1 h-4 pt-1">
                {[40, 75, 100, 60, 90, 45, 80, 55, 95, 70, 85, 50].map(
                  (h, i) => (
                    <span
                      key={i}
                      className="flex-1 bg-brand-purple/70 rounded-full transition-all duration-200"
                      style={{
                        height: `${h}%`,
                        animation: `pulse 0.8s ease-in-out infinite alternate ${i * 0.08}s`,
                      }}
                    />
                  ),
                )}
              </div>
            )}

            {/* Barra de Controles Principais */}
            <div className="flex items-center justify-between pt-2 border-t border-subtle/60 gap-4 mt-1">
              {/* Botões de Reprodução (Play/Pause/Stop) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!isGm || !currentTrack}
                  onClick={togglePlayPause}
                  className={`flex items-center justify-center h-9 px-3 rounded-lg font-semibold text-xs gap-1.5 transition-all shadow-sm ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-600 text-black'
                      : 'bg-brand-green hover:bg-emerald-600 text-white'
                  } ${
                    !isGm || !currentTrack
                      ? 'opacity-40 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                  title={!isGm ? 'Apenas o Mestre pode iniciar' : undefined}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" /> Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" /> Reproduzir
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!isGm || !currentTrack}
                  onClick={stop}
                  className={`flex items-center justify-center h-9 w-9 rounded-lg border border-subtle bg-app text-muted-custom hover:text-main hover:bg-surface transition-colors ${
                    !isGm || !currentTrack
                      ? 'opacity-40 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                  title={!isGm ? 'Apenas o Mestre pode parar' : 'Parar áudio'}
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>

              {/* Sliders de Volume: Sala (Mestre) e Local (Todos) */}
              <div className="flex items-center gap-4 flex-1 justify-end">
                {/* Volume da Sala (Controlado pelo Mestre) */}
                {isGm ? (
                  <div className="flex items-center gap-2 max-w-[170px] w-full">
                    <Volume2 className="w-3.5 h-3.5 text-brand-purple shrink-0" />
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between text-[10px] text-muted-custom">
                        <span>Mesa</span>
                        <span className="font-bold text-main">{volume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) =>
                          setRoomVolume(Number(e.target.value) || 0)
                        }
                        className="w-full h-1.5 bg-app rounded-lg appearance-none cursor-pointer accent-brand-purple"
                        title="Volume transmitido para a sala inteira"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-muted-custom">
                    <Volume2 className="w-3.5 h-3.5 text-brand-purple" />
                    <span>Mesa: {volume}%</span>
                  </div>
                )}

                {/* Volume Local Individual (Disponível para Todos) */}
                <div className="flex items-center gap-2 max-w-[170px] w-full pl-3 border-l border-subtle">
                  <button
                    type="button"
                    onClick={toggleLocalMute}
                    className="p-1 rounded text-muted-custom hover:text-main cursor-pointer"
                    title={
                      isLocalMuted
                        ? 'Desmutar som individual'
                        : 'Mutar som individual'
                    }
                  >
                    {isLocalMuted ? (
                      <VolumeX className="w-4 h-4 text-brand-red" />
                    ) : (
                      <Headphones className="w-4 h-4 text-brand-green" />
                    )}
                  </button>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between text-[10px] text-muted-custom">
                      <span>Meu Som</span>
                      <span className="font-bold text-main">
                        {isLocalMuted ? 'Mudo' : `${localVolume}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isLocalMuted ? 0 : localVolume}
                      onChange={(e) => {
                        if (isLocalMuted) toggleLocalMute();
                        setLocalVolume(Number(e.target.value) || 0);
                      }}
                      className="w-full h-1.5 bg-app rounded-lg appearance-none cursor-pointer accent-brand-green"
                      title="Seu volume local (não afeta os outros jogadores)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção do Mestre: Input de URL YouTube / Spotify */}
        {isGm && (
          <div className="bg-surface-elevated border border-subtle rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-main uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                Carregar Trilha ou Música
              </span>
              <div className="flex items-center gap-1 bg-app border border-subtle rounded-md p-0.5">
                <button
                  type="button"
                  onClick={() => setUrlSourceType('youtube')}
                  className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                    urlSourceType === 'youtube'
                      ? 'bg-red-500/20 text-red-400 font-bold'
                      : 'text-muted-custom hover:text-main'
                  }`}
                >
                  YouTube
                </button>
                <button
                  type="button"
                  onClick={() => setUrlSourceType('spotify')}
                  className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                    urlSourceType === 'spotify'
                      ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                      : 'text-muted-custom hover:text-main'
                  }`}
                >
                  Spotify
                </button>
              </div>
            </div>

            <form onSubmit={handleLoadCustomUrl} className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setUrlError(null);
                }}
                placeholder={
                  urlSourceType === 'youtube'
                    ? 'Cole o link do YouTube (ex: youtube.com/watch?v=... ou youtu.be/...)'
                    : 'Cole o link do Spotify (ex: open.spotify.com/track/... ou playlist/...)'
                }
                className="flex-1 bg-app border border-subtle focus:border-brand-purple rounded-lg px-3 py-1.5 text-xs text-main placeholder:text-muted-custom/50 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!urlInput.trim()}
                className="flex items-center gap-1.5 bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                <span>Tocar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {urlError && <p className="text-[11px] text-red-400">{urlError}</p>}
          </div>
        )}

        {/* Presets Táticos de RPG Prontos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-main uppercase tracking-wider flex items-center gap-1.5">
              <Disc3 className="w-3.5 h-3.5 text-brand-purple" />
              Presets Táticos Prontos
            </h3>
            <span className="text-[10px] text-muted-custom">
              5 Ambientes de Campanha
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {RPG_AUDIO_PRESETS.map((preset) => {
              const Icon = getPresetIcon(preset.icon);
              const isCurrentPreset =
                currentTrack?.id === preset.youtubeTrack.id ||
                currentTrack?.id === preset.spotifyTrack.id;

              return (
                <div
                  key={preset.id}
                  className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all duration-200 overflow-hidden ${
                    isCurrentPreset
                      ? 'bg-surface-elevated border-brand-purple shadow-md ring-1 ring-brand-purple/50'
                      : 'bg-surface hover:bg-surface-elevated border-subtle hover:border-brand-purple/40'
                  }`}
                >
                  {/* Gradiente sutil característico do preset */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${preset.bgGradient} opacity-50 pointer-events-none`}
                  />

                  <div className="relative flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                      style={{
                        backgroundColor: `${preset.accentColor}25`,
                        color: preset.accentColor,
                        border: `1px solid ${preset.accentColor}40`,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-main leading-tight truncate">
                          {preset.title}
                        </h4>
                        <span
                          className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase"
                          style={{
                            backgroundColor: `${preset.accentColor}20`,
                            color: preset.accentColor,
                          }}
                        >
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-brand-gold/90 mt-0.5">
                        {preset.subtitle}
                      </p>
                      <p className="text-[10px] text-muted-custom line-clamp-2 mt-1 leading-snug">
                        {preset.description}
                      </p>
                    </div>
                  </div>

                  {/* Ações de Reprodução do Preset */}
                  <div className="relative flex items-center justify-between pt-2.5 mt-2 border-t border-subtle/50">
                    <span className="text-[10px] text-muted-custom">
                      {isCurrentPreset && isPlaying ? (
                        <span className="text-brand-green font-bold flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5" /> Tocando Agora
                        </span>
                      ) : (
                        'Clique para iniciar'
                      )}
                    </span>

                    {isGm ? (
                      <div className="flex items-center gap-1.5">
                        {/* Botão YouTube */}
                        <button
                          type="button"
                          onClick={() => handlePlayPreset(preset, 'youtube')}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/15 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-[10px] font-bold transition-colors cursor-pointer"
                          title="Tocar via YouTube"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" /> YouTube
                        </button>

                        {/* Botão Spotify */}
                        <button
                          type="button"
                          onClick={() => handlePlayPreset(preset, 'spotify')}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition-colors cursor-pointer"
                          title="Tocar via Spotify"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" /> Spotify
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-custom italic">
                        Controlado pelo Mestre
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
