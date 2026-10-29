/**
 * Функції для перетворення часу доби.
 * @file
 */

/**
 * Перетворює час у форматі `HH:mm` на кількість хвилин від початку доби.
 *
 * @param {string} hhmm Час у 24-годинному форматі, наприклад `08:30`.
 * @returns {number} Кількість хвилин від 00:00.
 * @throws {RangeError} Якщо час має некоректний формат або значення.
 */
function toMinutes(hhmm) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!m) throw new RangeError(`Некоректний час: ${hhmm}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Перетворює хвилини від початку доби на рядок часу `HH:mm`.
 *
 * @param {number} minutes Кількість хвилин від початку доби.
 * @returns {string} Час у 24-годинному форматі, наприклад `08:30`.
 */
function formatTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

module.exports = { toMinutes, formatTime };
