import { useState } from 'react';
import {
  FolderOpen,
  Download,
  FilePlus2,
  FileText,
  HelpCircle,
  Plus,
  Swords,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  Radio,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTokenStore } from '@/store/useTokenStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useCampaignStore } from '@/store/useCampaignStore';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { useThemeStore } from '@/store/useThemeStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Header() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const tokens = useTokenStore((state) => state.tokens);

  const setShowTokenCreateModal = useTokenStore(
    (state) => state.setShowTokenCreateModal,
  );
  const setTokenContextMenu = useTokenStore(
    (state) => state.setTokenContextMenu,
  );
  const setShowLoadModal = useCampaignStore((state) => state.setShowLoadModal);
  const setShowSaveModal = useCampaignStore((state) => state.setShowSaveModal);
  const autoSaveSlot = useCampaignStore((state) => state.autoSaveSlot);
  const autoSaveStatus = useCampaignStore((state) => state.autoSaveStatus);
  const isMultiplayerConnected = useMultiplayerStore(
    (state) => state.isConnected,
  );
  const setIsMultiplayerModalOpen = useMultiplayerStore(
    (state) => state.setIsModalOpen,
  );

  const [showNewMapConfirm, setShowNewMapConfirm] = useState(false);

  const handleNew = () => {
    setShowNewMapConfirm(true);
  };

  const confirmNewMap = () => {
    useTokenStore.setState({
      tokens: [],
      initiativeQueue: [],
      editingTokenId: null,
      tokenContextMenu: null,
    });
    useZoneStore.setState({
      zones: {},
      markers: {},
      bgImages: [],
      selectedZoneId: null,
      editingMarkers: false,
      activeTool: 'pan',
    });
    useCampaignStore.setState({ turn: 1 });
    setShowNewMapConfirm(false);
  };

  const handleSave = () => {
    setShowSaveModal(true);
  };

  const handleLoad = () => {
    setShowLoadModal(true);
  };

  return (
    <header className="h-[70px] bg-surface-elevated border-b border-subtle flex items-center justify-between px-5 z-50 shadow-sm transition-colors duration-200">
      {/* Logo & File Menu */}
      <div className="flex items-center gap-4">
        <div className="font-bold text-brand-gold flex items-center gap-2">
          <Swords className="w-6 h-6" />
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-main">
                SGM
              </span>
              <span className="text-xs text-muted-custom font-medium tracking-wider">
                v7.0
              </span>
            </div>
            <span className="text-[0.60rem] text-muted-custom font-semibold uppercase tracking-wider leading-none mt-0.5">
              Sistema Gerenciador de Mesas
            </span>
          </div>

          {autoSaveStatus === 'saving' && (
            <div className="flex items-center gap-1.5 ml-2 text-xs text-brand-purple font-semibold animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="opacity-80">Salvando...</span>
            </div>
          )}
          {autoSaveStatus === 'success' && (
            <div className="flex items-center gap-1.5 ml-2 text-xs text-brand-green font-semibold animate-in fade-in slide-in-from-left-2 duration-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="opacity-80">Salvo!</span>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input h-9 px-4 py-2 bg-transparent border-none font-bold text-main hover:bg-surface hover:text-main">
            <FileText className="w-4 h-4 mr-2" />
            Arquivo
            <ChevronDown className="w-4 h-4 ml-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-surface-elevated border border-subtle text-main shadow-xl">
            <DropdownMenuItem
              onClick={handleNew}
              disabled={autoSaveSlot !== null}
              className="cursor-pointer hover:bg-brand-purple hover:text-white focus:bg-brand-purple focus:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                autoSaveSlot !== null
                  ? 'Desative o Auto-Save para criar um mapa novo'
                  : ''
              }
            >
              <FilePlus2 className="w-4 h-4 mr-2" /> Novo
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLoad}
              className="cursor-pointer hover:bg-brand-purple hover:text-white focus:bg-brand-purple focus:text-white"
            >
              <FolderOpen className="w-4 h-4 mr-2" /> Carregar Salvamento
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSave}
              className="cursor-pointer hover:bg-brand-purple hover:text-white focus:bg-brand-purple focus:text-white"
            >
              <Download className="w-4 h-4 mr-2" /> Salvar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Token Roster */}
      <div className="flex-1 px-5 mx-5 border-x border-[#323238] h-full flex items-center overflow-x-auto gap-3">
        {tokens.map((t) => {
          const isOnMap = t.x !== null;
          return (
            <div
              key={t.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', t.id);
                e.dataTransfer.effectAllowed = 'copyMove';
              }}
              className={`
                w-[50px] h-[50px] rounded-full border-[3px] flex items-center justify-center overflow-hidden
                font-bold text-[0.9rem] cursor-grab shrink-0 select-none
                transition-transform duration-200
                hover:scale-110 hover:shadow-[0_0_10px_#8257e5]
                active:cursor-grabbing
                ${isOnMap ? 'opacity-50 border-dashed' : ''}
              `}
              style={{
                borderColor: t.colorBorder,
                backgroundColor: t.colorFill,
                color: t.colorText,
              }}
              title={t.fullName}
              onClick={() => {
                if (t.x !== null && t.y !== null) {
                  window.dispatchEvent(
                    new CustomEvent('panTo', { detail: { x: t.x, y: t.y } }),
                  );
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setTokenContextMenu({ id: t.id, x: e.clientX, y: e.clientY });
              }}
            >
              {t.imageUrl ? (
                <img
                  src={t.imageUrl}
                  alt={t.name}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
              ) : (
                t.name
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Dialog>
          <DialogTrigger
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-transparent text-muted-custom hover:text-main hover:bg-surface h-9 px-3 cursor-pointer"
            title="Ajuda e Guia do Sistema"
          >
            <HelpCircle className="w-5 h-5" />
          </DialogTrigger>
          <DialogContent className="bg-surface border border-subtle text-main sm:max-w-[560px] max-h-[85vh] overflow-y-auto shadow-2xl rounded-xl">
            <DialogHeader className="border-b border-subtle pb-3">
              <DialogTitle className="text-brand-gold text-xl font-bold flex items-center gap-2.5">
                <Swords className="w-6 h-6 text-brand-gold" />
                <span>SGM v7.0 — Guia do Sistema</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm mt-2 text-main">
              <p className="text-muted-custom leading-relaxed">
                O{' '}
                <strong className="text-main">
                  Sistema Gerenciador de Mesas (SGM)
                </strong>{' '}
                é uma plataforma moderna de Virtual Tabletop (VTT) focada em
                combate dinâmico, gerenciamento ágil e imersão total.
              </p>

              <div className="bg-app border border-subtle rounded-lg p-3.5 space-y-2.5">
                <h4 className="font-bold text-brand-purple uppercase text-xs tracking-wider flex items-center gap-1.5">
                  ⚡ Como Começar
                </h4>
                <ul className="space-y-1.5 text-muted-custom text-xs leading-relaxed pl-1">
                  <li>
                    • <strong className="text-main">Novo Token:</strong> Crie
                    personagens ou ameaças no botão do topo. Arraste a inicial
                    do roster superior diretamente para o tabuleiro.
                  </li>
                  <li>
                    • <strong className="text-main">Mapa de Batalha:</strong>{' '}
                    Use a barra inferior de ferramentas para subir imagens de
                    fundo, definir zonas táticas ou desenhar no grid.
                  </li>
                  <li>
                    •{' '}
                    <strong className="text-main">Iniciativa & Rodadas:</strong>{' '}
                    Defina a ordem de combate na barra superior e avance turnos
                    e rodadas na barra inferior.
                  </li>
                  <li>
                    • <strong className="text-main">Mesa Online:</strong> Clique
                    em{' '}
                    <span className="text-brand-purple font-semibold">
                      Multiplayer
                    </span>{' '}
                    para criar uma sala e compartilhar o link com os jogadores.
                  </li>
                </ul>
              </div>

              <div className="bg-app border border-subtle rounded-lg p-3.5 space-y-2.5">
                <h4 className="font-bold text-brand-gold uppercase text-xs tracking-wider flex items-center gap-1.5">
                  🎯 Dicas e Atalhos Rápidos
                </h4>
                <ul className="space-y-1.5 text-muted-custom text-xs leading-relaxed pl-1">
                  <li>
                    •{' '}
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated border border-subtle text-[11px] font-mono text-main">
                      Alt + Clique
                    </kbd>{' '}
                    (ou clique do meio): Dispara um <strong>Ping Tático</strong>{' '}
                    animado visível para toda a mesa.
                  </li>
                  <li>
                    •{' '}
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated border border-subtle text-[11px] font-mono text-main">
                      Ctrl + S
                    </kbd>
                    : Salva instantaneamente o mapa no slot configurado.
                  </li>
                  <li>
                    •{' '}
                    <strong className="text-main">
                      Botão Direito no Token:
                    </strong>{' '}
                    Abre o menu de contexto para localizar, abrir ficha,
                    duplicar ou remover do mapa.
                  </li>
                  <li>
                    • <strong className="text-main">Scroll do Mouse:</strong>{' '}
                    Aplica zoom no mapa ou redimensiona imagens quando a
                    ferramenta "Imagem" estiver ativa.
                  </li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          onClick={() => setIsMultiplayerModalOpen(true)}
          variant="outline"
          className={`font-bold transition-all border ${
            isMultiplayerConnected
              ? 'bg-brand-green/15 border-brand-green/40 text-brand-green hover:bg-brand-green/25 hover:text-brand-green'
              : 'bg-transparent border-muted text-main hover:bg-surface'
          }`}
        >
          <Radio
            className={`w-4 h-4 mr-2 ${
              isMultiplayerConnected
                ? 'text-brand-green animate-pulse'
                : 'text-brand-purple'
            }`}
          />
          {isMultiplayerConnected ? (
            <span className="flex items-center gap-1.5">
              Mesa Online
              <span className="w-2 h-2 rounded-full bg-brand-green animate-ping" />
            </span>
          ) : (
            'Multiplayer'
          )}
        </Button>
        <Button
          onClick={() => setShowTokenCreateModal(true)}
          variant="outline"
          className="bg-transparent border-muted text-main hover:bg-surface font-bold"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Token
        </Button>
        {/* Alternador de Tema (Modo Claro / Modo Escuro) */}
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="icon"
          className="bg-transparent border-muted text-main hover:bg-surface transition-colors cursor-pointer"
          title={
            theme === 'dark'
              ? 'Alternar para Modo Claro'
              : 'Alternar para Modo Escuro'
          }
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-brand-gold transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-brand-purple transition-transform hover:-rotate-12" />
          )}
        </Button>
      </div>

      {/* Confirmação de Novo Mapa sem janela nativa do navegador */}
      <Dialog open={showNewMapConfirm} onOpenChange={setShowNewMapConfirm}>
        <DialogContent className="bg-surface border border-subtle text-main sm:max-w-[420px] p-5 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-brand-gold text-lg font-bold flex items-center gap-2">
              <FilePlus2 className="w-5 h-5" /> Criar Novo Mapa
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-custom my-2 leading-relaxed">
            Deseja criar um novo mapa? Todos os tokens no tabuleiro, zonas e
            marcadores não salvos serão limpos.
          </p>
          <DialogFooter className="flex-row justify-end gap-2 pt-3 border-t border-subtle">
            <Button
              variant="outline"
              onClick={() => setShowNewMapConfirm(false)}
              className="border-subtle bg-transparent text-main hover:bg-surface-elevated cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmNewMap}
              className="bg-brand-purple hover:bg-brand-purple-hover text-white font-bold cursor-pointer"
            >
              Novo Mapa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
