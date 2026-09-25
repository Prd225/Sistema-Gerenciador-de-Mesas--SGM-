import { useEffect, useRef, useState } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';
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
  Sigma,
} from 'lucide-react';
import {
  replaceDiceShortcodesWithHtml,
  toggleDiceFormulaSelection,
} from '@/lib/diceEmoji';

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
  const [listState, setListState] = useState<'none' | 'ul' | 'ol'>('none');
  const [alignState, setAlignState] = useState<'left' | 'center' | 'right'>(
    'left',
  );

  useEffect(() => {
    if (editorRef.current && isEditing) {
      if (editorRef.current.innerHTML !== initialValue) {
        editorRef.current.innerHTML = initialValue;
        setInternalHtml(initialValue);
      }
    }
  }, [isEditing, initialValue]);

  const updateToolbarStates = () => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !editorRef.current.contains(sel.anchorNode))
      return;

    const isUl = document.queryCommandState('insertUnorderedList');
    const isOl = document.queryCommandState('insertOrderedList');
    setListState(isUl ? 'ul' : isOl ? 'ol' : 'none');

    const isCenter = document.queryCommandState('justifyCenter');
    const isRight = document.queryCommandState('justifyRight');
    setAlignState(isCenter ? 'center' : isRight ? 'right' : 'left');
  };

  useEffect(() => {
    if (!isEditing) return;
    const handleSelectionChange = () => {
      updateToolbarStates();
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [isEditing]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setInternalHtml(html);
      onChange(html);
      updateToolbarStates();
    }
  };

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
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
    const isCenter = document.queryCommandState('justifyCenter');
    const isRight = document.queryCommandState('justifyRight');
    const current = isCenter ? 'center' : isRight ? 'right' : 'left';

    if (current === 'left') {
      exec('justifyCenter');
      setAlignState('center');
    } else if (current === 'center') {
      exec('justifyRight');
      setAlignState('right');
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

  if (!isEditing) {
    const renderedHtml = internalHtml
      ? replaceDiceShortcodesWithHtml(internalHtml)
      : '<span class="italic text-gray-500">Sem conteúdo...</span>';

    return (
      <div
        className="prose prose-invert max-w-none text-sm leading-relaxed text-gray-300 break-words h-full p-3.5 overflow-y-auto custom-scrollbar"
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(renderedHtml),
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full border border-[#323238] rounded bg-[#121214] overflow-hidden focus-within:border-[#8257e5] transition-colors relative">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1 bg-[#202024] border-b border-[#323238] shrink-0">
        <button
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
          onMouseDown={(e) => {
            e.preventDefault();
            exec('underline');
          }}
          className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white"
          title="Sublinhado"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3 bg-[#323238] mx-0.5" />

        {/* Colors */}
        <div className="relative group/color">
          <button
            className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white"
            title="Cor do Texto"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
          <div className="absolute left-0 top-full pt-1 hidden group-hover/color:block z-20">
            <div className="flex bg-[#121214] border border-[#323238] rounded p-1 gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec('foreColor', c);
                  }}
                  className="w-3.5 h-3.5 rounded-full border border-[#323238] hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="w-px h-3 bg-[#323238] mx-0.5" />

        {/* Compact List Cycle Button */}
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleCycleList();
          }}
          className={`p-1 rounded transition-colors ${
            listState !== 'none'
              ? 'bg-[#8257e5]/20 text-[#a78bfa] border border-[#8257e5]/40'
              : 'hover:bg-[#323238] text-[#a8a8b3] hover:text-white'
          }`}
          title="Lista"
        >
          {listState === 'ol' ? (
            <ListOrdered className="w-3.5 h-3.5" />
          ) : (
            <List className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Compact Align Cycle Button */}
        <button
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
          ) : (
            <AlignLeft className="w-3.5 h-3.5" />
          )}
        </button>

        <div className="w-px h-3 bg-[#323238] mx-0.5" />

        {/* Dice Formula Button */}
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleToggleFormula();
          }}
          className="p-1 hover:bg-[#8257e5]/20 hover:text-[#a78bfa] rounded text-[#a8a8b3] hover:border hover:border-[#8257e5]/40 transition-colors"
          title="Fórmula"
        >
          <Sigma className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        className="p-3.5 flex-1 overflow-y-auto text-sm leading-relaxed text-gray-300 outline-none custom-scrollbar"
        contentEditable
        onInput={handleInput}
        onKeyUp={updateToolbarStates}
        onMouseUp={updateToolbarStates}
        suppressContentEditableWarning
      />
    </div>
  );
}
