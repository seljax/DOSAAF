import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ActivityLog } from '../types';
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Download,
  Key,
  LogIn,
  LogOut,
  CheckCircle2,
  Award,
  ShieldCheck,
  Clock,
  User,
  Shield,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const ActivityLogsView: React.FC = () => {
  const { activityLogs, clearActivityLogs, groups, getGroupName } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  // Filter logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchesSearch =
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesAction =
        selectedActionFilter === 'all' || log.actionType === selectedActionFilter;

      const matchesGroup =
        selectedGroupFilter === 'all' || log.userGroup === selectedGroupFilter;

      return matchesSearch && matchesAction && matchesGroup;
    });
  }, [activityLogs, searchQuery, selectedActionFilter, selectedGroupFilter]);

  const handleExportLogs = () => {
    const jsonStr = JSON.stringify(activityLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dosaaf_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    if (confirm('Вы уверены, что хотите полностью очистить журнал действий курсантов?')) {
      clearActivityLogs();
    }
  };

  const getActionBadge = (type: ActivityLog['actionType']) => {
    switch (type) {
      case 'password_change':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
            <Key className="w-3 h-3 text-amber-700" />
            <span>Смена пароля</span>
          </span>
        );
      case 'login':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
            <LogIn className="w-3 h-3 text-blue-700" />
            <span>Вход в систему</span>
          </span>
        );
      case 'logout':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 flex items-center gap-1">
            <LogOut className="w-3 h-3 text-neutral-600" />
            <span>Выход</span>
          </span>
        );
      case 'test_completed':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>Тестирование</span>
          </span>
        );
      case 'exam_completed':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1">
            <Award className="w-3 h-3 text-purple-700" />
            <span>Гос. экзамен</span>
          </span>
        );
      case 'access_changed':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-sky-700" />
            <span>Смена прав</span>
          </span>
        );
      case 'settings_updated':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-700" />
            <span>Настройки сайта</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 text-neutral-700">
            Действие
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
                <span>Журнал действий курсантов (ЛОГИ)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                  {activityLogs.length} записей
                </span>
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Автоматическая регистрация действий: смена пароля курсантом, входы в систему, результаты тестов и экзаменов.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportLogs}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-200"
            title="Выгрузить журнал в файл JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Экспорт JSON</span>
          </button>
          <button
            onClick={handleClearLogs}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200"
            title="Очистить всю историю аудита"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Очистить журнал</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по ФИО курсанта (например: Иванов Иван) или тексту действия..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Action Type Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <span className="text-neutral-400 text-[11px] font-bold uppercase shrink-0 mr-1">
            Тип:
          </span>
          {[
            { id: 'all', label: 'Все' },
            { id: 'password_change', label: 'Пароли' },
            { id: 'login', label: 'Входы' },
            { id: 'test_completed', label: 'Тесты' },
            { id: 'exam_completed', label: 'Экзамены' },
            { id: 'access_changed', label: 'Права' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedActionFilter(f.id)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
                selectedActionFilter === f.id
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Group Filter */}
        <div className="shrink-0 text-xs">
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="px-2.5 py-2 border border-neutral-200 rounded-xl bg-white text-neutral-700 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Все группы</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.transmission})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-neutral-300" />
            <p className="font-semibold text-sm">Записей в журнале не найдено</p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Попробуйте сбросить поисковый запрос или фильтры по типу действия и группе.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 sm:p-4.5 hover:bg-neutral-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="pt-0.5 shrink-0">
                    {getActionBadge(log.actionType)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-neutral-900 text-sm">
                        {log.userName}
                      </span>
                      {log.userGroup && log.userGroup !== 'all' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
                          {getGroupName(log.userGroup as any)}
                        </span>
                      )}
                      {log.userRole === 'admin' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Администратор
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-neutral-800 mt-1 leading-relaxed">
                      {log.message}
                    </p>

                    {log.details && (
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Детали: {log.details}
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:text-right shrink-0 flex items-center sm:flex-col gap-2 sm:gap-0.5 text-neutral-400 text-[11px] font-mono">
                  <span className="flex items-center gap-1 font-semibold text-neutral-700">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    {log.timeStr}
                  </span>
                  <span>{log.dateStr}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
