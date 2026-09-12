import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { GroupConfig } from '../types';
import { Layers, X, Save, CheckCircle2, Plus, Trash2, ShieldAlert } from 'lucide-react';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({ isOpen, onClose }) => {
  const { groups, addGroup, updateGroup, deleteGroup } = useApp();
  const [localGroups, setLocalGroups] = useState<GroupConfig[]>(groups);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newGroupNumber, setNewGroupNumber] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTransmission, setNewGroupTransmission] = useState<'МКПП' | 'АКПП'>('МКПП');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // Synchronize when opened
  useEffect(() => {
    if (isOpen) {
      setLocalGroups(groups);
      setIsAddingNew(false);
    }
  }, [isOpen, groups]);

  if (!isOpen) return null;

  const handleChange = (id: string, field: keyof GroupConfig, value: string) => {
    setLocalGroups((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        return { ...g, [field]: value };
      })
    );
  };

  const handleAddNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = newGroupNumber.trim() || String(localGroups.length + 1);
    const name = newGroupName.trim() || `Группа №${num}`;
    const label =
      newGroupTransmission === 'АКПП' ? 'Автомат (АКПП)' : 'Механика (МКПП)';

    addGroup({
      number: num,
      name,
      transmission: newGroupTransmission,
      transmissionLabel: label,
      description: newGroupDesc.trim(),
    });

    setNewGroupNumber('');
    setNewGroupName('');
    setNewGroupDesc('');
    setIsAddingNew(false);
  };

  const handleDeleteGroup = (id: string, groupName: string) => {
    if (localGroups.length <= 1) {
      alert('Нельзя удалить единственную группу!');
      return;
    }
    if (confirm(`Вы действительно хотите удалить группу «${groupName}»?`)) {
      deleteGroup(id);
      setLocalGroups((prev) => prev.filter((g) => g.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localGroups.forEach((g) => {
      updateGroup(g.id, {
        number: g.number,
        name: g.name.trim() || `Группа №${g.number}`,
        transmission: g.transmission,
        transmissionLabel: g.transmissionLabel,
        description: g.description,
      });
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-neutral-900">Управление учебными группами</h3>
            <span className="text-xs text-neutral-500 font-medium">
              Добавление, редактирование и настройка учебных групп автошколы
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-600 mb-5 leading-relaxed bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
          Вы можете создавать любое количество групп (например, добавить Группу №9 или №10), изменять номер, название и тип трансмиссии (МКПП / АКПП). Все фильтры, расписание и протоколы экзаменов адаптируются автоматически.
        </p>

        {/* Existing groups */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="space-y-4">
            {localGroups.map((group, idx) => (
              <div
                key={group.id}
                className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        group.transmission === 'МКПП' ? 'bg-blue-600' : 'bg-indigo-600'
                      }`}
                    />
                    Группа {idx + 1}: {group.name} ({group.transmission})
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-200 text-neutral-700">
                      ID: {group.id}
                    </span>
                    {localGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Удалить группу"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">
                      Номер группы
                    </label>
                    <input
                      type="text"
                      required
                      value={group.number}
                      onChange={(e) => handleChange(group.id, 'number', e.target.value)}
                      placeholder="7"
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">
                      Полное название
                    </label>
                    <input
                      type="text"
                      required
                      value={group.name}
                      onChange={(e) => handleChange(group.id, 'name', e.target.value)}
                      placeholder="Группа №7"
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">
                      Тип трансмиссии
                    </label>
                    <select
                      value={group.transmission}
                      onChange={(e) =>
                        handleChange(group.id, 'transmission', e.target.value as 'МКПП' | 'АКПП')
                      }
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                    >
                      <option value="МКПП">МКПП (Механика)</option>
                      <option value="АКПП">АКПП (Автомат)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">
                      Подпись трансмиссии
                    </label>
                    <input
                      type="text"
                      value={group.transmissionLabel}
                      onChange={(e) => handleChange(group.id, 'transmissionLabel', e.target.value)}
                      placeholder="Механика (МКПП)"
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Примечание / Описание группы
                  </label>
                  <input
                    type="text"
                    value={group.description || ''}
                    onChange={(e) => handleChange(group.id, 'description', e.target.value)}
                    placeholder="Автомобили Lada Vesta, Renault Logan..."
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add New Group Toggle / Form */}
          {!isAddingNew ? (
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="w-full py-3 border-2 border-dashed border-neutral-300 hover:border-amber-400 hover:bg-amber-50/50 text-neutral-700 hover:text-amber-800 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить новую учебную группу</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-amber-700" />
                  Новая учебная группа
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-neutral-500 hover:text-neutral-800"
                >
                  Отмена
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Номер</label>
                  <input
                    type="text"
                    value={newGroupNumber}
                    onChange={(e) => setNewGroupNumber(e.target.value)}
                    placeholder="9"
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Название</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder={`Группа №${newGroupNumber || localGroups.length + 1}`}
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Трансмиссия</label>
                  <select
                    value={newGroupTransmission}
                    onChange={(e) => setNewGroupTransmission(e.target.value as 'МКПП' | 'АКПП')}
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-semibold"
                  >
                    <option value="МКПП">МКПП (Механика)</option>
                    <option value="АКПП">АКПП (Автомат)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Описание (опционально)</label>
                  <input
                    type="text"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="Например: Новая вечерняя группа"
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddNewSubmit}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Создать группу</span>
              </button>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Параметры групп успешно сохранены!</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-100 rounded-xl font-medium"
            >
              Закрыть
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить изменения</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
