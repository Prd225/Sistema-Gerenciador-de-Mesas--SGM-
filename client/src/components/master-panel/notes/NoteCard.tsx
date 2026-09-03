import React from 'react';
import type { Note } from '@/types/notes';
import { Trash2 } from 'lucide-react';
import { useNotesStore } from '@/store/useNotesStore';
import { timeAgo } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  pageId: string;
  onClick: () => void;
}

export default function NoteCard({ note, pageId, onClick }: NoteCardProps) {
  const removeNote = useNotesStore((state) => state.removeNote);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja apagar esta anotação?')) {
      removeNote(pageId, note.id);
    }
  };

  return (
    <div
      onClick={onClick}
      className="relative group aspect-square flex flex-col justify-between p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-md"
      style={{
        backgroundColor: `${note.color || '#8257e5'}15`, // tint background (approx 8% opacity)
        border: `1px solid ${note.color || '#8257e5'}40`, // tinted border
        borderTop: `4px solid ${note.color || '#8257e5'}`, // thicker top border for post-it feel
      }}
    >
      <div className="flex justify-between items-start w-full">
        <h4
          className="font-bold text-[#e1e1e6] text-base leading-tight break-words"
          style={{
            wordBreak: 'break-word',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {note.title || 'Sem Título'}
        </h4>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-end items-end w-full">
        <span className="text-xs font-semibold text-[#a8a8b3] uppercase tracking-wider">
          {timeAgo(note.updatedAt)}
        </span>
      </div>
    </div>
  );
}
