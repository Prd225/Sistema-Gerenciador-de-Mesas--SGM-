import React, { useRef, useState, useEffect } from 'react';
import type { HandoutItem, HandoutFolder, HandoutTextStyle } from '@/types/inventory';
import { useInventoryStore } from '@/store/useInventoryStore';
import { replaceDiceShortcodesWithHtml, toggleDiceFormulaSelection } from '@/lib/diceEmoji';
import {
  X,
  Scroll,
  Stamp,
  Moon,
  FileText,
  Save,
  Eye,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Palette,
  Highlighter,
  Minus,
  Sigma,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextDocumentModalProps {
  initialItem?: HandoutItem | null;
  folders: HandoutFolder[];
  onClose: () => void;
}

const TEXT_COLORS = [
  '#e1e1e6',
  '#8257e5',
  '#04d361',
  '#fd951f',
  '#eb28dc',
  '#ff4d4d',
  '#4d94ff',
  '#e6e600',
  '#2c1d11',
  '#ffffff',
];

const HIGHLIGHT_COLORS = [
  '#fef08a', // Amarelo suave
  '#bbf7d0', // Verde suave
  '#bfdbfe', // Azul suave
  '#fbcfe8', // Rosa suave
  '#fed7aa', // Laranja suave
  '#e9d5ff', // Roxo suave
  'transparent', // Sem realce
];

export default function TextDocumentModal({
  initialItem,
  folders,
  onClose,
}: TextDocumentModalProps) {
  const createTextDocument = useInventoryStore((state) => state.createTextDocument);
  const updateItem = useInventoryStore((state) => state.updateItem);
  const activeFolderId = useInventoryStore((state) => state.activeFolderId);

  const [title, setTitle] = useState(initialItem?.title || '');
  const [contentHtml, setContentHtml] = useState(initialItem?.textContent || '');
  const [style, setStyle] = useState<HandoutTextStyle>(
    initialItem?.textStyle || 'parchment',
  );
  const [folderId, setFolderId] = useState<string | null>(
    initialItem
      ? initialItem.folderId
      : activeFolderId?.startsWith('__')
        ? null
        : activeFolderId,
  );
  const [isPreview, setIsPreview] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const [listState, setListState] = useState<'none' | 'ul' | 'ol'>('none');
  const [alignState, setAlignState] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  // Inicializa o editor com o conteúdo
  useEffect(() => {
    if (editorRef.current && !isPreview) {
      if (editorRef.current.innerHTML !== contentHtml) {
        editorRef.current.innerHTML = contentHtml || '';
      }
    }
  }, [isPreview]);

  const updateToolbarStates = () => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !editorRef.current.contains(sel.anchorNode)) return;

    const isUl = document.queryCommandState('insertUnorderedList');
    const isOl = document.queryCommandState('insertOrderedList');
    setListState(isUl ? 'ul' : isOl ? 'ol' : 'none');

    const isCenter = document.queryCommandState('justifyCenter');
    const isRight = document.queryCommandState('justifyRight');
    const isJustify = document.queryCommandState('justifyFull');
    setAlignState(
      isCenter ? 'center' : isRight ? 'right' : isJustify ? 'justify' : 'left',
    );
  };

  const handleInput = () => {
    if (editorRef.current) {
      setContentHtml(editorRef.current.innerHTML);
      updateToolbarStates();
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const execBlock = (tag: string) => {
    document.execCommand('formatBlock', false, tag);
    editorRef.current?.focus();
    handleInput();
  };

  const handleCycleList = () => {
    const isUl = document.queryCommandState('insertUnorderedList');
    const isOl = document.queryCommandState('insertOrderedList');

    if (!isUl && !isOl) {
      exec('insertUnorderedList');
      setListState('ul');
    } else if (isUl) {
      exec('insertOrderedList');
      setListState('ol');
    } else {
      exec('insertOrderedList');
      setListState('none');
    }
  };

  const handleCycleAlign = () => {
    if (alignState === 'left') {
      exec('justifyCenter');
      setAlignState('center');
    } else if (alignState === 'center') {
      exec('justifyRight');
      setAlignState('right');
    } else if (alignState === 'right') {
      exec('justifyFull');
      setAlignState('justify');
    } else {
      exec('justifyLeft');
      setAlignState('left');
    }
  };

  const handleToggleFormula = () => {
    if (editorRef.current) {
      toggleDiceFormulaSelection(editorRef.current);
      editorRef.current.focus();
      handleInput();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalContent = editorRef.current?.innerHTML || contentHtml;
    if (!title.trim() && !finalContent.trim()) return;

    if (initialItem) {
      await updateItem(initialItem.id, {
        title: title.trim() || 'Documento sem título',
        textContent: finalContent,
        textStyle: style,
        folderId,
      });
    } else {
      await createTextDocument(
        title.trim() || 'Novo Documento',
        finalContent,
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
        return 'bg-[#0f0c1b] text-[#d4c6f5] font-serif border-[#3b2d60] shadow-lg';
      case 'modern':
      default:
        return 'bg-[#18181b] text-[#f4f4f5] font-sans border-[#27272a]';
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-3xl bg-[#18181b] border border-[#27272a] rounded-xl shadow-xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#27272a] bg-[#121214]">
          <div className="flex items-center gap-2">
            <Scroll className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">
              {initialItem ? 'Editar Documento' : 'Novo Documento'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!isPreview && editorRef.current) {
                  setContentHtml(editorRef.current.innerHTML);
                }
                setIsPreview(!isPreview);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                isPreview
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-[#27272a] text-[#a1a1aa] hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isPreview ? 'Voltar ao Editor' : 'Pré-visualizar'}</span>
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
        <form onSubmit={handleSave} className="flex-1 flex flex-col p-4 sm:p-5 gap-3.5 overflow-y-auto">
          {/* Título & Pasta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-xs font-medium text-[#a1a1aa]">
                Título
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Carta do Conde, Pista do Culto, Diário..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#121214] border border-[#3f3f46] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#71717a] outline-none focus:border-[#8257e5] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#a1a1aa]">
                Pasta
              </label>
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value || null)}
                className="w-full bg-[#121214] border border-[#3f3f46] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#8257e5] transition-all cursor-pointer"
              >
                <option value="">Início</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seletor de Tema Estético */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#a1a1aa]">
              Estilo Visual
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'parchment', label: 'Pergaminho', icon: Scroll },
                  { id: 'official', label: 'Oficial', icon: Stamp },
                  { id: 'dark-scroll', label: 'Grimório', icon: Moon },
                  { id: 'modern', label: 'Moderno', icon: FileText },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setStyle(t.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                      style === t.id
                        ? 'bg-[#8257e5]/20 border-[#8257e5] text-purple-200 shadow-sm'
                        : 'bg-[#121214] border-[#27272a] text-[#71717a] hover:bg-[#202024] hover:text-[#d4d4d8]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {!isPreview ? (
            /* Editor de Texto Rico */
            <div className="flex-1 flex flex-col gap-1.5 min-h-[280px]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#a1a1aa]">
                  Conteúdo
                </label>
              </div>

              {/* Barra de Ferramentas Rica */}
              <div className="flex items-center gap-1 p-1 bg-[#202024] border border-[#323238] rounded-t-lg flex-wrap">
                {/* Estilos em Linha */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec('bold');
                  }}
                  className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white"
                  title="Negrito"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec('italic');
                  }}
                  className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white"
                  title="Itálico"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec('underline');
                  }}
                  className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white"
                  title="Sublinhado"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec('strikeThrough');
                  }}
                  className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white"
                  title="Tachado"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-[#323238] mx-0.5 shrink-0" />

                {/* Títulos */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execBlock('H1');
                  }}
                  className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white"
                  title="Título 1"
                >
                  <Heading1 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execBlock('H2');
                  }}
                  className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white"
                  title="Título 2"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-[#323238] mx-0.5 shrink-0" />

                {/* Alinhamento */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCycleAlign();
                  }}
                  className={`p-1 rounded transition-colors ${
                    alignState !== 'left'
                      ? 'bg-[#8257e5]/20 text-[#a78bfa] border border-[#8257e5]/40'
                      : 'hover:bg-[#323238] text-[#a8a8b3] hover:text-white'
                  }`}
                  title="Alinhamento"
                >
                  {alignState === 'center' ? (
                    <AlignCenter className="w-3.5 h-3.5" />
                  ) : alignState === 'right' ? (
                    <AlignRight className="w-3.5 h-3.5" />
                  ) : alignState === 'justify' ? (
                    <AlignJustify className="w-3.5 h-3.5" />
                  ) : (
                    <AlignLeft className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Listas */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCycleList();
                  }}
                  className={`p-1 rounded transition-colors ${
                    listState !== 'none'
                      ? 'bg-[#8257e5]/20 text-[#a78bfa] border border-[#8257e5]/40'
                      : 'hover:bg-[#323238] text-[#a8a8b3] hover:text-white'
                  }`}
                  title="Marcadores"
                >
                  {listState === 'ol' ? (
                    <ListOrdered className="w-3.5 h-3.5" />
                  ) : (
                    <List className="w-3.5 h-3.5" />
                  )}
                </button>

                <div className="w-px h-4 bg-[#323238] mx-0.5 shrink-0" />

                {/* Cor do Texto */}
                <div className="relative group/color shrink-0">
                  <button
                    type="button"
                    className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white flex items-center gap-1"
                    title="Cor do texto"
                  >
                    <Palette className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute left-0 top-full pt-1 hidden group-hover/color:block z-30">
                    <div className="grid grid-cols-5 bg-[#121214] border border-[#323238] rounded p-1.5 gap-1.5 w-max shadow-xl">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            exec('foreColor', c);
                          }}
                          className="w-4 h-4 rounded-full border border-[#323238] hover:scale-125 transition-transform"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Marca-texto */}
                <div className="relative group/bg shrink-0">
                  <button
                    type="button"
                    className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white flex items-center gap-1"
                    title="Marca-texto"
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute left-0 top-full pt-1 hidden group-hover/bg:block z-30">
                    <div className="grid grid-cols-4 bg-[#121214] border border-[#323238] rounded p-1.5 gap-1.5 w-max shadow-xl">
                      {HIGHLIGHT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            exec('hiliteColor', c);
                          }}
                          className={`w-4 h-4 rounded border transition-transform ${
                            c === 'transparent'
                              ? 'border-red-400 bg-black/40 text-[8px] text-red-400 flex items-center justify-center'
                              : 'border-[#323238] hover:scale-125'
                          }`}
                          style={{ backgroundColor: c }}
                          title={c === 'transparent' ? 'Limpar Realce' : undefined}
                        >
                          {c === 'transparent' ? '✕' : null}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Divisor Horizontal */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec('insertHorizontalRule');
                  }}
                  className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white"
                  title="Linha divisória"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-[#323238] mx-0.5 shrink-0" />

                {/* Expressão de Dados RPG */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleToggleFormula();
                  }}
                  className="p-1 hover:bg-[#8257e5]/20 hover:text-[#a78bfa] rounded text-[#a8a8b3] hover:border hover:border-[#8257e5]/40 transition-colors shrink-0"
                  title="Fórmula de dados"
                >
                  <Sigma className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>

              {/* Área ContentEditable */}
              <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onBlur={handleInput}
                onKeyUp={updateToolbarStates}
                onMouseUp={updateToolbarStates}
                className={`p-4 rounded-b-lg border border-t-0 min-h-[220px] max-h-[45vh] overflow-y-auto outline-none transition-colors whitespace-pre-wrap break-words leading-relaxed text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-1.5 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-1 [&_hr]:my-2.5 [&_hr]:border-current/25 ${getStyleClasses()}`}
                data-placeholder="Digite o texto da carta, enigma ou documento aqui..."
              />
            </div>
          ) : (
            /* Modo Pré-visualização */
            <div className="flex-1 flex flex-col gap-2 min-h-[280px]">
              <span className="text-[11px] text-[#71717a] font-medium uppercase tracking-wider">
                Prévia com Fórmulas e Estilo Ativo:
              </span>
              <div
                className={`p-6 rounded-xl border min-h-[240px] max-h-[48vh] overflow-y-auto flex flex-col gap-3 transition-all ${getStyleClasses()}`}
              >
                <h2 className="text-lg font-bold border-b border-current/20 pb-2">
                  {title || 'Título do Documento'}
                </h2>
                <div
                  className="leading-relaxed text-sm break-words [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-1.5 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-1 [&_hr]:my-2.5 [&_hr]:border-current/25 whitespace-pre-wrap font-serif"
                  dangerouslySetInnerHTML={{
                    __html: replaceDiceShortcodesWithHtml(contentHtml || 'Nenhum texto redigido ainda...'),
                  }}
                />
              </div>
            </div>
          )}

          {/* Rodapé com Botões de Ação */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a] mt-auto">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={onClose}
              className="bg-[#202024] border-[#323238] hover:bg-white/10 text-[#d4d4d8] text-xs h-7 px-3"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="xs"
              className="bg-[#8257e5] hover:bg-[#9466ff] text-white text-xs h-7 px-3 gap-1.5 shadow-md font-medium"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Documento</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
