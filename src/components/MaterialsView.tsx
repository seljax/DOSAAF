import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LearningMaterial, MaterialType, GroupType } from '../types';
import { ImageInputControl } from './ImageInputControl';
import { EditableDesignBlock } from './EditableDesignBlock';
import { useDesignEditor } from '../context/DesignEditorContext';
import {
  Compass,
  Video,
  FileText,
  Bookmark,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  PlayCircle,
  Tag,
  Calendar,
  Layers,
} from 'lucide-react';

export const MaterialsView: React.FC = () => {
  const { materials, addMaterial, updateMaterial, deleteMaterial, isAdmin, selectedGroupTab, getGroupName, groups } =
    useApp();
  const { getOrderedItems } = useDesignEditor();

  const [typeFilter, setTypeFilter] = useState<'all' | MaterialType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'video' as MaterialType,
    url: '',
    sourceName: '',
    description: '',
    category: 'Перекрёстки',
    groupTarget: 'all' as string,
    imageUrl: '',
  });

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      // Type filter
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;

      // Dynamic Group filter
      if (selectedGroupTab !== 'all' && m.groupTarget !== 'all' && m.groupTarget !== selectedGroupTab) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          (m.sourceName && m.sourceName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [materials, typeFilter, selectedGroupTab, searchQuery]);

  const handleOpenModal = (materialToEdit?: LearningMaterial) => {
    if (materialToEdit) {
      setEditingMaterialId(materialToEdit.id);
      setFormData({
        title: materialToEdit.title,
        type: materialToEdit.type,
        url: materialToEdit.url,
        sourceName: materialToEdit.sourceName || '',
        description: materialToEdit.description,
        category: materialToEdit.category,
        groupTarget: materialToEdit.groupTarget || 'all',
        imageUrl: materialToEdit.imageUrl || '',
      });
    } else {
      setEditingMaterialId(null);
      setFormData({
        title: '',
        type: 'video',
        url: '',
        sourceName: 'YouTube',
        description: '',
        category: 'ПДД 2026',
        groupTarget: 'all',
        imageUrl: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.url.trim()) return;

    if (editingMaterialId) {
      updateMaterial(editingMaterialId, {
        title: formData.title.trim(),
        type: formData.type,
        url: formData.url.trim(),
        sourceName: formData.sourceName.trim() || undefined,
        description: formData.description.trim(),
        category: formData.category.trim(),
        groupTarget: formData.groupTarget,
        imageUrl: formData.imageUrl.trim() || undefined,
      });
    } else {
      addMaterial({
        title: formData.title.trim(),
        type: formData.type,
        url: formData.url.trim(),
        sourceName: formData.sourceName.trim() || undefined,
        description: formData.description.trim(),
        category: formData.category.trim(),
        groupTarget: formData.groupTarget,
        imageUrl: formData.imageUrl.trim() || undefined,
      });
    }
    setIsModalOpen(false);
  };

  const getTypeIcon = (type: MaterialType) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-rose-600" />;
      case 'article':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'handout':
        return <Bookmark className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getTypeLabel = (type: MaterialType) => {
    switch (type) {
      case 'video':
        return 'Видео';
      case 'article':
        return 'Статья';
      case 'handout':
        return 'Памятка';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <EditableDesignBlock
        id="materials_hero_banner"
        label="Шапка раздела материалов"
        defaultTitle="Полезные материалы и разборы"
        defaultSubtitle="Подборка обучающих видеоуроков, аналитических статей, схем и практических памяток для успешной сдачи экзамена"
        defaultBadge="База знаний курсанта"
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
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
                  <Compass className="w-3.5 h-3.5" />
                  <span>{badge}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900">
                  {title}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {subtitle}
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => handleOpenModal()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить материал</span>
                </button>
              )}
            </div>

            {/* Filters and search bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 pt-5 border-t border-neutral-100">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { key: 'all', label: 'Все материалы' },
                  { key: 'video', label: 'Видеоуроки' },
                  { key: 'article', label: 'Статьи' },
                  { key: 'handout', label: 'Памятки и схемы' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTypeFilter(f.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      typeFilter === f.key
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по теме или названию..."
                  className="w-full pl-8 pr-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </EditableDesignBlock>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getOrderedItems('materials_grid', filteredMaterials).map((mat) => (
          <EditableDesignBlock
            key={mat.id}
            id={`material_${mat.id}`}
            sortItemId={mat.id}
            containerId="materials_grid"
            label={`Материал: ${mat.title}`}
            draggable={true}
            allSiblingIds={filteredMaterials.map((m) => m.id)}
            defaultTitle={mat.title}
            defaultSubtitle={mat.description}
            defaultClasses={{
              bg: 'bg-white',
              border: 'border border-neutral-200',
              radius: 'rounded-3xl',
              padding: 'p-0',
              shadow: 'shadow-xs',
            }}
            className="overflow-hidden flex flex-col justify-between"
          >
            {({ title, subtitle }) => (
              <>
                <div>
                  {/* Cover Image if available */}
                  {mat.imageUrl ? (
                    <div className="relative w-full h-40 bg-neutral-100 overflow-hidden border-b border-neutral-150">
                      <img
                        src={mat.imageUrl}
                        alt={title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold">
                        {getTypeIcon(mat.type)}
                        <span>{getTypeLabel(mat.type)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 pb-0 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-[11px] font-bold">
                        {getTypeIcon(mat.type)}
                        <span>{getTypeLabel(mat.type)}</span>
                      </div>

                      {mat.groupTarget && mat.groupTarget !== 'all' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                          {getGroupName(mat.groupTarget)}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-4 sm:p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-medium">
                      {mat.sourceName && <span>{mat.sourceName}</span>}
                      {mat.sourceName && <span>•</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {mat.dateAdded}
                      </span>
                      <span>•</span>
                      <span className="text-neutral-600 font-semibold">{mat.category}</span>
                    </div>

                    <h3 className="text-sm font-bold text-neutral-900 leading-snug">
                      {title}
                    </h3>

                    <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">
                      {subtitle}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 sm:p-5 sm:pt-0 border-t border-neutral-100 mt-2 flex items-center justify-between gap-2">
                  <a
                    href={mat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    {mat.type === 'video' ? (
                      <PlayCircle className="w-3.5 h-3.5" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5" />
                    )}
                    <span>{mat.type === 'video' ? 'Смотреть видео' : 'Читать материал'}</span>
                  </a>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenModal(mat)}
                        className="p-1.5 text-neutral-400 hover:text-amber-600 rounded-lg hover:bg-neutral-100"
                        title="Редактировать материал"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Удалить материал "${mat.title}"?`)) {
                            deleteMaterial(mat.id);
                          }
                        }}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Удалить материал"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </EditableDesignBlock>
        ))}

        {filteredMaterials.length === 0 && (
          <div className="col-span-full py-16 text-center text-neutral-400 text-xs bg-white rounded-3xl border border-neutral-200 p-8">
            Материалы по заданным фильтрам не найдены.
          </div>
        )}
      </div>

      {/* Admin Add/Edit Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-neutral-900 mb-4">
              {editingMaterialId ? 'Редактировать материал' : 'Добавить полезный материал'}
            </h3>

            <form onSubmit={handleSaveMaterial} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Тип материала</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as MaterialType })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="video">Видеоурок / Видео</option>
                    <option value="article">Статья / Разбор</option>
                    <option value="handout">Памятка / Схема</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Для кого</label>
                  <select
                    value={formData.groupTarget}
                    onChange={(e) =>
                      setFormData({ ...formData, groupTarget: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="all">Для всех групп</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        Только {g.name} ({g.transmission})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Название материала</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="например: Разбор сигналов светофора с доп. секцией"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Ссылка (URL видео или статьи)
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=... или https://pdd.ru/..."
                  className="w-full px-3 py-2 border rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Источник / Автор
                  </label>
                  <input
                    type="text"
                    value={formData.sourceName}
                    onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                    placeholder="YouTube / ГИБДД РФ / ПДД Мастер"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Тематика / Тег</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Перекрёстки / Парковка / Регулировщик"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Описание материала</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="О чем этот материал, почему он полезен для курсантов..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              {/* Image Uploader supporting PC files and URLs */}
              <ImageInputControl
                label="Обложка материала (файл с ПК или ссылка)"
                value={formData.imageUrl}
                onChange={(val) => setFormData({ ...formData, imageUrl: val })}
              />

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
                  {editingMaterialId ? 'Сохранить изменения' : 'Опубликовать материал'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
