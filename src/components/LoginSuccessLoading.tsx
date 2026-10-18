import React, { useEffect, useRef, useState } from 'react';
import { reloadAllFromServer } from '../context/AppContext';
import { WheelLoadingPanel, LoadingStep } from './WheelLoader';

interface LoginSuccessLoadingProps {
  userName: string;
  role: 'student' | 'admin';
  onFinished: () => void;
}

// Изображения интерфейса, которые нужны сразу после входа
const PRELOAD_IMAGES = ['/favicon.jpeg', '/dosaaf_logo.jpg'];

// Минимальное время показа, чтобы экран не «мигал» на быстрых сетях
const MIN_VISIBLE_MS = 1200;

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    const done = () => resolve();
    img.onload = done;
    img.onerror = done;
    img.src = src;
    setTimeout(done, 8000);
  });

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(bytes / 1024))} КБ`;

export const LoginSuccessLoading: React.FC<LoginSuccessLoadingProps> = ({ userName, role, onFinished }) => {
  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: 'auth', label: 'Логин и пароль проверены', status: 'done' },
    { id: 'data', label: 'Загрузка данных с сервера', status: 'active' },
    { id: 'assets', label: 'Загрузка изображений и шрифтов', status: 'pending' },
    { id: 'ui', label: 'Подготовка интерфейса', status: 'pending' },
  ]);
  const [progress, setProgress] = useState(10);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    const setStep = (id: string, patch: Partial<LoadingStep>) => {
      if (cancelled) return;
      setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    };

    (async () => {
      // 1. Свежие данные с сервера — прогресс по реально полученным байтам (10% → 70%)
      const result = await reloadAllFromServer(({ loadedBytes, totalBytes }) => {
        if (cancelled) return;
        const ratio = totalBytes ? Math.min(1, loadedBytes / totalBytes) : 0.5;
        setProgress(10 + ratio * 60);
        setStep('data', { detail: formatBytes(loadedBytes) });
      });
      setStep(
        'data',
        result.ok
          ? { status: 'done', detail: formatBytes(result.bytes) }
          : { status: 'error', detail: 'нет связи, используются сохранённые данные' }
      );
      if (!cancelled) setProgress(70);

      // 2. Изображения и шрифты (70% → 95%)
      setStep('assets', { status: 'active' });
      const tasks: Promise<unknown>[] = PRELOAD_IMAGES.map(preloadImage);
      if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
        tasks.push((document as any).fonts.ready);
      }
      let finished = 0;
      await Promise.all(
        tasks.map((t) =>
          t.then(() => {
            finished++;
            if (!cancelled) setProgress(70 + (finished / tasks.length) * 25);
          })
        )
      );
      setStep('assets', { status: 'done', detail: `${tasks.length} из ${tasks.length}` });

      // 3. Готово
      setStep('ui', { status: 'active' });
      const left = MIN_VISIBLE_MS - (Date.now() - startedAt);
      if (left > 0) await new Promise((r) => setTimeout(r, left));
      if (cancelled) return;
      setStep('ui', { status: 'done' });
      setProgress(100);
      await new Promise((r) => setTimeout(r, 350));
      if (!cancelled) onFinishedRef.current();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 portal-grid-bg flex flex-col items-center justify-center p-6 text-[#f2efeb] select-none">
      <WheelLoadingPanel
        badge={role === 'admin' ? 'ДОСТУП АДМИНИСТРАТОРА' : 'ДОСТУП КУРСАНТА'}
        title={role === 'admin' ? 'СЕССИЯ АВТОРИЗОВАНА' : 'ДОБРО ПОЖАЛОВАТЬ!'}
        subtitle={`Пользователь: ${userName || (role === 'admin' ? 'АДМИНИСТРАТОР' : 'КУРСАНТ')}`}
        steps={steps}
        progress={progress}
      />
    </div>
  );
};
