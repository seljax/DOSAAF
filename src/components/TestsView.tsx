import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Question, QuestionCategory, RoadSign, GroupType } from '../types';
import { RoadSignSvg } from './RoadSignSvg';
import { ImageInputControl } from './ImageInputControl';
import { EditableDesignBlock } from './EditableDesignBlock';
import { useDesignEditor } from '../context/DesignEditorContext';
import confetti from 'canvas-confetti';
import { playSuccessSound, playFailSound } from '../utils/sound';
import { ExamAdminModal } from './ExamAdminModal';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Play,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Filter,
  Layers,
  Award,
  AlertTriangle,
  FolderPlus,
  X,
  FileQuestion,
  ChevronRight,
  Lock,
  Unlock,
  Settings,
  Settings2,
  Timer,
  Sliders,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Check,
  Minus,
  Info,
  Search,
  Truck,
  Car,
  Ticket,
  SkipForward,
  Users,
} from 'lucide-react';

interface ActiveTestSession {
  category: QuestionCategory | null;
  isExamMode: boolean;
  ticketNumber?: number | 'random';
  questionsList: Question[];
  currentIndex: number;
  userAnswers: Record<number, number>; // index -> chosen option index
  skippedIndices?: number[]; // indices of questions skipped by cadet
  isFinished: boolean;
  startTime: number;
  elapsedSeconds: number;
  timeLimitSeconds: number; // 0 = unlimited
}

