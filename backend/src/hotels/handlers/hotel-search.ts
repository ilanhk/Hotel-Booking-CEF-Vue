import { Response } from "commoneventframework";
import { In, ILike } from "typeorm";
import { AppDataSource } from "../../data-source.js";
import { authenticate } from "../../shared/utils/authentication.js";
import type { HandlerFn } from "../../shared/types.js";
import { ROOM_AVAILABLE_SQL } from "../../bookings/utils/room-availability.js";
import { HotelImage } from "../../hotel-images/hotel-images.entity.js";
import { Room } from "../../room-management/rooms/room.entity.js";
import { RoomTypeImage } from "../../room-management/room-type-images/room-type-images.entity.js";
import { RoomType } from "../../room-management/room-type/room-type.entity.js";
import { Hotel } from "../hotel.entity.js";
import { validateStayDates } from "../utils/validate-stay-dates.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Seeded storage keys are absolute image URLs, so they are served as-is.
function toImageDto(image: { id: string; storageKey: string; altText: string | null }) {
  return { id: image.id, url: image.storageKey, altText: image.altText };
}

// Distinct cities that have at least one hotel, for the guest search dropdown.
export const listHotelCitiesHandler: HandlerFn = async (_input, event) => {
  const authentication = await authenticate(event);
  if ("response" in authentication) {
    return authentication.response;
  }
  try {
    const rows = (await AppDataSource.getRepository(Hotel)
      .createQueryBuilder("hotel")
      .select("DISTINCT hotel.city", "city")
      .orderBy("hotel.city", "ASC")
      .getRawMany()) as { city: string }[];
    return new Response(
      200,
      rows.map((row) => row.city),
    );
  } catch (error) {
    console.error("Failed to list hotel cities", error);
    return new Response(500, { error: "Internal server error" });
  }
};

function decodeQueryValue(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

// Hotels in a city that have at least one room free for the whole stay, with their images.
export const searchHotelsHandler: HandlerFn = async (_input, event) => {
  const authentication = await authenticate(event);
  if ("response" in authentication) {
    return authentication.response;
  }

  const query = event.queryStringParameters ?? {};
  // The framework passes query values through undecoded, so "Tel Aviv" arrives as "Tel+Aviv" or "Tel%20Aviv".
  const city = decodeQueryValue(query.city ?? "").trim();
  if (city.length < 1 || city.length > 255) {
    return new Response(400, { error: "City is required" });
  }
  const dates = validateStayDates(query.startDate, query.endDate);
  if (!dates.valid) {
    return new Response(400, { error: dates.message });
  }
  const stay = { startDate: dates.startDate, endDate: dates.endDate };

  try {
    // Escape LIKE wildcards so the city is matched literally (case-insensitive, partial).
    const hotels = await AppDataSource.getRepository(Hotel).find({
      where: { city: ILike(`%${city.replace(/[\\%_]/g, "\\$&")}%`) },
      order: { name: "ASC" },
    });
    if (hotels.length === 0) {
      return new Response(200, []);
    }
    const hotelIds = hotels.map((hotel) => hotel.id);

    const availability = (await AppDataSource.getRepository(Room)
      .createQueryBuilder("room")
      .innerJoin("room.roomType", "roomType")
      .select("room.hotelId", "hotelId")
      .addSelect("COUNT(room.id)", "availableRooms")
      .addSelect("MIN(roomType.price)", "fromPrice")
      .where("room.hotelId IN (:...hotelIds)", { hotelIds })
      .andWhere(ROOM_AVAILABLE_SQL, stay)
      .groupBy("room.hotelId")
      .getRawMany()) as Array<{ hotelId: string; availableRooms: string; fromPrice: string }>;
    const availabilityByHotel = new Map(availability.map((row) => [row.hotelId, row]));

    const images = await AppDataSource.getRepository(HotelImage).find({
      where: { hotelId: In(hotelIds) },
      order: { sortOrder: "ASC", createdAt: "ASC" },
    });

    return new Response(
      200,
      hotels
        .filter((hotel) => availabilityByHotel.has(hotel.id))
        .map((hotel) => ({
          id: hotel.id,
          name: hotel.name,
          description: hotel.description,
          city: hotel.city,
          availableRooms: Number(availabilityByHotel.get(hotel.id)!.availableRooms),
          fromPrice: Number(availabilityByHotel.get(hotel.id)!.fromPrice),
          images: images.filter((image) => image.hotelId === hotel.id).map(toImageDto),
        })),
    );
  } catch (error: unknown) {
    console.error("Failed to search hotels", error);
    return new Response(500, { error: "Failed to search hotels" });
  }
};

// A hotel's room types for a stay: images, nightly price and how many rooms of the type are still free.
export const getHotelRoomTypesHandler: HandlerFn = async (_input, event) => {
  const authentication = await authenticate(event);
  if ("response" in authentication) {
    return authentication.response;
  }

  const hotelId = event.pathParameters?.id ?? "";
  if (!UUID_PATTERN.test(hotelId)) {
    return new Response(400, { error: "Hotel ID must be a valid UUID" });
  }
  const query = event.queryStringParameters ?? {};
  const dates = validateStayDates(query.startDate, query.endDate);
  if (!dates.valid) {
    return new Response(400, { error: dates.message });
  }
  const stay = { startDate: dates.startDate, endDate: dates.endDate };

  try {
    const hotel = await AppDataSource.getRepository(Hotel).findOne({ where: { id: hotelId } });
    if (!hotel) {
      return new Response(404, { error: "Hotel not found" });
    }

    const roomTypes = await AppDataSource.getRepository(RoomType).find({
      where: { hotelId },
      order: { price: "ASC", name: "ASC" },
    });
    const roomTypeIds = roomTypes.map((roomType) => roomType.id);

    const availableRooms =
      roomTypeIds.length === 0
        ? []
        : await AppDataSource.getRepository(Room)
            .createQueryBuilder("room")
            .where("room.roomTypeId IN (:...roomTypeIds)", { roomTypeIds })
            .andWhere(ROOM_AVAILABLE_SQL, stay)
            .orderBy("room.roomNumber", "ASC")
            .getMany();
    const images =
      roomTypeIds.length === 0
        ? []
        : await AppDataSource.getRepository(RoomTypeImage).find({
            where: { roomTypeId: In(roomTypeIds) },
            order: { sortOrder: "ASC", createdAt: "ASC" },
          });

    return new Response(200, {
      hotel: { id: hotel.id, name: hotel.name, city: hotel.city, description: hotel.description },
      roomTypes: roomTypes.map((roomType) => {
        const rooms = availableRooms.filter((room) => room.roomTypeId === roomType.id);
        return {
          id: roomType.id,
          name: roomType.name,
          pricePerNight: roomType.price,
          quantity: rooms.length,
          // A free room of this type that the guest can book (null when sold out).
          bookableRoomId: rooms[0]?.id ?? null,
          images: images.filter((image) => image.roomTypeId === roomType.id).map(toImageDto),
        };
      }),
    });
  } catch (error: unknown) {
    console.error("Failed to fetch hotel room types", error);
    return new Response(500, { error: "Failed to fetch hotel room types" });
  }
};
