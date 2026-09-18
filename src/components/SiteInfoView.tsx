import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Info,
  Car,
  ShieldCheck,
  CheckCircle,
  FileText,
  Clock,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Save,
  X,
  Code,
  Award,
} from 'lucide-react';

export const SiteInfoView: React.FC = () => {
  const { siteInfo, updateSiteInfo, footerSettings, isAdmin } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    version: siteInfo.version || 'v.0.09',
    developer: 'Мельник Сергей (SelJax)',
    schoolName: siteInfo.schoolName || 'Автошкола ДОСААФ',
    description: siteInfo.description || '',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteInfo({
      version: formData.version,
      developer: formData.developer,
      schoolName: formData.schoolName,
      description: formData.description,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-400 text-neutral-900 shadow-xs">
                Версия {siteInfo.version || 'v.0.09'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-blue-100 border border-white/20">
                Официальный релиз 2026
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Информация о сайте и Пресс-релиз
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              Образовательный портал автошколы ДОСААФ для подготовки кандидатов в водители транспортных средств категории «B» (МКПП и АКПП).
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setFormData({
                  version: siteInfo.version,
                  developer: siteInfo.developer || 'Мельник Сергей (SelJax)',
                  schoolName: siteInfo.schoolName,
                  description: siteInfo.description,
                });
                setIsEditing(true);
              }}
              className="px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-900 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center gap-2 shrink-0 self-start md:self-auto cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-700" />
              <span>Редактировать информацию</span>
            </button>
          )}
        </div>
      </div>

      {/* Edit Form Modal for Admin */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 overflow-hidden">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-600" />
              <span>Редактирование информации о сайте</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Версия сайта
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="v.0.09"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Создатель / Разработчик
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.developer}
                    onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
                    placeholder="Мельник Сергей (SelJax)"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Название автошколы
                </label>
                <input
                  type="text"
                  required
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  placeholder="Автошкола ДОСААФ"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Пресс-описание и концепция
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border rounded-xl text-neutral-600 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Сохранить</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Info Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Press Release text */}
        <div className="md:col-span-2 space-y-6">
          {/* Official Press Release */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-neutral-900">
                Официальная пресс-информация автошколы
              </h2>
            </div>

            <div className="text-xs sm:text-sm text-neutral-700 leading-relaxed space-y-3 font-normal">
              <p>
                {siteInfo.description}
              </p>
              <p>
                ДОСААФ России (Добровольное общество содействия армии, авиации и флоту) на протяжении десятилетий является признанным лидером в сфере подготовки высококвалифицированных водителей. Наш учебный центр сочетает богатые традиции технического обучения и современные цифровые образовательные стандарты.
              </p>
              <p>
                Программа подготовки включает в себя углубленное изучение Правил дорожного движения Российской Федерации в редакции 2026 года, практические занятия на специализированном автодроме, городские экзаменационные маршруты и адаптивную систему компьютерного тестирования.
              </p>
            </div>
          </div>

          {/* Core Portal Features in v0.04 */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-neutral-900">
                Возможности платформы (Релиз {siteInfo.version})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {siteInfo.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <h3 className="text-xs font-bold text-neutral-900">{feat.title}</h3>
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata, Creator, Contacts */}
        <div className="space-y-6">
          {/* Creator & Version Card */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Сведения о разработчике
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-0.5">
                  Создатель платформы
                </span>
                <strong className="text-sm text-neutral-900 block font-bold">
                  {siteInfo.developer || 'Мельник Сергей (SelJax)'}
                </strong>
              </div>

              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-0.5">
                  Версия сборки
                </span>
                <span className="text-xs font-mono font-bold text-blue-700">
                  {siteInfo.version} (Выпуск от 19.09.2026)
                </span>
              </div>

              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-0.5">
                  Категория ТС
                </span>
                <span className="text-xs font-semibold text-neutral-800">
                  Категория «B» (МКПП и АКПП)
                </span>
              </div>
            </div>
          </div>

          {/* School Contacts (matches footer) */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-3.5 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 pb-2 border-b border-neutral-100">
              Контакты учебной части
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-neutral-700">
                <Phone className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                    Телефон автошколы
                  </span>
                  <a href={`tel:${footerSettings.phone}`} className="font-semibold text-blue-700 hover:underline">
                    {footerSettings.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-neutral-700">
                <Mail className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                    Электронная почта
                  </span>
                  <a href={`mailto:${footerSettings.email}`} className="font-semibold text-blue-700 hover:underline">
                    {footerSettings.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-neutral-700">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                    Адрес учебного комплекса
                  </span>
                  <span className="text-neutral-800 leading-snug block">
                    {footerSettings.address}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-neutral-700">
                <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                    График работы
                  </span>
                  <span className="text-neutral-800 leading-snug block">
                    {footerSettings.workHours}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
