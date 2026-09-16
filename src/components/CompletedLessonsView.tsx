import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CompletedLesson, GroupType, LessonAttachment } from '../types';
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
  Table,
  Image as ImageIcon,
  Archive,
  Download,
  Paperclip,
  UploadCloud,
  File,
  Sparkles,
  Laptop,
  Maximize2,
  ZoomIn,
  Type,
  Check,
} from 'lucide-react';

export const CompletedLessonsView: React.FC = () => {
  const { lessons, addLesson, updateLesson, deleteLesson, isAdmin, selectedGroupTab, getGroupName, groups } =
    useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(lessons[0]?.id || null);
  const [remoteOnlyFilter, setRemoteOnlyFilter] = useState(false);

  // Font size setting for lectures: 'normal' (16px), 'large' (18px), 'xlarge' (21px)
  const [lectureFontSize, setLectureFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');

  // Full Lecture modal for remote and absent students
  const [activeFullLecture, setActiveFullLecture] = useState<CompletedLesson | null>(null);

  // Image Lightbox Modal for previewing attached images (PNG, JPG)
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Admin Modal state
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
    isRemoteFriendly: true,
  });

  // Attachments in admin modal (max 16)
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  // Helper to determine attachment type from extension
  const getAttachmentType = (ext: string): LessonAttachment['type'] => {
    const clean = ext.toLowerCase().replace('.', '');
    if (clean === 'doc' || clean === 'docx') return 'word';
    if (clean === 'xls' || clean === 'xlsx') return 'excel';
    if (clean === 'png' || clean === 'jpg' || clean === 'jpeg') return 'image';
    if (clean === 'zip' || clean === 'rar') return 'archive';
    return 'file';
  };

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  // Filter lessons by search, group, and remote format
  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      // group filter
      if (selectedGroupTab !== 'all' && l.group !== 'all' && l.group !== selectedGroupTab) {
        return false;
      }

      // remote filter
      if (remoteOnlyFilter && !l.isRemoteFriendly && !l.fullLectureNotes) {
        return false;
      }

      // search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTopic = l.topic.toLowerCase().includes(q);
        const inDesc = l.description.toLowerCase().includes(q);
        const inNotes = (l.fullLectureNotes || '').toLowerCase().includes(q);
        const inDate = l.date.toLowerCase().includes(q);
        const inAttachments = (l.attachments || []).some((att) => att.name.toLowerCase().includes(q));
        return inTopic || inDesc || inNotes || inDate || inAttachments;
      }
      return true;
    });
  }, [lessons, selectedGroupTab, searchQuery, remoteOnlyFilter]);

  const handleOpenModal = (lessonToEdit?: CompletedLesson) => {
    setAttachmentError(null);
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
        isRemoteFriendly: lessonToEdit.isRemoteFriendly !== false,
      });
      setAttachments(lessonToEdit.attachments ? [...lessonToEdit.attachments] : []);
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
        isRemoteFriendly: true,
      });
      setAttachments([]);
    }
    setIsModalOpen(true);
  };

  // Handle file uploads by admin (word, excel, png, jpg, zip, rar) - Max 16
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setAttachmentError(null);

    const availableSlots = 16 - attachments.length;
    if (availableSlots <= 0) {
      setAttachmentError('Достигнут лимит: нельзя прикрепить более 16 документов к одному занятию.');
      return;
    }

    const filesToProcess: File[] = Array.from(files).slice(0, availableSlots) as File[];
    if (files.length > availableSlots) {
      setAttachmentError(`Выбрано файлов больше, чем доступно. Добавлено ${availableSlots} из ${files.length} (макс. 16).`);
    }

    filesToProcess.forEach((file: File) => {
      const ext = file.name.split('.').pop() || '';
      const type = getAttachmentType(ext);

      const reader = new FileReader();
      reader.onload = () => {
        const resultUrl = typeof reader.result === 'string' ? reader.result : '';
        const newAttachment: LessonAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          size: formatFileSize(file.size),
          type,
          extension: ext.toLowerCase(),
          url: resultUrl,
        };

        setAttachments((prev) => {
          if (prev.length >= 16) return prev;
          return [...prev, newAttachment];
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  // Quick preset document adder for admin convenience
  const handleAddPresetDoc = (kind: 'word' | 'excel' | 'png' | 'jpg' | 'zip' | 'rar') => {
    setAttachmentError(null);
    if (attachments.length >= 16) {
      setAttachmentError('Достигнут максимум: не более 16 документов на занятие.');
      return;
    }

    const presets = {
      word: {
        name: `Методические_материалы_к_занятию_${attachments.length + 1}.docx`,
        size: '340 КБ',
        type: 'word' as const,
        extension: 'docx',
      },
      excel: {
        name: `Таблица_штрафов_и_нормативов_2026.xlsx`,
        size: '180 КБ',
        type: 'excel' as const,
        extension: 'xlsx',
      },
      png: {
        name: `Схема_проезда_и_траектории_маневров.png`,
        size: '1.2 МБ',
        type: 'image' as const,
        extension: 'png',
      },
      jpg: {
        name: `Иллюстрация_дорожных_ситуаций_ГИБДД.jpg`,
        size: '890 КБ',
        type: 'image' as const,
        extension: 'jpg',
      },
      zip: {
        name: `Архив_билетов_и_материалов_для_удаленщиков.zip`,
        size: '4.1 МБ',
        type: 'archive' as const,
        extension: 'zip',
      },
      rar: {
        name: `Сборник_ситуационных_задач_ДОСААФ.rar`,
        size: '3.4 МБ',
        type: 'archive' as const,
        extension: 'rar',
      },
    };

    const chosen = presets[kind];
    const newAtt: LessonAttachment = {
      id: `att-preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: chosen.name,
      size: chosen.size,
      type: chosen.type,
      extension: chosen.extension,
      url: '#',
    };

    setAttachments((prev) => [...prev, newAtt]);
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
    setAttachmentError(null);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim() || !formData.date.trim()) return;

    const keyPoints = formData.keyPointsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const lessonPayload = {
      date: formData.date.trim(),
      topic: formData.topic.trim(),
      group: formData.group,
      instructor: formData.instructor.trim(),
      description: formData.description.trim(),
      fullLectureNotes: formData.fullLectureNotes.trim() || undefined,
      keyPoints,
      homework: formData.homework.trim() || undefined,
      attachments: attachments.slice(0, 16),
      isRemoteFriendly: formData.isRemoteFriendly,
    };

    if (editingLessonId) {
      updateLesson(editingLessonId, lessonPayload);
    } else {
      addLesson(lessonPayload);
    }
    setIsModalOpen(false);
  };

  // Helper to trigger file download
  const handleDownloadFile = (att: LessonAttachment) => {
    if (att.url && att.url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = att.url;
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create a blob simulation for demonstration if url is dummy
      const blob = new Blob([`Учебный материал ДОСААФ:\nДокумент: ${att.name}\nФормат: ${att.extension.toUpperCase()}\nАвтошкола ДОСААФ России`], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Render attachment icon and colors
  const renderAttachmentIcon = (att: LessonAttachment) => {
    switch (att.type) {
      case 'word':
        return (
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'excel':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <Table className="w-5 h-5" />
          </div>
        );
      case 'image':
        return (
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
            <ImageIcon className="w-5 h-5" />
          </div>
        );
      case 'archive':
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <Archive className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0 border border-neutral-200">
            <File className="w-5 h-5" />
          </div>
        );
    }
  };

  // Font size classes for lecture notes
  const fontSizeClass =
    lectureFontSize === 'xlarge'
      ? 'text-xl leading-relaxed sm:leading-loose'
      : lectureFontSize === 'large'
      ? 'text-lg leading-relaxed'
      : 'text-base leading-normal';

  return (
    <div className="space-y-6">
      {/* Top Banner / Filter */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Учебный процесс ДОСААФ</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <Laptop className="w-3.5 h-3.5" />
              <span>Очное и удалённое обучение</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Занятия
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl leading-relaxed">
            Лекции и учебные материалы для курсантов очной формы и дистанционного обучения.
            Читайте развернутые конспекты тем и скачивайте прикрепленные документы.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Remote friendly toggle */}
          <button
            onClick={() => setRemoteOnlyFilter(!remoteOnlyFilter)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border ${
              remoteOnlyFilter
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
            }`}
            title="Показать только занятия с подробными лекциями для удаленщиков"
          >
            <Laptop className="w-4 h-4" />
            <span>Для удаленщиков</span>
          </button>

          {/* Search Bar */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по лекциям, файлам..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Admin Add Lesson Button */}
          {isAdmin && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить занятие</span>
            </button>
          )}
        </div>
      </div>

      {/* Font Size & Reader Controls Bar */}
      <div className="bg-neutral-100/80 rounded-2xl p-3 border border-neutral-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-neutral-600">
          <Type className="w-4 h-4 text-neutral-500" />
          <span className="font-semibold text-neutral-800">Размер текста лекций:</span>
          <span className="text-neutral-500 hidden sm:inline">(удобно для чтения на любых экранах)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setLectureFontSize('normal')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              lectureFontSize === 'normal'
                ? 'bg-white text-neutral-900 shadow-xs font-bold ring-1 ring-neutral-300'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Обычный (16px)
          </button>
          <button
            onClick={() => setLectureFontSize('large')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              lectureFontSize === 'large'
                ? 'bg-white text-blue-600 shadow-xs font-bold ring-1 ring-blue-300'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Крупный (18px)
          </button>
          <button
            onClick={() => setLectureFontSize('xlarge')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              lectureFontSize === 'xlarge'
                ? 'bg-white text-blue-700 shadow-xs font-bold ring-1 ring-blue-300'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Максимальный (21px)
          </button>
        </div>
      </div>

      {/* Timeline of Lessons */}
      <div className="space-y-4">
        {filteredLessons.map((lesson) => {
          const isExpanded = expandedLessonId === lesson.id;
          const attCount = lesson.attachments?.length || 0;

          return (
            <div
              key={lesson.id}
              className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs hover:border-neutral-300 transition-all"
            >
              {/* Lesson Header Card */}
              <div
                onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                className="p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer hover:bg-neutral-50/50 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold bg-neutral-900 text-white px-2.5 py-1 rounded-lg shadow-xs">
                      Занятие от {lesson.date}
                    </span>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                        groups.find((g) => g.id === lesson.group)?.category === 'C'
                          ? 'bg-amber-100 text-amber-900'
                          : lesson.group === 'group8_akpp'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {getGroupName(lesson.group)}
                    </span>

                    {lesson.isRemoteFriendly && (
                      <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Laptop className="w-3 h-3" />
                        <span>Для удаленщиков</span>
                      </span>
                    )}

                    {attCount > 0 && (
                      <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        <span>{attCount} {attCount === 1 ? 'документ' : attCount < 5 ? 'документа' : 'документов'}</span>
                      </span>
                    )}

                    <span className="text-xs text-neutral-500 flex items-center gap-1 font-medium ml-auto sm:ml-0">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      {lesson.instructor}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-neutral-900 leading-snug">
                    {lesson.topic}
                  </h3>

                  <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">
                    {lesson.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1">
                  {isAdmin && (
                    <div
                      className="flex items-center gap-1 mr-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleOpenModal(lesson)}
                        className="p-2 text-neutral-400 hover:text-amber-600 rounded-xl hover:bg-neutral-100 transition-colors"
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
                        className="p-2 text-neutral-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                        title="Удалить занятие"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <button className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg">
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
                <div className="px-5 pb-6 pt-2 sm:px-7 border-t border-neutral-100 space-y-6 bg-neutral-50/40 animate-in fade-in duration-150">
                  {/* Brief summary */}
                  <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1.5">
                      Краткое содержание занятия:
                    </span>
                    <p className="text-base text-neutral-800 leading-relaxed whitespace-pre-line font-medium">
                      {lesson.description}
                    </p>
                  </div>

                  {/* Remote student full lecture block */}
                  <div className="p-5 bg-gradient-to-br from-blue-50/90 to-indigo-50/70 border border-blue-200 rounded-3xl space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-blue-200/60">
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold text-blue-950 flex items-center gap-2">
                          <Laptop className="w-4 h-4 text-blue-700" />
                          <span>Лекционный материал для удаленщиков и подготовки</span>
                        </span>
                        <p className="text-xs text-blue-800/80">
                          Подробный теоретический конспект с крупным читабельным текстом
                        </p>
                      </div>

                      <button
                        onClick={() => setActiveFullLecture(lesson)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0 shadow-xs cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Открыть в режиме чтения</span>
                      </button>
                    </div>

                    {/* Large Readable Lecture Text */}
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blue-100 shadow-xs">
                      <div
                        className={`${fontSizeClass} text-neutral-850 font-sans whitespace-pre-line leading-relaxed selection:bg-blue-600 selection:text-white`}
                      >
                        {lesson.fullLectureNotes ||
                          `Для этого занятия подробный текст лекции формируется преподавателем. Ознакомьтесь с кратким содержанием, ключевыми пунктами и прикрепленными документами ниже.`}
                      </div>
                    </div>
                  </div>

                  {/* ATTACHED DOCUMENTS SECTION (Up to 16 documents) */}
                  <div className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <h4 className="text-sm font-black text-neutral-900 tracking-tight">
                          Прикрепленные документы для курсантов
                        </h4>
                      </div>
                    </div>

                    {attCount === 0 ? (
                      <div className="p-4 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 text-center text-xs text-neutral-400">
                        К данному занятию документы пока не прикреплены.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {lesson.attachments?.map((att) => (
                          <div
                            key={att.id}
                            className="p-3.5 bg-neutral-50 hover:bg-neutral-100/80 rounded-2xl border border-neutral-200 flex items-center justify-between gap-3 transition-all group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {renderAttachmentIcon(att)}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-neutral-900 truncate group-hover:text-blue-600 transition-colors" title={att.name}>
                                  {att.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-white text-neutral-600 border border-neutral-200">
                                    {att.extension}
                                  </span>
                                  {att.size && (
                                    <span className="text-[11px] text-neutral-400">
                                      {att.size}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {att.type === 'image' && att.url && att.url !== '#' && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage({ url: att.url!, title: att.name })}
                                  className="p-2 text-neutral-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                                  title="Просмотреть иллюстрацию"
                                >
                                  <ZoomIn className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(att)}
                                className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                                title={`Скачать ${att.name}`}
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Key rules and points */}
                  {lesson.keyPoints && lesson.keyPoints.length > 0 && (
                    <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-xs space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                        Изученные вопросы и ключевые тезисы:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {lesson.keyPoints.map((pt, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2.5 text-sm text-neutral-800 bg-neutral-50 p-3 rounded-2xl border border-neutral-200/80 font-medium"
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Homework */}
                  {lesson.homework && (
                    <div className="p-4 sm:p-5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs sm:text-sm text-amber-950 shadow-xs">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wider">
                        <BookOpen className="w-4 h-4 text-amber-700" />
                        Домашнее задание к следующему уроку:
                      </span>
                      <p className="text-sm font-medium leading-relaxed">{lesson.homework}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredLessons.length === 0 && (
          <div className="py-16 text-center bg-white rounded-3xl border border-neutral-200 p-8 space-y-2">
            <GraduationCap className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="text-sm font-bold text-neutral-800">Занятия не найдены</h3>
            <p className="text-xs text-neutral-500">
              Попробуйте изменить поисковый запрос или сбросить фильтр для удаленщиков.
            </p>
          </div>
        )}
      </div>

      {/* FULL LECTURE MODAL (Comfortable Reader for Remote Learners) */}
      {activeFullLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 sm:p-8 max-h-[92vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveFullLecture(null)}
              className="absolute right-4 top-4 p-2.5 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 pr-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold bg-neutral-900 text-white px-2.5 py-1 rounded-lg">
                  Занятие от {activeFullLecture.date}
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  {getGroupName(activeFullLecture.group)}
                </span>
                <span className="text-xs text-neutral-500 font-medium">
                  Преподаватель: {activeFullLecture.instructor}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900">
                {activeFullLecture.topic}
              </h2>
            </div>

            {/* Reader font size switcher */}
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
              <span className="font-semibold text-neutral-700">Размер шрифта для чтения:</span>
              <div className="flex items-center gap-1">
                {(['normal', 'large', 'xlarge'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setLectureFontSize(sz)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                      lectureFontSize === sz
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {sz === 'normal' ? '16px' : sz === 'large' ? '18px' : '21px'}
                  </button>
                ))}
              </div>
            </div>

            {/* Complete Lecture Transcript / Notes */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Полный текст лекции</span>
              </h4>

              <div className="p-6 bg-neutral-50/70 rounded-2xl border border-neutral-200 shadow-inner">
                <div
                  className={`${fontSizeClass} text-neutral-900 font-sans whitespace-pre-line leading-relaxed sm:leading-loose selection:bg-blue-600 selection:text-white`}
                >
                  {activeFullLecture.fullLectureNotes || activeFullLecture.description}
                </div>
              </div>
            </div>

            {/* Attached files inside reader modal */}
            {activeFullLecture.attachments && activeFullLecture.attachments.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  <span>Прикрепленные документы к занятию ({activeFullLecture.attachments.length})</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeFullLecture.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 bg-white rounded-xl border border-neutral-200 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {renderAttachmentIcon(att)}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-900 truncate" title={att.name}>
                            {att.name}
                          </p>
                          <span className="text-[10px] text-neutral-400">
                            {att.extension.toUpperCase()} • {att.size}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadFile(att)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Скачать</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key takeaways */}
            {activeFullLecture.keyPoints && activeFullLecture.keyPoints.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider block">
                  Главные правила, которые необходимо выучить:
                </span>
                <div className="space-y-2">
                  {activeFullLecture.keyPoints.map((pt, i) => (
                    <div
                      key={i}
                      className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start gap-2.5 text-sm text-neutral-800"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Homework in modal */}
            {activeFullLecture.homework && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs sm:text-sm text-amber-950">
                <span className="font-bold block mb-1 text-xs uppercase tracking-wider">
                  Домашнее задание:
                </span>
                <p>{activeFullLecture.homework}</p>
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setActiveFullLecture(null)}
                className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Закрыть лекцию
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW LIGHTBOX */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl p-3 shadow-2xl flex flex-col items-center"
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 p-2 bg-neutral-900/80 text-white hover:bg-neutral-900 rounded-full cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[80vh] w-auto object-contain rounded-2xl"
            />
            <p className="text-xs font-bold text-neutral-800 mt-2 px-2 text-center">
              {previewImage.title}
            </p>
          </div>
        </div>
      )}

      {/* Admin Add/Edit Lesson Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-neutral-900 mb-4">
              {editingLessonId ? 'Редактировать занятие' : 'Добавить занятие'}
            </h3>

            <form onSubmit={handleSaveLesson} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Дата занятия
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="09.09.2026"
                    className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Учебная группа</label>
                  <select
                    value={formData.group}
                    onChange={(e) =>
                      setFormData({ ...formData, group: e.target.value as GroupType })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="all">Для всех групп (Общее)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.transmissionLabel || g.transmission})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Тема занятия
                </label>
                <input
                  type="text"
                  required
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="например, Проезд регулируемых перекрестков и сигналы регулировщика"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isRemoteFriendly}
                      onChange={(e) => setFormData({ ...formData, isRemoteFriendly: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-neutral-800">
                      Подходит для удаленщиков (дистанционный формат)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Краткое содержание занятия
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Кратко опишите тему и ход урока..."
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-neutral-700 block">
                    Полный текст лекции (для удаленщиков и подготовки)
                  </label>
                  <span className="text-[10px] text-neutral-400">
                    Отображается курсанту крупным читабельным шрифтом
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={formData.fullLectureNotes}
                  onChange={(e) => setFormData({ ...formData, fullLectureNotes: e.target.value })}
                  placeholder="Развернутый конспект лекции, пункты ПДД, практические примеры и дорожные ловушки..."
                  className="w-full px-3 py-2 border rounded-xl font-sans text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ATTACHMENTS MANAGEMENT (Max 16) */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="font-bold text-neutral-900 block">
                      Прикрепить документы (до 16 позиций)
                    </label>
                    <span className="text-[11px] text-neutral-500">
                      Поддерживаются: word (.doc, .docx), excel (.xls, .xlsx), png, jpg, zip, rar
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    attachments.length >= 16 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {attachments.length} из 16
                  </span>
                </div>

                {attachmentError && (
                  <p className="text-xs text-red-600 font-semibold bg-red-50 p-2 rounded-lg">
                    {attachmentError}
                  </p>
                )}

                {/* Upload & Quick Template Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className={`px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                    attachments.length >= 16 ? 'opacity-50 pointer-events-none' : ''
                  }`}>
                    <UploadCloud className="w-4 h-4" />
                    <span>Выбрать файлы с устройства</span>
                    <input
                      type="file"
                      multiple
                      accept=".doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.rar"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={attachments.length >= 16}
                    />
                  </label>

                  {/* Preset Buttons for Quick Template Population */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-neutral-400 mr-1">Быстрый шаблон:</span>
                    <button
                      type="button"
                      onClick={() => handleAddPresetDoc('word')}
                      disabled={attachments.length >= 16}
                      className="px-2 py-1 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 text-[11px] font-semibold cursor-pointer"
                    >
                      + Word
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetDoc('excel')}
                      disabled={attachments.length >= 16}
                      className="px-2 py-1 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 text-[11px] font-semibold cursor-pointer"
                    >
                      + Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetDoc('png')}
                      disabled={attachments.length >= 16}
                      className="px-2 py-1 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 text-[11px] font-semibold cursor-pointer"
                    >
                      + PNG
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetDoc('jpg')}
                      disabled={attachments.length >= 16}
                      className="px-2 py-1 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 text-[11px] font-semibold cursor-pointer"
                    >
                      + JPG
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetDoc('zip')}
                      disabled={attachments.length >= 16}
                      className="px-2 py-1 bg-white border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 text-[11px] font-semibold cursor-pointer"
                    >
                      + ZIP
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetDoc('rar')}
                      disabled={attachments.length >= 16}
                      className="px-2 py-1 bg-white border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 text-[11px] font-semibold cursor-pointer"
                    >
                      + RAR
                    </button>
                  </div>
                </div>

                {/* List of currently attached documents */}
                {attachments.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {attachments.map((att, idx) => (
                      <div
                        key={att.id}
                        className="p-2.5 bg-white rounded-xl border border-neutral-200 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono font-bold text-neutral-400 w-4">
                            {idx + 1}.
                          </span>
                          {renderAttachmentIcon(att)}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-neutral-900 truncate" title={att.name}>
                              {att.name}
                            </p>
                            <span className="text-[10px] text-neutral-400">
                              {att.extension.toUpperCase()} • {att.size || '1 МБ'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                          title="Удалить файл"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  className="w-full px-3 py-2 border rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-neutral-600 hover:bg-neutral-50 font-medium cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
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
