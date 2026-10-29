const request = require("supertest");
const { createApp } = require("../src/app");

const booking = { roomId: "204", date: "2026-11-02", from: "10:00", to: "11:30", who: "Тимченко С. В." };

test("бронювання створюється", async () => {
  const res = await request(createApp()).post("/api/bookings").send(booking);
  expect(res.status).toBe(201);
});

test("перетин з наявним бронюванням — 409", async () => {
  const app = createApp();
  await request(app).post("/api/bookings").send(booking);
  const res = await request(app).post("/api/bookings").send({ ...booking, from: "11:00", to: "12:00" });
  expect(res.status).toBe(409);
});

test("бронювання поза годинами роботи — 400", async () => {
  const res = await request(createApp()).post("/api/bookings").send({ ...booking, from: "07:00", to: "08:00" });
  expect(res.status).toBe(400);
});

test("вільні проміжки аудиторії на дату", async () => {
  const app = createApp();
  await request(app).post("/api/bookings").send(booking);
  const res = await request(app).get("/api/rooms/204/free").query({ date: "2026-11-02", min: 60 });
  expect(res.body).toEqual([{ from: "08:30", to: "10:00" }, { from: "11:30", to: "20:00" }]);
});
