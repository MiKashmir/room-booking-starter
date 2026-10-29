/**
 * Пошук перетинів бронювань і вільних часових проміжків.
 * @file
 */

const { toMinutes, formatTime } = require("./time");

/**
 * @typedef {object} TimeInterval
 * @property {number} start Початок інтервалу в хвилинах від початку доби.
 * @property {number} end Кінець інтервалу в хвилинах від початку доби.
 */

/**
 * @typedef {object} SlotBooking
 * @property {string} from Початок бронювання у форматі `HH:mm`.
 * @property {string} to Кінець бронювання у форматі `HH:mm`.
 */

/**
 * @typedef {object} FreeSlot
 * @property {string} from Початок вільного проміжку у форматі `HH:mm`.
 * @property {string} to Кінець вільного проміжку у форматі `HH:mm`.
 */

/**
 * Перевіряє, чи перетинаються два часові інтервали.
 *
 * Інтервали, що лише торкаються межами, не вважаються такими, що перетинаються.
 *
 * @param {TimeInterval} a Перший інтервал.
 * @param {TimeInterval} b Другий інтервал.
 * @returns {boolean} `true`, якщо інтервали мають спільний час.
 */
function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

/**
 * Знаходить вільні проміжки в межах годин роботи.
 *
 * Бронювання, що перетинаються або йдуть безпосередньо одне за одним,
 * об'єднуються. До результату включаються лише проміжки не коротші за
 * `minLength`.
 *
 * @param {SlotBooking[]} bookings Бронювання з часом початку та завершення.
 * @param {string} opens Початок робочого дня у форматі `HH:mm`.
 * @param {string} closes Завершення робочого дня у форматі `HH:mm`.
 * @param {number} minLength Мінімальна тривалість вільного проміжку у хвилинах.
 * @returns {FreeSlot[]} Вільні проміжки у форматі `HH:mm`.
 */
function findFreeSlots(bookings, opens, closes, minLength) {
  const busy = bookings
    .map((b) => ({ start: toMinutes(b.from), end: toMinutes(b.to) }))
    .sort((a, b) => a.start - b.start);
  const merged = [];
  for (const cur of busy) {
    const last = merged[merged.length - 1];
    if (last && cur.start <= last.end) last.end = Math.max(last.end, cur.end);
    else merged.push({ ...cur });
  }
  const free = [];
  let cursor = toMinutes(opens);
  for (const b of merged) {
    if (b.start - cursor >= minLength) free.push({ from: formatTime(cursor), to: formatTime(b.start) });
    cursor = Math.max(cursor, b.end);
  }
  const end = toMinutes(closes);
  if (end - cursor >= minLength) free.push({ from: formatTime(cursor), to: formatTime(end) });
  return free;
}

module.exports = { overlaps, findFreeSlots };
