import { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Palette,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';

interface RulesEditorProps {
  initialValue: string;
  onChange: (html: string) => void;
  isEditing: boolean;
}

const COLORS = [
  '#ffffff',
  '#e55757',
  '#57e569',
  '#57aee5',
  '#e5c557',
  '#8257e5',
];

export default function RulesEditor({
  initialValue,
  onChange,
  isEditing,
}: RulesEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Need to hold internal value to prevent cursor jumps
  const [internalHtml, setInternalHtml] = useState(initialValue);

  useEffect(() => {
    if (editorRef.current && isEditing) {
      if (editorRef.current.innerHTML !== initialValue) {
        editorRef.current.innerHTML = initialValue;
        setInternalHtml(initialValue);
      }
    }
  }, [isEditing, initialValue]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setInternalHtml(html);
      onChange(html);
    }
  };

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  if (!isEditing) {
    return (
      <div
        className="prose prose-invert max-w-none text-sm text-main break-words h-full p-3 overflow-y-auto custom-scrollbar"
        dangerouslySetInnerHTML={{
          __html:
            internalHtml ||
            '<span class="italic text-muted-custom">Sem conteúdo...</span>',
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full border border-subtle rounded bg-app overflow-hidden focus-within:border-brand-purple transition-colors relative">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-0.5 bg-surface-elevated border-b border-subtle shrink-0">
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            exec('bold');
          }}
          className="p-0.5 hover:bg-surface rounded text-muted-custom hover:text-main cursor-pointer"
          title="Negrito"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            exec('italic');
          }}
          className="p-0.5 hover:bg-surface rounded text-muted-custom hover:text-main cursor-pointer"
          title="Itálico"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            exec('underline');
          }}
          className="p-0.5 hover:bg-surface rounded text-muted-custom hover:text-main cursor-pointer"
          title="Sublinhado"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3 bg-border-subtle mx-0.5" />

        {/* Colors */}
        <div className="relative group/color">
          <button
            className="p-0.5 hover:bg-surface rounded text-muted-custom hover:text-main cursor-pointer"
            title="Cor do Texto"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
          <div className="absolute left-0 top-full pt-1 hidden group-hover/color:block z-20">
            <div className="flex bg-surface border border-subtle rounded p-1 gap-1 shadow-lg">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec('foreColor', c);
                  }}
                  className="w-3.5 h-3.5 rounded-full border border-subtle hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="w-px h-3 bg-border-subtle mx-0.5" />

        <button
          onMouseDown={(e) => {
            e.preventDefault();
            exec('insertUnorderedList');
          }}
          className="p-0.5 hover:bg-surface rounded text-muted-custom hover:text-main cursor-pointer"
          title="Lista com Marcadores"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            exec('insertOrderedList');
          }}
          className="p-0.5 hover:bg-surface rounded text-muted-custom hover:text-main cursor-pointer"
          title="Lista Numerada"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3 bg-border-subtle mx-0.5" />

        <button
          onMouseDown={(e) => {
            e.preventDefault();
            exec('justifyLeft');
          }}
          className="p-0.5 hover:bg-surface rounded text-muted-custom hover:text-main cursor-pointer"
          title="Alinhar à Esquerda"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            exec('justifyCenter');
          }}
          className="p-0.5 hover:bg-surface rounded text-muted-custom hover:text-main cursor-pointer"
          title="Centralizar"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            exec('justifyRight');
          }}
          className="p-0.5 hover:bg-surface rounded text-muted-custom hover:text-main cursor-pointer"
          title="Alinhar à Direita"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        className="p-3 flex-1 overflow-y-auto text-sm text-main outline-none custom-scrollbar"
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  );
}
