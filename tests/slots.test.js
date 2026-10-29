const { overlaps, findFreeSlots } = require("../src/slots");
const { toMinutes, formatTime } = require("../src/time");

test("час перетворюється в хвилини й назад", () => {
  expect(toMinutes("08:30")).toBe(510);
  expect(formatTime(510)).toBe("08:30");
});

test("інтервали, що лише торкаються, не перетинаються", () => {
  expect(overlaps({ start: 0, end: 60 }, { start: 60, end: 90 })).toBe(false);
});

test("вільні проміжки з урахуванням бронювань, що перетинаються", () => {
  const bookings = [
    { from: "10:00", to: "11:30" },
    { from: "09:00", to: "10:15" },
    { from: "13:00", to: "13:30" },
  ];
  expect(findFreeSlots(bookings, "08:00", "18:00", 45)).toEqual([
    { from: "08:00", to: "09:00" },
    { from: "11:30", to: "13:00" },
    { from: "13:30", to: "18:00" },
  ]);
});

test("проміжки, коротші за мінімальні, не повертаються", () => {
  expect(findFreeSlots([{ from: "08:30", to: "17:30" }], "08:00", "18:00", 45)).toEqual([]);
});
