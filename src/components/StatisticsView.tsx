import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TestAttempt, GroupType } from '../types';
import { AuthModal } from './AuthModal';
import {
  BarChart3,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Users,
  Search,
  Trash2,
  TrendingUp,
  AlertCircle,
  Filter,
  Lock,
  ShieldAlert,
  ShieldCheck,
  FileSpreadsheet,
  Download,
} from 'lucide-react';

export const StatisticsView: React.FC = () => {
  const { testAttempts, currentUser, isAdmin, selectedGroupTab, deleteTestAttempt, getGroupName, groups } =
    useApp();

  const [studentSearch, setStudentSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'exam' | 'topic' | 'abandoned'>('all');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // If user is not admin, show access denied screen
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-neutral-200 shadow-sm text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Конфиденциальный раздел
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900">
            Статистика доступна только преподавателю
          </h2>
          <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
            Сводная ведомость автошколы ДОСААФ с результатами тестирования, баллами курсантов и протоколами сдачи экзаменов доступна только администратору.
          </p>
        </div>

        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs text-neutral-600 text-left space-y-1.5">
          <span className="font-bold text-neutral-900 block">Памятка для курсанта:</span>
          <p>
            Перед прохождением теста или экзамена обязательно укажите Ваши реальные <strong>Имя и Фамилию</strong> и группу — ваши результаты автоматически зафиксируются в ведомости преподавателя. Если вы прервете тест и выйдете, это также отобразится в журнале.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Войти как администратор</span>
          </button>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultTab="admin"
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // ADMIN-ONLY INSTRUCTOR GRADEBOOK
  // -------------------------------------------------------------

  // Filter attempts based on group, search and test type
  const filteredAttempts = useMemo(() => {
    return testAttempts.filter((a) => {
      // Dynamic Group filter
      if (selectedGroupTab !== 'all' && a.userGroup !== selectedGroupTab) {
        return false;
      }

      // Type filter
      if (filterType === 'exam' && !a.isExam) return false;
      if (filterType === 'topic' && a.isExam) return false;
      if (filterType === 'abandoned' && !a.abandoned) return false;

      // Search by student name or test category
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase().trim();
        const matchesName = a.userName.toLowerCase().includes(q);
        const matchesCategory = a.categoryTitle.toLowerCase().includes(q);
        return matchesName || matchesCategory;
      }

      return true;
    });
  }, [testAttempts, selectedGroupTab, filterType, studentSearch]);

  // Aggregate stats
  const overallStats = useMemo(() => {
    const total = filteredAttempts.length;
    if (total === 0) {
      return { total: 0, passed: 0, passRate: 0, avgScore: 0, examAttempts: 0, abandonedCount: 0 };
    }
    const passed = filteredAttempts.filter((a) => a.passed).length;
    const abandonedCount = filteredAttempts.filter((a) => a.abandoned).length;
    const totalScore = filteredAttempts.reduce((sum, a) => sum + a.scorePercent, 0);
    const examAttempts = filteredAttempts.filter((a) => a.isExam).length;

    return {
      total,
      passed,
      passRate: Math.round((passed / total) * 100),
      avgScore: Math.round(totalScore / total),
      examAttempts,
      abandonedCount,
    };
  }, [filteredAttempts]);

  // Unique students count
  const uniqueStudents = useMemo(() => {
    const set = new Set(filteredAttempts.map((a) => a.userName.toLowerCase().trim()));
    return set.size;
  }, [filteredAttempts]);

  // Export CSV report
  const handleExportCsv = () => {
    const headers = ['Имя и Фамилия', 'Группа', 'Билет / Экзамен', 'Результат %', 'Верно', 'Всего вопросов', 'Статус', 'Время (сек)', 'Дата'];
    const rows = filteredAttempts.map((a) => [
      `"${a.userName}"`,
      `"${getGroupName(a.userGroup)}"`,
      `"${a.categoryTitle}"`,
      a.scorePercent,
      a.correctAnswers,
      a.totalQuestions,
      a.abandoned ? 'НЕ ЗАКОНЧИЛ (ПРЕРВАН)' : (a.passed ? 'СДАНО' : 'НЕ СДАНО'),
      a.timeSpentSeconds,
      `"${a.dateStr}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vedomost_dosaaf_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Панель преподавателя (только seljax)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900">
              Сводная ведомость успеваемости и сдачи тестов
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Фиксация всех попыток сдачи билетов и экзаменов курсантами автошколы ДОСААФ
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={filteredAttempts.length === 0}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Экспорт ведомости в Excel (CSV)</span>
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-neutral-100">
          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-150">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-[11px] font-medium">Курсантов</span>
              <Users className="w-4 h-4 text-neutral-500" />
            </div>
            <span className="text-2xl font-black text-neutral-900 font-mono">
              {uniqueStudents}
            </span>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-150">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-[11px] font-medium">Всего попыток</span>
              <BarChart3 className="w-4 h-4 text-neutral-500" />
            </div>
            <span className="text-2xl font-black text-neutral-900 font-mono">
              {overallStats.total}
            </span>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-150">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-[11px] font-medium">Средний балл</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-black text-neutral-900 font-mono">
              {overallStats.avgScore}%
            </span>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-150">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-[11px] font-medium">Сдано успешно</span>
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-2xl font-black text-neutral-900 font-mono">
              {overallStats.passRate}%
            </span>
          </div>

          <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-[11px] font-medium">Прервано</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-2xl font-black text-amber-900 font-mono">
              {overallStats.abandonedCount}
            </span>
          </div>
        </div>

        {/* Filters and search bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Все сдачи ({testAttempts.length})
            </button>
            <button
              onClick={() => setFilterType('exam')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === 'exam'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Только Гос. экзамен
            </button>
            <button
              onClick={() => setFilterType('topic')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === 'topic'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Тематические билеты
            </button>
            <button
              onClick={() => setFilterType('abandoned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === 'abandoned'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Прерванные ({testAttempts.filter((a) => a.abandoned).length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Поиск по фамилии или билету..."
              className="w-full pl-8 pr-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Attempts Table Card */}
      <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900">
            Протокол прохождений ({filteredAttempts.length})
          </h3>
          <span className="text-xs text-neutral-400 font-medium">
            Сортировка: по дате (сначала новые)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200 text-[11px] uppercase tracking-wider">
                <th className="p-3.5 pl-5">Курсант (ФИО)</th>
                <th className="p-3.5">Группа</th>
                <th className="p-3.5">Тест / Экзамен</th>
                <th className="p-3.5 text-center">Результат</th>
                <th className="p-3.5 text-center">Ошибки / Прогресс</th>
                <th className="p-3.5 text-center">Время</th>
                <th className="p-3.5 text-right pr-5">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredAttempts.map((attempt) => {
                const isExam = attempt.isExam;
                const errorsCount = attempt.totalQuestions - attempt.correctAnswers;
                const grp = groups.find((g) => g.id === attempt.userGroup);
                const isAkpp = grp?.transmission === 'АКПП' || attempt.userGroup.includes('akpp');

                return (
                  <tr key={attempt.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="p-3.5 pl-5 font-bold text-neutral-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[11px] font-bold shrink-0">
                          {attempt.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="block">{attempt.userName}</span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            {attempt.dateStr}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          isAkpp
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}
                      >
                        {getGroupName(attempt.userGroup)}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="space-y-0.5 max-w-xs">
                        <span className="font-semibold text-neutral-800 block truncate">
                          {attempt.categoryTitle}
                        </span>
                        {isExam && (
                          <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            Экзамен
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      {attempt.abandoned ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="font-bold text-[11px] whitespace-nowrap">Не закончил (прерван)</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                              attempt.passed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {attempt.scorePercent}%
                          </span>
                          {attempt.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600" />
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-center font-mono text-neutral-600">
                      {attempt.abandoned ? (
                        <span className="text-amber-800 text-[11px] font-sans font-medium">
                          Отвечено {attempt.answeredCount ?? attempt.correctAnswers} из {attempt.totalQuestions}
                        </span>
                      ) : (
                        <>
                          {errorsCount > 0 ? (
                            <span className="text-rose-600 font-semibold">{errorsCount}</span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">0</span>
                          )}{' '}
                          / {attempt.totalQuestions}
                        </>
                      )}
                    </td>

                    <td className="p-3.5 text-center font-mono text-neutral-500">
                      {Math.floor(attempt.timeSpentSeconds / 60)}:
                      {String(attempt.timeSpentSeconds % 60).padStart(2, '0')}
                    </td>

                    <td className="p-3.5 text-right pr-5">
                      <button
                        onClick={() => {
                          if (confirm(`Удалить запись курсанта ${attempt.userName}?`)) {
                            deleteTestAttempt(attempt.id);
                          }
                        }}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Удалить попытку из ведомости"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredAttempts.length === 0 && (
            <div className="py-16 text-center text-neutral-400 text-xs">
              Записей в ведомости не найдено.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
