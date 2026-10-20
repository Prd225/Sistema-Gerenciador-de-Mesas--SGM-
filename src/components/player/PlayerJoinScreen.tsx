import { useState } from 'react';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { Radio, ArrowLeft, Loader2 } from 'lucide-react';

interface PlayerJoinScreenProps {
  roomCode: string;
  onCancel: () => void;
}

export default function PlayerJoinScreen({
  roomCode,
  onCancel,
}: PlayerJoinScreenProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const joinRoom = useMultiplayerStore((state) => state.joinRoom);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setLocalError('Por favor, informe seu nome de jogador.');
      return;
    }

    try {
      setLoading(true);
      setLocalError(null);
      await joinRoom(roomCode, name.trim());
    } catch (err: any) {
      setLocalError(err.message || 'Falha ao conectar à sala.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121214] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#202024] border border-[#323238] rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 text-[#e1e1e6]">
        {/* Topo com ícone */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-[#8257e5]/20 text-[#8257e5] flex items-center justify-center mb-1 shadow-lg shadow-[#8257e5]/10">
            <Radio className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Entrar na Mesa
          </h1>
          <p className="text-sm text-[#a8a8b3]">
            Você foi convidado para a sala{' '}
            <strong className="text-[#ffd700] font-mono tracking-wider">
              {roomCode.toUpperCase()}
            </strong>
          </p>
        </div>

        {/* Formulário de entrada */}
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="playerName"
              className="text-xs font-semibold text-[#a8a8b3] tracking-wide"
            >
              SEU NOME
            </label>
            <input
              id="playerName"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pedro, Arqueiro Elfo..."
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-[#121214] border border-[#323238] text-white placeholder-gray-500 focus:outline-none focus:border-[#8257e5] transition-colors"
            />
          </div>

          {localError && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
              {localError}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#8257e5] hover:bg-[#9466ff] disabled:opacity-50 text-white font-semibold text-sm transition-colors shadow-lg shadow-[#8257e5]/25 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Entrando...' : 'Entrar como Jogador'}</span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs text-[#a8a8b3] hover:text-white hover:bg-[#323238]/60 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Modo Mestre</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
