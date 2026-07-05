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
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTokenStore } from '@/store/useTokenStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useCampaignStore } from '@/store/useCampaignStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Header() {
  const tokens = useTokenStore(state => state.tokens);
  const setShowTokenCreateModal = useTokenStore(state => state.setShowTokenCreateModal);
  const setTokenContextMenu = useTokenStore(state => state.setTokenContextMenu);
  const setShowLoadModal = useCampaignStore(state => state.setShowLoadModal);
  const setShowSaveModal = useCampaignStore(state => state.setShowSaveModal);
  const autoSaveSlot = useCampaignStore(state => state.autoSaveSlot);
  const autoSaveStatus = useCampaignStore(state => state.autoSaveStatus);

  const handleNew = () => {
    if (window.confirm('Deseja criar um novo mapa? Todo progresso não salvo será perdido.')) {
      useTokenStore.setState({ tokens: [], initiativeQueue: [], editingTokenId: null, tokenContextMenu: null });
      useZoneStore.setState({ zones: {}, markers: {}, bgImages: [], selectedZoneId: null, editingMarkers: false, activeTool: 'pan' });
      useCampaignStore.setState({ turn: 1 });
    }
  };

  const handleSave = () => {
    setShowSaveModal(true);
  };

  const handleLoad = () => {
    setShowLoadModal(true);
  };

  return (
    <header className="h-[70px] bg-[#202024]/95 border-b border-[#323238] flex items-center justify-between px-5 z-50 shadow-[0_4px_10px_rgba(0,0,0,0.3)]">

      {/* Logo & File Menu */}
      <div className="flex items-center gap-4">
        <div className="font-bold text-[#ffd700] text-xl flex items-center gap-2">
          <Swords className="w-6 h-6" />
          <span>GM TOOL V6.6</span>
          
          {autoSaveStatus === 'saving' && (
            <div className="flex items-center gap-1.5 ml-2 text-xs text-[#8257e5] font-semibold animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="opacity-80">Salvando...</span>
            </div>
          )}
          {autoSaveStatus === 'success' && (
            <div className="flex items-center gap-1.5 ml-2 text-xs text-green-400 font-semibold animate-in fade-in slide-in-from-left-2 duration-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="opacity-80">Salvo!</span>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input h-9 px-4 py-2 bg-transparent border-none font-bold text-[#e1e1e6] hover:bg-white/5 hover:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Arquivo
              <ChevronDown className="w-4 h-4 ml-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#202024] border-[#323238] text-[#e1e1e6]">
            <DropdownMenuItem 
              onClick={handleNew} 
              disabled={autoSaveSlot !== null}
              className="cursor-pointer hover:bg-[#8257e5] hover:text-white focus:bg-[#8257e5] focus:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title={autoSaveSlot !== null ? 'Desative o Auto-Save para criar um mapa novo' : ''}
            >
              <FilePlus2 className="w-4 h-4 mr-2" /> Novo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLoad} className="cursor-pointer hover:bg-[#8257e5] hover:text-white focus:bg-[#8257e5] focus:text-white">
              <FolderOpen className="w-4 h-4 mr-2" /> Carregar Salvamento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSave} className="cursor-pointer hover:bg-[#8257e5] hover:text-white focus:bg-[#8257e5] focus:text-white">
              <Download className="w-4 h-4 mr-2" /> Salvar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Token Roster */}
      <div className="flex-1 px-5 mx-5 border-x border-[#323238] h-full flex items-center overflow-x-auto gap-3">
        {tokens.map(t => {
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
                  window.dispatchEvent(new CustomEvent('panTo', { detail: { x: t.x, y: t.y } }));
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setTokenContextMenu({ id: t.id, x: e.clientX, y: e.clientY });
              }}
            >
              {t.imageUrl ? (
                <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover pointer-events-none" draggable={false} />
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
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent text-[#a8a8b3] hover:text-white hover:bg-white/5 h-10 px-4 py-2 border-none" title="Ajuda">
              <HelpCircle className="w-5 h-5" />
          </DialogTrigger>
          <DialogContent className="bg-[#202024] border-[#323238] text-[#e1e1e6] sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-[#ffd700] text-xl font-bold flex items-center gap-2">
                <Swords className="w-6 h-6" /> GM Tool v6.6
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm mt-2">
              <p>O GM Tool é uma plataforma de gerenciamento de mesas de RPG projetada para fluidez e imersão.</p>
              
              <div className="space-y-2">
                <h4 className="font-bold text-[#8257e5] uppercase text-xs">Como Começar</h4>
                <ul className="list-disc pl-5 text-[#a8a8b3] space-y-1">
                  <li>Use o menu <strong>Arquivo</strong> para importar um mapa ou salvar o estado atual.</li>
                  <li>Clique em <strong>Novo Token</strong> para criar um personagem ou ameaça. Em seguida, arraste a inicial dele no topo da tela para dentro do mapa.</li>
                  <li>Utilize as ferramentas na base da tela para criar <strong>Zonas</strong> visuais, inserir a <strong>Imagem de Fundo</strong> e movimentar-se pelo mapa (Scroll/Zoom).</li>
                  <li>Gerencie o combate usando o temporizador de urgência, sistema de turnos e rodadas fixados na barra inferior.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[#8257e5] uppercase text-xs">Dicas Úteis</h4>
                <ul className="list-disc pl-5 text-[#a8a8b3] space-y-1">
                  <li><strong>Botão Direito no Token (Mapa):</strong> Remove o token do tabuleiro (sem deletar a ficha).</li>
                  <li><strong>Zonas Poligonais:</strong> Clique para definir vértices e aperte <strong>Enter</strong> para criar a zona.</li>
                  <li><strong>Rodinha do Mouse (Scroll):</strong> Utilize para dar zoom no mapa ou redimensionar a imagem de fundo quando a ferramenta "Imagem" estiver selecionada.</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button onClick={() => setShowTokenCreateModal(true)} variant="outline" className="bg-transparent border-[#323238] text-[#e1e1e6] hover:bg-white/5 font-bold">
          <Plus className="w-4 h-4 mr-2" /> Novo Token
        </Button>
      </div>

    </header>
  );
}
