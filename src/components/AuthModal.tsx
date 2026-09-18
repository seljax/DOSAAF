import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  ShieldCheck,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  KeyRound,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'student' | 'admin';
}

type AdminView = 'login' | 'reset-email' | 'reset-code' | 'reset-newpass';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'student' }) => {
  const {
    currentUser,
    loginStudentWithPassword,
    loginAsAdmin,
    logout,
    groups,
    getGroupName,
    requestPasswordResetCode,
    verifyResetCode,
    resetAdminPasswordWithCode,
  } = useApp();

  const [tab, setTab] = useState<'student' | 'admin'>(defaultTab);

  React.useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setStudentError(null);
      setAdminError(null);
      setAdminView('login');
      setResetStep({ email: '', code: '', newLogin: '', newPass: '', confirmPass: '' });
      setResetSuccess(false);
    }
  }, [isOpen, defaultTab]);

  // ============ STUDENT STATE ============
  const [studentInput, setStudentInput] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);

  // ============ ADMIN STATE ============
  const [adminLogin, setAdminLogin] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // ============ RESET PASSWORD STATE ============
  const [adminView, setAdminView] = useState<AdminView>('login');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resetStep, setResetStep] = useState({
    email: '',
    code: '',
    newLogin: '',
    newPass: '',
    confirmPass: '',
  });

  if (!isOpen) return null;

  // ============ STUDENT LOGIN ============
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError(null);
    setStudentLoading(true);

    try {
      const res = await loginStudentWithPassword(studentInput, studentPassword);
      if (res.success) {
        onClose();
      } else {
        setStudentError(res.error || 'Ошибка входа курсанта');
      }
    } catch (err: any) {
      setStudentError(err?.message || 'Ошибка сети');
    } finally {
      setStudentLoading(false);
    }
  };

  // ============ ADMIN LOGIN ============
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);

    try {
      const res = await loginAsAdmin(adminLogin, adminPassword);
      if (res.success) {
        onClose();
      } else {
        setAdminError(res.error || 'Неверный логин или пароль администратора');
      }
    } catch (err: any) {
      setAdminError(err?.message || 'Ошибка сети');
    } finally {
      setAdminLoading(false);
    }
  };

  // ============ RESET PASSWORD: ШАГ 1 — запрос кода ============
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);

    try {
      const res = await requestPasswordResetCode(resetStep.email);
      if (res.success) {
        setMaskedEmail(res.maskedEmail || resetStep.email);
        setAdminView('reset-code');
      } else {
        setResetError(res.error || 'Не удалось отправить код');
      }
    } catch (err: any) {
      setResetError(err?.message || 'Ошибка сети');
    } finally {
      setResetLoading(false);
    }
  };

  // ============ RESET PASSWORD: ШАГ 2 — проверка кода ============
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);

    try {
      const res = await verifyResetCode(resetStep.email, resetStep.code);
      if (res.success) {
        setAdminView('reset-newpass');
      } else {
        setResetError(res.error || 'Неверный код');
      }
    } catch (err: any) {
      setResetError(err?.message || 'Ошибка сети');
    } finally {
      setResetLoading(false);
    }
  };

  // ============ RESET PASSWORD: ШАГ 3 — новый пароль ============
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (resetStep.newPass.length < 4) {
      setResetError('Пароль должен содержать минимум 4 символа');
      return;
    }
    if (resetStep.newPass !== resetStep.confirmPass) {
      setResetError('Пароли не совпадают');
      return;
    }
    if (!resetStep.newLogin.trim()) {
      setResetError('Введите логин');
      return;
    }

    setResetLoading(true);

    try {
      const res = await resetAdminPasswordWithCode(
        resetStep.email,
        resetStep.code,
        resetStep.newLogin,
        resetStep.newPass
      );
      if (res.success) {
        setResetSuccess(true);
        setTimeout(() => {
          setAdminView('login');
          setResetSuccess(false);
          setResetStep({ email: '', code: '', newLogin: '', newPass: '', confirmPass: '' });
          setAdminError('Пароль успешно изменён. Войдите с новыми данными.');
        }, 2000);
      } else {
        setResetError(res.error || 'Не удалось сменить пароль');
      }
    } catch (err: any) {
      setResetError(err?.message || 'Ошибка сети');
    } finally {
      setResetLoading(false);
    }
  };

  // ============ Переключение на форму восстановления ============
  const goToResetView = () => {
    setAdminView('reset-email');
    setResetError(null);
    setResetStep({
      email: '',
      code: '',
      newLogin: adminLogin || '',
      newPass: '',
      confirmPass: '',
    });
  };

  const goBackToLogin = () => {
    setAdminView('login');
    setResetError(null);
    setResetSuccess(false);
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

        {/* Tab Switch (только когда на главном экране входа) */}
        {adminView === 'login' && (
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
        )}

        {/* Content Body */}
        <div className="p-6">
          {/* ==================== STUDENT LOGIN ==================== */}
          {tab === 'student' && adminView === 'login' && (
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
                  placeholder="Введите фамилию или логин"
                  disabled={studentLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
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
                    disabled={studentLoading}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white disabled:opacity-50"
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
                disabled={studentLoading}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {studentLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Проверка...</span>
                  </>
                ) : (
                  <>
                    <span>Войти в личный кабинет</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ==================== ADMIN LOGIN ==================== */}
          {tab === 'admin' && adminView === 'login' && (
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
                  disabled={adminLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono bg-white disabled:opacity-50"
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
                    disabled={adminLoading}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono bg-white disabled:opacity-50"
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
                disabled={adminLoading}
                className="w-full mt-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {adminLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Проверка...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Войти в панель управления</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={goToResetView}
                  className="text-xs text-amber-700 hover:text-amber-800 font-semibold hover:underline cursor-pointer"
                >
                  Забыли пароль администратора?
                </button>
              </div>
            </form>
          )}

          {/* ==================== RESET: ШАГ 1 — ввод email ==================== */}
          {adminView === 'reset-email' && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <button
                type="button"
                onClick={goBackToLogin}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Назад ко входу</span>
              </button>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Восстановление пароля</h3>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                    Введите любой из доверенных email-адресов. На него придёт код для сброса пароля.
                  </p>
                </div>
              </div>

              {resetError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Email для восстановления <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={resetStep.email}
                  onChange={(e) => setResetStep({ ...resetStep, email: e.target.value })}
                  placeholder="example@mail.ru"
                  disabled={resetLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white disabled:opacity-50"
                />
                <p className="text-[11px] text-neutral-500 mt-1.5">
                  Список доверенных адресов настраивается в панели администратора.
                </p>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Отправка кода...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Отправить код на email</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ==================== RESET: ШАГ 2 — ввод кода ==================== */}
          {adminView === 'reset-code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <button
                type="button"
                onClick={goToResetView}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Назад</span>
              </button>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Введите код из письма</h3>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                    Мы отправили 6-значный код на <strong className="text-neutral-800">{maskedEmail}</strong>.
                    Код действителен 15 минут.
                  </p>
                </div>
              </div>

              {resetError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Код из письма <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetStep.code}
                  onChange={(e) => setResetStep({ ...resetStep, code: e.target.value.replace(/\D/g, '') })}
                  placeholder="000000"
                  disabled={resetLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-lg font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading || resetStep.code.length !== 6}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Проверка кода...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Подтвердить код</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ==================== RESET: ШАГ 3 — новый пароль ==================== */}
          {adminView === 'reset-newpass' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Новые данные администратора</h3>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                    Код подтверждён. Установите новый логин и пароль.
                  </p>
                </div>
              </div>

              {resetError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Пароль успешно изменён! Перенаправление...</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Новый логин <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={resetStep.newLogin}
                  onChange={(e) => setResetStep({ ...resetStep, newLogin: e.target.value })}
                  placeholder="admin"
                  disabled={resetLoading || resetSuccess}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono bg-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Новый пароль <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={resetStep.newPass}
                  onChange={(e) => setResetStep({ ...resetStep, newPass: e.target.value })}
                  placeholder="Минимум 4 символа"
                  disabled={resetLoading || resetSuccess}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono bg-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Повторите пароль <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={resetStep.confirmPass}
                  onChange={(e) => setResetStep({ ...resetStep, confirmPass: e.target.value })}
                  placeholder="Повторите пароль"
                  disabled={resetLoading || resetSuccess}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono bg-white disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading || resetSuccess}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Сохранение...</span>
                  </>
                ) : resetSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Готово!</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Сменить пароль</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};