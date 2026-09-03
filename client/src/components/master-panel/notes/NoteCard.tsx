import React, { useState } from 'react';
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNote(pageId, note.id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };

  return (
    <div
      onClick={confirmDelete ? undefined : onClick}
      onMouseLeave={() => setConfirmDelete(false)}
      className="relative group aspect-square flex flex-col justify-between p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-md overflow-hidden"
      style={{
        backgroundColor: `${note.color || '#8257e5'}15`, // tint background (approx 8% opacity)
        border: `1px solid ${note.color || '#8257e5'}40`, // tinted border
        borderTop: `4px solid ${note.color || '#8257e5'}`, // thicker top border for post-it feel
      }}
    >
      {confirmDelete && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 bg-surface-elevated/95 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center p-3 text-center z-20 animate-in fade-in duration-150"
        >
          <p className="text-xs font-semibold text-main mb-2">
            Apagar esta anotação?
          </p>
          <div className="flex items-center gap-2 w-full max-w-[160px]">
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="flex-1 py-1 px-2 text-xs font-medium bg-brand-red hover:bg-brand-red/90 text-white rounded transition-colors cursor-pointer"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={handleCancelDelete}
              className="flex-1 py-1 px-2 text-xs text-muted-custom hover:text-main hover:bg-surface border border-subtle rounded transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start w-full">
        <h4
          className="font-bold text-main text-base leading-tight break-words"
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
          onClick={handleDeleteClick}
          className="opacity-0 group-hover:opacity-100 p-1.5 bg-brand-red/10 text-brand-red rounded hover:bg-brand-red hover:text-white transition-colors cursor-pointer"
          title="Apagar anotação"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-end items-end w-full">
        <span className="text-xs font-semibold text-muted-custom uppercase tracking-wider">
          {timeAgo(note.updatedAt)}
        </span>
      </div>
    </div>
  );
}
