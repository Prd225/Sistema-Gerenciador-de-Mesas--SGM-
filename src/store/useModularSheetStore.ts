import { create } from 'zustand';
import { generateId } from '@/lib/uuid';
import { triggerAutoSave } from '@/lib/saveHelpers';
import { isPlayerMode } from '@/lib/roomRole';
import { SHEET_DSL_PRESETS, compileSheetDSL, DIRECTIVE_ALIASES } from '@/lib/sheet-dsl';
import type { SheetRuntimeOverrides } from '@/lib/sheet-dsl';

export type ModularSheetPresetChoice = 'ordem_paranormal' | 'tormenta20' | 'mausritter' | 'blank';

export interface ModularSheetRecord {
  id: string;
  name: string;
  dslSource: string;
  logicSource?: string; // Folha Lógica da DSL (compartilha o mesmo escopo reativo)
  presetId?: ModularSheetPresetChoice;
  assignedTokenIds: string[];
  runtimeOverrides: SheetRuntimeOverrides;
  createdAt: number;
  updatedAt: number;
}

export function getCombinedSheetSource(rec: { dslSource: string; logicSource?: string }): string {
  if (!rec.logicSource || !rec.logicSource.trim()) return rec.dslSource;
  return `${rec.dslSource}\n\n# === FOLHA LÓGICA (ESCOPO COMPARTILHADO) ===\n${rec.logicSource}`;
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
      test: Luta.roll
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
  viewMode: 'visual' | 'split' | 'code' | 'logic';

  // Navegação da Janela
  openManager: (initialView?: 'list' | 'create') => void;
  closeManager: () => void;
  setView: (view: 'list' | 'create' | 'sheet') => void;
  setViewMode: (mode: 'visual' | 'split' | 'code' | 'logic') => void;
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
  updateSheetLogicSource: (sheetId: string, logicSource: string) => void;
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

  // Edição Direta de Módulos pela Interface Visual (Sincronizada com a DSL)
  updateCharacterLevel: (sheetId: string, newLevel: number) => void;
  updateProfileFields: (
    sheetId: string,
    updates: {
      name?: string;
      archetype?: string;
      level?: number | string;
      desc?: string;
      extraFields?: Array<{ key: string; value: string }>;
    },
  ) => void;
  updateStatBaseValue: (sheetId: string, statId: string, newValue: number | string) => void;
  addStatOrAttr: (
    sheetId: string,
    kind: 'attr' | 'stat',
    tabOrItem:
      | string
      | undefined
      | { id: string; label: string; value: string | number; roll?: string },
    maybeItem?: { id: string; label: string; value: string | number; roll?: string },
  ) => void;
  updateTextBlock: (
    sheetId: string,
    blockIndex: number,
    title: string | undefined,
    contentText: string,
  ) => void;
  addInventoryItem: (
    sheetId: string,
    tab: string | undefined,
    item: {
      label: string;
      weight: number;
      qty: number;
      state: 'equipped' | 'carried' | 'stash';
      desc?: string;
      effect?: string;
      testFormula?: string;
      damageFormula?: string;
    },
  ) => void;
  removeInventoryItem: (sheetId: string, itemLabel: string) => void;
  addSkillItem: (
    sheetId: string,
    tabOrSkill:
      | string
      | undefined
      | { label: string; baseAttr?: string; bonus: number | string; roll?: string },
    maybeSkill?: { label: string; baseAttr?: string; bonus: number | string; roll?: string },
  ) => void;
  updateSkillBonus: (sheetId: string, skillId: string, newBonus: number | string) => void;
  removeSkillItem: (sheetId: string, skillId: string) => void;
  addSlotItem: (
    sheetId: string,
    blockIndex: number,
    slot: { label: string; max?: number; colSpan?: number; isCondition?: boolean },
  ) => void;
  addAbilityItem: (
    sheetId: string,
    tabOrAbility:
      | string
      | undefined
      | {
        category?: string;
        label: string;
        actionType?: string;
        cost?: string;
        desc?: string;
        testFormula?: string;
        damageFormula?: string;
      },
    maybeAbility?: {
      category?: string;
      label: string;
      actionType?: string;
      cost?: string;
      desc?: string;
      testFormula?: string;
      damageFormula?: string;
    },
  ) => void;
  removeAbilityItem: (sheetId: string, abilityLabel: string) => void;
  addDescriptorItem: (
    sheetId: string,
    tabOrDesc:
      | string
      | undefined
      | { kind: string; label: string; value?: string | number; effect?: string },
    maybeDesc?: { kind: string; label: string; value?: string | number; effect?: string },
  ) => void;
  updateTabNavConfig: (
    sheetId: string,
    config: {
      position?: import('@/lib/sheet-dsl').TabNavPosition;
      showLabels?: boolean;
      align?: 'left' | 'center' | 'right' | 'stretch';
    },
  ) => void;
  updateModuleColor: (
    sheetId: string,
    modOrderIndex: number,
    color: string | undefined,
  ) => void;

  // Lógica de Consumo Dinâmico (Inventário / Recursos) e Progressão
  consumeResourceOrItem: (
    sheetId: string,
    resourceOrItemName: string,
    amount?: number,
  ) => { success: boolean; type: 'resource' | 'item' | 'none'; remaining: number; label: string; error?: string };
  applyProgressionUpgrade: (
    sheetId: string,
    progressionId: string,
    selectedOptions: import('@/lib/sheet-dsl').ASTProgressionChoiceOption[],
    selectedBranchIds?: Record<string, string>,
  ) => void;
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

  updateSheetLogicSource: (sheetId, logicSource) => {
    set((state) => ({
      sheets: state.sheets.map((s) => {
        if (s.id !== sheetId) return s;
        return {
          ...s,
          logicSource,
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

  updateCharacterLevel: (sheetId, newLevel) => {
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    const clamped = Math.max(0, Math.round(newLevel));
    let src = rec.dslSource;

    // 1. Atualiza level em @meta [...]
    src = src.replace(/(@meta\b[^\n]*)/i, (line) => {
      if (/\b(?:level|nivel|nível|nex)\s*[:=]\s*\d+/i.test(line)) {
        return line.replace(/(\b(?:level|nivel|nível|nex)\s*[:=]\s*)\d+/i, `$1${clamped}`);
      }
      return line;
    });

    // 2. Atualiza level: X dentro de @profile ou @stat
    src = src.replace(/^([ \t]*(?:level|nivel|nível|nex)\s*(?::=|[:=])\s*)\d+/gim, `$1${clamped}`);

    get().updateSheetSource(sheetId, src);
  },

  updateProfileFields: (sheetId, updates) => {
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    let src = rec.dslSource;

    if (updates.name && updates.name.trim()) {
      src = replaceMetaTitleInDSL(src, updates.name.trim());
      src = src.replace(
        /(@(?:profile|perfil|identidade)\s+)"[^"]*"/i,
        `$1"${updates.name.trim().replace(/"/g, '\\"')}"`,
      );
    }

    if (updates.level !== undefined && updates.level !== '') {
      const lvlNum = Number(updates.level);
      if (!Number.isNaN(lvlNum)) {
        src = src.replace(/(@meta\b[^\n]*)/i, (line) => {
          if (/\b(?:level|nivel|nível|nex)\s*[:=]\s*\d+/i.test(line)) {
            return line.replace(/(\b(?:level|nivel|nível|nex)\s*[:=]\s*)\d+/i, `$1${lvlNum}`);
          }
          return line;
        });
      }
    }

    const profileRegex =
      /(@(?:profile|perfil|img|imagem|avatar|retrato|identidade)\b[^\n]*\n)((?:[ \t]+[^\n]*\n?)*)/i;

    if (profileRegex.test(src)) {
      src = src.replace(profileRegex, (_m, headerLine: string, bodyLines: string) => {
        const lines = bodyLines.split('\n').filter((l) => l.trim().length > 0);
        const upsertProp = (key: string, val: string | number | undefined, isNumeric = false) => {
          if (val === undefined) return;
          const strVal = isNumeric ? String(val) : `"${String(val).replace(/"/g, '\\"')}"`;
          const keyRe = new RegExp(`^[ \\t]*${key}\\s*[:=]`, 'i');
          const idx = lines.findIndex((l) => keyRe.test(l));
          if (idx >= 0) {
            lines[idx] = `  ${key}: ${strVal}`;
          } else if (String(val).trim() !== '') {
            lines.push(`  ${key}: ${strVal}`);
          }
        };

        if (updates.name !== undefined) upsertProp('name', updates.name);
        if (updates.archetype !== undefined) upsertProp('archetype', updates.archetype);
        if (updates.level !== undefined && updates.level !== '') {
          const isNum = !Number.isNaN(Number(updates.level));
          upsertProp('level', updates.level, isNum);
        }
        if (updates.desc !== undefined) upsertProp('desc', updates.desc);

        if (updates.extraFields) {
          for (const ef of updates.extraFields) {
            const safeKey = ef.key
              .trim()
              .replace(/[^a-zA-Z0-9_À-ÖØ-öø-ÿ]/g, '_');
            if (!safeKey) continue;
            const isNum = ef.value.trim() !== '' && !Number.isNaN(Number(ef.value));
            upsertProp(safeKey, isNum ? Number(ef.value) : ef.value, isNum);
          }
        }

        return `${headerLine}${lines.join('\n')}\n`;
      });
    }

    get().updateSheetSource(sheetId, src);
  },

  updateStatBaseValue: (sheetId, statId, newValue) => {
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    let src = rec.dslSource;
    const escapedId = statId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Casa linhas como: FOR "Força" := 10 [roll: ...] ou hire_hp "HP": 3 / 4
    const lineRegex = new RegExp(
      `^([ \\t]*${escapedId}(?:\\s+"[^"]*")?\\s*(?::=|=|:)\\s*)([^\\[\\n#]+)(.*)$`,
      'm',
    );
    if (lineRegex.test(src)) {
      const trimmed = String(newValue).trim();
      const isRawExpr =
        typeof newValue === 'number' ||
        !Number.isNaN(Number(trimmed)) ||
        /^\d+\s*\/\s*\d+$/.test(trimmed) ||
        /\b\d*d(?:\d+|F)\b/i.test(trimmed);
      const formattedVal = isRawExpr
        ? trimmed
        : `"${trimmed.replace(/"/g, '\\"')}"`;

      src = src.replace(lineRegex, (_m, prefix: string, _oldExpr: string, suffix: string) => {
        const cleanSuffix = suffix.trim() ? ` ${suffix.trim()}` : '';
        return `${prefix}${formattedVal}${cleanSuffix}`;
      });
      get().updateSheetSource(sheetId, src);
    }
  },

  addStatOrAttr: (sheetId, kind, tabOrItem, maybeItem) => {
    const tab = typeof tabOrItem === 'string' ? tabOrItem : undefined;
    const item = (typeof tabOrItem === 'object' && tabOrItem !== null ? tabOrItem : maybeItem)!;
    if (!item) return;
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    const safeId =
      item.id
        .trim()
        .replace(/[^a-zA-Z0-9_]/g, '_') || `stat_${Date.now().toString(36)}`;
    const safeLabel = (item.label.trim() || safeId).replace(/"/g, '\\"');
    const rawVal = String(item.value).trim() || '0';
    const isRawExpr =
      !Number.isNaN(Number(rawVal)) ||
      /^\d+\s*\/\s*\d+$/.test(rawVal) ||
      /\b\d*d(?:\d+|F)\b/i.test(rawVal);
    const valExpr = isRawExpr ? rawVal : `"${rawVal.replace(/"/g, '\\"')}"`;
    const rollPart = item.roll?.trim()
      ? ` [roll: ${item.roll.trim().replace(/^"(.*)"$/, '$1')}]`
      : '';
    const newLine = `  ${safeId} "${safeLabel}" := ${valExpr}${rollPart}`;

    let src = rec.dslSource;
    const dirPattern =
      kind === 'attr'
        ? /(@(?:attr|attrs|attributes|atributo|atributos)\b[^\n]*\n(?:[ \t]+[^\n]*\n?)*)/gi
        : /(@(?:stat|stats|status|defesas|derivados)\b[^\n]*\n(?:[ \t]+[^\n]*\n?)*)/gi;

    let matches = Array.from(src.matchAll(dirPattern));
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const matchText = lastMatch[0];
      const matchIndex = lastMatch.index ?? 0;
      const updatedBlock = `${matchText.replace(/\n*$/, '')}\n${newLine}\n`;
      src =
        src.slice(0, matchIndex) +
        updatedBlock +
        src.slice(matchIndex + matchText.length);
    } else {
      const header = kind === 'attr' ? '@attr "Atributos" [col1]' : '@stat "Status" [col1]';
      const tabHeader = tab && tab !== 'Principal' && tab !== 'Geral' ? `\n@tab "${tab}"\n` : '\n';
      src = `${src.trimEnd()}\n${tabHeader}${header}\n${newLine}\n`;
    }

    get().updateSheetSource(sheetId, src);
  },

  updateTextBlock: (sheetId, blockIndex, title, contentText) => {
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    let src = rec.dslSource;

    const textBlockRegex =
      /(@(?:text|texts|texto|textos|note|notes|nota|notas|anotacao|anotacoes|anotações|bio|biografia|lore|historia|história)\b[^\n]*)(\n(?:[ \t]+[^\n]*\n?)*)/gi;

    let currentIdx = 0;
    let replaced = false;

    src = src.replace(textBlockRegex, (fullMatch, headerLine: string, _body: string) => {
      if (currentIdx !== blockIndex) {
        currentIdx++;
        return fullMatch;
      }
      currentIdx++;
      replaced = true;

      let updatedHeader = headerLine;
      if (title !== undefined && title.trim() !== '') {
        const safeTitle = title.trim().replace(/"/g, '\\"');
        if (/"[^"]*"/.test(updatedHeader)) {
          updatedHeader = updatedHeader.replace(/"[^"]*"/, `"${safeTitle}"`);
        } else {
          updatedHeader = updatedHeader.replace(/^(@\S+)/, `$1 "${safeTitle}"`);
        }
      }

      const rawLines = contentText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const formattedLines = rawLines.map((line) => {
        if (
          line.startsWith('- ') ||
          line.startsWith('* ') ||
          line.startsWith('>') ||
          line.startsWith('#') ||
          /^[A-Za-zÀ-ÖØ-öø-ÿ0-9_\s]{2,20}\s*:\s*.+$/.test(line)
        ) {
          return `  ${line}`;
        }
        const unquoted = line.replace(/^"(.*)"$/, '$1').replace(/"/g, '\\"');
        return `  "${unquoted}"`;
      });

      const newBody = formattedLines.length > 0 ? `\n${formattedLines.join('\n')}\n` : '\n';
      return `${updatedHeader}${newBody}`;
    });

    if (replaced) {
      get().updateSheetSource(sheetId, src);
    }
  },

  addInventoryItem: (sheetId, tab, item) => {
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    const safeLabel = (item.label.trim() || 'Novo Item').replace(/"/g, '\\"');
    const stateFlag =
      item.state === 'equipped'
        ? '!equipped'
        : item.state === 'stash'
          ? '!stash'
          : '!carried';

    const lines: string[] = [
      `  item "${safeLabel}" [weight: ${item.weight}, qty: ${item.qty}, ${stateFlag}]`,
    ];
    if (item.desc?.trim()) {
      lines.push(`    desc: "${item.desc.trim().replace(/"/g, '\\"')}"`);
    }
    if (item.effect?.trim()) {
      lines.push(`    when equipped -> ${item.effect.trim()}`);
    }
    if (item.testFormula?.trim() || item.damageFormula?.trim()) {
      lines.push(`    action "Usar / Atacar" [type: "Padrão"]`);
      if (item.testFormula?.trim()) {
        lines.push(`      test: ${item.testFormula.trim()}`);
      }
      if (item.damageFormula?.trim()) {
        lines.push(`      damage: ${item.damageFormula.trim()}`);
      }
    }

    const snippet = lines.join('\n');
    let src = rec.dslSource;
    const invRegex = /(@(?:inv|inventory|inventario|itens)\b[^\n]*\n(?:[ \t]+[^\n]*\n?)*)/gi;
    const matches = Array.from(src.matchAll(invRegex));

    if (matches.length > 0) {
      const last = matches[matches.length - 1];
      const idx = last.index ?? 0;
      const updated = `${last[0].replace(/\n*$/, '')}\n\n${snippet}\n`;
      src = src.slice(0, idx) + updated + src.slice(idx + last[0].length);
    } else {
      const tabHeader = tab && tab !== 'Principal' && tab !== 'Geral' ? `\n@tab "${tab}"\n` : '\n';
      src = `${src.trimEnd()}\n${tabHeader}@inv "Inventário" [col1]\n${snippet}\n`;
    }

    get().updateSheetSource(sheetId, src);
  },

  removeInventoryItem: (sheetId, itemLabel) => {
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    const escaped = itemLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const itemBlockRe = new RegExp(
      `^[ \\t]*(?:item|weapon|armor|shield|consumable)\\s+"${escaped}"[^\\n]*\\n(?:[ \\t]{4,}[^\\n]*\\n?)*`,
      'im',
    );
    const nextSrc = rec.dslSource.replace(itemBlockRe, '');
    if (nextSrc !== rec.dslSource) {
      get().updateSheetSource(sheetId, nextSrc);
    }
  },

  addSkillItem: (sheetId, tabOrSkill, maybeSkill) => {
    const tab = typeof tabOrSkill === 'string' ? tabOrSkill : undefined;
    const skill = (typeof tabOrSkill === 'object' && tabOrSkill !== null ? tabOrSkill : maybeSkill)!;
    if (!skill) return;
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    const rawLabel = skill.label.trim() || 'Nova Perícia';
    const safeId = rawLabel
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '') || `skill_${Date.now().toString(36)}`;
    const attrPart = skill.baseAttr?.trim() ? ` (${skill.baseAttr.trim()})` : '';
    const rollPart = skill.roll?.trim()
      ? ` [roll: ${skill.roll.trim().replace(/^"(.*)"$/, '$1')}]`
      : '';
    const rawBonus = String(skill.bonus).trim() || '0';
    const newLine = `  ${safeId} "${rawLabel.replace(/"/g, '\\"')}"${attrPart} := ${rawBonus}${rollPart}`;

    let src = rec.dslSource;
    const skillRegex = /(@(?:skill|skills|pericia|pericias)\b[^\n]*\n(?:[ \t]+[^\n]*\n?)*)/gi;
    const matches = Array.from(src.matchAll(skillRegex));

    if (matches.length > 0) {
      const last = matches[matches.length - 1];
      const idx = last.index ?? 0;
      const updated = `${last[0].replace(/\n*$/, '')}\n${newLine}\n`;
      src = src.slice(0, idx) + updated + src.slice(idx + last[0].length);
    } else {
      const tabHeader = tab && tab !== 'Principal' && tab !== 'Geral' ? `\n@tab "${tab}"\n` : '\n';
      src = `${src.trimEnd()}\n${tabHeader}@skill "Perícias" [col2, roll: 1d20 + attr + self]\n${newLine}\n`;
    }

    get().updateSheetSource(sheetId, src);
  },

  updateSkillBonus: (sheetId, skillId, newBonus) => {
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    let src = rec.dslSource;
    const escapedId = skillId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lineRe = new RegExp(
      `^([ \\t]*${escapedId}(?:\\s+"[^"]*")?(?:\\s*\\([^)]*\\))?\\s*(?::=|=|:)\\s*)([^\\[\\n#]+)(.*)$`,
      'm',
    );
    if (lineRe.test(src)) {
      src = src.replace(lineRe, (_m, prefix: string, _oldExpr: string, suffix: string) => {
        const cleanSuffix = suffix.trim() ? ` ${suffix.trim()}` : '';
        return `${prefix}${String(newBonus).trim()}${cleanSuffix}`;
      });
      get().updateSheetSource(sheetId, src);
    }
  },

  removeSkillItem: (sheetId, skillId) => {
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    const escapedId = skillId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lineRe = new RegExp(
      `^[ \\t]*${escapedId}(?:\\s+"[^"]*")?(?:\\s*\\([^)]*\\))?\\s*(?::=|=|:)[^\\n]*\\n?`,
      'm',
    );
    const nextSrc = rec.dslSource.replace(lineRe, '');
    if (nextSrc !== rec.dslSource) {
      get().updateSheetSource(sheetId, nextSrc);
    }
  },

  addSlotItem: (sheetId, blockIndex, slot) => {
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    let src = rec.dslSource;
    const safeLabel = (slot.label.trim() || 'Novo Slot').replace(/"/g, '\\"');
    const slotId = `slot_${Date.now().toString(36).slice(-4)}`;
    const tags: string[] = [];
    if (slot.colSpan && slot.colSpan > 1) tags.push(`span: ${slot.colSpan}`);
    if (slot.isCondition) tags.push('condition');
    if (!slot.max || slot.max <= 0) {
      tags.push(slot.label.trim() ? 'state: filled' : 'state: empty');
    }
    const bracketStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
    const valStr = slot.max && slot.max > 0 ? `: ${slot.max}/${slot.max}` : '';
    const newLine = `  ${slotId} "${safeLabel}"${valStr}${bracketStr}`;

    const slotsRegex = /(@(?:slots|slot|caixas|grade_slots)\b[^\n]*\n(?:[ \t]+[^\n]*\n?)*)/gi;
    let currentIdx = 0;
    src = src.replace(slotsRegex, (fullMatch) => {
      if (currentIdx !== blockIndex) {
        currentIdx++;
        return fullMatch;
      }
      currentIdx++;
      return `${fullMatch.replace(/\n*$/, '')}\n${newLine}\n`;
    });

    get().updateSheetSource(sheetId, src);
  },

  addAbilityItem: (sheetId, tabOrAbility, maybeAbility) => {
    const tab = typeof tabOrAbility === 'string' ? tabOrAbility : undefined;
    const ability = (typeof tabOrAbility === 'object' && tabOrAbility !== null ? tabOrAbility : maybeAbility)!;
    if (!ability) return;
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    const safeLabel = (ability.label.trim() || 'Nova Habilidade').replace(/"/g, '\\"');
    const metaParts: string[] = [];
    if (ability.actionType?.trim()) {
      metaParts.push(`type: "${ability.actionType.trim().replace(/"/g, '\\"')}"`);
    }
    if (ability.cost?.trim()) {
      metaParts.push(`cost: ${ability.cost.trim()}`);
    }
    const bracket = metaParts.length > 0 ? ` [${metaParts.join(', ')}]` : '';
    const lines: string[] = [`  ability "${safeLabel}"${bracket}`];
    if (ability.testFormula?.trim()) {
      lines.push(`    test: ${ability.testFormula.trim()}`);
    }
    if (ability.damageFormula?.trim()) {
      lines.push(`    damage: ${ability.damageFormula.trim()}`);
    }
    if (ability.desc?.trim()) {
      lines.push(`    desc: "${ability.desc.trim().replace(/"/g, '\\"')}"`);
    }

    const snippet = lines.join('\n');
    let src = rec.dslSource;
    const abRegex =
      /(@(?:ability|abilities|action|actions|move|moves|magic|powers|habilidade|habilidades|acoes|magias|poderes|rituais)\b[^\n]*\n(?:[ \t]+[^\n]*\n?)*)/gi;
    const matches = Array.from(src.matchAll(abRegex));

    if (matches.length > 0) {
      const last = matches[matches.length - 1];
      const idx = last.index ?? 0;
      const updated = `${last[0].replace(/\n*$/, '')}\n\n${snippet}\n`;
      src = src.slice(0, idx) + updated + src.slice(idx + last[0].length);
    } else {
      const tabHeader = tab && tab !== 'Principal' && tab !== 'Geral' ? `\n@tab "${tab}"\n` : '\n';
      src = `${src.trimEnd()}\n${tabHeader}@ability "Habilidades" [col2]\n${snippet}\n`;
    }

    get().updateSheetSource(sheetId, src);
  },

  removeAbilityItem: (sheetId, abilityLabel) => {
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    const escaped = abilityLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const abBlockRe = new RegExp(
      `^[ \\t]*(?:ability|action|move|spell|power|passive|reaction)\\s+"${escaped}"[^\\n]*\\n(?:[ \\t]{4,}[^\\n]*\\n?)*`,
      'im',
    );
    const nextSrc = rec.dslSource.replace(abBlockRe, '');
    if (nextSrc !== rec.dslSource) {
      get().updateSheetSource(sheetId, nextSrc);
    }
  },

  addDescriptorItem: (sheetId, tabOrDesc, maybeDesc) => {
    const tab = typeof tabOrDesc === 'string' ? tabOrDesc : undefined;
    const desc = (typeof tabOrDesc === 'object' && tabOrDesc !== null ? tabOrDesc : maybeDesc)!;
    if (!desc) return;
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    const safeLabel = (desc.label.trim() || 'Nova Condição').replace(/"/g, '\\"');
    const kw = desc.kind || 'tag';
    const effectPart = desc.effect?.trim()
      ? ` [active: false] -> ${desc.effect.trim()}`
      : '';
    const newLine = `  ${kw} "${safeLabel}"${effectPart}`;

    let src = rec.dslSource;
    const descRegex =
      /(@(?:desc|descriptors|narrative|descritores|narrativa|aspectos)\b[^\n]*\n(?:[ \t]+[^\n]*\n?)*)/gi;
    const matches = Array.from(src.matchAll(descRegex));

    if (matches.length > 0) {
      const last = matches[matches.length - 1];
      const idx = last.index ?? 0;
      const updated = `${last[0].replace(/\n*$/, '')}\n${newLine}\n`;
      src = src.slice(0, idx) + updated + src.slice(idx + last[0].length);
    } else {
      const tabHeader = tab && tab !== 'Principal' && tab !== 'Geral' ? `\n@tab "${tab}"\n` : '\n';
      src = `${src.trimEnd()}\n${tabHeader}@desc "Condições & Estados" [col1]\n${newLine}\n`;
    }

    get().updateSheetSource(sheetId, src);
  },

  updateTabNavConfig: (sheetId, config) => {
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    let src = rec.dslSource;

    const upsertMetaBracketKey = (headerLine: string, key: string, val: string) => {
      const keyRe = new RegExp(`\\b${key}\\s*[:=]\\s*(?:"[^"]*"|[a-zA-Z0-9_]+)`, 'i');
      if (keyRe.test(headerLine)) {
        return headerLine.replace(keyRe, `${key}: ${val}`);
      }
      const bracketMatch = headerLine.match(/\[([^\]]*)\]/);
      if (bracketMatch) {
        const inner = bracketMatch[1].trim();
        const newInner = inner ? `${inner}, ${key}: ${val}` : `${key}: ${val}`;
        return headerLine.replace(/\[[^\]]*\]/, `[${newInner}]`);
      }
      return `${headerLine} [${key}: ${val}]`;
    };

    // 1. Se já existir uma diretiva @tab_flow (ou aliases), atualiza diretamente nela
    const tabFlowRegex = /(@(?:tab_flow|tabflow|fluxo_abas|controle_abas|nav|navegacao|tabbar|tabs_nav)\b[^\n]*)/i;
    if (tabFlowRegex.test(src)) {
      src = src.replace(tabFlowRegex, (line) => {
        let updated = line;
        if (config.position !== undefined) {
          updated = upsertMetaBracketKey(updated, 'pos', `"${config.position}"`);
        }
        if (config.showLabels !== undefined) {
          updated = upsertMetaBracketKey(updated, 'labels', config.showLabels ? 'true' : 'false');
        }
        if (config.align !== undefined) {
          updated = upsertMetaBracketKey(updated, 'align', `"${config.align}"`);
        }
        return updated;
      });
      get().updateSheetSource(sheetId, src);
      return;
    }

    // 2. Caso contrário, atualiza no @meta
    const metaRegex = /(@meta\b[^\n]*)/i;
    if (!metaRegex.test(src)) {
      src = `@meta "${rec.name}"\n\n${src}`;
    }

    src = src.replace(metaRegex, (line) => {
      let updated = line;
      if (config.position !== undefined) {
        updated = upsertMetaBracketKey(updated, 'tabs_pos', `"${config.position}"`);
      }
      if (config.showLabels !== undefined) {
        updated = upsertMetaBracketKey(updated, 'tabs_labels', config.showLabels ? 'true' : 'false');
      }
      if (config.align !== undefined) {
        updated = upsertMetaBracketKey(updated, 'tabs_align', `"${config.align}"`);
      }
      return updated;
    });

    get().updateSheetSource(sheetId, src);
  },

  updateModuleColor: (sheetId, modOrderIndex, color) => {
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;
    let src = rec.dslSource;

    // Encontra diretivas de módulos que geram layout (na mesma ordem exata do parser)
    const layoutKinds = new Set([
      'profile',
      'counter',
      'attr',
      'stat',
      'res',
      'turn',
      'desc',
      'skill',
      'inv',
      'ability',
      'diagram',
      'rule',
      'roll',
      'slots',
      'text',
    ]);
    const aliasKeys = Object.entries(DIRECTIVE_ALIASES)
      .filter(([, kind]) => layoutKinds.has(kind))
      .map(([alias]) => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length);
    const moduleDirectiveRegex = new RegExp(
      `^([ \\t]*@(?:${aliasKeys.join('|')})\\b[^\\n]*)`,
      'gim',
    );

    let currentOrder = 0;
    src = src.replace(moduleDirectiveRegex, (headerLine) => {
      if (currentOrder !== modOrderIndex) {
        currentOrder++;
        return headerLine;
      }
      currentOrder++;

      if (!color) {
        return headerLine
          .replace(/,?\s*\b(?:cor|color|accent|hex)\s*[:=]\s*"?#[0-9a-fA-F]{3,8}"?/gi, '')
          .replace(/,?\s*\b(?:cor|color|accent|hex)\s*[:=]\s*"?[a-zA-Z]+"?/gi, '');
      }

      const colorPropRe = /\b(?:cor|color|accent|hex)\s*[:=]\s*(?:"[^"]*"|#[0-9a-fA-F]{3,8}|[a-zA-Z0-9_]+)/i;
      if (colorPropRe.test(headerLine)) {
        return headerLine.replace(colorPropRe, `cor: "${color}"`);
      }
      const bracketMatch = headerLine.match(/\[([^\]]*)\]/);
      if (bracketMatch) {
        const inner = bracketMatch[1].trim();
        const newInner = inner ? `${inner}, cor: "${color}"` : `cor: "${color}"`;
        return headerLine.replace(/\[[^\]]*\]/, `[${newInner}]`);
      }
      return `${headerLine} [cor: "${color}"]`;
    });

    get().updateSheetSource(sheetId, src);
  },

  consumeResourceOrItem: (sheetId, resourceOrItemName, amount = 1) => {
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) {
      return { success: false, type: 'none', remaining: 0, label: resourceOrItemName, error: 'Ficha não encontrada' };
    }
    const fullSource = getCombinedSheetSource(rec);
    const compiled = compileSheetDSL(fullSource, rec.runtimeOverrides);
    const targetLow = resourceOrItemName.trim().toLowerCase();

    // 1. Tenta encontrar em recursos (sheet.resources)
    const matchedRes = Object.values(compiled.resources).find(
      (r) => r.id.toLowerCase() === targetLow || r.label.toLowerCase() === targetLow,
    );

    if (matchedRes) {
      if (matchedRes.current < amount) {
        return {
          success: false,
          type: 'resource',
          remaining: matchedRes.current,
          label: matchedRes.label,
          error: `Recurso insuficiente: ${matchedRes.label} (${matchedRes.current}/${matchedRes.max})`,
        };
      }
      const newCur = Math.max(0, matchedRes.current - amount);
      get().setResourceCurrent(sheetId, matchedRes.id, newCur);
      return {
        success: true,
        type: 'resource',
        remaining: newCur,
        label: matchedRes.label,
      };
    }

    // 2. Tenta encontrar no inventário (sheet.inventory.items)
    const matchedItem = compiled.inventory.items.find(
      (item) =>
        item.id.toLowerCase() === targetLow ||
        item.label.toLowerCase() === targetLow ||
        item.label.toLowerCase().includes(targetLow) ||
        targetLow.includes(item.label.toLowerCase()),
    );

    if (matchedItem) {
      const curQty = matchedItem.qty;
      if (curQty < amount) {
        return {
          success: false,
          type: 'item',
          remaining: curQty,
          label: matchedItem.label,
          error: `Munição/Item insuficiente no inventário: ${matchedItem.label} (restam ${curQty})`,
        };
      }
      const newQty = Math.max(0, curQty - amount);
      get().setItemQty(sheetId, matchedItem.id, newQty);
      return {
        success: true,
        type: 'item',
        remaining: newQty,
        label: matchedItem.label,
      };
    }

    return {
      success: false,
      type: 'none',
      remaining: 0,
      label: resourceOrItemName,
      error: `Recurso ou item '${resourceOrItemName}' não encontrado na ficha`,
    };
  },

  applyProgressionUpgrade: (sheetId, progressionId, selectedOptions, selectedBranchIds = {}) => {
    const rec = get().sheets.find((s) => s.id === sheetId);
    if (!rec) return;

    const fullSource = getCombinedSheetSource(rec);
    const compiled = compileSheetDSL(fullSource, rec.runtimeOverrides);
    const prog = compiled.progressions.find((p) => p.id === progressionId);
    if (!prog) return;

    // 1. Processa os ganhos automáticos de todos os steps, branches selecionados e raiz
    const branchGains: import('@/lib/sheet-dsl').EvaluatedProgressionGain[] = [];
    for (const st of prog.steps) {
      if (st.branches && st.branches.length > 0) {
        const chosenBranchId = selectedBranchIds[st.id] || selectedBranchIds[st.title];
        const chosenBranch = st.branches.find((b) => b.id === chosenBranchId) || st.branches[0];
        if (chosenBranch) {
          branchGains.push(...chosenBranch.gains);
        }
      }
    }

    const allGains = [
      ...prog.gains,
      ...prog.steps.flatMap((s) => s.gains),
      ...branchGains,
    ];
    // Remove duplicatas por target + exprString
    const uniqueGains = allGains.filter(
      (g, idx, arr) =>
        arr.findIndex(
          (other) => other.target === g.target && other.exprString === g.exprString,
        ) === idx,
    );

    for (const gain of uniqueGains) {
      const targetLower = gain.target.toLowerCase();
      if (
        targetLower === 'level' ||
        targetLower === 'nivel' ||
        targetLower === 'nível'
      ) {
        const curLvl =
          typeof compiled.meta.level === 'number' ? compiled.meta.level : 1;
        const addLvl =
          typeof gain.evaluatedValue === 'number' ? gain.evaluatedValue : 1;
        get().updateCharacterLevel(sheetId, curLvl + addLvl);
      } else if (gain.target.includes('.')) {
        // Alvo sub-propriedade, ex: PV.max, PM.max
        const [resId, prop] = gain.target.split('.');
        const matchedRes = Object.values(compiled.resources).find(
          (r) => r.id.toLowerCase() === resId.toLowerCase(),
        );
        if (matchedRes && typeof gain.evaluatedValue === 'number') {
          if (prop === 'max' || prop === 'maximo') {
            const nextMax =
              gain.op === '+='
                ? matchedRes.max + gain.evaluatedValue
                : gain.op === '-='
                  ? matchedRes.max - gain.evaluatedValue
                  : gain.evaluatedValue;
            get().updateSheetSource(
              sheetId,
              get().sheets.find((s) => s.id === sheetId)?.dslSource ?? rec.dslSource,
            );
            // Atualiza runtime override se não for puramente derivado por fórmula
            get().setResourceCurrent(sheetId, matchedRes.id, Math.min(matchedRes.current + gain.evaluatedValue, nextMax));
          }
        }
      } else {
        const statKey = gain.target;
        const found = compiled.attributes[statKey] || compiled.stats[statKey];
        if (
          found &&
          typeof found.baseValue === 'number' &&
          typeof gain.evaluatedValue === 'number'
        ) {
          const nextVal =
            gain.op === '+='
              ? found.baseValue + gain.evaluatedValue
              : gain.op === '-='
                ? found.baseValue - gain.evaluatedValue
                : gain.evaluatedValue;
          get().updateStatBaseValue(sheetId, found.id, nextVal);
        }
      }
    }

    // 2. Se houver custo de progressão, consome
    if (prog.cost && prog.cost.amount > 0) {
      get().consumeResourceOrItem(sheetId, prog.cost.resource, prog.cost.amount);
    }

    // 3. Adiciona as opções de poderes / habilidades / itens aos módulos correspondentes
    for (const opt of selectedOptions) {
      // A. Efeito dinâmico imediato (apply: "pv_bonus_nivel += 1" ou "FOR += 1")
      if (opt.apply) {
        const m = opt.apply.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(\+=|-=|=)\s*(\d+)$/);
        if (m) {
          const varName = m[1];
          const op = m[2];
          const num = Number(m[3]);
          const found = compiled.attributes[varName] || compiled.stats[varName];
          if (found && typeof found.baseValue === 'number') {
            const nextVal =
              op === '+=' ? found.baseValue + num : op === '-=' ? found.baseValue - num : num;
            get().updateStatBaseValue(sheetId, found.id, nextVal);
          } else {
            // Se a variável não existir na ficha, injeta em @stat
            let currSrc = get().sheets.find((s) => s.id === sheetId)?.dslSource ?? rec.dslSource;
            if (!new RegExp(`\\b${varName}\\b`).test(currSrc)) {
              const statRegex = /(@(?:stat|stats|status|defesas)\b[^\n]*\n)/i;
              if (statRegex.test(currSrc)) {
                currSrc = currSrc.replace(statRegex, `$1  ${varName} := ${num}\n`);
              } else {
                currSrc = `${currSrc.trimEnd()}\n\n@stat "Estatísticas"\n  ${varName} := ${num}\n`;
              }
              get().updateSheetSource(sheetId, currSrc);
            }
          }
        }
      }

      // B. Injeção no módulo DSL correto
      const targetMod = (opt.targetModule || '@ability').toLowerCase();

      if (targetMod.includes('inv') || targetMod.includes('item')) {
        get().addInventoryItem(sheetId, undefined, {
          label: opt.label,
          desc: opt.desc,
          weight: 1,
          qty: 1,
          state: 'carried',
        });
      } else {
        // Padrão: módulo @ability (ou quando explicitamente @ability / ability)
        get().addAbilityItem(sheetId, undefined, {
          category: 'ability',
          label: opt.label,
          actionType: opt.type || 'Padrão',
          cost: opt.cost,
          desc: opt.desc,
        });
      }
    }

    triggerAutoSave();
  },
}));

