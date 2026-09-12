import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NavTabConfig } from '../types';
import {
  X,
  Save,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sliders,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface NavTabsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NavTabsEditorModal: React.FC<NavTabsEditorModalProps> = ({ isOpen, onClose }) => {
  const { navTabs, updateNavTabs } = useApp();

  const [tabs, setTabs] = useState<NavTabConfig[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      // Clone sorted by order
      const sorted = [...navTabs].sort((a, b) => a.order - b.order);
      setTabs(sorted);
      setSaveSuccess(false);
    }
  }, [isOpen, navTabs]);

  if (!isOpen) return null;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newTabs = [...tabs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newTabs.length) return;

    const temp = newTabs[index];
    newTabs[index] = newTabs[targetIndex];
    newTabs[targetIndex] = temp;

    // Recalculate orders
    newTabs.forEach((t, i) => {
      t.order = i + 1;
    });

    setTabs(newTabs);
  };

  const handleLabelChange = (id: string, newLabel: string) => {
    setTabs(tabs.map((t) => (t.id === id ? { ...t, label: newLabel } : t)));
  };

  const handleToggleVisibility = (id: string) => {
    setTabs(tabs.map((t) => (t.id === id ? { ...t, isVisible: !t.isVisible } : t)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateNavTabs(tabs);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    if (confirm('Сбросить названия и порядок вкладок меню к стандартным?')) {
      const defaultTabs: NavTabConfig[] = [
        { id: 'rules', label: 'Правила и знаки', isVisible: true, order: 1 },
        { id: 'tests', label: 'Тесты и экзамен', isVisible: true, order: 2 },
        { id: 'materials', label: 'Полезные материалы', isVisible: true, order: 3 },
        { id: 'lessons', label: 'Пройденные занятия', isVisible: true, order: 4 },
        { id: 'schedule', label: 'Расписание', isVisible: true, order: 5 },
      ];
      setTabs(defaultTabs);
      updateNavTabs(defaultTabs);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-neutral-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500 text-neutral-950 flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Настройка вкладок меню</h2>
              <span className="text-xs text-neutral-400 block">
                Изменение названий и порядка расположения вкладок
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Порядок и названия вкладок успешно сохранены!</span>
            </div>
          )}

          <p className="text-neutral-500 text-xs">
            Используйте стрелочки для изменения порядка отображения вкладок в шапке сайта. Вы также можете переименовать любую вкладку или скрыть её.
          </p>

          <div className="space-y-2.5">
            {tabs.map((tab, idx) => (
              <div
                key={tab.id}
                className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-2.5 hover:bg-neutral-100/50 transition-colors"
              >
                {/* Drag / Up-Down Order Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1 text-neutral-500 hover:text-blue-600 disabled:opacity-30 rounded hover:bg-white transition-colors"
                    title="Переместить выше"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === tabs.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1 text-neutral-500 hover:text-blue-600 disabled:opacity-30 rounded hover:bg-white transition-colors"
                    title="Переместить ниже"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-5 text-center font-mono font-bold text-neutral-400 text-[11px]">
                    {idx + 1}
                  </span>
                </div>

                {/* Editable Label */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    required
                    value={tab.label}
                    onChange={(e) => handleLabelChange(tab.id, e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Название вкладки"
                  />
                </div>

                {/* Visibility Toggle */}
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(tab.id)}
                    className={`p-2 rounded-xl border transition-colors ${
                      tab.isVisible
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-neutral-200 text-neutral-500 border-neutral-300 hover:bg-neutral-300'
                    }`}
                    title={tab.isVisible ? 'Вкладка видна' : 'Вкладка скрыта'}
                  >
                    {tab.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 flex items-center gap-1.5 transition-colors font-medium text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-50 font-semibold"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Сохранить порядок</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
