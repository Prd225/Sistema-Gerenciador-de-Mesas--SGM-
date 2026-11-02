import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTokenStore } from '@/store/useTokenStore';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImageCropper } from '@/components/ui/ImageCropper';
import ConditionManager from '../tokens/ConditionManager';
import { ImagePlus, X, FileSpreadsheet, Palette, Activity } from 'lucide-react';

export default function TokenAppearanceModal() {
  const editingTokenId = useTokenStore((state) => state.editingTokenId);
  const setEditingTokenId = useTokenStore((state) => state.setEditingTokenId);
  const updateToken = useTokenStore((state) => state.updateToken);
  const tokens = useTokenStore((state) => state.tokens);

  const getSheetByTokenId = useModularSheetStore((s) => s.getSheetByTokenId);
  const openSheetForToken = useModularSheetStore((s) => s.openSheetForToken);

  const [tab, setTab] = useState<'visual' | 'conditions'>('visual');
  const [rawImage, setRawImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = editingTokenId
    ? tokens.find((t) => t.id === editingTokenId)
    : null;

  if (!token) return null;

  const linkedSheet = getSheetByTokenId(token.id);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (rawImage) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && setRawImage(null)}>
        <DialogContent className="bg-[#202024] border-[#323238] text-[#e1e1e6] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[#ffd700]">
              Ajustar Avatar do Token
            </DialogTitle>
          </DialogHeader>
          <ImageCropper
            imageSrc={rawImage}
            onConfirm={(croppedDataUrl) => {
              updateToken(token.id, { imageUrl: croppedDataUrl });
              setRawImage(null);
            }}
            onCancel={() => setRawImage(null)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={!!editingTokenId}
      onOpenChange={(open) => {
        if (!open) setEditingTokenId(null);
      }}
    >
      <DialogContent className="bg-[#202024] border-[#323238] text-[#e1e1e6] sm:max-w-[460px] max-h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-6 pb-2 border-b border-[#323238]">
          <DialogTitle className="text-[#ffd700] text-base font-bold">
            Aparência & Condições do Token
          </DialogTitle>

          <div className="inline-flex rounded-md border border-[#323238] bg-[#121214] p-0.5">
            <button
              type="button"
              onClick={() => setTab('visual')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                tab === 'visual'
                  ? 'bg-[#8257e5] text-white'
                  : 'text-[#a8a8b3] hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              Cor e Nome
            </button>
            <button
              type="button"
              onClick={() => setTab('conditions')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                tab === 'conditions'
                  ? 'bg-[#8257e5] text-white'
                  : 'text-[#a8a8b3] hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Condições ({token.conditions?.length || 0})
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {tab === 'visual' ? (
            <>
              {/* Prévia do Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-full border-[3px] flex items-center justify-center font-bold text-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: token.colorFill,
                      borderColor: token.colorBorder,
                      color: token.colorText,
                    }}
                    title="Clique para alterar imagem"
                  >
                    {token.imageUrl ? (
                      <img
                        src={token.imageUrl}
                        alt={token.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      token.name
                    )}
                  </div>
                  {token.imageUrl && (
                    <button
                      type="button"
                      onClick={() => updateToken(token.id, { imageUrl: undefined })}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow"
                      title="Remover imagem"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFile}
                  />
                </div>

                <div className="flex-1 space-y-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 text-xs border-[#323238] bg-[#121214] text-[#e1e1e6] hover:bg-white/10 gap-1.5"
                  >
                    <ImagePlus className="w-3.5 h-3.5 text-[#a78bfa]" />
                    {token.imageUrl ? 'Trocar Imagem' : 'Enviar Imagem'}
                  </Button>
                  <p className="text-[11px] text-[#8d8d99]">
                    Personalize o retrato, sigla e cores exibidas no tabuleiro.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-[#a8a8b3] block mb-1">
                    Nome do Token
                  </label>
                  <Input
                    value={token.fullName}
                    onChange={(e) =>
                      updateToken(token.id, { fullName: e.target.value })
                    }
                    className="bg-[#121214] border-[#323238] h-9 text-[#e1e1e6]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#a8a8b3] block mb-1">
                    Iniciais (Max 4)
                  </label>
                  <Input
                    value={token.name}
                    maxLength={4}
                    onChange={(e) =>
                      updateToken(token.id, {
                        name: e.target.value.toUpperCase(),
                      })
                    }
                    className="bg-[#121214] border-[#323238] h-9 uppercase text-[#e1e1e6]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#a8a8b3] block mb-1.5">
                  Cores do Token
                </label>
                <div className="flex gap-5">
                  <label className="flex flex-col items-center gap-1 cursor-pointer">
                    <input
                      type="color"
                      value={token.colorText}
                      onChange={(e) =>
                        updateToken(token.id, { colorText: e.target.value })
                      }
                      className="w-9 h-9 border-none p-0 cursor-pointer rounded-full overflow-hidden"
                    />
                    <span className="text-[10px] text-[#a8a8b3]">Letra</span>
                  </label>
                  <label className="flex flex-col items-center gap-1 cursor-pointer">
                    <input
                      type="color"
                      value={token.colorBorder}
                      onChange={(e) =>
                        updateToken(token.id, { colorBorder: e.target.value })
                      }
                      className="w-9 h-9 border-none p-0 cursor-pointer rounded-full overflow-hidden"
                    />
                    <span className="text-[10px] text-[#a8a8b3]">Borda</span>
                  </label>
                  <label className="flex flex-col items-center gap-1 cursor-pointer">
                    <input
                      type="color"
                      value={token.colorFill}
                      onChange={(e) =>
                        updateToken(token.id, { colorFill: e.target.value })
                      }
                      className="w-9 h-9 border-none p-0 cursor-pointer rounded-full overflow-hidden"
                    />
                    <span className="text-[10px] text-[#a8a8b3]">Fundo</span>
                  </label>
                </div>
              </div>

              {/* Status da Ficha Modular Vinculada */}
              <div className="rounded-lg border border-[#323238] bg-[#121214] p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase text-[#ffd700]">
                    Ficha Modular
                  </div>
                  <div className="text-xs text-[#a8a8b3] truncate">
                    {linkedSheet
                      ? `Vinculado a: ${linkedSheet.name}`
                      : 'Nenhuma ficha modular vinculada ainda'}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const id = token.id;
                    setEditingTokenId(null);
                    openSheetForToken(id);
                  }}
                  className="h-8 bg-[#8257e5] hover:bg-[#9466ff] text-white text-xs font-bold gap-1.5 shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {linkedSheet ? 'Abrir Ficha' : 'Gerenciar Fichas'}
                </Button>
              </div>
            </>
          ) : (
            <ConditionManager
              conditions={token.conditions || []}
              onUpdate={(conditions) => updateToken(token.id, { conditions })}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

