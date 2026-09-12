import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RoadSign, RoadRule, SignCategory } from '../types';
import { RoadSignSvg } from './RoadSignSvg';
import { ImageInputControl } from './ImageInputControl';
import { EditableDesignBlock } from './EditableDesignBlock';
import { useDesignEditor } from '../context/DesignEditorContext';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  BookOpen,
  ShieldAlert,
  ChevronRight,
  Info,
  X,
  Check,
  Image as ImageIcon,
} from 'lucide-react';

export const RulesAndSignsView: React.FC = () => {
  const { signs, addSign, updateSign, deleteSign, rules, addRule, updateRule, deleteRule, isAdmin } = useApp();
  const { getOrderedItems } = useDesignEditor();

  const [subTab, setSubTab] = useState<'signs' | 'rules'>('signs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SignCategory | 'all'>('all');

  // Modals
  const [viewingSign, setViewingSign] = useState<RoadSign | null>(null);
  const [viewingRule, setViewingRule] = useState<RoadRule | null>(null);

  // Admin Sign Form Modal
  const [signFormOpen, setSignFormOpen] = useState(false);
  const [editingSignId, setEditingSignId] = useState<string | null>(null);
  const [signFormData, setSignFormData] = useState({
    number: '',
    name: '',
    category: 'priority' as SignCategory,
    description: '',
    meaning: '',
    svgType: '',
    imageUrl: '',
  });

  // Admin Rule Form Modal
  const [ruleFormOpen, setRuleFormOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleFormData, setRuleFormData] = useState({
    sectionNumber: '',
    title: '',
    summary: '',
    content: '',
    keyPointsText: '',
  });

  // Categories config
  const categoriesConfig: { key: SignCategory | 'all'; label: string }[] = [
    { key: 'all', label: 'Все знаки' },
    { key: 'priority', label: 'Приоритета' },
    { key: 'prohibitory', label: 'Запрещающие' },
    { key: 'warning', label: 'Предупреждающие' },
    { key: 'mandatory', label: 'Предписывающие' },
    { key: 'special', label: 'Особых предписаний' },
    { key: 'information', label: 'Информационные' },
  ];

  // Filtered signs
  const filteredSigns = useMemo(() => {
    return signs.filter((s) => {
      const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.number.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [signs, selectedCategory, searchQuery]);

  // Filtered rules
  const filteredRules = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return rules;
    return rules.filter(
      (r) =>
        r.sectionNumber.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q)
    );
  }, [rules, searchQuery]);

  // Open Sign Form for creation/editing
  const handleOpenSignForm = (signToEdit?: RoadSign) => {
    if (signToEdit) {
      setEditingSignId(signToEdit.id);
      setSignFormData({
        number: signToEdit.number,
        name: signToEdit.name,
        category: signToEdit.category,
        description: signToEdit.description,
        meaning: signToEdit.meaning,
        svgType: signToEdit.svgType || signToEdit.number,
        imageUrl: signToEdit.imageUrl || '',
      });
    } else {
      setEditingSignId(null);
      setSignFormData({
        number: '',
        name: '',
        category: 'priority',
        description: '',
        meaning: '',
        svgType: '',
        imageUrl: '',
      });
    }
    setSignFormOpen(true);
  };

  const handleSaveSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signFormData.name.trim() || !signFormData.number.trim()) return;

    if (editingSignId) {
      updateSign(editingSignId, {
        number: signFormData.number.trim(),
        name: signFormData.name.trim(),
        category: signFormData.category,
        description: signFormData.description.trim(),
        meaning: signFormData.meaning.trim(),
        svgType: signFormData.svgType.trim() || signFormData.number.trim(),
        imageUrl: signFormData.imageUrl.trim() || undefined,
      });
    } else {
      addSign({
        number: signFormData.number.trim(),
        name: signFormData.name.trim(),
        category: signFormData.category,
        description: signFormData.description.trim(),
        meaning: signFormData.meaning.trim(),
        svgType: signFormData.svgType.trim() || signFormData.number.trim(),
        imageUrl: signFormData.imageUrl.trim() || undefined,
      });
    }
    setSignFormOpen(false);
  };

  // Open Rule Form
  const handleOpenRuleForm = (ruleToEdit?: RoadRule) => {
    if (ruleToEdit) {
      setEditingRuleId(ruleToEdit.id);
      setRuleFormData({
        sectionNumber: ruleToEdit.sectionNumber,
        title: ruleToEdit.title,
        summary: ruleToEdit.summary,
        content: ruleToEdit.content,
        keyPointsText: (ruleToEdit.keyPoints || []).join('\n'),
      });
    } else {
      setEditingRuleId(null);
      setRuleFormData({
        sectionNumber: '',
        title: '',
        summary: '',
        content: '',
        keyPointsText: '',
      });
    }
    setRuleFormOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleFormData.title.trim() || !ruleFormData.sectionNumber.trim()) return;

    const keyPoints = ruleFormData.keyPointsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (editingRuleId) {
      updateRule(editingRuleId, {
        sectionNumber: ruleFormData.sectionNumber.trim(),
        title: ruleFormData.title.trim(),
        summary: ruleFormData.summary.trim(),
        content: ruleFormData.content.trim(),
        keyPoints,
      });
    } else {
      addRule({
        sectionNumber: ruleFormData.sectionNumber.trim(),
        title: ruleFormData.title.trim(),
        summary: ruleFormData.summary.trim(),
        content: ruleFormData.content.trim(),
        keyPoints,
      });
    }
    setRuleFormOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-neutral-200 shadow-xs">
        {/* Toggle Signs / Rules */}
        <div className="flex items-center p-1 bg-neutral-100 rounded-xl border border-neutral-200 w-full sm:w-auto">
          <button
            onClick={() => setSubTab('signs')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'signs'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Дорожные знаки ({signs.length})</span>
          </button>
          <button
            onClick={() => setSubTab('rules')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'rules'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-500" />
            <span>Разделы ПДД ({rules.length})</span>
          </button>
        </div>

        {/* Search & Admin Add button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={subTab === 'signs' ? 'Поиск знака по номеру, названию...' : 'Поиск по статьям ПДД...'}
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {isAdmin && (
            <button
              onClick={() => (subTab === 'signs' ? handleOpenSignForm() : handleOpenRuleForm())}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">
                {subTab === 'signs' ? 'Добавить знак' : 'Добавить раздел'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-view 1: SIGNS */}
      {subTab === 'signs' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categoriesConfig.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.key
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Signs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {getOrderedItems('signs_grid', filteredSigns).map((sign) => (
              <EditableDesignBlock
                key={sign.id}
                id={`sign_${sign.id}`}
                sortItemId={sign.id}
                containerId="signs_grid"
                label={`Знак ${sign.number}: ${sign.name}`}
                draggable={true}
                allSiblingIds={filteredSigns.map((s) => s.id)}
                defaultTitle={sign.name}
                defaultSubtitle={sign.description}
                defaultBadge={sign.number}
                defaultClasses={{
                  bg: 'bg-white',
                  border: 'border border-neutral-200',
                  radius: 'rounded-2xl',
                  padding: 'p-3',
                  shadow: 'shadow-xs',
                }}
                className="group relative cursor-pointer flex flex-col items-center text-center justify-between min-h-[170px]"
                onClick={() => setViewingSign(sign)}
              >
                {({ title, subtitle, badge }) => (
                  <>
                    {/* Sign top header with number */}
                    <div className="w-full flex items-center justify-between text-[11px] mb-2 text-neutral-400">
                      <span className="font-mono font-bold bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded">
                        {badge}
                      </span>
                      {isAdmin && (
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleOpenSignForm(sign)}
                            className="p-1 text-neutral-400 hover:text-amber-600 rounded transition-colors"
                            title="Редактировать знак"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Удалить знак ${sign.number} "${sign.name}"?`)) {
                                deleteSign(sign.id);
                              }
                            }}
                            className="p-1 text-neutral-400 hover:text-red-600 rounded transition-colors"
                            title="Удалить знак"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* SVG or Image Graphic */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingSign(sign);
                      }}
                      className="my-1 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center cursor-pointer"
                    >
                      <RoadSignSvg sign={sign} size="md" />
                    </div>

                    {/* Name & Meaning preview */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingSign(sign);
                      }}
                      className="w-full mt-2 cursor-pointer"
                    >
                      <h4 className="font-bold text-xs text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                        {title}
                      </h4>
                      <p className="text-[11px] text-neutral-500 line-clamp-1 mt-1">
                        {subtitle}
                      </p>
                      <div className="mt-2 pt-1 border-t border-neutral-100 flex items-center justify-center text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Нажмите для описания
                      </div>
                    </div>
                  </>
                )}
              </EditableDesignBlock>
            ))}

            {filteredSigns.length === 0 && (
              <div className="col-span-full py-12 text-center text-neutral-400">
                Знаки не найдены по текущему запросу
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-view 2: RULES */}
      {subTab === 'rules' && (
        <div className="space-y-3">
          {getOrderedItems('rules_list', filteredRules).map((rule) => (
            <EditableDesignBlock
              key={rule.id}
              id={`rule_${rule.id}`}
              sortItemId={rule.id}
              containerId="rules_list"
              label={`Раздел ${rule.sectionNumber}: ${rule.title}`}
              draggable={true}
              allSiblingIds={filteredRules.map((r) => r.id)}
              defaultTitle={rule.title}
              defaultSubtitle={rule.summary}
              defaultBadge={rule.sectionNumber}
              defaultClasses={{
                bg: 'bg-white',
                border: 'border border-neutral-200',
                radius: 'rounded-2xl',
                padding: 'p-4 sm:p-5',
                shadow: 'shadow-xs',
              }}
            >
              {({ title, subtitle, badge }) => (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {badge}
                        </span>
                        <h3 className="text-base font-bold text-neutral-900">{title}</h3>
                      </div>
                      <p className="text-xs text-neutral-600 mt-1">{subtitle}</p>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                        <button
                          onClick={() => handleOpenRuleForm(rule)}
                          className="p-1.5 text-neutral-400 hover:text-amber-600 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Редактировать раздел"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Удалить раздел "${rule.title}"?`)) {
                              deleteRule(rule.id);
                            }
                          }}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Удалить раздел"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Key points bullet highlights */}
                  {rule.keyPoints && rule.keyPoints.length > 0 && (
                    <div className="mt-3.5 pt-3.5 border-t border-neutral-100">
                      <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block mb-2">
                        Ключевые тезисы для экзамена:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {rule.keyPoints.map((pt, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-xs text-neutral-700 bg-neutral-50/80 p-2 rounded-xl border border-neutral-150"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Read full text button */}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => setViewingRule(rule)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                    >
                      <span>Полный текст и нюансы</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </EditableDesignBlock>
          ))}

          {filteredRules.length === 0 && (
            <div className="py-12 text-center text-neutral-400">Разделы правил не найдены</div>
          )}
        </div>
      )}

      {/* Modal: View Sign Details */}
      {viewingSign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col p-6">
            <button
              onClick={() => setViewingSign(null)}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <RoadSignSvg sign={viewingSign} size="xl" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded bg-neutral-100 text-neutral-700 font-mono text-xs font-bold mb-1">
                Знак {viewingSign.number}
              </div>
              <h3 className="text-lg font-bold text-neutral-900">{viewingSign.name}</h3>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mt-0.5">
                Категория:{' '}
                {viewingSign.category === 'priority'
                  ? 'Знаки приоритета'
                  : viewingSign.category === 'prohibitory'
                  ? 'Запрещающие знаки'
                  : viewingSign.category === 'warning'
                  ? 'Предупреждающие знаки'
                  : viewingSign.category === 'mandatory'
                  ? 'Предписывающие знаки'
                  : viewingSign.category === 'special'
                  ? 'Знаки особых предписаний'
                  : 'Информационные знаки'}
              </p>
            </div>

            <div className="mt-5 space-y-3 text-xs text-neutral-700">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <span className="font-bold text-neutral-900 block mb-1">Описание по ПДД:</span>
                <p>{viewingSign.description}</p>
              </div>
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-blue-950">
                <span className="font-bold text-blue-900 block mb-1">
                  Что обязан делать водитель (Категория B):
                </span>
                <p>{viewingSign.meaning}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingSign(null)}
                className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800"
              >
                Понятно, закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Full Rule Text */}
      {viewingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 max-h-[85vh] overflow-y-auto flex flex-col p-6">
            <button
              onClick={() => setViewingRule(null)}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {viewingRule.sectionNumber}
              </span>
              <h2 className="text-lg font-bold text-neutral-900 mt-1">{viewingRule.title}</h2>
              <p className="text-xs text-neutral-500 mt-0.5">{viewingRule.summary}</p>
            </div>

            <div className="text-xs text-neutral-700 space-y-4 leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              <p className="whitespace-pre-line">{viewingRule.content}</p>
            </div>

            {viewingRule.keyPoints && viewingRule.keyPoints.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold text-neutral-800 mb-2">Главные выводы для тестов:</h4>
                <ul className="space-y-1.5">
                  {viewingRule.keyPoints.map((pt, i) => (
                    <li key={i} className="text-xs text-neutral-700 flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingRule(null)}
                className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Sign Creator / Editor Modal */}
      {signFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col p-6">
            <button
              onClick={() => setSignFormOpen(false)}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-neutral-900 mb-4">
              {editingSignId ? 'Редактировать дорожный знак' : 'Добавить новый знак ПДД'}
            </h3>

            <form onSubmit={handleSaveSign} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Номер знака</label>
                  <input
                    type="text"
                    required
                    value={signFormData.number}
                    onChange={(e) => setSignFormData({ ...signFormData, number: e.target.value })}
                    placeholder="например 2.1"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Категория</label>
                  <select
                    value={signFormData.category}
                    onChange={(e) =>
                      setSignFormData({ ...signFormData, category: e.target.value as SignCategory })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="priority">Приоритета</option>
                    <option value="prohibitory">Запрещающие</option>
                    <option value="warning">Предупреждающие</option>
                    <option value="mandatory">Предписывающие</option>
                    <option value="special">Особых предписаний</option>
                    <option value="information">Информационные</option>
                    <option value="service">Знаки сервиса</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Название знака</label>
                <input
                  type="text"
                  required
                  value={signFormData.name}
                  onChange={(e) => setSignFormData({ ...signFormData, name: e.target.value })}
                  placeholder="например Главная дорога"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              {/* Image control: Upload from PC or URL */}
              <ImageInputControl
                label="Изображение знака (файл с ПК или URL-ссылка)"
                placeholder="https://... или выберите файл с компьютера"
                value={signFormData.imageUrl}
                onChange={(val) => setSignFormData({ ...signFormData, imageUrl: val })}
              />

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Описание знака</label>
                <textarea
                  rows={2}
                  required
                  value={signFormData.description}
                  onChange={(e) =>
                    setSignFormData({ ...signFormData, description: e.target.value })
                  }
                  placeholder="Официальное описание из правил дорожного движения"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Значение для курсанта (что делать водителю)
                </label>
                <textarea
                  rows={2}
                  required
                  value={signFormData.meaning}
                  onChange={(e) => setSignFormData({ ...signFormData, meaning: e.target.value })}
                  placeholder="Конкретные действия водителя при проезде знака"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSignFormOpen(false)}
                  className="px-3 py-2 border rounded-xl text-neutral-600 hover:bg-neutral-50 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold"
                >
                  {editingSignId ? 'Сохранить изменения' : 'Создать знак'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Rule Creator / Editor Modal */}
      {ruleFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setRuleFormOpen(false)}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-neutral-900 mb-4">
              {editingRuleId ? 'Редактировать раздел правил' : 'Добавить новый раздел ПДД'}
            </h3>

            <form onSubmit={handleSaveRule} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Номер раздела / главы
                  </label>
                  <input
                    type="text"
                    required
                    value={ruleFormData.sectionNumber}
                    onChange={(e) =>
                      setRuleFormData({ ...ruleFormData, sectionNumber: e.target.value })
                    }
                    placeholder="например Раздел 13"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Название раздела
                  </label>
                  <input
                    type="text"
                    required
                    value={ruleFormData.title}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, title: e.target.value })}
                    placeholder="например Проезд перекрёстков"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Краткое резюме раздела
                </label>
                <input
                  type="text"
                  required
                  value={ruleFormData.summary}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, summary: e.target.value })}
                  placeholder="В 1-2 предложениях суть раздела"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Ключевые пункты для экзамена (каждый с новой строки)
                </label>
                <textarea
                  rows={3}
                  value={ruleFormData.keyPointsText}
                  onChange={(e) =>
                    setRuleFormData({ ...ruleFormData, keyPointsText: e.target.value })
                  }
                  placeholder="Трамвай на равнозначной имеет преимущество&#10;При повороте налево уступаем встречным"
                  className="w-full px-3 py-2 border rounded-xl font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Полный текст статьи
                </label>
                <textarea
                  rows={5}
                  required
                  value={ruleFormData.content}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, content: e.target.value })}
                  placeholder="Подробные правила, статьи и формулировки"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRuleFormOpen(false)}
                  className="px-3 py-2 border rounded-xl text-neutral-600 hover:bg-neutral-50 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold"
                >
                  {editingRuleId ? 'Сохранить изменения' : 'Создать раздел'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
