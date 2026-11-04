import { publish } from "../../shared/event-bus.js";
import { HttpError } from "../../shared/http-error.js";
import { AppDataSource } from "../../data-source.js";
import { Booking } from "../booking.entity.js";
import { bookingApprovedEvent } from "../events/booking-approved.event.js";
import { MANAGED_ROOM_IDS_SQL } from "../utils/manager-scope.js";

export async function approveBookingCommand(id: string, managerId: string): Promise<void> {
  if (!isUuid(id)) {
    throw new HttpError(400, "Booking ID must be a UUID");
  }//checks if id is valid

  const repository = AppDataSource.getRepository(Booking);
  // Only bookings for rooms in hotels this manager manages can be approved.
  const result = await repository
    .createQueryBuilder()
    .update(Booking)
    .set({ status: "Approved" })
    .where("id = :id AND status = 'Pending'", { id })
    .andWhere(MANAGED_ROOM_IDS_SQL, { managerId })
    .execute(); // attempts to update the booking status to "Approved" if it is currently "Pending"

  // Single conditional UPDATE (WHERE status = 'Pending') instead of read-then-write.
  // The status check and the change happen atomically in the database, so two
  // managers acting at once can't both succeed, and an Approved or Rejected
  // booking can never be modified. affected !== 1 means it wasn't Pending or isn't theirs.
  if (result.affected !== 1) {
    // A booking at a hotel the manager doesn't manage is reported as not found.
    const exists = await repository.exists({
      where: { id, room: { hotel: { propertyManagerId: managerId } } },
    });
    throw new HttpError(
      exists ? 409 : 404,
      exists
        ? "Only pending bookings can be approved"
        : "Booking not found",
    );
  }

  // Announce the fact that the request was approved, only after the update succeeded.
  await publish(bookingApprovedEvent(id));
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
