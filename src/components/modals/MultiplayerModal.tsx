import { useState, useEffect } from 'react';
import {
  Radio,
  Users,
  Copy,
  Check,
  LogOut,
  Crown,
  User,
  RefreshCw,
  Link as LinkIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';

export default function MultiplayerModal() {
  const isModalOpen = useMultiplayerStore((state) => state.isModalOpen);
  const setIsModalOpen = useMultiplayerStore((state) => state.setIsModalOpen);
  const isConnected = useMultiplayerStore((state) => state.isConnected);
  const roomId = useMultiplayerStore((state) => state.roomId);
  const role = useMultiplayerStore((state) => state.role);
  const members = useMultiplayerStore((state) => state.members);
  const error = useMultiplayerStore((state) => state.error);
  const createRoom = useMultiplayerStore((state) => state.createRoom);
  const joinRoom = useMultiplayerStore((state) => state.joinRoom);
  const leaveRoom = useMultiplayerStore((state) => state.leaveRoom);
  const syncStateToRoom = useMultiplayerStore((state) => state.syncStateToRoom);

  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [hostNameInput, setHostNameInput] = useState('');
  const [playerNameInput, setPlayerNameInput] = useState('');
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
      <DialogContent className="bg-[#1a1a1e] border border-[#323238] text-[#e1e1e6] sm:max-w-[460px] p-6 shadow-2xl rounded-xl">
        <DialogHeader className="border-b border-[#323238] pb-3">
          <DialogTitle className="flex items-center gap-2.5 text-[#ffd700] text-lg font-bold">
            <Radio className="w-5 h-5 text-[#ffd700]" />
            <span>Mesa Multiplayer Online</span>
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-md">
            {error}
          </div>
        )}

        {isConnected && roomId ? (
          // --- Vista quando CONECTADO ---
          <div className="space-y-4 pt-2">
            {/* Card de Informações da Sala */}
            <div className="p-3.5 bg-[#121214] border border-[#323238] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#a8a8b3] font-semibold block">
                  Código da Sala
                </span>
                <span className="text-xl font-mono font-bold tracking-widest text-[#04d361]">
                  {roomId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#202024] hover:bg-[#323238] border border-[#323238] active:scale-95 text-xs text-[#e1e1e6] rounded-md transition-all font-semibold cursor-pointer"
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
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#8257e5]/15 hover:bg-[#8257e5]/25 border border-[#8257e5]/30 active:scale-95 text-xs text-[#8257e5] rounded-md transition-all font-semibold cursor-pointer"
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
            <div className="flex items-center justify-between text-xs text-[#a8a8b3] px-1">
              <span>Você está conectado como:</span>
              <span className="font-semibold text-[#e1e1e6] flex items-center gap-1">
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
                <p className="text-xs font-semibold uppercase tracking-wider text-[#a8a8b3] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Jogadores na Mesa ({members.length})
                </p>
                {role === 'gm' && (
                  <button
                    onClick={handleManualSync}
                    className="text-[11px] text-[#8257e5] hover:underline flex items-center gap-1 cursor-pointer font-medium"
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
                    className="flex items-center justify-between px-3 py-2 bg-[#121214] border border-[#323238] rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: member.color || '#04d361' }}
                      />
                      <span className="text-sm font-medium text-[#e1e1e6]">
                        {member.name}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#202024] border border-[#323238] text-[#a8a8b3]">
                      {member.role === 'gm' ? 'Mestre' : 'Jogador'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botão Desconectar */}
            <div className="pt-2 border-t border-[#323238]">
              <button
                onClick={leaveRoom}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-md font-medium text-xs transition-colors cursor-pointer"
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
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#121214] border border-[#323238] rounded-lg">
              <button
                onClick={() => setTab('create')}
                className={`py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                  tab === 'create'
                    ? 'bg-[#8257e5] text-white shadow'
                    : 'text-[#a8a8b3] hover:text-[#e1e1e6]'
                }`}
              >
                Criar Nova Mesa
              </button>
              <button
                onClick={() => setTab('join')}
                className={`py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                  tab === 'join'
                    ? 'bg-[#8257e5] text-white shadow'
                    : 'text-[#a8a8b3] hover:text-[#e1e1e6]'
                }`}
              >
                Entrar em Mesa
              </button>
            </div>

            {tab === 'create' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#a8a8b3] mb-1">
                    Seu Nome de Mestre
                  </label>
                  <input
                    type="text"
                    value={hostNameInput}
                    onChange={(e) => setHostNameInput(e.target.value)}
                    placeholder="Ex: Mestre"
                    className="w-full px-3 py-2 bg-[#121214] border border-[#323238] rounded-md text-sm text-[#e1e1e6] focus:outline-none focus:border-[#8257e5]"
                  />
                </div>
                <p className="text-xs text-[#a8a8b3]">
                  Ao criar a mesa, um código exclusivo será gerado para você
                  compartilhar com os jogadores.
                </p>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full py-2.5 bg-[#8257e5] hover:bg-[#9466ff] disabled:opacity-50 text-white font-semibold text-sm rounded-md shadow-lg shadow-[#8257e5]/20 transition-all active:scale-[0.99] cursor-pointer"
                >
                  {loading ? 'Criando...' : 'Iniciar Mesa Online'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#a8a8b3] mb-1">
                    Seu Nome de Jogador
                  </label>
                  <input
                    type="text"
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    placeholder="Ex: Jogador"
                    className="w-full px-3 py-2 bg-[#121214] border border-[#323238] rounded-md text-sm text-[#e1e1e6] focus:outline-none focus:border-[#8257e5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#a8a8b3] mb-1">
                    Código da Mesa
                  </label>
                  <input
                    type="text"
                    value={codeParam}
                    onChange={(e) => setCodeParam(e.target.value.toUpperCase())}
                    placeholder="Ex: SGM-XXXX"
                    className="w-full px-3 py-2 bg-[#121214] border border-[#323238] rounded-md text-sm font-mono uppercase tracking-widest text-[#e1e1e6] focus:outline-none focus:border-[#8257e5]"
                  />
                </div>
                <button
                  onClick={handleJoin}
                  disabled={loading || !codeParam.trim()}
                  className="w-full py-2.5 bg-[#8257e5] hover:bg-[#9466ff] disabled:opacity-50 text-white font-semibold text-sm rounded-md shadow-lg shadow-[#8257e5]/20 transition-all active:scale-[0.99] cursor-pointer"
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
