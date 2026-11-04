import { describe, expect, it } from "vitest";
import { AppDataSource } from "../../data-source.js";
import { createBooking, createHotelWithRooms, createUser, daysFromToday } from "../../test/helpers.js";
import { Booking } from "../booking.entity.js";
import { approveBookingCommand } from "./approve-booking.command.js";
import { rejectBookingCommand } from "./reject-booking.command.js";

async function pendingBookingAtNewHotel() {
  const manager = await createUser("Property Manager");
  const guest = await createUser();
  const { rooms } = await createHotelWithRooms(manager);
  const booking = await createBooking(guest, rooms[0]!, daysFromToday(10), daysFromToday(12));
  return { manager, booking };
}

const statusOf = async (id: string) =>
  (await AppDataSource.getRepository(Booking).findOneByOrFail({ id })).status;

describe("manager scope on bookings", () => {
  it("lets the hotel's manager approve a pending booking", async () => {
    const { manager, booking } = await pendingBookingAtNewHotel();

    await approveBookingCommand(booking.id, manager.id);

    expect(await statusOf(booking.id)).toBe("Approved");
  });

  it("lets the hotel's manager reject a pending booking with a comment", async () => {
    const { manager, booking } = await pendingBookingAtNewHotel();

    await rejectBookingCommand(booking.id, manager.id, "Fully booked for a private event");

    const saved = await AppDataSource.getRepository(Booking).findOneByOrFail({ id: booking.id });
    expect(saved.status).toBe("Rejected");
    expect(saved.comments).toBe("Fully booked for a private event");
  });

  it("reports a booking at another manager's hotel as not found when approving", async () => {
    const { booking } = await pendingBookingAtNewHotel();
    const otherManager = await createUser("Property Manager");

    await expect(approveBookingCommand(booking.id, otherManager.id)).rejects.toMatchObject({
      status: 404,
    });
    expect(await statusOf(booking.id)).toBe("Pending");
  });

  it("reports a booking at another manager's hotel as not found when rejecting", async () => {
    const { booking } = await pendingBookingAtNewHotel();
    const otherManager = await createUser("Property Manager");

    await expect(
      rejectBookingCommand(booking.id, otherManager.id, "Not mine to reject"),
    ).rejects.toMatchObject({ status: 404 });
    expect(await statusOf(booking.id)).toBe("Pending");
  });

  it("does not let an already approved booking be approved or rejected again", async () => {
    const { manager, booking } = await pendingBookingAtNewHotel();
    await approveBookingCommand(booking.id, manager.id);

    await expect(approveBookingCommand(booking.id, manager.id)).rejects.toMatchObject({
      status: 409,
    });
    await expect(
      rejectBookingCommand(booking.id, manager.id, "Changed my mind"),
    ).rejects.toMatchObject({ status: 409 });
    expect(await statusOf(booking.id)).toBe("Approved");
  });

  it("requires a comment to reject", async () => {
    const { manager, booking } = await pendingBookingAtNewHotel();

    await expect(rejectBookingCommand(booking.id, manager.id, "   ")).rejects.toMatchObject({
      status: 400,
    });
  });
});
