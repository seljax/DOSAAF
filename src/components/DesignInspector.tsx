import React, { useState } from 'react';
import { useDesignEditor } from '../context/DesignEditorContext';
import { useApp } from '../context/AppContext';
import {
  DesignBgTheme,
  DesignBorderRadius,
  DesignPadding,
  DesignBorder,
  DesignShadow,
  DesignTextColor,
} from '../types';
import {
  Palette,
  Layout,
  Type,
  Move,
  Save,
  RotateCcw,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Eye,
  EyeOff,
  Sparkles,
  MousePointer,
  HelpCircle,
  Minimize2,
  Maximize2,
  SlidersHorizontal,
  Layers,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Wrench,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
} from 'lucide-react';

export const DesignInspector: React.FC = () => {
  const { isAdmin } = useApp();
  const {
    isDesignMode,
    setIsDesignMode,
    isPreviewMode,
    togglePreviewMode,
    selectedElementId,
    selectedContainerId,
    selectedElementLabel,
    selectedSortItemId,
    selectElement,
    getElementStyle,
    getElementContent,
    setElementStyle,
    setElementContent,
    toggleElementVisibility,
    resetElement,
    resetCurrentPage,
    resetAllDesigns,
    saveAllDesigns,
    activePageKey,
    hasUnsavedChanges,
    moveItemInContainer,
    getContainerOrder,
  } = useDesignEditor();

  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'advanced'>('style');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  if (!isAdmin || !isDesignMode) {
    return null;
  }

  const currentStyle = selectedElementId ? getElementStyle(selectedElementId) : {};
  const currentContent = selectedElementId ? getElementContent(selectedElementId) : {};

  const handleManualSave = () => {
    saveAllDesigns();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResetCurrentPage = () => {
    if (confirm('Сбросить весь кастомный дизайн и порядок карточек на текущей странице к исходному виду ДОСААФ?')) {
      resetCurrentPage(activePageKey);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleResetCurrentElement = () => {
    if (selectedElementId) {
      resetElement(selectedElementId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  // Color Swatches Definitions (Elementor Style)
  const bgThemes: { key: DesignBgTheme; label: string; previewClass: string }[] = [
    { key: 'default', label: 'По умолчанию', previewClass: 'bg-neutral-100 border-neutral-300' },
    { key: 'white', label: 'Белоснежный', previewClass: 'bg-white border-neutral-300' },
    { key: 'slate_light', label: 'Светло-серый', previewClass: 'bg-slate-100 border-slate-300' },
    { key: 'blue_light', label: 'Синий ДОСААФ', previewClass: 'bg-blue-100 border-blue-400' },
    { key: 'indigo_light', label: 'Индиго', previewClass: 'bg-indigo-100 border-indigo-400' },
    { key: 'emerald_light', label: 'Изумрудный', previewClass: 'bg-emerald-100 border-emerald-400' },
    { key: 'amber_light', label: 'Янтарный', previewClass: 'bg-amber-100 border-amber-400' },
    { key: 'rose_light', label: 'Рубиновый', previewClass: 'bg-rose-100 border-rose-400' },
    { key: 'dark_slate', label: 'Графит', previewClass: 'bg-slate-900 border-slate-700 text-white' },
    {
      key: 'gradient_blue',
      label: 'Синий Градиент',
      previewClass: 'bg-gradient-to-r from-blue-700 to-indigo-900 text-white',
    },
    {
      key: 'gradient_indigo',
      label: 'Индиго Градиент',
      previewClass: 'bg-gradient-to-r from-indigo-800 to-purple-950 text-white',
    },
    {
      key: 'gradient_emerald',
      label: 'Автодром Градиент',
      previewClass: 'bg-gradient-to-r from-emerald-800 to-teal-950 text-white',
    },
    {
      key: 'gradient_dark',
      label: 'Темный Премиум',
      previewClass: 'bg-gradient-to-r from-neutral-900 to-stone-950 text-white',
    },
  ];

  const borderOptions: { key: DesignBorder; label: string }[] = [
    { key: 'default', label: 'По умолчанию' },
    { key: 'none', label: 'Без границы' },
    { key: 'subtle', label: 'Тонкая серая (1px)' },
    { key: 'blue', label: 'Синяя ДОСААФ (2px)' },
    { key: 'emerald', label: 'Изумрудная (2px)' },
    { key: 'amber', label: 'Янтарная (2px)' },
    { key: 'dark', label: 'Строгая графитовая (2px)' },
  ];

  const radiusOptions: { key: DesignBorderRadius; label: string }[] = [
    { key: 'default', label: 'Стандарт' },
    { key: 'sharp', label: 'Прямые (0px)' },
    { key: 'medium', label: 'Умеренные (12px)' },
    { key: 'rounded', label: 'Мягкие (24px)' },
    { key: 'full', label: 'Овальные (Пилл)' },
  ];

  const paddingOptions: { key: DesignPadding; label: string }[] = [
    { key: 'default', label: 'Стандарт' },
    { key: 'compact', label: 'Компактные (8-14px)' },
    { key: 'normal', label: 'Обычные (18-24px)' },
    { key: 'spacious', label: 'Просторные (28-36px)' },
  ];

  const shadowOptions: { key: DesignShadow; label: string }[] = [
    { key: 'default', label: 'Стандарт' },
    { key: 'none', label: 'Без тени' },
    { key: 'subtle', label: 'Мягкая деликатная' },
    { key: 'card', label: 'Карточная объемная' },
    { key: 'elevated', label: 'Глубокая выраженная' },
  ];

  const textColorOptions: { key: DesignTextColor; label: string; previewClass: string }[] = [
    { key: 'default', label: 'Стандарт', previewClass: 'bg-neutral-200' },
    { key: 'neutral_dark', label: 'Темный текст', previewClass: 'bg-neutral-900' },
    { key: 'neutral_muted', label: 'Приглушенный серый', previewClass: 'bg-neutral-500' },
    { key: 'blue', label: 'Синий акцент', previewClass: 'bg-blue-600' },
    { key: 'emerald', label: 'Изумрудный', previewClass: 'bg-emerald-600' },
    { key: 'amber', label: 'Янтарный', previewClass: 'bg-amber-600' },
    { key: 'white', label: 'Белоснежный', previewClass: 'bg-white border border-neutral-400' },
  ];

  return (
    <>
      {/* Floating collapsed toggle button when panel is closed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed top-20 left-4 z-50 bg-[#1e222d] text-white p-3 rounded-2xl shadow-2xl border border-neutral-700 hover:bg-[#282d3c] transition-all flex items-center gap-2 group cursor-pointer"
          title="Развернуть панель Редактора"
        >
          <div className="w-6 h-6 rounded-lg bg-sky-600 text-white font-black flex items-center justify-center text-xs">
            Р
          </div>
          <span className="text-xs font-bold text-neutral-200 group-hover:text-white">
            Редактор
          </span>
          <PanelLeftOpen className="w-4 h-4 text-neutral-400 group-hover:text-white" />
        </button>
      )}

      {/* Main Docked Sidebar */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 w-84 sm:w-96 bg-[#181b24] text-neutral-200 border-r border-neutral-800 shadow-2xl flex flex-col transition-transform duration-200 ease-in-out select-none ${
          isCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        {/* TOP BAR */}
        <div className="bg-[#12141b] px-4 py-3 border-b border-neutral-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Editor Iconic Emblem */}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md">
              Р
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wider text-white uppercase">
                  Редактор
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  ВИЗУАЛЬНЫЙ
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 block leading-tight">
                Инспектор стилей и блоков
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors"
              title="Свернуть панель"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsDesignMode(false)}
              className="p-1.5 hover:bg-rose-900/40 text-neutral-400 hover:text-rose-400 rounded-lg transition-colors"
              title="Закрыть редактор"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SELECTED ELEMENT HEADER */}
        {selectedElementId ? (
          <div className="px-4 py-2.5 bg-[#202430] border-b border-neutral-800 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block">
                  Редактирование элемента:
                </span>
                <span className="text-xs font-bold text-white truncate block">
                  {selectedElementLabel || selectedElementId}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleElementVisibility(selectedElementId)}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    currentStyle.isHidden
                      ? 'bg-rose-900/60 text-rose-300'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                  title={currentStyle.isHidden ? 'Показать элемент' : 'Скрыть со страницы'}
                >
                  {currentStyle.isHidden ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={handleResetCurrentElement}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors"
                  title="Сбросить оформление этого блока"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => selectElement(null)}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg text-xs transition-colors"
                  title="Снять выделение"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-[#1c202a] border-b border-neutral-800 text-xs text-neutral-300 flex items-center gap-2 shrink-0">
            <MousePointer className="w-4 h-4 text-sky-400 shrink-0 animate-bounce" />
            <span className="text-[11px] text-neutral-300">
              <strong>Кликните мышкой</strong> по любому элементу страницы или шапке для редактирования.
            </span>
          </div>
        )}

        {/* 3 CLASSIC ELEMENTOR TABS */}
        <div className="grid grid-cols-3 bg-[#141620] border-b border-neutral-800 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-2.5 flex items-center justify-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'content'
                ? 'border-sky-500 text-white bg-[#1a1e2a]'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-sky-400" />
            <span>Контент</span>
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`py-2.5 flex items-center justify-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'style'
                ? 'border-sky-500 text-white bg-[#1a1e2a]'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span>Стиль</span>
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`py-2.5 flex items-center justify-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'advanced'
                ? 'border-sky-500 text-white bg-[#1a1e2a]'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Расшир.</span>
          </button>
        </div>

        {/* TAB CONTENTS (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
          {!selectedElementId ? (
            /* Empty State: Guide & Quick Select */
            <div className="space-y-4 py-2">
              <div className="p-3.5 rounded-xl bg-[#202533] border border-neutral-700/60 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Возможности Elementor ДОСААФ:</span>
                </div>
                <ul className="text-[11px] text-neutral-300 space-y-1.5 list-disc pl-4">
                  <li>
                    <strong>Живой редактор:</strong> Кликайте мышкой по шапке, карточкам правил, билетам и материалам.
                  </li>
                  <li>
                    <strong>Drag & Drop:</strong> Зажимайте карточки мышкой и меняйте их порядок прямо на странице.
                  </li>
                  <li>
                    <strong>Шапка сайта:</strong> Кликните по логотипу или строке шапки для смены названия, цветов и бейджа.
                  </li>
                </ul>
              </div>

              {/* Quick Select Buttons */}
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                  Быстрый выбор блоков:
                </span>
                <div className="space-y-1.5">
                  <button
                    onClick={() => selectElement('main_header_bar', undefined, 'Шапка сайта (Header)')}
                    className="w-full text-left p-2.5 rounded-xl bg-[#202533] hover:bg-[#282f42] border border-neutral-700/60 transition-colors flex items-center justify-between"
                  >
                    <span className="font-semibold text-neutral-200">Шапка сайта (Header)</span>
                    <span className="text-[10px] text-sky-400 font-bold">Выбрать →</span>
                  </button>
                  <button
                    onClick={() => selectElement('header_brand', undefined, 'Логотип и Бренд ДОСААФ')}
                    className="w-full text-left p-2.5 rounded-xl bg-[#202533] hover:bg-[#282f42] border border-neutral-700/60 transition-colors flex items-center justify-between"
                  >
                    <span className="font-semibold text-neutral-200">Логотип и Название ДОСААФ</span>
                    <span className="text-[10px] text-sky-400 font-bold">Выбрать →</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Selected Element Controls */
            <>
              {/* TAB 1: CONTENT */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      Заголовок / Название:
                    </label>
                    <input
                      type="text"
                      value={currentContent.title || ''}
                      onChange={(e) =>
                        setElementContent(selectedElementId, { title: e.target.value })
                      }
                      placeholder="Исходный заголовок..."
                      className="w-full px-3 py-2 rounded-xl bg-[#202533] border border-neutral-700 text-xs text-white focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      Подзаголовок / Описание:
                    </label>
                    <textarea
                      rows={3}
                      value={currentContent.subtitle || ''}
                      onChange={(e) =>
                        setElementContent(selectedElementId, { subtitle: e.target.value })
                      }
                      placeholder="Исходный подзаголовок или описание..."
                      className="w-full px-3 py-2 rounded-xl bg-[#202533] border border-neutral-700 text-xs text-white focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      Текст бейджа / Метки:
                    </label>
                    <input
                      type="text"
                      value={currentContent.badge || ''}
                      onChange={(e) =>
                        setElementContent(selectedElementId, { badge: e.target.value })
                      }
                      placeholder="Например: ПДД 2026, Кат. B или Важно"
                      className="w-full px-3 py-2 rounded-xl bg-[#202533] border border-neutral-700 text-xs text-white focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: STYLE */}
              {activeTab === 'style' && (
                <div className="space-y-4">
                  {/* Background Color Swatches */}
                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                      Цвет фона / Заливка:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {bgThemes.map((bg) => {
                        const isCurrent =
                          currentStyle.bgTheme === bg.key ||
                          (!currentStyle.bgTheme && bg.key === 'default');
                        return (
                          <button
                            key={bg.key}
                            onClick={() =>
                              setElementStyle(selectedElementId, {
                                bgTheme: bg.key,
                                textColor:
                                  bg.key.startsWith('gradient_') || bg.key === 'dark_slate'
                                    ? 'white'
                                    : undefined,
                              })
                            }
                            className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all relative ${
                              isCurrent
                                ? 'border-sky-500 bg-[#252c3d] ring-2 ring-sky-500/30'
                                : 'border-neutral-800 bg-[#1c202a] hover:border-neutral-700'
                            }`}
                          >
                            <div
                              className={`w-full h-4 rounded-md mb-1 border ${bg.previewClass}`}
                            />
                            <span className="text-[10px] text-neutral-200 block truncate">
                              {bg.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Typography & Text Color */}
                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                      Цвет текста:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {textColorOptions.map((tc) => {
                        const isCurrent =
                          currentStyle.textColor === tc.key ||
                          (!currentStyle.textColor && tc.key === 'default');
                        return (
                          <button
                            key={tc.key}
                            onClick={() =>
                              setElementStyle(selectedElementId, { textColor: tc.key })
                            }
                            className={`px-2.5 py-1.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                              isCurrent
                                ? 'border-sky-500 bg-[#252c3d] text-white font-bold'
                                : 'border-neutral-800 bg-[#1c202a] text-neutral-400 hover:text-white'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full shrink-0 ${tc.previewClass}`} />
                            <span className="truncate">{tc.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Border Radius */}
                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      Скругление углов (Border Radius):
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {radiusOptions.map((rad) => {
                        const isCurrent =
                          currentStyle.borderRadius === rad.key ||
                          (!currentStyle.borderRadius && rad.key === 'default');
                        return (
                          <button
                            key={rad.key}
                            onClick={() =>
                              setElementStyle(selectedElementId, { borderRadius: rad.key })
                            }
                            className={`px-2.5 py-1.5 rounded-xl border text-xs text-left transition-all ${
                              isCurrent
                                ? 'border-sky-500 bg-[#252c3d] text-white font-bold'
                                : 'border-neutral-800 bg-[#1c202a] text-neutral-400 hover:text-white'
                            }`}
                          >
                            {rad.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Border Style */}
                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      Граница / Рамка (Border):
                    </label>
                    <select
                      value={currentStyle.border || 'default'}
                      onChange={(e) =>
                        setElementStyle(selectedElementId, {
                          border: e.target.value as DesignBorder,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#202533] border border-neutral-700 text-xs text-white"
                    >
                      {borderOptions.map((b) => (
                        <option key={b.key} value={b.key}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Padding */}
                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      Внутренние отступы (Padding):
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {paddingOptions.map((pad) => {
                        const isCurrent =
                          currentStyle.padding === pad.key ||
                          (!currentStyle.padding && pad.key === 'default');
                        return (
                          <button
                            key={pad.key}
                            onClick={() =>
                              setElementStyle(selectedElementId, { padding: pad.key })
                            }
                            className={`px-2.5 py-1.5 rounded-xl border text-xs text-left transition-all ${
                              isCurrent
                                ? 'border-sky-500 bg-[#252c3d] text-white font-bold'
                                : 'border-neutral-800 bg-[#1c202a] text-neutral-400 hover:text-white'
                            }`}
                          >
                            {pad.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Shadow */}
                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      Тень блока (Box Shadow):
                    </label>
                    <select
                      value={currentStyle.shadow || 'default'}
                      onChange={(e) =>
                        setElementStyle(selectedElementId, {
                          shadow: e.target.value as DesignShadow,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#202533] border border-neutral-700 text-xs text-white"
                    >
                      {shadowOptions.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 3: ADVANCED */}
              {activeTab === 'advanced' && (
                <div className="space-y-4">
                  {/* Position & Ordering if inside a container */}
                  {selectedContainerId && (
                    <div className="p-3 rounded-xl bg-[#202533] border border-neutral-700/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                          Порядок карточки в списке:
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {selectedContainerId}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-300">
                        Вы можете <strong>перетаскивать мышкой</strong> карточку прямо на экране, или использовать кнопки быстрого перемещения:
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            const itemId = selectedSortItemId || selectedElementId;
                            moveItemInContainer(selectedContainerId, itemId, 'up', []);
                          }}
                          className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
                          <span>Выше (Назад)</span>
                        </button>
                        <button
                          onClick={() => {
                            const itemId = selectedSortItemId || selectedElementId;
                            moveItemInContainer(selectedContainerId, itemId, 'down', []);
                          }}
                          className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
                          <span>Ниже (Вперед)</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => {
                            const itemId = selectedSortItemId || selectedElementId;
                            moveItemInContainer(selectedContainerId, itemId, 'start', []);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center justify-center gap-1"
                        >
                          <ChevronsUp className="w-3 h-3 text-sky-400" />
                          <span>В самое начало</span>
                        </button>
                        <button
                          onClick={() => {
                            const itemId = selectedSortItemId || selectedElementId;
                            moveItemInContainer(selectedContainerId, itemId, 'end', []);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center justify-center gap-1"
                        >
                          <ChevronsDown className="w-3 h-3 text-sky-400" />
                          <span>В самый конец</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Visibility toggle */}
                  <div className="p-3 rounded-xl bg-[#202533] border border-neutral-700/60 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Видимость элемента:
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {currentStyle.isHidden ? 'Скрыт со страницы' : 'Отображается всем курсантам'}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleElementVisibility(selectedElementId)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                        currentStyle.isHidden
                          ? 'bg-rose-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {currentStyle.isHidden ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Скрыт</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Виден</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Reset single element */}
                  <button
                    onClick={handleResetCurrentElement}
                    className="w-full p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-semibold flex items-center justify-center gap-2 border border-neutral-700 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Сбросить оформление этого блока</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ELEMENTOR BOTTOM ACTION DOCK (Iconic Elementor Green Update Button) */}
        <div className="bg-[#12141b] p-3 border-t border-neutral-800 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            {/* Big Green Elementor Update Button */}
            <button
              onClick={handleManualSave}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white animate-bounce" />
                  <span>СОХРАНЕНО!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>ОБНОВИТЬ</span>
                </>
              )}
            </button>

            {/* Preview Mode Toggle Button */}
            <button
              onClick={togglePreviewMode}
              className={`p-2.5 rounded-xl border transition-colors ${
                isPreviewMode
                  ? 'bg-sky-600 text-white border-sky-400'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
              }`}
              title={isPreviewMode ? 'Выйти из режима предпросмотра' : 'Предпросмотр (без рамок)'}
            >
              {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <button
              onClick={handleResetCurrentPage}
              className="text-neutral-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
              title="Сбросить все кастомизации на открытой странице"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Сбросить страницу</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Сбросить ВСЕ кастомные дизайны на всех страницах и вернуть исходный стиль автошколы?')) {
                  resetAllDesigns();
                }
              }}
              className="text-neutral-500 hover:text-neutral-300 transition-colors"
              title="Сброс всей базы кастомизаций"
            >
              Сбросить всё
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
