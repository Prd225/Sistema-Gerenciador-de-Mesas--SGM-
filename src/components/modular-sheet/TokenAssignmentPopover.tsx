import { useState, useRef, useEffect } from 'react';
import { useTokenStore } from '@/store/useTokenStore';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import { Users, Check, Search, X, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TokenAssignmentPopoverProps {
  sheetId: string;
  assignedTokenIds: string[];
  compact?: boolean;
}

export function TokenAssignmentPopover({
  sheetId,
  assignedTokenIds,
  compact = false,
}: TokenAssignmentPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const tokens = useTokenStore((state) => state.tokens);
  const sheets = useModularSheetStore((state) => state.sheets);
  const toggleTokenAssignment = useModularSheetStore(
    (state) => state.toggleTokenAssignment,
  );
  const setAssignedTokens = useModularSheetStore(
    (state) => state.setAssignedTokens,
  );

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const assignedTokens = tokens.filter((t) => assignedTokenIds.includes(t.id));

  const filteredTokens = tokens.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (t.fullName || '').toLowerCase().includes(q) ||
      (t.name || '').toLowerCase().includes(q)
    );
  });

  const findOtherOwnerSheet = (tokenId: string) =>
    sheets.find(
      (s) => s.id !== sheetId && s.assignedTokenIds.includes(tokenId),
    );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 transition-colors ${
          compact ? 'h-7 px-2 rounded-md text-[11px]' : 'h-8 px-3 rounded-md text-xs'
        } font-semibold border ${
          assignedTokens.length > 0
            ? 'border-[#8257e5]/60 bg-[#8257e5]/15 text-[#e1e1e6] hover:bg-[#8257e5]/25'
            : 'border-[#323238] bg-[#121214] text-[#a8a8b3] hover:text-[#e1e1e6] hover:border-[#8257e5]/40'
        }`}
        title="Atribuir esta ficha a um ou mais tokens da mesa"
      >
        <Users className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
        <span className="whitespace-nowrap">
          {compact ? (
            assignedTokens.length === 0 ? 'Tokens' : `${assignedTokens.length} Token(s)`
          ) : (
            assignedTokens.length === 0
              ? 'Atribuir a Tokens'
              : assignedTokens.length === 1
                ? '1 Token Vinculado'
                : `${assignedTokens.length} Tokens Vinculados`
          )}
        </span>

        {assignedTokens.length > 0 && !compact && (
          <div className="flex items-center -space-x-1.5 ml-0.5">
            {assignedTokens.slice(0, 4).map((t) => (
              <div
                key={t.id}
                className="w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold overflow-hidden shrink-0"
                style={{
                  backgroundColor: t.colorFill || '#202024',
                  borderColor: t.colorBorder || '#ffd700',
                  color: t.colorText || '#ffffff',
                }}
                title={t.fullName || t.name}
              >
                {t.imageUrl ? (
                  <img
                    src={t.imageUrl}
                    alt={t.fullName || t.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (t.name || '?').slice(0, 2)
                )}
              </div>
            ))}
            {assignedTokens.length > 4 && (
              <div className="w-5 h-5 rounded-full bg-[#323238] border border-[#121214] flex items-center justify-center text-[9px] font-bold text-[#e1e1e6]">
                +{assignedTokens.length - 4}
              </div>
            )}
          </div>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-10 z-50 w-auto sm:w-80 max-w-[360px] mx-auto sm:mx-0 rounded-xl border border-[#323238] bg-[#18181b] shadow-2xl p-3 text-[#e1e1e6]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#323238]">
            <div>
              <h4 className="text-xs font-bold text-[#ffd700] uppercase tracking-wider">
                Vincular Ficha a Tokens
              </h4>
              <p className="text-[11px] text-[#a8a8b3]">
                Selecione quantos tokens usarão esta ficha
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[#a8a8b3] hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {tokens.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#a8a8b3]">
              Nenhum token criado nesta cena ainda.
              <br />
              Use <span className="text-[#e1e1e6] font-semibold">Criar Token</span> no topo da mesa para adicionar tokens.
            </div>
          ) : (
            <>
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-[#a8a8b3] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar tokens..."
                  className="h-7 pl-8 text-xs bg-[#121214] border-[#323238] text-[#e1e1e6]"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {filteredTokens.map((t) => {
                  const isAssigned = assignedTokenIds.includes(t.id);
                  const otherSheet = findOtherOwnerSheet(t.id);
                  const onMap = t.x !== null && t.y !== null;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTokenAssignment(sheetId, t.id)}
                      className={`w-full flex items-center justify-between gap-2 p-2 rounded-md border text-left transition-colors ${
                        isAssigned
                          ? 'border-[#8257e5] bg-[#8257e5]/15'
                          : 'border-[#29292e] bg-[#121214] hover:bg-[#202024]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0"
                          style={{
                            backgroundColor: t.colorFill || '#202024',
                            borderColor: t.colorBorder || '#ffd700',
                            color: t.colorText || '#ffffff',
                          }}
                        >
                          {t.imageUrl ? (
                            <img
                              src={t.imageUrl}
                              alt={t.fullName || t.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            t.name
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#e1e1e6] truncate flex items-center gap-1">
                            <span className="truncate">
                              {t.fullName || t.name}
                            </span>
                            {onMap && (
                              <span
                                title="Posicionado no Mapa"
                                className="inline-flex items-center text-[10px] text-emerald-400"
                              >
                                <MapPin className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          {otherSheet ? (
                            <div className="text-[10px] text-amber-400 truncate">
                              Em: {otherSheet.name} (clique p/ transferir)
                            </div>
                          ) : (
                            <div className="text-[10px] text-[#8d8d99]">
                              Sigla: {t.name}
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                          isAssigned
                            ? 'bg-[#8257e5] border-[#8257e5] text-white'
                            : 'border-[#323238] bg-[#202024]'
                        }`}
                      >
                        {isAssigned && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#323238]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAssignedTokens(sheetId, [])}
                  disabled={assignedTokenIds.length === 0}
                  className="h-6 px-2 text-[11px] text-[#a8a8b3] hover:text-white"
                >
                  Desvincular Todos
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setAssignedTokens(
                      sheetId,
                      tokens.map((t) => t.id),
                    )
                  }
                  className="h-6 px-2 text-[11px] text-[#c4b5fd] hover:text-white"
                >
                  Selecionar Todos ({tokens.length})
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

