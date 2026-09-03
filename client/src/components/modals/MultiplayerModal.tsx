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
      <DialogContent className="bg-[#18181b] border border-[#27272a] text-[#f4f4f5] max-w-md w-full p-6 shadow-2xl rounded-xl">
        <DialogHeader className="pb-2 border-b border-[#27272a]">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Radio
                className={`w-5 h-5 ${isConnected ? 'text-[#04d361] animate-pulse' : 'text-[#8257e5]'}`}
              />
              {isConnected ? 'Mesa Online' : 'Conexão Multiplayer'}
            </DialogTitle>
            {isConnected && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#04d361]/10 text-[#04d361] border border-[#04d361]/30">
                <span className="w-2 h-2 rounded-full bg-[#04d361] animate-ping" />
                Ao Vivo
              </span>
            )}
          </div>
        </DialogHeader>

        {error && (
          <div className="mt-3 p-2.5 bg-[#e55757]/10 border border-[#e55757]/30 text-[#e55757] text-xs rounded">
            {error}
          </div>
        )}

        {isConnected && roomId ? (
          // --- Vista quando CONECTADO ---
          <div className="space-y-4 pt-3">
            {/* Card com o Código da Sala */}
            <div className="bg-[#121214] p-3.5 rounded-lg border border-[#27272a] flex items-center justify-between">
              <div>
                <p className="text-xs text-[#a1a1aa] uppercase font-semibold tracking-wider">
                  Código da Mesa
                </p>
                <p className="text-xl font-mono font-bold text-[#8257e5] tracking-widest mt-0.5">
                  {roomId}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#27272a] hover:bg-[#323238] active:scale-95 text-xs text-[#e1e1e6] rounded-md transition-all"
                  title="Copiar código da sala"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-[#04d361]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedCode ? 'Copiado!' : 'Código'}
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#8257e5]/20 hover:bg-[#8257e5]/30 border border-[#8257e5]/40 active:scale-95 text-xs text-[#d1c2f7] rounded-md transition-all"
                  title="Copiar link direto para os jogadores"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-[#04d361]" />
                  ) : (
                    <LinkIcon className="w-3.5 h-3.5" />
                  )}
                  {copiedLink ? 'Link Copiado!' : 'Link'}
                </button>
              </div>
            </div>

            {/* Informações de Perfil */}
            <div className="flex items-center justify-between text-xs text-[#a1a1aa] px-1">
              <span>Você está conectado como:</span>
              <span className="font-semibold text-[#f4f4f5] flex items-center gap-1">
                {role === 'gm' ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-[#ffd700]" /> Mestre
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-[#2ac7e3]" /> Jogador
                  </>
                )}
              </span>
            </div>

            {/* Lista de Membros Online */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Jogadores na Mesa ({members.length})
                </p>
                {role === 'gm' && (
                  <button
                    onClick={handleManualSync}
                    className="text-[11px] text-[#8257e5] hover:text-[#9466ff] flex items-center gap-1 hover:underline"
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
                    className="flex items-center justify-between px-3 py-2 bg-[#121214] border border-[#27272a] rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: member.color || '#04d361' }}
                      />
                      <span className="text-sm font-medium text-[#f4f4f5]">
                        {member.name}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#27272a] text-[#a1a1aa]">
                      {member.role === 'gm' ? 'Mestre' : 'Jogador'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botão Desconectar */}
            <div className="pt-2 border-t border-[#27272a]">
              <button
                onClick={leaveRoom}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#e55757]/10 hover:bg-[#e55757]/20 border border-[#e55757]/30 text-[#e55757] rounded-md font-medium text-xs transition-colors"
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
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#121214] border border-[#27272a] rounded-lg">
              <button
                onClick={() => setTab('create')}
                className={`py-1.5 text-xs font-semibold rounded transition-all ${
                  tab === 'create'
                    ? 'bg-[#8257e5] text-white shadow'
                    : 'text-[#a1a1aa] hover:text-[#f4f4f5]'
                }`}
              >
                Criar Nova Mesa
              </button>
              <button
                onClick={() => setTab('join')}
                className={`py-1.5 text-xs font-semibold rounded transition-all ${
                  tab === 'join'
                    ? 'bg-[#8257e5] text-white shadow'
                    : 'text-[#a1a1aa] hover:text-[#f4f4f5]'
                }`}
              >
                Entrar em Mesa
              </button>
            </div>

            {tab === 'create' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                    Seu Nome de Mestre
                  </label>
                  <input
                    type="text"
                    value={hostNameInput}
                    onChange={(e) => setHostNameInput(e.target.value)}
                    placeholder="Ex: Mestre Ronald"
                    className="w-full px-3 py-2 bg-[#121214] border border-[#27272a] rounded-md text-sm text-[#f4f4f5] focus:outline-none focus:border-[#8257e5]"
                  />
                </div>
                <p className="text-xs text-[#a1a1aa]">
                  Ao criar a mesa, um código exclusivo será gerado para você
                  compartilhar com os jogadores.
                </p>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full py-2.5 bg-[#8257e5] hover:bg-[#9466ff] disabled:opacity-50 text-white font-semibold text-sm rounded-md shadow-lg shadow-[#8257e5]/20 transition-all active:scale-[0.99]"
                >
                  {loading ? 'Criando...' : 'Iniciar Mesa Online'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                    Seu Nome de Jogador
                  </label>
                  <input
                    type="text"
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    placeholder="Ex: Ronald - Ocultista"
                    className="w-full px-3 py-2 bg-[#121214] border border-[#27272a] rounded-md text-sm text-[#f4f4f5] focus:outline-none focus:border-[#8257e5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                    Código da Mesa
                  </label>
                  <input
                    type="text"
                    value={codeParam}
                    onChange={(e) => setCodeParam(e.target.value.toUpperCase())}
                    placeholder="Ex: SGM-XXXX"
                    className="w-full px-3 py-2 bg-[#121214] border border-[#27272a] rounded-md text-sm font-mono uppercase tracking-widest text-[#f4f4f5] focus:outline-none focus:border-[#8257e5]"
                  />
                </div>
                <button
                  onClick={handleJoin}
                  disabled={loading || !codeParam.trim()}
                  className="w-full py-2.5 bg-[#8257e5] hover:bg-[#9466ff] disabled:opacity-50 text-white font-semibold text-sm rounded-md shadow-lg shadow-[#8257e5]/20 transition-all active:scale-[0.99]"
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
