import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  ShieldCheck,
  User as UserIcon,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  KeyRound,
  CheckCircle2,
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
    isAdmin,
    groups,
    getGroupName,
    requestPasswordResetCode,
    resetAdminPasswordWithCode,
  } = useApp();

  const [tab, setTab] = useState<'student' | 'admin'>(defaultTab);

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

  // Admin Password Recovery State
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [recoveryEmail, setRecoveryEmail] = useState('zapas_mail_steam@mail.ru');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newAdminLogin, setNewAdminLogin] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [demoReceivedCode, setDemoReceivedCode] = useState<string | null>(null);

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

  // Password Recovery - Step 1: Request code
  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccess(null);

    const res = requestPasswordResetCode(recoveryEmail);
    if (res.success && res.code) {
      setDemoReceivedCode(res.code);
      setRecoveryStep(2);
      setRecoverySuccess(
        `Проверочный 6-значный код отправлен на адрес ${res.maskedEmail || recoveryEmail}`
      );
    } else {
      setRecoveryError(res.error || 'Не удалось отправить код восстановления');
    }
  };

  // Password Recovery - Step 2: Set new password
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!newAdminLogin.trim()) {
      setRecoveryError('Укажите логин администратора');
      return;
    }
    if (newAdminPass.length < 4) {
      setRecoveryError('Пароль должен содержать минимум 4 символа');
      return;
    }
    if (newAdminPass !== confirmAdminPass) {
      setRecoveryError('Пароли не совпадают');
      return;
    }

    const res = resetAdminPasswordWithCode(recoveryCode, newAdminLogin.trim(), newAdminPass);
    if (res.success) {
      // Auto login
      loginAsAdmin(newAdminLogin.trim(), newAdminPass);
      setIsRecoveringPassword(false);
      onClose();
    } else {
      setRecoveryError(res.error || 'Ошибка сброса пароля');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-100 bg-neutral-900 text-white">
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              {currentUser?.isAdmin ? 'Кабинет администратора' : 'Вход в систему ДОСААФ'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Автошкола • {groups.map((g) => `${g.name} (${g.transmission})`).join(' • ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
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
              className="text-xs text-red-600 hover:text-red-700 font-medium px-2.5 py-1 hover:bg-red-50 rounded-lg transition-colors"
            >
              Выйти
            </button>
          </div>
        )}

        {/* Tab Switch */}
        {!isRecoveringPassword && (
          <div className="flex border-b border-neutral-200 px-6 pt-3 gap-2 bg-neutral-50">
            <button
              type="button"
              onClick={() => {
                setTab('student');
                setStudentError(null);
                setAdminError(null);
              }}
              className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
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
              className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                tab === 'admin'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Администратор</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6">
          {/* 1. Student Login Form */}
          {tab === 'student' && !isRecoveringPassword && (
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
                  Фамилия, Имя или Логин курсанта <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  placeholder="например, Смирнов или smirnov_a"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Пароль курсанта <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showStudentPassword ? 'text' : 'password'}
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="Введите пароль"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  >
                    {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Войти в личный кабинет</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 2. Admin Login Form */}
          {tab === 'admin' && !isRecoveringPassword && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <p className="font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  Закрытый доступ администратора
                </p>
                <p className="mt-1 text-amber-800">
                  Управление курсантами, назначение паролей, ограничение разделов, открытие экзаменов и редактирование билетов.
                </p>
              </div>

              {adminError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveringPassword(true);
                    setRecoveryStep(1);
                    setRecoveryError(null);
                    setRecoverySuccess(null);
                  }}
                  className="text-amber-700 hover:text-amber-800 font-medium underline"
                >
                  Забыли пароль? Восстановить по почте
                </button>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Войти в панель управления</span>
              </button>
            </form>
          )}

          {/* 3. Password Recovery Flow */}
          {isRecoveringPassword && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Восстановление доступа администратора</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecoveringPassword(false)}
                  className="text-xs text-neutral-500 hover:text-neutral-800"
                >
                  Назад к входу
                </button>
              </div>

              {recoveryError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{recoveryError}</span>
                </div>
              )}

              {recoverySuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{recoverySuccess}</span>
                  </div>
                  {demoReceivedCode && (
                    <p className="text-[11px] text-emerald-700 font-mono bg-emerald-100/60 p-1.5 rounded-md mt-1">
                      Демо-письмо в ящик: Ваш проверочный код — <strong>{demoReceivedCode}</strong>
                    </p>
                  )}
                </div>
              )}

              {recoveryStep === 1 && (
                <form onSubmit={handleRequestCode} className="space-y-4">
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Введите привязанную резервную почту администратора. На неё поступит одноразовый 6-значный код безопасности для смены логина и пароля.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Email администратора
                    </label>
                    <input
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="zapas_mail_steam@mail.ru"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <span>Запросить проверочный код</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {recoveryStep === 2 && (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Проверочный код из письма <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="6-значный код (например 123456)"
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Логин администратора (можно оставить прежний или задать новый)
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdminLogin}
                      onChange={(e) => setNewAdminLogin(e.target.value)}
                      placeholder="новый логин"
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Новый пароль
                    </label>
                    <input
                      type="password"
                      required
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      placeholder="Новый надежный пароль"
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Подтверждение нового пароля
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmAdminPass}
                      onChange={(e) => setConfirmAdminPass(e.target.value)}
                      placeholder="Повторите новый пароль"
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setRecoveryStep(1)}
                      className="text-xs text-neutral-500 hover:text-neutral-800"
                    >
                      Назад к почте
                    </button>

                    <button
                      type="submit"
                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Обновить и войти</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
