import { useState } from 'react';
import { useDiaryStore } from '@/store/useDiaryStore';
import type { DiaryEntry, DiaryPoint } from '@/types/diary';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Check,
  LayoutTemplate,
  GripVertical,
} from 'lucide-react';
import DiaryPagination from './DiaryPagination';
import RichTextEditor from './RichTextEditor';
import { generateId } from '@/lib/uuid';

interface DiaryEntryViewProps {
  entry: DiaryEntry;
  onBack: () => void;
}

const SLOTS_PER_PAGE = 4;

export default function DiaryEntryView({ entry, onBack }: DiaryEntryViewProps) {
  const { updateEntry, addPoint, removePoint, updatePoint } = useDiaryStore();
  const [currentPage, setCurrentPage] = useState(0);
  const [editingPointId, setEditingPointId] = useState<string | null>(null);

  // Pagination by slots
  const pages: DiaryPoint[][] = [];
  let currentSlots = 0;
  let page: DiaryPoint[] = [];

  entry.points.forEach((point) => {
    const cost = point.isComplex ? 2 : 1;
    if (currentSlots + cost > SLOTS_PER_PAGE && page.length > 0) {
      pages.push(page);
      page = [point];
      currentSlots = cost;
    } else {
      page.push(point);
      currentSlots += cost;
    }
  });
  if (page.length > 0) pages.push(page);

  const totalPages = Math.max(1, pages.length);
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);
  const currentPoints = pages[safeCurrentPage] || [];

  const handleAddPoint = (isComplex: boolean) => {
    const newPoint: DiaryPoint = {
      id: generateId(),
      text: '',
      isComplex,
      createdAt: Date.now(),
    };
    addPoint(entry.id, newPoint);
    setEditingPointId(newPoint.id);

    // Auto navigate to the last page (it will be capped during next render)
    setCurrentPage(9999);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (editingPointId === id) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;

    const newPoints = [...entry.points];
    const sourceIndex = newPoints.findIndex((p) => p.id === sourceId);
    const targetIndex = newPoints.findIndex((p) => p.id === targetId);

    if (sourceIndex >= 0 && targetIndex >= 0) {
      const [removed] = newPoints.splice(sourceIndex, 1);
      newPoints.splice(targetIndex, 0, removed);
      updateEntry(entry.id, { points: newPoints });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121214]/60 rounded-md border border-[#323238] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-[#202024] border-b border-[#323238]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <input
              type="text"
              value={entry.name}
              onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
              className="bg-transparent text-white font-semibold outline-none focus:border-b border-[#8257e5] w-[200px]"
            />
            <input
              type="text"
              value={entry.date}
              onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
              className="bg-transparent text-[#a8a8b3] text-xs outline-none focus:border-b border-[#8257e5] w-[150px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddPoint(false)}
            className="flex items-center gap-1 px-2 py-1 bg-[#323238] hover:bg-[#8257e5] text-white rounded text-xs transition-colors"
          >
            <Plus className="w-3 h-3" /> Ponto Simples
          </button>
          <button
            onClick={() => handleAddPoint(true)}
            className="flex items-center gap-1 px-2 py-1 bg-[#323238] hover:bg-[#8257e5] text-white rounded text-xs transition-colors"
            title="Descrição Longa"
          >
            <LayoutTemplate className="w-3 h-3" /> Ponto Complexo
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-3 overflow-hidden relative">
        <DiaryPagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
          {currentPoints.map((point) => (
            <div
              key={point.id}
              draggable={editingPointId !== point.id}
              onDragStart={(e) => handleDragStart(e, point.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, point.id)}
              className={`flex items-center gap-3 group relative bg-[#202024]/50 border border-[#323238]/50 rounded-md p-3 transition-colors ${
                point.isComplex ? 'min-h-[120px]' : 'min-h-[60px]'
              }`}
            >
              <div className="flex items-center gap-2 shrink-0">
                <GripVertical className="w-4 h-4 text-[#323238] group-hover:text-[#a8a8b3] cursor-grab transition-colors" />
                <div className="w-2 h-2 rounded-full bg-[#8257e5]" />
              </div>

              <div className="flex-1 flex flex-col min-w-0 h-full justify-center">
                <RichTextEditor
                  initialValue={point.text}
                  isEditing={editingPointId === point.id}
                  onChange={(val) =>
                    updatePoint(entry.id, point.id, { text: val })
                  }
                  maxLength={point.isComplex ? 250 : 150}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                {editingPointId === point.id ? (
                  <button
                    onClick={() => setEditingPointId(null)}
                    className="p-1.5 bg-[#8257e5] hover:bg-[#9466ff] text-white rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingPointId(point.id)}
                    className="p-1.5 bg-[#323238] hover:bg-[#8257e5] text-[#a8a8b3] hover:text-white rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() =>
                    confirm('Apagar este ponto?') &&
                    removePoint(entry.id, point.id)
                  }
                  className="p-1.5 bg-[#323238] hover:bg-red-500 text-[#a8a8b3] hover:text-white rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {currentPoints.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-[#a8a8b3] text-sm italic">
              Nenhum ponto de destaque adicionado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
