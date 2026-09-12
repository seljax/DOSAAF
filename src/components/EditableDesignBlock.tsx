import React, { useState } from 'react';
import { useDesignEditor } from '../context/DesignEditorContext';
import { useApp } from '../context/AppContext';
import {
  GripVertical,
  Edit2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface EditableDesignBlockProps {
  id: string;
  sortItemId?: string;
  containerId?: string;
  label: string;
  defaultTitle?: string;
  defaultSubtitle?: string;
  defaultBadge?: string;
  defaultClasses?: {
    bg?: string;
    border?: string;
    radius?: string;
    padding?: string;
    shadow?: string;
    text?: string;
  };
  className?: string;
  draggable?: boolean;
  allSiblingIds?: string[];
  onClick?: (e: React.MouseEvent) => void;
  children:
    | React.ReactNode
    | ((props: {
        title: string;
        subtitle: string;
        badge: string;
        isDesignMode: boolean;
        isSelected: boolean;
      }) => React.ReactNode);
}

export const EditableDesignBlock: React.FC<EditableDesignBlockProps> = ({
  id,
  sortItemId,
  containerId,
  label,
  defaultTitle = '',
  defaultSubtitle = '',
  defaultBadge = '',
  defaultClasses = {},
  className = '',
  draggable = false,
  allSiblingIds = [],
  onClick,
  children,
}) => {
  const { isAdmin } = useApp();
  const {
    isDesignMode,
    isPreviewMode,
    selectedElementId,
    selectElement,
    getElementStyle,
    getElementContent,
    computeElementClasses,
    draggedItemId,
    setDraggedItemId,
    reorderContainerByMouse,
    moveItemInContainer,
    toggleElementVisibility,
  } = useDesignEditor();

  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Active edit controls only show when Admin is in Design Mode AND not in Preview Mode
  const activeDesignMode = isAdmin && isDesignMode && !isPreviewMode;

  const style = getElementStyle(id);
  const content = getElementContent(id);

  // If hidden by admin, hide completely when not editing
  if (style.isHidden && !activeDesignMode) {
    return null;
  }

  const isSelected = activeDesignMode && selectedElementId === id;
  const effectiveItemId = sortItemId || id;
  const isBeingDragged = activeDesignMode && draggedItemId === effectiveItemId;

  // Computed text overrides
  const effectiveTitle = content.title !== undefined ? content.title : defaultTitle;
  const effectiveSubtitle = content.subtitle !== undefined ? content.subtitle : defaultSubtitle;
  const effectiveBadge = content.badge !== undefined ? content.badge : defaultBadge;

  // Computed style classes
  const computedClasses = computeElementClasses(id, defaultClasses);

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (!activeDesignMode || !draggable || !containerId) return;
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', effectiveItemId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemId(effectiveItemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!activeDesignMode || !draggable || !containerId) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!activeDesignMode || !draggable || !containerId) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const sourceId = e.dataTransfer.getData('text/plain') || draggedItemId;
    if (sourceId && sourceId !== effectiveItemId) {
      reorderContainerByMouse(containerId, sourceId, effectiveItemId, allSiblingIds);
    }
    setDraggedItemId(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragOver(false);
    setDraggedItemId(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (activeDesignMode) {
      e.stopPropagation();
      selectElement(id, containerId, label, sortItemId);
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      id={`editable-${id}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={activeDesignMode && draggable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className={`relative transition-all duration-150 ${computedClasses} ${className} ${
        style.isHidden ? 'opacity-40 border-dashed border-rose-400' : ''
      } ${
        activeDesignMode
          ? 'cursor-pointer hover:outline-2 hover:outline-sky-400 hover:outline-offset-1'
          : ''
      } ${
        isSelected
          ? 'outline-2 outline-sky-500 outline-offset-2 ring-4 ring-sky-500/20 shadow-xl z-20'
          : ''
      } ${
        isBeingDragged ? 'opacity-25 scale-95 border-2 border-dashed border-sky-500' : ''
      } ${
        isDragOver ? 'outline-3 outline-emerald-500 outline-offset-2 bg-emerald-50/20 scale-[1.01]' : ''
      }`}
    >
      {/* Elementor-style Floating Control Badge */}
      {activeDesignMode && (isHovered || isSelected) && (
        <div
          className={`absolute -top-3 left-3 z-30 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-lg transition-all select-none pointer-events-auto ${
            isSelected
              ? 'bg-sky-600 text-white ring-2 ring-sky-300'
              : 'bg-neutral-900/95 text-sky-200 border border-neutral-700 hover:bg-sky-600 hover:text-white'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            selectElement(id, containerId, label, sortItemId);
          }}
        >
          {draggable && (
            <div
              className="flex items-center gap-0.5 cursor-grab active:cursor-grabbing hover:text-white pr-1 border-r border-white/20"
              title="Зажмите и перетаскивайте мышкой для смены порядка"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-3 h-3" />
              <span className="hidden sm:inline text-[9px] font-normal">Порядок</span>
            </div>
          )}

          <div className="flex items-center gap-1 px-1">
            <Edit2 className="w-2.5 h-2.5" />
            <span className="max-w-[130px] truncate">{label}</span>
          </div>

          {/* Quick step reorder arrows and visibility on selected */}
          {isSelected && (
            <div className="flex items-center gap-0.5 pl-1 border-l border-white/30">
              {containerId && allSiblingIds.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveItemInContainer(containerId, effectiveItemId, 'up', allSiblingIds);
                    }}
                    className="hover:bg-white/20 p-0.5 rounded transition-colors"
                    title="Переместить назад / выше"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveItemInContainer(containerId, effectiveItemId, 'down', allSiblingIds);
                    }}
                    className="hover:bg-white/20 p-0.5 rounded transition-colors"
                    title="Переместить вперед / ниже"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleElementVisibility(id);
                }}
                className="hover:bg-white/20 p-0.5 rounded transition-colors ml-0.5"
                title={style.isHidden ? 'Показать элемент' : 'Скрыть со страницы'}
              >
                {style.isHidden ? (
                  <EyeOff className="w-3 h-3 text-rose-300" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Render children */}
      {typeof children === 'function'
        ? children({
            title: effectiveTitle,
            subtitle: effectiveSubtitle,
            badge: effectiveBadge,
            isDesignMode: activeDesignMode,
            isSelected,
          })
        : children}
    </div>
  );
};
