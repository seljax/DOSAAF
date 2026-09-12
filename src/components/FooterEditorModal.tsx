import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FooterSettings } from '../types';
import { X, Save, RotateCcw, Building, Phone, Mail, MapPin, Clock, User, ShieldCheck } from 'lucide-react';

interface FooterEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FooterEditorModal: React.FC<FooterEditorModalProps> = ({ isOpen, onClose }) => {
  const { footerSettings, updateFooterSettings } = useApp();

  const [formData, setFormData] = useState<FooterSettings>(footerSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync when opening
  React.useEffect(() => {
    if (isOpen) {
      setFormData(footerSettings);
      setSaveSuccess(false);
    }
  }, [isOpen, footerSettings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFooterSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetToDefaults = () => {
    if (confirm('Сбросить реквизиты подвала к стандартным значениям ДОСААФ?')) {
      const defaultFooter: FooterSettings = {
        schoolName: 'Автошкола ДОСААФ России',
        creatorName: 'Мельник Сергей (SelJax)',
        email: 'dosaaf.avto@mail.ru',
        phone: '+7 (999) 000-00-00',
        address: 'г. Москва, Волоколамское шоссе, д. 88, стр. 1',
        workHours: 'Пн-Пт: 09:00 - 20:00, Сб-Вс: 10:00 - 17:00',
        categoryNotice: 'Официальная подготовка водителей ТС категории «B» (МКПП и АКПП).',
        licenseNotice: 'Лицензия на осуществление образовательной деятельности №038472.',
      };
      setFormData(defaultFooter);
      updateFooterSettings(defaultFooter);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-neutral-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Редактирование подвала сайта</h2>
              <span className="text-xs text-neutral-400 block">
                Настройка контактов, телефона, email и реквизитов
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Параметры подвала успешно сохранены!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-semibold text-neutral-700 flex items-center gap-1.5 mb-1">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>Название школы</span>
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-neutral-50/50 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-purple-600" />
                <span>Создатель / Разработчик</span>
              </label>
              <input
                type="text"
                required
                value={formData.creatorName}
                onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-neutral-50/50 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-semibold text-neutral-700 flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Email автошколы</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-neutral-50/50 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Телефон автошколы</span>
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-neutral-50/50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-neutral-700 flex items-center gap-1.5 mb-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Адрес автошколы</span>
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl bg-neutral-50/50 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-700 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Часы работы</span>
            </label>
            <input
              type="text"
              required
              value={formData.workHours}
              onChange={(e) => setFormData({ ...formData, workHours: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl bg-neutral-50/50 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">
              Уведомление о категории обучения
            </label>
            <input
              type="text"
              value={formData.categoryNotice}
              onChange={(e) => setFormData({ ...formData, categoryNotice: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl bg-neutral-50/50 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">
              Лицензия и примечания
            </label>
            <input
              type="text"
              value={formData.licenseNotice || ''}
              onChange={(e) => setFormData({ ...formData, licenseNotice: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl bg-neutral-50/50 focus:bg-white"
            />
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-3 py-2 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 flex items-center gap-1.5 transition-colors font-medium text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить к стандарту</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-50 font-semibold"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Сохранить подвал</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
