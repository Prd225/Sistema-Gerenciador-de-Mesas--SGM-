import React, { useRef, useState, useEffect } from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { 
  ArrowLeft, Bold, Italic, Underline, Strikethrough, 
  Heading1, Heading2, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Palette, Highlighter, Minus
} from 'lucide-react';


interface NoteEditorFullscreenProps {
  pageId: string;
  noteId: string;
  onBack: () => void;
}

const COLORS = [
  '#e1e1e6', '#8257e5', '#04d361', '#fd951f', '#eb28dc', '#ff4d4d', '#4d94ff', '#e6e600'
];

export default function NoteEditorFullscreen({ pageId, noteId, onBack }: NoteEditorFullscreenProps) {
  const page = useNotesStore(state => state.pages.find(p => p.id === pageId));
  const note = page?.notes.find(n => n.id === noteId);
  const updateNote = useNotesStore(state => state.updateNote);

  const editorRef = useRef<HTMLDivElement>(null);
  const [titleValue, setTitleValue] = useState(note?.title || '');
  const [charCount, setCharCount] = useState(0);
  const maxLength = 20000;

  useEffect(() => {
    if (editorRef.current && note && editorRef.current.innerHTML !== note.content) {
      editorRef.current.innerHTML = note.content || '';
      setCharCount(editorRef.current.innerText.length);
    }
  }, [noteId]);

  if (!note) return null;

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

  const handleInput = () => {
    if (editorRef.current) {
      setCharCount(editorRef.current.innerText.length);
      updateNote(pageId, noteId, { content: editorRef.current.innerHTML });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
  };

  const handleTitleBlur = () => {
    updateNote(pageId, noteId, { title: titleValue });
  };

  const handleColorChange = (color: string) => {
    updateNote(pageId, noteId, { color });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const allowedKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Tab', 'Home', 'End'
    ];
    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (charCount >= maxLength) e.preventDefault();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (!editorRef.current) return;
    const text = e.clipboardData.getData('text/plain');
    const remaining = maxLength - charCount;
    if (remaining > 0) {
      document.execCommand('insertText', false, text.slice(0, remaining));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] absolute inset-0 z-10 animate-in slide-in-from-bottom-2 duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#323238] bg-[#1a1a1e]">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-[#323238] rounded-full text-[#a8a8b3] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={titleValue}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            placeholder="Título da Anotação"
            className="bg-transparent border-none outline-none text-xl font-bold text-[#e1e1e6] placeholder-[#a8a8b3] w-full max-w-md focus:border-b focus:border-[#8257e5] px-1 transition-colors"
          />
        </div>
        
        {/* Label Color selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#a8a8b3] font-semibold uppercase mr-1">Cor do Card:</span>
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => handleColorChange(c)}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${note.color === c ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'border-transparent hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-[#202024] border-b border-[#323238] overflow-x-auto custom-scrollbar flex-wrap">
        {/* Inline styles */}
        <button onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white" title="Negrito"><Bold className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white" title="Itálico"><Italic className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('underline'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white" title="Sublinhado"><Underline className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('strikeThrough'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white" title="Riscado"><Strikethrough className="w-4 h-4" /></button>
        
        <div className="w-px h-5 bg-[#323238] mx-1" />
        
        {/* Headings */}
        <button onMouseDown={(e) => { e.preventDefault(); execBlock('H1'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white" title="Título 1"><Heading1 className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execBlock('H2'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white" title="Título 2"><Heading2 className="w-4 h-4" /></button>
        
        <div className="w-px h-5 bg-[#323238] mx-1" />

        {/* Alignment */}
        <button onMouseDown={(e) => { e.preventDefault(); exec('justifyLeft'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white" title="Alinhar à Esquerda"><AlignLeft className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('justifyCenter'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white" title="Centralizar"><AlignCenter className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('justifyRight'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white" title="Alinhar à Direita"><AlignRight className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('justifyFull'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white" title="Justificar"><AlignJustify className="w-4 h-4" /></button>

        <div className="w-px h-5 bg-[#323238] mx-1" />

        {/* Lists */}
        <button onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white" title="Lista"><List className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white" title="Lista Numerada"><ListOrdered className="w-4 h-4" /></button>

        <div className="w-px h-5 bg-[#323238] mx-1" />

        {/* Colors */}
        <div className="relative group/color">
          <button className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white flex items-center gap-1" title="Cor do Texto">
            <Palette className="w-4 h-4" />
          </button>
          <div className="absolute left-0 top-full pt-1 hidden group-hover/color:block z-10">
            <div className="flex bg-[#121214] border border-[#323238] rounded p-1.5 gap-1.5">
              {COLORS.map(c => (
                <button
                  key={c}
                  onMouseDown={(e) => { e.preventDefault(); exec('foreColor', c); }}
                  className="w-5 h-5 rounded-full border border-[#323238] hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative group/bg">
          <button className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white flex items-center gap-1" title="Cor de Fundo (Highlight)">
            <Highlighter className="w-4 h-4" />
          </button>
          <div className="absolute left-0 top-full pt-1 hidden group-hover/bg:block z-10">
            <div className="flex bg-[#121214] border border-[#323238] rounded p-1.5 gap-1.5">
              {['transparent', ...COLORS].map(c => (
                <button
                  key={c}
                  onMouseDown={(e) => { e.preventDefault(); exec('hiliteColor', c === 'transparent' ? 'inherit' : c); }}
                  className={`w-5 h-5 rounded-full border hover:scale-110 transition-transform ${c === 'transparent' ? 'border-[#a8a8b3] relative overflow-hidden' : 'border-[#323238]'}`}
                  style={{ backgroundColor: c === 'transparent' ? '#121214' : c }}
                >
                  {c === 'transparent' && <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-px bg-red-500 rotate-45" /></div>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-px h-5 bg-[#323238] mx-1" />

        {/* Utils */}
        <button onMouseDown={(e) => { e.preventDefault(); exec('insertHorizontalRule'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white" title="Linha Horizontal"><Minus className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); }} className="p-1.5 hover:bg-[#323238] rounded text-red-400 hover:text-red-300 ml-auto font-semibold text-xs tracking-wider" title="Remover Formatação">LIMPAR</button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden relative">
        <div 
          ref={editorRef}
          className="w-full h-full p-6 sm:p-10 outline-none text-[#e1e1e6] text-base leading-relaxed overflow-y-auto custom-scrollbar editor-content"
          contentEditable
          onInput={handleInput}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          style={{ whiteSpace: 'pre-wrap' }}
          suppressContentEditableWarning
        />
        
        {charCount === 0 && (
          <div className="absolute top-6 left-6 sm:top-10 sm:left-10 text-[#a8a8b3] pointer-events-none italic">
            Comece a digitar sua anotação...
          </div>
        )}

        <div className="absolute bottom-2 right-4 text-xs font-semibold text-[#737380] pointer-events-none bg-[#121214] px-1">
          {charCount} / {maxLength}
        </div>
      </div>
    </div>
  );
}
