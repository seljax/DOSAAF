import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CompletedLesson, GroupType } from '../types';
import {
  GraduationCap,
  Calendar,
  User,
  CheckCircle,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  FileText,
  Bookmark,
  ChevronDown,
  ChevronUp,
  BookCheck,
  Eye,
  ExternalLink,
} from 'lucide-react';

export const CompletedLessonsView: React.FC = () => {
  const { lessons, addLesson, updateLesson, deleteLesson, isAdmin, selectedGroupTab, getGroupName, groups } =
    useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(lessons[0]?.id || null);

  // Full Lecture modal for absent students
  const [activeFullLecture, setActiveFullLecture] = useState<CompletedLesson | null>(null);

  // Admin Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    topic: '',
    group: 'all' as GroupType,
    instructor: 'Смирнов В. А.',
    description: '',
    fullLectureNotes: '',
    keyPointsText: '',
    homework: '',
  });

  // Filter lessons by search and selected group tab
  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      // group filter
      if (selectedGroupTab !== 'all' && l.group !== 'all' && l.group !== selectedGroupTab) {
        return false;
      }

      // search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTopic = l.topic.toLowerCase().includes(q);
        const inDesc = l.description.toLowerCase().includes(q);
        const inNotes = (l.fullLectureNotes || '').toLowerCase().includes(q);
        const inDate = l.date.toLowerCase().includes(q);
        return inTopic || inDesc || inNotes || inDate;
      }
      return true;
    });
  }, [lessons, selectedGroupTab, searchQuery]);

  const handleOpenModal = (lessonToEdit?: CompletedLesson) => {
    if (lessonToEdit) {
      setEditingLessonId(lessonToEdit.id);
      setFormData({
        date: lessonToEdit.date,
        topic: lessonToEdit.topic,
        group: lessonToEdit.group,
        instructor: lessonToEdit.instructor,
        description: lessonToEdit.description,
        fullLectureNotes: lessonToEdit.fullLectureNotes || '',
        keyPointsText: (lessonToEdit.keyPoints || []).join('\n'),
        homework: lessonToEdit.homework || '',
      });
    } else {
      const now = new Date();
      const defaultDate = `${String(now.getDate()).padStart(2, '0')}.${String(
        now.getMonth() + 1
      ).padStart(2, '0')}.${now.getFullYear()}`;

      setEditingLessonId(null);
      setFormData({
        date: defaultDate,
        topic: '',
        group: 'all',
        instructor: 'Смирнов В. А.',
        description: '',
        fullLectureNotes: '',
        keyPointsText: '',
        homework: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim() || !formData.date.trim()) return;

    const keyPoints = formData.keyPointsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (editingLessonId) {
      updateLesson(editingLessonId, {
        date: formData.date.trim(),
        topic: formData.topic.trim(),
        group: formData.group,
        instructor: formData.instructor.trim(),
        description: formData.description.trim(),
        fullLectureNotes: formData.fullLectureNotes.trim() || undefined,
        keyPoints,
        homework: formData.homework.trim() || undefined,
      });
    } else {
      addLesson({
        date: formData.date.trim(),
        topic: formData.topic.trim(),
        group: formData.group,
        instructor: formData.instructor.trim(),
        description: formData.description.trim(),
        fullLectureNotes: formData.fullLectureNotes.trim() || undefined,
        keyPoints,
        homework: formData.homework.trim() || undefined,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Filter */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Журнал учебного процесса</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900">
            Пройденные занятия и лекции
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Конспекты проведенных лекций, полный разбор тем для отсутствовавших курсантов и домашние задания
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по теме, конспекту..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => handleOpenModal()}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить занятие</span>
            </button>
          )}
        </div>
      </div>

      {/* Timeline of Lessons */}
      <div className="space-y-4">
        {filteredLessons.map((lesson) => {
          const isExpanded = expandedLessonId === lesson.id;

          return (
            <div
              key={lesson.id}
              className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs hover:border-neutral-300 transition-all"
            >
              {/* Lesson Header Card */}
              <div
                onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer hover:bg-neutral-50/50 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold bg-neutral-900 text-white px-2.5 py-0.5 rounded-lg">
                      Проведенные занятия {lesson.date}
                    </span>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        lesson.group === 'group7_mkpp'
                          ? 'bg-blue-100 text-blue-800'
                          : lesson.group === 'group8_akpp'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {getGroupName(lesson.group)}
                    </span>

                    <span className="text-xs text-neutral-500 flex items-center gap-1 font-medium">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      {lesson.instructor}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 leading-snug">
                    Тема: {lesson.topic}
                  </h3>

                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                    {lesson.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && (
                    <div
                      className="flex items-center gap-1 mr-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleOpenModal(lesson)}
                        className="p-1.5 text-neutral-400 hover:text-amber-600 rounded-lg hover:bg-neutral-100"
                        title="Редактировать занятие"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Удалить занятие за ${lesson.date}?`)) {
                            deleteLesson(lesson.id);
                          }
                        }}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Удалить занятие"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <button className="p-1 text-neutral-400">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Lesson Content */}
              {isExpanded && (
                <div className="px-4 pb-5 pt-1 sm:px-6 border-t border-neutral-100 space-y-4 bg-neutral-50/40 animate-in fade-in duration-150">
                  <div className="text-xs text-neutral-700 leading-relaxed bg-white p-4 rounded-2xl border border-neutral-200">
                    <span className="font-bold text-neutral-900 block mb-1">
                      Краткое содержание лекции:
                    </span>
                    <p className="whitespace-pre-line">{lesson.description}</p>
                  </div>

                  {/* Absent student special reading prompt */}
                  <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                        <BookCheck className="w-4 h-4 text-blue-700" />
                        Пропустили это занятие?
                      </span>
                      <p className="text-[11px] text-blue-800">
                        Изучите полный теоретический конспект темы с разбором пунктов ПДД и примерами
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveFullLecture(lesson)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Читать полную лекцию</span>
                    </button>
                  </div>

                  {lesson.keyPoints && lesson.keyPoints.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-neutral-900 block mb-2">
                        Изученные вопросы и тезисы:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {lesson.keyPoints.map((pt, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-xs text-neutral-700 bg-white p-2.5 rounded-xl border border-neutral-200"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {lesson.homework && (
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                        <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                        Домашнее задание к следующему занятию:
                      </span>
                      <p>{lesson.homework}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredLessons.length === 0 && (
          <div className="py-12 text-center text-neutral-400 text-xs">
            Занятия не найдены.
          </div>
        )}
      </div>

      {/* FULL LECTURE MODAL FOR ABSENT STUDENTS */}
      {activeFullLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-5">
            <button
              onClick={() => setActiveFullLecture(null)}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold bg-neutral-900 text-white px-2.5 py-0.5 rounded-lg">
                  {activeFullLecture.date}
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {getGroupName(activeFullLecture.group)}
                </span>
                <span className="text-xs text-neutral-500 font-medium">
                  Преподаватель: {activeFullLecture.instructor}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-neutral-900">
                {activeFullLecture.topic}
              </h2>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs leading-relaxed text-neutral-700">
              <span className="font-bold text-neutral-900 block mb-1">Краткий обзор:</span>
              <p>{activeFullLecture.description}</p>
            </div>

            {/* Complete Lecture Transcript / Notes */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Полный текст лекции и учебные материалы</span>
              </h4>

              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-neutral-200 text-xs text-neutral-800 leading-relaxed font-sans whitespace-pre-line shadow-xs">
                {activeFullLecture.fullLectureNotes ||
                  `Подробный расширенный конспект для этой темы еще подготавливается преподавателем. Используйте краткое содержание выше, тезисы и домашнее задание для подготовки.`}
              </div>
            </div>

            {/* Key takeaways */}
            {activeFullLecture.keyPoints && activeFullLecture.keyPoints.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-900 block">
                  Главные правила, которые необходимо выучить:
                </span>
                <div className="space-y-1.5">
                  {activeFullLecture.keyPoints.map((pt, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-150 flex items-start gap-2 text-xs text-neutral-700"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Homework in modal */}
            {activeFullLecture.homework && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950">
                <span className="font-bold block mb-1">Домашнее задание:</span>
                <p>{activeFullLecture.homework}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveFullLecture(null)}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold"
              >
                Закрыть лекцию
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add/Edit Lesson Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-neutral-900 mb-4">
              {editingLessonId ? 'Редактировать занятие' : 'Добавить проведенное занятие'}
            </h3>

            <form onSubmit={handleSaveLesson} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Дата проведения
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="09.09.2026"
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Группа</label>
                  <select
                    value={formData.group}
                    onChange={(e) =>
                      setFormData({ ...formData, group: e.target.value as GroupType })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="all">Для всех групп</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.transmission})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Тема проведенного занятия
                </label>
                <input
                  type="text"
                  required
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="например, Проезд регулируемых перекрестков и сигналы регулировщика"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Преподаватель / Инструктор
                </label>
                <input
                  type="text"
                  required
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  placeholder="Смирнов В. А."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Краткое содержание лекции
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Что разобрали на занятии..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Полный текст лекции (для отсутствовавших курсантов)
                </label>
                <textarea
                  rows={5}
                  value={formData.fullLectureNotes}
                  onChange={(e) => setFormData({ ...formData, fullLectureNotes: e.target.value })}
                  placeholder="Развернутые конспекты, пункты правил, примеры решения спорных дорожных ситуаций..."
                  className="w-full px-3 py-2 border rounded-xl font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Ключевые пункты (каждый с новой строки)
                </label>
                <textarea
                  rows={2}
                  value={formData.keyPointsText}
                  onChange={(e) => setFormData({ ...formData, keyPointsText: e.target.value })}
                  placeholder="Разворот на перекрестке&#10;Очередность проезда при горящей стрелке"
                  className="w-full px-3 py-2 border rounded-xl font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Домашнее задание / Рекомендации
                </label>
                <textarea
                  rows={2}
                  value={formData.homework}
                  onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                  placeholder="Решить билеты 7-8, повторить правила раздела 13..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 border rounded-xl text-neutral-600 hover:bg-neutral-50 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold"
                >
                  {editingLessonId ? 'Сохранить изменения' : 'Опубликовать занятие'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
