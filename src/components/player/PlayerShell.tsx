import StageMap from '@/canvas/StageMap';
import InitiativeBar from '@/components/initiative/InitiativeBar';
import PlayerHud from './PlayerHud';
import PlayerAudioEngine from './PlayerAudioEngine';
import PlayerToolbar from './PlayerToolbar';
import PlayerHandoutsDrawer from './PlayerHandoutsDrawer';
import PlayerProjectionOverlay from './PlayerProjectionOverlay';
import PlayerHandoutNotification from './PlayerHandoutNotification';
import PlayerSceneNotification from './PlayerSceneNotification';
import DiceTrayWindow from '@/components/dice-tray/DiceTrayWindow';
import DiceTrayOverlayNotification from '@/components/dice-tray/DiceTrayOverlayNotification';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import LoadingScreen from '@/components/common/LoadingScreen';
import { WifiOff, AlertCircle } from 'lucide-react';

export default function PlayerShell() {
  const isRoomClosed = useMultiplayerStore((state) => state.isRoomClosed);
  const isReconnecting = useMultiplayerStore((state) => state.isReconnecting);
  const hasSyncedInitialView = useMultiplayerStore((state) => state.hasSyncedInitialView);
  const members = useMultiplayerStore((state) => state.members);
  const leaveRoom = useMultiplayerStore((state) => state.leaveRoom);

  const gmOnline = members.some((m) => m.role === 'gm' && m.isOnline);

  return (
    <div className="relative w-full h-dvh max-h-dvh overflow-hidden bg-[#121214] select-none touch-none">
      {/* Tela de Carregamento Inicial do Jogador (com oclusão do fundo até sincronizar com a mesa) */}
      {!isRoomClosed && (!hasSyncedInitialView || isReconnecting) && (
        <LoadingScreen
          title={isReconnecting ? 'Reconectando à Mesa...' : 'Conectando à Mesa...'}
          subtitle="Sincronizando com o Mestre..."
          fullscreen={true}
        />
      )}

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

      {/* Toolbar do Jogador (Bandeja de Dados, Handouts e Projeção) */}
      <ErrorBoundary fallback={null} silent>
        <PlayerToolbar />
      </ErrorBoundary>

      {/* Bandeja de Dados Virtual do Jogador */}
      <ErrorBoundary fallback={null} silent>
        <DiceTrayWindow />
      </ErrorBoundary>

      {/* Alerta de Rolagens no Topo do Canvas */}
      <ErrorBoundary fallback={null} silent>
        <DiceTrayOverlayNotification />
      </ErrorBoundary>

      {/* Notificações Flutuantes do Jogador (Cena e Handouts no topo, adaptado para mobile) */}
      <div className="fixed top-[calc(0.75rem+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-[210] pointer-events-none flex flex-col items-center gap-2 w-[calc(100vw-1.5rem)] max-w-md">
        <ErrorBoundary fallback={null} silent>
          <PlayerSceneNotification />
        </ErrorBoundary>
        <ErrorBoundary fallback={null} silent>
          <PlayerHandoutNotification />
        </ErrorBoundary>
      </div>

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
        <div className="fixed top-[calc(1rem+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium backdrop-blur-md shadow-lg pointer-events-none text-center">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate max-w-[80vw]">O Mestre está desconectado. Aguardando retorno...</span>
        </div>
      )}

      {/* Indicador flutuante de reconexão */}
      {isReconnecting && !isRoomClosed && (
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#202024]/90 border border-[#323238] text-white text-xs font-medium backdrop-blur-md shadow-lg pointer-events-none animate-pulse">
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
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Mesa Encerrada</h2>
              <p className="text-xs text-[#a8a8b3]">
                O mestre encerrou a sessão. Você foi desconectado da sala.
              </p>
            </div>
            <button
              onClick={() => {
                leaveRoom();
                window.location.reload();
              }}
              className="w-full py-2 px-4 rounded-lg bg-[#8257e5] hover:bg-[#9466ff] text-white font-semibold text-xs transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
