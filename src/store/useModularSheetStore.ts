import { create } from 'zustand';
import { generateId } from '@/lib/uuid';
import { triggerAutoSave } from '@/lib/saveHelpers';
import { isPlayerMode } from '@/lib/roomRole';
import { SHEET_DSL_PRESETS, compileSheetDSL } from '@/lib/sheet-dsl';
import type { SheetRuntimeOverrides } from '@/lib/sheet-dsl';

export type ModularSheetPresetChoice = 'ordem_paranormal' | 'tormenta20' | 'blank';

export interface ModularSheetRecord {
  id: string;
  name: string;
  dslSource: string;
  presetId?: ModularSheetPresetChoice;
  assignedTokenIds: string[];
  runtimeOverrides: SheetRuntimeOverrides;
  createdAt: number;
  updatedAt: number;
}

export const BLANK_SHEET_DSL_TEMPLATE = `@meta "Novo Personagem" [archetype: "Aventureiro", system: "Sistema Customizado", level: 1, theme: "dark"]

@profile "Novo Personagem" [col1, md]
  archetype: "Aventureiro"
  level: 1

@attr [col1, cards]
  FOR "Força"      := 2
  DES "Destreza"   := 2
  CON "Vigor"      := 2
  INT "Intelecto"  := 1

@stat [col1]
  DEF "Defesa" = 10 + DES
  Deslocamento := 9

@res [col2]
  PV "Pontos de Vida": 20 / (20 + CON * 2) [red]
  PE "Energia": 10 / 10                    [blue]

@counter [col2, segments]
  acao_esp "Ação Especial": 2/3 [segments, amber]

@turn [col2, reset: "round"]
  padrao "Padrão": slots(1 / 1)
  movimento "Movimento": slots(1 / 1)
  reacao "Reação": slots(1 / 1)

@skill [col2, roll: 1d20 + attr + self]
  Luta (FOR)        := 2
  Percepcao (INT)   := 2
  Furtividade (DES) := 0

@inv [col1]
  unit = "espacos"
  max_load = FOR * 5

  item "Arma Principal" [weight: 1, qty: 1, !equipped]
    action "Ataque Básico" [type: "Padrão"]
      test: 1d20 + FOR + Luta
      damage: 1d8 + FOR
      desc: "Ataque corpo a corpo padrão."

@ability [col2]
  ability "Fôlego Renovado" [type: "Livre", cost: 2 PE]
    heal: 1d8 + CON
    desc: "Recupera fôlego em combate."`;

function replaceMetaTitleInDSL(dslSource: string, newTitle: string): string {
  const safeTitle = newTitle.replace(/"/g, '\\"').trim();
  if (!safeTitle) return dslSource;
  if (/@meta\s+"[^"]*"/.test(dslSource)) {
    return dslSource.replace(/@meta\s+"[^"]*"/, `@meta "${safeTitle}"`);
  }
  return `@meta "${safeTitle}"\n\n${dslSource}`;
}

interface ModularSheetState {
  sheets: ModularSheetRecord[];
  isOpen: boolean;
  view: 'list' | 'create' | 'sheet';
  activeSheetId: string | null;
  viewMode: 'visual' | 'split' | 'code';

  // Navegação da Janela
  openManager: (initialView?: 'list' | 'create') => void;
  closeManager: () => void;
  setView: (view: 'list' | 'create' | 'sheet') => void;
  setViewMode: (mode: 'visual' | 'split' | 'code') => void;
  openSheet: (sheetId: string) => void;
  openSheetForToken: (tokenId: string) => boolean;
  getSheetByTokenId: (tokenId: string) => ModularSheetRecord | undefined;

  // CRUD de Fichas
  createSheet: (params: {
    name?: string;
    presetId: ModularSheetPresetChoice;
    customDsl?: string;
    assignTokenIds?: string[];
  }) => ModularSheetRecord;
  updateSheetSource: (sheetId: string, dslSource: string) => void;
  renameSheet: (sheetId: string, name: string) => void;
  duplicateSheet: (sheetId: string) => ModularSheetRecord | null;
  deleteSheet: (sheetId: string) => void;

