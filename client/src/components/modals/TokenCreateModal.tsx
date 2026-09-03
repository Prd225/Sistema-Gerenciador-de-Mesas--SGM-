import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTokenStore } from '@/store/useTokenStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react';
import { ImageCropper } from '@/components/ui/ImageCropper';
import type { Token, TokenStats } from '@/types/game';
import { generateId } from '@/lib/uuid';

function getDefaultStats(typeId: string): TokenStats {
  if (typeId === 'threat_realidade') {
    return {
      type: 'threat',
      threatType: 'realidade',
      system: 'san',
      pv: 50,
      maxPv: 50,
      pe: 0,
      maxPe: 0,
      san: 0,
      maxSan: 0,
      pd: 0,
      maxPd: 0,
      agi: 1,
      for: 1,
      int: 1,
      pre: 1,
      vig: 1,
      def: 10,
      bloq: 0,
      esq: 0,
      size: 'Médio',
      speed: '9m',
      elements: [],
      senses: [],
      resistances: [],
      vulnerabilities: [],
      abilities: [],
      actions: [],
      presDt: 0,
      presDano: '',
      presNex: 0,
      enigma: '',
    };
  }
  if (typeId === 'threat_paranormal') {
    return {
      type: 'threat',
      threatType: 'paranormal',
      system: 'san',
      pv: 50,
      maxPv: 50,
      pe: 0,
      maxPe: 0,
      san: 0,
      maxSan: 0,
      pd: 0,
      maxPd: 0,
      agi: 1,
      for: 1,
      int: 1,
      pre: 1,
      vig: 1,
      def: 10,
      bloq: 0,
      esq: 0,
      size: 'Médio',
      speed: '9m',
      elements: [],
      senses: [],
      resistances: [],
      vulnerabilities: [],
      abilities: [],
      actions: [],
      presDt: 0,
      presDano: '',
      presNex: 0,
      enigma: '',
    };
  }
  if (typeId === 'player_det') {
    return {
      type: 'player',
      system: 'det',
      pv: 10,
      maxPv: 10,
      pe: 0,
      maxPe: 0,
      san: 0,
      maxSan: 0,
      pd: 5,
      maxPd: 5,
      agi: 1,
      for: 1,
      int: 1,
      pre: 1,
      vig: 1,
      def: 10,
      bloq: 0,
      esq: 0,
    };
  }
  return {
    type: 'player',
    system: 'san',
    pv: 10,
    maxPv: 10,
    pe: 5,
    maxPe: 5,
    san: 10,
    maxSan: 10,
    pd: 5,
    maxPd: 5,
    agi: 1,
    for: 1,
    int: 1,
    pre: 1,
    vig: 1,
    def: 10,
    bloq: 0,
    esq: 0,
  };
}

