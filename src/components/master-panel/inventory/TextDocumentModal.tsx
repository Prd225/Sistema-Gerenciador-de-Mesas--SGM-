import React, { useState } from 'react';
import type { HandoutItem, HandoutFolder, HandoutTextStyle } from '@/types/inventory';
import { useInventoryStore } from '@/store/useInventoryStore';
import {
  X,
  FileText,
  Scroll,
  Stamp,
  Moon,
  Save,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextDocumentModalProps {
  initialItem?: HandoutItem | null;
  folders: HandoutFolder[];
  onClose: () => void;
}

export default function TextDocumentModal({
  initialItem,
  folders,
  onClose,
}: TextDocumentModalProps) {
  const createTextDocument = useInventoryStore(
    (state) => state.createTextDocument,
  );
  const updateItem = useInventoryStore((state) => state.updateItem);
  const activeFolderId = useInventoryStore((state) => state.activeFolderId);

  const [title, setTitle] = useState(initialItem?.title || '');
  const [content, setContent] = useState(initialItem?.textContent || '');
  const [style, setStyle] = useState<HandoutTextStyle>(
    initialItem?.textStyle || 'parchment',
  );
  const [folderId, setFolderId] = useState<string | null>(
    initialItem ? initialItem.folderId : activeFolderId?.startsWith('__') ? null : activeFolderId,
  );
  const [isPreview, setIsPreview] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    if (initialItem) {
      await updateItem(initialItem.id, {
        title: title.trim() || 'Documento sem título',
        textContent: content,
        textStyle: style,
        folderId,
      });
    } else {
      await createTextDocument(
        title.trim() || 'Novo Documento',
        content,
        style,
        folderId,
      );
    }
    onClose();
  };

  const getStyleClasses = () => {
    switch (style) {
      case 'parchment':
        return 'bg-[#d8c39d] text-[#2c1d11] font-serif border-[#b89f76] shadow-inner selection:bg-amber-800/30';
      case 'official':
        return 'bg-[#f4f4f5] text-[#18181b] font-sans border-[#e4e4e7] shadow-lg selection:bg-blue-600/20';
      case 'dark-scroll':
        return 'bg-[#0f0c1b] text-[#d4c6f5] font-serif border-[#3b2d60] shadow-2xl shadow-purple-950/50';
      case 'modern':
      default:
        return 'bg-[#18181b] text-[#f4f4f5] font-sans border-[#27272a]';
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#18181b] border border-[#323238] rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#27272a] bg-[#121214]">
          <div className="flex items-center gap-2">
            <Scroll className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">
              {initialItem ? 'Editar Documento / Carta' : 'Criar Novo Documento de Texto'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                isPreview
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-[#27272a] text-[#a1a1aa] hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isPreview ? 'Voltar a Editar' : 'Pré-visualizar'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-[#a1a1aa] hover:text-white rounded-md hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Formulário / Conteúdo */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col p-5 gap-4 overflow-y-auto">
          {!isPreview ? (
            <>
              {/* Título & Pasta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#a1a1aa]">
                    Título do Documento
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carta Manuscrita do Conde, O Testamento..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#121214] border border-[#3f3f46] rounded-lg px-3 py-2 text-sm text-white placeholder-[#71717a] outline-none focus:border-[#8257e5] transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#a1a1aa]">
                    Guardar na Pasta
                  </label>
                  <select
                    value={folderId || ''}
                    onChange={(e) => setFolderId(e.target.value || null)}
                    className="w-full bg-[#121214] border border-[#3f3f46] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#8257e5] transition-all"
                  >
                    <option value="">(Raiz / Sem Pasta)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seletor de Tema Estético */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#a1a1aa]">
                  Tema Estético de Exibição
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'parchment', label: 'Pergaminho Antigo', icon: Scroll },
                      { id: 'official', label: 'Documento Oficial', icon: Stamp },
                      { id: 'dark-scroll', label: 'Grimório / Culto', icon: Moon },
                      { id: 'modern', label: 'Moderno / Neutro', icon: FileText },
                    ] as const
                  ).map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setStyle(t.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                          style === t.id
                            ? 'bg-[#8257e5]/20 border-[#8257e5] text-purple-200 shadow-md'
                            : 'bg-[#121214] border-[#27272a] text-[#71717a] hover:bg-[#202024] hover:text-[#d4d4d8]'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-medium">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Área de Texto */}
              <div className="flex-1 flex flex-col gap-1.5 min-h-[200px]">
                <label className="text-xs font-medium text-[#a1a1aa]">
                  Conteúdo do Documento (suporta quebras de linha e texto livre)
                </label>
                <textarea
                  rows={8}
                  placeholder="Escreva a carta, pista ou relato aqui..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 w-full bg-[#121214] border border-[#3f3f46] rounded-lg p-3 text-sm text-white placeholder-[#71717a] outline-none focus:border-[#8257e5] resize-none leading-relaxed transition-all font-sans"
                />
              </div>
            </>
          ) : (
            /* Pré-visualização com o Tema Selecionado */
            <div className="flex flex-col gap-3">
              <span className="text-xs text-[#71717a] font-medium uppercase tracking-wider">
                Como os jogadores verão:
              </span>
              <div
                className={`p-6 rounded-xl border min-h-[300px] flex flex-col gap-4 transition-all ${getStyleClasses()}`}
              >
                <h2 className="text-lg font-bold border-b border-current/20 pb-2">
                  {title || 'Título do Documento'}
                </h2>
                <div className="whitespace-pre-wrap leading-relaxed text-sm">
                  {content || 'Nenhum texto redigido ainda...'}
                </div>
              </div>
            </div>
          )}

          {/* Rodapé com Botões */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a] mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-[#27272a] border-[#3f3f46] hover:bg-white/10 text-[#d4d4d8]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#8257e5] hover:bg-[#9466ff] text-white gap-1.5 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Documento</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
