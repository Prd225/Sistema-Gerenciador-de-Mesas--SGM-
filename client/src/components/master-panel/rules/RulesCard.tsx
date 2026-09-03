import { useState, useRef } from 'react';
import { useRulesStore } from '@/store/useRulesStore';
import type { RuleWidget } from '@/types/rules';
import {
  GripVertical,
  Trash2,
  Maximize2,
  Image as ImageIcon,
  Type,
  Columns,
  Upload,
  Edit3,
} from 'lucide-react';
import RulesEditor from './RulesEditor';

interface RulesCardProps {
  widget: RuleWidget;
  pageId: string;
}

export default function RulesCard({ widget, pageId }: RulesCardProps) {
  const updateWidgetSize = useRulesStore((state) => state.updateWidgetSize);
  const removeWidget = useRulesStore((state) => state.removeWidget);
  const updateWidgetTitle = useRulesStore((state) => state.updateWidgetTitle);
  const updateWidgetContentIndex = useRulesStore(
    (state) => state.updateWidgetContentIndex,
  );
  const updateWidgetContentType = useRulesStore(
    (state) => state.updateWidgetContentType,
  );
  const updateWidgetColumns = useRulesStore(
    (state) => state.updateWidgetColumns,
  );
  const updateWidgetImage = useRulesStore((state) => state.updateWidgetImage);

  const [isHovered, setIsHovered] = useState(false);
  const [showSizes, setShowSizes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isDragEnabled, setIsDragEnabled] = useState(false);
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
      updateWidgetTitle(pageId, widget.id, titleValue.trim());
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
  const columnsCount = widget.columnCount || 1;
  const contents = widget.contents || [widget.content || '', '', ''];

  return (
    <div
      draggable={isDragEnabled && !isEditingMode}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowSizes(false);
        setIsDragEnabled(false);
        setShowDeleteConfirm(false);
      }}
      className={`relative bg-surface-elevated/50 border border-subtle rounded-md transition-all group hover:border-brand-purple/50 flex flex-col ${showDeleteConfirm || showSizes ? 'z-30' : ''} ${spanClasses}`}
    >
      {/* Title Bar / Drag Handle */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 bg-app/50 border-b border-subtle/50 cursor-grab active:cursor-grabbing rounded-t-md"
        onMouseEnter={() => setIsDragEnabled(true)}
        onMouseLeave={() => setIsDragEnabled(false)}
      >
        <GripVertical
          className={`w-4 h-4 text-muted-custom ${isEditingMode ? 'opacity-20 cursor-not-allowed' : 'opacity-50 group-hover:opacity-100 transition-opacity'}`}
        />

        <div className="flex-1 truncate">
          {isEditingTitle && isEditingMode ? (
            <input
              autoFocus
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="bg-surface text-main border border-subtle text-sm rounded px-1 outline-none w-full"
            />
          ) : (
            <h3
              className={`text-sm font-medium text-main select-none ${isEditingMode ? 'hover:text-main cursor-text' : 'opacity-80'}`}
              onDoubleClick={() => isEditingMode && setIsEditingTitle(true)}
            >
              {widget.title || 'Nova Regra'}
            </h3>
          )}
        </div>

        {/* Actions (visible on hover or when editing) */}
        <div
          className={`flex items-center gap-1 transition-opacity duration-200 ${isHovered || isEditingMode || showDeleteConfirm ? 'opacity-100' : 'opacity-0'}`}
        >
          <button
            onClick={() => setIsEditingMode(!isEditingMode)}
            className={`p-1 rounded transition-colors cursor-pointer ${isEditingMode ? 'bg-brand-purple text-white' : 'text-muted-custom hover:bg-surface hover:text-main'}`}
            title={isEditingMode ? 'Modo Visualização' : 'Modo Edição'}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {canHaveImage && isEditingMode && (
            <button
              onClick={() =>
                updateWidgetContentType(
                  pageId,
                  widget.id,
                  widget.contentType === 'image' ? 'text' : 'image',
                )
              }
              className={`p-1 rounded transition-colors cursor-pointer ${widget.contentType === 'image' ? 'bg-brand-purple text-white' : 'text-muted-custom hover:bg-surface hover:text-main'}`}
              title="Modo Imagem"
            >
              {widget.contentType === 'image' ? (
                <Type className="w-3.5 h-3.5" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {canHaveColumns && isEditingMode && (
            <button
              onClick={() =>
                updateWidgetColumns(
                  pageId,
                  widget.id,
                  columnsCount === 3 ? 1 : ((columnsCount + 1) as 1 | 2 | 3),
                )
              }
              className="flex items-center gap-0.5 p-1 text-muted-custom hover:text-main hover:bg-surface rounded transition-colors cursor-pointer"
              title={`${columnsCount} Coluna(s)`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">{columnsCount}</span>
            </button>
          )}

          {isEditingMode && (
            <div className="relative">
              <button
                onClick={() => setShowSizes(!showSizes)}
                className="p-1 text-muted-custom hover:text-main hover:bg-surface rounded transition-colors cursor-pointer"
                title="Mudar Tamanho"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {showSizes && (
                <div className="absolute top-full right-0 mt-1 bg-surface-elevated border border-subtle rounded shadow-xl z-50 flex flex-col min-w-[100px] overflow-hidden">
                  <button
                    onClick={() => {
                      updateWidgetSize(pageId, widget.id, '1x1');
                      setShowSizes(false);
                    }}
                    className={`px-3 py-1.5 text-xs text-left hover:bg-brand-purple hover:text-white transition-colors cursor-pointer ${widget.size === '1x1' ? 'bg-surface text-main font-semibold' : 'text-muted-custom'}`}
                  >
                    Pequeno (1x1)
                  </button>
                  <button
                    onClick={() => {
                      updateWidgetSize(pageId, widget.id, '2x1');
                      setShowSizes(false);
                    }}
                    className={`px-3 py-1.5 text-xs text-left hover:bg-brand-purple hover:text-white transition-colors cursor-pointer ${widget.size === '2x1' ? 'bg-surface text-main font-semibold' : 'text-muted-custom'}`}
                  >
                    Largo (2x1)
                  </button>
                  <button
                    onClick={() => {
                      updateWidgetSize(pageId, widget.id, '1x2');
                      setShowSizes(false);
                    }}
                    className={`px-3 py-1.5 text-xs text-left hover:bg-brand-purple hover:text-white transition-colors cursor-pointer ${widget.size === '1x2' ? 'bg-surface text-main font-semibold' : 'text-muted-custom'}`}
                  >
                    Alto (1x2)
                  </button>
                  <button
                    onClick={() => {
                      updateWidgetSize(pageId, widget.id, '2x2');
                      setShowSizes(false);
                    }}
                    className={`px-3 py-1.5 text-xs text-left hover:bg-brand-purple hover:text-white transition-colors cursor-pointer ${widget.size === '2x2' ? 'bg-surface text-main font-semibold' : 'text-muted-custom'}`}
                  >
                    Grande (2x2)
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(!showDeleteConfirm);
              }}
              className="p-1 text-brand-red hover:bg-brand-red/10 rounded transition-colors cursor-pointer"
              title="Excluir Bloco"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {showDeleteConfirm && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full right-0 mt-1 bg-surface-elevated border border-subtle rounded-md shadow-2xl z-50 p-2.5 min-w-[140px] flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150"
              >
                <span className="text-[11px] font-semibold text-main text-center whitespace-nowrap">
                  Excluir Bloco?
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      removeWidget(pageId, widget.id);
                      setShowDeleteConfirm(false);
                    }}
                    className="flex-1 px-2 py-1 text-[11px] font-medium bg-brand-red hover:bg-brand-red/90 text-white rounded transition-colors cursor-pointer text-center"
                  >
                    Excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-2 py-1 text-[11px] text-muted-custom hover:text-main hover:bg-surface rounded border border-subtle transition-colors cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative rounded-b-md">
        {widget.contentType === 'image' && canHaveImage ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-app">
            {widget.imageUrl ? (
              <img
                src={widget.imageUrl}
                alt={widget.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <ImageIcon className="w-8 h-8 text-brand-purple mb-2 opacity-50" />
                <p className="text-xs text-muted-custom mb-1">
                  Modo Imagem Ativado
                </p>
                <p className="text-[10px] text-muted-custom/60 mb-4">
                  Proporção Recomendada: 1:2 (ex: 300x600px)
                </p>
                {isEditingMode && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-surface hover:bg-surface-elevated border border-subtle px-3 py-1.5 rounded text-xs text-main transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Enviar Imagem
                  </button>
                )}
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
            className={`w-full h-full flex ${canHaveColumns && columnsCount > 1 ? 'divide-x divide-border-subtle' : ''}`}
          >
            {Array.from({ length: columnsCount }).map((_, i) => (
              <div key={i} className="flex-1 min-w-0 h-full p-2">
                <RulesEditor
                  initialValue={contents[i] || ''}
                  onChange={(html) =>
                    updateWidgetContentIndex(pageId, widget.id, i, html)
                  }
                  isEditing={isEditingMode}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
