import jwt from "jsonwebtoken";
import type { CommonEvent } from "commoneventframework/dist/types/commonEvent.js";
import { AppDataSource } from "../data-source.js";
import { Booking } from "../bookings/booking.entity.js";
import { Hotel } from "../hotels/hotel.entity.js";
import { Room } from "../room-management/rooms/room.entity.js";
import { RoomType } from "../room-management/room-type/room-type.entity.js";
import { User, type UserRole } from "../users/user.entity.js";

let counter = 0;
const next = () => ++counter;

export function createUser(role: UserRole = "Guest"): Promise<User> {
  const n = next();
  return AppDataSource.getRepository(User).save({
    name: `${role} ${n}`,
    email: `user${n}@example.com`,
    password: "not-a-real-hash",
    role,
  });
}

export function createHotel(manager: User, overrides: Partial<Hotel> = {}): Promise<Hotel> {
  const n = next();
  return AppDataSource.getRepository(Hotel).save({
    name: `Hotel ${n}`,
    description: "A test hotel",
    city: "Tel Aviv",
    propertyManagerId: manager.id,
    ...overrides,
  });
}

export function createRoomType(hotel: Hotel, price = 100): Promise<RoomType> {
  return AppDataSource.getRepository(RoomType).save({
    name: `Room type ${next()}`,
    price,
    hotelId: hotel.id,
  });
}

export function createRoom(hotel: Hotel, roomType: RoomType): Promise<Room> {
  return AppDataSource.getRepository(Room).save({
    roomNumber: String(100 + next()),
    hotelId: hotel.id,
    roomTypeId: roomType.id,
  });
}

// A hotel with one room type and the given number of rooms: the usual starting point for a test.
export async function createHotelWithRooms(manager: User, roomCount = 1, price = 100) {
  const hotel = await createHotel(manager);
  const roomType = await createRoomType(hotel, price);
  const rooms = await Promise.all(Array.from({ length: roomCount }, () => createRoom(hotel, roomType)));
  return { hotel, roomType, rooms };
}

export function createBooking(
  guest: User,
  room: Room,
  startDate: string,
  endDate: string,
  status: Booking["status"] = "Pending",
): Promise<Booking> {
  return AppDataSource.getRepository(Booking).save({
    guestId: guest.id,
    roomId: room.id,
    startDate: new Date(`${startDate}T00:00:00.000Z`),
    endDate: new Date(`${endDate}T00:00:00.000Z`),
    totalCost: 0,
    status,
    reason: null,
    comments: null,
  });
}

// "YYYY-MM-DD" for a day offset from today (UTC), so tests never depend on the calendar date.
export function daysFromToday(offset: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

type EventOptions = {
  query?: Record<string, string>;
  pathParameters?: Record<string, string>;
};

// A request as the handlers receive it, authenticated with a real signed access token for `user` (or anonymous).
export function buildEvent(user: User | null, options: EventOptions = {}): CommonEvent {
  const cookies: Record<string, string> = {};
  if (user) {
    cookies[process.env.ACCESS_TOKEN_NAME!] = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_ACCESS!);
  }
  return {
    path: "/",
    method: "GET",
    body: null,
    pathParameters: options.pathParameters,
    queryStringParameters: options.query,
    headers: {},
    cookies,
    version: "2.0",
  };
}

// Parses the JSON body of a handler result.
export function jsonBody<T = unknown>(result: object): T {
  return JSON.parse((result as { body: string }).body) as T;
}

export function statusOf(result: object): number {
  return (result as { statusCode: number }).statusCode;
}
