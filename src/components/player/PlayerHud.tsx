import { useState } from 'react';
import {
  Users,
  Music,
  Volume2,
  Volume1,
  VolumeX,
  LogOut,
  AlertTriangle,
  Play,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { usePlayerAudioStore } from '@/store/usePlayerAudioStore';

export default function PlayerHud() {
  const roomId = useMultiplayerStore((state) => state.roomId);
  const isConnected = useMultiplayerStore((state) => state.isConnected);
  const isReconnecting = useMultiplayerStore((state) => state.isReconnecting);
  const members = useMultiplayerStore((state) => state.members);
  const leaveRoom = useMultiplayerStore((state) => state.leaveRoom);

  const song = usePlayerAudioStore((state) => state.song);
  const isPlaying = usePlayerAudioStore((state) => state.isPlaying);
  const volume = usePlayerAudioStore((state) => state.volume);
  const isMuted = usePlayerAudioStore((state) => state.isMuted);
  const setVolume = usePlayerAudioStore((state) => state.setVolume);
  const toggleMute = usePlayerAudioStore((state) => state.toggleMute);
  const blocked = usePlayerAudioStore((state) => state.blocked);
  const audioError = usePlayerAudioStore((state) => state.error);

  const [isCollapsed, setIsCollapsed] = useState(false);

  const isSpotify = song?.sourceType === 'spotify';

  const handleResumeAudio = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('player-audio-resume'));
    }
  };

  return (
    <div className="fixed top-4 right-4 z-40 flex flex-col items-end gap-2 pointer-events-none select-none max-w-sm">
      {/* Barra principal do HUD */}
      <div className="pointer-events-auto bg-[#202024]/95 backdrop-blur-md border border-[#323238] rounded-xl shadow-2xl p-3 text-[#e1e1e6] flex flex-col gap-2.5 transition-all w-80">
        {/* Cabeçalho: Status da Sala + Membros + Botão Minimizar + Sair */}
        <div className="flex items-center justify-between gap-2 border-b border-[#323238]/60 pb-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                  : isReconnecting
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-red-500'
              }`}
              title={
                isConnected
                  ? 'Conectado à mesa'
                  : isReconnecting
                    ? 'Reconectando...'
                    : 'Desconectado'
              }
            />
            <span className="font-bold text-xs tracking-wider text-[#a8a8b3]">
              SALA: <strong className="text-white">{roomId ?? '----'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#121214] border border-[#323238] text-[11px] text-[#a8a8b3]"
              title="Jogadores na sala"
            >
              <Users className="w-3 h-3 text-[#8257e5]" />
              <span>{members.length}</span>
            </div>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-[#a8a8b3] hover:text-white hover:bg-[#323238] rounded transition-colors"
              title={isCollapsed ? 'Expandir HUD' : 'Recolher HUD'}
            >
              {isCollapsed ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={leaveRoom}
              className="p-1 text-[#a8a8b3] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Sair da Mesa"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Conteúdo Expansível: Soundpad / Áudio */}
        {!isCollapsed && (
          <div className="flex flex-col gap-2">
            {/* Bloco de Música */}
            <div className="flex items-start gap-2 bg-[#121214]/80 p-2 rounded-lg border border-[#323238]/40">
              <div className="p-1.5 rounded bg-[#8257e5]/20 text-[#8257e5] shrink-0 mt-0.5">
                <Music className={`w-4 h-4 ${isPlaying && !isSpotify ? 'animate-pulse' : ''}`} />
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                {song ? (
                  <>
                    <span className="text-xs font-semibold truncate text-[#f5f5f7]">
                      {song.name}
                    </span>
                    <span className="text-[10px] text-[#a8a8b3] truncate">
                      {song.author || 'Música do Mestre'}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-[#7c7c8a] italic">
                    Nenhuma música tocando
                  </span>
                )}
              </div>
            </div>

            {/* Aviso de Spotify (indisponível para jogadores) */}
            {song && isSpotify && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-tight">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Faixa do Spotify indisponível para jogadores.</span>
              </div>
            )}

            {/* Aviso de Autoplay bloqueado pelo navegador */}
            {blocked && (
              <button
                onClick={handleResumeAudio}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-[#8257e5] hover:bg-[#9466ff] text-white text-xs font-semibold shadow-lg shadow-[#8257e5]/30 animate-pulse transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Ativar Áudio
              </button>
            )}

            {/* Erro de Áudio */}
            {audioError && !blocked && (
              <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded">
                {audioError}
              </div>
            )}

            {/* Controle de Volume Pessoal (o jogador regula só pra si, sem pausar) */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#323238]/40">
              <button
                onClick={toggleMute}
                className="text-[#a8a8b3] hover:text-white transition-colors shrink-0"
                title={isMuted ? 'Desmutar som' : 'Mutar som'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : volume < 50 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1.5 bg-[#323238] rounded-lg appearance-none cursor-pointer accent-[#8257e5]"
                title={`Seu volume: ${isMuted ? 0 : volume}%`}
              />

              <span className="text-[11px] text-[#a8a8b3] font-mono min-w-[28px] text-right">
                {isMuted ? '0%' : `${volume}%`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
