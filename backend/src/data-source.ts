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

config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export const AppDataSource = new DataSource({
  type: "postgres",
  url: databaseUrl,
  ssl: databaseUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : false,
  entities: [User, Booking, Hotel, HotelImage, Room, RoomType, RoomTypeImage],
  synchronize: true, //acceptable for this assignment/development, but not recommended for production (can  accidentaly remove/rewrite the database schema)
  logging: false,
});

export async function initializeDataSource(): Promise<DataSource> {
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }

  await AppDataSource.initialize();
  return AppDataSource;
}
