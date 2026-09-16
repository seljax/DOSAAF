import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EditableDesignBlock } from './EditableDesignBlock';
import { ThemeSwitcherBar } from './ThemeSwitcherBar';
import { FooterEditorModal } from './FooterEditorModal';
import {
  Car,
  Mail,
  Phone,
  MapPin,
  Clock,
  Lock,
  Users,
  ShieldCheck,
  Edit2,
  FileText,
  Award,
} from 'lucide-react';

interface FooterProps {
  onOpenAuth: (defaultTab: 'student' | 'admin') => void;
  onOpenStudentModal: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAuth,
  onOpenStudentModal,
  onNavigateToTab,
}) => {
  const { footerSettings, siteInfo, isAdmin, adminCredentials, groups } = useApp();
  const [isFooterEditorOpen, setIsFooterEditorOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-neutral-200 bg-white/95 mt-auto relative z-30">
        {/* Main Footer Container with EditableDesignBlock */}
        <EditableDesignBlock
          id="site_footer_container"
          label="Подвал сайта (Footer)"
          defaultClasses={{
            bg: 'bg-white',
            border: 'border-t border-neutral-200',
            radius: 'rounded-none',
            padding: 'p-0',
            shadow: 'shadow-none',
          }}
          className="w-full"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            {/* Top row: Brand + Contacts + Fast Links */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
              {/* Col 1: School Identity */}
              <div className="md:col-span-1 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center text-white shadow-xs">
                    <Car className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-black text-neutral-900 text-sm tracking-tight block">
                      {footerSettings.schoolName || 'Автошкола ДОСААФ'}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium block">
                      Категория «B» 2026
                    </span>
                  </div>
                </div>

                <p className="text-neutral-500 text-[11px] leading-relaxed">
                  {footerSettings.categoryNotice ||
                    'Официальная подготовка кандидатов в водители на автомобилях с МКПП и АКПП.'}
                </p>

                {footerSettings.licenseNotice && (
                  <p className="text-neutral-400 text-[10px]">
                    {footerSettings.licenseNotice}
                  </p>
                )}
              </div>

              {/* Col 2: School Contacts (User explicitly requested email & phone in footer) */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
                  Контакты учебной части
                </h4>
                <div className="space-y-2 text-neutral-600">
                  <div className="flex items-start gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-semibold">Телефон:</span>
                      <a
                        href={`tel:${footerSettings.phone}`}
                        className="font-bold text-neutral-900 hover:text-blue-600 transition-colors"
                      >
                        {footerSettings.phone || '+7 (999) 000-00-00'}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-semibold">Электронная почта:</span>
                      <a
                        href={`mailto:${footerSettings.email}`}
                        className="font-bold text-neutral-900 hover:text-blue-600 transition-colors"
                      >
                        {footerSettings.email || 'dosaaf.avto@mail.ru'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Col 3: Address & Schedule */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
                  Адрес и график
                </h4>
                <div className="space-y-2 text-neutral-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <span className="text-[11px] leading-snug">
                      {footerSettings.address || 'г. Москва, Волоколамское шоссе, д. 88, стр. 1'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <span className="text-[11px] leading-snug">
                      {footerSettings.workHours || 'Пн-Пт: 09:00 - 20:00, Сб-Вс: 10:00 - 17:00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Col 4: Quick Navigation & Admin edit footer */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
                  Быстрый переход
                </h4>
                <div className="flex flex-col gap-1 text-neutral-600">
                  <button
                    onClick={() => onNavigateToTab('rules')}
                    className="text-left hover:text-blue-600 transition-colors"
                  >
                    • Правила и дорожные знаки
                  </button>
                  <button
                    onClick={() => onNavigateToTab('tests')}
                    className="text-left hover:text-blue-600 transition-colors"
                  >
                    • Тестирование и экзамен
                  </button>
                  <button
                    onClick={() => onNavigateToTab('materials')}
                    className="text-left hover:text-blue-600 transition-colors"
                  >
                    • Полезные материалы
                  </button>
                  <button
                    onClick={() => onNavigateToTab('schedule')}
                    className="text-left hover:text-blue-600 transition-colors"
                  >
                    • Расписание занятий
                  </button>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => setIsFooterEditorOpen(true)}
                    className="mt-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Изменить телефон, email, адрес и реквизиты подвала"
                  >
                    <Edit2 className="w-3 h-3 text-amber-700" />
                    <span>Редактировать подвал</span>
                  </button>
                )}
              </div>
            </div>

            {/* Middle row: Theme Switcher ("низкий переключатель темы" as requested) */}
            <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <ThemeSwitcherBar />

              <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                <span>Версия портала:</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {siteInfo.version || 'v0.06'}
                </span>
              </div>
            </div>

            {/* Bottom Row: Creator & Copyright */}
            <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
              <div className="flex items-center gap-2 flex-wrap">
                <span>© {new Date().getFullYear()} {footerSettings.schoolName || 'Автошкола ДОСААФ'}. Все права защищены.</span>
                <span className="text-neutral-300">•</span>
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 font-bold border border-neutral-200">
                  Создатель: {footerSettings.creatorName || 'Мельник Сергей (SelJax)'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {!isAdmin ? (
                  <button
                    onClick={() => onOpenAuth('admin')}
                    className="text-neutral-400 hover:text-amber-600 flex items-center gap-1 transition-colors"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Вход для администратора</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onOpenStudentModal}
                      className="text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Управление курсантами</span>
                    </button>
                    <span className="text-neutral-300">•</span>
                    <span className="text-amber-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Админ ({adminCredentials.login})</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </EditableDesignBlock>
      </footer>

      {/* Footer Editor Modal for Admin */}
      <FooterEditorModal
        isOpen={isFooterEditorOpen}
        onClose={() => setIsFooterEditorOpen(false)}
      />
    </>
  );
};
