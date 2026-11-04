// SQL fragment for a room query aliased as "room": true when the room has no pending or approved booking
// overlapping :startDate..:endDate. Uses the same inclusive overlap rule as createBookingCommand.
export const ROOM_AVAILABLE_SQL = `NOT EXISTS (
  SELECT 1 FROM bookings b
  WHERE b.room_id = room.id
    AND b.status IN ('Pending', 'Approved')
    AND b.start_date <= :endDate
    AND b.end_date >= :startDate
)`;
