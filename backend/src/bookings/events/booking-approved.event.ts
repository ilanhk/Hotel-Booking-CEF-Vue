import type { DomainEvent } from "../../shared/event-bus.js";

export function bookingApprovedEvent(bookingId: string): DomainEvent {
  return {
    name: "BookingApproved",
    occurredAt: new Date(),
    payload: { bookingId },
  };
}
