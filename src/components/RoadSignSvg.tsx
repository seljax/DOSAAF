import React from 'react';
import { RoadSign } from '../types';

interface RoadSignSvgProps {
  sign: RoadSign;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
}

export const RoadSignSvg: React.FC<RoadSignSvgProps> = ({ sign, size = 'md', className = '' }) => {
  const isNumeric = typeof size === 'number';
  const sizeMap: Record<string, string> = {
    xs: 'w-8 h-8 max-w-[32px] max-h-[32px]',
    sm: 'w-10 h-10 max-w-[40px] max-h-[40px]',
    md: 'w-16 h-16 max-w-[64px] max-h-[64px]',
    lg: 'w-24 h-24 max-w-[96px] max-h-[96px]',
    xl: 'w-32 h-32 max-w-[128px] max-h-[128px]',
  };

  const sizeClass = isNumeric ? '' : sizeMap[size as string] || sizeMap.md;
  const inlineStyle = isNumeric
    ? {
        width: `${size}px`,
        height: `${size}px`,
        maxWidth: `${size}px`,
        maxHeight: `${size}px`,
      }
    : undefined;

  // If custom uploaded/remote image is provided
  if (sign.imageUrl && sign.imageUrl.trim() !== '') {
    return (
      <div
        style={inlineStyle}
        className={`${sizeClass} relative flex items-center justify-center rounded-lg bg-neutral-100 p-1 shadow-xs border border-neutral-200 overflow-hidden shrink-0 ${className}`}
      >
        <img
          src={sign.imageUrl}
          alt={sign.name}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            // fallback if broken url
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  const svgType = sign.svgType || sign.number;

  // Custom vector drawing for standard Russian road signs
  return (
    <div
      style={inlineStyle}
      className={`${sizeClass} flex items-center justify-center drop-shadow-xs select-none shrink-0 overflow-hidden relative ${className}`}
    >
      {renderSignVector(svgType, sign.number)}
    </div>
  );
};

function renderSignVector(type: string, number: string) {
  // 1. Главная дорога (2.1)
  if (type === '2.1' || type === 'main_road') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="15" y="15" width="70" height="70" rx="8" transform="rotate(45 50 50)" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" />
        <rect x="22" y="22" width="56" height="56" rx="4" transform="rotate(45 50 50)" fill="#FFD200" stroke="#000000" strokeWidth="1" />
      </svg>
    );
  }

  // 2. Уступите дорогу (2.4)
  if (type === '2.4' || type === 'yield') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="50,92 8,18 92,18" fill="#D32F2F" stroke="#B71C1C" strokeWidth="1" />
        <polygon points="50,78 18,24 82,24" fill="#FFFFFF" />
      </svg>
    );
  }

  // 3. Движение без остановки запрещено STOP (2.5)
  if (type === '2.5' || type === 'stop') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="30,8 70,8 92,30 92,70 70,92 30,92 8,70 8,30" fill="#D32F2F" stroke="#FFFFFF" strokeWidth="2.5" />
        <polygon points="31,10 69,10 90,31 90,69 69,90 31,90 10,69 10,31" fill="#D32F2F" stroke="#B71C1C" strokeWidth="1" />
        <text x="50" y="58" fill="#FFFFFF" fontSize="22" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">STOP</text>
      </svg>
    );
  }

  // 4. Въезд запрещен "Кирпич" (3.1)
  if (type === '3.1' || type === 'no_entry') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#D32F2F" stroke="#B71C1C" strokeWidth="1.5" />
        <rect x="20" y="42" width="60" height="16" rx="2" fill="#FFFFFF" />
      </svg>
    );
  }

  // 5. Ограничение максимальной скорости 60 (3.24)
  if (type === '3.24' || type === 'speed_60') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#D32F2F" />
        <circle cx="50" cy="50" r="37" fill="#FFFFFF" />
        <text x="50" y="60" fill="#000000" fontSize="32" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">60</text>
      </svg>
    );
  }

  // 5b. Ограничение максимальной скорости 40
  if (type === 'speed_40') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#D32F2F" />
        <circle cx="50" cy="50" r="37" fill="#FFFFFF" />
        <text x="50" y="60" fill="#000000" fontSize="32" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">40</text>
      </svg>
    );
  }

  // 6. Пешеходный переход (5.19.1)
  if (type === '5.19.1' || type === 'crosswalk') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="6" y="6" width="88" height="88" rx="6" fill="#1565C0" stroke="#0D47A1" strokeWidth="1.5" />
        <polygon points="50,16 16,82 84,82" fill="#FFFFFF" />
        {/* Zebra and pedestrian silhouette */}
        <line x1="28" y1="80" x2="72" y2="80" stroke="#000" strokeWidth="4" />
        <line x1="33" y1="74" x2="67" y2="74" stroke="#000" strokeWidth="3" />
        <circle cx="50" cy="40" r="6" fill="#000000" />
        <path d="M46 48 L54 48 L56 62 L64 74 L58 76 L52 64 L48 76 L42 74 L46 58 Z" fill="#000000" />
      </svg>
    );
  }

  // 7. Опасные повороты (1.12.1)
  if (type === '1.12.1' || type === 'dangerous_turns') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="50,8 92,82 8,82" fill="#D32F2F" />
        <polygon points="50,22 82,76 18,76" fill="#FFFFFF" />
        <path d="M36 68 L48 54 L44 44 L56 36 L62 42" fill="none" stroke="#000000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="56 32 64 42 54 46" fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  // 8. Движение прямо (4.1.1)
  if (type === '4.1.1' || type === 'straight_only') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#1976D2" stroke="#0D47A1" strokeWidth="1.5" />
        <line x1="50" y1="78" x2="50" y2="28" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="square" />
        <polygon points="50,18 34,36 66,36" fill="#FFFFFF" />
      </svg>
    );
  }

  // 9. Круговое движение (4.3)
  if (type === '4.3' || type === 'roundabout') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#1976D2" stroke="#0D47A1" strokeWidth="1.5" />
        <path d="M 50 24 A 26 26 0 1 1 24 50" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeDasharray="32 10" />
        <polygon points="56,20 46,26 46,14" fill="#FFFFFF" />
        <polygon points="20,44 26,54 14,54" fill="#FFFFFF" />
        <polygon points="68,76 78,70 78,82" fill="#FFFFFF" />
      </svg>
    );
  }

  // 10. Остановка запрещена (3.27)
  if (type === '3.27' || type === 'no_stopping') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#1976D2" stroke="#D32F2F" strokeWidth="10" />
        <line x1="18" y1="18" x2="82" y2="82" stroke="#D32F2F" strokeWidth="10" />
        <line x1="82" y1="18" x2="18" y2="82" stroke="#D32F2F" strokeWidth="10" />
      </svg>
    );
  }

  // 11. Стоянка запрещена (3.28)
  if (type === '3.28' || type === 'no_parking') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#1976D2" stroke="#D32F2F" strokeWidth="10" />
        <line x1="82" y1="18" x2="18" y2="82" stroke="#D32F2F" strokeWidth="10" />
      </svg>
    );
  }

  // 12. Парковка / Место стоянки (6.4)
  if (type === '6.4' || type === 'parking') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="8" y="8" width="84" height="84" rx="8" fill="#1976D2" stroke="#0D47A1" strokeWidth="1.5" />
        <text x="50" y="68" fill="#FFFFFF" fontSize="56" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">P</text>
      </svg>
    );
  }

  // 13. Автомагистраль (5.1)
  if (type === '5.1' || type === 'highway') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="8" y="8" width="84" height="84" rx="8" fill="#2E7D32" stroke="#1B5E20" strokeWidth="1.5" />
        <polygon points="34,80 40,24 46,24 42,80" fill="#FFFFFF" />
        <polygon points="58,80 54,24 60,24 66,80" fill="#FFFFFF" />
        <rect x="22" y="44" width="56" height="6" fill="#FFFFFF" />
      </svg>
    );
  }

  // 14. Обгон запрещен (3.20)
  if (type === '3.20' || type === 'no_overtaking') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#D32F2F" strokeWidth="9" />
        {/* Right car black */}
        <rect x="52" y="38" width="22" height="26" rx="4" fill="#000000" />
        <rect x="56" y="42" width="14" height="6" fill="#FFFFFF" />
        {/* Left car red */}
        <rect x="26" y="38" width="22" height="26" rx="4" fill="#D32F2F" />
        <rect x="30" y="42" width="14" height="6" fill="#FFFFFF" />
      </svg>
    );
  }

  // 15. Дети (1.23)
  if (type === '1.23' || type === 'children') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="50,8 92,82 8,82" fill="#D32F2F" />
        <polygon points="50,22 82,76 18,76" fill="#FFFFFF" />
        {/* Children figures silhouette */}
        <circle cx="42" cy="42" r="4" fill="#000000" />
        <path d="M38 48 L46 48 L48 64 L42 64 L40 56 L36 64 L32 62 Z" fill="#000000" />
        <circle cx="58" cy="46" r="3.5" fill="#000000" />
        <path d="M55 52 L62 52 L64 68 L58 68 L57 60 L54 68 L50 66 Z" fill="#000000" />
      </svg>
    );
  }

  // 16. Движение грузовых автомобилей запрещено (3.4)
  if (type === '3.4' || type === 'no_trucks') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#D32F2F" strokeWidth="9" />
        {/* Truck Silhouette */}
        {/* Cab */}
        <path d="M62 44 L70 44 L75 52 L75 62 L62 62 Z" fill="#000000" />
        {/* Window */}
        <path d="M64 47 L69 47 L72 52 L64 52 Z" fill="#FFFFFF" />
        {/* Cargo Body */}
        <rect x="25" y="38" width="35" height="24" rx="1" fill="#000000" />
        {/* Wheels */}
        <circle cx="34" cy="64" r="5" fill="#000000" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="48" cy="64" r="5" fill="#000000" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="68" cy="64" r="5" fill="#000000" stroke="#FFFFFF" strokeWidth="1.5" />
      </svg>
    );
  }

  // 17. Движение с прицепом запрещено (3.7)
  if (type === '3.7' || type === 'no_trailers') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#D32F2F" strokeWidth="9" />
        {/* Trailer body */}
        <rect x="30" y="42" width="38" height="20" rx="2" fill="#000000" />
        {/* Drawbar / hitch */}
        <line x1="68" y1="58" x2="80" y2="58" stroke="#000000" strokeWidth="3" />
        {/* Trailer Wheels */}
        <circle cx="40" cy="64" r="5" fill="#000000" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="58" cy="64" r="5" fill="#000000" stroke="#FFFFFF" strokeWidth="1.5" />
      </svg>
    );
  }

  // 18. Вид транспортного средства: Грузовые авто (8.4.1)
  if (type === '8.4.1' || type === 'plate_truck') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="8" y="24" width="84" height="52" rx="4" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
        {/* Truck Silhouette */}
        <path d="M60 38 L68 38 L73 45 L73 55 L60 55 Z" fill="#000000" />
        <path d="M62 40 L67 40 L70 45 L62 45 Z" fill="#FFFFFF" />
        <rect x="24" y="34" width="34" height="21" rx="1" fill="#000000" />
        <circle cx="32" cy="57" r="4.5" fill="#000000" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="45" cy="57" r="4.5" fill="#000000" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="66" cy="57" r="4.5" fill="#000000" stroke="#FFFFFF" strokeWidth="1" />
      </svg>
    );
  }

  // Generic fallback badge
  return (
    <div className="w-full h-full rounded-xl bg-neutral-900 border-2 border-neutral-700 text-white flex flex-col items-center justify-center p-1 text-center font-bold">
      <span className="text-[10px] uppercase tracking-wider text-amber-400">ПДД</span>
      <span className="text-xs font-mono">{number || 'Знак'}</span>
    </div>
  );
}
