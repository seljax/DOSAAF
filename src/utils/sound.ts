// Воспроизведение звука
export function playSuccessSound(): void {
  try {
    const audio = new Audio('/sounds/success.mp3');
    audio.volume = 0.6; // громкость 0.0 – 1.0
    audio.play().catch((err) => {
      // Браузер может блокировать автовоспроизведение до первого клика пользователя
      console.warn('Не удалось воспроизвести звук:', err);
    });
  } catch (err) {
    console.warn('Ошибка воспроизведения звука:', err);
  }
}

// Опционально: разные звуки для разных результатов
export function playPerfectScoreSound(): void {
  playSuccessSound();
}

export function playGoodScoreSound(): void {
  try {
    const audio = new Audio('/sounds/good.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {}
}

export function playFailSound(): void {
  try {
    const audio = new Audio('/sounds/fail.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => {});
  } catch {}
}