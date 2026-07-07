import { useState } from 'react';
import { useDiaryStore } from '@/store/useDiaryStore';
import { Book } from 'lucide-react';
import DiaryList from './DiaryList';
import DiaryEntryView from './DiaryEntryView';

export default function MasterDiary() {
  const { entries } = useDiaryStore();
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  if (activeEntryId) {
    const entry = entries.find(e => e.id === activeEntryId);
    if (!entry) {
      setActiveEntryId(null);
      return null;
    }
    return (
      <div className="flex flex-col h-full w-full relative">
        <DiaryEntryView entry={entry} onBack={() => setActiveEntryId(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative p-2">
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="flex items-center gap-2">
          <Book className="w-5 h-5 text-[#8257e5]" />
          <h2 className="text-white font-semibold text-sm">Diário do Mestre</h2>
        </div>
      </div>
      <DiaryList onOpenEntry={setActiveEntryId} />
    </div>
  );
}
