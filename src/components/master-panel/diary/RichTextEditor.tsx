import { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, Palette, Smile } from 'lucide-react';

interface RichTextEditorProps {
  initialValue: string;
  onChange: (html: string) => void;
  isEditing: boolean;
  maxLength?: number;
}

const COLORS = ['#ffffff', '#e55757', '#57e569', '#57aee5', '#e5c557', '#8257e5'];
const EMOJIS = ['⚔️', '🛡️', '🎲', '💀', '❤️', '🔥', '✨', '👑', '📜'];

export default function RichTextEditor({ initialValue, onChange, isEditing, maxLength = 150 }: RichTextEditorProps) {
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
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Tab', 'Home', 'End'
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
        className="prose prose-invert max-w-none text-sm text-gray-300 pointer-events-none break-words"
        dangerouslySetInnerHTML={{ __html: initialValue || '<span class="italic text-gray-500">Sem descrição...</span>' }}
      />
    );
  }

  return (
    <div className="flex flex-col border border-[#323238] rounded-md bg-[#121214] overflow-hidden focus-within:border-[#8257e5] transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 bg-[#202024] border-b border-[#323238]">
        <button onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white"><Bold className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white"><Italic className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('underline'); }} className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white"><Underline className="w-4 h-4" /></button>
        
        <div className="w-px h-4 bg-[#323238] mx-1" />
        
        <div className="relative group/color">
          <button className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white"><Palette className="w-4 h-4" /></button>
          <div className="absolute left-0 top-full pt-1 hidden group-hover/color:block z-10">
            <div className="flex bg-[#121214] border border-[#323238] rounded p-1 gap-1">
              {COLORS.map(c => (
                <button
                  key={c}
                  onMouseDown={(e) => { e.preventDefault(); exec('foreColor', c); }}
                  className="w-4 h-4 rounded-full border border-[#323238] hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative group/emoji">
          <button className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white"><Smile className="w-4 h-4" /></button>
          <div className="absolute left-0 top-full pt-1 hidden group-hover/emoji:block z-10 w-[140px]">
            <div className="flex flex-wrap bg-[#121214] border border-[#323238] rounded p-1 gap-1">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onMouseDown={(evt) => { evt.preventDefault(); insertText(e); }}
                  className="w-6 h-6 hover:bg-[#323238] rounded flex items-center justify-center text-sm"
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
        className="p-2 min-h-[60px] max-h-[200px] overflow-y-auto text-sm text-gray-300 outline-none"
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        suppressContentEditableWarning
      />

      {/* Footer */}
      <div className="flex justify-end p-1 pr-2 bg-[#202024] border-t border-[#323238]">
        <span className={`text-[10px] ${charCount >= maxLength ? 'text-red-400 font-medium' : 'text-[#a8a8b3]'}`}>
          {charCount} / {maxLength}
        </span>
      </div>
    </div>
  );
}
