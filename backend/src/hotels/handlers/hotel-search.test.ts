import { describe, expect, it } from "vitest";
import {
  buildEvent,
  createBooking,
  createHotel,
  createHotelWithRooms,
  createRoom,
  createRoomType,
  createUser,
  daysFromToday,
  jsonBody,
  statusOf,
} from "../../test/helpers.js";
import { searchHotelsHandler } from "./hotel-search.js";

type HotelResult = { id: string; city: string; availableRooms: number; fromPrice: number };

const stay = { startDate: daysFromToday(10), endDate: daysFromToday(13) };

async function search(city: string, query: Record<string, string> = stay) {
  const guest = await createUser();
  return searchHotelsHandler(null, buildEvent(guest, { query: { city, ...query } }));
}

describe("searchHotelsHandler", () => {
  it("returns hotels in the city with their free room count and cheapest price", async () => {
    const manager = await createUser("Property Manager");
    const { hotel, rooms } = await createHotelWithRooms(manager, 2, 150);
    const cheaperType = await createRoomType(hotel, 90);
    await createRoom(hotel, cheaperType);
    expect(rooms).toHaveLength(2);

    const result = await search("Tel Aviv");

    expect(statusOf(result)).toBe(200);
    expect(jsonBody<HotelResult[]>(result)).toEqual([
      expect.objectContaining({ id: hotel.id, availableRooms: 3, fromPrice: 90 }),
    ]);
  });

  it("hides a hotel whose rooms are all booked for the stay", async () => {
    const manager = await createUser("Property Manager");
    const guest = await createUser();
    const { rooms } = await createHotelWithRooms(manager, 1);
    await createBooking(guest, rooms[0]!, daysFromToday(11), daysFromToday(12), "Approved");

    const result = await search("Tel Aviv");

    expect(jsonBody<HotelResult[]>(result)).toEqual([]);
  });

  it("keeps a hotel visible while at least one room is still free", async () => {
    const manager = await createUser("Property Manager");
    const guest = await createUser();
    const { hotel, rooms } = await createHotelWithRooms(manager, 2);
    await createBooking(guest, rooms[0]!, daysFromToday(10), daysFromToday(13), "Pending");

    const result = await search("Tel Aviv");

    expect(jsonBody<HotelResult[]>(result)).toEqual([
      expect.objectContaining({ id: hotel.id, availableRooms: 1 }),
    ]);
  });

  it("ignores rejected bookings when counting free rooms", async () => {
    const manager = await createUser("Property Manager");
    const guest = await createUser();
    const { hotel, rooms } = await createHotelWithRooms(manager, 1);
    await createBooking(guest, rooms[0]!, daysFromToday(10), daysFromToday(13), "Rejected");

    const result = await search("Tel Aviv");

    expect(jsonBody<HotelResult[]>(result)).toEqual([expect.objectContaining({ id: hotel.id })]);
  });

  it.each(["Tel Aviv", "Tel+Aviv", "Tel%20Aviv", "tel aviv"])(
    "finds a multi-word city however the query string encodes it: %s",
    async (city) => {
      const manager = await createUser("Property Manager");
      const { hotel } = await createHotelWithRooms(manager);

      const result = await search(city);

      expect(jsonBody<HotelResult[]>(result)).toEqual([expect.objectContaining({ id: hotel.id })]);
    },
  );

  it("only returns hotels from the requested city", async () => {
    const manager = await createUser("Property Manager");
    await createHotelWithRooms(manager);
    const haifaHotel = await createHotel(manager, { city: "Haifa" });
    await createRoom(haifaHotel, await createRoomType(haifaHotel));

    const result = await search("Haifa");

    expect(jsonBody<HotelResult[]>(result)).toEqual([
      expect.objectContaining({ id: haifaHotel.id, city: "Haifa" }),
    ]);
  });

  it("requires authentication", async () => {
    const result = await searchHotelsHandler(null, buildEvent(null, { query: { city: "Tel Aviv", ...stay } }));

    expect(statusOf(result)).toBe(401);
  });

  it.each([
    ["no city", { city: "", ...stay }],
    ["a missing end date", { city: "Tel Aviv", startDate: stay.startDate }],
    ["an end date before the start date", { city: "Tel Aviv", startDate: stay.endDate, endDate: stay.startDate }],
  ])("rejects a search with %s", async (_label, query) => {
    const guest = await createUser();

    const result = await searchHotelsHandler(null, buildEvent(guest, { query }));

    expect(statusOf(result)).toBe(400);
  });
});
