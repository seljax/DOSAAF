import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StudentAccount } from '../types';
import {
  X,
  UserPlus,
  Users,
  KeyRound,
  Shield,
  Search,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Mail,
  Plus,
  RefreshCw,
  Copy,
  Ticket,
} from 'lucide-react';

interface StudentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'students' | 'security' | 'requests';
}

export const StudentManagementModal: React.FC<StudentManagementModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'students',
}) => {
  const {
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    toggleStudentTabAccess,
    toggleStudentTestAccess,
    toggleStudentExamAccess,
    groups,
    getGroupName,
    adminCredentials,
    updateAdminCredentials,
    accessRequests,
    approveAccessRequest,
    rejectAccessRequest,
    deleteAccessRequest,
    examSettings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'students' | 'security' | 'requests'>(defaultTab);

  // Requests state
  const [modalRequestsFilter, setModalRequestsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [modalReqFeedback, setModalReqFeedback] = useState<{ id: string; message: string; type: 'success' | 'error' } | null>(null);
  const [copiedReqLogin, setCopiedReqLogin] = useState<string | null>(null);

  const pendingRequestsCount = accessRequests.filter((r) => r.status === 'pending').length;
  const approvedRequestsCount = accessRequests.filter((r) => r.status === 'approved').length;
  const rejectedRequestsCount = accessRequests.filter((r) => r.status === 'rejected').length;

  const filteredRequests = accessRequests.filter((r) => {
    if (modalRequestsFilter === 'all') return true;
    return r.status === modalRequestsFilter;
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  // Add / Edit Student Form State
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    login: '',
    password: '',
    group: groups[0]?.id || 'group7_mkpp',
    status: 'active' as 'active' | 'blocked',
    rulesAccess: true,
    materialsAccess: true,
    lessonsAccess: true,
    scheduleAccess: true,
    canTakeTests: true,
    canTakeExam: false,
    examAttemptsAllowed: 1,
    examAttemptsUsed: 0,
    assignedExamTicket: 'free_choice' as number | 'free_choice',
    notes: '',
  });
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [studentFormError, setStudentFormError] = useState<string | null>(null);

  // Visible passwords map for student rows
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Admin Security Form State
  const [currentAdminPass, setCurrentAdminPass] = useState('');
  const [newAdminLogin, setNewAdminLogin] = useState(adminCredentials.login);
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');
  const [showAdminPassFields, setShowAdminPassFields] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helpers
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: res }));
  };

  const openAddForm = () => {
    setIsEditingStudent(true);
    setEditingStudentId(null);
    setStudentFormError(null);
    setFormData({
      firstName: '',
      lastName: '',
      login: '',
      password: `pdd_${Math.floor(1000 + Math.random() * 9000)}`,
      group: groups[0]?.id || 'group7_mkpp',
      status: 'active',
      rulesAccess: true,
      materialsAccess: true,
      lessonsAccess: true,
      scheduleAccess: true,
      canTakeTests: true,
      canTakeExam: false,
      examAttemptsAllowed: 1,
      examAttemptsUsed: 0,
      assignedExamTicket: 'free_choice',
      notes: '',
    });
  };

  const openEditForm = (student: StudentAccount) => {
    setIsEditingStudent(true);
    setEditingStudentId(student.id);
    setStudentFormError(null);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      login: student.login,
      password: student.password,
      group: student.group,
      status: student.status,
      rulesAccess: student.allowedTabs.rules,
      materialsAccess: student.allowedTabs.materials,
      lessonsAccess: student.allowedTabs.lessons,
      scheduleAccess: student.allowedTabs.schedule,
      canTakeTests: student.canTakeTests,
      canTakeExam: student.canTakeExam,
      examAttemptsAllowed: student.examAttemptsAllowed ?? 1,
      examAttemptsUsed: student.examAttemptsUsed ?? 0,
      assignedExamTicket: student.assignedExamTicket ?? 'free_choice',
      notes: student.notes || '',
    });
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentFormError(null);

    const first = formData.firstName.trim();
    const last = formData.lastName.trim();
    if (!first || !last) {
      setStudentFormError('Пожалуйста, заполните Имя и Фамилию курсанта');
      return;
    }

    if (!formData.password.trim()) {
      setStudentFormError('Задайте пароль для входа курсанта');
      return;
    }

    // Default or clean login
    let login = formData.login.trim();
    if (!login) {
      login = `${first.toLowerCase()}_${last.toLowerCase()}`
        .replace(/[^a-z0-9_]/gi, '')
        .slice(0, 15);
      if (!login) login = `kursant_${Date.now().toString().slice(-4)}`;
    }

    const attemptsAllowed = Math.max(1, Number(formData.examAttemptsAllowed) || 1);
    const attemptsUsed = Math.max(0, Number(formData.examAttemptsUsed) || 0);

    if (editingStudentId) {
      // update
      updateStudent(editingStudentId, {
        firstName: first,
        lastName: last,
        fullName: `${last} ${first}`,
        login,
        password: formData.password.trim(),
        group: formData.group,
        status: formData.status,
        allowedTabs: {
          rules: formData.rulesAccess,
          materials: formData.materialsAccess,
          lessons: formData.lessonsAccess,
          schedule: formData.scheduleAccess,
        },
        canTakeTests: formData.canTakeTests,
        canTakeExam: formData.canTakeExam,
        examAttemptsAllowed: attemptsAllowed,
        examAttemptsUsed: attemptsUsed,
        assignedExamTicket: formData.assignedExamTicket,
        notes: formData.notes.trim(),
      });
    } else {
      // add
      addStudent({
        firstName: first,
        lastName: last,
        fullName: `${last} ${first}`,
        login,
        password: formData.password.trim(),
        group: formData.group,
        status: formData.status,
        allowedTabs: {
          rules: formData.rulesAccess,
          materials: formData.materialsAccess,
          lessons: formData.lessonsAccess,
          schedule: formData.scheduleAccess,
        },
        canTakeTests: formData.canTakeTests,
        canTakeExam: formData.canTakeExam,
        examAttemptsAllowed: attemptsAllowed,
        examAttemptsUsed: attemptsUsed,
        assignedExamTicket: formData.assignedExamTicket,
        notes: formData.notes.trim(),
      });
    }

    setIsEditingStudent(false);
    setEditingStudentId(null);
  };

  const handleSaveAdminCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(null);

    if (!currentAdminPass) {
      setSecurityError('Введите текущий пароль администратора для подтверждения');
      return;
    }

    if (newAdminPass && newAdminPass !== confirmAdminPass) {
      setSecurityError('Новый пароль и его подтверждение не совпадают');
      return;
    }

    const passToSet = newAdminPass.trim() || currentAdminPass;
    const res = updateAdminCredentials(currentAdminPass, newAdminLogin.trim(), passToSet);

    if (res.success) {
      setSecuritySuccess('Данные администратора успешно обновлены в базе системы!');
      setCurrentAdminPass('');
      setNewAdminPass('');
      setConfirmAdminPass('');
    } else {
      setSecurityError(res.error || 'Ошибка при сохранении данных');
    }
  };

  // Filtered students
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.login.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchGroup = filterGroup === 'all' || s.group === filterGroup;
    return matchSearch && matchGroup;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-900 text-white">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.jpeg"
              alt="ДОСААФ"
              className="w-10 h-10 rounded-full object-contain bg-white shadow-xs shrink-0 ring-1 ring-neutral-700"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Управление курсантами и безопасность автошколы
              </h2>
              <p className="text-xs text-neutral-400">
                Регистрация курсантов, разграничение прав на разделы и тесты, защита учетных данных
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 px-6 pt-3 bg-neutral-50 gap-3">
          <button
            onClick={() => {
              setActiveTab('students');
              setIsEditingStudent(false);
            }}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Курсанты автошколы ({students.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('security');
              setIsEditingStudent(false);
            }}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'security'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Безопасность администратора</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('requests');
              setIsEditingStudent(false);
            }}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'requests'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Заявки на доступ ({accessRequests.length})</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse">
                +{pendingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'students' && !isEditingStudent && (
            <div className="space-y-4">
              {/* Actions & Filters bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск по фамилии, имени, логину..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <select
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="py-1.5 px-3 text-xs rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="all">Все группы</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.category === 'C' ? 'Кат. C' : g.transmission})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={openAddForm}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Добавить курсанта</span>
                </button>
              </div>

              {/* Instructions banner */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Права доступа и безопасность курсантов:</p>
                  <p className="mt-0.5 text-blue-800 leading-relaxed">
                    Администратор задает логин и пароль для каждого курсанта. Вы можете в один клик разрешать или закрывать сдачу тренировочных тестов, допуск к государственному экзамену, а также переключать доступ к разделам (ПДД, материалы, лекции, расписание).
                  </p>
                </div>
              </div>

              {/* Students List */}
              <div className="space-y-2.5">
                {filteredStudents.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 text-neutral-500 text-xs">
                    Курсантов по указанным критериям не найдено. Нажмите «Добавить курсанта», чтобы создать учетную запись.
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const isPassVisible = Boolean(visiblePasswords[student.id]);
                    return (
                      <div
                        key={student.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          student.status === 'blocked'
                            ? 'bg-neutral-50 border-neutral-200 opacity-60'
                            : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-xs'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          {/* Student Info */}
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm shrink-0">
                              {student.lastName.charAt(0) || student.firstName.charAt(0) || 'К'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-neutral-900">
                                  {student.fullName}
                                </h4>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                                  {getGroupName(student.group)}
                                </span>
                                {student.status === 'blocked' && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                    Заблокирован
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1 flex-wrap font-mono">
                                <span>Логин: <strong className="text-neutral-800">{student.login}</strong></span>
                                <span>•</span>
                                <div className="flex items-center gap-1.5">
                                  <span>Пароль:</span>
                                  <span className="font-bold text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded text-[11px]">
                                    {isPassVisible ? student.password : '••••••••'}
                                  </span>
                                  <button
                                    onClick={() => togglePasswordVisibility(student.id)}
                                    className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
                                    title={isPassVisible ? 'Скрыть пароль' : 'Показать пароль'}
                                  >
                                    {isPassVisible ? (
                                      <EyeOff className="w-3.5 h-3.5" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {student.notes && (
                                <p className="text-[11px] text-neutral-400 mt-1 italic">
                                  Заметка: {student.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Permission Toggles */}
                          <div className="flex items-center gap-2 flex-wrap pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-100">
                            {/* Tests toggle */}
                            <button
                              onClick={() => toggleStudentTestAccess(student.id, !student.canTakeTests)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                student.canTakeTests
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              }`}
                              title="Разрешить или запретить решать тренировочные тесты и билеты"
                            >
                              {student.canTakeTests ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              <span>Тесты: {student.canTakeTests ? 'ВКЛ' : 'ВЫКЛ'}</span>
                            </button>

                            {/* Exam toggle & attempts */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => toggleStudentExamAccess(student.id, !student.canTakeExam)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                  student.canTakeExam
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                                    : 'bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200'
                                }`}
                                title="Разрешить или закрыть допуск к государственному экзамену ДОСААФ"
                              >
                                {student.canTakeExam ? (
                                  <Unlock className="w-3.5 h-3.5 text-indigo-600" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5 text-neutral-500" />
                                )}
                                <span>Экзамен: {student.canTakeExam ? 'ДОПУЩЕН' : 'ЗАКРЫТ'}</span>
                              </button>

                              {/* Attempts badge with quick +1 and reset */}
                              <div
                                className={`px-2 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 ${
                                  (student.examAttemptsUsed ?? 0) >= (student.examAttemptsAllowed ?? 1)
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                                title={`Использовано: ${student.examAttemptsUsed ?? 0} из ${student.examAttemptsAllowed ?? 1}`}
                              >
                                <span>
                                  Попытки: <strong>{student.examAttemptsUsed ?? 0}</strong>/{student.examAttemptsAllowed ?? 1}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => {
                                    updateStudent(student.id, {
                                      examAttemptsAllowed: (student.examAttemptsAllowed ?? 1) + 1,
                                      canTakeExam: true,
                                    });
                                  }}
                                  className="px-1.5 py-0.5 bg-white rounded border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-[10px] font-bold"
                                  title="Добавить +1 попытку и открыть допуск"
                                >
                                  +1
                                </button>

                                {(student.examAttemptsUsed ?? 0) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateStudent(student.id, {
                                        examAttemptsUsed: 0,
                                        canTakeExam: true,
                                      });
                                    }}
                                    className="px-1.5 py-0.5 bg-white rounded border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-[10px] font-bold"
                                    title="Сбросить счетчик использованных попыток на 0 и открыть допуск"
                                  >
                                    Сброс
                                  </button>
                                )}
                              </div>

                              {/* Assigned Ticket Badge */}
                              <div className="px-2 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 bg-purple-50 text-purple-900 border-purple-200">
                                <Ticket className="w-3 h-3 text-purple-600 shrink-0" />
                                <span>
                                  {student.assignedExamTicket && typeof student.assignedExamTicket === 'number' ? (
                                    <>Билет: <strong>№{student.assignedExamTicket}</strong> (назначен)</>
                                  ) : (
                                    <>Билет: <span className="font-normal text-purple-700">выбирает сам</span></>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Section tabs quick pill badges */}
                            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-[10px] font-semibold">
                              <button
                                onClick={() => toggleStudentTabAccess(student.id, 'rules')}
                                className={`px-1.5 py-0.5 rounded transition-colors ${
                                  student.allowedTabs.rules
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-neutral-200 text-neutral-500 line-through'
                                }`}
                                title="Доступ к разделу ПДД и Знаки"
                              >
                                ПДД
                              </button>
                              <button
                                onClick={() => toggleStudentTabAccess(student.id, 'materials')}
                                className={`px-1.5 py-0.5 rounded transition-colors ${
                                  student.allowedTabs.materials
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-neutral-200 text-neutral-500 line-through'
                                }`}
                                title="Доступ к разделу Полезные материалы"
                              >
                                Материалы
                              </button>
                              <button
                                onClick={() => toggleStudentTabAccess(student.id, 'lessons')}
                                className={`px-1.5 py-0.5 rounded transition-colors ${
                                  student.allowedTabs.lessons
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-neutral-200 text-neutral-500 line-through'
                                }`}
                                title="Доступ к разделу Пройденные занятия"
                              >
                                Лекции
                              </button>
                              <button
                                onClick={() => toggleStudentTabAccess(student.id, 'schedule')}
                                className={`px-1.5 py-0.5 rounded transition-colors ${
                                  student.allowedTabs.schedule
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-neutral-200 text-neutral-500 line-through'
                                }`}
                                title="Доступ к разделу Расписание"
                              >
                                График
                              </button>
                            </div>

                            {/* Edit / Delete actions */}
                            <div className="flex items-center gap-1 ml-auto lg:ml-0">
                              <button
                                onClick={() => openEditForm(student)}
                                className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Редактировать учетную запись"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Удалить учетную запись курсанта ${student.fullName}?`)) {
                                    deleteStudent(student.id);
                                  }
                                }}
                                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Удалить курсанта"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Form for Add / Edit Student */}
          {activeTab === 'students' && isEditingStudent && (
            <form onSubmit={handleSaveStudent} className="space-y-5 bg-neutral-50 p-5 sm:p-6 rounded-2xl border border-neutral-200">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <h3 className="text-base font-bold text-neutral-900">
                  {editingStudentId ? 'Редактирование курсанта' : 'Новый курсант ДОСААФ'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingStudent(false)}
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-800"
                >
                  Отмена
                </button>
              </div>

              {studentFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {studentFormError}
                </div>
              )}

              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Фамилия курсанта <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Смирнов"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Имя курсанта <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Алексей"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Group & Login */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Учебная группа <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.category === 'C' ? 'Кат. C' : g.transmissionLabel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Логин курсанта (или номер билета)
                  </label>
                  <input
                    type="text"
                    value={formData.login}
                    onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                    placeholder="smirnov_a (если пусто, сформируется автоматически)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Пароль курсанта <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showFormPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Задайте пароль для курсанта"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="px-3 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-xs font-semibold text-neutral-700 flex items-center gap-1.5 shrink-0"
                    title="Сгенерировать случайный пароль"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Сгенерировать</span>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Сообщите этот пароль курсанту для входа в личный кабинет автошколы.
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Статус учетной записи
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={() => setFormData({ ...formData, status: 'active' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Активен (обучается в ДОСААФ)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-red-600">
                    <input
                      type="radio"
                      name="status"
                      value="blocked"
                      checked={formData.status === 'blocked'}
                      onChange={() => setFormData({ ...formData, status: 'blocked' })}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span>Заблокирован (вход запрещен)</span>
                  </label>
                </div>
              </div>

              {/* Permissions: Tests & Exam */}
              <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-3">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Разрешения на тесты и экзамен
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 hover:border-neutral-300 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.canTakeTests}
                      onChange={(e) => setFormData({ ...formData, canTakeTests: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-neutral-900 block">
                        Тренировочные тесты и билеты
                      </span>
                      <span className="text-neutral-500 text-[11px]">
                        Курсант может решать билеты по темам
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 hover:border-neutral-300 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.canTakeExam}
                      onChange={(e) => setFormData({ ...formData, canTakeExam: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-bold text-neutral-900 block">
                        Государственный экзамен ДОСААФ
                      </span>
                      <span className="text-neutral-500 text-[11px]">
                        Допуск к зачету или итоговому тестированию
                      </span>
                    </div>
                  </label>
                </div>

                {/* Exam Attempts Setup */}
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900">
                      Количество попыток сдачи экзамена:
                    </span>
                    <span className="text-[11px] text-indigo-700 font-medium">
                      После исчерпания доступ закрывается
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                        Разрешено попыток:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={formData.examAttemptsAllowed}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            examAttemptsAllowed: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-900 focus:ring-2 focus:ring-indigo-500"
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                        Использовано попыток:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={formData.examAttemptsUsed}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              examAttemptsUsed: Math.max(0, parseInt(e.target.value, 10) || 0),
                            })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-900 focus:ring-2 focus:ring-indigo-500"
                          placeholder="0"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, examAttemptsUsed: 0, canTakeExam: true })}
                          className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg text-[11px] font-bold text-neutral-700 shrink-0 transition-colors"
                          title="Сбросить использованные попытки на 0 и открыть допуск"
                        >
                          Сбросить
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Ticket for Student */}
                  <div className="pt-2 border-t border-indigo-100">
                    <label className="text-[11px] font-semibold text-neutral-800 flex items-center gap-1.5 mb-1">
                      <Ticket className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Назначенный экзаменационный билет:</span>
                    </label>
                    <select
                      value={formData.assignedExamTicket ?? 'free_choice'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          assignedExamTicket: val === 'free_choice' ? 'free_choice' : Number(val),
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-900 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="free_choice">Курсант выбирает сам при начале экзамена</option>
                      {Array.from({ length: examSettings.totalTickets || 40 }, (_, idx) => idx + 1).map((tNum) => (
                        <option key={tNum} value={tNum}>
                          Билет №{tNum} (фиксированный допуск)
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      Если назначен конкретный номер билета, курсант сразу сдаёт его без права выбора другого билета.
                    </span>
                  </div>
                </div>
              </div>

              {/* Tab Permissions */}
              <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-3">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Доступ к вкладкам портала
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rulesAccess}
                      onChange={(e) => setFormData({ ...formData, rulesAccess: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span>ПДД и Знаки</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.materialsAccess}
                      onChange={(e) => setFormData({ ...formData, materialsAccess: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span>Материалы</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.lessonsAccess}
                      onChange={(e) => setFormData({ ...formData, lessonsAccess: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span>Лекции</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.scheduleAccess}
                      onChange={(e) => setFormData({ ...formData, scheduleAccess: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span>Расписание</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Примечание преподавателя (для личного учета)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="например: Оплатил теорию, допущен к практике"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Form submit buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditingStudent(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  {editingStudentId ? 'Сохранить изменения' : 'Зарегистрировать курсанта'}
                </button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Change Login and Password */}
              <div className="bg-neutral-50 p-5 sm:p-6 rounded-2xl border border-neutral-200 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">
                      Смена логина и пароля администратора
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Пароль и логин хранятся конфиденциально и не отображаются в открытом виде
                    </p>
                  </div>
                </div>

                {securityError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                    {securityError}
                  </div>
                )}
                {securitySuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{securitySuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSaveAdminCredentials} className="space-y-3 max-w-lg">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Текущий пароль администратора <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={currentAdminPass}
                      onChange={(e) => setCurrentAdminPass(e.target.value)}
                      placeholder="Введите действующий пароль"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Логин администратора <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdminLogin}
                      onChange={(e) => setNewAdminLogin(e.target.value)}
                      placeholder="Логин администратора"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Новый пароль администратора
                    </label>
                    <input
                      type={showAdminPassFields ? 'text' : 'password'}
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      placeholder="Оставьте пустым, если не хотите менять пароль"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                    />
                  </div>

                  {newAdminPass && (
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Повторите новый пароль
                      </label>
                      <input
                        type={showAdminPassFields ? 'text' : 'password'}
                        value={confirmAdminPass}
                        onChange={(e) => setConfirmAdminPass(e.target.value)}
                        placeholder="Повторите новый пароль"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAdminPassFields(!showAdminPassFields)}
                      className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1 font-medium"
                    >
                      {showAdminPassFields ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showAdminPassFields ? 'Скрыть символы' : 'Показать символы'}</span>
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      Обновить учетные данные
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Requests Tab (Задача 3: Заявки у администратора) */}
          {activeTab === 'requests' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-rose-600" />
                    <span>Заявки на регистрацию от курсантов</span>
                    {pendingRequestsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                        {pendingRequestsCount} новых
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Курсанты заполнили форму «Подать заявку на доступ» на экране входа.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200 text-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setModalRequestsFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      modalRequestsFilter === 'pending'
                        ? 'bg-rose-50 text-rose-700 font-bold'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    Ожидают ({pendingRequestsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalRequestsFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      modalRequestsFilter === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 font-bold'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    Одобренные ({approvedRequestsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalRequestsFilter('rejected')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      modalRequestsFilter === 'rejected'
                        ? 'bg-neutral-100 text-neutral-800 font-bold'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    Отклонённые ({rejectedRequestsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalRequestsFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      modalRequestsFilter === 'all'
                        ? 'bg-neutral-100 text-neutral-800 font-bold'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    Все ({accessRequests.length})
                  </button>
                </div>
              </div>

              {/* Feedback */}
              {modalReqFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
                    modalReqFeedback.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {modalReqFeedback.type === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{modalReqFeedback.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalReqFeedback(null)}
                    className="text-neutral-400 hover:text-neutral-600 text-[11px] underline cursor-pointer"
                  >
                    Закрыть
                  </button>
                </div>
              )}

              {/* List */}
              {filteredRequests.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 text-xs bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  <UserPlus className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                  <p className="font-semibold text-neutral-600">Нет заявок с выбранным статусом</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
                  {filteredRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                            req.status === 'pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : req.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                          }`}
                        >
                          {req.lastName.charAt(0)}
                          {req.firstName.charAt(0)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-neutral-900">
                              {req.lastName} {req.firstName}
                            </span>
                            {req.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Ожидает решения
                              </span>
                            )}
                            {req.status === 'approved' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>Одобрена</span>
                              </span>
                            )}
                            {req.status === 'rejected' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                                Отклонена
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>Группа: <strong>{getGroupName(req.group)}</strong></span>
                            <span>•</span>
                            <span>Подана: {new Date(req.createdAt).toLocaleDateString('ru-RU')} в {new Date(req.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          {req.status === 'approved' && req.approvedLogin && (
                            <div className="mt-1 flex items-center gap-2 text-xs">
                              <span className="text-neutral-500">Логин:</span>
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200">
                                {req.approvedLogin}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(req.approvedLogin || '');
                                  setCopiedReqLogin(req.id);
                                  setTimeout(() => setCopiedReqLogin(null), 2000);
                                }}
                                className="text-[11px] text-neutral-400 hover:text-blue-600 inline-flex items-center gap-1 cursor-pointer"
                              >
                                {copiedReqLogin === req.id ? (
                                  <span className="text-emerald-600 font-semibold">Скопировано!</span>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Копировать</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {req.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const res = approveAccessRequest(req.id);
                                if (res.success) {
                                  setModalReqFeedback({
                                    id: req.id,
                                    message: `Заявка ${req.lastName} ${req.firstName} одобрена! Назначен логин ${res.login}. Учётная запись создана.`,
                                    type: 'success',
                                  });
                                } else {
                                  setModalReqFeedback({
                                    id: req.id,
                                    message: res.error || 'Ошибка при одобрении',
                                    type: 'error',
                                  });
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Одобрить</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                rejectAccessRequest(req.id);
                                setModalReqFeedback({
                                  id: req.id,
                                  message: `Заявка ${req.lastName} ${req.firstName} отклонена.`,
                                  type: 'success',
                                });
                              }}
                              className="px-3 py-1.5 bg-neutral-100 hover:bg-rose-50 text-neutral-700 hover:text-rose-700 border border-neutral-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                            >
                              <span>Отклонить</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteAccessRequest(req.id)}
                          title="Удалить из архива"
                          className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