  // Atribuição a X Tokens
  toggleTokenAssignment: (sheetId: string, tokenId: string) => void;
  setAssignedTokens: (sheetId: string, tokenIds: string[]) => void;

  // Automações Reativas em Tempo de Jogo (Runtime Overrides)
  setResourceCurrent: (sheetId: string, resId: string, current: number) => void;
  setResourceTemp: (sheetId: string, resId: string, temp: number) => void;
  cycleTrackBox: (
    sheetId: string,
    resId: string,
    boxIndex: number,
    currentBoxes: string[],
    states: string[],
  ) => void;
  setTurnSlotCurrent: (sheetId: string, slotId: string, current: number) => void;
  applyTurnConversion: (
    sheetId: string,
    costs: Array<{ slotId: string; currentAvailable: number; spend: number }>,
  ) => boolean;
  resetTurnSlots: (sheetId: string) => void;
  setItemState: (
    sheetId: string,
    itemId: string,
    state: 'equipped' | 'carried' | 'stash',
  ) => void;
  setItemQty: (sheetId: string, itemId: string, qty: number) => void;
  setToggleState: (sheetId: string, targetId: string, active: boolean) => void;
  setDiagramNodeResource: (
    sheetId: string,
    nodeId: string,
    resId: string,
    current: number,
  ) => void;
  // Slots & Segmentos (Mausritter / Trilhas) e Abas
  cycleSlotState: (sheetId: string, slotId: string, currentState: 'empty' | 'filled' | 'damaged' | 'locked') => void;
  setSlotState: (sheetId: string, slotId: string, state: 'empty' | 'filled' | 'damaged' | 'locked') => void;
  setSlotCurrent: (sheetId: string, slotId: string, current: number) => void;
  setSlotContent: (sheetId: string, slotId: string, content: string) => void;
  setCounterCurrent: (sheetId: string, counterId: string, current: number) => void;
  setActiveTab: (sheetId: string, tabId: string) => void;
  resetRuntimeOverrides: (sheetId: string) => void;
}

