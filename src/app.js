/**
 * Створення Express-застосунку HTTP API для бронювання аудиторій.
 * @file
 */

const express = require("express");
const { createBookingService } = require("./bookings");
const { findFreeSlots } = require("./slots");
const defaultRooms = require("../data/rooms.json");

/**
 * @typedef {object} AppRoom
 * @property {string} id Ідентифікатор аудиторії.
 * @property {string} name Назва аудиторії.
 * @property {number} seats Кількість місць.
 * @property {string} opens Початок роботи у форматі `HH:mm`.
 * @property {string} closes Завершення роботи у форматі `HH:mm`.
 */

/**
 * Створює Express-застосунок з API аудиторій, бронювань і вільних проміжків.
 *
 * @param {AppRoom[]} [rooms=defaultRooms] Перелік аудиторій.
 * @returns {import("express").Express} Налаштований Express-застосунок.
 */
function createApp(rooms = defaultRooms) {
  const app = express();
  const service = createBookingService(rooms);
  app.use(express.json());

  app.get("/api/rooms", (req, res) => res.json(rooms));

  app.get("/api/rooms/:id/bookings", (req, res) => {
    const date = typeof req.query.date === "string" ? req.query.date : "";
    res.json(service.list(req.params.id, date));
  });

  app.get("/api/rooms/:id/free", (req, res) => {
    const room = service.rooms(req.params.id);
    const date = typeof req.query.date === "string" ? req.query.date : "";
    const min = Number(req.query.min) || 45;
    res.json(findFreeSlots(service.list(room.id, date), room.opens, room.closes, min));
  });

  app.post("/api/bookings", (req, res) => {
    res.status(201).json(service.create(req.body));
  });

  app.delete("/api/bookings/:id", (req, res) => {
    service.cancel(Number(req.params.id));
    res.status(204).end();
  });

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.expose ? err.message : "Внутрішня помилка" });
  });
  return app;
}

module.exports = { createApp };
