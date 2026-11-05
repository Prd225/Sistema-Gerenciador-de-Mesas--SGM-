import React from 'react';
import { AlignLeft, Tag } from 'lucide-react';
import type { EvaluatedTextBlock } from '@/lib/sheet-dsl';

interface TextSectionProps {
  block: EvaluatedTextBlock;
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

export const TextSection: React.FC<TextSectionProps> = ({ block }) => {
  const isTall = Boolean(block.tall);
  const displayTags = block.tags.filter((t) => !LAYOUT_TAGS_SET.has(t.toLowerCase()));

  return (
    <div className="space-y-2">
      {block.title && (
        <div className="px-1 flex items-center gap-1.5">
          <AlignLeft className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            {block.title}
          </span>
        </div>
      )}

      <div
        className={`relative rounded-xl border p-4 space-y-3 transition-colors ${
          isTall ? 'min-h-[280px] flex flex-col' : ''
        }`}
        style={{
          backgroundColor: 'var(--sheet-card-bg, #18181b)',
          borderColor: 'var(--sheet-card-border, #29292e)',
        }}
      >
        <div className="space-y-2.5 flex-1 min-w-0">
          {block.paragraphs.length > 0 ? (
            block.paragraphs.map((para, idx) => {
              const trimmed = para.trim();

              // Marcador de Citação (Blockquote: > texto)
              if (trimmed.startsWith('>')) {
                return (
                  <blockquote
                    key={idx}
                    className="border-l-2 border-indigo-500/60 pl-3 py-0.5 text-xs text-zinc-300 italic bg-indigo-500/5 rounded-r"
                  >
                    {trimmed.replace(/^>\s*/, '')}
                  </blockquote>
                );
              }

              // Marcador de Tópico / Bullet point (- item ou * item)
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span className="flex-1 leading-relaxed">
                      {trimmed.slice(2)}
                    </span>
                  </div>
                );
              }

              // Linha Chave: Valor (ex: Origem: Investigador)
              const kvMatch = trimmed.match(/^([A-Za-zÀ-ÖØ-öø-ÿ0-9_\s]{2,20})\s*:\s*(.+)$/);
              if (kvMatch && !trimmed.includes('\n')) {
                return (
                  <div key={idx} className="flex items-baseline justify-between gap-2 text-xs py-0.5 border-b border-zinc-800/40 last:border-b-0">
                    <span className="text-zinc-400 font-medium">{kvMatch[1]}</span>
                    <span className="text-zinc-200 font-semibold text-right">{kvMatch[2]}</span>
                  </div>
                );
              }

              // Parágrafo Normal
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
              Nenhuma anotação registrada neste bloco.
            </p>
          )}
        </div>

        {/* Tags / Marcadores */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/60">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 flex items-center gap-1 font-mono"
              >
                <Tag className="w-2.5 h-2.5 text-zinc-500" />
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