export const useModularSheetStore = create<ModularSheetState>((set, get) => ({
  sheets: [],
  isOpen: false,
  view: 'list',
  activeSheetId: null,
  viewMode: 'visual',

  openManager: (initialView = 'list') => {
    if (isPlayerMode()) return;
    set({
      isOpen: true,
      view: initialView,
      activeSheetId: initialView === 'list' ? null : get().activeSheetId,
    });
  },

  closeManager: () => set({ isOpen: false }),

  setView: (view) => set({ view }),

  setViewMode: (viewMode) => set({ viewMode }),

  openSheet: (sheetId) => {
    if (isPlayerMode()) return;
    const exists = get().sheets.some((s) => s.id === sheetId);
    if (!exists) return;
    set({
      isOpen: true,
      view: 'sheet',
      activeSheetId: sheetId,
    });
  },

  getSheetByTokenId: (tokenId) => {
    return get().sheets.find((s) => s.assignedTokenIds.includes(tokenId));
  },

  openSheetForToken: (tokenId) => {
    if (isPlayerMode()) return false;
    const found = get().sheets.find((s) => s.assignedTokenIds.includes(tokenId));
    if (found) {
      set({
        isOpen: true,
        view: 'sheet',
        activeSheetId: found.id,
      });
      return true;
    }
    set({
      isOpen: true,
      view: 'list',
      activeSheetId: null,
    });
    return false;
  },

  createSheet: ({ name, presetId, customDsl, assignTokenIds = [] }) => {
    let baseSource = BLANK_SHEET_DSL_TEMPLATE;
    let defaultName = 'Nova Ficha Modular';

    if (presetId === 'ordem_paranormal') {
      baseSource = SHEET_DSL_PRESETS.ordem_paranormal.source;
      defaultName = 'Arthur Cervero (Ordem Paranormal)';
    } else if (presetId === 'tormenta20') {
      baseSource = SHEET_DSL_PRESETS.tormenta20.source;
      defaultName = 'Valeros (Tormenta 20)';
    }

    if (customDsl !== undefined) {
      baseSource = customDsl;
    }

    const trimmedName = name?.trim();
    const finalSource = trimmedName
      ? replaceMetaTitleInDSL(baseSource, trimmedName)
      : baseSource;

    const compiled = compileSheetDSL(finalSource);
    const resolvedName =
      trimmedName ||
      (compiled.meta.name && compiled.meta.name !== 'Sem Nome'
        ? compiled.meta.name
        : defaultName);

    const now = Date.now();
    const newRecord: ModularSheetRecord = {
      id: generateId(),
      name: resolvedName,
      dslSource: finalSource,
      presetId,
      assignedTokenIds: [...assignTokenIds],
      runtimeOverrides: {},
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      sheets: [
        ...state.sheets.map((s) =>
          assignTokenIds.length > 0
            ? {
              ...s,
              assignedTokenIds: s.assignedTokenIds.filter(
                (tid) => !assignTokenIds.includes(tid),
              ),
            }
            : s,
        ),
        newRecord,
      ],
      activeSheetId: newRecord.id,
      view: 'sheet',
      isOpen: true,
    }));

    triggerAutoSave();
    return newRecord;
  },

  updateSheetSource: (sheetId, dslSource) => {
    const compiled = compileSheetDSL(dslSource);
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        const nextName =
          compiled.meta.name && compiled.meta.name !== 'Sem Nome'
            ? compiled.meta.name
            : s.name;
        return {
          ...s,
          name: nextName,
          dslSource,
          updatedAt: Date.now(),
        };
      }),
    }));
    triggerAutoSave();
  },

  renameSheet: (sheetId, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((state) => ({
      sheets: state.sheets.map((s) =>
        s.id === sheetId
          ? {
            ...s,
            name: trimmed,
            dslSource: replaceMetaTitleInDSL(s.dslSource, trimmed),
            updatedAt: Date.now(),
          }
          : s,
      ),
    }));
    triggerAutoSave();
  },

  duplicateSheet: (sheetId) => {
    const orig = get().sheets.find((s) => s.id === sheetId);
    if (!orig) return null;
    const copyName = `${orig.name} (Cópia)`;
    const now = Date.now();
    const copy: ModularSheetRecord = {
      id: generateId(),
      name: copyName,
      dslSource: replaceMetaTitleInDSL(orig.dslSource, copyName),
      presetId: orig.presetId,
      assignedTokenIds: [],
      runtimeOverrides: JSON.parse(JSON.stringify(orig.runtimeOverrides || {})),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      sheets: [...state.sheets, copy],
    }));
    triggerAutoSave();
    return copy;
  },

  deleteSheet: (sheetId) => {
    set((state) => {
      const nextSheets = state.sheets.filter((s) => s.id !== sheetId);
      const isDeletingActive = state.activeSheetId === sheetId;
      return {
        sheets: nextSheets,
        activeSheetId: isDeletingActive ? null : state.activeSheetId,
        view: isDeletingActive ? 'list' : state.view,
      };
    });
    triggerAutoSave();
  },

  toggleTokenAssignment: (sheetId, tokenId) => {
    set((state) => {
      const targetSheet = state.sheets.find((s) => s.id === sheetId);
      if (!targetSheet) return state;
      const isCurrentlyAssigned = targetSheet.assignedTokenIds.includes(tokenId);

      return {
        sheets: state.sheets.map((s) => {
          if (s.id === sheetId) {
            return {
              ...s,
              assignedTokenIds: isCurrentlyAssigned
                ? s.assignedTokenIds.filter((id) => id !== tokenId)
                : [...s.assignedTokenIds, tokenId],
              updatedAt: Date.now(),
            };
          }
          // Se estiver atribuindo a esta ficha, desvincula de outras fichas anteriores
          if (!isCurrentlyAssigned && s.assignedTokenIds.includes(tokenId)) {
            return {
              ...s,
              assignedTokenIds: s.assignedTokenIds.filter((id) => id !== tokenId),
              updatedAt: Date.now(),
            };
          }
          return s;
        }),
      };
    });
    triggerAutoSave();
  },

  setAssignedTokens: (sheetId, tokenIds) => {
    const uniqueIds = Array.from(new Set(tokenIds));
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id === sheetId) {
          return {
            ...s,
            assignedTokenIds: uniqueIds,
            updatedAt: Date.now(),
          };
        }
        return {
          ...s,
          assignedTokenIds: s.assignedTokenIds.filter((id) => !uniqueIds.includes(id)),
        };
      }),
    }));
    triggerAutoSave();
  },

  setResourceCurrent: (sheetId, resId, current) => {
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        const prevRes = s.runtimeOverrides.resources?.[resId] ?? {};
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: {
            ...s.runtimeOverrides,
            resources: {
              ...(s.runtimeOverrides.resources ?? {}),
              [resId]: { ...prevRes, current },
            },
          },
        };
      }),
    }));
    triggerAutoSave();
  },

  setResourceTemp: (sheetId, resId, temp) => {
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        const prevRes = s.runtimeOverrides.resources?.[resId] ?? {};
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: {
            ...s.runtimeOverrides,
            resources: {
              ...(s.runtimeOverrides.resources ?? {}),
              [resId]: { ...prevRes, temp: Math.max(0, temp) },
            },
          },
        };
      }),
    }));
    triggerAutoSave();
  },

  cycleTrackBox: (sheetId, resId, boxIndex, currentBoxes, states) => {
    const validStates = states.length > 0 ? states : ['.', '/', 'X'];
    const curSym = currentBoxes[boxIndex] ?? validStates[0];
    const curIdx = validStates.indexOf(curSym);
    const nextSym = validStates[(curIdx + 1) % validStates.length];
    const nextBoxes = [...currentBoxes];
    nextBoxes[boxIndex] = nextSym;
    const emptySym = validStates[0];
    const filledCount = nextBoxes.filter((b) => b !== emptySym).length;

    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        const prevRes = s.runtimeOverrides.resources?.[resId] ?? {};
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: {
            ...s.runtimeOverrides,
            resources: {
              ...(s.runtimeOverrides.resources ?? {}),
              [resId]: { ...prevRes, boxes: nextBoxes, current: filledCount },
            },
          },
        };
      }),
    }));
    triggerAutoSave();
  },

  setTurnSlotCurrent: (sheetId, slotId, current) => {
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: {
            ...s.runtimeOverrides,
            turnSlots: {
              ...(s.runtimeOverrides.turnSlots ?? {}),
              [slotId]: { current: Math.max(0, current) },
            },
          },
        };
      }),
    }));
    triggerAutoSave();
  },

  applyTurnConversion: (sheetId, costs) => {
    const canAfford = costs.every((c) => c.currentAvailable >= c.spend);
    if (!canAfford) return false;

    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        const nextTurnSlots = { ...(s.runtimeOverrides.turnSlots ?? {}) };
        for (const c of costs) {
          nextTurnSlots[c.slotId] = { current: Math.max(0, c.currentAvailable - c.spend) };
        }
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: {
            ...s.runtimeOverrides,
            turnSlots: nextTurnSlots,
          },
        };
      }),
    }));
    triggerAutoSave();
    return true;
  },

  resetTurnSlots: (sheetId) => {
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        const nextOverrides = { ...s.runtimeOverrides };
        delete nextOverrides.turnSlots;
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: nextOverrides,
        };
      }),
    }));
    triggerAutoSave();
  },

  setItemState: (sheetId, itemId, itemState) => {
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        const prevItem = s.runtimeOverrides.itemStates?.[itemId] ?? {};
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: {
            ...s.runtimeOverrides,
            itemStates: {
              ...(s.runtimeOverrides.itemStates ?? {}),
              [itemId]: { ...prevItem, state: itemState },
            },
          },
        };
      }),
    }));
    triggerAutoSave();
  },

  setItemQty: (sheetId, itemId, qty) => {
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        const prevItem = s.runtimeOverrides.itemStates?.[itemId] ?? {};
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: {
            ...s.runtimeOverrides,
            itemStates: {
              ...(s.runtimeOverrides.itemStates ?? {}),
              [itemId]: { ...prevItem, qty: Math.max(0, qty) },
            },
          },
        };
      }),
    }));
    triggerAutoSave();
  },

  setToggleState: (sheetId, targetId, active) => {
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: {
            ...s.runtimeOverrides,
            toggles: {
              ...(s.runtimeOverrides.toggles ?? {}),
              [targetId]: active,
            },
          },
        };
      }),
    }));
    triggerAutoSave();
  },

  setDiagramNodeResource: (sheetId, nodeId, resId, current) => {
    const key = `${nodeId}.${resId}`;
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: {
            ...s.runtimeOverrides,
            diagramResources: {
              ...(s.runtimeOverrides.diagramResources ?? {}),
              [key]: { current: Math.max(0, current) },
            },
          },
        };
      }),
    }));
    triggerAutoSave();
  },

  cycleSlotState: (sheetId, slotId, currentState) => {
    const cycleMap: Record<string, 'empty' | 'filled' | 'damaged' | 'locked'> = {
      empty: 'filled',
      filled: 'damaged',
      damaged: 'locked',
      locked: 'empty',
    };
    const nextState = cycleMap[currentState] ?? 'filled';
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        const prevSlot = s.runtimeOverrides.slots?.[slotId] ?? {};
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: {
            ...s.runtimeOverrides,
            slots: {
              ...(s.runtimeOverrides.slots ?? {}),
              [slotId]: { ...prevSlot, state: nextState },
            },
          },
        };
      }),
    }));
    triggerAutoSave();
  },

  setSlotState: (sheetId, slotId, slotState) => {
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        const prevSlot = s.runtimeOverrides.slots?.[slotId] ?? {};
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: {
            ...s.runtimeOverrides,
            slots: {
              ...(s.runtimeOverrides.slots ?? {}),
              [slotId]: { ...prevSlot, state: slotState },
            },
          },
        };
      }),
    }));
    triggerAutoSave();
  },

  setSlotCurrent: (sheetId, slotId, current) => {
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        const prevSlot = s.runtimeOverrides.slots?.[slotId] ?? {};
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: {
            ...s.runtimeOverrides,
            slots: {
              ...(s.runtimeOverrides.slots ?? {}),
              [slotId]: { ...prevSlot, current: Math.max(0, current) },
            },
          },
        };
      }),
    }));
    triggerAutoSave();
  },

  setSlotContent: (sheetId, slotId, content) => {
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        const prevSlot = s.runtimeOverrides.slots?.[slotId] ?? {};
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: {
            ...s.runtimeOverrides,
            slots: {
              ...(s.runtimeOverrides.slots ?? {}),
              [slotId]: { ...prevSlot, content },
            },
          },
        };
      }),
    }));
    triggerAutoSave();
  },

  setCounterCurrent: (sheetId, counterId, current) => {
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: {
            ...s.runtimeOverrides,
            counters: {
              ...(s.runtimeOverrides.counters ?? {}),
              [counterId]: { current: Math.max(0, current) },
            },
          },
        };
      }),
    }));
    triggerAutoSave();
  },

  setActiveTab: (sheetId, tabId) => {
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        return {
          ...s,
          updatedAt: Date.now(),
          runtimeOverrides: {
            ...s.runtimeOverrides,
            activeTab: tabId,
          },
        };
      }),
    }));
    triggerAutoSave();
  },

  resetRuntimeOverrides: (sheetId) => {
    set((state) => ({
      sheets: state.sheets.map((s) =>
        s.id === sheetId
          ? {
            ...s,
            runtimeOverrides: {},
            updatedAt: Date.now(),
          }
          : s,
      ),
    }));
    triggerAutoSave();
  },
}));

