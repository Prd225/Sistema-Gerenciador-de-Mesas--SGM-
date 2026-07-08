
import { useNotesStore } from '@/store/useNotesStore';
import NoteCard from './NoteCard';
import { NotebookPen, Plus } from 'lucide-react';

interface NotesGridProps {
  pageId: string;
  onOpenNote: (noteId: string) => void;
}

export default function NotesGrid({ pageId, onOpenNote }: NotesGridProps) {
  const page = useNotesStore(state => state.pages.find(p => p.id === pageId));
  const addNote = useNotesStore(state => state.addNote);

  if (!page) return null;

  const handleAddNote = () => {
    const newNoteId = addNote(pageId);
    onOpenNote(newNoteId); // Already opens the newly created note
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        
        {page.notes.map(note => (
          <NoteCard 
            key={note.id} 
            note={note} 
            pageId={pageId}
            onClick={() => onOpenNote(note.id)} 
          />
        ))}

        {/* Add Note Button */}
        <div 
          onClick={handleAddNote}
          className="aspect-square flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer transition-all border-2 border-dashed border-[#323238] hover:border-[#8257e5] hover:bg-[#8257e5]/5 text-[#a8a8b3] hover:text-[#e1e1e6] group"
        >
          <div className="w-12 h-12 rounded-full bg-[#202024] group-hover:bg-[#8257e5]/20 flex items-center justify-center mb-3 transition-colors relative">
            <NotebookPen className="w-6 h-6 text-[#8257e5]" />
            <Plus className="w-4 h-4 text-[#e1e1e6] absolute bottom-2 right-2 translate-x-1 translate-y-1 bg-[#121214] rounded-full" />
          </div>
          <span className="font-semibold text-sm">Anotações</span>
        </div>

      </div>
    </div>
  );
}
