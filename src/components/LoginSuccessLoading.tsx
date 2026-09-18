import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface LoginSuccessLoadingProps {
  userName: string;
  role: 'student' | 'admin';
  onFinished: () => void;
}

export const LoginSuccessLoading: React.FC<LoginSuccessLoadingProps> = ({
  userName,
  role,
  onFinished,
}) => {
  const [progress, setProgress] = useState(15);
  const [phase, setPhase] = useState<'auth' | 'sync' | 'ready'>('auth');

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(55);
      setPhase('sync');
    }, 450);

    const t2 = setTimeout(() => {
      setProgress(100);
      setPhase('ready');
    }, 1050);

    const t3 = setTimeout(() => {
      onFinished();
    }, 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinished]);

  return (
    <div className="fixed inset-0 z-50 portal-grid-bg flex flex-col items-center justify-center p-6 text-[#f2efeb] select-none">
      <div
        className="w-full max-w-md bg-[#1a1a1c] border border-[rgba(242,239,235,0.15)] p-8 sm:p-10 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-200"
        style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.85)' }}
      >
        {/* Logo box matching Variation 3 */}
        <div className="relative">
          <div className="w-16 h-16 bg-white p-1 border-2 border-[#f59e0b] shadow-lg flex items-center justify-center">
            <img
              src="/favicon.jpeg"
              alt="ДОСААФ"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#f59e0b] text-black p-0.5 shadow-md">
            <CheckCircle2 className="w-4 h-4 stroke-[3]" />
          </div>
        </div>

        {/* Text descriptions */}
        <div className="space-y-1.5 w-full">
          <span className="font-jetbrains text-[10px] uppercase tracking-[0.2em] text-[#f59e0b] block">
            // {role === 'admin' ? 'ДОСТУП АДМИНИСТРАТОРА' : 'ДОСТУП КУРСАНТА'}
          </span>
          <h2 className="font-oswald text-2xl sm:text-3xl uppercase font-bold text-[#f2efeb] tracking-wide">
            {role === 'admin' ? 'СЕССИЯ АВТОРИЗОВАНА' : 'ДОБРО ПОЖАЛОВАТЬ!'}
          </h2>
          <p className="font-jetbrains text-xs text-[rgba(242,239,235,0.7)] mt-1">
            Пользователь: {userName || (role === 'admin' ? 'АДМИНИСТРАТОР' : 'КУРСАНТ')}
          </p>
        </div>

        {/* Tactical Progress Bar & Phase Status */}
        <div className="w-full space-y-3 pt-2">
          <div className="w-full bg-[#111113] border border-[rgba(242,239,235,0.15)] h-3 overflow-hidden p-0.5">
            <div
              className="bg-[#f59e0b] h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between font-jetbrains text-[11px] text-[rgba(242,239,235,0.6)]">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#f59e0b]" />
              {phase === 'auth' && 'Проверка учётных данных...'}
              {phase === 'sync' && 'Синхронизация профиля...'}
              {phase === 'ready' && 'Вход выполнен!'}
            </span>
            <span className="text-[#f59e0b] font-bold">{progress}%</span>
          </div>
        </div>

        {/* Bottom telemetry */}
        <div className="w-full pt-4 border-t border-[rgba(242,239,235,0.08)] flex justify-between font-jetbrains text-[9px] text-[rgba(242,239,235,0.35)] tracking-widest uppercase">
          <span>Узел: ДОСААФ</span>
          <span>Версия v.0.09</span>
        </div>
      </div>
    </div>
  );
};
