import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className = '' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Only update if not currently focused to prevent cursor jump, 
      // or if empty (initial load)
      if (document.activeElement !== editorRef.current || !editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleChange();
  };

  const handleChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className={`flex flex-col bg-[#121214] border border-[#323238] rounded-md overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex gap-1 p-1 bg-[#202024] border-b border-[#323238]">
        <button type="button" onClick={() => exec('bold')} className="p-1.5 hover:bg-white/10 rounded text-[#a8a8b3] hover:text-white" title="Negrito">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('italic')} className="p-1.5 hover:bg-white/10 rounded text-[#a8a8b3] hover:text-white" title="Itálico">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('underline')} className="p-1.5 hover:bg-white/10 rounded text-[#a8a8b3] hover:text-white" title="Sublinhado">
          <Underline className="w-4 h-4" />
        </button>
        <div className="w-px bg-[#323238] mx-1" />
        <button type="button" onClick={() => exec('insertUnorderedList')} className="p-1.5 hover:bg-white/10 rounded text-[#a8a8b3] hover:text-white" title="Lista">
          <List className="w-4 h-4" />
        </button>
      </div>
      
      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleChange}
        onBlur={handleChange}
        className="p-3 min-h-[100px] text-sm text-[#e1e1e6] outline-none focus:bg-[#1a1a1e] transition-colors whitespace-pre-wrap break-words [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
        data-placeholder={placeholder}
      />
    </div>
  );
}

export function RichTextView({ content, className = '', defaultText = 'Sem descrição...' }: { content: string, className?: string, defaultText?: string }) {
  if (!content) return <span className="text-[#a8a8b3] italic flex-1 whitespace-pre-wrap">{defaultText}</span>;
  
  return (
    <div 
      className={`text-sm text-[#a8a8b3] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_b]:text-[#e1e1e6] [&_strong]:text-[#e1e1e6] [&_i]:italic [&_u]:underline whitespace-pre-wrap flex-1 break-words [word-break:break-word] overflow-hidden ${className}`}
      dangerouslySetInnerHTML={{ __html: content }} 
    />
  );
}
