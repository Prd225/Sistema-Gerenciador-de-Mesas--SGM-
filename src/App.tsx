import { useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import PlayerShell from './components/player/PlayerShell';
import PlayerJoinScreen from './components/player/PlayerJoinScreen';
import { useMultiplayerStore } from './store/useMultiplayerStore';
import { isPlayerMode } from './lib/roomRole';

function App() {
  const role = useMultiplayerStore((state) => state.role);
  const isRoomClosed = useMultiplayerStore((state) => state.isRoomClosed);

  const [inviteCode, setInviteCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      return room ? room.trim().toUpperCase() : null;
    } catch {
      return null;
    }
  });

  const handleCancelInvite = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.pathname);
    }
    setInviteCode(null);
  };

  // Se o usuário está em papel de jogador ou sala foi encerrada
  if (role === 'player' || isPlayerMode() || (isRoomClosed && role === null && !inviteCode)) {
    return <PlayerShell />;
  }

  // Se o usuário acessou via link com código de convite ?room= e ainda não entrou
  if (inviteCode && !role) {
    return (
      <PlayerJoinScreen
        roomCode={inviteCode}
        onCancel={handleCancelInvite}
      />
    );
  }

  return <AppLayout />;
}

export default App;
