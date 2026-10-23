import StageMap from '@/canvas/StageMap';
import InitiativeBar from '@/components/initiative/InitiativeBar';
import PlayerHud from './PlayerHud';
import PlayerAudioEngine from './PlayerAudioEngine';
import PlayerToolbar from './PlayerToolbar';
import PlayerHandoutsDrawer from './PlayerHandoutsDrawer';
import PlayerProjectionOverlay from './PlayerProjectionOverlay';
import PlayerHandoutNotification from './PlayerHandoutNotification';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { WifiOff, AlertCircle } from 'lucide-react';

export default function PlayerShell() {
  const isRoomClosed = useMultiplayerStore((state) => state.isRoomClosed);
  const isReconnecting = useMultiplayerStore((state) => state.isReconnecting);
  const members = useMultiplayerStore((state) => state.members);
  const leaveRoom = useMultiplayerStore((state) => state.leaveRoom);

  const gmOnline = members.some((m) => m.role === 'gm' && m.isOnline);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#121214] select-none">
      {/* Mapa do Jogo (Canvas) */}
      <StageMap />

      {/* Barra de Iniciativa */}
      <ErrorBoundary fallback={null} silent>
        <InitiativeBar />
      </ErrorBoundary>

      {/* HUD do Jogador */}
      <ErrorBoundary fallback={null} silent>
        <PlayerHud />
      </ErrorBoundary>

      {/* Toolbar do Jogador (Handouts e Projeção) */}
      <ErrorBoundary fallback={null} silent>
        <PlayerToolbar />
      </ErrorBoundary>

      {/* Notificação Flutuante de Handout Revelado */}
      <ErrorBoundary fallback={null} silent>
        <PlayerHandoutNotification />
      </ErrorBoundary>

      {/* Painel de Handouts Revelados da Mesa */}
      <ErrorBoundary fallback={null} silent>
        <PlayerHandoutsDrawer />
      </ErrorBoundary>

      {/* Projeção do Mestre em Tempo Real */}
      <ErrorBoundary fallback={null} silent>
        <PlayerProjectionOverlay />
      </ErrorBoundary>

      {/* Motor de Áudio Invisível */}
      <ErrorBoundary fallback={null} silent>
        <PlayerAudioEngine />
      </ErrorBoundary>

      {/* Alerta discreto quando o Mestre cair/estiver desconectado */}
      {!gmOnline && !isRoomClosed && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium backdrop-blur-md shadow-lg pointer-events-none">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>O Mestre está desconectado. Aguardando retorno...</span>
        </div>
      )}

      {/* Indicador flutuante de reconexão */}
      {isReconnecting && !isRoomClosed && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#202024]/90 border border-[#323238] text-white text-xs font-medium backdrop-blur-md shadow-lg pointer-events-none animate-pulse">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>Reconectando à sala...</span>
        </div>
      )}

      {/* Overlay de mesa encerrada */}
      {isRoomClosed && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#202024] border border-[#323238] rounded-xl p-6 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-white">Mesa Encerrada</h2>
              <p className="text-sm text-[#a8a8b3]">
                Esta sala foi encerrada pelo Mestre ou não está mais disponível.
              </p>
            </div>

            <button
              onClick={leaveRoom}
              className="w-full py-2.5 px-4 rounded-lg bg-[#8257e5] hover:bg-[#9466ff] text-white font-semibold text-sm transition-colors shadow-lg shadow-[#8257e5]/25"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
