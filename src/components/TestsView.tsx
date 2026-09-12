import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Question, QuestionCategory, RoadSign, GroupType } from '../types';
import { RoadSignSvg } from './RoadSignSvg';
import { ImageInputControl } from './ImageInputControl';
import { EditableDesignBlock } from './EditableDesignBlock';
import { useDesignEditor } from '../context/DesignEditorContext';
import confetti from 'canvas-confetti';
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
  Settings2,
  Timer,
  Sliders,
  UserCheck,
} from 'lucide-react';

interface ActiveTestSession {
  category: QuestionCategory | null;
  isExamMode: boolean;
  questionsList: Question[];
  currentIndex: number;
  userAnswers: Record<number, number>; // index -> chosen option index
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
    examSettings,
    updateExamSettings,
    getGroupName,
    groups,
    canStudentTakeTests,
    canStudentTakeExam,
  } = useApp();
  const { getOrderedItems } = useDesignEditor();

  // Test Session state
  const [activeSession, setActiveSession] = useState<ActiveTestSession | null>(null);

  // Admin Exam & Timer Settings Modal
  const [isExamSettingsOpen, setIsExamSettingsOpen] = useState(false);
  const [localExamSettings, setLocalExamSettings] = useState(examSettings);

  // Filter for question bank view
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const [activeBankTab, setActiveBankTab] = useState<'quizzes' | 'manage_questions'>('quizzes');

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
    groupTarget: 'all' as 'all' | 'group7_mkpp' | 'group8_akpp',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });

  // Keep local settings in sync with context
  useEffect(() => {
    setLocalExamSettings(examSettings);
  }, [examSettings]);

  // Keep a ref to activeSession for clean unmount/exit tracking
  const activeSessionRef = useRef<ActiveTestSession | null>(null);
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  // Finish test callback
  const finishActiveTest = (sessionToFinish = activeSession) => {
    if (!sessionToFinish || sessionToFinish.isFinished) return;

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
    recordTestAttempt({
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Ученик',
      userGroup: currentUser?.group || groups[0]?.id || 'group7_mkpp',
      categoryId: sessionToFinish.category ? sessionToFinish.category.id : 'exam_mixed',
      categoryTitle: sessionToFinish.category
        ? sessionToFinish.category.title
        : `Государственный экзамен (${sessionToFinish.questionsList.length} вопр.)`,
      totalQuestions: total,
      correctAnswers: correctCount,
      scorePercent,
      passed,
      abandoned: false,
      answeredCount: total,
      timeSpentSeconds: sessionToFinish.elapsedSeconds,
      wrongQuestionIds: wrongIds,
      isExam: sessionToFinish.isExamMode,
    });

    if (passed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
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
      userGroup: currentUser?.group || groups[0]?.id || 'group7_mkpp',
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
      if (selectedGroupTab === 'group7_mkpp' && q.groupTarget === 'group8_akpp') return false;
      if (selectedGroupTab === 'group8_akpp' && q.groupTarget === 'group7_mkpp') return false;
      return true;
    });
  }, [questions, selectedGroupTab]);

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
      isFinished: false,
      startTime: Date.now(),
      elapsedSeconds: 0,
      timeLimitSeconds: limitSec,
    });
  };

  // Start Exam Mode
  const handleStartExam = () => {
    if (!examSettings.isOpen && !isAdmin) {
      alert('Общий доступ к экзамену пока закрыт преподавателем.');
      return;
    }

    if (!canStudentTakeExam()) {
      alert('У вас нет персонального допуска к сдаче государственного экзамена ДОСААФ. Администратор автошколы должен предоставить вам допуск в панели управления.');
      return;
    }

    if (availableQuestions.length === 0) {
      alert('Нет доступных вопросов для экзамена.');
      return;
    }

    const qCount = Math.min(examSettings.questionCount || 20, availableQuestions.length);
    const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random()).slice(0, qCount);
    const limitSec = (examSettings.timeLimitMinutes || 20) * 60;

    setActiveSession({
      category: null,
      isExamMode: true,
      questionsList: shuffled,
      currentIndex: 0,
      userAnswers: {},
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

  // Move to next question or finish
  const handleNextOrFinish = () => {
    if (!activeSession) return;
    if (activeSession.currentIndex < activeSession.questionsList.length - 1) {
      setActiveSession({
        ...activeSession,
        currentIndex: activeSession.currentIndex + 1,
      });
    } else {
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
                Курсант: <strong className="text-neutral-800">{currentUser?.name}</strong> •{' '}
                {currentUser?.group === 'group7_mkpp' ? 'Группа №7' : 'Группа №8'}
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
      <div className="max-w-3xl mx-auto space-y-4">
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
                {activeSession.isExamMode ? 'Государственный экзамен ГИБДД' : activeSession.category?.title}
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

        {/* Question Card */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-7 shadow-xs space-y-6">
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
                  className="max-h-60 max-w-full w-auto object-contain rounded-lg shrink-0"
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
                if (isCorrect) {
                  btnStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'border-rose-500 bg-rose-50/70 text-rose-950';
                } else {
                  btnStyle = 'border-neutral-200 bg-neutral-50/50 text-neutral-400 opacity-60';
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

                  {hasAnsweredCurrent && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {hasAnsweredCurrent && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation if answered */}
          {hasAnsweredCurrent && (
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-blue-950 space-y-1.5 animate-in fade-in duration-200">
              <span className="font-bold flex items-center gap-1.5 text-blue-900">
                <HelpCircle className="w-4 h-4 text-blue-700" />
                Пояснение правил ПДД:
              </span>
              <p className="leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}

          {/* Action button */}
          {hasAnsweredCurrent && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleNextOrFinish}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <span>
                  {activeSession.currentIndex < totalQ - 1 ? 'Следующий вопрос' : 'Завершить тест'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
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
              bg: examSettings.isOpen
                ? 'bg-gradient-to-br from-blue-900 to-indigo-950 text-white'
                : 'bg-neutral-900 text-white',
              border: examSettings.isOpen ? 'border-blue-800' : 'border-neutral-800',
              radius: 'rounded-3xl',
              padding: 'p-6 sm:p-7',
              shadow: 'shadow-xs',
            }}
          >
            {({ title, subtitle }) => (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-neutral-950">
                      Официальный формат ГИБДД
                    </span>

                    {examSettings.isOpen ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                        <Unlock className="w-3 h-3" />
                        Экзамен открыт в автошколе
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Экзамен закрыт преподавателем
                      </span>
                    )}

                    {!isAdmin && (
                      canStudentTakeExam() ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-blue-400" />
                          Персональный допуск: Выдан
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-400" />
                          Персональный допуск: Не выдан
                        </span>
                      )
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
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        onClick={() => updateExamSettings({ isOpen: !examSettings.isOpen })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                          examSettings.isOpen
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {examSettings.isOpen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        <span>{examSettings.isOpen ? 'Закрыть общий доступ для курсантов' : 'Открыть общий доступ для курсантов'}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
                  {(examSettings.isOpen && canStudentTakeExam()) || isAdmin ? (
                    <button
                      onClick={handleStartExam}
                      className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-2xl text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-neutral-950" />
                      <span>Сдать экзамен ({examSettings.questionCount || 20} вопр.)</span>
                    </button>
                  ) : !canStudentTakeExam() && !isAdmin ? (
                    <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-400/30 text-xs text-amber-200 flex items-center gap-2 max-w-xs">
                      <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>Администратор еще не предоставил вам персональный допуск к сдаче экзамена.</span>
                    </div>
                  ) : (
                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-xs text-neutral-300 flex items-center gap-2 max-w-xs">
                      <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>Экзамен будет открыт преподавателем во время зачета или итоговой проверки</span>
                    </div>
                  )}
                </div>
              </div>
            )}
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
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
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
                });
                setIsQuestionModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Создать карточку вопроса</span>
            </button>
          </div>

          {/* List of questions */}
          <div className="space-y-3">
            {questions
              .filter((q) => selectedCatFilter === 'all' || q.categoryId === selectedCatFilter)
              .map((q) => {
                const cat = categories.find((c) => c.id === q.categoryId);
                const sign = q.signId ? signs.find((s) => s.id === q.signId) : null;

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
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                          {q.questionText}
                        </h4>
                        <span className="text-[11px] text-emerald-700 font-medium block">
                          Правильный ответ: {q.options[q.correctAnswerIndex]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
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
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 sm:p-7">
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
                  Настройки экзамена и таймеров
                </h3>
                <span className="text-xs text-neutral-500 font-medium">
                  Параметры сдачи для курсантов
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveExamSettings} className="space-y-4 text-xs">
              {/* Exam Access switch */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800">Доступ к экзамену</span>
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
                    ? 'Экзамен ОТКРЫТ для всех курсантов'
                    : 'Экзамен ЗАКРЫТ (курсанты увидят уведомление о запрете сдачи)'}
                </p>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Количество вопросов в экзамене
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
                  Вопросы выбираются случайно со всех доступных тестов (стандарт ГИБДД: 20)
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
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
                  <label className="font-semibold text-neutral-700 block mb-1">Для какой группы</label>
                  <select
                    value={qFormData.groupTarget}
                    onChange={(e) =>
                      setQFormData({
                        ...qFormData,
                        groupTarget: e.target.value as 'all' | 'group7_mkpp' | 'group8_akpp',
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="all">Для всех (Общий вопрос)</option>
                    <option value="group7_mkpp">Только Группа №7 (МКПП)</option>
                    <option value="group8_akpp">Только Группа №8 (АКПП)</option>
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
    </div>
  );
};
