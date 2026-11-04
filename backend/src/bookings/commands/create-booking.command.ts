import { publish } from "../../shared/event-bus.js";
import { HttpError } from "../../shared/http-error.js";
import { AppDataSource } from "../../data-source.js";
import { Booking } from "../booking.entity.js";
import { Room } from "../../room-management/rooms/room.entity.js";
import { bookingCreatedEvent } from "../events/booking-created.event.js";

export type CreateBookingCommandInput = {
  userId: string;
  roomId: string;
  startDate: string;
  endDate: string;
  reason?: string;
};

// A room can't be booked if:
// 1. The dates overlap a pending or approved booking of the same user
// 2. The start date is in the past
// 3. The end date is not after the start date
// 4. The room is already booked by someone else for the requested dates
// Shape checks (UUID format, reason length) are done by validateCreateBookingInput in the handler.
const ACTIVE_STATUSES = ["Pending", "Approved"];

export async function createBookingCommand(
  input: CreateBookingCommandInput,
): Promise<{ id: string; totalCost: number | null }> {
  validateDateRange(input.startDate, input.endDate); // cases 3
  if (input.startDate < new Date().toISOString().slice(0, 10)) {
    throw new HttpError(400, "Bookings cannot start in the past"); // case 2
  }

  try {
    // SERIALIZABLE so two simultaneous requests can't both pass the overlap checks.
    // Rejected bookings are ignored (those days are free again).
    const booking = await AppDataSource.transaction(
      "SERIALIZABLE",
      async (manager) => {
        const room = await manager.getRepository(Room).findOne({
          where: { id: input.roomId },
          relations: { roomType: true },
        });
        if (!room) {
          throw new HttpError(404, "Room not found");
        }
        // The nightly price belongs to the room type.
        const totalCost = calculateTotalCost(input.startDate, input.endDate, room.roomType.price);

        const repository = manager.getRepository(Booking);
        const overlapping = () =>
          repository
            .createQueryBuilder("booking")
            .where("booking.status IN (:...statuses)", { statuses: ACTIVE_STATUSES })
            .andWhere("booking.startDate <= :endDate", { endDate: input.endDate })
            .andWhere("booking.endDate >= :startDate", { startDate: input.startDate });

        // case 1
        const guestOverlap = await overlapping()
          .andWhere("booking.guestId = :guestId", { guestId: input.userId })
          .getOne();
        if (guestOverlap) {
          throw new HttpError(
            409,
            "You already have a pending or approved booking for these dates",
          );
        }

        // case 4: each room row is a single room
        const roomOverlap = await overlapping()
          .andWhere("booking.roomId = :roomId", { roomId: input.roomId })
          .getOne();
        if (roomOverlap) {
          throw new HttpError(409, "This room is already booked for the requested dates");
        }

        return repository.save(
          repository.create({
            guestId: input.userId,
            roomId: input.roomId,
            startDate: new Date(`${input.startDate}T00:00:00.000Z`),
            endDate: new Date(`${input.endDate}T00:00:00.000Z`),
            totalCost,
            reason: input.reason?.trim() || null,
            status: "Pending",
            comments: null,
          }),
        );
      },
    );

    // Announce the fact that the booking was created, only after the transaction succeeded.
    await publish(
      bookingCreatedEvent(
        booking.id,
        booking.guestId,
        booking.roomId,
        input.startDate,
        input.endDate,
        booking.totalCost,
      ),
    );
    return { id: booking.id, totalCost: booking.totalCost };
  } catch (error) {
    if (isSerializationFailure(error)) {
      throw new HttpError(
        409,
        "A concurrent request changed the booking schedule. Please retry.",
      );
    }
    throw error;
  }
}

// Nights = end - start (the end date is the check-out day). Computed in integer cents to avoid floating-point drift.
function calculateTotalCost(startDate: string, endDate: string, pricePerNight: number): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const nights = Math.round(
    (Date.parse(`${endDate}T00:00:00.000Z`) - Date.parse(`${startDate}T00:00:00.000Z`)) / msPerDay,
  );
  return (nights * Math.round(pricePerNight * 100)) / 100;
}

function validateDateRange(startDate: string, endDate: string): void {
  if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate)) {
    throw new HttpError(400, "Start and end dates must use YYYY-MM-DD format");
  }
  if (endDate <= startDate) {
    throw new HttpError(400, "End date must be after the start date");
  }
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isSerializationFailure(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "40001"
  );
}
