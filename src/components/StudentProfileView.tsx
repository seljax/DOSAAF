import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User as UserIcon,
  ShieldCheck,
  ShieldAlert,
  Key,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  GraduationCap,
  Calendar,
  Layers,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Mail,
  Users,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface StudentProfileViewProps {
  onOpenAuth?: (tab?: 'student' | 'admin') => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenStudentModal?: () => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  onOpenAuth,
  onNavigateToTab,
  onOpenStudentModal,
}) => {
  const {
    currentUser,
    isAdmin,
    adminCredentials,
    updateAdminCredentials,
    students,
    groups,
    activityLogs,
    changeStudentPassword,
    canAccessTab,
    canStudentTakeTests,
    canStudentTakeExam,
    logout,
  } = useApp();

  // Find the current logged in student account if available
  const currentStudentAccount = students.find(
    (s) => s.id === currentUser?.id || s.login === currentUser?.login || s.fullName === currentUser?.name
  );

  // Student password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin password change state
  const [adminOldPass, setAdminOldPass] = useState('');
  const [adminNewLogin, setAdminNewLogin] = useState(adminCredentials?.login || 'seljax');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);

  const groupInfo = groups.find((g) => g.id === (currentStudentAccount?.group || currentUser?.group));

  // --- Student password change ---
  const handleStudentChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPassword || newPassword.length < 4) {
      setErrorMessage('Новый пароль должен содержать не менее 4 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Новый пароль и подтверждение не совпадают');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = changeStudentPassword(oldPassword, newPassword);
      if (res.success) {
        setSuccessMessage('Пароль успешно изменён! Запись добавлена в журнал ЛОГИ автошколы.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage(res.error || 'Не удалось изменить пароль. Проверьте текущий пароль.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Произошла ошибка при изменении пароля');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Admin password change ---
  const handleAdminChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    if (!adminNewPass || adminNewPass.length < 4) {
      setAdminError('Новый пароль администратора должен содержать не менее 4 символов');
      return;
    }

    if (adminNewPass !== adminConfirmPass) {
      setAdminError('Новый пароль и подтверждение не совпадают');
      return;
    }

    setIsAdminSubmitting(true);
    try {
      const res = updateAdminCredentials(adminOldPass, adminNewLogin, adminNewPass);
      if (res.success) {
        setAdminSuccess('Учётные данные администратора успешно обновлены!');
        setAdminOldPass('');
        setAdminNewPass('');
        setAdminConfirmPass('');
      } else {
        setAdminError(res.error || 'Ошибка обновления. Проверьте действующий пароль.');
      }
    } catch (err: any) {
      setAdminError(err.message || 'Произошла ошибка при обновлении');
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  // 1. Unauthenticated Visitor View
  if (!isAdmin && (!currentUser || !currentUser.name)) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm text-center space-y-4 animate-in fade-in">
        <div className="w-14 h-14 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-200">
          <UserIcon className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl font-black text-neutral-900">Вход в личный кабинет</h1>
          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
            Раздел «Профиль» доступен после авторизации курсанта или администратора автошколы ДОСААФ.
          </p>
        </div>
        <div className="pt-3">
          <button
            onClick={() => onOpenAuth ? onOpenAuth('student') : undefined}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Войти в систему</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Administrator Profile View
  if (isAdmin) {
    const activeStudentsCount = students.filter((s) => s.status === 'active').length;

    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
        {/* Admin Header */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-amber-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-xl shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  Кабинет администратора
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-700" />
                  Суперпользователь
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>Логин: <strong className="text-neutral-800 font-mono">{adminCredentials?.login || 'seljax'}</strong></span>
                <span>•</span>
                <span>Создатель: <strong className="text-amber-800 font-semibold">Мельник Сергей (SelJax)</strong></span>
                <span>•</span>
                <span>Роль: <strong className="text-neutral-700">Главный администратор</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => logout()}
              className="px-3.5 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-500" />
              <span>Выйти из системы</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
              <span>Курсантов в базе</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-neutral-900">{students.length}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Активных: {activeStudentsCount}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
              <span>Учебных групп</span>
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-neutral-900">{groups.length}</div>
            <span className="text-[11px] text-neutral-400">МКПП и АКПП</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
              <span>Записей в ЛОГИ</span>
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-neutral-900">{activityLogs.length}</div>
            <span className="text-[11px] text-amber-700 font-medium">Журнал аудита</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
              <span>Статус безопасности</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-700">Защищено</div>
            <span className="text-[11px] text-neutral-400">Резерв привязан</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Admin Quick Actions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-neutral-100">
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <span>Панель быстрого доступа администратора</span>
                </h2>
                <span className="text-xs text-neutral-400">Все разделы открыты</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => onNavigateToTab ? onNavigateToTab('stats') : undefined}
                  className="p-4 rounded-2xl border border-neutral-200 hover:border-amber-300 hover:bg-amber-50/40 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-neutral-900 group-hover:text-amber-900">
                      Ведомость успеваемости
                    </span>
                    <FileText className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Просмотр результатов сдачи билетов и экзаменов всеми курсантами.
                  </p>
                </button>

                <button
                  onClick={() => onNavigateToTab ? onNavigateToTab('logs') : undefined}
                  className="p-4 rounded-2xl border border-neutral-200 hover:border-amber-300 hover:bg-amber-50/40 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-neutral-900 group-hover:text-amber-900">
                      Журнал действий (ЛОГИ)
                    </span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    История действий: смена паролей, входы в систему и выдача допусков.
                  </p>
                </button>

                <button
                  onClick={() => onOpenStudentModal ? onOpenStudentModal() : undefined}
                  className="p-4 rounded-2xl border border-neutral-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-neutral-900 group-hover:text-blue-900">
                      Управление курсантами
                    </span>
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Добавление учеников, назначение паролей и гибкая настройка допусков.
                  </p>
                </button>

                <button
                  onClick={() => onNavigateToTab ? onNavigateToTab('schedule') : undefined}
                  className="p-4 rounded-2xl border border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-neutral-900 group-hover:text-indigo-900">
                      Расписание и вождение
                    </span>
                    <Layers className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    График практических занятий на автодроме и лекций для групп МКПП и АКПП.
                  </p>
                </button>
              </div>

              <div className="mt-5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-amber-900">
                    Уведомление безопасности:
                  </strong>
                  <p className="mt-0.5 text-amber-800 leading-relaxed">
                    Храните реквизиты администратора в надёжном месте. Смену логина и пароля можно выполнить в форме справа.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right 1 Column: Admin Change Credentials Form */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs">
              <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-neutral-100">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                  <Key className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900">Смена пароля админа</h2>
                  <span className="text-[11px] text-neutral-400 block">Безопасность панели управления</span>
                </div>
              </div>

              {adminError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{adminError}</span>
                </div>
              )}

              {adminSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{adminSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAdminChangePassword} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Текущий пароль администратора
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPass ? 'text' : 'password'}
                      required
                      value={adminOldPass}
                      onChange={(e) => setAdminOldPass(e.target.value)}
                      placeholder="Действующий пароль"
                      className="w-full px-3 py-2.5 pr-10 border border-neutral-200 rounded-xl bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Логин администратора
                  </label>
                  <input
                    type="text"
                    required
                    value={adminNewLogin}
                    onChange={(e) => setAdminNewLogin(e.target.value)}
                    placeholder="seljax"
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Новый пароль
                  </label>
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    value={adminNewPass}
                    onChange={(e) => setAdminNewPass(e.target.value)}
                    placeholder="Минимум 4 символа"
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Подтверждение нового пароля
                  </label>
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    value={adminConfirmPass}
                    onChange={(e) => setAdminConfirmPass(e.target.value)}
                    placeholder="Повторите новый пароль"
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isAdminSubmitting}
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAdminSubmitting ? 'Сохранение...' : 'Обновить пароль'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Student Profile View
  const permissionsList = [
    {
      id: 'rules',
      title: 'Правила и дорожные знаки ПДД 2026',
      description: 'Доступ к каталогу дорожных знаков с иллюстрациями и полному тексту правил РФ.',
      hasAccess: canAccessTab('rules'),
    },
    {
      id: 'materials',
      title: 'Учебные материалы и конспекты',
      description: 'Методические статьи, памятки по устройству автодрома и разборы перекрёстков.',
      hasAccess: canAccessTab('materials'),
    },
    {
      id: 'lessons',
      title: 'Пройденные занятия и видеолекции',
      description: 'Архив видеозаписей теоретических занятий и история посещаемости группы.',
      hasAccess: canAccessTab('lessons'),
    },
    {
      id: 'schedule',
      title: 'Расписание вождения и теории',
      description: 'График занятий по вождению на автодроме, городские маршруты и лекции.',
      hasAccess: canAccessTab('schedule'),
    },
    {
      id: 'tests',
      title: 'Тренировочное онлайн-тестирование',
      description: 'Тематические билеты по темам категорий B с мгновенной проверкой ответов.',
      hasAccess: canStudentTakeTests(),
    },
    {
      id: 'exam',
      title: 'Государственный комплексный экзамен ДОСААФ',
      description: 'Итоговый симулятор экзамена в ГИБДД (20 вопросов за 20 минут, таймер и строгий допуск).',
      hasAccess: canStudentTakeExam(),
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xl shadow-xs">
            {currentUser?.name?.charAt(0).toUpperCase() || 'К'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                {currentUser?.name || 'Личный профиль курсанта'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Активен
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>Логин: <strong className="text-neutral-700 font-mono">{currentStudentAccount?.login || currentUser?.login || 'курсант'}</strong></span>
              <span>•</span>
              <span>Учебная группа: <strong className="text-blue-700 font-semibold">{groupInfo?.name || 'Группа №7'} ({groupInfo?.transmission || 'МКПП'})</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => logout()}
            className="px-3.5 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-neutral-500" />
            <span>Выйти из профиля</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Access Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-neutral-100">
              <div>
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>Матрица прав доступа к разделам автошколы</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Здесь наглядно показано, к каким модулям обучения у вас открыт доступ, а какие временно ограничены преподавателем.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {permissionsList.map((perm) => (
                <div
                  key={perm.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    perm.hasAccess
                      ? 'bg-emerald-50/40 border-emerald-200/80'
                      : 'bg-neutral-50/80 border-neutral-200 opacity-90'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        perm.hasAccess
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-neutral-200 text-neutral-500 border border-neutral-300'
                      }`}
                    >
                      {perm.hasAccess ? (
                        <Unlock className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">
                        {perm.title}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                        {perm.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    {perm.hasAccess ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-2xs flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Доступ открыт</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-200 text-neutral-700 border border-neutral-300 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Ограничено</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-blue-900">
                  Как получить допуск к ограниченному разделу или экзамену?
                </strong>
                <p className="mt-0.5 text-blue-800 leading-relaxed">
                  Допуск к тренировочным тестам и государственному экзамену регулируется преподавателем автошколы ДОСААФ после проверки сдачи нормативов на автодроме и проверки медицинской справки.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Change Password ONLY (as requested) */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs">
            <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-neutral-100">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <Key className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900">
                  Смена пароля
                </h2>
                <span className="text-[11px] text-neutral-400 block">
                  Единственное действие, доступное в профиле
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
              В целях безопасности вы можете самостоятельно сменить пароль от своей учетной записи курсанта.
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleStudentChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Текущий пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Введите действующий пароль"
                    className="w-full px-3 py-2.5 pr-10 border border-neutral-200 rounded-xl bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Новый пароль
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 4 символа"
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Подтверждение нового пароля
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Сохранение...' : 'Обновить пароль'}</span>
                </button>
              </div>

              <span className="text-[10px] text-neutral-400 block text-center mt-2 leading-tight">
                Факт смены пароля автоматически записывается в системный журнал ЛОГИ автошколы.
              </span>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
