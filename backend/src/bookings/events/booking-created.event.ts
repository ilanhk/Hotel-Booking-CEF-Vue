import type { DomainEvent } from "../../shared/event-bus.js";

export function bookingCreatedEvent(
  bookingId: string,
  guestId: string,
  roomId: string,
  startDate: string,
  endDate: string,
  totalCost: number | null,
): DomainEvent {
  return {
    name: "BookingCreated",
    occurredAt: new Date(),
    payload: { bookingId, guestId, roomId, startDate, endDate, totalCost },
  };
}
