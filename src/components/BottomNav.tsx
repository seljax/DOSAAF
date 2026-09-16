import React from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, CheckSquare, Compass, GraduationCap, CalendarClock, ShieldCheck, Lock, User as UserIcon } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { isAdmin, currentUser, canAccessTab } = useApp();

  const isStudentLoggedIn = Boolean(currentUser && currentUser.name && !isAdmin);

  const navItems = [
    { id: 'rules', label: 'ПДД', icon: BookOpen },
    { id: 'tests', label: 'Тесты', icon: CheckSquare },
    { id: 'materials', label: 'Материалы', icon: Compass },
    { id: 'lessons', label: 'Занятия', icon: GraduationCap },
    isAdmin || isStudentLoggedIn
      ? { id: 'profile', label: 'Профиль', icon: UserIcon }
      : { id: 'schedule', label: 'График', icon: CalendarClock },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-neutral-200 safe-area-pb">
      <div className="grid grid-cols-5 h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const hasAccess = canAccessTab(item.id);

          return (
            <button
              key={item.id}
              onClick={() => {
                if (hasAccess) {
                  setActiveTab(item.id);
                } else {
                  alert(`Доступ к разделу "${item.label}" ограничен администратором.`);
                }
              }}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                !hasAccess
                  ? 'text-neutral-300 opacity-60'
                  : isActive
                  ? 'text-blue-600'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4.5 h-4.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {!hasAccess && (
                  <Lock className="w-2.5 h-2.5 text-amber-500 absolute -top-1 -right-1 bg-white rounded-full" />
                )}
              </div>
              <span className={`text-[9px] sm:text-[10px] font-medium leading-none ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
              {isActive && hasAccess && (
                <span className="absolute top-0 w-8 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
