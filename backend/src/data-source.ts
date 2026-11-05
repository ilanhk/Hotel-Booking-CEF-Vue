import "reflect-metadata";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import { Hotel } from "./hotels/hotel.entity.js";
import { HotelImage } from "./hotel-images/hotel-images.entity.js";
import { Room } from "./room-management/rooms/room.entity.js";
import { RoomType } from "./room-management/room-type/room-type.entity.js";
import { RoomTypeImage } from "./room-management/room-type-images/room-type-images.entity.js";
import { User } from "./users/user.entity.js";
import { Booking } from "./bookings/booking.entity.js";
import { LoginAttempt } from "./auth/login-attempt.entity.js";
import { InitialSchema1762363200000 } from "./migrations/1762363200000-InitialSchema.js";

config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const sslMode = new URL(databaseUrl).searchParams.get("sslmode");

export const AppDataSource = new DataSource({
  type: "postgres",
  url: databaseUrl,
  ssl: sslMode && sslMode.toLowerCase() !== "disable" ? true : false,
  entities: [User, Booking, Hotel, HotelImage, Room, RoomType, RoomTypeImage, LoginAttempt],
  migrations: [InitialSchema1762363200000],
  synchronize: false,
  logging: false,
});

export async function initializeDataSource(): Promise<DataSource> {
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }

  await AppDataSource.initialize();
  return AppDataSource;
}
