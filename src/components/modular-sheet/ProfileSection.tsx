import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Check,
  X,
  FolderOpen,
  SlidersHorizontal,
  RotateCcw,
  Pencil,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';
import type { EvaluatedProfileBlock } from '@/lib/sheet-dsl';
import { generateId } from '@/lib/uuid';
import { useModularSheetStore } from '@/store/useModularSheetStore';

export interface ProfileImageAdjustments {
  imageUrl: string;
  w?: number;
  h?: number;
  x?: number;
  y?: number;
  scale?: number;
  fit?: 'contain' | 'cover' | 'auto';
  textPos?: 'bottom' | 'top' | 'side' | 'none';
}

interface ProfileSectionProps {
  sheetId?: string;
  profile: EvaluatedProfileBlock;
  onUpdateProfileImage?: (adj: ProfileImageAdjustments) => void;
  isEditMode?: boolean;
}

export function resolveSheetImageUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('/api/')
  ) {
    return trimmed;
  }
  // Caminho local do computador (ex: C:\Users\..., C:/Users/..., file:///...)
  return `/api/local-image?path=${encodeURIComponent(trimmed)}`;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  sheetId,
  profile,
  onUpdateProfileImage,
  isEditMode = false,
}) => {
  const updateCharacterLevel = useModularSheetStore((s) => s.updateCharacterLevel);
  const updateProfileFields = useModularSheetStore((s) => s.updateProfileFields);

  const [editing, setEditing] = useState(false);
  const [editingFields, setEditingFields] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name || '');
  const [archDraft, setArchDraft] = useState(profile.archetype || '');
  const [levelDraft, setLevelDraft] = useState<number>(Number(profile.level) || 1);
  const [descDraft, setDescDraft] = useState(profile.description || '');
  const [extraDrafts, setExtraDrafts] = useState<Array<{ key: string; value: string }>>([]);
  const [urlDraft, setUrlDraft] = useState(profile.imageUrl || '');
  const [wDraft, setWDraft] = useState<string>(
    profile.imgWidth !== undefined ? String(profile.imgWidth) : '',
  );
  const [hDraft, setHDraft] = useState<string>(
    profile.imgHeight !== undefined ? String(profile.imgHeight) : '',
  );
  const [xDraft, setXDraft] = useState<number>(profile.imgOffsetX ?? 0);
  const [yDraft, setYDraft] = useState<number>(profile.imgOffsetY ?? 0);
  const [scaleDraft, setScaleDraft] = useState<number>(
    Math.round((profile.imgScale ?? 1) * 100),
  );
  const [fitDraft, setFitDraft] = useState<'contain' | 'cover' | 'auto'>(
    profile.imgFit ?? 'contain',
  );

  const isTall = Boolean(profile.tall);
  const isBanner = profile.size === 'banner';
  const isLarge = profile.size === 'lg';
  const isSmall = profile.size === 'sm';

  const initialTextPos: 'bottom' | 'top' | 'side' | 'none' =
    profile.textPos ?? (isTall || isLarge || isBanner ? 'bottom' : 'side');

  const [textPosDraft, setTextPosDraft] = useState<'bottom' | 'top' | 'side' | 'none'>(
    initialTextPos,
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setUrlDraft(profile.imageUrl || '');
      setWDraft(profile.imgWidth !== undefined ? String(profile.imgWidth) : '');
      setHDraft(profile.imgHeight !== undefined ? String(profile.imgHeight) : '');
      setXDraft(profile.imgOffsetX ?? 0);
      setYDraft(profile.imgOffsetY ?? 0);
      setScaleDraft(Math.round((profile.imgScale ?? 1) * 100));
      setFitDraft(profile.imgFit ?? 'contain');
      setTextPosDraft(profile.textPos ?? (isTall || isLarge || isBanner ? 'bottom' : 'side'));
    }
  }, [
    editing,
    profile.imageUrl,
    profile.imgWidth,
    profile.imgHeight,
    profile.imgOffsetX,
    profile.imgOffsetY,
    profile.imgScale,
    profile.imgFit,
    profile.textPos,
    isTall,
    isLarge,
    isBanner,
  ]);

  const activeTextPos = editing
    ? textPosDraft
    : profile.textPos ?? (isTall || isLarge || isBanner ? 'bottom' : 'side');

  const filteredExtraFields = profile.extraFields.filter((field) => {
    const k = field.key.toLowerCase();
    return (
      k !== 'text_pos' &&
      k !== 'textpos' &&
      k !== 'pos' &&
      k !== 'layout' &&
      k !== 'alinhamento' &&
      k !== 'w' &&
      k !== 'h' &&
      k !== 'x' &&
      k !== 'y' &&
      k !== 'scale' &&
      k !== 'fit' &&
      k !== 'zoom' &&
      k !== 'theme' &&
      k !== 'tema'
    );
  });

  const hasAnyText =
    activeTextPos !== 'none' &&
    profile.size !== 'avatar-only' &&
    Boolean(
      profile.showName ||
      profile.showArchetype ||
      profile.showSystem ||
      profile.showLevel ||
      profile.showDesc ||
      filteredExtraFields.length > 0,
    );

  const handleOpenFieldsEdit = () => {
    setNameDraft(profile.name || '');
    setArchDraft(profile.archetype || '');
    setLevelDraft(Number(profile.level) || 1);
    setDescDraft(profile.description || '');
    setExtraDrafts(
      filteredExtraFields.map((f) => ({ key: f.key, value: String(f.value) })),
    );
    setEditingFields(true);
  };

  const handleSaveFields = () => {
    if (sheetId) {
      updateProfileFields(sheetId, {
        name: nameDraft.trim() || profile.name,
        archetype: archDraft.trim(),
        level: levelDraft,
        desc: descDraft.trim(),
        extraFields: extraDrafts.filter((f) => f.key.trim().length > 0),
      });
    }
    setEditingFields(false);
  };

  const isAvatarOnly = activeTextPos === 'none' || profile.size === 'avatar-only' || !hasAnyText;

  // Usa valores em edição ao vivo (live preview) quando o painel estiver aberto
  const activeRawUrl = editing ? urlDraft : profile.imageUrl;
  const resolvedSrc = resolveSheetImageUrl(activeRawUrl);
  const activeW = editing
    ? wDraft.trim() !== '' && !Number.isNaN(Number(wDraft))
      ? Number(wDraft)
      : undefined
    : profile.imgWidth;
  const activeH = editing
    ? hDraft.trim() !== '' && !Number.isNaN(Number(hDraft))
      ? Number(hDraft)
      : undefined
    : profile.imgHeight;
  const activeX = editing ? xDraft : (profile.imgOffsetX ?? 0);
  const activeY = editing ? yDraft : (profile.imgOffsetY ?? 0);
  const activeScale = editing ? scaleDraft / 100 : (profile.imgScale ?? 1);
  const activeFit = editing ? fitDraft : (profile.imgFit ?? 'contain');

  // Dimensões padrão caso o usuário não tenha especificado w/h em pixels
  const defaultBoxClasses = isBanner
    ? 'w-full h-48 rounded-xl'
    : isAvatarOnly || activeTextPos === 'bottom' || activeTextPos === 'top'
      ? isSmall
        ? 'w-24 h-24 rounded-xl mx-auto'
        : isTall
          ? 'w-full max-w-[280px] min-h-[260px] rounded-2xl mx-auto'
          : isLarge
            ? 'w-full max-w-[260px] min-h-[220px] rounded-2xl mx-auto'
            : 'w-48 min-h-[160px] rounded-2xl mx-auto'
      : isSmall
        ? 'w-16 h-20 rounded-xl shrink-0'
        : isTall
          ? 'w-48 min-h-[220px] rounded-2xl shrink-0'
          : isLarge
            ? 'w-40 min-h-[180px] rounded-2xl shrink-0'
            : 'w-32 min-h-[120px] rounded-xl shrink-0';

  const boxInlineStyle: React.CSSProperties = {};
  if (activeW !== undefined && activeW > 0) {
    boxInlineStyle.width = `${activeW}px`;
  }
  if (activeH !== undefined && activeH > 0) {
    boxInlineStyle.height = `${activeH}px`;
    boxInlineStyle.minHeight = `${activeH}px`;
  }

  const handleSave = () => {
    if (onUpdateProfileImage) {
      onUpdateProfileImage({
        imageUrl: urlDraft.trim(),
        w:
          wDraft.trim() !== '' && !Number.isNaN(Number(wDraft))
            ? Number(wDraft)
            : undefined,
        h:
          hDraft.trim() !== '' && !Number.isNaN(Number(hDraft))
            ? Number(hDraft)
            : undefined,
        x: xDraft,
        y: yDraft,
        scale: scaleDraft / 100,
        fit: fitDraft,
        textPos: textPosDraft,
      });
    }
    setEditing(false);
  };

  const handlePickLocalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const id = `sheet_avatar_${generateId()}`;
      const res = await fetch(
        `/api/handouts/upload-raw?id=${encodeURIComponent(id)}&name=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        },
      );
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setUrlDraft(data.url);
        }
      }
    } catch (err) {
      console.error('[ProfileSection] Falha ao enviar imagem local:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const imageBox = profile.showImage ? (
    <div
      onClick={() => {
        if (!onUpdateProfileImage || !isEditMode) return;
        setEditing((v) => !v);
      }}
      onDoubleClick={() => {
        if (!onUpdateProfileImage) return;
        setEditing((v) => !v);
      }}
      style={boxInlineStyle}
      className={`group relative overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center transition-colors ${
        onUpdateProfileImage && isEditMode ? 'cursor-pointer hover:border-indigo-500/40' : ''
      } ${defaultBoxClasses}`}
      title={
        onUpdateProfileImage
          ? isEditMode
            ? 'Clique para trocar imagem ou ajustar posição (px)'
            : 'Duplo clique para ajustar imagem'
          : undefined
      }
    >
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={profile.name || 'Personagem'}
          style={{
            transform: `translate(${activeX}px, ${activeY}px) scale(${activeScale})`,
            transformOrigin: 'center center',
          }}
          className={
            activeFit === 'cover'
              ? 'w-full h-full object-cover select-none'
              : activeFit === 'auto'
                ? 'w-full h-auto max-w-full select-none'
                : 'w-full h-full max-h-full object-contain select-none'
          }
        />
      ) : (
        <div className="flex flex-col items-center gap-1 text-zinc-600 group-hover:text-zinc-400 transition-colors p-3">
          <ImageIcon className={isSmall ? 'w-4 h-4' : 'w-6 h-6'} />
          {!isSmall && (
            <span className="text-[9px] font-bold uppercase tracking-wider">
              IMG
            </span>
          )}
        </div>
      )}
      {isEditMode && onUpdateProfileImage && !editing && (
        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
          <SlidersHorizontal className="w-4 h-4 text-white" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-white px-2 text-center">
            Ajustar / Trocar
          </span>
        </div>
      )}
    </div>
  ) : null;

  const textContent = hasAnyText ? (
    <div
      className={`min-w-0 w-full space-y-2 ${activeTextPos === 'bottom' || activeTextPos === 'top'
        ? 'text-center'
        : 'flex-1 text-left'
        }`}
    >
      {(profile.showName || profile.showLevel) && (
        <div
          className={`flex items-center gap-2 flex-wrap ${activeTextPos === 'bottom' || activeTextPos === 'top'
            ? 'justify-center'
            : 'justify-between'
            }`}
        >
          {profile.showName && profile.name && (
            <h2
              onDoubleClick={() => {
                if (sheetId) handleOpenFieldsEdit();
              }}
              className={`${isSmall ? 'text-sm' : isLarge ? 'text-xl' : 'text-base'
                } font-black text-zinc-100 tracking-tight break-words`}
              title={sheetId ? 'Duplo clique para editar perfil' : undefined}
            >
              {profile.name}
            </h2>
          )}
          <div className="flex items-center gap-1.5">
            {profile.showLevel && profile.level !== undefined && (
              <div
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold transition-colors"
                style={{
                  backgroundColor: 'var(--sheet-item-bg, #121214)',
                  borderColor: 'var(--sheet-item-border, #29292e)',
                  color: 'var(--sheet-accent-text, #c4b5fd)',
                }}
              >
                {isEditMode && sheetId && (
                  <button
                    type="button"
                    onClick={() =>
                      updateCharacterLevel(
                        sheetId,
                        Math.max(0, (Number(profile.level) || 1) - 1),
                      )
                    }
                    className="w-4 h-4 rounded hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
                    title="Diminuir Nível"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                )}
                <span className="px-0.5">NV {profile.level}</span>
                {isEditMode && sheetId && (
                  <button
                    type="button"
                    onClick={() =>
                      updateCharacterLevel(sheetId, (Number(profile.level) || 1) + 1)
                    }
                    className="w-4 h-4 rounded hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
                    title="Aumentar Nível"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}
            {isEditMode && sheetId && !editingFields && (
              <button
                type="button"
                onClick={handleOpenFieldsEdit}
                className="px-2 py-0.5 rounded-md border text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                style={{
                  backgroundColor: 'var(--sheet-item-bg, #121214)',
                  borderColor: 'var(--sheet-item-border, #29292e)',
                }}
                title="Editar dados do perfil"
              >
                <Pencil className="w-2.5 h-2.5" />
                Editar
              </button>
            )}
          </div>
        </div>
      )}

      {(profile.showArchetype || profile.showSystem) && (
        <div
          className={`flex flex-wrap items-center gap-1.5 ${activeTextPos === 'bottom' || activeTextPos === 'top'
            ? 'justify-center'
            : ''
            }`}
        >
          {profile.showArchetype && profile.archetype && (
            <span
              className="px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--sheet-accent-subtle, rgba(130,87,229,0.18))',
                borderColor: 'var(--sheet-accent-border, rgba(130,87,229,0.35))',
                color: 'var(--sheet-accent-text, #c4b5fd)',
              }}
            >
              {profile.archetype}
            </span>
          )}
          {profile.showSystem && profile.system && (
            <span
              className="px-2 py-0.5 rounded-md border text-[11px] text-zinc-400 transition-colors"
              style={{
                backgroundColor: 'var(--sheet-item-bg, #121214)',
                borderColor: 'var(--sheet-item-border, #29292e)',
              }}
            >
              {profile.system}
            </span>
          )}
        </div>
      )}

      {profile.showDesc && profile.description && (
        <p
          className={`text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap ${activeTextPos === 'bottom' || activeTextPos === 'top'
            ? 'text-center italic'
            : ''
            }`}
        >
          {profile.description}
        </p>
      )}

      {filteredExtraFields.length > 0 && (
        <div
          className={
            profile.display === 'list'
              ? 'space-y-1 pt-1'
              : profile.display === 'divided'
                ? 'divide-y divide-zinc-800/80 pt-1'
                : `flex flex-wrap gap-1.5 pt-1 ${activeTextPos === 'bottom' || activeTextPos === 'top'
                  ? 'justify-center'
                  : ''
                }`
          }
        >
          {filteredExtraFields.map((field) =>
            profile.display === 'list' || profile.display === 'divided' ? (
              <div
                key={field.key}
                className="flex items-center justify-between gap-2 py-1 text-xs"
              >
                <span className="text-zinc-500 capitalize">{field.label}</span>
                <span className="font-mono font-bold text-zinc-200">
                  {field.value}
                </span>
              </div>
            ) : (
              <div
                key={field.key}
                className="px-2 py-1 rounded-md border text-[11px] flex items-center gap-1.5 transition-colors"
                style={{
                  backgroundColor: 'var(--sheet-item-bg, #121214)',
                  borderColor: 'var(--sheet-item-border, #29292e)',
                }}
              >
                <span className="text-zinc-400 capitalize">{field.label}:</span>
                <span className="font-mono font-bold text-zinc-100">
                  {field.value}
                </span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="space-y-2">
      {profile.title && (
        <div className="px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            {profile.title}
          </span>
        </div>
      )}

      <div
        className={`relative rounded-xl border p-3.5 transition-colors ${activeTextPos === 'bottom' || isBanner
          ? 'flex flex-col items-center gap-3.5'
          : activeTextPos === 'top'
            ? 'flex flex-col items-center gap-3.5'
            : isAvatarOnly
              ? 'flex flex-col items-center justify-center'
              : 'flex flex-col sm:flex-row items-center gap-4'
          }`}
        style={{
          backgroundColor: 'var(--sheet-card-bg, #18181b)',
          borderColor: 'var(--sheet-card-border, #29292e)',
        }}
      >
        {activeTextPos === 'top' && textContent}
        {imageBox}
        {activeTextPos !== 'top' && textContent}
      </div>

      {/* Painel de Edição de Dados do Perfil (Nome, Nível, Classe, Descrição e Campos Extras) */}
      {editingFields && sheetId && (
        <div
          className="p-3 rounded-xl border space-y-2.5 transition-colors"
          style={{
            backgroundColor: 'var(--sheet-card-bg, #18181b)',
            borderColor: 'var(--sheet-card-border, #29292e)',
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: 'var(--sheet-accent-text, #c4b5fd)' }}
            >
              <Pencil className="w-3 h-3" />
              Editar Perfil
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase">
                Nome
              </label>
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="w-full rounded-lg border px-2.5 py-1 text-xs text-white focus:outline-none"
                style={{
                  backgroundColor: 'var(--sheet-item-bg, #121214)',
                  borderColor: 'var(--sheet-item-border, #29292e)',
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase">
                Arquétipo / Origem
              </label>
              <input
                type="text"
                value={archDraft}
                onChange={(e) => setArchDraft(e.target.value)}
                className="w-full rounded-lg border px-2.5 py-1 text-xs text-white focus:outline-none"
                style={{
                  backgroundColor: 'var(--sheet-item-bg, #121214)',
                  borderColor: 'var(--sheet-item-border, #29292e)',
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase">
                Nível
              </label>
              <input
                type="number"
                value={levelDraft}
                onChange={(e) => setLevelDraft(Number(e.target.value) || 0)}
                className="w-full rounded-lg border px-2.5 py-1 text-xs font-mono text-white focus:outline-none"
                style={{
                  backgroundColor: 'var(--sheet-item-bg, #121214)',
                  borderColor: 'var(--sheet-item-border, #29292e)',
                }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-bold uppercase">
              Descrição
            </label>
            <input
              type="text"
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              placeholder="Descrição curta..."
              className="w-full rounded-lg border px-2.5 py-1 text-xs text-white focus:outline-none"
              style={{
                backgroundColor: 'var(--sheet-item-bg, #121214)',
                borderColor: 'var(--sheet-item-border, #29292e)',
              }}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-zinc-400 font-bold uppercase">
                Campos Extras
              </label>
              <button
                type="button"
                onClick={() =>
                  setExtraDrafts((prev) => [...prev, { key: '', value: '' }])
                }
                className="px-2 py-0.5 rounded border text-[10px] font-bold text-zinc-300 hover:text-white flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--sheet-item-bg, #121214)',
                  borderColor: 'var(--sheet-item-border, #29292e)',
                }}
              >
                <Plus className="w-2.5 h-2.5" />
                Campo
              </button>
            </div>
            {extraDrafts.map((f, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={f.key}
                  onChange={(e) =>
                    setExtraDrafts((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, key: e.target.value } : item,
                      ),
                    )
                  }
                  placeholder="Campo (ex: xp)"
                  className="w-1/3 rounded-lg border px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none"
                  style={{
                    backgroundColor: 'var(--sheet-item-bg, #121214)',
                    borderColor: 'var(--sheet-item-border, #29292e)',
                  }}
                />
                <input
                  type="text"
                  value={f.value}
                  onChange={(e) =>
                    setExtraDrafts((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, value: e.target.value } : item,
                      ),
                    )
                  }
                  placeholder="Valor"
                  className="flex-1 rounded-lg border px-2 py-1 text-xs text-white focus:outline-none"
                  style={{
                    backgroundColor: 'var(--sheet-item-bg, #121214)',
                    borderColor: 'var(--sheet-item-border, #29292e)',
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setExtraDrafts((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="p-1 rounded text-zinc-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setEditingFields(false)}
              className="px-2.5 py-1 rounded-lg border text-xs text-zinc-400 hover:text-white"
              style={{
                backgroundColor: 'var(--sheet-item-bg, #121214)',
                borderColor: 'var(--sheet-item-border, #29292e)',
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveFields}
              className="px-3 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1"
              style={{ backgroundColor: 'var(--sheet-accent, #8257e5)' }}
            >
              <Check className="w-3 h-3" />
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Painel de Edição de Caminho Local / URL + Ajuste Pixel-Perfect (w, h, x, y, zoom, fit, layout) */}
      {editing && onUpdateProfileImage && (
        <div
          className="p-3 rounded-xl border space-y-3 shadow-xl transition-colors"
          style={{
            backgroundColor: 'var(--sheet-card-bg, #18181b)',
            borderColor: 'var(--sheet-card-border, #29292e)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Imagem & Ajuste Pixel-Perfect
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setWDraft('');
                  setHDraft('');
                  setXDraft(0);
                  setYDraft(0);
                  setScaleDraft(100);
                  setFitDraft('contain');
                  setTextPosDraft('bottom');
                }}
                className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                title="Resetar posição e tamanho"
              >
                <RotateCcw className="w-3 h-3" />
                Resetar
              </button>
            </div>
          </div>

          {/* Linha 1: URL ou Caminho do PC + Botão Escolher Arquivo */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder='URL (https://...) ou caminho do PC (C:\Users\...\img.png)'
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500/50"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePickLocalFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 shrink-0"
              title="Escolher arquivo de imagem do seu computador"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isUploading ? 'Enviando...' : 'PC'}</span>
            </button>
          </div>

          {/* Linha 2: Disposição do Texto */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-zinc-500 mr-1">
              Texto:
            </span>
            {(
              [
                { id: 'bottom', label: 'Texto Embaixo' },
                { id: 'top', label: 'Texto Em Cima' },
                { id: 'side', label: 'Ao Lado' },
                { id: 'none', label: 'Apenas Imagem' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTextPosDraft(opt.id)}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${textPosDraft === opt.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Linha 3: Modo de Encaixe */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-zinc-500 mr-1">
              Encaixe:
            </span>
            {(
              [
                { id: 'contain', label: 'Encaixar Completa (Sem Cortar)' },
                { id: 'auto', label: 'Altura Livre' },
                { id: 'cover', label: 'Preencher (Crop)' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFitDraft(opt.id)}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${fitDraft === opt.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Linha 3: Controles Pixel por Pixel (Caixa W/H, Offset X/Y e Zoom) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
            {/* Deslocamento Vertical Y (px) */}
            <div className="bg-zinc-950 border border-zinc-800/90 rounded-lg p-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>Posição Y (Vertical)</span>
                <span className="font-mono font-bold text-indigo-300">
                  {yDraft}px
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setYDraft((v) => v - 10)}
                  className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 font-mono text-[10px] text-zinc-300"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => setYDraft((v) => v - 1)}
                  className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 font-mono text-[10px] text-zinc-300"
                >
                  -1
                </button>
                <input
                  type="number"
                  value={yDraft}
                  onChange={(e) => setYDraft(Number(e.target.value) || 0)}
                  className="w-full text-center bg-zinc-900 border border-zinc-800 rounded py-0.5 font-mono text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => setYDraft((v) => v + 1)}
                  className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 font-mono text-[10px] text-zinc-300"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setYDraft((v) => v + 10)}
                  className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 font-mono text-[10px] text-zinc-300"
                >
                  +10
                </button>
              </div>
            </div>

            {/* Deslocamento Horizontal X (px) */}
            <div className="bg-zinc-950 border border-zinc-800/90 rounded-lg p-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>Posição X (Horiz.)</span>
                <span className="font-mono font-bold text-indigo-300">
                  {xDraft}px
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setXDraft((v) => v - 10)}
                  className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 font-mono text-[10px] text-zinc-300"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => setXDraft((v) => v - 1)}
                  className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 font-mono text-[10px] text-zinc-300"
                >
                  -1
                </button>
                <input
                  type="number"
                  value={xDraft}
                  onChange={(e) => setXDraft(Number(e.target.value) || 0)}
                  className="w-full text-center bg-zinc-900 border border-zinc-800 rounded py-0.5 font-mono text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => setXDraft((v) => v + 1)}
                  className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 font-mono text-[10px] text-zinc-300"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setXDraft((v) => v + 10)}
                  className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 font-mono text-[10px] text-zinc-300"
                >
                  +10
                </button>
              </div>
            </div>

            {/* Zoom / Escala (%) */}
            <div className="bg-zinc-950 border border-zinc-800/90 rounded-lg p-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>Zoom / Escala</span>
                <span className="font-mono font-bold text-indigo-300">
                  {scaleDraft}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setScaleDraft((v) => Math.max(10, v - 5))}
                  className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 font-mono text-[10px] text-zinc-300"
                >
                  -5%
                </button>
                <input
                  type="number"
                  value={scaleDraft}
                  onChange={(e) =>
                    setScaleDraft(Math.max(10, Number(e.target.value) || 100))
                  }
                  className="w-full text-center bg-zinc-900 border border-zinc-800 rounded py-0.5 font-mono text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => setScaleDraft((v) => v + 5)}
                  className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 font-mono text-[10px] text-zinc-300"
                >
                  +5%
                </button>
              </div>
            </div>

            {/* Largura da Moldura (px) */}
            <div className="bg-zinc-950 border border-zinc-800/90 rounded-lg p-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>Largura Caixa (w)</span>
                <span className="font-mono text-zinc-500">
                  {wDraft ? `${wDraft}px` : 'Auto'}
                </span>
              </div>
              <input
                type="number"
                placeholder="Auto (ex: 160)"
                value={wDraft}
                onChange={(e) => setWDraft(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 font-mono text-xs text-white"
              />
            </div>

            {/* Altura da Moldura (px) */}
            <div className="bg-zinc-950 border border-zinc-800/90 rounded-lg p-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>Altura Caixa (h)</span>
                <span className="font-mono text-zinc-500">
                  {hDraft ? `${hDraft}px` : 'Auto'}
                </span>
              </div>
              <input
                type="number"
                placeholder="Auto (ex: 240)"
                value={hDraft}
                onChange={(e) => setHDraft(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 font-mono text-xs text-white"
              />
            </div>

            {/* Botões Salvar / Cancelar */}
            <div className="flex items-end justify-end gap-1.5">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600/25 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/35 text-xs font-bold flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="py-1.5 px-2.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs"
                title="Cancelar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
