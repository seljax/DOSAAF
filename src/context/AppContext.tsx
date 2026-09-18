import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  User, RoadSign, RoadRule, QuestionCategory, Question, CompletedLesson,
  ScheduleItem, TestAttempt, GroupType, GroupConfig, LearningMaterial,
  ExamSettings, StudentAccount, AdminCredentials, ActivityLog,
  FooterSettings, NavTabConfig, SiteInfoSettings, AppTheme, AccessRequest,
} from '../types';
import {
  INITIAL_SIGNS, INITIAL_RULES, INITIAL_CATEGORIES, INITIAL_QUESTIONS,
  INITIAL_LESSONS, INITIAL_SCHEDULE, INITIAL_ATTEMPTS, INITIAL_GROUPS,
  INITIAL_MATERIALS, INITIAL_EXAM_SETTINGS, INITIAL_STUDENTS,
  INITIAL_ADMIN_CREDENTIALS, INITIAL_ACTIVITY_LOGS, INITIAL_FOOTER_SETTINGS,
  INITIAL_NAV_TABS, INITIAL_SITE_INFO, INITIAL_ACCESS_REQUESTS,
} from '../data/initialData';

// ==================== API-ХРАНИЛИЩЕ ====================

const API_URL = '/api/data';

// Загрузить все данные с сервера
async function loadAllFromServer(): Promise<Record<string, any>> {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Network error');
    const json = await res.json();
    return json.data || {};
  } catch (err) {
    console.warn('Не удалось загрузить данные с сервера:', err);
    return {};
  }
}

// Сохранить одно значение на сервере
async function saveToServer(key: string, value: any): Promise<void> {
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
  } catch (err) {
    console.warn(`Не удалось сохранить ${key} на сервере:`, err);
  }
}

// Хук: состояние, синхронизированное с сервером
function useSyncedState<T>(
  key: string,
  initialValue: T,
  serverData: Record<string, any>
): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (serverData[key] !== undefined) return serverData[key] as T;
    try {
      const saved = localStorage.getItem(`avtoshkola_${key}_v2`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialValue;
  });

  // Синхронизация с сервером — ТОЛЬКО ОДИН РАЗ при первой загрузке serverData
  const syncedRef = useRef(false);
  useEffect(() => {
    if (syncedRef.current) return;
    if (serverData[key] !== undefined) {
      setState(serverData[key] as T);
    }
    if (Object.keys(serverData).length > 0) {
      syncedRef.current = true;
    }
  }, [serverData, key]);

  const setAndSave = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
        saveToServer(key, next);
        try {
          localStorage.setItem(`avtoshkola_${key}_v2`, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [key]
  );

  return [state, setAndSave];
}

// ==================== ТИПЫ ====================