export const TestsView: React.FC = () => {
  const {
    categories,
    questions,
    signs,
    currentUser,
    selectedGroupTab,
    addCategory,
    updateCategory,
    deleteCategory,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    recordTestAttempt,
    isAdmin,
    students,
    examSettings,
    updateExamSettings,
    getGroupName,
    groups,
    canStudentTakeTests,
    canStudentTakeExam,
    toggleQuestionExamInclusion,
    batchSetQuestionsExamInclusion,
    batchAssignQuestionsToTicket,
    distributeQuestionsAcrossTickets,
    isExamInProgress,
    setIsExamInProgress,
    addActivityLog,
  } = useApp();
  const { getOrderedItems } = useDesignEditor();

  // Test Session state
  const [activeSession, setActiveSession] = useState<ActiveTestSession | null>(null);

  // Pre-exam Warning & Instruction Modal state
  const [isExamWarningOpen, setIsExamWarningOpen] = useState(false);
  const [examAgreementChecked, setExamAgreementChecked] = useState(false);

  // Anti-cheat tab tracking & violation alerts
  const [tabViolationsCount, setTabViolationsCount] = useState(0);
  const [showTabViolationAlert, setShowTabViolationAlert] = useState(false);

  // Filter for question bank exam pool: 'all' | 'included' | 'excluded'
  const [examInclusionFilter, setExamInclusionFilter] = useState<'all' | 'included' | 'excluded'>('all');

  // Admin Exam & Timer Settings Modal
  const [isExamSettingsOpen, setIsExamSettingsOpen] = useState(false);
  const [localExamSettings, setLocalExamSettings] = useState(examSettings);

  // Unified Admin Exam & Ticket Manager Modal
  const [isExamAdminModalOpen, setIsExamAdminModalOpen] = useState(false);
  const [examAdminTab, setExamAdminTab] = useState<'tickets' | 'questions' | 'settings'>('tickets');

  // Filter for question bank view
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const [activeBankTab, setActiveBankTab] = useState<'quizzes' | 'manage_questions'>('quizzes');

  // Ticket selection for Exam
  const [selectedExamTicket, setSelectedExamTicket] = useState<number | 'random'>('random');
  const [isTicketSelectModalOpen, setIsTicketSelectModalOpen] = useState(false);

  // Admin Modals
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catFormData, setCatFormData] = useState({ title: '', description: '', iconName: 'HelpCircle' });

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qFormData, setQFormData] = useState({
    categoryId: '',
    questionText: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    explanation: '',
    imageUrl: '',
    signId: '',
    groupTarget: 'all' as string,
    categoryType: 'all' as 'all' | 'B' | 'C' | 'BC',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    includeInExam: true,
    ticketNumber: 1,
  });

  // Admin Exam Questions Builder & Manager Modal
  const [isExamQuestionsModalOpen, setIsExamQuestionsModalOpen] = useState(false);
  const [examQSearch, setExamQSearch] = useState('');
  const [examQCatFilter, setExamQCatFilter] = useState('all');
  const [examQTargetFilter, setExamQTargetFilter] = useState<'all' | 'B' | 'C'>('all');
  const [examQStatusFilter, setExamQStatusFilter] = useState<'all' | 'included' | 'excluded'>('all');
  const [examQTicketFilter, setExamQTicketFilter] = useState<number | 'all'>('all');

  // Keep local settings in sync with context
  useEffect(() => {
    setLocalExamSettings(examSettings);
  }, [examSettings]);

  // Keep a ref to activeSession for clean unmount/exit tracking
  const activeSessionRef = useRef<ActiveTestSession | null>(null);
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  // Tab switching violation monitor during active state exam
  useEffect(() => {
    if (!activeSession || !activeSession.isExamMode || activeSession.isFinished) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabViolationsCount((prev) => {
          const nextCount = prev + 1;
          addActivityLog({
            userId: currentUser?.id || 'guest',
            userName: currentUser?.name || 'Курсант',
            userGroup: currentUser?.group || groups[0]?.id || '',
            userRole: currentUser?.isAdmin ? 'admin' : 'student',
            actionType: 'exam_violation',
            message: `⚠️ Нарушение режима экзамена: уход с вкладки или сворачивание окна (попытка #${nextCount})`,
            details: `Вопрос ${(activeSessionRef.current?.currentIndex ?? 0) + 1} из ${activeSessionRef.current?.questionsList.length || 20}, прошло ${activeSessionRef.current?.elapsedSeconds || 0} сек.`,
          });
          return nextCount;
        });
        setShowTabViolationAlert(true);
      }
    };

    const handleWindowBlur = () => {
      if (document.hidden) return; // already handled by visibilitychange
      setTabViolationsCount((prev) => {
        const nextCount = prev + 1;
        addActivityLog({
          userId: currentUser?.id || 'guest',
          userName: currentUser?.name || 'Курсант',
          userGroup: currentUser?.group || groups[0]?.id || '',
          userRole: currentUser?.isAdmin ? 'admin' : 'student',
          actionType: 'exam_violation',
          message: `⚠️ Нарушение режима экзамена: переключение на другое окно (попытка #${nextCount})`,
          details: `Курсант переключил фокус с экзаменационного окна.`,
        });
        return nextCount;
      });
      setShowTabViolationAlert(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [activeSession?.isExamMode, activeSession?.isFinished, addActivityLog, currentUser, groups]);

  // Finish test callback
  const finishActiveTest = (sessionToFinish = activeSession) => {
    if (!sessionToFinish || sessionToFinish.isFinished) return;

    if (sessionToFinish.isExamMode) {
      setIsExamInProgress(false);
      if (examSettings.uniqueTicketPerStudent !== false) {
        const updatedOccupied = (examSettings.occupiedTickets || []).filter(
          (o) => o.studentId !== currentUser?.id
        );
        updateExamSettings({ occupiedTickets: updatedOccupied });
      }
    }

    let correctCount = 0;
    const wrongIds: string[] = [];

    sessionToFinish.questionsList.forEach((q, idx) => {
      if (sessionToFinish.userAnswers[idx] === q.correctAnswerIndex) {
        correctCount++;
      } else {
        wrongIds.push(q.id);
      }
    });

    const total = sessionToFinish.questionsList.length;
    const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passThreshold = sessionToFinish.isExamMode ? (examSettings.passingPercent || 90) : 85;
    const passed = scorePercent >= passThreshold;

    setActiveSession({
      ...sessionToFinish,
      isFinished: true,
    });

    // Record to test attempts
    const examTicketLabel = sessionToFinish.ticketNumber && sessionToFinish.ticketNumber !== 'random'
      ? `Билет №${sessionToFinish.ticketNumber}`
      : 'Случайный билет';

    recordTestAttempt({
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Ученик',
      userGroup: currentUser?.group || groups[0]?.id || '',
      categoryId: sessionToFinish.category ? sessionToFinish.category.id : 'exam_mixed',
      categoryTitle: sessionToFinish.category
        ? sessionToFinish.category.title
        : `Гос. экзамен • ${examTicketLabel} (${sessionToFinish.questionsList.length} вопр.)`,
      totalQuestions: total,
      correctAnswers: correctCount,
      scorePercent,
      passed,
      abandoned: false,
      answeredCount: Object.keys(sessionToFinish.userAnswers).length,
      timeSpentSeconds: sessionToFinish.elapsedSeconds,
      wrongQuestionIds: wrongIds,
      isExam: sessionToFinish.isExamMode,
      ticketNumber: sessionToFinish.isExamMode ? sessionToFinish.ticketNumber || 'random' : undefined,
    });

    if (passed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      playSuccessSound();
    } else {
      playFailSound();
    }
  };

  // Handle aborting/quitting an unfinished test
  const handleAbortTest = (sessionToAbort = activeSession) => {
    if (!sessionToAbort || sessionToAbort.isFinished) {
      setActiveSession(null);
      return;
    }

    let correctCount = 0;
    let answeredCount = 0;
    const wrongIds: string[] = [];

    sessionToAbort.questionsList.forEach((q, idx) => {
      const ans = sessionToAbort.userAnswers[idx];
      if (ans !== undefined) {
        answeredCount++;
        if (ans === q.correctAnswerIndex) {
          correctCount++;
        } else {
          wrongIds.push(q.id);
        }
      } else {
        wrongIds.push(q.id);
      }
    });

    const total = sessionToAbort.questionsList.length;
    const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const elapsed = Math.max(1, Math.floor((Date.now() - sessionToAbort.startTime) / 1000));

    recordTestAttempt({
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Ученик',
      userGroup: currentUser?.group || groups[0]?.id || '',
      categoryId: sessionToAbort.category ? sessionToAbort.category.id : 'exam_mixed',
      categoryTitle: sessionToAbort.category
        ? `${sessionToAbort.category.title} (Не закончен)`
        : `Государственный экзамен (${total} вопр.) (Не закончен)`,
      totalQuestions: total,
      correctAnswers: correctCount,
      scorePercent,
      passed: false,
      abandoned: true,
      answeredCount,
      timeSpentSeconds: elapsed,
      wrongQuestionIds: wrongIds,
      isExam: sessionToAbort.isExamMode,
    });

    if (sessionToAbort.isExamMode) {
      setIsExamInProgress(false);
      if (examSettings.uniqueTicketPerStudent !== false) {
        const updatedOccupied = (examSettings.occupiedTickets || []).filter(
          (o) => o.studentId !== currentUser?.id
        );
        updateExamSettings({ occupiedTickets: updatedOccupied });
      }
    }

    setActiveSession(null);
  };

  // Register beforeunload & unmount cleanup to record abandoned attempts if user closes tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeSessionRef.current && !activeSessionRef.current.isFinished) {
        handleAbortTest(activeSessionRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Timer tick for active test session & auto-finish on expiration
  useEffect(() => {
    if (!activeSession || activeSession.isFinished) return;
    const interval = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev || prev.isFinished) return prev;
        const newElapsed = Math.floor((Date.now() - prev.startTime) / 1000);

        // Check if time limit reached
        if (prev.timeLimitSeconds > 0 && newElapsed >= prev.timeLimitSeconds) {
          clearInterval(interval);
          finishActiveTest(prev);
          return { ...prev, elapsedSeconds: prev.timeLimitSeconds, isFinished: true };
        }

        return {
          ...prev,
          elapsedSeconds: newElapsed,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.isFinished, activeSession?.timeLimitSeconds]);

  // Questions filtered by group preference if selected
  const availableQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedGroupTab !== 'all' && q.groupTarget && q.groupTarget !== 'all' && q.groupTarget !== selectedGroupTab) {
        return false;
      }
      return true;
    });
  }, [questions, selectedGroupTab]);

  // Available ticket numbers from questions database / settings (1 to totalTickets, max 40)
  const availableTickets = useMemo(() => {
    const total = Math.min(40, Math.max(1, examSettings.totalTickets || 40));
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [examSettings.totalTickets]);

  // Current student account info for assigned ticket check
  const currentStudentAccount = useMemo(() => {
    return students.find(
      (s) => s.id === currentUser?.id || s.login === currentUser?.id || s.name === currentUser?.name
    );
  }, [students, currentUser]);

  const studentAssignedTicket = currentStudentAccount?.assignedExamTicket ?? currentUser?.assignedExamTicket;

  // Filtered list of questions in the Exam Questions Builder modal
  const filteredExamQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Ticket Filter
      if (examQTicketFilter !== 'all' && (q.ticketNumber || 1) !== examQTicketFilter) {
        return false;
      }
      // Text Search
      if (examQSearch.trim()) {
        const needle = examQSearch.toLowerCase();
        const textMatch = q.questionText.toLowerCase().includes(needle);
        const optMatch = q.options.some((o) => o.toLowerCase().includes(needle));
        if (!textMatch && !optMatch) return false;
      }
      // Category filter
      if (examQCatFilter !== 'all' && q.categoryId !== examQCatFilter) {
        return false;
      }
      // Target Filter (B / C / All)
      if (examQTargetFilter === 'B') {
        if (q.categoryType === 'C' || q.groupTarget === 'group3_c') return false;
      } else if (examQTargetFilter === 'C') {
        if (q.categoryType !== 'C' && q.groupTarget !== 'group3_c' && q.groupTarget !== 'all') return false;
      }
      // Status filter
      if (examQStatusFilter === 'included' && q.includeInExam === false) return false;
      if (examQStatusFilter === 'excluded' && q.includeInExam !== false) return false;

      return true;
    });
  }, [questions, examQTicketFilter, examQSearch, examQCatFilter, examQTargetFilter, examQStatusFilter]);

  // Start Test in Category
  const handleStartCategoryTest = (category: QuestionCategory) => {
    if (!canStudentTakeTests()) {
      alert('Преподаватель или администратор временно ограничил для вас доступ к решению тренировочных тестов и билетов. Обратитесь к администратору автошколы.');
      return;
    }

    let catQuestions = availableQuestions.filter((q) => q.categoryId === category.id);
    if (catQuestions.length === 0) {
      alert('В этой категории пока нет вопросов. Администратор может добавить их в банк вопросов.');
      return;
    }
    catQuestions = [...catQuestions].sort(() => 0.5 - Math.random());

    const limitSec = (examSettings.testTimeLimitMinutes || 0) * 60;

    setActiveSession({
      category,
      isExamMode: false,
      questionsList: catQuestions,
      currentIndex: 0,
      userAnswers: {},
      skippedIndices: [],
      isFinished: false,
      startTime: Date.now(),
      elapsedSeconds: 0,
      timeLimitSeconds: limitSec,
    });
  };

  // Trigger Exam Start (Opens ticket selection or goes straight to exam if assigned by teacher)
  const handleStartExam = () => {
    if (!isAdmin) {
      if (!canStudentTakeExam()) {
        const student = students.find((s) => s.id === currentUser?.id || s.name === currentUser?.name);
        const used = student?.examAttemptsUsed ?? currentUser?.examAttemptsUsed ?? 0;
        const allowed = student?.examAttemptsAllowed ?? currentUser?.examAttemptsAllowed ?? 1;
        if (used >= allowed) {
          alert(`Все разрешённые попытки сдачи государственного экзамена (${used} из ${allowed}) использованы. Доступ к экзамену закрыт. Для назначения новой попытки обратитесь к администратору автошколы.`);
        } else {
          alert('Доступ к государственному экзамену закрыт. Администратор автошколы должен предоставить вам допуск в настройках курсантов.');
        }
        return;
      }
    }

    const examCandidates = availableQuestions.filter((q) => q.includeInExam !== false);
    if (examCandidates.length === 0) {
      alert('В пуле государственного экзамена пока нет активных вопросов. Администратор может включить вопросы в экзамен в настройках экзамена.');
      return;
    }

    // If teacher assigned a specific ticket to this student, use it directly
    if (studentAssignedTicket && typeof studentAssignedTicket === 'number') {
      setSelectedExamTicket(studentAssignedTicket);
    } else {
      setSelectedExamTicket(1);
    }
    setExamAgreementChecked(false);
    setIsExamWarningOpen(true);
  };

  // Confirm and Start Exam Mode with selected Ticket and anti-cheat lock
  const handleConfirmStartExam = (ticketToTakeParam?: number | 'random') => {
    const ticketToTake =
      typeof ticketToTakeParam === 'number' || ticketToTakeParam === 'random'
        ? ticketToTakeParam
        : selectedExamTicket;

    const examCandidates = availableQuestions.filter((q) => q.includeInExam !== false);
    if (examCandidates.length === 0) {
      alert('Нет доступных вопросов в пуле экзамена.');
      return;
    }

    // Verify ticket exclusivity if enabled
    if (ticketToTake !== 'random' && examSettings.uniqueTicketPerStudent !== false) {
      const alreadyOccupied = (examSettings.occupiedTickets || []).find(
        (o) => o.ticketNumber === ticketToTake && o.studentId !== currentUser?.id
      );
      if (alreadyOccupied) {
        alert(
          `Билет №${ticketToTake} уже выбран курсантом ${alreadyOccupied.studentName}. Выберите другой свободный билет.`
        );
        setIsExamWarningOpen(false);
        setIsTicketSelectModalOpen(true);
        return;
      }

      // Mark ticket as occupied by current student
      const updatedOccupied = [
        ...(examSettings.occupiedTickets || []).filter((o) => o.studentId !== currentUser?.id),
        {
          ticketNumber: ticketToTake,
          studentId: currentUser?.id || 'guest',
          studentName: currentUser?.name || 'Курсант',
          timestamp: Date.now(),
        },
      ];
      updateExamSettings({ occupiedTickets: updatedOccupied });
    }

    let finalQuestions: Question[] = [];
    if (ticketToTake !== 'random') {
      const ticketQuestions = examCandidates.filter((q) => (q.ticketNumber || 1) === ticketToTake);
      if (ticketQuestions.length > 0) {
        finalQuestions = [...ticketQuestions];
      } else {
        // Fallback if specific ticket has no questions
        const qCount = Math.min(examSettings.questionCount || 20, examCandidates.length);
        finalQuestions = [...examCandidates].sort(() => 0.5 - Math.random()).slice(0, qCount);
      }
    } else {
      const qCount = Math.min(examSettings.questionCount || 20, examCandidates.length);
      finalQuestions = [...examCandidates].sort(() => 0.5 - Math.random()).slice(0, qCount);
    }

    const limitSec = (examSettings.timeLimitMinutes || 20) * 60;
    const ticketLabel = ticketToTake === 'random' ? 'Случайный билет' : `Билет №${ticketToTake}`;

    setIsExamWarningOpen(false);
    setIsExamInProgress(true);
    setTabViolationsCount(0);
    setShowTabViolationAlert(false);

    // Try requesting fullscreen to minimize distractions if supported
    try {
      if (document.documentElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Ignored if user browser blocks programmatic fullscreen
        });
      }
    } catch {
      // Ignored
    }

    // Log exam start to activity log
    addActivityLog({
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Курсант',
      userGroup: currentUser?.group || groups[0]?.id || '',
      userRole: currentUser?.isAdmin ? 'admin' : 'student',
      actionType: 'exam_started',
      message: `Начал(а) сдачу государственного экзамена ДОСААФ (${ticketLabel})`,
      details: `${ticketLabel} (${finalQuestions.length} вопр.). Лимит: ${Math.round(limitSec / 60)} мин. Включен строгий режим анти-списывания.`,
    });

    setActiveSession({
      category: null,
      isExamMode: true,
      ticketNumber: ticketToTake,
      questionsList: finalQuestions,
      currentIndex: 0,
      userAnswers: {},
      skippedIndices: [],
      isFinished: false,
      startTime: Date.now(),
      elapsedSeconds: 0,
      timeLimitSeconds: limitSec,
    });
  };

  // Select option in active test
  const handleSelectOption = (optionIndex: number) => {
    if (!activeSession || activeSession.isFinished) return;
    if (activeSession.userAnswers[activeSession.currentIndex] !== undefined) return;

    const nextAnswers = {
      ...activeSession.userAnswers,
      [activeSession.currentIndex]: optionIndex,
    };

    setActiveSession({
      ...activeSession,
      userAnswers: nextAnswers,
    });
  };

  // Skip question to return to it later
  const handleSkipQuestion = () => {
    if (!activeSession || activeSession.isFinished) return;
    const currentIdx = activeSession.currentIndex;
    const total = activeSession.questionsList.length;

    // Add current index to skippedIndices list
    const nextSkipped = Array.from(new Set([...(activeSession.skippedIndices || []), currentIdx]));

    // Find next unanswered question:
    // 1) look ahead: currentIdx + 1 .. total - 1
    let nextIdx = -1;
    for (let i = currentIdx + 1; i < total; i++) {
      if (activeSession.userAnswers[i] === undefined) {
        nextIdx = i;
        break;
      }
    }
    // 2) if not found ahead, loop from start: 0 .. currentIdx - 1
    if (nextIdx === -1) {
      for (let i = 0; i < currentIdx; i++) {
        if (activeSession.userAnswers[i] === undefined) {
          nextIdx = i;
          break;
        }
      }
    }

    if (nextIdx === -1) {
      nextIdx = currentIdx < total - 1 ? currentIdx + 1 : currentIdx;
    }

    setActiveSession({
      ...activeSession,
      skippedIndices: nextSkipped,
      currentIndex: nextIdx,
    });
  };

  // Jump to next remaining skipped question
  const handleJumpToNextSkipped = () => {
    if (!activeSession) return;
    const skippedUnanswered = (activeSession.skippedIndices || []).filter(
      (idx) => activeSession.userAnswers[idx] === undefined
    );
    if (skippedUnanswered.length > 0) {
      const nextSkipped = skippedUnanswered.find((idx) => idx > activeSession.currentIndex) ?? skippedUnanswered[0];
      setActiveSession({
        ...activeSession,
        currentIndex: nextSkipped,
      });
    }
  };

  // Move to next question or finish with skipped check
  const handleNextOrFinish = () => {
    if (!activeSession) return;
    const total = activeSession.questionsList.length;

    if (activeSession.currentIndex < total - 1) {
      setActiveSession({
        ...activeSession,
        currentIndex: activeSession.currentIndex + 1,
      });
    } else {
      // Check for remaining unanswered / skipped questions
      const unansweredIndices: number[] = [];
      for (let i = 0; i < total; i++) {
        if (activeSession.userAnswers[i] === undefined) {
          unansweredIndices.push(i);
        }
      }

      if (unansweredIndices.length > 0) {
        const confirmFinish = confirm(
          `Внимание! У вас осталось ${unansweredIndices.length} неотвеченных/пропущенных вопросов (№ ${unansweredIndices
            .map((i) => i + 1)
            .join(', ')}).\n\nНажмите «Отмена», чтобы вернуться к первому пропущенному вопросу, или «ОК», чтобы завершить тест прямо сейчас.`
        );
        if (!confirmFinish) {
          setActiveSession({
            ...activeSession,
            currentIndex: unansweredIndices[0],
          });
          return;
        }
      }

      finishActiveTest(activeSession);
    }
  };

  const handleSaveExamSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateExamSettings(localExamSettings);
    setIsExamSettingsOpen(false);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // ACTIVE TEST SESSION SCREEN
  // -------------------------------------------------------------
  if (activeSession) {
    const currentQ = activeSession.questionsList[activeSession.currentIndex];
    const totalQ = activeSession.questionsList.length;
    const answeredCount = Object.keys(activeSession.userAnswers).length;
    const selectedOption = activeSession.userAnswers[activeSession.currentIndex];
    const hasAnsweredCurrent = selectedOption !== undefined;

    // Exam settings flags
    const isExam = activeSession.isExamMode;
    const showImmediate = isExam ? examSettings.showImmediateFeedback === true : true;
    const allowNav = isExam ? examSettings.allowQuestionNavigation === true : true;

    // Remaining time calculation
    const isTimerActive = activeSession.timeLimitSeconds > 0;
    const remainingSeconds = Math.max(0, activeSession.timeLimitSeconds - activeSession.elapsedSeconds);
    const isTimeUrgent = isTimerActive && remainingSeconds <= 120;

    // Associated road sign if present
    const associatedSign = currentQ?.signId
      ? signs.find((s) => s.id === currentQ.signId)
      : null;

    if (activeSession.isFinished) {
      // Finished Summary
      let correct = 0;
      activeSession.questionsList.forEach((q, i) => {
        if (activeSession.userAnswers[i] === q.correctAnswerIndex) correct++;
      });
      const score = Math.round((correct / totalQ) * 100);
      const passTarget = activeSession.isExamMode ? (examSettings.passingPercent || 90) : 85;
      const isPass = score >= passTarget;

      return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 text-center space-y-5 shadow-xs">
            <div
              className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center ${
                isPass ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
              }`}
            >
              {isPass ? <Award className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {activeSession.isExamMode ? 'Результаты комплексного экзамена' : 'Тест завершен'}
              </span>
              <h2 className="text-2xl font-black text-neutral-900">
                {isPass ? 'Тест успешно сдан!' : 'Экзамен не сдан. Требуется повторение'}
              </h2>
              <p className="text-xs text-neutral-500">
                Курсант: <strong className="text-neutral-800">{currentUser?.name || 'Курсант ДОСААФ'}</strong> •{' '}
                <span className="font-semibold text-neutral-700">{getGroupName(currentUser?.group)}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-150">
                <span className="text-[11px] text-neutral-500 font-medium block">Результат</span>
                <span
                  className={`text-2xl font-black font-mono mt-0.5 block ${
                    isPass ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {score}%
                </span>
              </div>
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-150">
                <span className="text-[11px] text-neutral-500 font-medium block">Правильно</span>
                <span className="text-2xl font-black font-mono text-neutral-900 mt-0.5 block">
                  {correct} / {totalQ}
                </span>
              </div>
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-150">
                <span className="text-[11px] text-neutral-500 font-medium block">Время</span>
                <span className="text-2xl font-black font-mono text-neutral-900 mt-0.5 block">
                  {formatTimer(activeSession.elapsedSeconds)}
                </span>
              </div>
            </div>

            {activeSession.isExamMode && tabViolationsCount > 0 && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 text-xs text-amber-950 flex items-center justify-center gap-2 max-w-md mx-auto font-medium">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Зафиксировано нарушений режима сдачи (уход с вкладки): <strong>{tabViolationsCount}</strong>. События переданы в протокол автошколы.
                </span>
              </div>
            )}

            <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
              {isPass
                ? 'Отличный результат! Ответы внесены в общую ведомость успеваемости преподавателя.'
                : `Для сдачи необходимо набрать не менее ${passTarget}%. Рекомендуем повторить правила и попробовать снова.`}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (activeSession.isExamMode) {
                    handleStartExam();
                  } else if (activeSession.category) {
                    handleStartCategoryTest(activeSession.category);
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Пройти заново</span>
              </button>
              <button
                onClick={() => setActiveSession(null)}
                className="w-full sm:w-auto px-5 py-2.5 border border-neutral-200 text-neutral-700 hover:bg-neutral-100 rounded-xl text-xs font-bold transition-colors"
              >
                Вернуться к списку тестов
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Active Question Screen
    return (
      <div
        className="max-w-3xl mx-auto space-y-4 exam-anti-copy test-anti-copy select-none"
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Anti-cheat Alert Modal for Tab Switching */}
        {showTabViolationAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 border-2 border-rose-500 shadow-2xl">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                  Система прокторинга ДОСААФ
                </span>
                <h3 className="text-lg font-black text-rose-950">
                  Зафиксирован уход с вкладки экзамена!
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Вы покинули окно государственного экзамена (попытка #{tabViolationsCount}).
                  Данное событие зарегистрировано в журнале нарушений с указанием вашего аккаунта.
                </p>
              </div>

              <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 text-left font-medium space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  Предупреждение о недопустимости списывания:
                </p>
                <p className="text-[11px] leading-relaxed text-rose-800">
                  Переключение на поисковые системы, справочники и другие приложения во время экзамена строго запрещено. Не покидайте страницу до завершения всех вопросов.
                </p>
              </div>

              <button
                onClick={() => setShowTabViolationAlert(false)}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Вернуться к решению билета
              </button>
            </div>
          </div>
        )}

        {/* Anti-cheat Status Bar for Exam Mode */}
        {activeSession.isExamMode && (
          <div className="bg-slate-900 text-white rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs shadow-xs border border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-[11px] sm:text-xs">
                Режим строгого контроля ДОСААФ: копирование текста и уход с вкладки заблокированы
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {tabViolationsCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-mono font-bold text-[11px] animate-pulse flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Нарушений: {tabViolationsCount}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Нарушений нет
                </span>
              )}
            </div>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Прервать прохождение теста? В ведомости преподавателя будет зафиксировано, что вы не закончили тест.')) {
                  handleAbortTest(activeSession);
                }
              }}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
              title="Выйти"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                {activeSession.isExamMode
                  ? `Гос. экзамен ДОСААФ • ${
                      activeSession.ticketNumber && activeSession.ticketNumber !== 'random'
                        ? `Билет №${activeSession.ticketNumber}`
                        : 'Случайный билет'
                    }`
                  : activeSession.category?.title}
              </span>
              <span className="text-xs font-bold text-neutral-900">
                Вопрос {activeSession.currentIndex + 1} из {totalQ}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                isTimeUrgent
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isTimerActive ? formatTimer(remainingSeconds) : formatTimer(activeSession.elapsedSeconds)}
              </span>
              {isTimerActive && <span className="text-[10px] font-normal font-sans">осталось</span>}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${((activeSession.currentIndex + 1) / totalQ) * 100}%` }}
          />
        </div>

        {/* Interactive Question Numbers Palette */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-neutral-600 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
              <span>Вопросы билета ({totalQ}):</span>
            </span>
            <div className="flex items-center gap-2">
              {activeSession.skippedIndices && activeSession.skippedIndices.some((idx) => activeSession.userAnswers[idx] === undefined) && (
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                  <SkipForward className="w-3 h-3" />
                  Пропущено: {activeSession.skippedIndices.filter((idx) => activeSession.userAnswers[idx] === undefined).length}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeSession.questionsList.map((q, idx) => {
              const isCurrent = idx === activeSession.currentIndex;
              const isAnswered = activeSession.userAnswers[idx] !== undefined;
              const isCorrect = isAnswered && activeSession.userAnswers[idx] === q.correctAnswerIndex;
              const isSkipped = (activeSession.skippedIndices || []).includes(idx) && !isAnswered;

              let pillClass = 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200';
              if (isCurrent) {
                pillClass = 'ring-2 ring-blue-600 bg-blue-600 text-white font-black shadow-xs';
              } else if (isAnswered) {
                if (showImmediate) {
                  pillClass = isCorrect
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                    : 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
                } else {
                  pillClass = 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
                }
              } else if (isSkipped) {
                pillClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
              }

              return (
                <button
                  key={idx}
                  onClick={
                    allowNav
                      ? () => {
                          setActiveSession({
                            ...activeSession,
                            currentIndex: idx,
                          });
                        }
                      : undefined
                  }
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border text-xs flex items-center justify-center transition-all relative ${pillClass} ${
                    allowNav ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  title={`Вопрос №${idx + 1}${
                    isSkipped
                      ? ' (пропущен)'
                      : isAnswered
                      ? showImmediate
                        ? isCorrect
                          ? ' (верно)'
                          : ' (ошибка)'
                        : ' (ответ дан)'
                      : ''
                  }${!allowNav ? ' • переключение отключено' : ''}`}
                >
                  <span>{idx + 1}</span>
                  {isSkipped && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-1 ring-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card with Anti-Copy & Anti-Selection */}
        <div
          className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-7 shadow-xs space-y-6 exam-anti-copy select-none"
          onContextMenu={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
        >
          <div className="space-y-4">
            {/* Associated Sign or Image */}
            {associatedSign && (
              <div className="flex items-center justify-center p-3 bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden">
                <div className="w-20 h-20 max-w-[80px] max-h-[80px] shrink-0 flex items-center justify-center overflow-hidden">
                  <RoadSignSvg sign={associatedSign} size={72} />
                </div>
              </div>
            )}

            {currentQ.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 max-h-64 flex items-center justify-center p-2">
                <img
                  src={currentQ.imageUrl}
                  alt="Иллюстрация к вопросу"
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className="max-h-60 max-w-full w-auto object-contain rounded-lg shrink-0 pointer-events-none select-none"
                />
              </div>
            )}

            <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
              {currentQ.questionText}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctAnswerIndex;

              let btnStyle = 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-800';

              if (hasAnsweredCurrent) {
                if (showImmediate) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'border-rose-500 bg-rose-50/70 text-rose-950';
                  } else {
                    btnStyle = 'border-neutral-200 bg-neutral-50/50 text-neutral-400 opacity-60';
                  }
                } else {
                  if (isSelected) {
                    btnStyle = 'border-blue-600 bg-blue-50/80 text-blue-950 font-bold ring-2 ring-blue-500/20';
                  } else {
                    btnStyle = 'border-neutral-200 bg-neutral-50/50 text-neutral-400 opacity-60';
                  }
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={hasAnsweredCurrent}
                  className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{option}</span>
                  </div>

                  {hasAnsweredCurrent && showImmediate && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {hasAnsweredCurrent && showImmediate && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  {hasAnsweredCurrent && !showImmediate && isSelected && (
                    <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold shrink-0">
                      Ответ принят
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation if answered and immediate feedback is enabled */}
          {hasAnsweredCurrent && showImmediate && currentQ.explanation && (
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-blue-950 space-y-1.5 animate-in fade-in duration-200">
              <span className="font-bold flex items-center gap-1.5 text-blue-900">
                <HelpCircle className="w-4 h-4 text-blue-700" />
                Пояснение правил ПДД:
              </span>
              <p className="leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}

          {/* Action controls before answering: Previous + Skip + Next */}
          {!hasAnsweredCurrent && allowNav && (
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-neutral-100">
              <button
                type="button"
                disabled={activeSession.currentIndex === 0}
                onClick={() => {
                  if (activeSession.currentIndex > 0) {
                    setActiveSession({
                      ...activeSession,
                      currentIndex: activeSession.currentIndex - 1,
                    });
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  activeSession.currentIndex === 0
                    ? 'text-neutral-300 cursor-not-allowed'
                    : 'text-neutral-600 hover:bg-neutral-100 cursor-pointer'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Назад</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSkipQuestion}
                  className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Пропустить вопрос и вернуться к нему позже"
                >
                  <SkipForward className="w-4 h-4 text-amber-700" />
                  <span>Пропустить вопрос</span>
                </button>

                {activeSession.currentIndex < totalQ - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSession({
                        ...activeSession,
                        currentIndex: activeSession.currentIndex + 1,
                      });
                    }}
                    className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Вперёд</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
          {!hasAnsweredCurrent && !allowNav && (
            <div className="pt-2 flex items-center justify-between border-t border-neutral-100 text-xs text-neutral-500">
              <span className="text-[11px]">Выберите вариант ответа для перехода дальше</span>
              <span className="text-[10px] bg-neutral-100 text-neutral-600 font-semibold px-2 py-0.5 rounded-md">
                Последовательный экзамен
              </span>
            </div>
          )}

          {/* Action controls after answering */}
          {hasAnsweredCurrent && (
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-neutral-100">
              {allowNav ? (
                <button
                  type="button"
                  disabled={activeSession.currentIndex === 0}
                  onClick={() => {
                    if (activeSession.currentIndex > 0) {
                      setActiveSession({
                        ...activeSession,
                        currentIndex: activeSession.currentIndex - 1,
                      });
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    activeSession.currentIndex === 0
                      ? 'text-neutral-300 cursor-not-allowed'
                      : 'text-neutral-600 hover:bg-neutral-100 cursor-pointer'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Назад</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {allowNav &&
                  activeSession.skippedIndices &&
                  activeSession.skippedIndices.some(
                    (idx) => activeSession.userAnswers[idx] === undefined
                  ) && (
                    <button
                      type="button"
                      onClick={handleJumpToNextSkipped}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Перейти к следующему пропущенному вопросу"
                    >
                      <SkipForward className="w-3.5 h-3.5 text-amber-700" />
                      <span>
                        К пропущенным (
                        {
                          activeSession.skippedIndices.filter(
                            (idx) => activeSession.userAnswers[idx] === undefined
                          ).length
                        }
                        )
                      </span>
                    </button>
                  )}

                <button
                  onClick={handleNextOrFinish}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <span>
                    {activeSession.currentIndex < totalQ - 1 ? 'Следующий вопрос' : 'Завершить экзамен'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN TESTS & EXAM OVERVIEW SCREEN
  // -------------------------------------------------------------
  const orderedCategories = getOrderedItems('tests_categories_grid', categories);

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <EditableDesignBlock
        id="tests_hero_banner"
        label="Шапка раздела тестов"
        defaultTitle="Экзаменационные билеты и тесты"
        defaultSubtitle="Решайте тематические билеты или сдавайте комплексный экзамен по правилам дорожного движения"
        defaultBadge="Тестирование знаний ПДД 2026"
        defaultClasses={{
          bg: 'bg-white',
          border: 'border border-neutral-200',
          radius: 'rounded-3xl',
          padding: 'p-5 sm:p-7',
          shadow: 'shadow-xs',
        }}
      >
        {({ title, subtitle, badge }) => (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
                  <FileQuestion className="w-3.5 h-3.5" />
                  <span>{badge}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900">
                  {title}
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  {subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {isAdmin && (
                  <button
                    onClick={() => setIsExamSettingsOpen(true)}
                    className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Настройки экзамена и таймера</span>
                  </button>
                )}

                {/* Sub-tab switcher */}
                <div className="flex items-center p-1 bg-neutral-100 rounded-xl border border-neutral-200">
                  <button
                    onClick={() => setActiveBankTab('quizzes')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeBankTab === 'quizzes'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    Тестирование
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setActiveBankTab('manage_questions')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeBankTab === 'manage_questions'
                          ? 'bg-white text-neutral-900 shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      Банк вопросов ({questions.length})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Student details from database */}
            {currentUser && (
              <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center gap-2 text-xs text-neutral-600">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>
                  Курсант: <strong className="text-neutral-900 font-bold">{currentUser.name}</strong>
                </span>
                <span>•</span>
                <span className="font-semibold text-neutral-800">
                  {getGroupName(currentUser.group || 'group7_mkpp')}
                </span>
                {currentUser.isAdmin && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Администратор
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </EditableDesignBlock>

      {activeBankTab === 'quizzes' && (
        <div className="space-y-6">
          {/* SPECIAL EXAM CARD */}
          <EditableDesignBlock
            id="tests_exam_card"
            containerId="tests_overview_sections"
            label="Карточка экзамена ГИБДД"
            draggable={true}
            defaultTitle="Государственный теоретический экзамен"
            defaultSubtitle="Вопросы выбираются со всех тем ПДД в случайном порядке. Проверка готовности к сдаче в ГИБДД."
            defaultClasses={{
              bg: 'bg-gradient-to-br from-blue-900 to-indigo-950 text-white',
              border: 'border-blue-800',
              radius: 'rounded-3xl',
              padding: 'p-6 sm:p-7',
              shadow: 'shadow-xs',
            }}
          >
            {({ title, subtitle }) => {
              const currentStudent = students.find((s) => s.id === currentUser?.id || s.name === currentUser?.name);
              const attemptsUsed = currentStudent?.examAttemptsUsed ?? currentUser?.examAttemptsUsed ?? 0;
              const attemptsAllowed = currentStudent?.examAttemptsAllowed ?? currentUser?.examAttemptsAllowed ?? 1;
              const canTake = canStudentTakeExam();

              return (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-neutral-950">
                        Официальный формат ГИБДД
                      </span>

                      {!isAdmin ? (
                        canTake ? (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Допуск к экзамену открыт (Попытка {attemptsUsed + 1} из {attemptsAllowed})
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-rose-400" />
                            {attemptsUsed >= attemptsAllowed
                              ? `Попытки исчерпаны (${attemptsUsed} из ${attemptsAllowed}) — доступ закрыт`
                              : 'Допуск к экзамену закрыт администратором'}
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-400" />
                          Режим управления экзаменом (допуски курсантов)
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black">
                      {title}
                    </h3>

                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {subtitle}
                      {examSettings.timeLimitMinutes > 0 &&
                        ` Ограничение времени: ${examSettings.timeLimitMinutes} минут.`}{' '}
                      Количество вопросов: {examSettings.questionCount || 20}.
                    </p>

                    {isAdmin && (
                      <div className="pt-2 flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setExamAdminTab('tickets');
                            setIsExamAdminModalOpen(true);
                          }}
                          className="px-4 py-2 rounded-2xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                          title="Редактирование билетов, банк вопросов и все параметры государственного экзамена"
                        >
                          <Settings className="w-4 h-4 text-neutral-950" />
                          <span>Настройки и билеты государственного экзамена</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col items-start md:items-end gap-3">
                    {/* Ticket Status Indicator */}
                    {studentAssignedTicket && typeof studentAssignedTicket === 'number' ? (
                      <div className="p-3 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-200 text-xs flex items-center gap-2.5 max-w-sm">
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <span className="font-bold text-white block">Вам назначен Билет №{studentAssignedTicket}</span>
                          <span className="text-[11px] text-neutral-300">
                            Преподаватель закрепил за вами персональный экзаменационный билет
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 px-3 rounded-xl bg-white/10 border border-white/15 text-neutral-300 text-xs flex items-center gap-2">
                        <Ticket className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-[11px]">
                          Выбор билета (1—{examSettings.totalTickets || 40}) откроется после нажатия «Начать экзамен»
                        </span>
                      </div>
                    )}

                    {canTake || isAdmin ? (
                      <button
                        onClick={handleStartExam}
                        className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-2xl text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-neutral-950" />
                        <span>Начать государственный экзамен</span>
                      </button>
                    ) : (
                      <div className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-700 text-xs text-neutral-300 flex items-center gap-2 max-w-xs shadow-md">
                        <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                        <span>
                          {attemptsUsed >= attemptsAllowed
                            ? `Все попытки сдачи экзамена использованы (${attemptsUsed} из ${attemptsAllowed}). Доступ закрыт до решения администратора.`
                            : 'Администратор автошколы еще не предоставил вам персональный допуск к сдаче государственного экзамена.'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
          </EditableDesignBlock>

          {/* THEMATIC CATEGORY CARDS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                Тематические билеты по разделам ПДД
              </h3>
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingCatId(null);
                    setCatFormData({ title: '', description: '', iconName: 'HelpCircle' });
                    setIsCatModalOpen(true);
                  }}
                  className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Создать категорию</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orderedCategories.map((cat) => {
                const catQuestions = availableQuestions.filter((q) => q.categoryId === cat.id);

                return (
                  <EditableDesignBlock
                    key={cat.id}
                    id={`test_cat_${cat.id}`}
                    sortItemId={cat.id}
                    containerId="tests_categories_grid"
                    label={`Билет: ${cat.title}`}
                    draggable={true}
                    allSiblingIds={categories.map((c) => c.id)}
                    defaultTitle={cat.title}
                    defaultSubtitle={cat.description}
                    defaultClasses={{
                      bg: 'bg-white',
                      border: 'border border-neutral-200',
                      radius: 'rounded-3xl',
                      padding: 'p-5',
                      shadow: 'shadow-xs',
                    }}
                    className="flex flex-col justify-between space-y-4"
                  >
                    {({ title, subtitle }) => (
                      <>
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                              <Layers className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                              {catQuestions.length} вопросов
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-neutral-900 leading-snug">{title}</h4>
                          <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                            {subtitle}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                          <button
                            onClick={() => handleStartCategoryTest(cat)}
                            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Решать билет</span>
                          </button>

                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingCatId(cat.id);
                                  setCatFormData({
                                    title: cat.title,
                                    description: cat.description,
                                    iconName: cat.iconName,
                                  });
                                  setIsCatModalOpen(true);
                                }}
                                className="p-1.5 text-neutral-400 hover:text-amber-600 rounded-lg hover:bg-neutral-100"
                                title="Редактировать категорию"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Удалить категорию "${cat.title}" и все вопросы в ней?`)) {
                                    deleteCategory(cat.id);
                                  }
                                }}
                                className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                title="Удалить категорию"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </EditableDesignBlock>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MANAGE QUESTIONS BANK TAB (Admin only) */}
      {activeBankTab === 'manage_questions' && isAdmin && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-neutral-400" />
                <select
                  value={selectedCatFilter}
                  onChange={(e) => setSelectedCatFilter(e.target.value)}
                  className="px-3 py-1.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs"
                >
                  <option value="all">Все категории ({questions.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exam Pool filter */}
              <div className="flex items-center p-1 bg-neutral-100 rounded-xl border border-neutral-200 text-xs">
                <button
                  type="button"
                  onClick={() => setExamInclusionFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    examInclusionFilter === 'all'
                      ? 'bg-white text-neutral-900 shadow-xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Все ({questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setExamInclusionFilter('included')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                    examInclusionFilter === 'included'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-neutral-500 hover:text-emerald-700'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  В экзамене ({questions.filter((q) => q.includeInExam !== false).length})
                </button>
                <button
                  type="button"
                  onClick={() => setExamInclusionFilter('excluded')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                    examInclusionFilter === 'excluded'
                      ? 'bg-neutral-800 text-white shadow-xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Minus className="w-3 h-3" />
                  Исключены ({questions.filter((q) => q.includeInExam === false).length})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Batch pool controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const candidateIds = questions
                      .filter((q) => selectedCatFilter === 'all' || q.categoryId === selectedCatFilter)
                      .map((q) => q.id);
                    batchSetQuestionsExamInclusion(candidateIds, true);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Включить все показанные вопросы в экзаменационный билет"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Включить все в экзамен</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const candidateIds = questions
                      .filter((q) => selectedCatFilter === 'all' || q.categoryId === selectedCatFilter)
                      .map((q) => q.id);
                    batchSetQuestionsExamInclusion(candidateIds, false);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Исключить все показанные вопросы из экзаменационного пула"
                >
                  <Minus className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Исключить все</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setEditingQuestionId(null);
                  setQFormData({
                    categoryId: categories[0]?.id || '',
                    questionText: '',
                    options: ['', '', '', ''],
                    correctAnswerIndex: 0,
                    explanation: '',
                    imageUrl: '',
                    signId: '',
                    groupTarget: 'all',
                    difficulty: 'medium',
                    includeInExam: true,
                  });
                  setIsQuestionModalOpen(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors self-start lg:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Создать вопрос</span>
              </button>
            </div>
          </div>

          {/* List of questions */}
          <div className="space-y-3">
            {questions
              .filter((q) => selectedCatFilter === 'all' || q.categoryId === selectedCatFilter)
              .filter((q) => {
                if (examInclusionFilter === 'included') return q.includeInExam !== false;
                if (examInclusionFilter === 'excluded') return q.includeInExam === false;
                return true;
              })
              .map((q) => {
                const cat = categories.find((c) => c.id === q.categoryId);
                const sign = q.signId ? signs.find((s) => s.id === q.signId) : null;
                const isIncludedInExam = q.includeInExam !== false;

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs hover:border-neutral-300 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      {sign && (
                        <div className="w-14 h-14 max-w-[56px] max-h-[56px] bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-center shrink-0 overflow-hidden p-1">
                          <RoadSignSvg sign={sign} size={42} />
                        </div>
                      )}
                      {q.imageUrl && !sign && (
                        <div className="w-14 h-14 bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden shrink-0">
                          <img
                            src={q.imageUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            {cat?.title || 'Без категории'}
                          </span>
                          {q.groupTarget && q.groupTarget !== 'all' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                              {getGroupName(q.groupTarget)}
                            </span>
                          )}

                          {/* Exam pool tag */}
                          {isIncludedInExam ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              В пуле экзамена
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200 flex items-center gap-1">
                              <Minus className="w-3 h-3 text-neutral-400" />
                              Исключен из экзамена
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                          {q.questionText}
                        </h4>
                        <span className="text-[11px] text-emerald-700 font-medium block">
                          Правильный ответ: {q.options[q.correctAnswerIndex]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                      {/* Toggle exam pool button */}
                      <button
                        type="button"
                        onClick={() => toggleQuestionExamInclusion(q.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                          isIncludedInExam
                            ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={isIncludedInExam ? 'Исключить этот вопрос из экзамена' : 'Включить этот вопрос в экзамен'}
                      >
                        {isIncludedInExam ? (
                          <>
                            <Minus className="w-3 h-3" />
                            <span>Исключить из экзамена</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3" />
                            <span>Включить в экзамен</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setEditingQuestionId(q.id);
                          setQFormData({
                            categoryId: q.categoryId,
                            questionText: q.questionText,
                            options: [...q.options],
                            correctAnswerIndex: q.correctAnswerIndex,
                            explanation: q.explanation,
                            imageUrl: q.imageUrl || '',
                            signId: q.signId || '',
                            groupTarget: q.groupTarget || 'all',
                            difficulty: q.difficulty || 'medium',
                            includeInExam: q.includeInExam !== false,
                          });
                          setIsQuestionModalOpen(true);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-amber-600 rounded-lg hover:bg-neutral-100"
                        title="Редактировать"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Удалить этот вопрос?')) {
                            deleteQuestion(q.id);
                          }
                        }}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ADMIN EXAM & TIMER SETTINGS MODAL */}
      {isExamSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsExamSettingsOpen(false)}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Настройки государственного экзамена
                </h3>
                <span className="text-xs text-neutral-500 font-medium">
                  Регламент, билеты и параметры сдачи курсантов
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveExamSettings} className="space-y-4 text-xs">
              {/* Exam Access switch */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800">Общий доступ к экзамену</span>
                  <input
                    type="checkbox"
                    checked={localExamSettings.isOpen}
                    onChange={(e) =>
                      setLocalExamSettings({ ...localExamSettings, isOpen: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  {localExamSettings.isOpen
                    ? 'Экзамен ОТКРЫТ для курсантов с персональным допуском'
                    : 'Экзамен ЗАКРЫТ (курсанты увидят уведомление о закрытии экзамена)'}
                </p>
              </div>

              {/* Number of Tickets (max 40) */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-neutral-800 block">
                      Количество билетов (максимум 40)
                    </span>
                    <span className="text-[11px] text-neutral-500 block">
                      Администратор может добавлять или убирать их количество
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={localExamSettings.totalTickets ?? 40}
                      onChange={(e) => {
                        const val = Math.min(40, Math.max(1, Number(e.target.value) || 1));
                        setLocalExamSettings({ ...localExamSettings, totalTickets: val });
                      }}
                      className="w-20 px-2.5 py-1.5 border border-neutral-300 rounded-xl font-mono text-sm font-black text-center bg-white"
                    />
                    <span className="text-neutral-500 text-[11px] font-bold">шт.</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-[11px] text-neutral-400 mr-1">Быстрый выбор:</span>
                  {[10, 20, 30, 40].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setLocalExamSettings({ ...localExamSettings, totalTickets: count })}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        (localExamSettings.totalTickets ?? 40) === count
                          ? 'bg-neutral-900 text-white'
                          : 'bg-white border text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Immediate Feedback Toggle */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800">
                    Показывать правильные и неправильные ответы во время экзамена
                  </span>
                  <input
                    type="checkbox"
                    checked={localExamSettings.showImmediateFeedback === true}
                    onChange={(e) =>
                      setLocalExamSettings({
                        ...localExamSettings,
                        showImmediateFeedback: e.target.checked,
                      })
                    }
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  {localExamSettings.showImmediateFeedback === true
                    ? 'ВКЛЮЧЕНО: курсант сразу видит правильность ответа и подсветку вариантов.'
                    : 'ВЫКЛЮЧЕНО (регламент): на экзамене не показываются правильные или неправильные ответы — они появляются только в конце экзамена.'}
                </p>
              </div>

              {/* Question Navigation Toggle */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800">
                    Разрешить переключение между вопросами на экзамене
                  </span>
                  <input
                    type="checkbox"
                    checked={localExamSettings.allowQuestionNavigation === true}
                    onChange={(e) =>
                      setLocalExamSettings({
                        ...localExamSettings,
                        allowQuestionNavigation: e.target.checked,
                      })
                    }
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  {localExamSettings.allowQuestionNavigation === true
                    ? 'ВКЛЮЧЕНО: курсант может переключаться между вопросами и пропускать их.'
                    : 'ВЫКЛЮЧЕНО (регламент): переключаться между вопросами нельзя — курсант отвечает строго по очереди.'}
                </p>
              </div>

              {/* Ticket Exclusivity Toggle */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800">
                    Блокировать уже выбранный билет для других курсантов (эксклюзивность)
                  </span>
                  <input
                    type="checkbox"
                    checked={localExamSettings.uniqueTicketPerStudent !== false}
                    onChange={(e) =>
                      setLocalExamSettings({
                        ...localExamSettings,
                        uniqueTicketPerStudent: e.target.checked,
                      })
                    }
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  {localExamSettings.uniqueTicketPerStudent !== false
                    ? 'ВКЛЮЧЕНО: если курсант выбрал билет, второму курсанту уже выбранный билет не доступен.'
                    : 'ВЫКЛЮЧЕНО: разные курсанты могут параллельно выбирать один и тот же билет.'}
                </p>
                {(localExamSettings.occupiedTickets?.length || 0) > 0 && (
                  <div className="pt-2 flex items-center justify-between border-t border-neutral-200 text-[11px]">
                    <span className="text-amber-800 font-medium">
                      Сейчас занято билетов: <strong>{localExamSettings.occupiedTickets?.length}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setLocalExamSettings({ ...localExamSettings, occupiedTickets: [] })}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Сбросить все занятые билеты
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Количество вопросов в билете
                </label>
                <input
                  type="number"
                  min={5}
                  max={questions.length || 40}
                  value={localExamSettings.questionCount}
                  onChange={(e) =>
                    setLocalExamSettings({
                      ...localExamSettings,
                      questionCount: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl font-mono text-sm"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Стандарт ГИБДД: 20 вопросов
                </span>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Ограничение времени на экзамен (минут)
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={localExamSettings.timeLimitMinutes}
                  onChange={(e) =>
                    setLocalExamSettings({
                      ...localExamSettings,
                      timeLimitMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl font-mono text-sm"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Укажите 0, если ограничение по времени не требуется (стандарт ГИБДД: 20 мин)
                </span>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Ограничение времени на тематические тесты (минут)
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={localExamSettings.testTimeLimitMinutes}
                  onChange={(e) =>
                    setLocalExamSettings({
                      ...localExamSettings,
                      testTimeLimitMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl font-mono text-sm"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Укажите 0 для тренировочного режима без ограничения по времени
                </span>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Проходной балл для экзамена (%)
                </label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={localExamSettings.passingPercent}
                  onChange={(e) =>
                    setLocalExamSettings({
                      ...localExamSettings,
                      passingPercent: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl font-mono text-sm"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  По умолчанию 90% (не более 2 ошибок в 20 вопросах)
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExamSettingsOpen(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Сохранить настройки
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ADD/EDIT CATEGORY MODAL */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 p-6">
            <button
              onClick={() => setIsCatModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-neutral-900 mb-4">
              {editingCatId ? 'Редактировать категорию' : 'Создать категорию вопросов'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingCatId) {
                  updateCategory(editingCatId, catFormData);
                } else {
                  addCategory(catFormData);
                }
                setIsCatModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Название</label>
                <input
                  type="text"
                  required
                  value={catFormData.title}
                  onChange={(e) => setCatFormData({ ...catFormData, title: e.target.value })}
                  placeholder="например, Остановка и стоянка"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Описание</label>
                <textarea
                  rows={3}
                  value={catFormData.description}
                  onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                  placeholder="Правила стоянки в населенных пунктах и вне их..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-3 py-2 border rounded-xl text-neutral-600 hover:bg-neutral-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ADD/EDIT QUESTION MODAL */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsQuestionModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-neutral-900 mb-4">
              {editingQuestionId ? 'Редактировать вопрос' : 'Создать карточку вопроса'}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const filteredOptions = qFormData.options.filter((o) => o.trim().length > 0);
                if (filteredOptions.length < 2) {
                  alert('Укажите как минимум 2 варианта ответа');
                  return;
                }

                if (editingQuestionId) {
                  updateQuestion(editingQuestionId, {
                    ...qFormData,
                    options: filteredOptions,
                  });
                } else {
                  addQuestion({
                    ...qFormData,
                    options: filteredOptions,
                  });
                }
                setIsQuestionModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Категория</label>
                  <select
                    value={qFormData.categoryId}
                    onChange={(e) => setQFormData({ ...qFormData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Для какой группы / категории</label>
                  <select
                    value={qFormData.groupTarget}
                    onChange={(e) =>
                      setQFormData({
                        ...qFormData,
                        groupTarget: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="all">Для всех групп и категорий (B и C)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} — {g.category ? `Кат. ${g.category}` : ''} ({g.transmission})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Текст вопроса</label>
                <textarea
                  rows={3}
                  required
                  value={qFormData.questionText}
                  onChange={(e) => setQFormData({ ...qFormData, questionText: e.target.value })}
                  placeholder="В каком направлении разрешено продолжить движение?"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="font-semibold text-neutral-700 block">
                  Варианты ответов (отметьте правильный переключателем)
                </label>
                {qFormData.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={qFormData.correctAnswerIndex === i}
                      onChange={() => setQFormData({ ...qFormData, correctAnswerIndex: i })}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...qFormData.options];
                        newOpts[i] = e.target.value;
                        setQFormData({ ...qFormData, options: newOpts });
                      }}
                      placeholder={`Вариант ${i + 1}`}
                      className="flex-1 px-3 py-1.5 border rounded-xl"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Объяснение правильного ответа (Пункт ПДД)
                </label>
                <textarea
                  rows={2}
                  value={qFormData.explanation}
                  onChange={(e) => setQFormData({ ...qFormData, explanation: e.target.value })}
                  placeholder="Согласно пункту 13.4 ПДД, при повороте налево..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              {/* Image Uploader with Computer File & URL support */}
              <ImageInputControl
                label="Иллюстрация к вопросу (загрузите файл с ПК или вставьте ссылку)"
                value={qFormData.imageUrl}
                onChange={(val) => setQFormData({ ...qFormData, imageUrl: val })}
              />

              {/* Road sign attach */}
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Привязать дорожный знак из каталога (опционально)
                </label>
                <select
                  value={qFormData.signId}
                  onChange={(e) => setQFormData({ ...qFormData, signId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="">Не привязывать знак</option>
                  {signs.map((s) => (
                    <option key={s.id} value={s.id}>
                      Знак {s.number}: {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Include in Exam Pool toggle */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-neutral-800 block text-xs">
                    Включать в государственный экзамен
                  </span>
                  <span className="text-[11px] text-neutral-500 block">
                    Вопрос будет попадать в случайную выборку при сдаче экзамена
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={qFormData.includeInExam !== false}
                  onChange={(e) =>
                    setQFormData({ ...qFormData, includeInExam: e.target.checked })
                  }
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-3 py-2 border rounded-xl text-neutral-600 hover:bg-neutral-50 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold"
                >
                  Сохранить вопрос
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRE-EXAM WARNING & INSTRUCTION MODAL */}
      {isExamWarningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 sm:p-7 max-h-[92vh] overflow-y-auto space-y-5">
            <button
              onClick={() => setIsExamWarningOpen(false)}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                  ДОСААФ России • Экзаменационный регламент
                </span>
                <h3 className="text-lg font-black text-neutral-900 leading-tight">
                  Государственный экзамен по ПДД
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>Курсант: <strong className="text-neutral-800">{currentUser?.name || 'Курсант ДОСААФ'}</strong></span>
                  <span>•</span>
                  <span className="font-semibold text-neutral-700">{getGroupName(currentUser?.group)}</span>
                  {groups.find((g) => g.id === currentUser?.group)?.category === 'C' ? (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">
                      Категория «C» (Грузовые)
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px] border border-blue-300">
                      Категория «B» (Легковые)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Exam Parameters Overview */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Вопросов</span>
                <span className="text-base font-black text-neutral-900">
                  {selectedExamTicket === 'random'
                    ? Math.min(
                        examSettings.questionCount || 20,
                        availableQuestions.filter((q) => q.includeInExam !== false).length
                      )
                    : availableQuestions.filter(
                        (q) => q.includeInExam !== false && (q.ticketNumber || 1) === selectedExamTicket
                      ).length || examSettings.questionCount || 20}{' '}
                  вопр.
                </span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Время</span>
                <span className="text-base font-black text-neutral-900">
                  {examSettings.timeLimitMinutes || 20} минут
                </span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Допуск</span>
                <span className="text-base font-black text-emerald-600">≤ 2 ошибок</span>
              </div>
            </div>

            {/* Ticket Selection in Modal */}
            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
              {studentAssignedTicket && typeof studentAssignedTicket === 'number' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-center justify-between">
                  <span className="font-bold">
                    Вам преподавателем назначен <strong>Билет №{studentAssignedTicket}</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded-md text-[10px] font-bold">
                    Назначен
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-amber-600" />
                  <span>Экзаменационный билет:</span>
                </span>
                <span className="text-neutral-500 font-semibold text-[11px]">
                  {selectedExamTicket === 'random' ? 'Случайные вопросы из базы' : `Билет №${selectedExamTicket}`}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedExamTicket('random')}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    selectedExamTicket === 'random'
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <div>Случайный</div>
                  <div className="text-[10px] opacity-70 font-normal">Из базы</div>
                </button>
                {availableTickets.map((tNum) => {
                  const qCount = availableQuestions.filter(
                    (q) => q.includeInExam !== false && (q.ticketNumber || 1) === tNum
                  ).length;
                  const isOccupied =
                    examSettings.uniqueTicketPerStudent !== false &&
                    (examSettings.occupiedTickets || []).some(
                      (o) => o.ticketNumber === tNum && o.studentId !== currentUser?.id
                    );
                  const occupiedInfo = (examSettings.occupiedTickets || []).find(
                    (o) => o.ticketNumber === tNum && o.studentId !== currentUser?.id
                  );

                  return (
                    <button
                      key={tNum}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => setSelectedExamTicket(tNum)}
                      title={isOccupied ? `Билет занят: ${occupiedInfo?.studentName}` : `Выбрать Билет №${tNum}`}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${
                        isOccupied
                          ? 'bg-neutral-100 text-neutral-400 border-dashed border-neutral-300 opacity-60 cursor-not-allowed'
                          : selectedExamTicket === tNum
                          ? 'bg-amber-400 text-neutral-950 border-amber-500 shadow-xs font-black cursor-pointer'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100 cursor-pointer'
                      }`}
                    >
                      <div>Билет №{tNum}</div>
                      <div className="text-[10px] opacity-75 font-normal">
                        {isOccupied ? `Занят` : `${qCount} вопр.`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Anti-Cheating Rules Box */}
            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-300 space-y-3">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Правила проведения экзамена и строгий контроль анти-списывания:</span>
              </div>

              <ul className="space-y-2 text-xs text-amber-900/90 pl-1 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                  <span>
                    <strong>Запрет переключения вкладок:</strong> во время сдачи запрещено покидать данную вкладку, переключаться в другие окна или сворачивать браузер.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                  <span>
                    <strong>Электронный протокол:</strong> каждый уход с вкладки мгновенно регистрируется и отображается в журнале нарушений преподавателя.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                  <span>
                    <strong>Защита от копирования:</strong> выделение и копирование формулировок вопросов и вариантов ответов заблокировано на уровне системы.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                  <span>
                    <strong>Непрерывность:</strong> по истечении 20 минут экзамен завершится автоматически с текущим результатом.
                  </span>
                </li>
              </ul>
            </div>

            {/* Agreement Checkbox */}
            <label className="flex items-start gap-3 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors">
              <input
                type="checkbox"
                checked={examAgreementChecked}
                onChange={(e) => setExamAgreementChecked(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-blue-600 rounded cursor-pointer shrink-0"
              />
              <span className="text-xs text-neutral-800 leading-snug">
                Я подтверждаю, что ознакомлен(а) с регламентом сдачи экзамена ДОСААФ, правилами анти-списывания и готов(а) начать тестирование честно без подсказок.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsExamWarningOpen(false)}
                className="px-4 py-2.5 border border-neutral-200 text-neutral-600 hover:bg-neutral-100 rounded-xl text-xs font-bold transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={!examAgreementChecked}
                onClick={() => handleConfirmStartExam(selectedExamTicket)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs ${
                  examAgreementChecked
                    ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black cursor-pointer'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {selectedExamTicket === 'random'
                    ? 'Начать экзамен (Случайный билет)'
                    : `Начать экзамен (Билет №${selectedExamTicket})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXAM QUESTIONS BUILDER & MANAGER MODAL (Admin) */}
      {isExamQuestionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-neutral-200 p-5 sm:p-7 max-h-[94vh] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-neutral-200 shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-neutral-900 leading-tight">
                      Управление вопросами государственного экзамена
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                      ДОСААФ
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Решайте, какие вопросы попадут в экзаменационный билет, настраивайте категории B и C и редактируйте формулировки.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsExamQuestionsModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors"
                title="Закрыть окно"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats & Ticket Size Config */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 text-xs">
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Всего в базе</span>
                <span className="text-lg font-black text-neutral-900">{questions.length} вопр.</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">В пуле экзамена</span>
                <span className="text-lg font-black text-emerald-700">
                  {questions.filter((q) => q.includeInExam !== false).length} вопр.
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                <span className="text-[10px] text-blue-700 font-bold uppercase block">Вопросы Кат. B</span>
                <span className="text-lg font-black text-blue-700">
                  {questions.filter((q) => q.categoryType !== 'C' && q.groupTarget !== 'group3_c').length} вопр.
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="text-[10px] text-amber-800 font-bold uppercase block">Вопросы Кат. C (Грузовые)</span>
                <span className="text-lg font-black text-amber-800">
                  {questions.filter((q) => q.categoryType === 'C' || q.groupTarget === 'group3_c').length} вопр.
                </span>
              </div>
            </div>

            {/* Ticket parameters & Quick presets */}
            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between gap-4 flex-wrap shrink-0">
              <div className="flex items-center gap-6 flex-wrap text-xs">
                {/* Custom Question Count */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-700">Вопросов в билете:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={examSettings.questionCount || 20}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val > 0) {
                          updateExamSettings({ questionCount: val });
                        }
                      }}
                      className="w-16 px-2 py-1 bg-white border border-neutral-300 rounded-lg font-black text-center text-neutral-900 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      title="Введите любое количество вопросов для экзамена"
                    />
                    <span className="text-neutral-400 text-[11px]">шт.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[10, 20, 30, 40].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => updateExamSettings({ questionCount: count })}
                        className={`px-2 py-1 rounded-lg font-bold text-xs transition-colors ${
                          (examSettings.questionCount || 20) === count
                            ? 'bg-neutral-900 text-white shadow-xs'
                            : 'bg-white border text-neutral-600 hover:bg-neutral-100'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Time Limit */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-700">Время на экзамен:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={examSettings.timeLimitMinutes || 20}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 0) {
                          updateExamSettings({ timeLimitMinutes: val });
                        }
                      }}
                      className="w-16 px-2 py-1 bg-white border border-neutral-300 rounded-lg font-black text-center text-neutral-900 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      title="Введите любое количество минут (0 = без ограничения)"
                    />
                    <span className="text-neutral-400 text-[11px]">мин</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[15, 20, 25, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => updateExamSettings({ timeLimitMinutes: mins })}
                        className={`px-2 py-1 rounded-lg font-bold text-xs transition-colors ${
                          (examSettings.timeLimitMinutes || 20) === mins
                            ? 'bg-neutral-900 text-white shadow-xs'
                            : 'bg-white border text-neutral-600 hover:bg-neutral-100'
                        }`}
                      >
                        {mins} м
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bulk Presets */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-neutral-500 text-[11px] font-medium">Быстрый выбор:</span>
                <button
                  onClick={() => {
                    questions.forEach((q) => {
                      if (q.includeInExam === false) {
                        updateQuestion(q.id, { includeInExam: true });
                      }
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold transition-colors cursor-pointer"
                  title="Включить абсолютно все вопросы базы в экзамен"
                >
                  Включить все
                </button>
                <button
                  onClick={() => {
                    questions.forEach((q) => {
                      const isC = q.categoryType === 'C' || q.groupTarget === 'group3_c';
                      updateQuestion(q.id, { includeInExam: !isC });
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold transition-colors cursor-pointer"
                  title="Включить только вопросы для легковых автомобилей (Категория B)"
                >
                  Пакет «Кат. B»
                </button>
                <button
                  onClick={() => {
                    questions.forEach((q) => {
                      const isC = q.categoryType === 'C' || q.groupTarget === 'group3_c' || q.groupTarget === 'all';
                      updateQuestion(q.id, { includeInExam: isC });
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition-colors cursor-pointer"
                  title="Включить профильные вопросы для грузовых авто (Категория C)"
                >
                  Пакет «Кат. C»
                </button>
                <button
                  onClick={() => {
                    if (confirm('Исключить все вопросы из экзамена? Курсанты не смогут сдать экзамен, пока вы не включите вопросы.')) {
                      questions.forEach((q) => {
                        updateQuestion(q.id, { includeInExam: false });
                      });
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold transition-colors cursor-pointer"
                  title="Исключить все вопросы из экзамена"
                >
                  Снять все
                </button>
                <button
                  onClick={() => {
                    setEditingQuestionId(null);
                    setQFormData({
                      categoryId: categories[0]?.id || '',
                      questionText: '',
                      options: ['', '', '', ''],
                      correctAnswerIndex: 0,
                      explanation: '',
                      imageUrl: '',
                      signId: '',
                      groupTarget: 'all',
                      difficulty: 'medium',
                      includeInExam: true,
                    });
                    setIsQuestionModalOpen(true);
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Создать вопрос</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Поиск по тексту вопроса или ответам..."
                  value={examQSearch}
                  onChange={(e) => setExamQSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {examQSearch && (
                  <button
                    onClick={() => setExamQSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Target Class Filter (B / C / All) */}
              <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setExamQTargetFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    examQTargetFilter === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Все классы
                </button>
                <button
                  onClick={() => setExamQTargetFilter('B')}
                  className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                    examQTargetFilter === 'B' ? 'bg-blue-600 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Car className="w-3 h-3" />
                  <span>Кат. B</span>
                </button>
                <button
                  onClick={() => setExamQTargetFilter('C')}
                  className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                    examQTargetFilter === 'C' ? 'bg-amber-600 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Truck className="w-3 h-3" />
                  <span>Кат. C</span>
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setExamQStatusFilter('all')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    examQStatusFilter === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Все ({questions.length})
                </button>
                <button
                  onClick={() => setExamQStatusFilter('included')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    examQStatusFilter === 'included' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  В экзамене ({questions.filter((q) => q.includeInExam !== false).length})
                </button>
                <button
                  onClick={() => setExamQStatusFilter('excluded')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    examQStatusFilter === 'excluded' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-800 hover:bg-rose-50'
                  }`}
                >
                  Исключены ({questions.filter((q) => q.includeInExam === false).length})
                </button>
              </div>

              {/* Category Dropdown */}
              <select
                value={examQCatFilter}
                onChange={(e) => setExamQCatFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white"
              >
                <option value="all">Все темы ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Questions Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredExamQuestions.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 space-y-2">
                  <FileQuestion className="w-10 h-10 text-neutral-400 mx-auto" />
                  <p className="text-sm font-bold text-neutral-700">Вопросов по выбранным фильтрам не найдено</p>
                  <p className="text-xs text-neutral-400">Попробуйте изменить поисковый запрос или фильтры статуса.</p>
                </div>
              ) : (
                filteredExamQuestions.map((q, idx) => {
                  const isIncluded = q.includeInExam !== false;
                  const cat = categories.find((c) => c.id === q.categoryId);
                  const isC = q.categoryType === 'C' || q.groupTarget === 'group3_c';

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isIncluded
                          ? 'bg-white border-neutral-200 hover:border-neutral-300 shadow-xs'
                          : 'bg-neutral-50/80 border-neutral-200 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          {/* Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
                            <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border">
                              № {idx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                              {cat?.title || 'Общая тема'}
                            </span>
                            {isC ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                <span>Категория «C» (Грузовые)</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                <span>Категория «B» (Легковые)</span>
                              </span>
                            )}
                            {q.groupTarget && q.groupTarget !== 'all' && (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
                                {getGroupName(q.groupTarget)}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-md ${
                                isIncluded
                                  ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {isIncluded ? '✓ В экзамене' : '✕ Исключен из билетов'}
                            </span>
                          </div>

                          {/* Image or Sign preview */}
                          {(q.imageUrl || q.signId) && (
                            <div className="flex items-center gap-3 pt-1">
                              {q.imageUrl && (
                                <img
                                  src={q.imageUrl}
                                  alt="Иллюстрация"
                                  className="h-16 w-24 object-cover rounded-xl border border-neutral-200"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              {q.signId && (
                                <div className="p-1.5 bg-neutral-50 rounded-xl border border-neutral-200">
                                  {signs.find((s) => s.id === q.signId) && (
                                    <RoadSignSvg sign={signs.find((s) => s.id === q.signId)!} size={48} />
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Question Text */}
                          <p className="text-sm font-bold text-neutral-900 leading-snug">
                            {q.questionText}
                          </p>

                          {/* Options preview */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = oIdx === q.correctAnswerIndex;
                              return (
                                <div
                                  key={oIdx}
                                  className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-2 ${
                                    isCorrect
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                                      : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                                  }`}
                                >
                                  <span
                                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-neutral-200 text-neutral-600'
                                    }`}
                                  >
                                    {oIdx + 1}
                                  </span>
                                  <span className="truncate">{opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Actions right side */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {/* Big 1-Click Toggle */}
                          <button
                            onClick={() => {
                              updateQuestion(q.id, { includeInExam: !isIncluded });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                              isIncluded
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700'
                            }`}
                            title={isIncluded ? 'Нажмите, чтобы исключить из экзамена' : 'Нажмите, чтобы включить в экзамен'}
                          >
                            {isIncluded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>В экзамене</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Включить</span>
                              </>
                            )}
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => {
                              setEditingQuestionId(q.id);
                              setQFormData({
                                categoryId: q.categoryId,
                                questionText: q.questionText,
                                options: [...q.options, '', '', ''].slice(0, 4),
                                correctAnswerIndex: q.correctAnswerIndex,
                                explanation: q.explanation || '',
                                imageUrl: q.imageUrl || '',
                                signId: q.signId || '',
                                groupTarget: q.groupTarget || 'all',
                                difficulty: q.difficulty || 'medium',
                                includeInExam: q.includeInExam !== false,
                              });
                              setIsQuestionModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-neutral-500" />
                            <span>Изменить</span>
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => {
                              if (confirm(`Удалить вопрос "${q.questionText.slice(0, 40)}..." из базы?`)) {
                                deleteQuestion(q.id);
                              }
                            }}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Удалить вопрос"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0 text-xs">
              <div className="text-neutral-500 text-[11px]">
                Показано: <strong className="text-neutral-800">{filteredExamQuestions.length}</strong> из {questions.length} вопросов базы.
              </div>
              <button
                onClick={() => setIsExamQuestionsModalOpen(false)}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-950 text-white rounded-xl font-bold transition-colors shadow-xs cursor-pointer"
              >
                Готово (Применить к экзамену)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED EXAM & TICKET ADMIN MODAL */}
      <ExamAdminModal
        isOpen={isExamAdminModalOpen}
        onClose={() => setIsExamAdminModalOpen(false)}
        defaultTab={examAdminTab}
        onEditQuestion={(q) => {
          setEditingQuestionId(q.id);
          setQFormData({
            categoryId: q.categoryId,
            questionText: q.questionText,
            options: [...q.options, '', '', ''].slice(0, 4),
            correctAnswerIndex: q.correctAnswerIndex,
            explanation: q.explanation || '',
            imageUrl: q.imageUrl || '',
            signId: q.signId || '',
            groupTarget: q.groupTarget || 'all',
            categoryType: q.categoryType || 'all',
            difficulty: q.difficulty || 'medium',
            includeInExam: q.includeInExam !== false,
            ticketNumber: q.ticketNumber || 1,
          });
          setIsQuestionModalOpen(true);
        }}
        onCreateQuestionInTicket={(tNum) => {
          setEditingQuestionId(null);
          setQFormData({
            categoryId: categories[0]?.id || '',
            questionText: '',
            options: ['', '', '', ''],
            correctAnswerIndex: 0,
            explanation: '',
            imageUrl: '',
            signId: '',
            groupTarget: 'all',
            categoryType: 'all',
            difficulty: 'medium',
            includeInExam: true,
            ticketNumber: tNum,
          });
          setIsQuestionModalOpen(true);
        }}
      />
    </div>
  );
};
