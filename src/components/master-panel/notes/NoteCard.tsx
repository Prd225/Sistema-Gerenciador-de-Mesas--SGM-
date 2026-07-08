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
  const removeNote = useNotesStore(state => state.removeNote);

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
        backgroundColor: '#1a1a1e', // base dark background
        borderLeft: `4px solid ${note.color || '#8257e5'}`,
        borderTop: '1px solid #323238',
        borderRight: '1px solid #323238',
        borderBottom: '1px solid #323238',
      }}
    >
      <div className="flex justify-between items-start w-full">
        <h4 className="font-bold text-[#e1e1e6] text-lg leading-tight line-clamp-3 break-words">
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
