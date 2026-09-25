import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { useAuthStore } from '@/store/useAuthStore';
import { User, Lock, Mail, AlertCircle, LogIn, UserPlus } from 'lucide-react';

export default function AuthModal() {
  const isAuthModalOpen = useAuthStore((state) => state.isAuthModalOpen);
  const setIsAuthModalOpen = useAuthStore((state) => state.setIsAuthModalOpen);
  const isServerOnline = useAuthStore((state) => state.isServerOnline);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleTokenInput, setGoogleTokenInput] = useState('');
  const [showGoogleInput, setShowGoogleInput] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(identifier, password);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(username, email, password);
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (googleTokenInput.trim()) {
      await loginWithGoogle(googleTokenInput.trim());
    }
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
      <DialogContent className="bg-[#202024] border-[#323238] text-[#e1e1e6] sm:max-w-[420px] p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2 text-white">
            <User className="w-5 h-5 text-[#8257e5]" />
            {tab === 'login' ? 'Acessar Conta SGM' : 'Criar Nova Conta'}
          </DialogTitle>
        </DialogHeader>

        {/* Status de servidor offline */}
        {!isServerOnline && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-2.5 rounded-md text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Servidor backend offline. O SGM está operando em Modo Local.
            </span>
          </div>
        )}

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-300 p-2.5 rounded-md text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Abas Alternadoras */}
        <div className="flex border-b border-[#323238] gap-4 mb-2">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${
              tab === 'login'
                ? 'border-[#8257e5] text-white'
                : 'border-transparent text-[#7c7c8a] hover:text-[#a8a8b3]'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${
              tab === 'register'
                ? 'border-[#8257e5] text-white'
                : 'border-transparent text-[#7c7c8a] hover:text-[#a8a8b3]'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Formulário de Login */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-[#a8a8b3] mb-1 block">
                Usuário ou E-mail
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#7c7c8a] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="text"
                  required
                  placeholder="Seu usuário ou e-mail"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-9 bg-[#121214] border-[#323238] text-white focus-visible:border-[#8257e5] focus-visible:ring-[#8257e5]/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#a8a8b3] mb-1 block">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#7c7c8a] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="password"
                  required
                  placeholder="Sua senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-[#121214] border-[#323238] text-white focus-visible:border-[#8257e5] focus-visible:ring-[#8257e5]/20"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !isServerOnline}
              className="w-full bg-[#8257e5] hover:bg-[#9466ff] text-white font-bold transition-all h-9 mt-2"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isLoading ? 'Conectando...' : 'Entrar na Conta'}
            </Button>
          </form>
        )}

        {/* Formulário de Cadastro */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-[#a8a8b3] mb-1 block">
                Nome de Usuário
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#7c7c8a] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="text"
                  required
                  placeholder="Ex: MestrePedro"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 bg-[#121214] border-[#323238] text-white focus-visible:border-[#8257e5] focus-visible:ring-[#8257e5]/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#a8a8b3] mb-1 block">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7c7c8a] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-[#121214] border-[#323238] text-white focus-visible:border-[#8257e5] focus-visible:ring-[#8257e5]/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#a8a8b3] mb-1 block">
                Senha (mínimo 6 caracteres)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#7c7c8a] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Crie uma senha forte"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-[#121214] border-[#323238] text-white focus-visible:border-[#8257e5] focus-visible:ring-[#8257e5]/20"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !isServerOnline}
              className="w-full bg-[#8257e5] hover:bg-[#9466ff] text-white font-bold transition-all h-9 mt-2"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {isLoading ? 'Cadastrando...' : 'Criar Conta'}
            </Button>
          </form>
        )}

        {/* Divisor */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#323238]"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-[#202024] px-2 text-[#7c7c8a]">ou</span>
          </div>
        </div>

        {/* Opção Google OAuth */}
        {!showGoogleInput ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowGoogleInput(true)}
            className="w-full bg-[#121214] border-[#323238] text-[#e1e1e6] hover:bg-white/5 font-semibold text-xs h-9 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Entrar com o Google
          </Button>
        ) : (
          <form onSubmit={handleGoogleSubmit} className="space-y-2">
            <label className="text-[11px] text-[#a8a8b3] block">
              Cole o Google ID Token / Credencial:
            </label>
            <Input
              type="text"
              placeholder="Cole o ID Token do Google"
              value={googleTokenInput}
              onChange={(e) => setGoogleTokenInput(e.target.value)}
              className="bg-[#121214] border-[#323238] text-xs"
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                className="flex-1 bg-[#8257e5] text-white text-xs font-semibold"
              >
                Validar Google Token
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowGoogleInput(false)}
                className="text-xs text-[#7c7c8a]"
              >
                Voltar
              </Button>
            </div>
          </form>
        )}

        {/* Continuar como Convidado / Modo Local */}
        <div className="text-center mt-3 pt-2 border-t border-[#323238]">
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="text-xs text-[#7c7c8a] hover:text-[#a8a8b3] transition-colors underline"
          >
            Continuar como Convidado (Modo Local)
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
