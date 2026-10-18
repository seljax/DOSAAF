import React from 'react';
import { CheckCircle2, Loader2, Circle, XCircle } from 'lucide-react';

// ==================== АНИМАЦИЯ: КОЛЕСО С ДЫМОМ ====================

const WHEEL_CSS = `
@keyframes dosaaf-wheel-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes dosaaf-wheel-shake {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(0.6px, -0.8px); }
  50% { transform: translate(-0.6px, 0.4px); }
  75% { transform: translate(0.4px, 0.8px); }
}
@keyframes dosaaf-smoke {
  0%   { transform: translate(0, 0) scale(0.35); opacity: 0; }
  12%  { opacity: 0.75; }
  100% { transform: translate(var(--dx), var(--dy)) scale(var(--s)); opacity: 0; }
}
@keyframes dosaaf-road {
  from { transform: translateX(0); }
  to { transform: translateX(-48px); }
}
@keyframes dosaaf-spark {
  0% { transform: translate(0, 0); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)); opacity: 0; }
}
.dosaaf-wheel-rotor { transform-origin: 60px 60px; animation: dosaaf-wheel-spin 0.45s linear infinite; }
.dosaaf-wheel-body { animation: dosaaf-wheel-shake 0.18s linear infinite; }
.dosaaf-smoke-puff {
  position: absolute; border-radius: 9999px;
  background: radial-gradient(circle at 40% 40%, rgba(235,232,228,0.85), rgba(160,160,165,0.45) 55%, rgba(120,120,125,0) 72%);
  filter: blur(3px);
  animation: dosaaf-smoke var(--t) ease-out infinite;
  animation-delay: var(--d);
  opacity: 0;
}
.dosaaf-road-dashes { animation: dosaaf-road 0.35s linear infinite; }
.dosaaf-spark { position: absolute; width: 3px; height: 3px; border-radius: 9999px; background: #f59e0b;
  box-shadow: 0 0 6px #f59e0b; animation: dosaaf-spark 0.5s ease-out infinite; animation-delay: var(--d); opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .dosaaf-wheel-rotor { animation-duration: 2.5s; }
  .dosaaf-wheel-body, .dosaaf-road-dashes, .dosaaf-spark { animation: none; }
  .dosaaf-smoke-puff { animation-duration: 6s; }
}
`;

const SMOKE_PUFFS = [
  { size: 34, dx: -90, dy: -46, s: 2.6, t: 1.6, d: 0 },
  { size: 28, dx: -120, dy: -24, s: 2.2, t: 1.8, d: 0.25 },
  { size: 38, dx: -70, dy: -64, s: 3.0, t: 1.5, d: 0.5 },
  { size: 24, dx: -140, dy: -40, s: 2.4, t: 2.0, d: 0.75 },
  { size: 32, dx: -100, dy: -70, s: 2.8, t: 1.7, d: 1.0 },
  { size: 26, dx: -60, dy: -30, s: 2.0, t: 1.4, d: 1.2 },
  { size: 30, dx: -130, dy: -58, s: 2.5, t: 1.9, d: 1.4 },
];

const SPARKS = [
  { dx: -26, dy: -10, d: 0 },
  { dx: -34, dy: -4, d: 0.15 },
  { dx: -20, dy: -16, d: 0.3 },
];

