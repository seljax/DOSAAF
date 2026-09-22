import { TestAttempt } from '../types';

/**
 * Экспорт ведомости государственного экзамена в CSV (Excel-совместимый).
 * Формат CSV: колонки разделены ';', строки — '\n'.
 * BOM (\uFEFF) в начале — чтобы Excel корректно отображал кириллицу.
 *
 * Обозначения:
 *   1 — правильный ответ
 *   2 — ошибка (неправильный ответ)
 */
export function exportExamSheetCSV(
  attempts: TestAttempt[],
  getGroupName: (groupId: string) => string
): void {
  // 1. Фильтруем только завершённые экзамены, у которых есть questionOrder
  //    (старые попытки без questionOrder не могут быть корректно отображены)
  const examAttempts = attempts.filter(
    (a) => a.isExam && !a.abandoned && a.questionOrder && a.questionOrder.length > 0
  );

  if (examAttempts.length === 0) {
    alert(
      'Нет завершённых экзаменов для экспорта.\n\n' +
      'Старые попытки (до добавления поля questionOrder) не могут быть корректно отображены. ' +
      'Пройдите экзамен заново и попробуйте снова.'
    );
    return;
  }

  // 2. Сортируем по дате (сначала новые)
  const sorted = [...examAttempts].sort((a, b) => b.timestamp - a.timestamp);

  // 3. Формируем шапку ведомости
  const titleRow = ['ВЕДОМОСТЬ РЕЗУЛЬТАТОВ ГОСУДАРСТВЕННОГО ЭКЗАМЕНА'];
  const subtitleRow = [`Автошкола ДОСААФ • Дата формирования: ${new Date().toLocaleDateString('ru-RU')}`];
  const emptyRow = [''];

  // 4. Формируем строку с названиями колонок
  const columnsRow: string[] = [
    '№',
    'ФИО кандидата',
    'Группа',
    'Дата экзамена',
    'Билет',
  ];

  // 20 колонок для вопросов
  for (let i = 1; i <= 20; i++) {
    columnsRow.push(String(i));
  }

  columnsRow.push('Итог', 'Ошибки', 'Подпись');

  // 5. Формируем строки данных
  const dataRows = sorted.map((attempt, idx) => {
    const wrongSet = new Set(attempt.wrongQuestionIds || []);
    const totalQuestions = attempt.totalQuestions || 20;

    const row: (string | number)[] = [
      idx + 1,
      `"${attempt.userName}"`,
      `"${getGroupName(attempt.userGroup)}"`,
      `"${attempt.dateStr}"`,
      attempt.ticketNumber === 'random' ? 'Случайный' : `№${attempt.ticketNumber || '—'}`,
    ];

    // Разбор по 20 вопросам + одновременный сбор номеров ошибочных позиций
    const errorNumbers: number[] = [];

    for (let qIdx = 1; qIdx <= 20; qIdx++) {
      if (qIdx > totalQuestions) {
        row.push(''); // вопрос не задавался
        continue;
      }

      const questionId = attempt.questionOrder?.[qIdx - 1];

      if (questionId && wrongSet.has(questionId)) {
        row.push('2');            // ошибка
        errorNumbers.push(qIdx);  // запоминаем НОМЕР ПОЗИЦИИ в билете
      } else {
        row.push('1');            // правильно
      }
    }

    // Итог
    row.push(attempt.passed ? 'СДАЛ' : 'НЕ СДАЛ');

    // Ошибки — номера позиций (1..20), совпадают с колонками выше
    row.push(errorNumbers.length > 0 ? `"${errorNumbers.join(', ')}"` : '—');

    // Подпись — пустая (для рукописной росписи)
    row.push('');

    return row;
  });

  // 6. Собираем CSV
  const lines = [
    titleRow.join(';'),
    subtitleRow.join(';'),
    emptyRow.join(';'),
    columnsRow.join(';'),
    ...dataRows.map((r) => r.join(';')),
  ];

  const csvContent = '\uFEFF' + lines.join('\n');

  // 7. Скачиваем
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Vedomost_exam_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}