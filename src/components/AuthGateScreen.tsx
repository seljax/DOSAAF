import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  KeyRound,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { LoginBackgroundSlideshow } from './LoginBackgroundSlideshow';

interface AuthGateScreenProps {
  onLoginSuccess: (userName: string, role: 'student' | 'admin') => void;
}

type AdminView = 'login' | 'reset-email' | 'reset-code' | 'reset-newpass';

export const AuthGateScreen: React.FC<AuthGateScreenProps> = ({ onLoginSuccess }) => {
  const {
    loginStudentWithPassword,
    loginAsAdmin,
    groups,
    submitAccessRequest,
    students,
    adminCredentials,
    requestPasswordResetCode,
    verifyResetCode,
    resetAdminPasswordWithCode,
  } = useApp();

  const [mode, setMode] = useState<'student' | 'admin' | 'request'>('student');

  // Student form state
  const [studentInput, setStudentInput] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);

  // Admin form state
  const [adminLogin, setAdminLogin] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Password reset state
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

  // Request form state
  const [reqFirstName, setReqFirstName] = useState('');
  const [reqLastName, setReqLastName] = useState('');
  const [reqPassword, setReqPassword] = useState('');
  const [showReqPassword, setShowReqPassword] = useState(false);
  const [reqGroup, setReqGroup] = useState<string>('');
  const [reqError, setReqError] = useState<string | null>(null);
  const [reqSuccess, setReqSuccess] = useState<boolean>(false);

  // ==================== STUDENT LOGIN ====================
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError(null);
    setStudentLoading(true);

    try {
      const res = await loginStudentWithPassword(studentInput, studentPassword);
      if (res.success) {
        const studentName = studentInput.trim();
        onLoginSuccess(studentName, 'student');
      } else {
        setStudentError(res.error || 'Ошибка авторизации. Проверьте фамилию/логин и пароль.');
      }
    } catch (err: any) {
      setStudentError(err?.message || 'Ошибка сети');
    } finally {
      setStudentLoading(false);
    }
  };

  // ==================== ADMIN LOGIN ====================
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);

    try {
      const res = await loginAsAdmin(adminLogin, adminPassword);
      if (res.success) {
        onLoginSuccess(adminLogin.trim() || 'Администратор', 'admin');
      } else {
        setAdminError(res.error || 'Неверный логин или пароль администратора.');
      }
    } catch (err: any) {
      setAdminError(err?.message || 'Ошибка сети');
    } finally {
      setAdminLoading(false);
    }
  };

  // ==================== ACCESS REQUEST ====================
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReqError(null);

    const cleanFirst = reqFirstName.trim();
    const cleanLast = reqLastName.trim();
    const cleanPass = reqPassword.trim();

    if (!cleanFirst) {
      setReqError('Пожалуйста, укажите имя курсанта');
      return;
    }
    if (!cleanLast) {
      setReqError('Пожалуйста, укажите фамилию курсанта');
      return;
    }
    if (!cleanPass || cleanPass.length < 4) {
      setReqError('Пароль для входа должен содержать не менее 4 символов');
      return;
    }

    try {
      submitAccessRequest({
        firstName: cleanFirst,
        lastName: cleanLast,
        password: cleanPass,
        group: reqGroup,
      });

      setReqSuccess(true);
      setReqFirstName('');
      setReqLastName('');
      setReqPassword('');
    } catch (err: any) {
      setReqError(err.message || 'Ошибка отправки заявки');
    }
  };

  // ==================== RESET PASSWORD: ШАГ 1 ====================
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

  // ==================== RESET PASSWORD: ШАГ 2 ====================
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

  // ==================== RESET PASSWORD: ШАГ 3 ====================
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
    <div className="portal-grid-bg min-h-screen text-[#f2efeb] flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans selection:bg-[#f59e0b] selection:text-black relative overflow-hidden">
      <LoginBackgroundSlideshow />

      <div
        className="relative z-10 w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 border border-[rgba(242,239,235,0.15)] bg-[#111113]/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
        style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.85)' }}
      >
        {/* BRANDING PANEL (LEFT) */}
        <aside className="p-8 sm:p-12 md:p-14 border-b md:border-b-0 md:border-r border-[rgba(242,239,235,0.1)] flex flex-col justify-between">
          <div>
            <div className="w-16 h-16 bg-white p-1 border-2 border-[#f59e0b] mb-8 shadow-md">
              <img
                src="/favicon.jpeg"
                alt="ДОСААФ Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <span className="font-jetbrains text-[10px] uppercase tracking-[0.2em] text-[#f59e0b] mb-4 block">
              // ДОСААФ КАВАЛЕРОВО
            </span>

            <h1 className="font-oswald text-4xl sm:text-5xl md:text-[3.15rem] uppercase font-bold text-[#f2efeb] leading-[1.05] tracking-tight mb-6">
              Обучение<br />Водителей<br /><span className="text-[#f59e0b]">Кат. B и C</span>
            </h1>

            <p className="text-sm font-light text-[rgba(242,239,235,0.65)] leading-relaxed max-w-[340px]">
              Интерактивные тесты, ПДД 2026, лекции и графики вождения. Ваш путь к профессиональному управлению автомобилем.
            </p>
          </div>

          <div className="font-jetbrains text-[9px] uppercase tracking-widest text-[rgba(242,239,235,0.35)] flex justify-between mt-10 pt-6 border-t border-[rgba(242,239,235,0.06)]">
            <span>Версия v.0.10</span>
            <span>Сборка 2026</span>
          </div>
        </aside>

        {/* INTERACTION PANEL (RIGHT) */}
        <section className="p-8 sm:p-12 md:p-14 bg-[#1a1a1c] flex flex-col justify-between">
          <div>
            {/* Nav Header (Tabs: Курсант / Администратор) — только на главном экране входа */}
            {mode !== 'request' && adminView === 'login' && (
              <nav className="grid grid-cols-2 mb-8 border border-[rgba(242,239,235,0.1)]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('student');
                    setStudentError(null);
                    setAdminError(null);
                  }}
                  className={`py-3.5 px-4 font-oswald text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer ${
                    mode === 'student'
                      ? 'bg-[rgba(242,239,235,0.1)] text-[#f2efeb] font-bold'
                      : 'text-[rgba(242,239,235,0.4)] hover:text-[#f2efeb]'
                  }`}
                >
                  Курсант
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('admin');
                    setStudentError(null);
                    setAdminError(null);
                  }}
                  className={`py-3.5 px-4 font-oswald text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer ${
                    mode === 'admin'
                      ? 'bg-[rgba(242,239,235,0.1)] text-[#f2efeb] font-bold'
                      : 'text-[rgba(242,239,235,0.4)] hover:text-[#f2efeb]'
                  }`}
                >
                  Админ
                </button>
              </nav>
            )}

            {/* ==================== TAB 1: STUDENT LOGIN ==================== */}
            {mode === 'student' && adminView === 'login' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-oswald text-xl sm:text-2xl uppercase tracking-wide text-[#f2efeb]">
                    Авторизация курсанта
                  </h2>
                  <p className="text-xs text-[rgba(242,239,235,0.5)] mt-1">
                    Пожалуйста, войдите в свой личный профиль ДОСААФ.
                  </p>
                </div>

                {studentError && (
                  <div className="font-jetbrains text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>{studentError}</span>
                  </div>
                )}

                <form onSubmit={handleStudentSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex justify-between font-jetbrains text-[9px] uppercase tracking-wider text-[rgba(242,239,235,0.6)]">
                      <span>Логин или фамилия</span>
                      <span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studentInput}
                      onChange={(e) => setStudentInput(e.target.value)}
                      placeholder="Введите фамилию или логин"
                      disabled={studentLoading}
                      className="w-full bg-transparent border-b-2 border-[rgba(242,239,235,0.15)] focus:border-[#f59e0b] py-2 text-white font-sans text-base outline-none transition-colors placeholder:text-[rgba(242,239,235,0.25)] disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex justify-between font-jetbrains text-[9px] uppercase tracking-wider text-[rgba(242,239,235,0.6)]">
                      <span>Пароль</span>
                      <span></span>
                    </label>
                    <div className="relative">
                      <input
                        type={showStudentPassword ? 'text' : 'password'}
                        required
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        disabled={studentLoading}
                        className="w-full bg-transparent border-b-2 border-[rgba(242,239,235,0.15)] focus:border-[#f59e0b] py-2 pr-10 text-white font-sans text-base outline-none transition-colors placeholder:text-[rgba(242,239,235,0.25)] disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentPassword(!showStudentPassword)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[rgba(242,239,235,0.4)] hover:text-[#f59e0b] cursor-pointer"
                      >
                        {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={studentLoading}
                    className="w-full py-4 px-5 bg-[#f59e0b] hover:bg-[#d97706] active:bg-[#b45309] disabled:opacity-60 text-black border-none font-oswald uppercase font-bold text-sm sm:text-base tracking-[0.1em] cursor-pointer flex justify-between items-center transition-colors shadow-md"
                  >
                    {studentLoading ? (
                      <>
                        <span>Проверка...</span>
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Войти в систему</span>
                        <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setMode('request');
                    setReqSuccess(false);
                    setReqError(null);
                  }}
                  className="w-full block text-center font-jetbrains text-xs text-[#f59e0b] hover:underline cursor-pointer tracking-wider pt-2"
                >
                  Подать заявку на доступ в автошколу
                </button>
              </div>
            )}

            {/* ==================== TAB 2: ADMIN LOGIN ==================== */}
            {mode === 'admin' && adminView === 'login' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-oswald text-xl sm:text-2xl uppercase tracking-wide text-[#f2efeb]">
                    Панель администратора
                  </h2>
                  <p className="text-xs text-[rgba(242,239,235,0.5)] mt-1">
                    Служебный доступ к управлению автошколой ДОСААФ.
                  </p>
                </div>

                {adminError && (
                  <div className="font-jetbrains text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>{adminError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex justify-between font-jetbrains text-[9px] uppercase tracking-wider text-[rgba(242,239,235,0.6)]">
                      <span>Логин</span>
                      <span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={adminLogin}
                      onChange={(e) => setAdminLogin(e.target.value)}
                      placeholder="Введите логин администратора"
                      disabled={adminLoading}
                      className="w-full bg-transparent border-b-2 border-[rgba(242,239,235,0.15)] focus:border-[#f59e0b] py-2 text-white font-sans text-base outline-none transition-colors placeholder:text-[rgba(242,239,235,0.25)] disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex justify-between font-jetbrains text-[9px] uppercase tracking-wider text-[rgba(242,239,235,0.6)]">
                      <span>Пароль</span>
                      <span></span>
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••••••"
                        disabled={adminLoading}
                        className="w-full bg-transparent border-b-2 border-[rgba(242,239,235,0.15)] focus:border-[#f59e0b] py-2 pr-10 text-white font-sans text-base outline-none transition-colors placeholder:text-[rgba(242,239,235,0.25)] disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[rgba(242,239,235,0.4)] hover:text-[#f59e0b] cursor-pointer"
                      >
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full py-4 px-5 bg-[#f59e0b] hover:bg-[#d97706] active:bg-[#b45309] disabled:opacity-60 text-black border-none font-oswald uppercase font-bold text-sm sm:text-base tracking-[0.1em] cursor-pointer flex justify-between items-center transition-colors shadow-md"
                  >
                    {adminLoading ? (
                      <>
                        <span>Проверка...</span>
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Войти в систему</span>
                        <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </form>

                {/* Ссылка восстановления пароля */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={goToResetView}
                    className="inline-flex items-center gap-1.5 font-jetbrains text-xs text-[#f59e0b] hover:underline cursor-pointer tracking-wider"
                  >
                    <span>Забыли пароль администратора?</span>
                  </button>
                </div>
              </div>
            )}

            {/* ==================== RESET: ШАГ 1 ==================== */}
            {adminView === 'reset-email' && (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={goBackToLogin}
                  className="inline-flex items-center gap-1.5 font-jetbrains text-xs text-[rgba(242,239,235,0.6)] hover:text-[#f59e0b] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Назад ко входу</span>
                </button>

                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-[#f59e0b]" />
                  </div>
                  <div>
                    <h2 className="font-oswald text-xl uppercase tracking-wide text-[#f2efeb]">
                      Восстановление пароля
                    </h2>
                    <p className="text-xs text-[rgba(242,239,235,0.5)] mt-1 leading-relaxed">
                      Введите доверенный email. На него придёт код для сброса пароля.
                    </p>
                  </div>
                </div>

                {resetError && (
                  <div className="font-jetbrains text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}

                <form onSubmit={handleRequestCode} className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex justify-between font-jetbrains text-[9px] uppercase tracking-wider text-[rgba(242,239,235,0.6)]">
                      <span>Email для восстановления</span>
                      <span>Обязательно</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={resetStep.email}
                      onChange={(e) => setResetStep({ ...resetStep, email: e.target.value })}
                      placeholder="example@mail.ru"
                      disabled={resetLoading}
                      className="w-full bg-transparent border-b-2 border-[rgba(242,239,235,0.15)] focus:border-[#f59e0b] py-2 text-white font-sans text-base outline-none transition-colors placeholder:text-[rgba(242,239,235,0.25)] disabled:opacity-50"
                    />
                    <p className="font-jetbrains text-[10px] text-[rgba(242,239,235,0.4)] mt-1">
                      Пароль — это как зубная щетка: у всех своя, но лучше не забывать.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-4 px-5 bg-[#f59e0b] hover:bg-[#d97706] disabled:opacity-60 text-black border-none font-oswald uppercase font-bold text-sm sm:text-base tracking-[0.1em] cursor-pointer flex justify-between items-center transition-colors shadow-md"
                  >
                    {resetLoading ? (
                      <>
                        <span>Отправка...</span>
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Отправить код</span>
                        <Mail className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ==================== RESET: ШАГ 2 ==================== */}
            {adminView === 'reset-code' && (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={goToResetView}
                  className="inline-flex items-center gap-1.5 font-jetbrains text-xs text-[rgba(242,239,235,0.6)] hover:text-[#f59e0b] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Назад</span>
                </button>

                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5 text-[#f59e0b]" />
                  </div>
                  <div>
                    <h2 className="font-oswald text-xl uppercase tracking-wide text-[#f2efeb]">
                      Введите код из письма
                    </h2>
                    <p className="text-xs text-[rgba(242,239,235,0.5)] mt-1 leading-relaxed">
                      Код отправлен на <strong className="text-[#f59e0b]">{maskedEmail}</strong>. Действителен 15 минут.
                    </p>
                  </div>
                </div>

                {resetError && (
                  <div className="font-jetbrains text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyCode} className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex justify-between font-jetbrains text-[9px] uppercase tracking-wider text-[rgba(242,239,235,0.6)]">
                      <span>Код из письма</span>
                      <span>6 цифр</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetStep.code}
                      onChange={(e) => setResetStep({ ...resetStep, code: e.target.value.replace(/\D/g, '') })}
                      placeholder="000000"
                      disabled={resetLoading}
                      className="w-full bg-transparent border-b-2 border-[rgba(242,239,235,0.15)] focus:border-[#f59e0b] py-2 text-white font-mono text-2xl tracking-[0.5em] text-center outline-none transition-colors placeholder:text-[rgba(242,239,235,0.15)] disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading || resetStep.code.length !== 6}
                    className="w-full py-4 px-5 bg-[#f59e0b] hover:bg-[#d97706] disabled:opacity-60 text-black border-none font-oswald uppercase font-bold text-sm sm:text-base tracking-[0.1em] cursor-pointer flex justify-between items-center transition-colors shadow-md"
                  >
                    {resetLoading ? (
                      <>
                        <span>Проверка...</span>
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Подтвердить код</span>
                        <CheckCircle2 className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ==================== RESET: ШАГ 3 ==================== */}
            {adminView === 'reset-newpass' && (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-oswald text-xl uppercase tracking-wide text-[#f2efeb]">
                      Новые данные администратора
                    </h2>
                    <p className="text-xs text-[rgba(242,239,235,0.5)] mt-1 leading-relaxed">
                      Код подтверждён. Установите новый логин и пароль.
                    </p>
                  </div>
                </div>

                {resetError && (
                  <div className="font-jetbrains text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}

                {resetSuccess && (
                  <div className="font-jetbrains text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 p-3 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span>Пароль успешно изменён! Перенаправление...</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-2">
                    <label className="flex justify-between font-jetbrains text-[9px] uppercase tracking-wider text-[rgba(242,239,235,0.6)]">
                      <span>Новый логин</span>
                      <span>Обязательно</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={resetStep.newLogin}
                      onChange={(e) => setResetStep({ ...resetStep, newLogin: e.target.value })}
                      placeholder="admin"
                      disabled={resetLoading || resetSuccess}
                      className="w-full bg-transparent border-b-2 border-[rgba(242,239,235,0.15)] focus:border-emerald-500 py-2 text-white font-mono text-base outline-none transition-colors disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex justify-between font-jetbrains text-[9px] uppercase tracking-wider text-[rgba(242,239,235,0.6)]">
                      <span>Новый пароль</span>
                      <span>От 4 символов</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={resetStep.newPass}
                      onChange={(e) => setResetStep({ ...resetStep, newPass: e.target.value })}
                      placeholder="••••••••••••"
                      disabled={resetLoading || resetSuccess}
                      className="w-full bg-transparent border-b-2 border-[rgba(242,239,235,0.15)] focus:border-emerald-500 py-2 text-white font-mono text-base outline-none transition-colors disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex justify-between font-jetbrains text-[9px] uppercase tracking-wider text-[rgba(242,239,235,0.6)]">
                      <span>Повторите пароль</span>
                      <span>Обязательно</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={resetStep.confirmPass}
                      onChange={(e) => setResetStep({ ...resetStep, confirmPass: e.target.value })}
                      placeholder="••••••••••••"
                      disabled={resetLoading || resetSuccess}
                      className="w-full bg-transparent border-b-2 border-[rgba(242,239,235,0.15)] focus:border-emerald-500 py-2 text-white font-mono text-base outline-none transition-colors disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading || resetSuccess}
                    className="w-full py-4 px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white border-none font-oswald uppercase font-bold text-sm sm:text-base tracking-[0.1em] cursor-pointer flex justify-between items-center transition-colors shadow-md"
                  >
                    {resetLoading ? (
                      <>
                        <span>Сохранение...</span>
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </>
                    ) : resetSuccess ? (
                      <>
                        <span>Готово!</span>
                        <CheckCircle2 className="w-5 h-5" />
                      </>
                    ) : (
                      <>
                        <span>Сменить пароль</span>
                        <ShieldCheck className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ==================== TAB 3: ACCESS REQUEST ==================== */}
            {mode === 'request' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(242,239,235,0.1)]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('student');
                      setReqSuccess(false);
                      setReqError(null);
                    }}
                    className="inline-flex items-center gap-1.5 font-jetbrains text-xs text-[rgba(242,239,235,0.6)] hover:text-[#f59e0b] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Назад ко входу</span>
                  </button>
                  <span className="font-jetbrains text-[9px] uppercase tracking-widest text-[#f59e0b] bg-[rgba(245,158,11,0.1)] px-2 py-0.5 border border-[rgba(245,158,11,0.2)]">
                    Регистрация курсанта
                  </span>
                </div>

                <div>
                  <h2 className="font-oswald text-xl sm:text-2xl uppercase tracking-wide text-[#f2efeb]">
                    Подача заявки на доступ
                  </h2>
                  <p className="text-xs text-[rgba(242,239,235,0.5)] mt-1">
                    Заполните форму для регистрации в системе автошколы ДОСААФ.
                  </p>
                </div>

                {reqSuccess ? (
                  <div className="p-5 bg-[rgba(16,185,129,0.08)] border border-emerald-500/30 rounded-none text-center space-y-3">
                    <div className="w-10 h-10 mx-auto bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-oswald text-lg uppercase text-emerald-300">
                      Заявка успешно отправлена
                    </h3>
                    <p className="text-xs text-[rgba(242,239,235,0.7)] leading-relaxed">
                      Ваша заявка со статусом <span className="text-[#f59e0b] font-jetbrains font-bold">На рассмотрении</span> передана администрации автошколы.
                    </p>
                    <p className="font-jetbrains text-[10px] text-[rgba(242,239,235,0.5)]">
                      После одобрения войдите в систему, используя свою фамилию и указанный пароль.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('student');
                        setReqSuccess(false);
                      }}
                      className="w-full mt-2 py-3 px-4 bg-[#f59e0b] text-black font-oswald uppercase font-bold text-xs tracking-wider cursor-pointer"
                    >
                      Вернуться ко входу
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRequestSubmit} className="space-y-4">
                    {reqError && (
                      <div className="font-jetbrains text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                        <span>{reqError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="flex justify-between font-jetbrains text-[9px] uppercase tracking-wider text-[rgba(242,239,235,0.6)]">
                          <span>Имя</span>
                          <span>Обязательно</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={reqFirstName}
                          onChange={(e) => setReqFirstName(e.target.value)}
                          placeholder="Имя"
                          className="w-full bg-transparent border-b-2 border-[rgba(242,239,235,0.15)] focus:border-[#f59e0b] py-1.5 text-white font-sans text-sm outline-none transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="flex justify-between font-jetbrains text-[9px] uppercase tracking-wider text-[rgba(242,239,235,0.6)]">
                          <span>Фамилия</span>
                          <span>Обязательно</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={reqLastName}
                          onChange={(e) => setReqLastName(e.target.value)}
                          placeholder="Фамилия"
                          className="w-full bg-transparent border-b-2 border-[rgba(242,239,235,0.15)] focus:border-[#f59e0b] py-1.5 text-white font-sans text-sm outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="flex justify-between font-jetbrains text-[9px] uppercase tracking-wider text-[rgba(242,239,235,0.6)]">
                        <span>Пароль</span>
                        <span>От 4 символов</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showReqPassword ? 'text' : 'password'}
                          required
                          value={reqPassword}
                          onChange={(e) => setReqPassword(e.target.value)}
                          placeholder="Придумайте пароль"
                          className="w-full bg-transparent border-b-2 border-[rgba(242,239,235,0.15)] focus:border-[#f59e0b] py-1.5 pr-10 text-white font-sans text-sm outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowReqPassword(!showReqPassword)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[rgba(242,239,235,0.4)] hover:text-[#f59e0b] cursor-pointer"
                        >
                          {showReqPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="flex justify-between font-jetbrains text-[9px] uppercase tracking-wider text-[rgba(242,239,235,0.6)]">
                        <span>Учебная группа</span>
                        <span>Необязательно</span>
                      </label>
                      <select
                        value={reqGroup}
                        onChange={(e) => setReqGroup(e.target.value)}
                        className="w-full bg-[#111113] border border-[rgba(242,239,235,0.2)] focus:border-[#f59e0b] p-2 text-white font-sans text-xs outline-none cursor-pointer"
                      >
                        <option value="">Не указывать (определит администратор)</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} — {g.transmissionLabel || g.transmission}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-4 py-3.5 px-5 bg-[#f59e0b] hover:bg-[#d97706] active:bg-[#b45309] text-black border-none font-oswald uppercase font-bold text-sm tracking-[0.1em] cursor-pointer flex justify-between items-center transition-colors shadow-md"
                    >
                      <span>Отправить заявку</span>
                      <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="font-jetbrains text-[9px] uppercase tracking-widest text-[rgba(242,239,235,0.3)] flex justify-between mt-8 pt-4 border-t border-[rgba(242,239,235,0.06)]">
            <span>Создатель: Мельник Сергей</span>
            <span>Версия v.0.10</span>
          </div>
        </section>
      </div>
    </div>
  );
};