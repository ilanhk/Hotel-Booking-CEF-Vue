import { publish } from "../../shared/event-bus.js";
import { HttpError } from "../../shared/http-error.js";
import { AppDataSource } from "../../data-source.js";
import { Booking } from "../booking.entity.js";
import { bookingRejectedEvent } from "../events/booking-rejected.event.js";
import { MANAGED_ROOM_IDS_SQL } from "../utils/manager-scope.js";

export async function rejectBookingCommand(
  id: string,
  managerId: string,
  comment: string,
): Promise<void> {
  if (!isUuid(id)) {
    throw new HttpError(400, "Booking ID must be a UUID");
  }
  const normalizedComment = comment.trim();
  if (!normalizedComment) {
    throw new HttpError(400, "A rejection comment is required");
  }
  if (normalizedComment.length > 2000) {
    throw new HttpError(400, "Rejection comment cannot exceed 2000 characters");
  }

  const repository = AppDataSource.getRepository(Booking);
  // Same atomic conditional update as approve: only a Pending booking at a hotel this manager manages can be rejected.
  const result = await repository
    .createQueryBuilder()
    .update(Booking)
    .set({ status: "Rejected", comments: normalizedComment })
    .where("id = :id AND status = 'Pending'", { id })
    .andWhere(MANAGED_ROOM_IDS_SQL, { managerId })
    .execute();
  if (result.affected !== 1) {
    // A booking at a hotel the manager doesn't manage is reported as not found.
    const exists = await repository.exists({
      where: { id, room: { hotel: { propertyManagerId: managerId } } },
    });
    throw new HttpError(
      exists ? 409 : 404,
      exists
        ? "Only pending bookings can be rejected"
        : "Booking not found",
    );
  }
  // The command's last step: announce the fact that a request was rejected.
  // The event is published only after the database update succeeded.
  await publish(bookingRejectedEvent(id, normalizedComment));
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