export const SpinningWheel: React.FC<{ size?: number }> = ({ size = 150 }) => {
  const spokes = [0, 72, 144, 216, 288];
  const lugs = [36, 108, 180, 252, 324];
  const treads = Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <div className="relative mx-auto" style={{ width: size + 90, height: size + 8 }} aria-hidden="true">
      <style>{WHEEL_CSS}</style>

      {/* Дым из-под колеса */}
      <div className="absolute" style={{ right: size * 0.62, bottom: 12, width: 1, height: 1 }}>
        {SMOKE_PUFFS.map((p, i) => (
          <span
            key={i}
            className="dosaaf-smoke-puff"
            style={
              {
                width: p.size,
                height: p.size,
                left: -p.size / 2,
                top: -p.size / 2,
                '--dx': `${p.dx}px`,
                '--dy': `${p.dy}px`,
                '--s': p.s,
                '--t': `${p.t}s`,
                '--d': `${p.d}s`,
              } as React.CSSProperties
            }
          />
        ))}
        {SPARKS.map((sp, i) => (
          <span
            key={`s${i}`}
            className="dosaaf-spark"
            style={{ '--dx': `${sp.dx}px`, '--dy': `${sp.dy}px`, '--d': `${sp.d}s` } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Колесо */}
      <svg
        className="dosaaf-wheel-body absolute"
        style={{ right: 4, top: 0 }}
        width={size}
        height={size}
        viewBox="0 0 120 120"
      >
        <defs>
          <radialGradient id="dosaaf-rim" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f4f5f7" />
            <stop offset="60%" stopColor="#b9bec6" />
            <stop offset="100%" stopColor="#7d838c" />
          </radialGradient>
          <radialGradient id="dosaaf-tire" cx="50%" cy="50%" r="50%">
            <stop offset="78%" stopColor="#1c1c1f" />
            <stop offset="100%" stopColor="#09090a" />
          </radialGradient>
        </defs>

        <g className="dosaaf-wheel-rotor">
          {/* Шина */}
          <circle cx="60" cy="60" r="57" fill="url(#dosaaf-tire)" />
          {treads.map((a) => (
            <rect
              key={a}
              x="58"
              y="3"
              width="4"
              height="7"
              rx="1"
              fill="#2c2c30"
              transform={`rotate(${a} 60 60)`}
            />
          ))}
          <circle cx="60" cy="60" r="44" fill="none" stroke="#2a2a2e" strokeWidth="3" />

          {/* Диск */}
          <circle cx="60" cy="60" r="38" fill="url(#dosaaf-rim)" stroke="#5d636b" strokeWidth="1.5" />
          <circle cx="60" cy="60" r="33" fill="#3b3f45" />
          {spokes.map((a) => (
            <path
              key={a}
              d="M55 58 L52 28 Q60 24 68 28 L65 58 Z"
              fill="url(#dosaaf-rim)"
              stroke="#6b7179"
              strokeWidth="0.8"
              transform={`rotate(${a} 60 60)`}
            />
          ))}

          {/* Ступица и гайки */}
          <circle cx="60" cy="60" r="11" fill="#d4d8dd" stroke="#6b7179" strokeWidth="1" />
          {lugs.map((a) => (
            <circle key={a} cx="60" cy="52.5" r="1.8" fill="#4b5058" transform={`rotate(${a} 60 60)`} />
          ))}
          <circle cx="60" cy="60" r="4.2" fill="#f59e0b" />
        </g>
      </svg>

      {/* Дорога */}
      <div className="absolute left-0 right-0 bottom-0 h-[10px] overflow-hidden">
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-[rgba(242,239,235,0.35)]" />
        <div className="dosaaf-road-dashes absolute top-[5px] left-0 flex gap-[24px]" style={{ width: '200%' }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="block w-[24px] h-[3px] bg-[#f59e0b]/70 shrink-0" />
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== ПАНЕЛЬ ЗАГРУЗКИ С РЕАЛЬНЫМИ ШАГАМИ ====================

export type LoadingStepStatus = 'pending' | 'active' | 'done' | 'error';

export interface LoadingStep {
  id: string;
  label: string;
  status: LoadingStepStatus;
  detail?: string;
}

interface WheelLoadingPanelProps {
  badge: string;
  title: string;
  subtitle?: string;
  steps: LoadingStep[];
  progress: number; // 0..100
  version?: string;
}

export const WheelLoadingPanel: React.FC<WheelLoadingPanelProps> = ({
  badge,
  title,
  subtitle,
  steps,
  progress,
  version = 'v.0.11',
}) => {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  const activeStep = steps.find((s) => s.status === 'active');

  return (
    <div
      className="w-full max-w-md bg-[#1a1a1c] border border-[rgba(242,239,235,0.15)] p-7 sm:p-9 flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-200"
      style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.85)' }}
      role="status"
      aria-live="polite"
    >
      <SpinningWheel size={132} />

      <div className="space-y-1.5 w-full">
        <span className="font-jetbrains text-[10px] uppercase tracking-[0.2em] text-[#f59e0b] block">// {badge}</span>
        <h2 className="font-oswald text-2xl sm:text-3xl uppercase font-bold text-[#f2efeb] tracking-wide">{title}</h2>
        {subtitle && <p className="font-jetbrains text-xs text-[rgba(242,239,235,0.7)]">{subtitle}</p>}
      </div>

      <div className="w-full space-y-3">
        <div className="w-full bg-[#111113] border border-[rgba(242,239,235,0.15)] h-3 overflow-hidden p-0.5">
          <div className="bg-[#f59e0b] h-full transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between font-jetbrains text-[11px] text-[rgba(242,239,235,0.6)]">
          <span className="truncate pr-2">{activeStep ? activeStep.label : pct >= 100 ? 'Поехали!' : '...'}</span>
          <span className="text-[#f59e0b] font-bold">{pct}%</span>
        </div>
      </div>

      <ul className="w-full space-y-1.5 text-left">
        {steps.map((s) => (
          <li key={s.id} className="flex items-start gap-2 font-jetbrains text-[11px]">
            <span className="mt-[1px] shrink-0">
              {s.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {s.status === 'active' && <Loader2 className="w-3.5 h-3.5 text-[#f59e0b] animate-spin" />}
              {s.status === 'pending' && <Circle className="w-3.5 h-3.5 text-[rgba(242,239,235,0.25)]" />}
              {s.status === 'error' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
            </span>
            <span
              className={
                s.status === 'pending'
                  ? 'text-[rgba(242,239,235,0.35)]'
                  : s.status === 'error'
                  ? 'text-rose-300'
                  : 'text-[rgba(242,239,235,0.85)]'
              }
            >
              {s.label}
              {s.detail && <span className="text-[rgba(242,239,235,0.45)]"> — {s.detail}</span>}
            </span>
          </li>
        ))}
      </ul>

      <div className="w-full pt-4 border-t border-[rgba(242,239,235,0.08)] flex justify-between font-jetbrains text-[9px] text-[rgba(242,239,235,0.35)] tracking-widest uppercase">
        <span>Узел: ДОСААФ</span>
        <span>Версия {version}</span>
      </div>
    </div>
  );
};
