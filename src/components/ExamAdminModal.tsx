import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Question, RoadSign } from '../types';
import { RoadSignSvg } from './RoadSignSvg';
import {
  X,
  Sliders,
  Settings,
  Ticket,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Check,
  Minus,
  Sparkles,
  ArrowRight,
  Shield,
  ShieldCheck,
  Clock,
  Timer,
  Lock,
  Unlock,
  RotateCcw,
  Truck,
  Car,
  Layers,
  ChevronRight,
  HelpCircle,
  FolderPlus,
  FileQuestion,
  Users,
  Shuffle,
} from 'lucide-react';

interface ExamAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'tickets' | 'questions' | 'settings';
  onEditQuestion: (question: Question) => void;
  onCreateQuestionInTicket: (ticketNumber: number) => void;
}

export const ExamAdminModal: React.FC<ExamAdminModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'tickets',
  onEditQuestion,
  onCreateQuestionInTicket,
}) => {
  const {
    questions,
    categories,
    signs,
    examSettings,
    updateExamSettings,
    updateQuestion,
    deleteQuestion,
    batchAssignQuestionsToTicket,
    distributeQuestionsAcrossTickets,
    getGroupName,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tickets' | 'questions' | 'settings'>(defaultTab);

  // Tickets Editor State
  const [selectedTicket, setSelectedTicket] = useState<number>(1);
  const [isAddPickerOpen, setIsAddPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCatFilter, setPickerCatFilter] = useState('all');
  const [selectedPickerQIds, setSelectedPickerQIds] = useState<string[]>([]);

  // Questions Bank Tab State
  const [qSearch, setQSearch] = useState('');
  const [qCatFilter, setQCatFilter] = useState('all');
  const [qPoolFilter, setQPoolFilter] = useState<'all' | 'included' | 'excluded'>('all');
  const [qTargetFilter, setQTargetFilter] = useState<'all' | 'B' | 'C'>('all');
  const [qTicketFilter, setQTicketFilter] = useState<string>('all');

  // Local Settings Form
  const [localSettings, setLocalSettings] = useState(examSettings);

  // Keep localSettings in sync if examSettings updates externally
  React.useEffect(() => {
    setLocalSettings(examSettings);
  }, [examSettings]);

  // Max tickets available (up to 40)
  const totalTickets = Math.min(40, Math.max(1, examSettings.totalTickets || 40));
  const ticketList = useMemo(() => {
    return Array.from({ length: totalTickets }, (_, i) => i + 1);
  }, [totalTickets]);

  // Questions in current selected ticket
  const questionsInCurrentTicket = useMemo(() => {
    return questions.filter((q) => (q.ticketNumber || 1) === selectedTicket && q.includeInExam !== false);
  }, [questions, selectedTicket]);

  // Filtered list for Questions Bank tab
  const filteredBankQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (qPoolFilter === 'included' && q.includeInExam === false) return false;
      if (qPoolFilter === 'excluded' && q.includeInExam !== false) return false;
      if (qCatFilter !== 'all' && q.categoryId !== qCatFilter) return false;
      if (qTicketFilter !== 'all') {
        const tNum = parseInt(qTicketFilter, 10);
        if ((q.ticketNumber || 1) !== tNum) return false;
      }
      const isC = q.categoryType === 'C' || q.groupTarget === 'group3_c';
      if (qTargetFilter === 'B' && isC) return false;
      if (qTargetFilter === 'C' && !isC) return false;
      if (qSearch.trim()) {
        const needle = qSearch.toLowerCase();
        const matchesText = q.questionText.toLowerCase().includes(needle);
        const matchesOptions = q.options.some((opt) => opt.toLowerCase().includes(needle));
        if (!matchesText && !matchesOptions) return false;
      }
      return true;
    });
  }, [questions, qPoolFilter, qCatFilter, qTicketFilter, qTargetFilter, qSearch]);

  // Candidate questions for picker (questions not currently in selectedTicket)
  const candidateQuestionsForPicker = useMemo(() => {
    return questions.filter((q) => {
      if ((q.ticketNumber || 1) === selectedTicket && q.includeInExam !== false) return false;
      if (pickerCatFilter !== 'all' && q.categoryId !== pickerCatFilter) return false;
      if (pickerSearch.trim()) {
        const needle = pickerSearch.toLowerCase();
        if (!q.questionText.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [questions, selectedTicket, pickerCatFilter, pickerSearch]);

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateExamSettings(localSettings);
    alert('Параметры и регламент государственного экзамена успешно сохранены!');
  };

  const handleAddRandomToTicket = () => {
    const unassigned = questions.filter((q) => (q.ticketNumber || 1) !== selectedTicket);
    const need = Math.max(1, (examSettings.questionCount || 20) - questionsInCurrentTicket.length);
    const picked = [...unassigned].sort(() => 0.5 - Math.random()).slice(0, need);
    if (picked.length === 0) {
      alert('Нет доступных вопросов для добавления.');
      return;
    }
    batchAssignQuestionsToTicket(picked.map((q) => q.id), selectedTicket);
  };

  const handleClearCurrentTicket = () => {
    if (confirm(`Вы действительно хотите удалить все вопросы из Билета №${selectedTicket}? Вопросы останутся в базе, но не будут привязаны к этому билету.`)) {
      const qIds = questionsInCurrentTicket.map((q) => q.id);
      batchAssignQuestionsToTicket(qIds, undefined);
    }
  };

  const handleAddSelectedFromPicker = () => {
    if (selectedPickerQIds.length === 0) return;
    batchAssignQuestionsToTicket(selectedPickerQIds, selectedTicket);
    setSelectedPickerQIds([]);
    setIsAddPickerOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-neutral-200 p-4 sm:p-6 max-h-[95vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-neutral-200 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0 shadow-xs font-black">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-neutral-900 leading-tight">
                  Управление экзаменом
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300 uppercase tracking-wider">
                  Будте внимательны!
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Редактирование каждого билета, банк экзаменационных вопросов и регламент тестирования.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
            title="Закрыть окно"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Tabs Navigation */}
        <div className="flex items-center gap-1.5 p-1.5 bg-neutral-100 rounded-2xl border border-neutral-200 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-amber-400 text-neutral-950 shadow-sm font-black'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Редактор билетов (№1–{totalTickets})</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-900/10 font-mono font-bold">
              {totalTickets} бил.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-amber-400 text-neutral-950 shadow-sm font-black'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Банк всех вопросов</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-900/10 font-mono font-bold">
              {questions.length} вопр.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-400 text-neutral-950 shadow-sm font-black'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Параметры и регламент</span>
          </button>
        </div>

        {/* TAB 1: TICKET EDITOR */}
        {activeTab === 'tickets' && (
          <div className="flex-1 flex flex-col space-y-3 min-h-0 overflow-hidden">
            <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-3 shrink-0 space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
                <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-amber-600" />
                  <span>Выберите билет для просмотра и редактирования:</span>
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 text-[11px]">Всего билетов:</span>
                  <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg p-0.5">
                    <button
                      type="button"
                      disabled={totalTickets <= 1}
                      onClick={() => {
                        const next = Math.max(1, totalTickets - 1);
                        updateExamSettings({ totalTickets: next });
                        if (selectedTicket > next) setSelectedTicket(next);
                      }}
                      className="px-2 py-0.5 text-xs font-bold hover:bg-neutral-100 rounded disabled:opacity-30 cursor-pointer"
                      title="Уменьшить количество билетов"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold px-2 text-xs text-neutral-900">{totalTickets}</span>
                    <button
                      type="button"
                      disabled={totalTickets >= 40}
                      onClick={() => {
                        const next = Math.min(40, totalTickets + 1);
                        updateExamSettings({ totalTickets: next });
                      }}
                      className="px-2 py-0.5 text-xs font-bold hover:bg-neutral-100 rounded disabled:opacity-30 cursor-pointer"
                      title="Добавить билет (максимум 40)"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                {ticketList.map((tNum) => {
                  const qCount = questions.filter(
                    (q) => (q.ticketNumber || 1) === tNum && q.includeInExam !== false
                  ).length;
                  const isSelected = selectedTicket === tNum;
                  const isStandardCount = qCount === (examSettings.questionCount || 20);

                  return (
                    <button
                      key={tNum}
                      type="button"
                      onClick={() => setSelectedTicket(tNum)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <span>Билет №{tNum}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          isSelected
                            ? 'bg-amber-400 text-neutral-950'
                            : isStandardCount
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {qCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-400/30 flex items-center justify-between gap-4 flex-wrap shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm text-neutral-900">
                    Билет №{selectedTicket}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      questionsInCurrentTicket.length === (examSettings.questionCount || 20)
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {questionsInCurrentTicket.length} из {examSettings.questionCount || 20} вопросов
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  {questionsInCurrentTicket.length === (examSettings.questionCount || 20)
                    ? 'Билет полностью укомплектован по стандарту экзамена.'
                    : `Рекомендуется 20 вопросов для стандарта ГИБДД. Не хватает: ${Math.max(
                        0,
                        (examSettings.questionCount || 20) - questionsInCurrentTicket.length
                      )} вопр.`}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => onCreateQuestionInTicket(selectedTicket)}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Создать новый вопрос прямо в этот билет"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Создать вопрос</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddPickerOpen(true)}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Выбрать существующие вопросы из базы и привязать к этому билету"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Добавить из базы</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddRandomToTicket}
                  className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-xl font-medium transition-colors cursor-pointer"
                  title="Дополнить билет случайными вопросами до 20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Дополнить до 20</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Равномерно распределить все вопросы пула экзамена по билетам (1..${totalTickets})?`)) {
                      distributeQuestionsAcrossTickets(totalTickets);
                    }
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-xl font-medium transition-colors cursor-pointer"
                  title="Автоматически распределить все вопросы по всем билетам"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Авто-распределение</span>
                </button>

                {questionsInCurrentTicket.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCurrentTicket}
                    className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl font-medium transition-colors cursor-pointer"
                    title="Очистить билет"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
              {questionsInCurrentTicket.length === 0 ? (
                <div className="p-10 text-center bg-neutral-50 rounded-3xl border border-dashed border-neutral-300 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <FileQuestion className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-neutral-800 text-sm">В Билете №{selectedTicket} пока нет вопросов</h5>
                    <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                      Вы можете добавить существующие вопросы из банка, создать новый вопрос прямо в этот билет или использовать авто-распределение.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddPickerOpen(true)}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Выбрать вопросы из банка</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddRandomToTicket}
                      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Заполнить билет 20 вопросами</span>
                    </button>
                  </div>
                </div>
              ) : (
                questionsInCurrentTicket.map((q, idx) => {
                  const cat = categories.find((c) => c.id === q.categoryId);
                  const isC = q.categoryType === 'C' || q.groupTarget === 'group3_c';

                  return (
                    <div
                      key={q.id}
                      className="p-3.5 bg-white rounded-2xl border border-neutral-200 hover:border-neutral-300 transition-all shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
                            <span className="px-2 py-0.5 rounded bg-neutral-900 text-white font-mono">
                              № {idx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                              {cat?.title || 'Общая тема'}
                            </span>
                            {isC ? (
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                <span>Кат. «C»</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                <span>Кат. «B»</span>
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Билет №{selectedTicket}
                            </span>
                          </div>

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
                                    <RoadSignSvg sign={signs.find((s) => s.id === q.signId)!} size={44} />
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <p className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                            {q.questionText}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = oIdx === q.correctAnswerIndex;
                              return (
                                <div
                                  key={oIdx}
                                  className={`px-2.5 py-1 rounded-xl border flex items-center gap-2 ${
                                    isCorrect
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                                      : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                                  }`}
                                >
                                  <span
                                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
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

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-neutral-400 font-medium">Билет:</span>
                            <select
                              value={q.ticketNumber || selectedTicket}
                              onChange={(e) => {
                                const newT = parseInt(e.target.value, 10);
                                updateQuestion(q.id, { ticketNumber: newT, includeInExam: true });
                              }}
                              className="px-2 py-1 bg-neutral-100 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-800 cursor-pointer"
                              title="Переместить этот вопрос в другой билет"
                            >
                              {ticketList.map((t) => (
                                <option key={t} value={t}>
                                  №{t}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => onEditQuestion(q)}
                            className="px-3 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-neutral-500" />
                            <span>Изменить</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              updateQuestion(q.id, { ticketNumber: undefined });
                            }}
                            className="px-2 py-1 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] transition-colors cursor-pointer"
                            title="Убрать вопрос из этого билета"
                          >
                            Убрать из билета
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: QUESTIONS BANK TAB */}
        {activeTab === 'questions' && (
          <div className="flex-1 flex flex-col space-y-3 min-h-0 overflow-hidden">
            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5 shrink-0 text-xs">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    value={qSearch}
                    onChange={(e) => setQSearch(e.target.value)}
                    placeholder="Поиск по вопросу или вариантам..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-neutral-400" />
                  <select
                    value={qCatFilter}
                    onChange={(e) => setQCatFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs"
                  >
                    <option value="all">Все категории ({questions.length})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-neutral-400" />
                  <select
                    value={qTicketFilter}
                    onChange={(e) => setQTicketFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs"
                  >
                    <option value="all">Все билеты</option>
                    {ticketList.map((t) => (
                      <option key={t} value={String(t)}>
                        Билет №{t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center p-1 bg-neutral-200/60 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setQPoolFilter('all')}
                    className={`px-2 py-1 rounded-lg font-medium transition-all ${
                      qPoolFilter === 'all' ? 'bg-white text-neutral-900 shadow-xs font-bold' : 'text-neutral-600'
                    }`}
                  >
                    Все ({questions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQPoolFilter('included')}
                    className={`px-2 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                      qPoolFilter === 'included'
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'text-neutral-600 hover:text-emerald-700'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    В экзамене ({questions.filter((q) => q.includeInExam !== false).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQPoolFilter('excluded')}
                    className={`px-2 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                      qPoolFilter === 'excluded'
                        ? 'bg-neutral-800 text-white shadow-xs font-bold'
                        : 'text-neutral-600'
                    }`}
                  >
                    <Minus className="w-3 h-3" />
                    Исключены ({questions.filter((q) => q.includeInExam === false).length})
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1 border-t border-neutral-200 flex-wrap text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-neutral-500 font-medium">Массовые действия:</span>
                  <button
                    type="button"
                    onClick={() => {
                      questions.forEach((q) => {
                        if (q.includeInExam === false) updateQuestion(q.id, { includeInExam: true });
                      });
                    }}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Включить все в экзамен
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      questions.forEach((q) => {
                        const isC = q.categoryType === 'C' || q.groupTarget === 'group3_c';
                        updateQuestion(q.id, { includeInExam: !isC });
                      });
                    }}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Только Кат. B
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      questions.forEach((q) => {
                        const isC = q.categoryType === 'C' || q.groupTarget === 'group3_c';
                        updateQuestion(q.id, { includeInExam: isC });
                      });
                    }}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Только Кат. C
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onCreateQuestionInTicket(selectedTicket)}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Создать вопрос</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
              {filteredBankQuestions.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-500 text-xs">
                  По заданным фильтрам вопросов не найдено.
                </div>
              ) : (
                filteredBankQuestions.map((q, idx) => {
                  const cat = categories.find((c) => c.id === q.categoryId);
                  const isIncluded = q.includeInExam !== false;
                  const isC = q.categoryType === 'C' || q.groupTarget === 'group3_c';

                  return (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isIncluded
                          ? 'bg-white border-neutral-200 hover:border-neutral-300 shadow-xs'
                          : 'bg-neutral-50/80 border-neutral-200 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
                            <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                              № {idx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                              {cat?.title || 'Общая тема'}
                            </span>
                            {isC ? (
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                <span>Кат. «C»</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                <span>Кат. «B»</span>
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              Билет №{q.ticketNumber || 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded ${
                                isIncluded
                                  ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {isIncluded ? '✓ В экзамене' : '✕ Исключен'}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                            {q.questionText}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuestion(q.id, { includeInExam: !isIncluded })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isIncluded
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700'
                            }`}
                          >
                            {isIncluded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>{isIncluded ? 'В экзамене' : 'Включить'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditQuestion(q)}
                            className="p-1.5 border border-neutral-200 hover:bg-neutral-100 rounded-lg text-neutral-700 cursor-pointer"
                            title="Редактировать вопрос"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Удалить этот вопрос из базы?')) deleteQuestion(q.id);
                            }}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
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
          </div>
        )}

        {/* TAB 3: SETTINGS & REGULATIONS */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto pr-1 min-h-0">
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs max-w-3xl mx-auto py-1">
              {/* Total Tickets Count Setting */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <label className="font-bold text-neutral-900 block text-sm">
                      Количество экзаменационных билетов (до 40)
                    </label>
                    <p className="text-[11px] text-neutral-500">
                      Администратор может добавлять или убирать количество билетов. Стандарт ГИБДД: 40 билетов.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={localSettings.totalTickets || 40}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(40, parseInt(e.target.value, 10) || 1));
                        setLocalSettings({ ...localSettings, totalTickets: val });
                      }}
                      className="w-16 px-2.5 py-1.5 bg-white border border-neutral-300 rounded-xl font-mono font-bold text-center text-sm"
                    />
                    <span className="font-semibold text-neutral-600">билетов</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-neutral-400 mr-1">Быстрый выбор:</span>
                  {[10, 20, 30, 40].map((tCount) => (
                    <button
                      key={tCount}
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, totalTickets: tCount })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        (localSettings.totalTickets || 40) === tCount
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'bg-white border text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {tCount} билетов
                    </button>
                  ))}
                </div>
              </div>

              {/* Immediate Feedback Setting */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 text-sm">
                    Показывать правильные и неправильные ответы во время экзамена
                  </span>
                  <input
                    type="checkbox"
                    checked={localSettings.showImmediateFeedback === true}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, showImmediateFeedback: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  {localSettings.showImmediateFeedback === true
                    ? 'ВКЛЮЧЕНО: курсант сразу после клика видит, правильный ответ или нет, и читает комментарий ПДД.'
                    : 'ВЫКЛЮЧЕНО (регламент ГИБДД): на экзамене ответы не раскрываются, показывается только «Ответ принят». Все результаты появляются строго в конце экзамена.'}
                </p>
              </div>

              {/* Allow Question Navigation Setting */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 text-sm">
                    Разрешить переключение между вопросами на экзамене
                  </span>
                  <input
                    type="checkbox"
                    checked={localSettings.allowQuestionNavigation === true}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, allowQuestionNavigation: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  {localSettings.allowQuestionNavigation === true
                    ? 'ВКЛЮЧЕНО: курсант может свободно кликать по номерам вопросов и переключаться между ними.'
                    : 'ВЫКЛЮЧЕНО (регламент): переключаться между вопросами нельзя — вопросы решаются строго по порядку.'}
                </p>
              </div>

              {/* Shuffle Options Setting */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
                    <span>Перемешивать варианты ответов</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={localSettings.shuffleOptions === true}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, shuffleOptions: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  {localSettings.shuffleOptions === true
                    ? 'ВКЛЮЧЕНО: варианты ответов показываются в случайном порядке — курсант не запомнит расположение правильного ответа.'
                    : 'ВЫКЛЮЧЕНО: варианты ответов показываются в том порядке, в котором их задал администратор.'}
                </p>
              </div>

              {/* Ticket Exclusivity Setting */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 text-sm">
                    Блокировать уже выбранный билет для других курсантов (эксклюзивность)
                  </span>
                  <input
                    type="checkbox"
                    checked={localSettings.uniqueTicketPerStudent !== false}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, uniqueTicketPerStudent: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  {localSettings.uniqueTicketPerStudent !== false
                    ? 'ВКЛЮЧЕНО: если курсант выбрал билет, второму курсанту этот билет уже не доступен.'
                    : 'ВЫКЛЮЧЕНО: несколько курсантов могут одновременно сдавать один и тот же билет.'}
                </p>

                {(localSettings.occupiedTickets?.length || 0) > 0 && (
                  <div className="pt-2 flex items-center justify-between border-t border-neutral-200 text-[11px]">
                    <span className="text-amber-800 font-medium">
                      Занятых билетов сейчас: <strong>{localSettings.occupiedTickets?.length}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, occupiedTickets: [] })}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Сбросить список занятых билетов
                    </button>
                  </div>
                )}
              </div>

              {/* Time Limits & Passing Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <label className="font-bold text-neutral-800 block mb-1">
                    Вопросов в билете
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={40}
                    value={localSettings.questionCount || 20}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, questionCount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl font-mono text-sm font-bold"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">Стандарт: 20</span>
                </div>

                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <label className="font-bold text-neutral-800 block mb-1">
                    Время на экзамен (мин)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={localSettings.timeLimitMinutes || 20}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, timeLimitMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl font-mono text-sm font-bold"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">0 = без лимита</span>
                </div>

                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <label className="font-bold text-neutral-800 block mb-1">
                    Проходной балл (%)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={localSettings.passingPercent || 90}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, passingPercent: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl font-mono text-sm font-bold"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">90% = ≤ 2 ошибок</span>
                </div>
              </div>

              {/* General Exam Access */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 block text-sm">
                    Общий допуск к государственному экзамену
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Если выключено, экзамен блокируется глобально для всех курсантов.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.isOpen !== false}
                  onChange={(e) => setLocalSettings({ ...localSettings, isOpen: e.target.checked })}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-neutral-200 text-neutral-700 hover:bg-neutral-100 rounded-xl font-bold cursor-pointer"
                >
                  Закрыть
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold cursor-pointer shadow-sm"
                >
                  Сохранить настройки
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0 text-xs">
          <div className="text-neutral-500 text-[11px] flex items-center gap-2">
            <span>Всего вопросов в экзамене: <strong>{questions.filter((q) => q.includeInExam !== false).length}</strong></span>
            <span>•</span>
            <span>Билетов: <strong>{totalTickets}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-950 text-white rounded-xl font-bold transition-colors shadow-xs cursor-pointer"
          >
            Готово
          </button>
        </div>
      </div>

      {/* QUESTION PICKER MODAL */}
      {isAddPickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 p-5 max-h-[85vh] flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 shrink-0">
              <div>
                <h4 className="font-black text-base text-neutral-900">
                  Добавить вопросы в Билет №{selectedTicket}
                </h4>
                <p className="text-xs text-neutral-500">
                  Отметьте нужные вопросы из базы для добавления в выбранный билет.
                </p>
              </div>
              <button
                onClick={() => setIsAddPickerOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0 text-xs">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Поиск по вопросу..."
                  className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <select
                value={pickerCatFilter}
                onChange={(e) => setPickerCatFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs"
              >
                <option value="all">Все темы ({candidateQuestionsForPicker.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0 text-xs">
              {candidateQuestionsForPicker.length === 0 ? (
                <div className="p-6 text-center text-neutral-400">Нет доступных вопросов для добавления</div>
              ) : (
                candidateQuestionsForPicker.map((q) => {
                  const isChecked = selectedPickerQIds.includes(q.id);
                  const currentT = q.ticketNumber;

                  return (
                    <label
                      key={q.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-amber-50 border-amber-400'
                          : 'bg-white border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPickerQIds([...selectedPickerQIds, q.id]);
                          } else {
                            setSelectedPickerQIds(selectedPickerQIds.filter((id) => id !== q.id));
                          }
                        }}
                        className="w-4 h-4 mt-0.5 accent-amber-600 rounded shrink-0 cursor-pointer"
                      />
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-semibold">
                          <span>{categories.find((c) => c.id === q.categoryId)?.title || 'Тема'}</span>
                          {currentT && <span>• Сейчас в билете №{currentT}</span>}
                        </div>
                        <p className="font-bold text-neutral-900 leading-snug">{q.questionText}</p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0 text-xs">
              <span className="text-neutral-500 text-[11px]">
                Выбрано вопросов: <strong>{selectedPickerQIds.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPickerOpen(false)}
                  className="px-3 py-1.5 border border-neutral-200 text-neutral-600 rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  disabled={selectedPickerQIds.length === 0}
                  onClick={handleAddSelectedFromPicker}
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-neutral-950 font-bold rounded-xl shadow-xs"
                >
                  Добавить в Билет №{selectedTicket} ({selectedPickerQIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
