import React from 'react';
import { useApp } from '../context/AppContext';
import { AppTheme } from '../types';
import { Sun, Moon, Shield, Palette } from 'lucide-react';

export const ThemeSwitcherBar: React.FC = () => {
  const { appTheme, setAppTheme } = useApp();

  const themes: { id: AppTheme; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'light', label: 'Светлая', icon: Sun },
    { id: 'dark', label: 'Тёмная', icon: Moon },
    { id: 'dosaaf_navy', label: 'Тёмно-синяя', icon: Shield },
  ];

  return (
    <div className="flex items-center justify-center p-2">
      <div className="inline-flex items-center gap-1.5 p-1 bg-neutral-100/90 dark:bg-neutral-800/90 rounded-2xl border border-neutral-300 dark:border-neutral-700 shadow-xs text-xs backdrop-blur-md">
        <div className="flex items-center gap-1.5 px-2 py-1 text-neutral-500 dark:text-neutral-400 font-semibold text-[11px] shrink-0">
          <Palette className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden xs:inline">Оформление:</span>
        </div>

        {themes.map((t) => {
          const Icon = t.icon;
          const isActive = appTheme === t.id;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setAppTheme(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-neutral-900 text-blue-700 dark:text-blue-400 shadow-xs ring-1 ring-neutral-300 dark:ring-neutral-600 scale-[1.02]'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-700/50'
              }`}
              title={`Включить тему: ${t.label}`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
