// SQL fragment: ids of the rooms that belong to hotels managed by :managerId.
// Used inside raw UPDATE where-clauses so the ownership check and the status change stay in one atomic statement.
export const MANAGED_ROOM_IDS_SQL = `room_id IN (
  SELECT r.id FROM rooms r
  INNER JOIN hotels h ON h.id = r.hotel_id
  WHERE h.property_manager_id = :managerId
)`;
