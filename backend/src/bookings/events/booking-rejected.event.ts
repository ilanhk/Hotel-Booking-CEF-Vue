import type { DomainEvent } from "../../shared/event-bus.js";

export function bookingRejectedEvent(
  bookingId: string,
  comment: string,
): DomainEvent {
  return {
    name: "BookingRejected",
    occurredAt: new Date(),
    payload: { bookingId, comment },
  };
}
