import { useState } from 'react';
import { useDiaryStore } from '@/store/useDiaryStore';
import { Plus, Trash2, Star, Palette } from 'lucide-react';
import DiaryPagination from './DiaryPagination';

const ENTRIES_PER_PAGE = 5;
const COLORS = ['#8257e5', '#e55757', '#57e569', '#57aee5', '#e5c557', 'transparent'];

interface DiaryListProps {
  onOpenEntry: (id: string) => void;
}
const parseDateString = (dateStr: string, fallbackTimestamp: number) => {
  const match = dateStr.match(/(\d{1,2})[^\d](\d{1,2})[^\d](\d{4})(?:\s+(\d{1,2})[^\d](\d{1,2}))?/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const hours = match[4] ? parseInt(match[4], 10) : 0;
    const minutes = match[5] ? parseInt(match[5], 10) : 0;
    return new Date(year, month, day, hours, minutes).getTime();
  }
  return fallbackTimestamp;
};

export default function DiaryList({ onOpenEntry }: DiaryListProps) {
  const { entries, addEntry, updateEntry, removeEntry } = useDiaryStore();
  const [currentPage, setCurrentPage] = useState(0);

  // Sort entries: Chronologically by the typed date, fallback to createdAt
  const sortedEntries = [...entries].sort((a, b) => {
    const timeA = parseDateString(a.date, a.createdAt);
    const timeB = parseDateString(b.date, b.createdAt);
    return timeA - timeB;
  });

  const totalPages = Math.ceil(sortedEntries.length / ENTRIES_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(0, totalPages - 1));
  const currentEntries = sortedEntries.slice(
    safeCurrentPage * ENTRIES_PER_PAGE, 
    (safeCurrentPage + 1) * ENTRIES_PER_PAGE
  );

  const handleAddEntry = () => {
    const newEntry = {
      id: crypto.randomUUID(),
      name: 'Novo Registro',
      date: new Date().toLocaleDateString('pt-BR'),
      points: [],
      createdAt: Date.now()
    };
    addEntry(newEntry);
    // Go to last page where the new entry will appear (chronological order)
    const newTotal = sortedEntries.length + 1;
    setCurrentPage(Math.max(0, Math.ceil(newTotal / ENTRIES_PER_PAGE) - 1));
  };

  return (
    <div className="flex flex-col h-full">
      <DiaryPagination 
        currentPage={safeCurrentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
      />

      <div className="flex-1 flex flex-col gap-2">
        {currentEntries.map(entry => (
          <div 
            key={entry.id}
            className={`group relative flex items-center bg-[#202024] hover:bg-[#29292e] rounded-md p-3 transition-colors cursor-pointer border ${entry.isFavorite ? 'border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.15)]' : 'border-[#323238]'}`}
            onClick={() => onOpenEntry(entry.id)}
            style={{ 
              borderLeftColor: entry.color && entry.color !== 'transparent' ? entry.color : (entry.isFavorite ? '#eab308' : '#323238'), 
              borderLeftWidth: (entry.color && entry.color !== 'transparent') || entry.isFavorite ? '4px' : '1px' 
            }}
          >
            <div className="flex-1 flex flex-col">
              <span className="font-semibold text-white">{entry.name}</span>
              <span className="text-xs text-[#a8a8b3]">{entry.date} • {entry.points.length} pontos de destaque</span>
            </div>

            {/* Quick Actions */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => updateEntry(entry.id, { isFavorite: !entry.isFavorite })}
                className={`p-1.5 rounded hover:bg-black/20 ${entry.isFavorite ? 'text-yellow-400' : 'text-[#a8a8b3] hover:text-white'}`}
                title="Favoritar"
              >
                <Star className={`w-4 h-4 ${entry.isFavorite ? 'fill-current' : ''}`} />
              </button>
              
              <div className="relative group/color">
                <button className="p-1.5 rounded hover:bg-black/20 text-[#a8a8b3] hover:text-white" title="Cor">
                  <Palette className="w-4 h-4" />
                </button>
                <div className="absolute right-0 top-full pt-1 hidden group-hover/color:block z-10">
                  <div className="flex bg-[#121214] border border-[#323238] rounded p-1 gap-1 shadow-xl">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => updateEntry(entry.id, { color: c })}
                        className="w-5 h-5 rounded-sm border border-[#323238] hover:scale-110 transition-transform"
                        style={{ backgroundColor: c === 'transparent' ? '#202024' : c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => confirm('Apagar este registro?') && removeEntry(entry.id)}
                className="p-1.5 rounded hover:bg-red-500/20 text-[#a8a8b3] hover:text-red-400"
                title="Apagar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {currentEntries.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-[#a8a8b3] text-sm italic">
            Nenhum registro encontrado nesta página.
          </div>
        )}
      </div>

      <button
        onClick={handleAddEntry}
        className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-[#8257e5] hover:bg-[#9466ff] text-white rounded-md font-medium transition-colors"
      >
        <Plus className="w-4 h-4" /> Novo Registro
      </button>
    </div>
  );
}
