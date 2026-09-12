import React, { useRef, useState } from 'react';
import { Upload, Link2, X, Image as ImageIcon } from 'lucide-react';

interface ImageInputControlProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export const ImageInputControl: React.FC<ImageInputControlProps> = ({
  value = '',
  onChange,
  label = 'Изображение',
  placeholder = 'https://example.com/image.png или загрузите файл с компьютера',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения (PNG, JPG, SVG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        onChange(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-semibold text-neutral-700 text-xs block">{label}</label>
        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded ${
              mode === 'upload' ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Файл с ПК
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded ${
              mode === 'url' ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            По ссылке (URL)
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-neutral-250 hover:border-neutral-400 bg-neutral-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center justify-center gap-1.5 text-neutral-600">
            <Upload className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium">
              Нажмите для выбора файла или перетащите сюда
            </span>
            <span className="text-[10px] text-neutral-400">
              Поддерживаются JPG, PNG, WEBP, SVG
            </span>
          </div>
        </div>
      ) : (
        <div className="relative">
          <Link2 className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-8 pr-3 py-2 border rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Preview if present */}
      {value && (
        <div className="flex items-center gap-3 p-2 bg-neutral-100 rounded-xl border border-neutral-200">
          <div className="w-14 h-14 rounded-lg bg-white overflow-hidden flex items-center justify-center border border-neutral-200 shrink-0">
            <img
              src={value}
              alt="Предпросмотр"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-neutral-800 block truncate">
              Изображение прикреплено
            </span>
            <span className="text-[10px] text-neutral-500 block truncate">
              {value.startsWith('data:') ? 'Загружено из файла (Base64)' : value}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-neutral-200"
            title="Удалить картинку"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
