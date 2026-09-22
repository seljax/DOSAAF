import React from 'react';
import { ExternalLink, ShieldCheck, BookOpen, AlertCircle } from 'lucide-react';

export const ExternalExamView: React.FC = () => {
  return (
    <div className="space-y-5">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-7 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center shrink-0 shadow-lg">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
              Практический тренажёр
            </span>
            <h1 className="text-2xl font-black tracking-tight">
              Тест ГИБДД — онлайн практика
            </h1>
            <p className="text-xs text-emerald-100 mt-1 leading-relaxed max-w-2xl">
              Дополнительный тренажёр для подготовки к экзамену в ГИБДД. 
              <strong className="text-white"> Результаты этого теста не сохраняются</strong> в вашей 
              ведомости — это только для самостоятельной практики.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/15 flex items-center gap-2 text-xs text-emerald-100">
          <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
          <span>
            Этот тест — сторонний ресурс. Прогресс не синхронизируется с вашим личным кабинетом.
          </span>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <p className="font-bold mb-1">Как пользоваться:</p>
          <ul className="space-y-1 leading-relaxed list-disc pl-4">
            <li>Пройдите тест внутри окна ниже — как на настоящем экзамене в ГИБДД.</li>
            <li>Ваши ответы и результат видны только вам, они не сохраняются в системе ДОСААФ.</li>
            <li>Для официальной сдачи экзамена перейдите на вкладку <strong>«Тесты и экзамен»</strong>.</li>
          </ul>
        </div>
      </div>

      {/* Iframe container */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
        {/* Header bar */}
        <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-xs font-bold text-neutral-700 ml-2">
              pdd-exam.ru / gibdd-exam
            </span>
          </div>

          <a
            href="https://pdd-exam.ru/gibdd-exam/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 hover:underline"
          >
            <span>Открыть в новом окне</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Iframe */}
        <div className="w-full bg-neutral-100">
          <iframe
            src="https://pdd-exam.ru/gibdd-exam/"
            title="Онлайн-экзамен ГИБДД"
            className="w-full border-0"
            style={{ height: '900px', minHeight: '700px' }}
            allow="fullscreen"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      {/* Fallback link */}
      <div className="text-center text-xs text-neutral-500 pb-2">
        Если тест не отображается —{' '}
        <a
          href="https://pdd-exam.ru/gibdd-exam/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline font-semibold"
        >
          откройте его в новом окне
        </a>
        .
      </div>
    </div>
  );
};