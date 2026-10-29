const { toMinutes } = require("./time");
const { overlaps } = require("./slots");

/**
 * @typedef {object} Room
 * @property {string} id Ідентифікатор аудиторії.
 * @property {string} name Назва аудиторії.
 * @property {number} seats Кількість місць.
 * @property {string} opens Початок робочого дня у форматі `HH:mm`.
 * @property {string} closes Завершення робочого дня у форматі `HH:mm`.
 */

/**
 * @typedef {object} Booking
 * @property {number} id Унікальний ідентифікатор бронювання.
 * @property {string} roomId Ідентифікатор аудиторії.
 * @property {string} date Дата бронювання.
 * @property {string} from Час початку у форматі `HH:mm`.
 * @property {string} to Час завершення у форматі `HH:mm`.
 * @property {string} who Ім'я особи, яка створила бронювання.
 */

/**
 * @typedef {object} BookingInput
 * @property {string} roomId Ідентифікатор аудиторії.
 * @property {string} date Дата бронювання.
 * @property {string} from Час початку у форматі `HH:mm`.
 * @property {string} to Час завершення у форматі `HH:mm`.
 * @property {string} who Ім'я особи, яка створила бронювання.
 */

/**
 * @typedef {object} BookingService
 * @property {(roomId: string, date: string) => Booking[]} list Повертає бронювання аудиторії на дату.
 * @property {(input: BookingInput) => Booking} create Створює бронювання.
 * @property {(id: number, now?: Date) => void} cancel Скасовує бронювання.
 * @property {(id: string) => Room} rooms Знаходить аудиторію за ідентифікатором.
 */

/**
 * @typedef {Error & {status: number, expose: boolean}} HttpError
 */

/** Максимальна тривалість одного бронювання в годинах. */
const MAX_BOOKING_HOURS = Number(process.env.MAX_BOOKING_HOURS) || 4;
/** Мінімальний час до початку бронювання, коли його ще можна скасувати, у годинах. */
const MIN_CANCEL_HOURS = 2;

/**
 * Створює помилку HTTP-відповіді з кодом статусу та безпечним для показу повідомленням.
 *
 * @param {number} status HTTP-код відповіді.
 * @param {string} message Повідомлення про помилку.
 * @returns {HttpError} Помилка, оброблювана HTTP middleware.
 */
function httpError(status, message) {
  return Object.assign(new Error(message), { status, expose: true });
}

/**
 * Створює ізольований сервіс бронювань для переданого переліку аудиторій.
 *
 * @param {Room[]} rooms Перелік аудиторій, доступних для бронювання.
 * @returns {BookingService} Методи для перегляду, створення та скасування бронювань.
 */
function createBookingService(rooms) {
  const bookings = [];
  let nextId = 1;

  /**
   * Знаходить аудиторію або створює помилку `404`.
   *
   * @param {string} id Ідентифікатор аудиторії.
   * @returns {Room} Знайдена аудиторія.
   * @throws {HttpError} Якщо аудиторії не існує.
   */
  function findRoom(id) {
    const room = rooms.find((r) => r.id === id);
    if (!room) throw httpError(404, "Аудиторію не знайдено");
    return room;
  }

  return {
    /**
     * Повертає бронювання аудиторії за вказану дату.
     *
     * @param {string} roomId Ідентифікатор аудиторії.
     * @param {string} date Дата бронювання.
     * @returns {Booking[]} Бронювання аудиторії на цю дату.
     * @throws {HttpError} Якщо аудиторії не існує.
     */
    list(roomId, date) {
      findRoom(roomId);
      return bookings.filter((b) => b.roomId === roomId && b.date === date);
    },

    /**
     * Перевіряє умови та створює бронювання.
     *
     * @param {BookingInput} input Дані нового бронювання.
     * @returns {Booking} Створене бронювання з призначеним ідентифікатором.
     * @throws {HttpError} Якщо аудиторії немає, час недопустимий або бронювання перетинається з наявним.
     * @throws {RangeError} Якщо час початку чи завершення має некоректний формат.
     */
    create({ roomId, date, from, to, who }) {
      const room = findRoom(roomId);
      const span = { start: toMinutes(from), end: toMinutes(to) };
      if (span.end <= span.start) throw httpError(400, "Кінець має бути пізніше за початок");
      if (span.start < toMinutes(room.opens) || span.end > toMinutes(room.closes)) {
        throw httpError(400, "Аудиторія в цей час зачинена");
      }
      if (span.end - span.start > MAX_BOOKING_HOURS * 60) throw httpError(400, "Занадто довге бронювання");
      const clash = this.list(roomId, date).find((b) => overlaps(span, { start: toMinutes(b.from), end: toMinutes(b.to) }));
      if (clash) throw httpError(409, `Перетин із бронюванням #${clash.id}`);
      const booking = { id: nextId++, roomId, date, from, to, who };
      bookings.push(booking);
      return booking;
    },

    /**
     * Скасовує бронювання, якщо до його початку залишилося достатньо часу.
     *
     * @param {number} id Ідентифікатор бронювання.
     * @param {Date} [now=new Date()] Поточний час; параметр можна передати для тестування.
     * @returns {void}
     * @throws {HttpError} Якщо бронювання не знайдено або скасування вже неможливе.
     */
    cancel(id, now = new Date()) {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) throw httpError(404, "Бронювання не знайдено");
      const startsAt = new Date(`${booking.date}T${booking.from}:00`);
      if ((startsAt.getTime() - now.getTime()) / 3_600_000 < MIN_CANCEL_HOURS) {
        throw httpError(409, "Скасувати вже неможливо");
      }
      bookings.splice(bookings.indexOf(booking), 1);
    },

    /** @type {(id: string) => Room} */
    rooms: findRoom,
  };
}

module.exports = { createBookingService, MAX_BOOKING_HOURS, MIN_CANCEL_HOURS };
