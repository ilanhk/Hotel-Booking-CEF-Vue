import { describe, expect, it } from "vitest";
import { approveBookingHandler, rejectBookingHandler } from "../bookings/handlers/bookings.js";
import {
  buildEvent,
  createBooking,
  createHotelWithRooms,
  createUser,
  daysFromToday,
  jsonBody,
  statusOf,
} from "../test/helpers.js";
import { listRequesters } from "../users/handlers/users.js";

describe("role checks", () => {
  it("answers 401 to an anonymous request for a manager action", async () => {
    const result = await approveBookingHandler(null, buildEvent(null, { pathParameters: { id: "x" } }));

    expect(statusOf(result)).toBe(401);
  });

  it("answers 403 when a guest tries to approve or reject a booking", async () => {
    const manager = await createUser("Property Manager");
    const guest = await createUser();
    const { rooms } = await createHotelWithRooms(manager);
    const booking = await createBooking(guest, rooms[0]!, daysFromToday(10), daysFromToday(12));
    const event = buildEvent(guest, { pathParameters: { id: booking.id } });

    expect(statusOf(await approveBookingHandler(null, event))).toBe(403);
    expect(statusOf(await rejectBookingHandler({ comment: "No" }, event))).toBe(403);
  });

  it("answers 403 when a guest asks for the guest list", async () => {
    const guest = await createUser();

    expect(statusOf(await listRequesters(null, buildEvent(guest)))).toBe(403);
  });
});

describe("listRequesters (manager's guest filter)", () => {
  it("lists only guests who have a booking at the manager's hotel", async () => {
    const manager = await createUser("Property Manager");
    const otherManager = await createUser("Property Manager");
    const [bookedHere, bookedElsewhere] = await Promise.all([createUser(), createUser()]);
    await createUser(); // never booked anything
    const mine = await createHotelWithRooms(manager);
    const theirs = await createHotelWithRooms(otherManager);
    await createBooking(bookedHere, mine.rooms[0]!, daysFromToday(10), daysFromToday(12));
    await createBooking(bookedElsewhere, theirs.rooms[0]!, daysFromToday(10), daysFromToday(12));

    const result = await listRequesters(null, buildEvent(manager));

    expect(statusOf(result)).toBe(200);
    expect(jsonBody<{ id: string }[]>(result).map((user) => user.id)).toEqual([bookedHere.id]);
  });

  it("lists a guest once, however many bookings they made", async () => {
    const manager = await createUser("Property Manager");
    const guest = await createUser();
    const { rooms } = await createHotelWithRooms(manager, 2);
    await createBooking(guest, rooms[0]!, daysFromToday(10), daysFromToday(12));
    await createBooking(guest, rooms[1]!, daysFromToday(20), daysFromToday(22));

    const result = await listRequesters(null, buildEvent(manager));

    expect(jsonBody<{ id: string }[]>(result)).toHaveLength(1);
  });
});
