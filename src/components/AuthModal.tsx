import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  ShieldCheck,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'student' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'student' }) => {
  const {
    currentUser,
    loginStudentWithPassword,
    loginAsAdmin,
    logout,
    groups,
    getGroupName,
  } = useApp();

  const [tab, setTab] = useState<'student' | 'admin'>(defaultTab);

  React.useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setStudentError(null);
      setAdminError(null);
    }
  }, [isOpen, defaultTab]);

  // Student form state
  const [studentInput, setStudentInput] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Admin form state
  const [adminLogin, setAdminLogin] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Student Auth
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError(null);

    const res = loginStudentWithPassword(studentInput, studentPassword);
    if (res.success) {
      onClose();
    } else {
      setStudentError(res.error || 'Ошибка входа курсанта');
    }
  };

  // Admin Auth
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    const res = loginAsAdmin(adminLogin, adminPassword);
    if (res.success) {
      onClose();
    } else {
      setAdminError(res.error || 'Неверный логин или пароль администратора');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-100 bg-neutral-900 text-white">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.jpeg"
              alt="ДОСААФ"
              className="w-10 h-10 rounded-full object-contain bg-white shadow-xs shrink-0 ring-1 ring-neutral-700"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {currentUser?.isAdmin ? 'Кабинет администратора' : 'Вход в систему ДОСААФ'}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Автошкола • {groups.map((g) => `${g.name} (${g.transmission})`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current user session banner */}
        {currentUser && (
          <div className="mx-6 mt-4 p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs ${
                  currentUser.isAdmin ? 'bg-amber-600' : 'bg-blue-600'
                }`}
              >
                {currentUser.isAdmin ? 'ADM' : currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'У'}
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-900 leading-tight">
                  {currentUser.name || 'Гостевой режим'}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {currentUser.isAdmin
                    ? 'Администратор (полный доступ)'
                    : getGroupName(currentUser.group)}
                </p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="text-xs text-red-600 hover:text-red-700 font-medium px-2.5 py-1 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              Выйти
            </button>
          </div>
        )}

        {/* Tab Switch */}
        <div className="flex border-b border-neutral-200 px-6 pt-3 gap-2 bg-neutral-50">
          <button
            type="button"
            onClick={() => {
              setTab('student');
              setStudentError(null);
              setAdminError(null);
            }}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              tab === 'student'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Курсант</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('admin');
              setStudentError(null);
              setAdminError(null);
            }}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              tab === 'admin'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Администратор</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* 1. Student Login Form */}
          {tab === 'student' && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Вход для обучающихся курсантов
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Введите фамилию или логин, а также индивидуальный пароль, выданный администратором.
                </p>
              </div>

              {studentError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{studentError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Фамилия или логин <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  placeholder="Например: Иванов или ivanov"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Индивидуальный пароль <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showStudentPassword ? 'text' : 'password'}
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Войти в личный кабинет</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 2. Admin Login Form */}
          {tab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Вход для руководителя и преподавателей
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Доступ к редактированию курсантов, групп, расписания и материалов.
                </p>
              </div>

              {adminError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{adminError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Логин администратора <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminLogin}
                  onChange={(e) => setAdminLogin(e.target.value)}
                  placeholder="Логин"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Пароль администратора <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Войти в панель управления</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