export default function TokenCreateModal() {
  const showTokenCreateModal = useTokenStore(
    (state) => state.showTokenCreateModal,
  );
  const setShowTokenCreateModal = useTokenStore(
    (state) => state.setShowTokenCreateModal,
  );
  const addToken = useTokenStore((state) => state.addToken);

  const [name, setName] = useState('');
  const [initials, setInitials] = useState('');
  const [sheetType, setSheetType] = useState<string>('player_san');
  const [colorText, setColorText] = useState('#ffffff');
  const [colorBorder, setColorBorder] = useState('#ffffff');
  const [colorFill, setColorFill] = useState('#8257e5');

  const [rawImage, setRawImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          setRawImage(ev.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    const fullName = name.trim() || 'Token';
    const tokenInitials =
      initials.trim().substring(0, 4).toUpperCase() ||
      fullName.substring(0, 2).toUpperCase();

    const newToken: Token = {
      id: generateId(),
      name: tokenInitials,
      fullName: fullName,
      colorText,
      colorBorder,
      colorFill,
      x: null, // NOT on map — matches source of truth
      y: null,
      imageUrl: croppedImage || undefined,
      desc: '',
      conditions: [],
      stats: getDefaultStats(sheetType),
    };

    addToken(newToken);
    setShowTokenCreateModal(false);

    // reset
    setName('');
    setInitials('');
    setSheetType('player_san');
    setColorText('#ffffff');
    setColorBorder('#ffffff');
    setColorFill('#8257e5');
    setCroppedImage(null);
    setRawImage(null);
  };

  if (rawImage) {
    return (
      <Dialog
        open={showTokenCreateModal}
        onOpenChange={(open) => !open && setShowTokenCreateModal(false)}
      >
        <DialogContent className="bg-surface border border-subtle text-main sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-brand-gold font-bold">
              Ajustar Imagem
            </DialogTitle>
          </DialogHeader>
          <ImageCropper
            imageSrc={rawImage}
            onConfirm={(base64) => {
              setCroppedImage(base64);
              setRawImage(null);
            }}
            onCancel={() => setRawImage(null)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={showTokenCreateModal} onOpenChange={setShowTokenCreateModal}>
      <DialogContent className="bg-surface border border-subtle text-main sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle className="text-brand-gold font-bold">
            Criar Novo Token
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Imagem do Token */}
          <div className="flex justify-center">
            <div className="relative group w-24 h-24 rounded-full border-2 border-dashed border-subtle flex items-center justify-center overflow-hidden hover:border-brand-purple transition-colors cursor-pointer bg-app">
              {croppedImage ? (
                <>
                  <img
                    src={croppedImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setCroppedImage(null);
                    }}
                  >
                    <X className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    title="Adicionar Imagem"
                  />
                  <div className="flex flex-col items-center text-muted-custom group-hover:text-brand-purple pointer-events-none">
                    <ImagePlus className="w-6 h-6 mb-1" />
                    <span className="text-[10px]">Imagem</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-custom block mb-1">
              Nome do Personagem
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Gandalf"
              className="bg-app border-subtle h-9 text-main focus:border-brand-purple"
            />
          </div>
          <div>
            <label className="text-xs text-muted-custom block mb-1">
              Iniciais (Max 4)
            </label>
            <Input
              value={initials}
              onChange={(e) => setInitials(e.target.value)}
              maxLength={4}
              placeholder="GAN"
              className="bg-app border-subtle h-9 uppercase text-main focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-xs text-muted-custom block mb-1">
              Tipo de Ficha
            </label>
            <Select
              value={sheetType}
              onValueChange={(val) => setSheetType(val as string)}
            >
              <SelectTrigger className="bg-app border-subtle text-main h-9 cursor-pointer">
                <SelectValue>
                  {
                    {
                      player_san: 'Investigador (Padrão)',
                      player_det: 'Investigador (SaH)',
                      threat_realidade: 'Ameaça da Realidade',
                      threat_paranormal: 'Ameaça Paranormal',
                    }[sheetType]
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-surface-elevated border-subtle text-main">
                <SelectItem value="player_san" className="cursor-pointer">
                  Investigador (Padrão)
                </SelectItem>
                <SelectItem value="player_det" className="cursor-pointer">
                  Investigador (SaH)
                </SelectItem>
                <SelectItem value="threat_realidade" className="cursor-pointer">
                  Ameaça da Realidade
                </SelectItem>
                <SelectItem
                  value="threat_paranormal"
                  className="cursor-pointer"
                >
                  Ameaça Paranormal
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-custom block mb-1">
              Cores
            </label>
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1">
                <input
                  type="color"
                  value={colorText}
                  onChange={(e) => setColorText(e.target.value)}
                  className="w-10 h-10 border-none p-0 cursor-pointer rounded-full overflow-hidden"
                />
                <span className="text-[10px] text-muted-custom">Letra</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <input
                  type="color"
                  value={colorBorder}
                  onChange={(e) => setColorBorder(e.target.value)}
                  className="w-10 h-10 border-none p-0 cursor-pointer rounded-full overflow-hidden"
                />
                <span className="text-[10px] text-muted-custom">Borda</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <input
                  type="color"
                  value={colorFill}
                  onChange={(e) => setColorFill(e.target.value)}
                  className="w-10 h-10 border-none p-0 cursor-pointer rounded-full overflow-hidden"
                />
                <span className="text-[10px] text-muted-custom">Fundo</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => setShowTokenCreateModal(false)}
            className="border-subtle bg-transparent text-main hover:bg-surface-elevated cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-brand-purple hover:bg-brand-purple-hover text-white cursor-pointer"
          >
            Salvar Token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
