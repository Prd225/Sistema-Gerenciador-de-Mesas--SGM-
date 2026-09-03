import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import {
  Users,
  Copy,
  Check,
  LogOut,
  Radio,
  Crown,
  User,
  RefreshCw,
  Link as LinkIcon,
} from 'lucide-react';

export default function MultiplayerModal() {
  const {
    isModalOpen,
    setIsModalOpen,
    isConnected,
    roomId,
    role,
    userName,
    members,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    syncStateToRoom,
  } = useMultiplayerStore();

  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [hostNameInput, setHostNameInput] = useState(userName || 'Mestre');
  const [playerNameInput, setPlayerNameInput] = useState(userName || '');
  const [codeParam, setCodeParam] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Lê parâmetro ?room=XXXX na URL se o usuário abriu um link de convite
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room && !isConnected) {
        setCodeParam(room.toUpperCase());
        setTab('join');
        setIsModalOpen(true);
      }
    } catch {
      // ignore
    }
  }, [isConnected, setIsModalOpen]);

  const handleCreate = async () => {
    try {
      setLoading(true);
      await createRoom(hostNameInput);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!codeParam.trim()) return;
    try {
      setLoading(true);
      await joinRoom(codeParam, playerNameInput);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!roomId) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleManualSync = () => {
    syncStateToRoom();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="bg-surface border border-subtle text-main max-w-md w-full p-6 shadow-2xl rounded-xl">
        <DialogHeader className="pb-2 border-b border-subtle">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-main">
              <Radio
                className={`w-5 h-5 ${isConnected ? 'text-brand-green animate-pulse' : 'text-brand-purple'}`}
              />
              {isConnected ? 'Mesa Online' : 'Conexão Multiplayer'}
            </DialogTitle>
            {isConnected && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-green/10 text-brand-green border border-brand-green/30">
                <span className="w-2 h-2 rounded-full bg-brand-green animate-ping" />
                Ao Vivo
              </span>
            )}
          </div>
        </DialogHeader>

        {error && (
          <div className="mt-3 p-2.5 bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs rounded">
            {error}
          </div>
        )}

        {isConnected && roomId ? (
          // --- Vista quando CONECTADO ---
          <div className="space-y-4 pt-3">
            {/* Card com o Código da Sala */}
            <div className="bg-app p-3.5 rounded-lg border border-subtle flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-custom uppercase font-semibold tracking-wider">
                  Código da Mesa
                </p>
                <p className="text-xl font-mono font-bold text-brand-purple tracking-widest mt-0.5">
                  {roomId}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-elevated hover:bg-surface border border-subtle active:scale-95 text-xs text-main rounded-md transition-all cursor-pointer"
                  title="Copiar código da sala"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-brand-green" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedCode ? 'Copiado!' : 'Código'}
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-purple/15 hover:bg-brand-purple/25 border border-brand-purple/30 active:scale-95 text-xs text-brand-purple rounded-md transition-all font-semibold cursor-pointer"
                  title="Copiar link direto para os jogadores"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-brand-green" />
                  ) : (
                    <LinkIcon className="w-3.5 h-3.5" />
                  )}
                  {copiedLink ? 'Link Copiado!' : 'Link'}
                </button>
              </div>
            </div>

            {/* Informações de Perfil */}
            <div className="flex items-center justify-between text-xs text-muted-custom px-1">
              <span>Você está conectado como:</span>
              <span className="font-semibold text-main flex items-center gap-1">
                {role === 'gm' ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-brand-gold" /> Mestre
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-brand-cyan" /> Jogador
                  </>
                )}
              </span>
            </div>

            {/* Lista de Membros Online */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-custom flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Jogadores na Mesa ({members.length})
                </p>
                {role === 'gm' && (
                  <button
                    onClick={handleManualSync}
                    className="text-[11px] text-brand-purple hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    title="Força o envio do mapa atual para todos na sala"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-sincronizar Mapa
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-3 py-2 bg-app border border-subtle rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: member.color || '#04d361' }}
                      />
                      <span className="text-sm font-medium text-main">
                        {member.name}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-surface-elevated border border-subtle text-muted-custom">
                      {member.role === 'gm' ? 'Mestre' : 'Jogador'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botão Desconectar */}
            <div className="pt-2 border-t border-subtle">
              <button
                onClick={leaveRoom}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-red/10 hover:bg-brand-red/20 border border-brand-red/30 text-brand-red rounded-md font-medium text-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Desconectar da Mesa
              </button>
            </div>
          </div>
        ) : (
          // --- Vista quando DESCONECTADO ---
          <div className="space-y-4 pt-3">
            {/* Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-app border border-subtle rounded-lg">
              <button
                onClick={() => setTab('create')}
                className={`py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                  tab === 'create'
                    ? 'bg-brand-purple text-white shadow'
                    : 'text-muted-custom hover:text-main'
                }`}
              >
                Criar Nova Mesa
              </button>
              <button
                onClick={() => setTab('join')}
                className={`py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                  tab === 'join'
                    ? 'bg-brand-purple text-white shadow'
                    : 'text-muted-custom hover:text-main'
                }`}
              >
                Entrar em Mesa
              </button>
            </div>

            {tab === 'create' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-custom mb-1">
                    Seu Nome de Mestre
                  </label>
                  <input
                    type="text"
                    value={hostNameInput}
                    onChange={(e) => setHostNameInput(e.target.value)}
                    placeholder="Ex: Mestre Ronald"
                    className="w-full px-3 py-2 bg-app border border-subtle rounded-md text-sm text-main focus:outline-none focus:border-brand-purple"
                  />
                </div>
                <p className="text-xs text-muted-custom">
                  Ao criar a mesa, um código exclusivo será gerado para você
                  compartilhar com os jogadores.
                </p>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple-hover disabled:opacity-50 text-white font-semibold text-sm rounded-md shadow-lg shadow-brand-purple/20 transition-all active:scale-[0.99] cursor-pointer"
                >
                  {loading ? 'Criando...' : 'Iniciar Mesa Online'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-custom mb-1">
                    Seu Nome de Jogador
                  </label>
                  <input
                    type="text"
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    placeholder="Ex: Ronald - Ocultista"
                    className="w-full px-3 py-2 bg-app border border-subtle rounded-md text-sm text-main focus:outline-none focus:border-brand-purple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-custom mb-1">
                    Código da Mesa
                  </label>
                  <input
                    type="text"
                    value={codeParam}
                    onChange={(e) => setCodeParam(e.target.value.toUpperCase())}
                    placeholder="Ex: SGM-XXXX"
                    className="w-full px-3 py-2 bg-app border border-subtle rounded-md text-sm font-mono uppercase tracking-widest text-main focus:outline-none focus:border-brand-purple"
                  />
                </div>
                <button
                  onClick={handleJoin}
                  disabled={loading || !codeParam.trim()}
                  className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple-hover disabled:opacity-50 text-white font-semibold text-sm rounded-md shadow-lg shadow-brand-purple/20 transition-all active:scale-[0.99] cursor-pointer"
                >
                  {loading ? 'Conectando...' : 'Entrar na Mesa'}
                </button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
