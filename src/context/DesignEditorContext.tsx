import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  LiveAppDesignState,
  LiveElementStyle,
  LiveElementContent,
  DesignBgTheme,
  DesignTextColor,
  DesignBorderRadius,
  DesignPadding,
  DesignBorder,
  DesignShadow,
} from '../types';
import { useApp } from './AppContext';

const STORAGE_KEY = 'dosaaf_live_page_designs_v3';
const LEGACY_STORAGE_KEY = 'dosaaf_live_page_designs_v2';

interface DesignEditorContextType {
  isDesignMode: boolean;
  setIsDesignMode: (active: boolean) => void;
  toggleDesignMode: () => void;
  isPreviewMode: boolean;
  setIsPreviewMode: (active: boolean) => void;
  togglePreviewMode: () => void;
  
  selectedElementId: string | null;
  selectedContainerId: string | null;
  selectedElementLabel: string | null;
  selectedSortItemId: string | null;
  selectElement: (id: string | null, containerId?: string | null, label?: string | null, sortItemId?: string | null) => void;
  
  draggedItemId: string | null;
  setDraggedItemId: (id: string | null) => void;
  activePageKey: string;
  setActivePageKey: (key: string) => void;
  
  // Element queries & modifications
  getElementStyle: (elementId: string) => LiveElementStyle;
  getElementContent: (elementId: string) => LiveElementContent;
  setElementStyle: (elementId: string, style: Partial<LiveElementStyle>) => void;
  setElementContent: (elementId: string, content: Partial<LiveElementContent>) => void;
  toggleElementVisibility: (elementId: string) => void;
  
  // Container item order management & mouse drag-drop
  getOrderedItems: <T extends { id: string }>(containerId: string, defaultItems: T[]) => T[];
  reorderContainerByMouse: (containerId: string, sourceId: string, targetId: string, allItemIds?: string[]) => void;
  moveItemInContainer: (containerId: string, itemId: string, direction: 'up' | 'down' | 'start' | 'end', allItemIds: string[]) => void;
  getContainerOrder: (containerId: string) => string[] | undefined;
  
  // Persistence & Reset
  hasUnsavedChanges: boolean;
  saveAllDesigns: () => void;
  resetElement: (elementId: string) => void;
  resetCurrentPage: (pageKey: string) => void;
  resetAllDesigns: () => void;
  
  // Helpers for class calculations
  computeElementClasses: (
    elementId: string,
    defaultClasses: {
      bg?: string;
      border?: string;
      radius?: string;
      padding?: string;
      shadow?: string;
      text?: string;
    }
  ) => string;
}

const DesignEditorContext = createContext<DesignEditorContextType | undefined>(undefined);

