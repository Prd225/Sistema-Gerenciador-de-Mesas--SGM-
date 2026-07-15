import { useState } from 'react';
import { useScenesStore } from '@/store/useScenesStore';
import { Clapperboard, Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

export default function ScenesPanel() {
  const { scenes, activeSceneId, switchScene, addScene, renameScene, removeScene } = useScenesStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const scenesPerPage = 5;

  const totalPages = Math.ceil(scenes.length / scenesPerPage);
  const startIndex = (currentPage - 1) * scenesPerPage;
  const visibleScenes = scenes.slice(startIndex, startIndex + scenesPerPage);

  const handleDoubleClick = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleRenameSubmit = (id: string) => {
    if (editingName.trim()) {
      renameScene(id, editingName.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') handleRenameSubmit(id);
    if (e.key === 'Escape') setEditingId(null);
  };

  const handleAdd = () => {
    addScene();
    // Go to the last page where the new scene will be
    const newTotalPages = Math.ceil((scenes.length + 1) / scenesPerPage);
    setCurrentPage(newTotalPages);
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] text-[#e1e1e6]">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-[#323238] bg-[#1a1a1e] shrink-0">
        <div className="p-1.5 bg-[#8257e5]/20 text-[#8257e5] rounded">
          <Clapperboard className="w-5 h-5" />
        </div>
        <h2 className="text-[#e1e1e6] font-bold">Cenas</h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {visibleScenes.map((scene) => {
          const isActive = scene.id === activeSceneId;
          const isEditing = scene.id === editingId;

          return (
            <div
              key={scene.id}
              className={`flex items-center p-3 rounded cursor-pointer transition-colors border group
                ${isActive 
                  ? 'bg-[#8257e5]/10 border-[#8257e5]' 
                  : 'bg-[#202024] border-transparent hover:bg-[#323238] hover:border-[#323238]'
                }
              `}
              onClick={() => {
                if (!isEditing) switchScene(scene.id);
              }}
              onDoubleClick={() => handleDoubleClick(scene.id, scene.name)}
            >
              <div className="flex-1 truncate relative">
                {isEditing ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRenameSubmit(scene.id)}
                    onKeyDown={(e) => handleKeyDown(e, scene.id)}
                    className="w-full bg-[#121214] text-[#e1e1e6] px-2 py-1 rounded outline-none border border-[#8257e5]"
                  />
                ) : (
                  <span className="font-bold select-none">{scene.name}</span>
                )}
              </div>
              
              {!isEditing && scenes.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Deseja realmente excluir a cena "${scene.name}"?`)) {
                      removeScene(scene.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-all ml-2"
                  title="Excluir Cena"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleAdd}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-[#323238] hover:bg-[#8257e5] hover:shadow-[0_0_15px_rgba(130,87,229,0.3)] text-[#a8a8b3] hover:text-white transition-all group"
            title="Adicionar Nova Cena"
          >
            <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
          </button>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 p-3 border-t border-[#323238] bg-[#1a1a1e] shrink-0">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-[#a8a8b3] text-sm font-mono tracking-widest">
            {currentPage} | {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
