import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Maximize2 } from 'lucide-react';

interface ZoomableImageProps {
  src: string;
  alt?: string;
  className?: string;
  /** Текст вопроса, который дублируется под увеличенной картинкой */
  caption?: string;
}

/**
 * Картинка вопроса: по клику открывается крупно на весь экран,
 * под ней — текст вопроса. Закрывается кликом в любом месте или клавишей Esc.
 */
export const ZoomableImage: React.FC<ZoomableImageProps> = ({
  src,
  alt = 'Иллюстрация к вопросу',
  className = '',
  caption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  // При смене вопроса закрываем увеличение
  useEffect(() => {
    setIsOpen(false);
  }, [src]);

  return (
    <>
      <div
        className="relative inline-block cursor-zoom-in"
        onClick={() => setIsOpen(true)}
        title="Нажмите, чтобы увеличить"
      >
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          draggable={false}
          className={`select-none pointer-events-none ${className}`}
        />
        <span className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-1 rounded-lg bg-black/55 text-white text-[10px] font-semibold pointer-events-none">
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Увеличить</span>
        </span>
      </div>

      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-4 sm:p-8 cursor-zoom-out select-none animate-in fade-in duration-150"
            onClick={close}
            onContextMenu={(e) => e.preventDefault()}
          >
            <button
              onClick={close}
              className="absolute top-3 right-3 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Закрыть (Esc)"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={src}
              alt={alt}
              referrerPolicy="no-referrer"
              draggable={false}
              className="rounded-xl shadow-2xl object-contain pointer-events-none"
              style={{ width: 'min(96vw, 1400px)', maxHeight: caption ? '72vh' : '88vh' }}
            />

            {caption && (
              <p className="max-w-4xl text-center text-white text-base sm:text-xl font-bold leading-snug">
                {caption}
              </p>
            )}

            <p className="text-[11px] text-white/50">Нажмите в любом месте или Esc, чтобы закрыть</p>
          </div>,
          document.body
        )}
    </>
  );
};
