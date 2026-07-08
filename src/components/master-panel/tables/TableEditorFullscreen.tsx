import { useState, useEffect } from 'react';
import { useTablesStore } from '@/store/useTablesStore';
import { ChevronLeft, Bold, Italic, Underline, List, PaintBucket, Plus, Minus } from 'lucide-react';

interface TableEditorFullscreenProps {
  pageId: string;
  tableId: string;
  onBack: () => void;
}

const PRESET_COLORS = [
  '#8257e5', // Roxo (default)
  '#04d361', // Verde
  '#e559f9', // Rosa
  '#fba94c', // Laranja
  '#eb3b35', // Vermelho
  '#00b8d9', // Ciano
  '#a8a8b3', // Cinza
];

export default function TableEditorFullscreen({ pageId, tableId, onBack }: TableEditorFullscreenProps) {
  const table = useTablesStore(state => 
    state.pages.find(p => p.id === pageId)?.tables.find(t => t.id === tableId)
  );
  const updateTable = useTablesStore(state => state.updateTable);

  const [titleValue, setTitleValue] = useState('');
  const [localData, setLocalData] = useState<string[][]>([]);

  useEffect(() => {
    if (table) {
      setTitleValue(table.title);
      setLocalData(table.data);
    }
  }, [table?.id]); // Only set on initial load of this table

  const handleTitleBlur = () => {
    if (table && titleValue !== table.title) {
      updateTable(pageId, tableId, { title: titleValue });
    }
  };

  const handleColorChange = (color: string) => {
    if (table) updateTable(pageId, tableId, { color });
  };

  // Sync data to store
  const saveTableData = (newData: string[][]) => {
    updateTable(pageId, tableId, { data: newData });
    setLocalData(newData);
  };

  const handleCellBlur = (rowIndex: number, colIndex: number, content: string) => {
    const newData = [...localData];
    newData[rowIndex] = [...newData[rowIndex]];
    newData[rowIndex][colIndex] = content;
    saveTableData(newData);
  };

  const addRow = () => {
    if (localData.length === 0) return;
    const cols = localData[0].length;
    const newRow = Array(cols).fill('');
    saveTableData([...localData, newRow]);
  };

  const removeRow = () => {
    if (localData.length <= 1) return; // Keep at least 1 row
    saveTableData(localData.slice(0, -1));
  };

  const addColumn = () => {
    if (localData.length === 0) return;
    const newData = localData.map(row => [...row, '']);
    saveTableData(newData);
  };

  const removeColumn = () => {
    if (localData.length === 0 || localData[0].length <= 1) return; // Keep at least 1 col
    const newData = localData.map(row => row.slice(0, -1));
    saveTableData(newData);
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
  };

  if (!table) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-[#09090b]">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-[#323238] bg-[#121214]">
        <button 
          onClick={onBack}
          className="p-1.5 hover:bg-[#202024] rounded-md text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={titleValue}
          onChange={e => setTitleValue(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Título da Tabela"
          className="bg-transparent border-none outline-none text-[#e1e1e6] font-semibold flex-1 min-w-0"
        />

        {/* Label Color selector */}
        <div className="relative group/cardcolor flex items-center">
          <button className="flex items-center justify-center p-2 rounded-full border border-[#323238] hover:bg-[#202024] transition-colors">
            <PaintBucket className="w-4 h-4 text-[#a8a8b3]" />
          </button>
          
          <div className="absolute right-0 top-full mt-2 hidden group-hover/cardcolor:grid grid-cols-4 gap-2 bg-[#202024] border border-[#323238] rounded-lg p-3 shadow-xl z-50">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className="w-6 h-6 rounded-full border-2 border-[#121214] hover:scale-110 transition-transform cursor-pointer"
                style={{ 
                  backgroundColor: color,
                  boxShadow: table.color === color ? `0 0 0 2px ${color}` : 'none'
                }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1.5 bg-[#202024] border-b border-[#323238] flex-wrap justify-between">
        <div className="flex items-center gap-1">
          <button onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors shrink-0" title="Negrito">
            <Bold className="w-4 h-4" />
          </button>
          <button onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors shrink-0" title="Itálico">
            <Italic className="w-4 h-4" />
          </button>
          <button onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors shrink-0" title="Sublinhado">
            <Underline className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[#323238] mx-1 shrink-0" />
          <button onMouseDown={(e) => { e.preventDefault(); execCommand('insertUnorderedList'); }} className="p-1.5 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors shrink-0" title="Marcadores">
            <List className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={addRow} className="flex items-center gap-1 px-2 py-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors text-xs font-medium shrink-0" title="Adicionar Linha">
            <Plus className="w-3 h-3" /> Linha
          </button>
          <button onClick={removeRow} className="flex items-center gap-1 px-2 py-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-red-400 transition-colors text-xs font-medium shrink-0" title="Remover Linha">
            <Minus className="w-3 h-3" /> Linha
          </button>
          <div className="w-px h-4 bg-[#323238] mx-1 shrink-0" />
          <button onClick={addColumn} className="flex items-center gap-1 px-2 py-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors text-xs font-medium shrink-0" title="Adicionar Coluna">
            <Plus className="w-3 h-3" /> Coluna
          </button>
          <button onClick={removeColumn} className="flex items-center gap-1 px-2 py-1 hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-red-400 transition-colors text-xs font-medium shrink-0" title="Remover Coluna">
            <Minus className="w-3 h-3" /> Coluna
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto custom-scrollbar p-4" style={{ backgroundColor: `${table.color || '#8257e5'}05` }}>
        <table className="w-full border-collapse border border-[#323238]">
          <tbody>
            {localData.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-[#323238]">
                {row.map((cellContent, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={`border-r border-[#323238] p-0 relative ${rowIndex === 0 ? 'bg-[#202024] font-semibold text-[#e1e1e6]' : 'text-[#c4c4cc]'}`}
                    style={{ minWidth: '100px' }}
                  >
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleCellBlur(rowIndex, colIndex, e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={{ __html: cellContent }}
                      className="w-full min-h-[40px] outline-none p-3 break-words whitespace-pre-wrap"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
