import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useDesignEditor } from '../context/DesignEditorContext';
import { GroupType } from '../types';
import {
  Car,
  ShieldAlert,
  User as UserIcon,
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Layers,
  Compass,
  Lock,
  FileText,
  Edit3,
  Palette,
  MousePointer,
  Users,
} from 'lucide-react';
import { AuthModal } from './AuthModal';
import { GroupSettingsModal } from './GroupSettingsModal';
import { StudentManagementModal } from './StudentManagementModal';
import { NavTabsEditorModal } from './NavTabsEditorModal';
import { EditableDesignBlock } from './EditableDesignBlock';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const {
    currentUser,
    isAdmin,
    adminCredentials,
    selectedGroupTab,
    setSelectedGroupTab,
    exportDataJson,
    importDataJson,
    resetToDefaults,
    groups,
    getGroupName,
    canAccessTab,
    navTabs,
  } = useApp();
  const { isDesignMode, toggleDesignMode } = useDesignEditor();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isNavTabsModalOpen, setIsNavTabsModalOpen] = useState(false);

  const group1 = groups.find((g) => g.id === 'group7_mkpp') || groups[0];
  const group2 = groups.find((g) => g.id === 'group8_akpp') || groups[1];

  const handleExport = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avtoshkola_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const res = importDataJson(content);
          if (res.success) {
            alert('Данные успешно импортированы!');
          } else {
            alert('Ошибка импорта: ' + (res.error || 'Неверный формат'));
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('Сбросить все правила, знаки, вопросы и журнал занятий к первоначальному состоянию?')) {
      resetToDefaults();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40">
        {/* Admin Bar if logged in */}
        {isAdmin && (
          <div className="bg-amber-600 text-white text-xs px-4 py-1.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Режим администратора ({adminCredentials.login}) — Полный доступ и управление</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsStudentModalOpen(true)}
                className="bg-neutral-900 hover:bg-neutral-950 text-white px-3 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                title="Управление курсантами, пароли, доступы к вкладкам и экзаменам, смена пароля админа"
              >
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Курсанты и безопасность</span>
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                  activeTab === 'logs'
                    ? 'bg-neutral-950 text-amber-300 ring-2 ring-amber-300'
                    : 'bg-amber-800 hover:bg-neutral-900 text-white'
                }`}
                title="Журнал действий курсантов (смена паролей, входы, тестирование)"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>ЛОГИ</span>
              </button>
              <button
                onClick={() => setIsNavTabsModalOpen(true)}
                className="bg-amber-700 hover:bg-amber-800 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                title="Настроить порядок и названия вкладок меню"
              >
                <Edit3 className="w-3 h-3" />
                <span>Вкладки меню</span>
              </button>
              <button
                onClick={toggleDesignMode}
                className={`px-3 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                  isDesignMode
                    ? 'bg-neutral-950 text-amber-300 ring-2 ring-amber-300'
                    : 'bg-amber-800 hover:bg-neutral-900 text-white'
                }`}
                title="Включить визуальный Редактор: кликайте элементы мышкой и перемещайте их"
              >
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Редактор: {isDesignMode ? 'ВКЛ' : 'ВЫКЛ'}</span>
              </button>
              <button
                onClick={() => setIsGroupModalOpen(true)}
                className="bg-amber-700 hover:bg-amber-800 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                title="Изменить номер и параметры учебных групп"
              >
                <Layers className="w-3 h-3" />
                <span>Настройка групп</span>
              </button>
              <button
                onClick={handleExport}
                className="hover:bg-amber-700 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                title="Экспорт резервной копии базы данных"
              >
                <Download className="w-3 h-3" />
                <span className="hidden sm:inline">Экспорт</span>
              </button>
              <button
                onClick={handleImport}
                className="hover:bg-amber-700 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                title="Импорт базы данных"
              >
                <Upload className="w-3 h-3" />
                <span className="hidden sm:inline">Импорт</span>
              </button>
              <button
                onClick={handleReset}
                className="hover:bg-amber-700 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                title="Сброс к заводским данным"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Сброс</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Design Mode Prompt Ribbon */}
        {isAdmin && isDesignMode && (
          <div className="bg-neutral-900 text-amber-200 text-xs px-4 py-1.5 border-b border-amber-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <MousePointer className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
              <span>
                <strong>Редактор активен:</strong> Кликайте любой элемент страницы (включая шапку) для редактирования стиля/текста или перетаскивайте карточки мышкой!
              </span>
            </div>
            <button
              onClick={() => toggleDesignMode()}
              className="text-[11px] bg-neutral-800 hover:bg-neutral-700 px-2.5 py-0.5 rounded text-white font-medium shrink-0 transition-colors"
            >
              Завершить
            </button>
          </div>
        )}

        {/* Editable Main Header Bar */}
        <EditableDesignBlock
          id="main_header_bar"
          label="Шапка сайта (Header)"
          defaultClasses={{
            bg: 'bg-white/95 backdrop-blur-md',
            border: 'border-b border-neutral-200',
            radius: 'rounded-none',
            padding: 'p-0',
            shadow: 'shadow-2xs',
          }}
          className="w-full"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
              {/* Logo and Group Brand (Wrapped in EditableDesignBlock) */}
              <EditableDesignBlock
                id="header_brand"
                label="Логотип и Название ДОСААФ"
                defaultTitle="ДОСААФ"
                defaultBadge="Кат. B"
                defaultClasses={{
                  bg: 'bg-transparent',
                  border: 'border-transparent',
                  radius: 'rounded-xl',
                  padding: 'p-1',
                  shadow: 'shadow-none',
                }}
              >
                {({ title, badge }) => (
                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                    <img
                      src="/favicon.jpeg"
                      alt="ДОСААФ РОССИИ"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-contain shadow-xs shrink-0 ring-1 ring-neutral-200 dark:ring-neutral-700 bg-white"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-base sm:text-lg tracking-tight leading-none">
                          {title || 'ДОСААФ'}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-bold border border-neutral-200">
                          {badge || 'Кат. B'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-neutral-500 font-medium overflow-hidden max-w-[220px] sm:max-w-none mt-0.5">
                        {groups.slice(0, 3).map((g, idx) => (
                          <React.Fragment key={g.id}>
                            {idx > 0 && <span className="text-neutral-300">•</span>}
                            <span className={g.transmission === 'АКПП' ? 'text-indigo-700 font-semibold' : 'text-blue-700 font-semibold'}>
                              Гр. №{g.number} ({g.transmission})
                            </span>
                          </React.Fragment>
                        ))}
                        {groups.length > 3 && (
                          <span className="text-neutral-400 text-[10px]">+{groups.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </EditableDesignBlock>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
              {[...navTabs]
                .filter((t) => t.isVisible)
                .sort((a, b) => a.order - b.order)
                .map((item) => {
                  const hasAccess = canAccessTab(item.id);
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (hasAccess) {
                          setActiveTab(item.id);
                        } else {
                          alert(
                            `Доступ к разделу "${item.label}" ограничен администратором для вашей учётной записи.`
                          );
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                        !hasAccess
                          ? 'text-neutral-400 opacity-60 hover:bg-neutral-100/50 cursor-not-allowed'
                          : isActive
                          ? 'bg-neutral-100 text-neutral-900 font-semibold'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                      }`}
                      title={!hasAccess ? 'Доступ ограничен администратором' : undefined}
                    >
                      <span>{item.label}</span>
                      {!hasAccess && <Lock className="w-3 h-3 text-neutral-400 shrink-0" />}
                    </button>
                  );
                })}

              {/* Profile Tab: Available when student is logged in, OR when administrator is logged in */}
              {(isAdmin || (currentUser && Boolean(currentUser.name))) && (
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'profile'
                      ? isAdmin
                        ? 'bg-amber-100 text-amber-900 font-bold'
                        : 'bg-blue-100 text-blue-900 font-bold'
                      : isAdmin
                      ? 'text-amber-800 hover:bg-amber-50 font-semibold'
                      : 'text-blue-700 hover:bg-blue-50 font-semibold'
                  }`}
                  title={isAdmin ? 'Кабинет администратора' : 'Личный кабинет курсанта'}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Профиль</span>
                </button>
              )}

              {/* Statistics is visible ONLY for Admin */}
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                    activeTab === 'stats'
                      ? 'bg-amber-100 text-amber-900 font-bold'
                      : 'text-amber-800 hover:bg-amber-50 font-semibold'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Ведомость</span>
                </button>
              )}
            </nav>

            {/* Group Filter & User Auth Button */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Group Pill Selector */}
              <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200 text-xs overflow-x-auto max-w-[200px] sm:max-w-none">
                <button
                  type="button"
                  onClick={() => setSelectedGroupTab('all')}
                  className={`px-2 py-1 rounded-md transition-all font-medium shrink-0 ${
                    selectedGroupTab === 'all'
                      ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Все
                </button>
                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroupTab(g.id)}
                    className={`px-2 py-1 rounded-md transition-all font-medium shrink-0 ${
                      selectedGroupTab === g.id
                        ? g.transmission === 'АКПП'
                          ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                          : 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                    title={`${g.name}: ${g.transmissionLabel}`}
                  >
                    Гр. {g.number}
                  </button>
                ))}
              </div>

              {/* User / Admin pill button - Opens Auth Modal for login / switch / logout */}
              <button
                onClick={() => setIsAuthOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  isAdmin
                    ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : currentUser && currentUser.name
                    ? 'border-blue-300 bg-blue-50 text-blue-900 font-semibold hover:bg-blue-100'
                    : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                }`}
                title={
                  isAdmin
                    ? `Администратор (${adminCredentials.login}) — кликните для управления доступом`
                    : currentUser && currentUser.name
                    ? `Курсант: ${currentUser.name} — кликните для выхода или смены`
                    : 'Вход в систему ДОСААФ (Курсант / Администратор)'
                }
              >
                {isAdmin ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-semibold hidden xs:inline">Админ ({adminCredentials.login})</span>
                  </>
                ) : currentUser && currentUser.name ? (
                  <>
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate max-w-[80px] sm:max-w-[110px] font-semibold">
                      {currentUser.name}
                    </span>
                  </>
                ) : (
                  <>
                    <UserIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-bold">Войти</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        </EditableDesignBlock>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultTab={isAdmin ? 'admin' : 'student'}
      />

      {/* Group Configuration Modal for Admin */}
      <GroupSettingsModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />

      {/* Student Management & Security Modal for Admin */}
      <StudentManagementModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
      />

      {/* Navigation Tabs Order & Rename Modal */}
      <NavTabsEditorModal
        isOpen={isNavTabsModalOpen}
        onClose={() => setIsNavTabsModalOpen(false)}
      />
    </>
  );
};
