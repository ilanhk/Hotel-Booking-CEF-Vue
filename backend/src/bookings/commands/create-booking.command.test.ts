import { describe, expect, it } from "vitest";
import { AppDataSource } from "../../data-source.js";
import { HttpError } from "../../shared/http-error.js";
import {
  createBooking,
  createHotelWithRooms,
  createUser,
  daysFromToday,
} from "../../test/helpers.js";
import { Booking } from "../booking.entity.js";
import { createBookingCommand } from "./create-booking.command.js";

const bookingFor = (userId: string, roomId: string, start: number, end: number) =>
  createBookingCommand({ userId, roomId, startDate: daysFromToday(start), endDate: daysFromToday(end) });

describe("createBookingCommand", () => {
  describe("overlapping bookings", () => {
    it("rejects a second booking of the same room for overlapping dates", async () => {
      const manager = await createUser("Property Manager");
      const [guest, otherGuest] = await Promise.all([createUser(), createUser()]);
      const { rooms } = await createHotelWithRooms(manager);
      await createBooking(guest, rooms[0]!, daysFromToday(10), daysFromToday(15), "Approved");

      await expect(bookingFor(otherGuest.id, rooms[0]!.id, 12, 18)).rejects.toMatchObject({
        status: 409,
      });
    });

    it("treats the check-out day as taken (inclusive overlap)", async () => {
      const manager = await createUser("Property Manager");
      const [guest, otherGuest] = await Promise.all([createUser(), createUser()]);
      const { rooms } = await createHotelWithRooms(manager);
      await createBooking(guest, rooms[0]!, daysFromToday(10), daysFromToday(13), "Pending");

      await expect(bookingFor(otherGuest.id, rooms[0]!.id, 13, 15)).rejects.toMatchObject({
        status: 409,
      });
      await expect(bookingFor(otherGuest.id, rooms[0]!.id, 14, 16)).resolves.toMatchObject({
        id: expect.any(String),
      });
    });

    it("lets a guest book a different room for dates that do not overlap", async () => {
      const manager = await createUser("Property Manager");
      const guest = await createUser();
      const { rooms } = await createHotelWithRooms(manager, 2);
      await createBooking(guest, rooms[0]!, daysFromToday(10), daysFromToday(12), "Approved");

      await expect(bookingFor(guest.id, rooms[1]!.id, 20, 22)).resolves.toBeDefined();
    });

    it("rejects overlapping dates for a guest who already has a booking, even in another room", async () => {
      const manager = await createUser("Property Manager");
      const guest = await createUser();
      const { rooms } = await createHotelWithRooms(manager, 2);
      await createBooking(guest, rooms[0]!, daysFromToday(10), daysFromToday(15), "Pending");

      await expect(bookingFor(guest.id, rooms[1]!.id, 12, 14)).rejects.toMatchObject({
        status: 409,
      });
    });

    it("frees the dates again once a booking is rejected", async () => {
      const manager = await createUser("Property Manager");
      const [guest, otherGuest] = await Promise.all([createUser(), createUser()]);
      const { rooms } = await createHotelWithRooms(manager);
      await createBooking(guest, rooms[0]!, daysFromToday(10), daysFromToday(15), "Rejected");

      await expect(bookingFor(otherGuest.id, rooms[0]!.id, 10, 15)).resolves.toBeDefined();
    });
  });

  describe("concurrent bookings", () => {
    it("lets exactly one of several simultaneous guests book the last free room", async () => {
      const manager = await createUser("Property Manager");
      const guests = await Promise.all(Array.from({ length: 5 }, () => createUser()));
      const { rooms } = await createHotelWithRooms(manager);

      const results = await Promise.allSettled(
        guests.map((guest) => bookingFor(guest.id, rooms[0]!.id, 10, 13)),
      );

      const fulfilled = results.filter((result) => result.status === "fulfilled");
      const rejected = results.filter(
        (result): result is PromiseRejectedResult => result.status === "rejected",
      );
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(4);
      for (const { reason } of rejected) {
        expect(reason).toBeInstanceOf(HttpError);
        expect((reason as HttpError).status).toBe(409);
      }
      expect(await AppDataSource.getRepository(Booking).count()).toBe(1);
    });
  });

  describe("pricing", () => {
    it("charges nights x the room type's nightly price", async () => {
      const manager = await createUser("Property Manager");
      const guest = await createUser();
      const { rooms } = await createHotelWithRooms(manager, 1, 120);

      const { id, totalCost } = await bookingFor(guest.id, rooms[0]!.id, 10, 14); // 4 nights

      expect(totalCost).toBe(480);
      const saved = await AppDataSource.getRepository(Booking).findOneByOrFail({ id });
      expect(saved.totalCost).toBe(480);
    });

    it("does not drift on prices with cents", async () => {
      const manager = await createUser("Property Manager");
      const guest = await createUser();
      const { rooms } = await createHotelWithRooms(manager, 1, 99.99);

      const { totalCost } = await bookingFor(guest.id, rooms[0]!.id, 10, 13); // 3 nights

      expect(totalCost).toBe(299.97);
    });

    it("creates the booking as Pending", async () => {
      const manager = await createUser("Property Manager");
      const guest = await createUser();
      const { rooms } = await createHotelWithRooms(manager);

      const { id } = await bookingFor(guest.id, rooms[0]!.id, 10, 12);

      const saved = await AppDataSource.getRepository(Booking).findOneByOrFail({ id });
      expect(saved.status).toBe("Pending");
    });
  });

  describe("validation", () => {
    it.each([
      ["a start date in the past", -2, 2],
      ["an end date that is not after the start date", 10, 10],
      ["an end date before the start date", 12, 10],
    ])("rejects %s", async (_label, start, end) => {
      const manager = await createUser("Property Manager");
      const guest = await createUser();
      const { rooms } = await createHotelWithRooms(manager);

      await expect(bookingFor(guest.id, rooms[0]!.id, start, end)).rejects.toMatchObject({
        status: 400,
      });
    });

    it("rejects a malformed date", async () => {
      const manager = await createUser("Property Manager");
      const guest = await createUser();
      const { rooms } = await createHotelWithRooms(manager);

      await expect(
        createBookingCommand({
          userId: guest.id,
          roomId: rooms[0]!.id,
          startDate: "next friday",
          endDate: daysFromToday(12),
        }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("returns 404 for a room that does not exist", async () => {
      const guest = await createUser();

      await expect(
        bookingFor(guest.id, "00000000-0000-4000-8000-000000000000", 10, 12),
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
