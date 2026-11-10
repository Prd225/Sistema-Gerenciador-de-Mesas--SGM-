import React, { useState, useEffect } from 'react';
import { AlignLeft, Tag, Pencil, Check, X } from 'lucide-react';
import type { EvaluatedTextBlock } from '@/lib/sheet-dsl';
import { useModularSheetStore } from '@/store/useModularSheetStore';

interface TextSectionProps {
  sheetId?: string;
  block: EvaluatedTextBlock;
  isEditMode?: boolean;
}

const LAYOUT_TAGS_SET = new Set([
  'col1',
  'col2',
  'full',
  'auto',
  'tall',
  'short',
  'compact',
  'cards',
  'list',
  'pyramid',
  'grid',
  'table',
  'segments',
  'dots',
  'pie',
  'bar',
  'fill',
  'md',
  'lg',
  'sm',
]);

export const TextSection: React.FC<TextSectionProps> = ({
  sheetId,
  block,
  isEditMode = false,
}) => {
  const updateTextBlock = useModularSheetStore((s) => s.updateTextBlock);
  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(block.title || '');
  const [contentDraft, setContentDraft] = useState(() =>
    block.paragraphs.join('\n'),
  );

  useEffect(() => {
    if (!isEditing) {
      setTitleDraft(block.title || '');
      setContentDraft(block.paragraphs.join('\n'));
    }
  }, [isEditing, block.title, block.paragraphs]);

  const isTall = Boolean(block.tall);
  const displayTags = block.tags.filter(
    (t) => !LAYOUT_TAGS_SET.has(t.toLowerCase()) && !t.startsWith('#'),
  );

  const handleSave = () => {
    if (sheetId) {
      updateTextBlock(sheetId, block.blockIndex, titleDraft, contentDraft);
    }
    setIsEditing(false);
  };

  return (
    <div className={`space-y-2 ${isTall ? 'flex-1 flex flex-col' : ''}`}>
      <div className="px-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <AlignLeft
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: 'var(--sheet-accent-text, #a78bfa)' }}
          />
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 break-words leading-snug">
            {block.title || 'Anotações'}
          </span>
        </div>

        {isEditMode && sheetId && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-2 py-0.5 rounded border text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors shrink-0"
            style={{
              backgroundColor: 'var(--sheet-item-bg, #121214)',
              borderColor: 'var(--sheet-item-border, #29292e)',
            }}
            title="Editar anotações"
          >
            <Pencil className="w-2.5 h-2.5" />
            Editar
          </button>
        )}
      </div>

      <div
        onDoubleClick={() => {
          if (sheetId && !isEditing) setIsEditing(true);
        }}
        className={`relative rounded-xl border p-4 space-y-3 transition-colors ${isTall ? 'flex-1 flex flex-col' : ''
          }`}
        style={{
          backgroundColor: 'var(--sheet-card-bg, #18181b)',
          borderColor: 'var(--sheet-card-border, #29292e)',
        }}
      >
        {isEditing ? (
          <div className="space-y-2.5 flex-1 flex flex-col">
            <input
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder="Título do bloco de notas..."
              className="w-full rounded-lg border px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none"
              style={{
                backgroundColor: 'var(--sheet-item-bg, #121214)',
                borderColor: 'var(--sheet-item-border, #29292e)',
              }}
            />
            <textarea
              value={contentDraft}
              onChange={(e) => setContentDraft(e.target.value)}
              rows={isTall ? 9 : 5}
              placeholder="Escreva suas anotações... (Use '- ' para tópicos, '> ' para citações ou 'Chave: Valor')"
              className="w-full flex-1 rounded-lg border p-2.5 text-xs text-zinc-200 font-sans leading-relaxed focus:outline-none resize-y"
              style={{
                backgroundColor: 'var(--sheet-item-bg, #121214)',
                borderColor: 'var(--sheet-item-border, #29292e)',
              }}
            />
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 rounded-lg border text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--sheet-item-bg, #121214)',
                  borderColor: 'var(--sheet-item-border, #29292e)',
                }}
              >
                <X className="w-3 h-3" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1"
                style={{ backgroundColor: 'var(--sheet-accent, #8257e5)' }}
              >
                <Check className="w-3 h-3" />
                Salvar Nota
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 flex-1 min-w-0">
            {block.paragraphs.length > 0 ? (
              block.paragraphs.map((para, idx) => {
                const trimmed = para.trim();

                if (trimmed.startsWith('>')) {
                  return (
                    <blockquote
                      key={idx}
                      className="border-l-2 pl-3 py-0.5 text-xs text-zinc-300 italic rounded-r"
                      style={{
                        borderColor: 'var(--sheet-accent, #8257e5)',
                        backgroundColor: 'var(--sheet-accent-subtle, rgba(130,87,229,0.08))',
                      }}
                    >
                      {trimmed.replace(/^>\s*/, '')}
                    </blockquote>
                  );
                }

                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-zinc-300"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: 'var(--sheet-accent, #8257e5)' }}
                      />
                      <span className="flex-1 leading-relaxed">
                        {trimmed.slice(2)}
                      </span>
                    </div>
                  );
                }

                const kvMatch = trimmed.match(
                  /^([A-Za-zÀ-ÖØ-öø-ÿ0-9_\s]{2,20})\s*:\s*(.+)$/,
                );
                if (kvMatch && !trimmed.includes('\n')) {
                  return (
                    <div
                      key={idx}
                      className="flex items-baseline justify-between gap-2 text-xs py-0.5 border-b border-zinc-800/40 last:border-b-0"
                    >
                      <span className="text-zinc-400 font-medium">
                        {kvMatch[1]}
                      </span>
                      <span className="text-zinc-200 font-semibold text-right">
                        {kvMatch[2]}
                      </span>
                    </div>
                  );
                }

                return (
                  <p
                    key={idx}
                    className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap"
                  >
                    {para}
                  </p>
                );
              })
            ) : (
              <p className="text-xs text-zinc-500 italic">
                Nenhuma anotação registrada. Clique em Editar para escrever.
              </p>
            )}
          </div>
        )}

        {displayTags.length > 0 && !isEditing && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/60">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 flex items-center gap-1 font-mono"
              >
                <Tag className="w-2.5 h-2.5 text-zinc-500" />#{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
