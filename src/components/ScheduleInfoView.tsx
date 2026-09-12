import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ScheduleItem, GroupType } from '../types';
import {
  CalendarClock,
  Car,
  BookOpen,
  MapPin,
  Clock,
  Phone,
  User,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const ScheduleInfoView: React.FC = () => {
  const { schedule, addScheduleItem, updateScheduleItem, deleteScheduleItem, isAdmin, selectedGroupTab, groups, getGroupName } =
    useApp();

  const [activeTab, setActiveTab] = useState<'schedule' | 'exam_handbook'>('schedule');

  // Admin Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'driving' as 'theory' | 'driving',
    group: 'all' as string,
    title: '',
    dayTime: '',
    location: '',
    instructor: '',
    carModel: '',
    notes: '',
    contactPhone: '',
  });

  const filteredSchedule = useMemo(() => {
    return schedule.filter((item) => {
      if (selectedGroupTab !== 'all' && item.group !== 'all' && item.group !== selectedGroupTab) {
        return false;
      }
      return true;
    });
  }, [schedule, selectedGroupTab]);

  const theoryItems = filteredSchedule.filter((s) => s.type === 'theory');
  const drivingItems = filteredSchedule.filter((s) => s.type === 'driving');

  const handleOpenModal = (item?: ScheduleItem) => {
    if (item) {
      setEditingItemId(item.id);
      setFormData({
        type: item.type,
        group: item.group,
        title: item.title,
        dayTime: item.dayTime,
        location: item.location,
        instructor: item.instructor,
        carModel: item.carModel || '',
        notes: item.notes || '',
        contactPhone: item.contactPhone || '',
      });
    } else {
      setEditingItemId(null);
      setFormData({
        type: 'driving',
        group: 'group7_mkpp',
        title: '',
        dayTime: 'Понедельник - Пятница, 08:00 – 18:00',
        location: 'Учебный автодром "Южный"',
        instructor: '',
        carModel: '',
        notes: '',
        contactPhone: '+7 (900) 000-00-00',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.dayTime.trim()) return;

    if (editingItemId) {
      updateScheduleItem(editingItemId, {
        type: formData.type,
        group: formData.group,
        title: formData.title.trim(),
        dayTime: formData.dayTime.trim(),
        location: formData.location.trim(),
        instructor: formData.instructor.trim(),
        carModel: formData.carModel.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
      });
    } else {
      addScheduleItem({
        type: formData.type,
        group: formData.group,
        title: formData.title.trim(),
        dayTime: formData.dayTime.trim(),
        location: formData.location.trim(),
        instructor: formData.instructor.trim(),
        carModel: formData.carModel.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Организационная информация</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900">
            Расписание занятий и вождения
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Время лекций по ПДД, практические часы на автодроме и в городе для Групп №7 (МКПП) и №8 (АКПП)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub tabs */}
          <div className="flex items-center p-1 bg-neutral-100 rounded-xl border border-neutral-200">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'schedule'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Расписание
            </button>
            <button
              onClick={() => setActiveTab('exam_handbook')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'exam_handbook'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Памятка курсанта
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => handleOpenModal()}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить пункт</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* 1. Теоретические занятия */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                Теоретические занятия (ПДД)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {theoryItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-100">
                        {item.group === 'all'
                          ? 'Общее (Гр. 7 и 8)'
                          : item.group === 'group7_mkpp'
                          ? 'Группа №7 (МКПП)'
                          : 'Группа №8 (АКПП)'}
                      </span>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-1 text-neutral-400 hover:text-amber-600 rounded"
                            title="Редактировать"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Удалить этот пункт расписания?')) {
                                deleteScheduleItem(item.id);
                              }
                            }}
                            className="p-1 text-neutral-400 hover:text-red-600 rounded"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-neutral-900">{item.title}</h4>

                    <div className="space-y-1.5 text-xs text-neutral-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-semibold text-neutral-800">{item.dayTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Преподаватель: {item.instructor}</span>
                      </div>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-neutral-500 bg-neutral-50 p-2 rounded-xl border border-neutral-150">
                      {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Практические занятия по вождению */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                Практическое вождение (Автодром и Город)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drivingItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          item.group === 'group7_mkpp'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-indigo-100 text-indigo-900'
                        }`}
                      >
                        {item.group === 'group7_mkpp'
                          ? 'МКПП • Группа №7'
                          : 'АКПП • Группа №8'}
                      </span>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-1 text-neutral-400 hover:text-amber-600 rounded"
                            title="Редактировать"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Удалить этот пункт расписания?')) {
                                deleteScheduleItem(item.id);
                              }
                            }}
                            className="p-1 text-neutral-400 hover:text-red-600 rounded"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-neutral-900">{item.title}</h4>

                    <div className="space-y-1.5 text-xs text-neutral-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-neutral-800">{item.dayTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{item.location}</span>
                      </div>
                      {item.carModel && (
                        <div className="flex items-center gap-2">
                          <Car className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="font-medium text-neutral-800">
                            Автомобиль: {item.carModel}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Инструктор: {item.instructor}</span>
                      </div>
                      {item.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <a
                            href={`tel:${item.contactPhone}`}
                            className="text-blue-600 hover:underline font-mono"
                          >
                            {item.contactPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-150">
                      {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: EXAM HANDBOOK */}
      {activeTab === 'exam_handbook' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Autodrome Exercises */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Упражнения на автодроме (Категория B)</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Обязательный комплекс практических маневров перед выездом в город:
              </p>
              <div className="space-y-2">
                {[
                  {
                    name: 'Остановка и трогание на подъеме ("Горка / Эстакада")',
                    desc: 'Для МКПП (Гр. 7): трогание с ручника или на балансе сцепления без отката более 30 см. Для АКПП (Гр. 8): плавный перенос ноги с тормоза на газ.',
                  },
                  {
                    name: 'Параллельная парковка задним ходом',
                    desc: 'Заезд задним ходом в габаритный карман без пересечения контрольных линий разметки.',
                  },
                  {
                    name: 'Въезд в бокс (гараж) под углом 90° задним ходом',
                    desc: 'Контроль боковых зеркал и дистанции до задней контрольной линии.',
                  },
                  {
                    name: 'Разворот в ограниченном пространстве',
                    desc: 'Однократное включение задней передачи в трехметровом коридоре.',
                  },
                  {
                    name: 'Маневрирование в ограниченном пространстве ("Змейка")',
                    desc: 'Плавное прохождение череды крутых поворотов на минимальной скорости.',
                  },
                ].map((ex, i) => (
                  <div key={i} className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-150 text-xs">
                    <span className="font-bold text-neutral-900 block">{ex.name}</span>
                    <p className="text-[11px] text-neutral-600 mt-0.5">{ex.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Exam Procedure */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Регламент государственного экзамена ГИБДД</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Критерии выставления оценки «СДАЛ» и система штрафных баллов:
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-blue-950">
                  <span className="font-bold block mb-1">1. Теоретический экзамен:</span>
                  <p>
                    20 вопросов за 20 минут. Допускается максимум 2 ошибки (в разных тематических блоках). За каждую ошибку дается 5 дополнительных вопросов по этой же теме без права на повторную ошибку.
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-950">
                  <span className="font-bold block mb-1">2. Практический экзамен в городе:</span>
                  <p>
                    Экзамен длится не менее 30 минут. Кандидат в водители допускается набрать не более 7 штрафных баллов (грубые ошибки — сразу 7 баллов: непредоставление преимущества, выезд на встречную полосу, проезд на красный свет).
                  </p>
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-700">
                  <span className="font-bold text-neutral-900 block mb-1">
                    Необходимые документы к экзамену:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    <li>Паспорт РФ</li>
                    <li>Медицинская справка по форме 003-В/у</li>
                    <li>Свидетельство об окончании автошколы</li>
                    <li>Квитанция об оплате госпошлины за выдачу водительского удостоверения</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Schedule Modal */}
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
              {editingItemId ? 'Редактировать пункт расписания' : 'Добавить пункт расписания'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Тип занятия</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as 'theory' | 'driving' })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="theory">Теория (ПДД)</option>
                    <option value="driving">Практика (Вождение)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Группа</label>
                  <select
                    value={formData.group}
                    onChange={(e) =>
                      setFormData({ ...formData, group: e.target.value })
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
                <label className="font-semibold text-neutral-700 block mb-1">Название занятия</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="например, Вождение МКПП: Автодром и упражнение Эстакада"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Дни недели и время</label>
                <input
                  type="text"
                  required
                  value={formData.dayTime}
                  onChange={(e) => setFormData({ ...formData, dayTime: e.target.value })}
                  placeholder="Понедельник и Среда, 18:30 – 20:45 или Пн-Сб 08:00-19:00"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Место проведения</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Аудитория 204 или Автодром Южный"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Преподаватель / Инструктор</label>
                  <input
                    type="text"
                    required
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    placeholder="ФИО преподавателя"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Автомобиль (для вождения)</label>
                  <input
                    type="text"
                    value={formData.carModel}
                    onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                    placeholder="Lada Vesta (МКПП)"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Телефон для записи</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+7 (900) 000-00-00"
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Примечания и рекомендации</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="При себе иметь паспорт, удобную обувь..."
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
                  {editingItemId ? 'Сохранить изменения' : 'Создать пункт'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
