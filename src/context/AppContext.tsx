import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  RoadSign,
  RoadRule,
  QuestionCategory,
  Question,
  CompletedLesson,
  ScheduleItem,
  TestAttempt,
  GroupType,
  GroupConfig,
  LearningMaterial,
  ExamSettings,
} from '../types';
import {
  INITIAL_SIGNS,
  INITIAL_RULES,
  INITIAL_CATEGORIES,
  INITIAL_QUESTIONS,
  INITIAL_LESSONS,
  INITIAL_SCHEDULE,
  INITIAL_ATTEMPTS,
  INITIAL_GROUPS,
  INITIAL_MATERIALS,
  INITIAL_EXAM_SETTINGS,
} from '../data/initialData';

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

  // Groups configuration (Admin can change group numbers, add new groups, delete groups)
  groups: GroupConfig[];
  addGroup: (group: Omit<GroupConfig, 'id'>) => void;
  updateGroup: (id: string, updates: Partial<GroupConfig>) => void;
  deleteGroup: (id: string) => void;
  getGroupName: (group: GroupType) => string;

  // Signs
  signs: RoadSign[];
  addSign: (sign: Omit<RoadSign, 'id'>) => void;
  updateSign: (id: string, sign: Partial<RoadSign>) => void;
  deleteSign: (id: string) => void;

  // Rules
  rules: RoadRule[];
  addRule: (rule: Omit<RoadRule, 'id'>) => void;
  updateRule: (id: string, rule: Partial<RoadRule>) => void;
  deleteRule: (id: string) => void;

  // Question Categories & Questions
  categories: QuestionCategory[];
  questions: Question[];
  addCategory: (cat: Omit<QuestionCategory, 'id'>) => void;
  updateCategory: (id: string, cat: Partial<QuestionCategory>) => void;
  deleteCategory: (id: string) => void;
  addQuestion: (q: Omit<Question, 'id'>) => void;
  updateQuestion: (id: string, q: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;

  // Lessons
  lessons: CompletedLesson[];
  addLesson: (lesson: Omit<CompletedLesson, 'id' | 'createdAt'>) => void;
  updateLesson: (id: string, lesson: Partial<CompletedLesson>) => void;
  deleteLesson: (id: string) => void;

  // Schedule
  schedule: ScheduleItem[];
  addScheduleItem: (item: Omit<ScheduleItem, 'id'>) => void;
  updateScheduleItem: (id: string, item: Partial<ScheduleItem>) => void;
  deleteScheduleItem: (id: string) => void;

  // Useful Materials (Videos, Articles, Guides)
  materials: LearningMaterial[];
  addMaterial: (mat: Omit<LearningMaterial, 'id' | 'dateAdded'>) => void;
  updateMaterial: (id: string, mat: Partial<LearningMaterial>) => void;
  deleteMaterial: (id: string) => void;

  // Exam Settings
  examSettings: ExamSettings;
  updateExamSettings: (settings: Partial<ExamSettings>) => void;

  // Tests & Statistics
  testAttempts: TestAttempt[];
  recordTestAttempt: (attempt: Omit<TestAttempt, 'id' | 'timestamp' | 'dateStr'>) => void;
  deleteTestAttempt: (id: string) => void;
  clearMyAttempts: (userId: string) => void;

  // Backup / Reset
  resetToDefaults: () => void;
  exportDataJson: () => string;
  importDataJson: (json: string) => { success: boolean; error?: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'avtoshkola_user_v2',
  SIGNS: 'avtoshkola_signs_v2',
  RULES: 'avtoshkola_rules_v2',
  CATEGORIES: 'avtoshkola_categories_v2',
  QUESTIONS: 'avtoshkola_questions_v2',
  LESSONS: 'avtoshkola_lessons_v2',
  SCHEDULE: 'avtoshkola_schedule_v2',
  ATTEMPTS: 'avtoshkola_attempts_v2',
  GROUP_FILTER: 'avtoshkola_group_filter_v2',
  GROUPS: 'avtoshkola_groups_v2',
  MATERIALS: 'avtoshkola_materials_v2',
  EXAM_SETTINGS: 'avtoshkola_exam_settings_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      id: 'student-demo',
      name: '',
      group: 'group7_mkpp',
      isAdmin: false,
    };
  });

  // Groups configuration
  const [groups, setGroups] = useState<GroupConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_GROUPS;
  });

  // Selected Group Filter (All / group 7 / group 8)
  const [selectedGroupTab, setSelectedGroupTabState] = useState<GroupType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GROUP_FILTER);
      if (saved) return saved as GroupType;
    } catch {
      // ignore
    }
    return 'all';
  });

  const setSelectedGroupTab = (group: GroupType) => {
    setSelectedGroupTabState(group);
    localStorage.setItem(STORAGE_KEYS.GROUP_FILTER, group);
  };

  // Signs state
  const [signs, setSigns] = useState<RoadSign[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SIGNS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SIGNS;
  });

  // Rules state
  const [rules, setRules] = useState<RoadRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RULES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_RULES;
  });

  // Categories state
  const [categories, setCategories] = useState<QuestionCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_CATEGORIES;
  });

  // Questions state
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_QUESTIONS;
  });

  // Lessons state
  const [lessons, setLessons] = useState<CompletedLesson[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LESSONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_LESSONS;
  });

  // Schedule state
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SCHEDULE;
  });

  // Materials state
  const [materials, setMaterials] = useState<LearningMaterial[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_MATERIALS;
  });

  // Exam Settings state
  const [examSettings, setExamSettings] = useState<ExamSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXAM_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_EXAM_SETTINGS;
  });

  // Attempts state
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_ATTEMPTS;
  });

  // Synchronize to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SIGNS, JSON.stringify(signs));
  }, [signs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
  }, [lessons]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXAM_SETTINGS, JSON.stringify(examSettings));
  }, [examSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(testAttempts));
  }, [testAttempts]);

  // Auth functions
  const loginAsStudent = (name: string, group: string) => {
    const cleanName = name.trim();
    const newUser: User = {
      id: `student-${Date.now()}`,
      name: cleanName,
      group,
      isAdmin: false,
    };
    setCurrentUser(newUser);
  };

  const updateStudentProfile = (name: string, group: string) => {
    const cleanName = name.trim();
    setCurrentUser((prev) => ({
      id: prev?.id || `student-${Date.now()}`,
      name: cleanName,
      group,
      isAdmin: prev?.isAdmin || false,
    }));
  };

  const isStudentProfileComplete = Boolean(
    currentUser &&
      currentUser.name &&
      currentUser.name.trim().length >= 3 &&
      currentUser.name.trim().includes(' ')
  );

  const loginAsAdmin = (login: string, pass: string) => {
    if (login.trim() === 'seljax' && pass === 'fgy36lol90k') {
      const adminUser: User = {
        id: 'admin-seljax',
        name: 'Администратор (seljax)',
        group: groups[0]?.id || 'group7_mkpp',
        isAdmin: true,
      };
      setCurrentUser(adminUser);
      return { success: true };
    }
    return { success: false, error: 'Неверный логин или пароль администратора' };
  };

  const logout = () => {
    setCurrentUser({
      id: `guest-${Date.now()}`,
      name: '',
      group: groups[0]?.id || 'group7_mkpp',
      isAdmin: false,
    });
  };

  // Groups Management
  const addGroup = (newGroupData: Omit<GroupConfig, 'id'>) => {
    const cleanNum = newGroupData.number.trim() || String(groups.length + 1);
    const newId = `group_${Date.now()}`;
    const newGroup: GroupConfig = {
      id: newId,
      number: cleanNum,
      name: newGroupData.name.trim() || `Группа №${cleanNum}`,
      transmission: newGroupData.transmission || 'МКПП',
      transmissionLabel:
        newGroupData.transmissionLabel ||
        (newGroupData.transmission === 'АКПП' ? 'Автомат (АКПП)' : 'Механика (МКПП)'),
      description: newGroupData.description || '',
    };
    setGroups((prev) => [...prev, newGroup]);
  };

  const updateGroup = (id: string, updates: Partial<GroupConfig>) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const newNumber = updates.number !== undefined ? updates.number : g.number;
        const newTrans = updates.transmission !== undefined ? updates.transmission : g.transmission;
        const newName = updates.name !== undefined ? updates.name : (g.name || `Группа №${newNumber}`);
        const newLabel =
          updates.transmissionLabel !== undefined
            ? updates.transmissionLabel
            : (newTrans === 'АКПП' ? 'Автомат (АКПП)' : 'Механика (МКПП)');

        return {
          ...g,
          ...updates,
          number: newNumber,
          name: newName,
          transmission: newTrans,
          transmissionLabel: newLabel,
        };
      })
    );
  };

  const deleteGroup = (id: string) => {
    if (groups.length <= 1) {
      alert('Нельзя удалить единственную оставшуюся группу.');
      return;
    }
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const getGroupName = (group: GroupType) => {
    if (group === 'all') return 'Все группы';
    const conf = groups.find((g) => g.id === group);
    if (!conf) return group;
    return `${conf.name} (${conf.transmission})`;
  };

  // Road Signs CRUD
  const addSign = (sign: Omit<RoadSign, 'id'>) => {
    const newSign: RoadSign = {
      ...sign,
      id: `sign-${Date.now()}`,
    };
    setSigns((prev) => [newSign, ...prev]);
  };

  const updateSign = (id: string, signUpdates: Partial<RoadSign>) => {
    setSigns((prev) => prev.map((s) => (s.id === id ? { ...s, ...signUpdates } : s)));
  };

  const deleteSign = (id: string) => {
    setSigns((prev) => prev.filter((s) => s.id !== id));
  };

  // Rules CRUD
  const addRule = (rule: Omit<RoadRule, 'id'>) => {
    const newRule: RoadRule = {
      ...rule,
      id: `rule-${Date.now()}`,
    };
    setRules((prev) => [newRule, ...prev]);
  };

  const updateRule = (id: string, ruleUpdates: Partial<RoadRule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...ruleUpdates } : r)));
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  // Categories CRUD
  const addCategory = (cat: Omit<QuestionCategory, 'id'>) => {
    const newCat: QuestionCategory = {
      ...cat,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const updateCategory = (id: string, catUpdates: Partial<QuestionCategory>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...catUpdates } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setQuestions((prev) => prev.filter((q) => q.categoryId !== id));
  };

  // Questions CRUD
  const addQuestion = (q: Omit<Question, 'id'>) => {
    const newQuestion: Question = {
      ...q,
      id: `q-${Date.now()}`,
    };
    setQuestions((prev) => [newQuestion, ...prev]);
  };

  const updateQuestion = (id: string, qUpdates: Partial<Question>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...qUpdates } : q)));
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // Lessons CRUD
  const addLesson = (lesson: Omit<CompletedLesson, 'id' | 'createdAt'>) => {
    const newLesson: CompletedLesson = {
      ...lesson,
      id: `lesson-${Date.now()}`,
      createdAt: Date.now(),
    };
    setLessons((prev) => [newLesson, ...prev]);
  };

  const updateLesson = (id: string, lessonUpdates: Partial<CompletedLesson>) => {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, ...lessonUpdates } : l)));
  };

  const deleteLesson = (id: string) => {
    setLessons((prev) => prev.filter((l) => l.id !== id));
  };

  // Schedule CRUD
  const addScheduleItem = (item: Omit<ScheduleItem, 'id'>) => {
    const newItem: ScheduleItem = {
      ...item,
      id: `sched-${Date.now()}`,
    };
    setSchedule((prev) => [newItem, ...prev]);
  };

  const updateScheduleItem = (id: string, itemUpdates: Partial<ScheduleItem>) => {
    setSchedule((prev) => prev.map((s) => (s.id === id ? { ...s, ...itemUpdates } : s)));
  };

  const deleteScheduleItem = (id: string) => {
    setSchedule((prev) => prev.filter((s) => s.id !== id));
  };

  // Materials CRUD
  const addMaterial = (mat: Omit<LearningMaterial, 'id' | 'dateAdded'>) => {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(
      now.getMonth() + 1
    ).padStart(2, '0')}.${now.getFullYear()}`;

    const newMat: LearningMaterial = {
      ...mat,
      id: `mat-${Date.now()}`,
      dateAdded: dateStr,
    };
    setMaterials((prev) => [newMat, ...prev]);
  };

  const updateMaterial = (id: string, matUpdates: Partial<LearningMaterial>) => {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...matUpdates } : m)));
  };

  const deleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  // Exam Settings
  const updateExamSettings = (settingsUpdates: Partial<ExamSettings>) => {
    setExamSettings((prev) => ({ ...prev, ...settingsUpdates }));
  };

  // Test Attempts
  const recordTestAttempt = (attempt: Omit<TestAttempt, 'id' | 'timestamp' | 'dateStr'>) => {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(
      now.getMonth() + 1
    ).padStart(2, '0')}.${now.getFullYear()}`;

    const newAttempt: TestAttempt = {
      ...attempt,
      id: `att-${Date.now()}`,
      timestamp: Date.now(),
      dateStr,
    };
    setTestAttempts((prev) => [newAttempt, ...prev]);
  };

  const deleteTestAttempt = (id: string) => {
    setTestAttempts((prev) => prev.filter((a) => a.id !== id));
  };

  const clearMyAttempts = (userId: string) => {
    setTestAttempts((prev) => prev.filter((a) => a.userId !== userId));
  };

  // Reset to initial defaults
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
  };

  // Export & Import
  const exportDataJson = () => {
    const exportObject = {
      exportedAt: new Date().toISOString(),
      groups,
      signs,
      rules,
      categories,
      questions,
      lessons,
      schedule,
      materials,
      examSettings,
      testAttempts,
    };
    return JSON.stringify(exportObject, null, 2);
  };

  const importDataJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.groups && Array.isArray(parsed.groups)) setGroups(parsed.groups);
      if (parsed.signs && Array.isArray(parsed.signs)) setSigns(parsed.signs);
      if (parsed.rules && Array.isArray(parsed.rules)) setRules(parsed.rules);
      if (parsed.categories && Array.isArray(parsed.categories)) setCategories(parsed.categories);
      if (parsed.questions && Array.isArray(parsed.questions)) setQuestions(parsed.questions);
      if (parsed.lessons && Array.isArray(parsed.lessons)) setLessons(parsed.lessons);
      if (parsed.schedule && Array.isArray(parsed.schedule)) setSchedule(parsed.schedule);
      if (parsed.materials && Array.isArray(parsed.materials)) setMaterials(parsed.materials);
      if (parsed.examSettings) setExamSettings(parsed.examSettings);
      if (parsed.testAttempts && Array.isArray(parsed.testAttempts)) setTestAttempts(parsed.testAttempts);
      return { success: true };
    } catch {
      return { success: false, error: 'Ошибка разбора JSON файла' };
    }
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