export const DesignEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useApp();

  const [isDesignMode, setIsDesignModeState] = useState<boolean>(false);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [selectedElementLabel, setSelectedElementLabel] = useState<string | null>(null);
  const [selectedSortItemId, setSelectedSortItemId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [activePageKey, setActivePageKey] = useState<string>('rules');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Automatically turn off design mode if not admin
  useEffect(() => {
    if (!isAdmin && isDesignMode) {
      setIsDesignModeState(false);
      setSelectedElementId(null);
      setIsPreviewMode(false);
    }
  }, [isAdmin, isDesignMode]);

  // Load designs from localStorage with migration
  const [designs, setDesigns] = useState<LiveAppDesignState>(() => {
    try {
      const savedV3 = localStorage.getItem(STORAGE_KEY);
      if (savedV3) {
        const parsed = JSON.parse(savedV3);
        if (parsed && typeof parsed.styles === 'object' && typeof parsed.containerOrders === 'object') {
          return parsed;
        }
      }

      // Check legacy v2 format
      const savedV2 = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (savedV2) {
        const legacy = JSON.parse(savedV2);
        const aggregatedStyles: Record<string, LiveElementStyle> = {};
        const aggregatedContents: Record<string, LiveElementContent> = {};
        const aggregatedOrders: Record<string, string[]> = {};

        for (const key of Object.keys(legacy)) {
          if (legacy[key]?.styles) Object.assign(aggregatedStyles, legacy[key].styles);
          if (legacy[key]?.contents) Object.assign(aggregatedContents, legacy[key].contents);
          if (legacy[key]?.containerOrders) Object.assign(aggregatedOrders, legacy[key].containerOrders);
        }

        return {
          styles: aggregatedStyles,
          contents: aggregatedContents,
          containerOrders: aggregatedOrders,
        };
      }
    } catch (e) {
      console.error('Failed to load live designs:', e);
    }
    return {
      styles: {},
      contents: {},
      containerOrders: {},
    };
  });

  // Save helper
  const persistState = useCallback((stateToSave: LiveAppDesignState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save live designs to storage:', e);
    }
  }, []);

  const saveAllDesigns = useCallback(() => {
    persistState(designs);
    setHasUnsavedChanges(false);
  }, [designs, persistState]);

  const setIsDesignMode = useCallback(
    (active: boolean) => {
      if (!isAdmin) {
        setIsDesignModeState(false);
        return;
      }
      setIsDesignModeState(active);
      if (!active) {
        setSelectedElementId(null);
        setSelectedContainerId(null);
        setSelectedElementLabel(null);
        setSelectedSortItemId(null);
        setIsPreviewMode(false);
      }
    },
    [isAdmin]
  );

  const toggleDesignMode = useCallback(() => {
    if (!isAdmin) return;
    setIsDesignModeState((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedElementId(null);
        setSelectedContainerId(null);
        setSelectedElementLabel(null);
        setSelectedSortItemId(null);
        setIsPreviewMode(false);
      }
      return next;
    });
  }, [isAdmin]);

  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode((prev) => !prev);
  }, []);

  const selectElement = useCallback(
    (id: string | null, containerId?: string | null, label?: string | null, sortItemId?: string | null) => {
      if (!isDesignMode) return;
      setSelectedElementId(id);
      setSelectedContainerId(containerId || null);
      setSelectedElementLabel(label || null);
      setSelectedSortItemId(sortItemId || null);
    },
    [isDesignMode]
  );

  // Retrieve current styles of an element
  const getElementStyle = useCallback(
    (elementId: string): LiveElementStyle => {
      return designs.styles?.[elementId] || {};
    },
    [designs.styles]
  );

  // Retrieve current content overrides of an element
  const getElementContent = useCallback(
    (elementId: string): LiveElementContent => {
      return designs.contents?.[elementId] || {};
    },
    [designs.contents]
  );

  // Update styles for an element
  const setElementStyle = useCallback(
    (elementId: string, newStyle: Partial<LiveElementStyle>) => {
      setDesigns((prev) => {
        const existing = prev.styles[elementId] || {};
        const updatedStyles = {
          ...prev.styles,
          [elementId]: { ...existing, ...newStyle },
        };
        const nextState = {
          ...prev,
          styles: updatedStyles,
        };
        persistState(nextState);
        setHasUnsavedChanges(false);
        return nextState;
      });
    },
    [persistState]
  );

  // Update content overrides for an element
  const setElementContent = useCallback(
    (elementId: string, newContent: Partial<LiveElementContent>) => {
      setDesigns((prev) => {
        const existing = prev.contents[elementId] || {};
        const updatedContents = {
          ...prev.contents,
          [elementId]: { ...existing, ...newContent },
        };
        const nextState = {
          ...prev,
          contents: updatedContents,
        };
        persistState(nextState);
        setHasUnsavedChanges(false);
        return nextState;
      });
    },
    [persistState]
  );

  // Toggle visibility
  const toggleElementVisibility = useCallback(
    (elementId: string) => {
      const current = getElementStyle(elementId);
      setElementStyle(elementId, { isHidden: !current.isHidden });
    },
    [getElementStyle, setElementStyle]
  );

  // Get custom container item order
  const getContainerOrder = useCallback(
    (containerId: string): string[] | undefined => {
      return designs.containerOrders?.[containerId];
    },
    [designs.containerOrders]
  );

  // Reorder items in a container (generic)
  const getOrderedItems = useCallback(
    <T extends { id: string }>(containerId: string, defaultItems: T[]): T[] => {
      const order = designs.containerOrders?.[containerId];
      if (!order || order.length === 0) {
        return defaultItems;
      }
      const itemMap = new Map<string, T>();
      defaultItems.forEach((item) => itemMap.set(item.id, item));

      const orderedList: T[] = [];
      // First push items present in custom order
      order.forEach((id) => {
        const item = itemMap.get(id);
        if (item) {
          orderedList.push(item);
          itemMap.delete(id);
        }
      });
      // Then append any newly added items that weren't in saved order
      itemMap.forEach((item) => {
        orderedList.push(item);
      });
      return orderedList;
    },
    [designs.containerOrders]
  );

  // Drag and drop reordering with mouse
  const reorderContainerByMouse = useCallback(
    (containerId: string, sourceId: string, targetId: string, allItemIds?: string[]) => {
      if (!containerId || !sourceId || !targetId || sourceId === targetId) return;

      setDesigns((prev) => {
        const savedOrder = prev.containerOrders[containerId] || [];
        // Base array: if savedOrder is populated use it, otherwise use allItemIds
        let baseList: string[] = savedOrder.length > 0 ? [...savedOrder] : [];
        if (allItemIds && allItemIds.length > 0) {
          // If baseList is missing some items from allItemIds, add them
          allItemIds.forEach((id) => {
            if (!baseList.includes(id)) baseList.push(id);
          });
        }

        // Ensure both sourceId and targetId are present
        if (!baseList.includes(sourceId)) baseList.push(sourceId);
        if (!baseList.includes(targetId)) baseList.push(targetId);

        const sourceIdx = baseList.indexOf(sourceId);
        const targetIdx = baseList.indexOf(targetId);

        if (sourceIdx !== -1 && targetIdx !== -1) {
          const [removed] = baseList.splice(sourceIdx, 1);
          baseList.splice(targetIdx, 0, removed);
        }

        const nextState = {
          ...prev,
          containerOrders: {
            ...prev.containerOrders,
            [containerId]: baseList,
          },
        };
        persistState(nextState);
        setHasUnsavedChanges(false);
        return nextState;
      });
    },
    [persistState]
  );

  // Step Move Up / Down / Start / End
  const moveItemInContainer = useCallback(
    (
      containerId: string,
      itemId: string,
      direction: 'up' | 'down' | 'start' | 'end',
      allItemIds: string[]
    ) => {
      if (!containerId || !itemId) return;

      setDesigns((prev) => {
        const saved = prev.containerOrders[containerId] || [];
        let currentOrder: string[] = saved.length > 0 ? [...saved] : [...allItemIds];

        // Ensure all sibling IDs are accounted for
        allItemIds.forEach((id) => {
          if (!currentOrder.includes(id)) currentOrder.push(id);
        });

        const index = currentOrder.indexOf(itemId);
        if (index === -1) return prev;

        let newIndex = index;
        if (direction === 'up') {
          newIndex = Math.max(0, index - 1);
        } else if (direction === 'down') {
          newIndex = Math.min(currentOrder.length - 1, index + 1);
        } else if (direction === 'start') {
          newIndex = 0;
        } else if (direction === 'end') {
          newIndex = currentOrder.length - 1;
        }

        if (newIndex === index) return prev;

        const [removed] = currentOrder.splice(index, 1);
        currentOrder.splice(newIndex, 0, removed);

        const nextState = {
          ...prev,
          containerOrders: {
            ...prev.containerOrders,
            [containerId]: currentOrder,
          },
        };
        persistState(nextState);
        setHasUnsavedChanges(false);
        return nextState;
      });
    },
    [persistState]
  );

  // Reset an element
  const resetElement = useCallback(
    (elementId: string) => {
      setDesigns((prev) => {
        const newStyles = { ...prev.styles };
        const newContents = { ...prev.contents };
        delete newStyles[elementId];
        delete newContents[elementId];

        const nextState = {
          ...prev,
          styles: newStyles,
          contents: newContents,
        };
        persistState(nextState);
        return nextState;
      });
    },
    [persistState]
  );

  // Reset page: clears all customizations for the given page or sections
  const resetCurrentPage = useCallback(
    (pageKey: string) => {
      setDesigns((prev) => {
        const newStyles = { ...prev.styles };
        const newContents = { ...prev.contents };
        const newContainerOrders = { ...prev.containerOrders };

        // Determine prefixes and containers for the active page
        const prefixesToRemove: string[] = [];
        const containersToReset: string[] = [];

        if (pageKey === 'rules') {
          prefixesToRemove.push('sign_', 'rule_', 'rules_');
          containersToReset.push('signs_grid', 'rules_list');
        } else if (pageKey === 'tests') {
          prefixesToRemove.push('test_', 'cat_', 'ticket_');
          containersToReset.push('test_categories_grid', 'tickets_grid');
        } else if (pageKey === 'materials') {
          prefixesToRemove.push('material_', 'mat_', 'materials_');
          containersToReset.push('materials_grid');
        } else if (pageKey === 'lessons') {
          prefixesToRemove.push('lesson_', 'lessons_');
          containersToReset.push('lessons_list');
        } else if (pageKey === 'schedule') {
          prefixesToRemove.push('schedule_');
          containersToReset.push('schedule_grid');
        } else if (pageKey === 'header') {
          prefixesToRemove.push('header_', 'main_header');
        }

        // Also if pageKey is a container or generic element prefix
        prefixesToRemove.push(`${pageKey}_`);
        containersToReset.push(pageKey);

        // Delete matching styles and contents
        for (const key of Object.keys(newStyles)) {
          if (prefixesToRemove.some((prefix) => key.startsWith(prefix))) {
            delete newStyles[key];
          }
        }
        for (const key of Object.keys(newContents)) {
          if (prefixesToRemove.some((prefix) => key.startsWith(prefix))) {
            delete newContents[key];
          }
        }
        for (const cId of containersToReset) {
          delete newContainerOrders[cId];
        }

        const nextState: LiveAppDesignState = {
          styles: newStyles,
          contents: newContents,
          containerOrders: newContainerOrders,
        };

        persistState(nextState);
        return nextState;
      });

      setSelectedElementId(null);
      setSelectedContainerId(null);
      setSelectedElementLabel(null);
      setSelectedSortItemId(null);
    },
    [persistState]
  );

  // Reset all designs completely
  const resetAllDesigns = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    setDesigns({
      styles: {},
      contents: {},
      containerOrders: {},
    });
    setSelectedElementId(null);
    setSelectedContainerId(null);
    setSelectedElementLabel(null);
    setSelectedSortItemId(null);
    setHasUnsavedChanges(false);
  }, []);

  // Compute Tailwind classes according to customized styles
  const computeElementClasses = useCallback(
    (
      elementId: string,
      defaultClasses: {
        bg?: string;
        border?: string;
        radius?: string;
        padding?: string;
        shadow?: string;
        text?: string;
      }
    ) => {
      const style = getElementStyle(elementId);

      // Background class
      let bgClass = defaultClasses.bg || 'bg-white';
      if (style.bgTheme) {
        switch (style.bgTheme) {
          case 'white':
            bgClass = 'bg-white';
            break;
          case 'slate_light':
            bgClass = 'bg-slate-50';
            break;
          case 'blue_light':
            bgClass = 'bg-blue-50/90';
            break;
          case 'indigo_light':
            bgClass = 'bg-indigo-50/90';
            break;
          case 'emerald_light':
            bgClass = 'bg-emerald-50/90';
            break;
          case 'amber_light':
            bgClass = 'bg-amber-50/90';
            break;
          case 'rose_light':
            bgClass = 'bg-rose-50/90';
            break;
          case 'dark_slate':
            bgClass = 'bg-slate-900 text-white';
            break;
          case 'gradient_blue':
            bgClass = 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white';
            break;
          case 'gradient_indigo':
            bgClass = 'bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-950 text-white';
            break;
          case 'gradient_emerald':
            bgClass = 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white';
            break;
          case 'gradient_dark':
            bgClass = 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-stone-950 text-white';
            break;
          default:
            bgClass = defaultClasses.bg || 'bg-white';
        }
      }

      // Border class
      let borderClass = defaultClasses.border || 'border border-neutral-200';
      if (style.border) {
        switch (style.border) {
          case 'none':
            borderClass = 'border-transparent';
            break;
          case 'subtle':
            borderClass = 'border border-neutral-200';
            break;
          case 'blue':
            borderClass = 'border-2 border-blue-500';
            break;
          case 'emerald':
            borderClass = 'border-2 border-emerald-500';
            break;
          case 'amber':
            borderClass = 'border-2 border-amber-500';
            break;
          case 'dark':
            borderClass = 'border-2 border-neutral-900';
            break;
          default:
            borderClass = defaultClasses.border || 'border border-neutral-200';
        }
      }

      // Radius class
      let radiusClass = defaultClasses.radius || 'rounded-3xl';
      if (style.borderRadius) {
        switch (style.borderRadius) {
          case 'sharp':
            radiusClass = 'rounded-none';
            break;
          case 'medium':
            radiusClass = 'rounded-xl';
            break;
          case 'rounded':
            radiusClass = 'rounded-3xl';
            break;
          case 'full':
            radiusClass = 'rounded-full';
            break;
          default:
            radiusClass = defaultClasses.radius || 'rounded-3xl';
        }
      }

      // Padding class
      let paddingClass = defaultClasses.padding || 'p-5 sm:p-7';
      if (style.padding) {
        switch (style.padding) {
          case 'compact':
            paddingClass = 'p-3 sm:p-4';
            break;
          case 'normal':
            paddingClass = 'p-5 sm:p-6';
            break;
          case 'spacious':
            paddingClass = 'p-6 sm:p-8';
            break;
          default:
            paddingClass = defaultClasses.padding || 'p-5 sm:p-7';
        }
      }

      // Shadow class
      let shadowClass = defaultClasses.shadow || 'shadow-xs';
      if (style.shadow) {
        switch (style.shadow) {
          case 'none':
            shadowClass = 'shadow-none';
            break;
          case 'subtle':
            shadowClass = 'shadow-2xs';
            break;
          case 'card':
            shadowClass = 'shadow-md';
            break;
          case 'elevated':
            shadowClass = 'shadow-xl';
            break;
          default:
            shadowClass = defaultClasses.shadow || 'shadow-xs';
        }
      }

      // Text class
      let textClass = defaultClasses.text || '';
      if (style.textColor) {
        switch (style.textColor) {
          case 'neutral_dark':
            textClass = 'text-neutral-900';
            break;
          case 'neutral_muted':
            textClass = 'text-neutral-600';
            break;
          case 'blue':
            textClass = 'text-blue-600';
            break;
          case 'indigo':
            textClass = 'text-indigo-600';
            break;
          case 'emerald':
            textClass = 'text-emerald-600';
            break;
          case 'amber':
            textClass = 'text-amber-600';
            break;
          case 'white':
            textClass = 'text-white';
            break;
          default:
            textClass = defaultClasses.text || '';
        }
      }

      return `${bgClass} ${borderClass} ${radiusClass} ${paddingClass} ${shadowClass} ${textClass}`.trim();
    },
    [getElementStyle]
  );

  const value = useMemo(
    () => ({
      isDesignMode,
      setIsDesignMode,
      toggleDesignMode,
      isPreviewMode,
      setIsPreviewMode,
      togglePreviewMode,
      selectedElementId,
      selectedContainerId,
      selectedElementLabel,
      selectedSortItemId,
      selectElement,
      draggedItemId,
      setDraggedItemId,
      activePageKey,
      setActivePageKey,
      getElementStyle,
      getElementContent,
      setElementStyle,
      setElementContent,
      toggleElementVisibility,
      getOrderedItems,
      reorderContainerByMouse,
      moveItemInContainer,
      getContainerOrder,
      hasUnsavedChanges,
      saveAllDesigns,
      resetElement,
      resetCurrentPage,
      resetAllDesigns,
      computeElementClasses,
    }),
    [
      isDesignMode,
      setIsDesignMode,
      toggleDesignMode,
      isPreviewMode,
      setIsPreviewMode,
      togglePreviewMode,
      selectedElementId,
      selectedContainerId,
      selectedElementLabel,
      selectedSortItemId,
      selectElement,
      draggedItemId,
      activePageKey,
      getElementStyle,
      getElementContent,
      setElementStyle,
      setElementContent,
      toggleElementVisibility,
      getOrderedItems,
      reorderContainerByMouse,
      moveItemInContainer,
      getContainerOrder,
      hasUnsavedChanges,
      saveAllDesigns,
      resetElement,
      resetCurrentPage,
      resetAllDesigns,
      computeElementClasses,
    ]
  );

  return <DesignEditorContext.Provider value={value}>{children}</DesignEditorContext.Provider>;
};

export const useDesignEditor = () => {
  const context = useContext(DesignEditorContext);
  if (!context) {
    throw new Error('useDesignEditor must be used within a DesignEditorProvider');
  }
  return context;
};
