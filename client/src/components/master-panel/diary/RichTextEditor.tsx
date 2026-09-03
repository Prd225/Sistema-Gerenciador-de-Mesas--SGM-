import { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, Palette, Smile } from 'lucide-react';

interface RichTextEditorProps {
  initialValue: string;
  onChange: (html: string) => void;
  isEditing: boolean;
  maxLength?: number;
}

const COLORS = [
  '#ffffff',
  '#e55757',
  '#57e569',
  '#57aee5',
  '#e5c557',
  '#8257e5',
];
const EMOJIS = ['⚔️', '🛡️', '🎲', '💀', '❤️', '🔥', '✨', '👑', '📜'];

export default function RichTextEditor({
  initialValue,
  onChange,
  isEditing,
  maxLength = 150,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [charCount, setCharCount] = useState(0);

  // Load initial content only once when switching to edit mode or mounting
  useEffect(() => {
    if (editorRef.current && isEditing) {
      if (editorRef.current.innerHTML !== initialValue) {
        editorRef.current.innerHTML = initialValue;
      }
      setCharCount(editorRef.current.innerText.length);
    }
  }, [isEditing, initialValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editorRef.current) return;

    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Tab',
      'Home',
      'End',
    ];

    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    if (charCount >= maxLength) {
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (!editorRef.current) return;

    const text = e.clipboardData.getData('text/plain');
    const remaining = maxLength - charCount;

    if (remaining > 0) {
      const textToInsert = text.slice(0, remaining);
      document.execCommand('insertText', false, textToInsert);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      setCharCount(editorRef.current.innerText.length);
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertText = (text: string) => {
    exec('insertText', text);
  };

  if (!isEditing) {
    return (
      <div
        className="prose prose-invert max-w-none text-sm text-main pointer-events-none break-words"
        dangerouslySetInnerHTML={{
          __html:
            initialValue ||
            '<span class="italic text-muted-custom">Sem descrição...</span>',
        }}
      />
    );
  }

  return (
    <div className="flex flex-col border border-subtle rounded-md bg-app overflow-hidden focus-within:border-brand-purple transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 bg-surface-elevated border-b border-subtle">
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            exec('bold');
          }}
          className="p-1 hover:bg-surface rounded text-muted-custom hover:text-main cursor-pointer"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            exec('italic');
          }}
          className="p-1 hover:bg-surface rounded text-muted-custom hover:text-main cursor-pointer"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            exec('underline');
          }}
          className="p-1 hover:bg-surface rounded text-muted-custom hover:text-main cursor-pointer"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        <div className="relative group/color">
          <button className="p-1 hover:bg-surface rounded text-muted-custom hover:text-main cursor-pointer">
            <Palette className="w-4 h-4" />
          </button>
          <div className="absolute left-0 top-full pt-1 hidden group-hover/color:block z-10">
            <div className="flex bg-surface border border-subtle rounded p-1 gap-1 shadow-lg">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec('foreColor', c);
                  }}
                  className="w-4 h-4 rounded-full border border-subtle hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative group/emoji">
          <button className="p-1 hover:bg-surface rounded text-muted-custom hover:text-main cursor-pointer">
            <Smile className="w-4 h-4" />
          </button>
          <div className="absolute left-0 top-full pt-1 hidden group-hover/emoji:block z-10 w-[140px]">
            <div className="flex flex-wrap bg-surface border border-subtle rounded p-1 gap-1 shadow-lg">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onMouseDown={(evt) => {
                    evt.preventDefault();
                    insertText(e);
                  }}
                  className="w-6 h-6 hover:bg-surface-elevated rounded flex items-center justify-center text-sm cursor-pointer"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        className="p-2 min-h-[60px] max-h-[200px] overflow-y-auto text-sm text-main outline-none"
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        suppressContentEditableWarning
      />

      {/* Footer */}
      <div className="flex justify-end p-1 pr-2 bg-surface-elevated border-t border-subtle">
        <span
          className={`text-[10px] ${charCount >= maxLength ? 'text-brand-red font-medium' : 'text-muted-custom'}`}
        >
          {charCount} / {maxLength}
        </span>
      </div>
    </div>
  );
}
