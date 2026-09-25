import { useRef, useEffect, useState } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';
import {
  Bold,
  Italic,
  Underline,
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

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [listState, setListState] = useState<'none' | 'ul' | 'ol'>('none');
  const [alignState, setAlignState] = useState<'left' | 'center' | 'right'>(
    'left',
  );

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (
        document.activeElement !== editorRef.current ||
        !editorRef.current.innerHTML
      ) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

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
    const handleSelectionChange = () => {
      updateToolbarStates();
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const handleChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      updateToolbarStates();
    }
  };

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleChange();
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
      handleChange();
    }
  };

  return (
    <div
      className={`flex flex-col bg-[#121214] border border-[#323238] rounded-md overflow-hidden ${className}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 bg-[#202024] border-b border-[#323238]">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('bold');
          }}
          className="p-1.5 hover:bg-white/10 rounded text-[#a8a8b3] hover:text-white"
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('italic');
          }}
          className="p-1.5 hover:bg-white/10 rounded text-[#a8a8b3] hover:text-white"
          title="Itálico"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('underline');
          }}
          className="p-1.5 hover:bg-white/10 rounded text-[#a8a8b3] hover:text-white"
          title="Sublinhado"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-px bg-[#323238] mx-0.5 h-4" />

        {/* Compact List Cycle Button */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCycleList();
          }}
          className={`p-1.5 rounded transition-colors ${
            listState !== 'none'
              ? 'bg-[#8257e5]/20 text-[#a78bfa] border border-[#8257e5]/40'
              : 'hover:bg-white/10 text-[#a8a8b3] hover:text-white'
          }`}
          title="Lista"
        >
          {listState === 'ol' ? (
            <ListOrdered className="w-4 h-4" />
          ) : (
            <List className="w-4 h-4" />
          )}
        </button>

        {/* Compact Align Cycle Button */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCycleAlign();
          }}
          className={`p-1.5 rounded transition-colors ${
            alignState !== 'left'
              ? 'bg-[#8257e5]/20 text-[#a78bfa] border border-[#8257e5]/40'
              : 'hover:bg-white/10 text-[#a8a8b3] hover:text-white'
          }`}
          title="Alinhamento"
        >
          {alignState === 'center' ? (
            <AlignCenter className="w-4 h-4" />
          ) : alignState === 'right' ? (
            <AlignRight className="w-4 h-4" />
          ) : (
            <AlignLeft className="w-4 h-4" />
          )}
        </button>

        <div className="w-px bg-[#323238] mx-0.5 h-4" />

        {/* Dice Formula Button */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleToggleFormula();
          }}
          className="p-1.5 hover:bg-[#8257e5]/20 hover:text-[#a78bfa] rounded text-[#a8a8b3] hover:border hover:border-[#8257e5]/40 transition-colors"
          title="Fórmula"
        >
          <Sigma className="w-4 h-4" />
        </button>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleChange}
        onBlur={handleChange}
        onKeyUp={updateToolbarStates}
        onMouseUp={updateToolbarStates}
        className="p-3.5 min-h-[100px] text-sm leading-relaxed text-[#e1e1e6] outline-none focus:bg-[#1a1a1e] transition-colors whitespace-pre-wrap break-words [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
        data-placeholder={placeholder}
      />
    </div>
  );
}

export function RichTextView({
  content,
  className = '',
  defaultText = 'Sem descrição...',
}: {
  content: string;
  className?: string;
  defaultText?: string;
}) {
  if (!content)
    return (
      <span className="text-[#a8a8b3] italic flex-1 whitespace-pre-wrap">
        {defaultText}
      </span>
    );

  const formattedHtml = replaceDiceShortcodesWithHtml(content);

  return (
    <div
      className={`text-sm text-[#a8a8b3] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_b]:text-[#e1e1e6] [&_strong]:text-[#e1e1e6] [&_i]:italic [&_u]:underline whitespace-pre-wrap flex-1 break-words [word-break:break-word] overflow-visible py-0.5 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(formattedHtml) }}
    />
  );
}
