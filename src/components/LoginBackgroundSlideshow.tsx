import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, ImageOff } from 'lucide-react';

import slide1 from '../assets/images/car_curved_road_1789469156293.jpg';
import slide2 from '../assets/images/audi_brown_building_1789469170774.jpg';
import slide3 from '../assets/images/mustang_autumn_1789469187848.jpg';
import slide4 from '../assets/images/mustang_desert_1789469200264.jpg';
import slide5 from '../assets/images/supercar_garage_1789469213399.jpg';
import slide6 from '../assets/images/sportscar_track_1789469225205.jpg';
import slide7 from '../assets/images/blue_sportscar_1789469237617.jpg';

export interface SlideItem {
  id: number;
  src: string;
  title: string;
  subtitle: string;
}

export const SLIDES: SlideItem[] = [
  {
    id: 1,
    src: slide1,
    title: 'Вираж на горной трассе',
    subtitle: 'Отработка скоростного прохождения поворотов',
  },
  {
    id: 2,
    src: slide2,
    title: 'Городская среда',
    subtitle: 'Маневрирование и парковка в мегаполисе',
  },
  {
    id: 3,
    src: slide3,
    title: 'Осенний маршрут',
    subtitle: 'Управление автомобилем на скользком покрытии',
  },
  {
    id: 4,
    src: slide4,
    title: 'Загородная магистраль',
    subtitle: 'Движение по скоростным трассам и обгоны',
  },
  {
    id: 5,
    src: slide5,
    title: 'Техническая подготовка',
    subtitle: 'Знание устройства автомобиля и ТО',
  },
  {
    id: 6,
    src: slide6,
    title: 'Гоночный трек',
    subtitle: 'Контраварийное вождение и контроль сцепления',
  },
  {
    id: 7,
    src: slide7,
    title: 'Ночная трасса и оптика',
    subtitle: 'Безопасное движение в темное время суток',
  },
];

const STORAGE_KEY = 'dosaaf_login_slideshow_enabled';

interface LoginBackgroundSlideshowProps {
  className?: string;
}

export const LoginBackgroundSlideshow: React.FC<LoginBackgroundSlideshowProps> = ({ className = '' }) => {
  // Load initial preference from localStorage (default: enabled)
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== 'disabled';
    } catch {
      return true;
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Toggle optimization mode and persist
  const toggleEnabled = () => {
    setIsEnabled((prev) => {
      const next = !prev;
      try {
        if (next) {
          localStorage.removeItem(STORAGE_KEY);
        } else {
          localStorage.setItem(STORAGE_KEY, 'disabled');
        }
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Slideshow auto-advance timer (only active if enabled and not paused)
  useEffect(() => {
    if (!isEnabled || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isEnabled, isPaused]);

  return (
    <>
      {/* BACKGROUND SLIDESHOW LAYER */}
      {isEnabled ? (
        <div
          id="login-slideshow-container"
          className={`fixed inset-0 pointer-events-none overflow-hidden z-0 ${className}`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={SLIDES[currentIndex].src}
                alt={SLIDES[currentIndex].title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform select-none"
              />
            </motion.div>
          </AnimatePresence>

          {/* Deep contrast gradient overlay for pristine text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#111113]/85 via-[#111113]/65 to-[#111113]/90 backdrop-blur-[1px]" />

          {/* Subtle grid pattern overlay for brand aesthetic consistency */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(242, 239, 235, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 239, 235, 0.15) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>
      ) : (
        /* High-performance fallback: zero GPU/CPU rendering overhead */
        <div
          id="login-slideshow-disabled"
          className="fixed inset-0 pointer-events-none z-0 bg-[#111113]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(242, 239, 235, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 239, 235, 0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* TOP-RIGHT CONTROLS: OPTIMIZATION TOGGLE */}
      <div
        id="login-slideshow-controls"
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2 select-none"
      >
        {/* Toggle button */}
        <button
          id="slideshow-toggle-btn"
          type="button"
          onClick={toggleEnabled}
          title={
            isEnabled
              ? 'Отключить фоновые картинки'
              : 'Включить фоновое слайдшоу'
          }
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-jetbrains uppercase tracking-wider border cursor-pointer transition-all shadow-lg backdrop-blur-md ${
            isEnabled
              ? 'bg-[#111113]/85 border-[rgba(242,239,235,0.2)] text-[rgba(242,239,235,0.75)] hover:border-[#f59e0b] hover:text-[#f2efeb]'
              : 'bg-[#f59e0b]/15 border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b]/25'
          }`}
        >
          {isEnabled ? (
            <>
              <ImageOff className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span className="hidden xs:inline sm:inline">Фон:</span>
              <span>Вкл</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span className="hidden xs:inline sm:inline">Фон:</span>
              <span>Выкл</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};
