import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RulePage, RuleWidget, RuleWidgetSize } from '@/types/rules';

interface RulesState {
  pages: RulePage[];
  
  // Actions for Pages
  addPage: (name: string) => void;
  removePage: (pageId: string) => void;
  renamePage: (pageId: string, newName: string) => void;
  
  // Actions for Widgets
  addWidget: (pageId: string, size?: RuleWidgetSize) => void;
  removeWidget: (pageId: string, widgetId: string) => void;
  updateWidgetSize: (pageId: string, widgetId: string, size: RuleWidgetSize) => void;
  updateWidgetContent: (pageId: string, widgetId: string, title: string, content: string) => void;
  updateWidgetContentType: (pageId: string, widgetId: string, contentType: 'text' | 'image') => void;
  updateWidgetColumns: (pageId: string, widgetId: string, columnCount: 1 | 2 | 3) => void;
  updateWidgetImage: (pageId: string, widgetId: string, imageUrl: string) => void;
  reorderWidgets: (pageId: string, draggedId: string, targetId: string) => void;
}

export const useRulesStore = create<RulesState>()(
  persist(
    (set) => ({
      pages: [
        {
          id: crypto.randomUUID(),
          name: 'Página Inicial',
          widgets: []
        }
      ],

      addPage: (name) => set((state) => ({
        pages: [...state.pages, { id: crypto.randomUUID(), name, widgets: [] }]
      })),

      removePage: (pageId) => set((state) => ({
        pages: state.pages.filter(p => p.id !== pageId)
      })),

      renamePage: (pageId, newName) => set((state) => ({
        pages: state.pages.map(p => 
          p.id === pageId ? { ...p, name: newName } : p
        )
      })),

      addWidget: (pageId, size = '1x1') => set((state) => ({
        pages: state.pages.map(p => {
          if (p.id !== pageId) return p;
          const newWidget: RuleWidget = {
            id: crypto.randomUUID(),
            size,
            title: 'Nova Regra',
            content: '',
            contentType: 'text',
            columnCount: 1
          };
          return { ...p, widgets: [...p.widgets, newWidget] };
        })
      })),

      removeWidget: (pageId, widgetId) => set((state) => ({
        pages: state.pages.map(p => {
          if (p.id !== pageId) return p;
          return { ...p, widgets: p.widgets.filter(w => w.id !== widgetId) };
        })
      })),

      updateWidgetSize: (pageId, widgetId, size) => set((state) => ({
        pages: state.pages.map(p => {
          if (p.id !== pageId) return p;
          return {
            ...p,
            widgets: p.widgets.map(w => w.id === widgetId ? { ...w, size } : w)
          };
        })
      })),

      updateWidgetContent: (pageId, widgetId, title, content) => set((state) => ({
        pages: state.pages.map(p => {
          if (p.id !== pageId) return p;
          return {
            ...p,
            widgets: p.widgets.map(w => w.id === widgetId ? { ...w, title, content } : w)
          };
        })
      })),

      updateWidgetContentType: (pageId, widgetId, contentType) => set((state) => ({
        pages: state.pages.map(p => {
          if (p.id !== pageId) return p;
          return {
            ...p,
            widgets: p.widgets.map(w => w.id === widgetId ? { ...w, contentType } : w)
          };
        })
      })),

      updateWidgetColumns: (pageId, widgetId, columnCount) => set((state) => ({
        pages: state.pages.map(p => {
          if (p.id !== pageId) return p;
          return {
            ...p,
            widgets: p.widgets.map(w => w.id === widgetId ? { ...w, columnCount } : w)
          };
        })
      })),

      updateWidgetImage: (pageId, widgetId, imageUrl) => set((state) => ({
        pages: state.pages.map(p => {
          if (p.id !== pageId) return p;
          return {
            ...p,
            widgets: p.widgets.map(w => w.id === widgetId ? { ...w, imageUrl } : w)
          };
        })
      })),

      reorderWidgets: (pageId, draggedId, targetId) => set((state) => ({
        pages: state.pages.map(p => {
          if (p.id !== pageId) return p;
          
          const newWidgets = [...p.widgets];
          const draggedIndex = newWidgets.findIndex(w => w.id === draggedId);
          const targetIndex = newWidgets.findIndex(w => w.id === targetId);
          
          if (draggedIndex === -1 || targetIndex === -1) return p;
          
          const [draggedItem] = newWidgets.splice(draggedIndex, 1);
          newWidgets.splice(targetIndex, 0, draggedItem);
          
          return { ...p, widgets: newWidgets };
        })
      }))
    }),
    {
      name: 'rules-storage',
    }
  )
);
