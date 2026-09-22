import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  Award,
  Search,
  Eye,
  X,
  Activity,
  TrendingUp,
  Lock,
  Unlock,
  Timer,
  BookOpen,
  User as UserIcon,
  Zap,
  Circle,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface LiveSession {
  userId: string;
  userName: string;
  userGroup: string;
  userGroupName: string;
  examId: string;
  examTitle: string;
  isExamMode: boolean;
  ticketNumber?: number | 'random';
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  errors: Array<{ index: number; questionText: string; chosen: string; correct: string }>;
  answers: Record<number, number>;
  elapsedSeconds: number;
  timeLimitSeconds: number;
  tabViolations: number;
  startTime: number;
  lastUpdate: number;
}

export const LiveMonitoringView: React.FC = () => {
  const { getGroupName } = useApp();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'exam' | 'test'>('all');
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Загрузка активных сессий
  const fetchActiveSessions = async () => {
    try {
      const res = await fetch('/api/monitoring/active');
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
        setLastUpdateTime(Date.now());
      }
    } catch (err) {
      console.warn('Ошибка загрузки активных сессий:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Первая загрузка + polling каждые 3 секунды
  useEffect(() => {
    fetchActiveSessions();
    if (isPaused) return;

    const interval = setInterval(fetchActiveSessions, 3000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Форматирование времени
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatTimeAgo = (ms: number) => {
    const seconds = Math.floor((Date.now() - ms) / 1000);
    if (seconds < 5) return 'сейчас';
    if (seconds < 60) return `${seconds} сек назад`;
    return `${Math.floor(seconds / 60)} мин назад`;
  };

  // Фильтрация сессий
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.userName.toLowerCase().includes(q);
        const matchGroup = s.userGroupName.toLowerCase().includes(q);
        const matchExam = s.examTitle.toLowerCase().includes(q);
        if (!matchName && !matchGroup && !matchExam) return false;
      }
      if (filterGroup !== 'all' && s.userGroup !== filterGroup) return false;
      if (filterMode === 'exam' && !s.isExamMode) return false;
      if (filterMode === 'test' && s.isExamMode) return false;
      return true;
    });
  }, [sessions, searchQuery, filterGroup, filterMode]);

  // Уникальные группы для фильтра
  const uniqueGroups = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach((s) => {
      if (s.userGroup) map.set(s.userGroup, s.userGroupName || s.userGroup);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sessions]);

  // Общая статистика
  const totalStats = useMemo(() => {
    const exams = sessions.filter((s) => s.isExamMode).length;
    const tests = sessions.filter((s) => !s.isExamMode).length;
    const totalViolations = sessions.reduce((acc, s) => acc + s.tabViolations, 0);
    const avgProgress = sessions.length > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + (s.totalQuestions > 0 ? s.answeredCount / s.totalQuestions : 0), 0) /
            sessions.length *
            100
        )
      : 0;
    return { exams, tests, totalViolations, avgProgress };
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-7 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight">Мониторинг в реальном времени</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Отслеживание активности курсантов: тесты, экзамены, ответы и нарушения
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                <span>Обновлено: {formatTimeAgo(lastUpdateTime)}</span>
                <span>•</span>
                <span>Авто-обновление каждые 3 сек</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isPaused
                  ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              {isPaused ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              <span>{isPaused ? 'Пауза' : 'Авто-обновление ВКЛ'}</span>
            </button>
            <button
              onClick={fetchActiveSessions}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Обновить</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Всего активных</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-2xl font-black text-white">{sessions.length}</span>
          </div>
          <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-400/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Экзамены</span>
              <Award className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-2xl font-black text-blue-300">{totalStats.exams}</span>
          </div>
          <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-400/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Тесты</span>
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-black text-emerald-300">{totalStats.tests}</span>
          </div>
          <div className={`rounded-2xl p-4 border ${
            totalStats.totalViolations > 0
              ? 'bg-rose-500/10 border-rose-400/30'
              : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                totalStats.totalViolations > 0 ? 'text-rose-300' : 'text-slate-400'
              }`}>Нарушений</span>
              <ShieldAlert className={`w-4 h-4 ${
                totalStats.totalViolations > 0 ? 'text-rose-400' : 'text-slate-400'
              }`} />
            </div>
            <span className={`text-2xl font-black ${
              totalStats.totalViolations > 0 ? 'text-rose-300' : 'text-white'
            }`}>{totalStats.totalViolations}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по имени, группе или названию теста..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mode filter */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterMode === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Все ({sessions.length})
            </button>
            <button
              onClick={() => setFilterMode('exam')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                filterMode === 'exam' ? 'bg-blue-600 text-white shadow-xs' : 'text-neutral-600 hover:text-blue-700'
              }`}
            >
              <Award className="w-3 h-3" />
              Экзамены ({totalStats.exams})
            </button>
            <button
              onClick={() => setFilterMode('test')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                filterMode === 'test' ? 'bg-emerald-600 text-white shadow-xs' : 'text-neutral-600 hover:text-emerald-700'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              Тесты ({totalStats.tests})
            </button>
          </div>

          {/* Group filter */}
          {uniqueGroups.length > 0 && (
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white"
            >
              <option value="all">Все группы</option>
              {uniqueGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 text-neutral-400 mx-auto animate-spin mb-3" />
          <p className="text-sm font-bold text-neutral-700">Загрузка активных сессий...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-12 text-center shadow-xs">
          <div className="w-16 h-16 mx-auto bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-base font-bold text-neutral-800 mb-1">
            {sessions.length === 0 ? 'Сейчас никто не проходит тестирование' : 'Никого не найдено по фильтрам'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
            {sessions.length === 0
              ? 'Как только курсант начнёт тест или экзамен, его сессия появится здесь автоматически. Обновление происходит каждые 3 секунды.'
              : 'Попробуйте изменить поисковый запрос или фильтры.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSessions.map((session) => {
            const progressPercent =
              session.totalQuestions > 0
                ? Math.round((session.answeredCount / session.totalQuestions) * 100)
                : 0;
            const remaining = session.timeLimitSeconds > 0
              ? Math.max(0, session.timeLimitSeconds - session.elapsedSeconds)
              : null;
            const isTimeUrgent = remaining !== null && remaining <= 120;
            const isRecent = Date.now() - session.lastUpdate < 10000;

            return (
              <div
                key={session.userId}
                className={`bg-white rounded-2xl border-2 shadow-xs transition-all overflow-hidden ${
                  session.tabViolations > 0
                    ? 'border-rose-300'
                    : session.isExamMode
                    ? 'border-blue-300'
                    : 'border-neutral-200'
                }`}
              >
                {/* Card header */}
                <div
                  className={`px-5 py-3.5 flex items-center justify-between gap-3 ${
                    session.isExamMode
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                      : 'bg-gradient-to-r from-slate-700 to-slate-800 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        session.isExamMode
                          ? 'bg-amber-400 text-neutral-950'
                          : 'bg-emerald-400 text-neutral-950'
                      }`}
                    >
                      {session.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black truncate">{session.userName}</h3>
                        {isRecent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Активен" />
                        )}
                      </div>
                      <p className="text-[11px] opacity-90 truncate">
                        {session.userGroupName || getGroupName(session.userGroup)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {session.isExamMode ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-neutral-950 text-[10px] font-black flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        ЭКЗАМЕН
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-400 text-neutral-950 text-[10px] font-black flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        ТЕСТ
                      </span>
                    )}
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 space-y-4">
                  {/* Exam title + Ticket */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Проходит сейчас
                      </span>
                      <p className="text-sm font-bold text-neutral-900 truncate">
                        {session.examTitle}
                      </p>
                    </div>
                    {session.tabViolations > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-bold flex items-center gap-1 shrink-0">
                        <ShieldAlert className="w-3 h-3" />
                        Нарушений: {session.tabViolations}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="font-bold text-neutral-700">
                        Прогресс: {session.answeredCount} / {session.totalQuestions}
                      </span>
                      <span className="font-black text-neutral-900">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          session.isExamMode
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                      <span className="text-[10px] text-neutral-500 font-bold uppercase block">Вопрос</span>
                      <span className="text-base font-black text-neutral-900">
                        {session.currentIndex + 1}
                        <span className="text-xs text-neutral-400 font-medium">/{session.totalQuestions}</span>
                      </span>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 font-bold uppercase block">Верно</span>
                      <span className="text-base font-black text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {session.correctCount}
                      </span>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                      <span className="text-[10px] text-rose-700 font-bold uppercase block">Ошибок</span>
                      <span className="text-base font-black text-rose-700 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        {session.wrongCount}
                      </span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 text-xs">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-bold ${
                        isTimeUrgent
                          ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimer(session.elapsedSeconds)}</span>
                    </div>
                    {remaining !== null && (
                      <div className={`text-[11px] font-semibold ${isTimeUrgent ? 'text-rose-700' : 'text-neutral-500'}`}>
                        Осталось: {formatTimer(remaining)}
                      </div>
                    )}
                    <div className="ml-auto text-[10px] text-neutral-400">
                      {formatTimeAgo(session.lastUpdate)}
                    </div>
                  </div>

                  {/* Errors preview */}
                  {session.errors.length > 0 && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-rose-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" />
                        Последние ошибки:
                      </span>
                      {session.errors.slice(-3).map((err, idx) => (
                        <div key={idx} className="text-[11px] text-rose-900 leading-snug">
                          <span className="font-bold">№{err.index}:</span> выбрано «
                          <span className="font-semibold">{err.chosen.slice(0, 40)}</span>» вместо «
                          <span className="font-semibold text-emerald-800">{err.correct.slice(0, 40)}</span>»
                        </div>
                      ))}
                      {session.errors.length > 3 && (
                        <span className="text-[10px] text-rose-600 font-medium">
                          ... и ещё {session.errors.length - 3} ошибок
                        </span>
                      )}
                    </div>
                  )}

                  {/* Detail button */}
                  <button
                    onClick={() => {
                      setSelectedSession(session);
                      setIsDetailOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Подробная информация</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedSession && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-neutral-200 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-3xl flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shrink-0">
                  {selectedSession.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-black">{selectedSession.userName}</h2>
                  <p className="text-xs opacity-80">
                    {selectedSession.userGroupName} • {selectedSession.examTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">Вопрос</span>
                  <span className="text-lg font-black text-neutral-900">
                    {selectedSession.currentIndex + 1} / {selectedSession.totalQuestions}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Верных</span>
                  <span className="text-lg font-black text-emerald-700">{selectedSession.correctCount}</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                  <span className="text-[10px] text-rose-700 font-bold uppercase block">Ошибок</span>
                  <span className="text-lg font-black text-rose-700">{selectedSession.wrongCount}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">Нарушений</span>
                  <span className="text-lg font-black text-amber-800">{selectedSession.tabViolations}</span>
                </div>
              </div>

              {/* Time */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-neutral-500" />
                  <span className="text-sm font-bold text-neutral-800">Время на тесте:</span>
                </div>
                <span className="text-lg font-black text-neutral-900 font-mono">
                  {formatTimer(selectedSession.elapsedSeconds)}
                </span>
              </div>

              {/* Answers Table */}
              <div>
                <h3 className="text-sm font-black text-neutral-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-neutral-500" />
                  Ответы курсанта по вопросам
                </h3>
                <div className="space-y-2">
                  {Array.from({ length: selectedSession.totalQuestions }, (_, idx) => {
                    const answer = selectedSession.answers[idx];
                    const isAnswered = answer !== undefined;
                    const isCurrent = idx === selectedSession.currentIndex;
                    const errorInfo = selectedSession.errors.find((e) => e.index === idx + 1);
                    const isWrong = Boolean(errorInfo);

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                            : isWrong
                            ? 'bg-rose-50 border-rose-200'
                            : isAnswered
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-neutral-50 border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                              isCurrent
                                ? 'bg-blue-600 text-white'
                                : isWrong
                                ? 'bg-rose-600 text-white'
                                : isAnswered
                                ? 'bg-emerald-600 text-white'
                                : 'bg-neutral-200 text-neutral-600'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-blue-700 block">РЕШАЕТ СЕЙЧАС</span>
                            )}
                            {isWrong && errorInfo ? (
                              <>
                                <p className="text-xs font-bold text-rose-900 truncate">
                                  ❌ {errorInfo.questionText}
                                </p>
                                <p className="text-[11px] text-rose-700 mt-0.5">
                                  Выбрано: <span className="font-semibold">«{errorInfo.chosen}»</span>
                                </p>
                                <p className="text-[11px] text-emerald-700">
                                  Правильно: <span className="font-semibold">«{errorInfo.correct}»</span>
                                </p>
                              </>
                            ) : isAnswered ? (
                              <p className="text-xs font-semibold text-emerald-800">✅ Ответ дан верно</p>
                            ) : (
                              <p className="text-xs text-neutral-500">Не отвечен</p>
                            )}
                          </div>
                        </div>
                        {isWrong && (
                          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        )}
                        {isAnswered && !isWrong && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-neutral-500">
                Обновлено: {formatTimeAgo(selectedSession.lastUpdate)}
              </span>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};