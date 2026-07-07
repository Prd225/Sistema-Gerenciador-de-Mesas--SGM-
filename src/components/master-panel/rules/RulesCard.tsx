import { useState, useRef } from 'react';
import { useRulesStore } from '@/store/useRulesStore';
import type { RuleWidget } from '@/types/rules';
import { GripVertical, Trash2, Maximize2, Image as ImageIcon, Type, Columns, Upload } from 'lucide-react';
import RulesEditor from './RulesEditor';

interface RulesCardProps {
  widget: RuleWidget;
  pageId: string;
}

export default function RulesCard({ widget, pageId }: RulesCardProps) {
  const updateWidgetSize = useRulesStore(state => state.updateWidgetSize);
  const removeWidget = useRulesStore(state => state.removeWidget);
  const updateWidgetContent = useRulesStore(state => state.updateWidgetContent);
  const updateWidgetContentType = useRulesStore(state => state.updateWidgetContentType);
  const updateWidgetColumns = useRulesStore(state => state.updateWidgetColumns);
  const updateWidgetImage = useRulesStore(state => state.updateWidgetImage);
  
  const [isHovered, setIsHovered] = useState(false);
  const [showSizes, setShowSizes] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(widget.title);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map the widget size to grid classes
  const spanClasses = {
    '1x1': 'col-span-1 row-span-1',
    '2x1': 'col-span-2 row-span-1',
    '1x2': 'col-span-1 row-span-2',
    '2x2': 'col-span-2 row-span-2',
  }[widget.size];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('widgetId', widget.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('widgetId');
    if (draggedId && draggedId !== widget.id) {
      useRulesStore.getState().reorderWidgets(pageId, draggedId, widget.id);
    }
  };

  const handleTitleSave = () => {
    if (titleValue.trim()) {
      updateWidgetContent(pageId, widget.id, titleValue.trim(), widget.content);
    }
    setIsEditingTitle(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        updateWidgetImage(pageId, widget.id, dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const canHaveColumns = widget.size === '2x1' || widget.size === '2x2';
  const canHaveImage = widget.size === '1x2';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowSizes(false);
      }}
      className={`relative bg-[#202024]/50 border border-[#323238] rounded-md overflow-hidden transition-all group hover:border-[#8257e5]/50 flex flex-col ${spanClasses}`}
    >
      {/* Title Bar / Drag Handle */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#121214]/50 border-b border-[#323238]/50 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-[#a8a8b3] opacity-50 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex-1 truncate">
          {isEditingTitle ? (
            <input
              autoFocus
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="bg-[#323238] text-white text-sm rounded px-1 outline-none w-full"
            />
          ) : (
            <h3 
              className="text-sm font-medium text-[#e1e1e6] select-none hover:text-white cursor-text"
              onDoubleClick={() => setIsEditingTitle(true)}
            >
              {widget.title || 'Nova Regra'}
            </h3>
          )}
        </div>
        
        {/* Actions (visible on hover) */}
        <div className={`flex items-center gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {canHaveImage && (
            <button
              onClick={() => updateWidgetContentType(pageId, widget.id, widget.contentType === 'image' ? 'text' : 'image')}
              className={`p-1 rounded transition-colors ${widget.contentType === 'image' ? 'bg-[#8257e5] text-white' : 'text-[#a8a8b3] hover:bg-[#323238] hover:text-[#e1e1e6]'}`}
              title="Modo Imagem"
            >
              {widget.contentType === 'image' ? <Type className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
            </button>
          )}

          {canHaveColumns && (
            <button
              onClick={() => updateWidgetColumns(pageId, widget.id, widget.columnCount === 3 ? 1 : (widget.columnCount || 1) + 1 as 1 | 2 | 3)}
              className="flex items-center gap-0.5 p-1 text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-[#323238] rounded transition-colors"
              title={`${widget.columnCount || 1} Coluna(s)`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">{widget.columnCount || 1}</span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowSizes(!showSizes)}
              className="p-1 text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-[#323238] rounded transition-colors"
              title="Mudar Tamanho"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {showSizes && (
              <div className="absolute top-full right-0 mt-1 bg-[#121214] border border-[#323238] rounded shadow-xl z-50 flex flex-col min-w-[100px] overflow-hidden">
                <button onClick={() => { updateWidgetSize(pageId, widget.id, '1x1'); setShowSizes(false); }} className={`px-3 py-1.5 text-xs text-left hover:bg-[#8257e5] transition-colors ${widget.size === '1x1' ? 'bg-[#323238] text-white' : 'text-[#a8a8b3]'}`}>Pequeno (1x1)</button>
                <button onClick={() => { updateWidgetSize(pageId, widget.id, '2x1'); setShowSizes(false); }} className={`px-3 py-1.5 text-xs text-left hover:bg-[#8257e5] transition-colors ${widget.size === '2x1' ? 'bg-[#323238] text-white' : 'text-[#a8a8b3]'}`}>Largo (2x1)</button>
                <button onClick={() => { updateWidgetSize(pageId, widget.id, '1x2'); setShowSizes(false); }} className={`px-3 py-1.5 text-xs text-left hover:bg-[#8257e5] transition-colors ${widget.size === '1x2' ? 'bg-[#323238] text-white' : 'text-[#a8a8b3]'}`}>Alto (1x2)</button>
                <button onClick={() => { updateWidgetSize(pageId, widget.id, '2x2'); setShowSizes(false); }} className={`px-3 py-1.5 text-xs text-left hover:bg-[#8257e5] transition-colors ${widget.size === '2x2' ? 'bg-[#323238] text-white' : 'text-[#a8a8b3]'}`}>Grande (2x2)</button>
              </div>
            )}
          </div>
          
          <button
            onClick={() => removeWidget(pageId, widget.id)}
            className="p-1 text-[#a8a8b3] hover:text-red-400 hover:bg-[#323238] rounded transition-colors"
            title="Remover Card"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {widget.contentType === 'image' && canHaveImage ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#121214]">
            {widget.imageUrl ? (
              <img 
                src={widget.imageUrl} 
                alt={widget.title} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <ImageIcon className="w-8 h-8 text-[#8257e5] mb-2 opacity-50" />
                <p className="text-xs text-[#a8a8b3] mb-1">Modo Imagem Ativado</p>
                <p className="text-[10px] text-[#a8a8b3]/60 mb-4">Proporção Recomendada: 1:2 (ex: 300x600px)</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-[#202024] hover:bg-[#323238] border border-[#323238] px-3 py-1.5 rounded text-xs text-[#e1e1e6] transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> Enviar Imagem
                </button>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImageUpload} 
            />
          </div>
        ) : (
          <div 
            className="w-full h-full pb-2"
            style={{ columnCount: widget.columnCount || 1, columnGap: '1rem' }}
          >
            <RulesEditor 
              initialValue={widget.content}
              onChange={(html) => updateWidgetContent(pageId, widget.id, widget.title, html)}
              isEditing={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