interface AppContextType {
  currentUser: User | null;
  isAdmin: boolean;
  selectedGroupTab: GroupType;
  setSelectedGroupTab: (group: GroupType) => void;
  loginAsStudent: (name: string, group: string) => void;
  updateStudentProfile: (name: string, group: string) => void;
  isStudentProfileComplete: boolean;
  loginAsAdmin: (login: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
  students: StudentAccount[];
  addStudent: (student: Omit<StudentAccount, 'id' | 'createdAt'>) => StudentAccount;
  updateStudent: (id: string, updates: Partial<StudentAccount>) => void;
  deleteStudent: (id: string) => void;
  toggleStudentTabAccess: (id: string, tab: keyof StudentAccount['allowedTabs']) => void;
  toggleStudentTestAccess: (id: string, canTakeTests: boolean) => void;
  toggleStudentExamAccess: (id: string, canTakeExam: boolean) => void;
  resetStudentExamAttempts: (id: string) => void;
  setStudentExamAttempts: (id: string, attemptsAllowed: number, resetUsed?: boolean) => void;
  loginStudentWithPassword: (loginOrName: string, password: string) => { success: boolean; error?: string };
  changeStudentPassword: (oldPass: string, newPass: string) => { success: boolean; error?: string };
  canAccessTab: (tabId: string) => boolean;
  canStudentTakeTests: () => boolean;
  canStudentTakeExam: () => boolean;
  adminCredentials: AdminCredentials;
  updateAdminCredentials: (oldPass: string, newLogin: string, newPass: string) => { success: boolean; error?: string };
  addRecoveryEmail: (email: string) => { success: boolean; error?: string };
  removeRecoveryEmail: (email: string) => { success: boolean; error?: string };
  requestPasswordResetCode: (email: string) => { success: boolean; code?: string; maskedEmail?: string; error?: string };
  resetAdminPasswordWithCode: (code: string, newLogin: string, newPass: string) => { success: boolean; error?: string };
  activityLogs: ActivityLog[];
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp' | 'dateStr' | 'timeStr'>) => void;
  clearActivityLogs: () => void;
  footerSettings: FooterSettings;
  updateFooterSettings: (settings: Partial<FooterSettings>) => void;
  resetFooterSettings: () => void;
  navTabs: NavTabConfig[];
  updateNavTab: (id: string, updates: Partial<NavTabConfig>) => void;
  reorderNavTabs: (tabIds: string[]) => void;
  resetNavTabs: () => void;
  siteInfo: SiteInfoSettings;
  updateSiteInfo: (info: Partial<SiteInfoSettings>) => void;
  resetSiteInfo: () => void;
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => void;
  isGroupModalOpen: boolean;
  setIsGroupModalOpen: (open: boolean) => void;
  groups: GroupConfig[];
  addGroup: (group: Omit<GroupConfig, 'id'>) => void;
  updateGroup: (id: string, updates: Partial<GroupConfig>) => void;
  deleteGroup: (id: string) => void;
  getGroupName: (group: GroupType) => string;
  signs: RoadSign[];
  addSign: (sign: Omit<RoadSign, 'id'>) => void;
  updateSign: (id: string, sign: Partial<RoadSign>) => void;
  deleteSign: (id: string) => void;
  rules: RoadRule[];
  addRule: (rule: Omit<RoadRule, 'id'>) => void;
  updateRule: (id: string, rule: Partial<RoadRule>) => void;
  deleteRule: (id: string) => void;
  categories: QuestionCategory[];
  questions: Question[];
  addCategory: (cat: Omit<QuestionCategory, 'id'>) => void;
  updateCategory: (id: string, cat: Partial<QuestionCategory>) => void;
  deleteCategory: (id: string) => void;
  addQuestion: (q: Omit<Question, 'id'>) => void;
  updateQuestion: (id: string, q: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  toggleQuestionExamInclusion: (id: string, include?: boolean) => void;
  batchSetQuestionsExamInclusion: (questionIds: string[], include: boolean) => void;
  batchAssignQuestionsToTicket: (questionIds: string[], ticketNumber?: number) => void;
  distributeQuestionsAcrossTickets: (totalTickets: number) => void;
  isExamInProgress: boolean;
  setIsExamInProgress: (inProgress: boolean) => void;
  lessons: CompletedLesson[];
  addLesson: (lesson: Omit<CompletedLesson, 'id' | 'createdAt'>) => void;
  updateLesson: (id: string, lesson: Partial<CompletedLesson>) => void;
  deleteLesson: (id: string) => void;
  schedule: ScheduleItem[];
  addScheduleItem: (item: Omit<ScheduleItem, 'id'>) => void;
  updateScheduleItem: (id: string, item: Partial<ScheduleItem>) => void;
  deleteScheduleItem: (id: string) => void;
  materials: LearningMaterial[];
  addMaterial: (mat: Omit<LearningMaterial, 'id' | 'dateAdded'>) => void;
  updateMaterial: (id: string, mat: Partial<LearningMaterial>) => void;
  deleteMaterial: (id: string) => void;
  examSettings: ExamSettings;
  updateExamSettings: (settings: Partial<ExamSettings>) => void;
  testAttempts: TestAttempt[];
  recordTestAttempt: (attempt: Omit<TestAttempt, 'id' | 'timestamp' | 'dateStr'>) => void;
  deleteTestAttempt: (id: string) => void;
  clearMyAttempts: (userId: string) => void;
  resetToDefaults: () => void;
  exportDataJson: () => string;
  importDataJson: (json: string) => { success: boolean; error?: string };
  accessRequests: AccessRequest[];
  submitAccessRequest: (reqData: { firstName: string; lastName: string; password: string; group?: string }) => AccessRequest;
  approveAccessRequest: (requestId: string) => { success: boolean; login?: string; error?: string };
  rejectAccessRequest: (requestId: string) => void;
  deleteAccessRequest: (requestId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ==================== ПРОВАЙДЕР ====================

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serverData, setServerData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadAllFromServer().then((data) => setServerData(data));
  }, []);

  // ========== ЛОКАЛЬНАЯ СЕССИЯ (только для этого браузера) ==========

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('avtoshkola_currentUser_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.isAdmin || (parsed.name && parsed.name.trim() !== ''))) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('avtoshkola_currentUser_v2', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('avtoshkola_currentUser_v2');
    }
  }, [currentUser]);

  const [selectedGroupTab, setSelectedGroupTabState] = useState<GroupType>(() => {
    try {
      const saved = localStorage.getItem('avtoshkola_groupFilter_v2');
      if (saved) return saved as GroupType;
    } catch {}
    return 'all';
  });

  const setSelectedGroupTab = (group: GroupType) => {
    setSelectedGroupTabState(group);
    localStorage.setItem('avtoshkola_groupFilter_v2', group);
  };

  // ========== ОБЩИЕ ДАННЫЕ (синхронизируются с сервером) ==========

  const [groups, setGroups] = useSyncedState<GroupConfig[]>('groups', INITIAL_GROUPS, serverData);
  const [signs, setSigns] = useSyncedState<RoadSign[]>('signs', INITIAL_SIGNS, serverData);
  const [rules, setRules] = useSyncedState<RoadRule[]>('rules', INITIAL_RULES, serverData);
  const [categories, setCategories] = useSyncedState<QuestionCategory[]>('categories', INITIAL_CATEGORIES, serverData);
  const [questions, setQuestions] = useSyncedState<Question[]>('questions', INITIAL_QUESTIONS, serverData);
  const [lessons, setLessons] = useSyncedState<CompletedLesson[]>('lessons', INITIAL_LESSONS, serverData);
  const [schedule, setSchedule] = useSyncedState<ScheduleItem[]>('schedule', INITIAL_SCHEDULE, serverData);
  const [materials, setMaterials] = useSyncedState<LearningMaterial[]>('materials', INITIAL_MATERIALS, serverData);
  const [examSettings, setExamSettings] = useSyncedState<ExamSettings>('examSettings', INITIAL_EXAM_SETTINGS, serverData);
  const [testAttempts, setTestAttempts] = useSyncedState<TestAttempt[]>('testAttempts', INITIAL_ATTEMPTS, serverData);
  const [students, setStudents] = useSyncedState<StudentAccount[]>('students', INITIAL_STUDENTS, serverData);
  const [adminCredentials, setAdminCredentials] = useSyncedState<AdminCredentials>('adminCredentials', INITIAL_ADMIN_CREDENTIALS, serverData);
  const [activityLogs, setActivityLogs] = useSyncedState<ActivityLog[]>('activityLogs', INITIAL_ACTIVITY_LOGS, serverData);
  const [footerSettings, setFooterSettings] = useSyncedState<FooterSettings>('footerSettings', INITIAL_FOOTER_SETTINGS, serverData);
  const [navTabs, setNavTabs] = useSyncedState<NavTabConfig[]>('navTabs', INITIAL_NAV_TABS, serverData);
  const [siteInfo, setSiteInfo] = useSyncedState<SiteInfoSettings>('siteInfo', INITIAL_SITE_INFO, serverData);
  const [appTheme, setAppThemeState] = useSyncedState<AppTheme>('appTheme', 'light', serverData);
  const [accessRequests, setAccessRequests] = useSyncedState<AccessRequest[]>('access_requests', INITIAL_ACCESS_REQUESTS, serverData);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const [passwordResetSession, setPasswordResetSession] = useState<{
    code: string; email: string; expiresAt: number;
  } | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-dosaaf-navy');
    root.removeAttribute('data-theme');
    if (appTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else if (appTheme === 'dosaaf_navy') {
      root.classList.add('dark', 'theme-dosaaf-navy');
      root.setAttribute('data-theme', 'dosaaf_navy');
    } else {
      root.setAttribute('data-theme', 'light');
    }
  }, [appTheme]);

  const setAppTheme = (newTheme: AppTheme) => setAppThemeState(newTheme);

  // ==================== ФУНКЦИИ ====================

  const loginAsStudent = (name: string, group: string) => {
    setCurrentUser({
      id: `student-${Date.now()}`,
      name: name.trim(),
      group,
      isAdmin: false,
    });
  };

  const updateStudentProfile = (name: string, group: string) => {
    setCurrentUser((prev) => ({
      id: prev?.id || `student-${Date.now()}`,
      name: name.trim(),
      group,
      isAdmin: prev?.isAdmin || false,
    }));
  };

  const isStudentProfileComplete = Boolean(
    currentUser && currentUser.name && currentUser.name.trim().length >= 3 && currentUser.name.trim().includes(' ')
  );

  const loginAsAdmin = (login: string, pass: string) => {
    const cleanLogin = login.trim().toLowerCase();
    const adminLogin = adminCredentials.login.trim().toLowerCase();
    if (cleanLogin === adminLogin && pass === adminCredentials.passwordHash) {
      setCurrentUser({
        id: 'admin-seljax',
        name: `Администратор (${adminCredentials.login})`,
        group: groups[0]?.id || 'group7_mkpp',
        isAdmin: true,
      });
      return { success: true };
    }
    return { success: false, error: 'Неверный логин или пароль администратора' };
  };

  const addStudent = (studentData: Omit<StudentAccount, 'id' | 'createdAt'>): StudentAccount => {
    const cleanFirst = studentData.firstName.trim();
    const cleanLast = studentData.lastName.trim();
    const fullName = `${cleanLast} ${cleanFirst}`.trim() || `${cleanFirst} ${cleanLast}`.trim();
    const newStudent: StudentAccount = {
      ...studentData,
      id: `student_${Date.now()}`,
      firstName: cleanFirst,
      lastName: cleanLast,
      fullName,
      login: studentData.login.trim() || `kursant_${Date.now().toString().slice(-4)}`,
      password: studentData.password.trim(),
      canTakeTests: studentData.canTakeTests ?? true,
      canTakeExam: studentData.canTakeExam ?? true,
      examAttemptsAllowed: studentData.examAttemptsAllowed ?? examSettings.defaultAllowedAttempts ?? 1,
      examAttemptsUsed: studentData.examAttemptsUsed ?? 0,
      createdAt: Date.now(),
    };
    setStudents((prev) => [newStudent, ...prev]);
    return newStudent;
  };

  const updateStudent = (id: string, updates: Partial<StudentAccount>) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...updates };
        if (updates.firstName !== undefined || updates.lastName !== undefined) {
          const first = (updates.firstName ?? s.firstName).trim();
          const last = (updates.lastName ?? s.lastName).trim();
          updated.fullName = `${last} ${first}`.trim() || `${first} ${last}`.trim();
        }
        return updated;
      })
    );

    if (currentUser?.studentId === id || currentUser?.id === id) {
      setCurrentUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          name: updates.fullName || prev.name,
          group: updates.group || prev.group,
          allowedTabs: updates.allowedTabs || prev.allowedTabs,
          canTakeTests: updates.canTakeTests !== undefined ? updates.canTakeTests : prev.canTakeTests,
          canTakeExam: updates.canTakeExam !== undefined ? updates.canTakeExam : prev.canTakeExam,
          examAttemptsAllowed: updates.examAttemptsAllowed !== undefined ? updates.examAttemptsAllowed : prev.examAttemptsAllowed,
          examAttemptsUsed: updates.examAttemptsUsed !== undefined ? updates.examAttemptsUsed : prev.examAttemptsUsed,
          examPassed: updates.examPassed !== undefined ? updates.examPassed : prev.examPassed,
          assignedExamTicket: updates.assignedExamTicket !== undefined ? updates.assignedExamTicket : prev.assignedExamTicket,
        };
      });
    }
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (currentUser?.studentId === id) logout();
  };

  const toggleStudentTabAccess = (id: string, tab: keyof StudentAccount['allowedTabs']) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, allowedTabs: { ...s.allowedTabs, [tab]: !s.allowedTabs[tab] } } : s
      )
    );
  };

  const toggleStudentTestAccess = (id: string, canTakeTests: boolean) => updateStudent(id, { canTakeTests });

  const toggleStudentExamAccess = (id: string, canTakeExam: boolean) => {
    const student = students.find((s) => s.id === id);
    if (!student) return;
    if (canTakeExam) {
      const allowed = student.examAttemptsAllowed ?? 1;
      const used = student.examAttemptsUsed ?? 0;
      if (used >= allowed) {
        updateStudent(id, { canTakeExam: true, examAttemptsUsed: Math.max(0, allowed - 1) });
      } else {
        updateStudent(id, { canTakeExam: true });
      }
    } else {
      updateStudent(id, { canTakeExam: false });
    }
  };

  const resetStudentExamAttempts = (id: string) => {
    updateStudent(id, { examAttemptsUsed: 0, canTakeExam: true });
  };

  const setStudentExamAttempts = (id: string, attemptsAllowed: number, resetUsed: boolean = false) => {
    updateStudent(id, {
      examAttemptsAllowed: Math.max(1, attemptsAllowed),
      ...(resetUsed ? { examAttemptsUsed: 0, canTakeExam: true } : {}),
    });
  };

  const loginStudentWithPassword = (loginOrName: string, pass: string) => {
    const q = loginOrName.trim().toLowerCase();
    const cleanPass = pass.trim();
    if (!q) return { success: false, error: 'Введите имя или логин' };
    if (!cleanPass) return { success: false, error: 'Введите пароль' };

    const matched = students.find((s) => {
      const matchLogin = s.login.toLowerCase() === q;
      const matchFull = s.fullName.toLowerCase() === q;
      const matchReverse =
        `${s.firstName} ${s.lastName}`.toLowerCase() === q ||
        `${s.lastName} ${s.firstName}`.toLowerCase() === q;
      const matchLast = s.lastName.toLowerCase() === q;
      return matchLogin || matchFull || matchReverse || matchLast;
    });

    if (!matched) return { success: false, error: 'Курсант не найден' };
    if (matched.status === 'blocked') return { success: false, error: 'Учётная запись заблокирована' };
    if (matched.password !== cleanPass) return { success: false, error: 'Неверный пароль' };

    updateStudent(matched.id, { lastLoginAt: Date.now() });

    setCurrentUser({
      id: matched.id,
      studentId: matched.id,
      name: matched.fullName,
      firstName: matched.firstName,
      lastName: matched.lastName,
      login: matched.login,
      group: matched.group,
      isAdmin: false,
      allowedTabs: matched.allowedTabs,
      canTakeTests: matched.canTakeTests,
      canTakeExam: matched.canTakeExam,
      examAttemptsAllowed: matched.examAttemptsAllowed ?? 1,
      examAttemptsUsed: matched.examAttemptsUsed ?? 0,
      examPassed: matched.examPassed,
      assignedExamTicket: matched.assignedExamTicket,
    });

    setSelectedGroupTab(matched.group);

    addActivityLog({
      userId: matched.id,
      userName: matched.fullName,
      userGroup: matched.group,
      userRole: 'student',
      actionType: 'login',
      message: `${matched.fullName} вошел в систему (${getGroupName(matched.group)})`,
      details: 'Успешная авторизация по персональному паролю',
    });

    return { success: true };
  };

  const changeStudentPassword = (oldPass: string, newPass: string) => {
    if (!currentUser || currentUser.isAdmin) return { success: false, error: 'Только для курсанта' };
    const student = students.find((s) => s.id === currentUser.studentId || s.id === currentUser.id);
    if (!student) return { success: false, error: 'Учётная запись не найдена' };
    if (student.password !== oldPass.trim()) return { success: false, error: 'Неверный текущий пароль' };
    if (!newPass || newPass.trim().length < 4) return { success: false, error: 'Пароль минимум 4 символа' };

    updateStudent(student.id, { password: newPass.trim() });

    addActivityLog({
      userId: student.id,
      userName: student.fullName,
      userGroup: student.group,
      userRole: 'student',
      actionType: 'password_change',
      message: `${student.fullName} изменил пароль`,
      details: 'Смена пароля через личный профиль',
    });

    return { success: true };
  };

  const canAccessTab = (tabId: string): boolean => {
    if (currentUser?.isAdmin) return true;
    if (tabId === 'stats' || tabId === 'logs') return false;
    if (tabId === 'about' || tabId === 'profile') return true;
    if (tabId === 'tests') return true;
    if (currentUser?.allowedTabs) {
      const key = tabId as keyof StudentAccount['allowedTabs'];
      if (currentUser.allowedTabs[key] !== undefined) return Boolean(currentUser.allowedTabs[key]);
    }
    return true;
  };

  const canStudentTakeTests = (): boolean => {
    if (currentUser?.isAdmin) return true;
    if (currentUser?.canTakeTests !== undefined) return currentUser.canTakeTests;
    return true;
  };

  const canStudentTakeExam = (): boolean => {
    if (currentUser?.isAdmin) return true;
    if (!currentUser) return false;

    const student = students.find(
      (s) => s.id === currentUser.id || s.login === currentUser.login || s.fullName === currentUser.name
    );

    if (student) {
      if (!student.canTakeExam) return false;
      const allowed = student.examAttemptsAllowed ?? 1;
      const used = student.examAttemptsUsed ?? 0;
      return used < allowed;
    }

    if (currentUser.canTakeExam === false) return false;
    const allowed = currentUser.examAttemptsAllowed ?? 1;
    const used = currentUser.examAttemptsUsed ?? 0;
    return used < allowed;
  };

  const updateAdminCredentials = (oldPass: string, newLogin: string, newPass: string) => {
    if (oldPass !== adminCredentials.passwordHash) return { success: false, error: 'Неверный текущий пароль' };
    const cleanLogin = newLogin.trim();
    if (!cleanLogin) return { success: false, error: 'Логин не может быть пустым' };
    if (newPass.length < 4) return { success: false, error: 'Пароль минимум 4 символа' };

    setAdminCredentials({ ...adminCredentials, login: cleanLogin, passwordHash: newPass, lastChangedAt: Date.now() });
    if (currentUser?.isAdmin) {
      setCurrentUser((prev) => (prev ? { ...prev, name: `Администратор (${cleanLogin})` } : null));
    }
    return { success: true };
  };

  const addRecoveryEmail = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, error: 'Некорректный email' };
    if (adminCredentials.recoveryEmails.map((e) => e.toLowerCase()).includes(cleanEmail)) {
      return { success: false, error: 'Уже добавлен' };
    }
    setAdminCredentials((prev) => ({ ...prev, recoveryEmails: [...prev.recoveryEmails, cleanEmail] }));
    return { success: true };
  };

  const removeRecoveryEmail = (email: string) => {
    if (adminCredentials.recoveryEmails.length <= 1) return;
    const clean = email.trim().toLowerCase();
    setAdminCredentials((prev) => ({
      ...prev,
      recoveryEmails: prev.recoveryEmails.filter((e) => e.toLowerCase() !== clean),
    }));
  };

  const requestPasswordResetCode = (email: string) => {
    const clean = email.trim().toLowerCase();
    const isKnown = adminCredentials.recoveryEmails.some((e) => e.toLowerCase() === clean);
    if (!isKnown) return { success: false, error: 'Email не найден' };

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setPasswordResetSession({ code, email: clean, expiresAt: Date.now() + 15 * 60 * 1000 });

    const [userPart, domainPart] = clean.split('@');
    const maskedUser = userPart.length > 2 ? `${userPart[0]}***${userPart[userPart.length - 1]}` : `${userPart[0]}***`;
    return { success: true, code, maskedEmail: `${maskedUser}@${domainPart}` };
  };

  const resetAdminPasswordWithCode = (code: string, newLogin: string, newPass: string) => {
    if (!passwordResetSession) return { success: false, error: 'Сессия не найдена' };
    if (Date.now() > passwordResetSession.expiresAt) {
      setPasswordResetSession(null);
      return { success: false, error: 'Код истёк' };
    }
    if (code.trim() !== passwordResetSession.code) return { success: false, error: 'Неверный код' };

    const cleanLogin = newLogin.trim();
    if (!cleanLogin) return { success: false, error: 'Логин пуст' };
    if (newPass.length < 4) return { success: false, error: 'Пароль минимум 4 символа' };

    setAdminCredentials((prev) => ({
      ...prev,
      login: cleanLogin,
      passwordHash: newPass,
      lastChangedAt: Date.now(),
    }));
    setPasswordResetSession(null);
    return { success: true };
  };

  const addActivityLog = (logData: Omit<ActivityLog, 'id' | 'timestamp' | 'dateStr' | 'timeStr'>) => {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newLog: ActivityLog = {
      ...logData,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      dateStr,
      timeStr,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const clearActivityLogs = () => setActivityLogs([]);

  const updateFooterSettings = (settingsUpdates: Partial<FooterSettings>) => {
    setFooterSettings((prev) => ({ ...prev, ...settingsUpdates }));
  };
  const resetFooterSettings = () => setFooterSettings(INITIAL_FOOTER_SETTINGS);

  const updateNavTab = (id: string, updates: Partial<NavTabConfig>) => {
    setNavTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const reorderNavTabs = (tabIds: string[]) => {
    setNavTabs((prev) => {
      const map = new Map<string, NavTabConfig>();
      prev.forEach((t) => map.set(t.id, t));
      const reordered: NavTabConfig[] = [];
      tabIds.forEach((id, index) => {
        const item = map.get(id);
        if (item) {
          reordered.push({ ...item, order: index + 1 });
          map.delete(id);
        }
      });
      map.forEach((item) => {
        reordered.push({ ...item, order: reordered.length + 1 });
      });
      return reordered;
    });
  };
  const resetNavTabs = () => setNavTabs(INITIAL_NAV_TABS);

  const updateSiteInfo = (infoUpdates: Partial<SiteInfoSettings>) => {
    setSiteInfo((prev) => ({ ...prev, ...infoUpdates }));
  };
  const resetSiteInfo = () => setSiteInfo(INITIAL_SITE_INFO);

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('avtoshkola_currentUser_v2');
  };

  const addGroup = (newGroupData: Omit<GroupConfig, 'id'>) => {
    const cleanNum = newGroupData.number.trim() || String(groups.length + 1);
    setGroups((prev) => [
      ...prev,
      {
        id: `group_${Date.now()}`,
        number: cleanNum,
        name: newGroupData.name.trim() || `Группа №${cleanNum}`,
        transmission: newGroupData.transmission || 'МКПП',
        transmissionLabel:
          newGroupData.transmissionLabel ||
          (newGroupData.transmission === 'АКПП' ? 'Автомат (АКПП)' : 'Механика (МКПП)'),
        description: newGroupData.description || '',
      },
    ]);
  };

  const updateGroup = (id: string, updates: Partial<GroupConfig>) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const newNumber = updates.number !== undefined ? updates.number : g.number;
        const newTrans = updates.transmission !== undefined ? updates.transmission : g.transmission;
        return {
          ...g,
          ...updates,
          number: newNumber,
          name: updates.name !== undefined ? updates.name : g.name || `Группа №${newNumber}`,
          transmission: newTrans,
          transmissionLabel:
            updates.transmissionLabel !== undefined
              ? updates.transmissionLabel
              : newTrans === 'АКПП'
              ? 'Автомат (АКПП)'
              : 'Механика (МКПП)',
        };
      })
    );
  };

  const deleteGroup = (id: string) => {
    if (groups.length <= 1) {
      alert('Нельзя удалить последнюю группу');
      return;
    }
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const getGroupName = (group: GroupType) => {
    if (group === 'all') return 'Все группы';
    const conf = groups.find((g) => g.id === group);
    return conf ? `${conf.name} (${conf.transmission})` : group;
  };

  const addSign = (sign: Omit<RoadSign, 'id'>) =>
    setSigns((prev) => [{ ...sign, id: `sign-${Date.now()}` }, ...prev]);
  const updateSign = (id: string, updates: Partial<RoadSign>) =>
    setSigns((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  const deleteSign = (id: string) => setSigns((prev) => prev.filter((s) => s.id !== id));

  const addRule = (rule: Omit<RoadRule, 'id'>) =>
    setRules((prev) => [{ ...rule, id: `rule-${Date.now()}` }, ...prev]);
  const updateRule = (id: string, updates: Partial<RoadRule>) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  const deleteRule = (id: string) => setRules((prev) => prev.filter((r) => r.id !== id));

  const addCategory = (cat: Omit<QuestionCategory, 'id'>) =>
    setCategories((prev) => [...prev, { ...cat, id: `cat-${Date.now()}` }]);
  const updateCategory = (id: string, updates: Partial<QuestionCategory>) =>
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setQuestions((prev) => prev.filter((q) => q.categoryId !== id));
  };

  const addQuestion = (q: Omit<Question, 'id'>) =>
    setQuestions((prev) => [{ ...q, id: `q-${Date.now()}` }, ...prev]);
  const updateQuestion = (id: string, updates: Partial<Question>) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  const deleteQuestion = (id: string) => setQuestions((prev) => prev.filter((q) => q.id !== id));

  const [isExamInProgress, setIsExamInProgress] = useState<boolean>(false);

  const toggleQuestionExamInclusion = (id: string, include?: boolean) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const newStatus = include !== undefined ? include : q.includeInExam === false ? true : false;
        return { ...q, includeInExam: newStatus };
      })
    );
  };

  const batchSetQuestionsExamInclusion = (questionIds: string[], include: boolean) => {
    const idSet = new Set(questionIds);
    setQuestions((prev) =>
      prev.map((q) => {
        if (!idSet.has(q.id)) return q;
        return { ...q, includeInExam: include };
      })
    );
  };

  const batchAssignQuestionsToTicket = (questionIds: string[], ticketNumber?: number) => {
    const idSet = new Set(questionIds);
    setQuestions((prev) =>
      prev.map((q) => {
        if (!idSet.has(q.id)) return q;
        return { ...q, ticketNumber, includeInExam: true };
      })
    );
  };

  const distributeQuestionsAcrossTickets = (totalTickets: number) => {
    const validCount = Math.max(1, Math.min(40, totalTickets || 40));
    setQuestions((prev) => {
      const examPool = prev.filter((q) => q.includeInExam !== false);
      const otherPool = prev.filter((q) => q.includeInExam === false);
      const updatedExamPool = examPool.map((q, idx) => ({
        ...q,
        ticketNumber: (idx % validCount) + 1,
        includeInExam: true,
      }));
      return [...updatedExamPool, ...otherPool];
    });
  };

  const addLesson = (lesson: Omit<CompletedLesson, 'id' | 'createdAt'>) =>
    setLessons((prev) => [{ ...lesson, id: `lesson-${Date.now()}`, createdAt: Date.now() }, ...prev]);
  const updateLesson = (id: string, updates: Partial<CompletedLesson>) =>
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  const deleteLesson = (id: string) => setLessons((prev) => prev.filter((l) => l.id !== id));

  const addScheduleItem = (item: Omit<ScheduleItem, 'id'>) =>
    setSchedule((prev) => [{ ...item, id: `sched-${Date.now()}` }, ...prev]);
  const updateScheduleItem = (id: string, updates: Partial<ScheduleItem>) =>
    setSchedule((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  const deleteScheduleItem = (id: string) => setSchedule((prev) => prev.filter((s) => s.id !== id));

  const addMaterial = (mat: Omit<LearningMaterial, 'id' | 'dateAdded'>) => {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    setMaterials((prev) => [{ ...mat, id: `mat-${Date.now()}`, dateAdded: dateStr }, ...prev]);
  };
  const updateMaterial = (id: string, updates: Partial<LearningMaterial>) =>
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  const deleteMaterial = (id: string) => setMaterials((prev) => prev.filter((m) => m.id !== id));

  const updateExamSettings = (settings: Partial<ExamSettings>) =>
    setExamSettings((prev) => ({ ...prev, ...settings }));

  const recordTestAttempt = (attempt: Omit<TestAttempt, 'id' | 'timestamp' | 'dateStr'>) => {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    setTestAttempts((prev) => [
      { ...attempt, id: `att-${Date.now()}`, timestamp: Date.now(), dateStr },
      ...prev,
    ]);

    if (attempt.isExam) {
      const isPassed = attempt.scorePercent >= (examSettings.passingPercent || 90);
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === attempt.userId || s.login === attempt.userId || s.fullName === attempt.userName) {
            const nextUsed = (s.examAttemptsUsed || 0) + 1;
            return {
              ...s,
              examAttemptsUsed: nextUsed,
              canTakeExam: false,
              examPassed: isPassed ? true : s.examPassed,
            };
          }
          return s;
        })
      );

      if (currentUser && !currentUser.isAdmin) {
        setCurrentUser((prev) => {
          if (!prev) return null;
          const nextUsed = (prev.examAttemptsUsed || 0) + 1;
          return {
            ...prev,
            examAttemptsUsed: nextUsed,
            canTakeExam: false,
            examPassed: isPassed ? true : prev.examPassed,
          };
        });
      }
    }

    addActivityLog({
      userId: attempt.userId,
      userName: attempt.userName,
      userGroup: attempt.userGroup,
      userRole: currentUser?.isAdmin ? 'admin' : 'student',
      actionType: attempt.isExam ? 'exam_completed' : 'test_completed',
      message: `${attempt.userName} завершил ${
        attempt.isExam ? 'гос. экзамен (доступ закрыт)' : `тест «${attempt.categoryTitle}»`
      } (${attempt.scorePercent}%)`,
      details: `${attempt.correctAnswers} из ${attempt.totalQuestions} верно`,
    });
  };

  const deleteTestAttempt = (id: string) => setTestAttempts((prev) => prev.filter((a) => a.id !== id));
  const clearMyAttempts = (userId: string) => setTestAttempts((prev) => prev.filter((a) => a.userId !== userId));

  const resetToDefaults = () => {
    setGroups(INITIAL_GROUPS);
    setSigns(INITIAL_SIGNS);
    setRules(INITIAL_RULES);
    setCategories(INITIAL_CATEGORIES);
    setQuestions(INITIAL_QUESTIONS);
    setLessons(INITIAL_LESSONS);
    setSchedule(INITIAL_SCHEDULE);
    setMaterials(INITIAL_MATERIALS);
    setExamSettings(INITIAL_EXAM_SETTINGS);
    setTestAttempts(INITIAL_ATTEMPTS);
    setStudents(INITIAL_STUDENTS);
    setAdminCredentials(INITIAL_ADMIN_CREDENTIALS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setFooterSettings(INITIAL_FOOTER_SETTINGS);
    setNavTabs(INITIAL_NAV_TABS);
    setSiteInfo(INITIAL_SITE_INFO);
  };

  const exportDataJson = () =>
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        groups, signs, rules, categories, questions, lessons, schedule, materials,
        examSettings, testAttempts, students, adminCredentials, activityLogs,
        footerSettings, navTabs, siteInfo,
      },
      null,
      2
    );

  const importDataJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.groups) setGroups(parsed.groups);
      if (parsed.signs) setSigns(parsed.signs);
      if (parsed.rules) setRules(parsed.rules);
      if (parsed.categories) setCategories(parsed.categories);
      if (parsed.questions) setQuestions(parsed.questions);
      if (parsed.lessons) setLessons(parsed.lessons);
      if (parsed.schedule) setSchedule(parsed.schedule);
      if (parsed.materials) setMaterials(parsed.materials);
      if (parsed.examSettings) setExamSettings(parsed.examSettings);
      if (parsed.testAttempts) setTestAttempts(parsed.testAttempts);
      if (parsed.students) setStudents(parsed.students);
      if (parsed.adminCredentials) setAdminCredentials(parsed.adminCredentials);
      if (parsed.activityLogs) setActivityLogs(parsed.activityLogs);
      if (parsed.footerSettings) setFooterSettings(parsed.footerSettings);
      if (parsed.navTabs) setNavTabs(parsed.navTabs);
      if (parsed.siteInfo) setSiteInfo(parsed.siteInfo);
      return { success: true };
    } catch {
      return { success: false, error: 'Ошибка разбора JSON' };
    }
  };

  // ========== ЗАЯВКИ НА ДОСТУП ==========

  const submitAccessRequest = (reqData: {
    firstName: string;
    lastName: string;
    password: string;
    group?: string;
  }): AccessRequest => {
    const cleanFirst = reqData.firstName.trim();
    const cleanLast = reqData.lastName.trim();
    const cleanPass = reqData.password.trim();
    const targetGroup = reqData.group || groups[0]?.id || 'group7_mkpp';

    const newReq: AccessRequest = {
      id: `req_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
      firstName: cleanFirst,
      lastName: cleanLast,
      password: cleanPass,
      group: targetGroup,
      status: 'pending',
      createdAt: Date.now(),
    };

    setAccessRequests((prev) => [newReq, ...prev]);

    addActivityLog({
      userId: newReq.id,
      userName: `${cleanLast} ${cleanFirst}`.trim(),
      userGroup: targetGroup,
      userRole: 'student',
      actionType: 'access_changed',
      message: `Подана заявка на доступ: ${cleanLast} ${cleanFirst}`,
      details: `Группа: ${getGroupName(targetGroup)}`,
    });

    return newReq;
  };

  const approveAccessRequest = (
    requestId: string
  ): { success: boolean; login?: string; error?: string } => {
    const target = accessRequests.find((r) => r.id === requestId);
    if (!target) return { success: false, error: 'Заявка не найдена' };
    if (target.status === 'approved') return { success: false, error: 'Заявка уже одобрена' };

    let generatedLogin = '';
    for (let attempts = 0; attempts < 100; attempts++) {
      const candidate = `kursant_${Math.floor(1000 + Math.random() * 9000)}`;
      if (!students.some((s) => s.login.toLowerCase() === candidate.toLowerCase())) {
        generatedLogin = candidate;
        break;
      }
    }
    if (!generatedLogin) {
      generatedLogin = `kursant_${Date.now().toString().slice(-4)}`;
    }

    const targetGroup = target.group || groups[0]?.id || 'group7_mkpp';
    const newStudent = addStudent({
      firstName: target.firstName,
      lastName: target.lastName,
      fullName: `${target.lastName} ${target.firstName}`.trim(),
      login: generatedLogin,
      password: target.password,
      group: targetGroup,
      status: 'active',
      allowedTabs: {
        rules: true,
        materials: true,
        lessons: true,
        schedule: true,
      },
      canTakeTests: true,
      canTakeExam: false,
      notes: `Заявка одобрена администратором ${new Date().toLocaleDateString('ru-RU')}`,
    });

    setAccessRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved' as const,
              approvedLogin: generatedLogin,
              processedAt: Date.now(),
            }
          : r
      )
    );

    addActivityLog({
      userId: newStudent.id,
      userName: newStudent.fullName,
      userGroup: newStudent.group,
      userRole: 'admin',
      actionType: 'access_changed',
      message: `Одобрена заявка на доступ: ${target.lastName} ${target.firstName}`,
      details: `Выдан логин: ${generatedLogin}, группа: ${getGroupName(targetGroup)}`,
    });

    return { success: true, login: generatedLogin };
  };

  const rejectAccessRequest = (requestId: string) => {
    const target = accessRequests.find((r) => r.id === requestId);
    setAccessRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: 'rejected' as const, processedAt: Date.now() }
          : r
      )
    );

    if (target) {
      addActivityLog({
        userId: target.id,
        userName: `${target.lastName} ${target.firstName}`.trim(),
        userGroup: target.group || 'all',
        userRole: 'admin',
        actionType: 'access_changed',
        message: `Отклонена заявка на доступ: ${target.lastName} ${target.firstName}`,
        details: 'Заявка отклонена администратором',
      });
    }
  };

  const deleteAccessRequest = (requestId: string) => {
    setAccessRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAdmin: Boolean(currentUser?.isAdmin),
        selectedGroupTab,
        setSelectedGroupTab,
        loginAsStudent,
        updateStudentProfile,
        isStudentProfileComplete,
        loginAsAdmin,
        logout,
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        toggleStudentTabAccess,
        toggleStudentTestAccess,
        toggleStudentExamAccess,
        resetStudentExamAttempts,
        setStudentExamAttempts,
        loginStudentWithPassword,
        changeStudentPassword,
        canAccessTab,
        canStudentTakeTests,
        canStudentTakeExam,
        adminCredentials,
        updateAdminCredentials,
        addRecoveryEmail,
        removeRecoveryEmail,
        requestPasswordResetCode,
        resetAdminPasswordWithCode,
        activityLogs,
        addActivityLog,
        clearActivityLogs,
        footerSettings,
        updateFooterSettings,
        resetFooterSettings,
        navTabs,
        updateNavTab,
        reorderNavTabs,
        resetNavTabs,
        siteInfo,
        updateSiteInfo,
        resetSiteInfo,
        appTheme,
        setAppTheme,
        isGroupModalOpen,
        setIsGroupModalOpen,
        groups,
        addGroup,
        updateGroup,
        deleteGroup,
        getGroupName,
        signs,
        addSign,
        updateSign,
        deleteSign,
        rules,
        addRule,
        updateRule,
        deleteRule,
        categories,
        questions,
        addCategory,
        updateCategory,
        deleteCategory,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        toggleQuestionExamInclusion,
        batchSetQuestionsExamInclusion,
        batchAssignQuestionsToTicket,
        distributeQuestionsAcrossTickets,
        isExamInProgress,
        setIsExamInProgress,
        lessons,
        addLesson,
        updateLesson,
        deleteLesson,
        schedule,
        addScheduleItem,
        updateScheduleItem,
        deleteScheduleItem,
        materials,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        examSettings,
        updateExamSettings,
        testAttempts,
        recordTestAttempt,
        deleteTestAttempt,
        clearMyAttempts,
        resetToDefaults,
        exportDataJson,
        importDataJson,
        accessRequests,
        submitAccessRequest,
        approveAccessRequest,
        rejectAccessRequest,
        deleteAccessRequest,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};