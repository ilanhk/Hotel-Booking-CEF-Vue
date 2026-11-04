import type { Booking } from "../booking.entity.js";

// Date columns come back as "YYYY-MM-DD" strings from Postgres; normalise defensively to that format.
export function toDateOnly(value: Date | string): string {
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

export function toBookingDetailDto(booking: Booking) {
  return {
    ...toMyBookingDto(booking),
    guestId: booking.guestId,
    roomId: booking.roomId,
    hotelId: booking.room.hotelId,
  };
}

export function toMyBookingDto(request: Booking) {
  return {
    id: request.id,
    startDate: toDateOnly(request.startDate),
    endDate: toDateOnly(request.endDate),
    totalCost: request.totalCost,
    reason: request.reason,
    status: request.status,
    comments: request.comments,
    createdAt: request.createdAt,
  };
}

// Requires the booking to be loaded with room.hotel and room.roomType.
export function toGuestBookingDto(booking: Booking) {
  return {
    ...toMyBookingDto(booking),
    hotelId: booking.room.hotelId,
    hotelName: booking.room.hotel.name,
    city: booking.room.hotel.city,
    roomType: booking.room.roomType.name,
    roomNumber: booking.room.roomNumber,
  };
}
