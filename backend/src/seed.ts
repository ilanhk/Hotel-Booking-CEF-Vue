import "reflect-metadata";
import { In } from "typeorm";
import { hashPassword } from "./auth/utils/password-hashing.js";
import { initializeDataSource, AppDataSource } from "./data-source.js";
import { User } from "./users/user.entity.js";
import type { UserRole } from "./users/user.entity.js";
import { Booking } from "./bookings/booking.entity.js";
import type { BookingStatus } from "./bookings/booking.entity.js";
import { Hotel } from "./hotels/hotel.entity.js";
import { HotelImage } from "./hotel-images/hotel-images.entity.js";
import { Room } from "./room-management/rooms/room.entity.js";
import { RoomType } from "./room-management/room-type/room-type.entity.js";
import { RoomTypeImage } from "./room-management/room-type-images/room-type-images.entity.js";

// Demo users to be seeded into the database for testing: 5 guests and 5 property managers
const demoUsers: Array<{ name: string; email: string; role: UserRole }> = [
  ...[1, 2, 3, 4, 5].map((n) => ({
    name: `Guest ${n}`,
    email: `guest${n}@example.com`,
    role: "Guest" as const,
  })),
  ...Array.from({ length: 13 }, (_, i) => i + 1).map((n) => ({
    name: `Property Manager ${n}`,
    email: `pm${n}@example.com`,
    role: "Property Manager" as const,
  })),
];

// Property manager n manages hotel n.
const demoHotels: Array<{ name: string; description: string; city: string; managerEmail: string }> = [
  { name: "Seaside Resort", description: "Beachfront resort with a pool and spa", city: "Tel Aviv", managerEmail: "pm1@example.com" },
  { name: "Old City Boutique", description: "Charming boutique hotel in the historic centre", city: "Jerusalem", managerEmail: "pm2@example.com" },
  { name: "Harbor View Hotel", description: "Modern hotel overlooking the harbor", city: "Haifa", managerEmail: "pm3@example.com" },
  { name: "Desert Oasis Lodge", description: "Quiet lodge with stargazing terraces", city: "Eilat", managerEmail: "pm4@example.com" },
  { name: "Lakeside Inn", description: "Family-friendly inn by the lake", city: "Tiberias", managerEmail: "pm5@example.com" },
  { name: "Mediterranean Pearl", description: "Elegant hotel steps from the Tel Aviv promenade", city: "Tel Aviv", managerEmail: "pm6@example.com" },
  { name: "Rothschild Urban Suites", description: "Stylish city suites on Rothschild Boulevard", city: "Tel Aviv", managerEmail: "pm7@example.com" },
  { name: "Zion Gate Hotel", description: "Comfortable stay minutes from the Old City walls", city: "Jerusalem", managerEmail: "pm8@example.com" },
  { name: "Mount Olive Retreat", description: "Peaceful hillside hotel with panoramic views", city: "Jerusalem", managerEmail: "pm9@example.com" },
  { name: "Red Sea Paradise", description: "All-inclusive resort on the Eilat coast", city: "Eilat", managerEmail: "pm10@example.com" },
  { name: "Coral Bay Hotel", description: "Diver-friendly hotel next to the coral reef", city: "Eilat", managerEmail: "pm11@example.com" },
  { name: "Carmel Heights Hotel", description: "Hillside hotel with views over Haifa Bay", city: "Haifa", managerEmail: "pm12@example.com" },
  { name: "Bahai Gardens Inn", description: "Quiet inn close to the terraced gardens", city: "Haifa", managerEmail: "pm13@example.com" },
];

const demoRoomTypes = [
  { name: "Standard", price: 120 },
  { name: "Deluxe Suite", price: 220 },
  { name: "Suite", price: 350 },
];

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const demoHotelImageKeys: Record<string, string[]> = {
  "Mediterranean Pearl": ["photo-1566073771259-6a8506099945", "photo-1571896349842-33c89424de2d", "photo-1540541338287-41700207dee6"].map(unsplash),
  "Rothschild Urban Suites": ["photo-1551882547-ff40c63fe5fa", "photo-1496417263034-38ec4f0b665a", "photo-1445019980597-93fa8acb246c"].map(unsplash),
  "Zion Gate Hotel": ["photo-1564501049412-61c2a3083791", "photo-1542314831-068cd1dbfeeb", "photo-1566073771259-6a8506099945"].map(unsplash),
  "Mount Olive Retreat": ["photo-1445019980597-93fa8acb246c", "photo-1564501049412-61c2a3083791", "photo-1576013551627-0cc20b96c2a7"].map(unsplash),
  "Red Sea Paradise": ["photo-1571896349842-33c89424de2d", "photo-1576013551627-0cc20b96c2a7", "photo-1540541338287-41700207dee6"].map(unsplash),
  "Coral Bay Hotel": ["photo-1540541338287-41700207dee6", "photo-1510798831971-661eb04b3739", "photo-1518684079-3c830dcef090"].map(unsplash),
  "Carmel Heights Hotel": ["photo-1496417263034-38ec4f0b665a", "photo-1551882547-ff40c63fe5fa", "photo-1566073771259-6a8506099945"].map(unsplash),
  "Bahai Gardens Inn": ["photo-1542314831-068cd1dbfeeb", "photo-1445019980597-93fa8acb246c", "photo-1551882547-ff40c63fe5fa"].map(unsplash),
  "Seaside Resort": [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80",
  ],
  "Old City Boutique": [
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
  ],
  "Harbor View Hotel": [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?auto=format&fit=crop&w=1200&q=80",
  ],
  "Desert Oasis Lodge": [
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
  ],
  "Lakeside Inn": [
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  ],
};

const demoRoomTypeImageKeys: Record<string, string[]> = {
  Standard: [
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
  ],
  "Deluxe Suite": [
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
  ],
  Suite: [
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
  ],
};

const bookingStatuses: BookingStatus[] = ["Pending", "Approved", "Rejected"];
const bookingReasons = ["Family trip", "Summer holiday", "Long weekend", "Business trip", "Anniversary", "Honeymoon"];
const rejectionComments = [
  "Team is short-staffed during this period",
  "Room is reserved for maintenance",
  "Unable to accommodate these dates",
];
const MIN_BOOKINGS_PER_HOTEL = 3;
const MAX_BOOKINGS_PER_HOTEL = 6;
// Each booking gets its own 15-day slot so bookings in the same room never overlap.
const BOOKING_SLOT_DAYS = 15;

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// Returns a Date at UTC midnight, `offsetDays` after today (matches the Postgres `date` column)
function futureDate(offsetDays: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays),
  );
}

async function seedHotelImages(hotel: Hotel): Promise<void> {
  const repository = AppDataSource.getRepository(HotelImage);
  const existingImages = await repository.find({ where: { hotelId: hotel.id } });
  const imageKeys = demoHotelImageKeys[hotel.name];
  if (!imageKeys) {
    throw new Error(`Missing demo image keys for hotel ${hotel.name}`);
  }

  const missingImageKeys = imageKeys.slice(existingImages.length);
  if (missingImageKeys.length === 0) {
    return;
  }

  const hasPrimaryImage = existingImages.some((image) => image.isPrimary);
  await repository.save(
    missingImageKeys.map((storageKey, index) =>
      repository.create({
        storageKey,
        hotelId: hotel.id,
        originalFilename: null,
        altText: `${hotel.name} image ${existingImages.length + index + 1}`,
        sortOrder: existingImages.length + index,
        isPrimary: !hasPrimaryImage && index === 0,
      }),
    ),
  );
}

async function seedRoomTypeImages(roomType: RoomType): Promise<void> {
  const repository = AppDataSource.getRepository(RoomTypeImage);
  const existingImages = await repository.find({
    where: { roomTypeId: roomType.id },
  });
  const imageKeys = demoRoomTypeImageKeys[roomType.name];
  if (!imageKeys) {
    throw new Error(`Missing demo image keys for room type ${roomType.name}`);
  }

  const missingImageKeys = imageKeys.slice(existingImages.length);
  if (missingImageKeys.length === 0) {
    return;
  }

  const hasPrimaryImage = existingImages.some((image) => image.isPrimary);
  await repository.save(
    missingImageKeys.map((storageKey, index) =>
      repository.create({
        storageKey,
        roomTypeId: roomType.id,
        originalFilename: null,
        altText: `${roomType.name} room image ${existingImages.length + index + 1}`,
        sortOrder: existingImages.length + index,
        isPrimary: !hasPrimaryImage && index === 0,
      }),
    ),
  );
}

// Creates each hotel for its manager with one or more rooms of each type.
async function seedDemoHotels(managers: Map<string, User>): Promise<Map<string, Room[]>> {
  const hotelRepository = AppDataSource.getRepository(Hotel);
  const roomRepository = AppDataSource.getRepository(Room);
  const roomTypeRepository = AppDataSource.getRepository(RoomType);
  const roomsByHotel = new Map<string, Room[]>();

  for (const demoHotel of demoHotels) {
    const manager = managers.get(demoHotel.managerEmail);
    if (!manager) {
      throw new Error(`Missing property manager ${demoHotel.managerEmail}`);
    }

    let hotel = await hotelRepository.findOne({ where: { name: demoHotel.name } });
    if (hotel) {
      console.log(`Skipped existing hotel: ${demoHotel.name}`);
    } else {
      hotel = await hotelRepository.save(
        hotelRepository.create({
          name: demoHotel.name,
          description: demoHotel.description,
          city: demoHotel.city,
          propertyManagerId: manager.id,
        }),
      );
      console.log(`Created hotel: ${demoHotel.name}`);
    }

    await seedHotelImages(hotel);

    const roomTypesByName = new Map(
      (await roomTypeRepository.find({ where: { hotelId: hotel.id } })).map(
        (roomType) => [roomType.name, roomType],
      ),
    );
    for (const demoRoomType of demoRoomTypes) {
      const existing = roomTypesByName.get(demoRoomType.name);
      if (!existing) {
        const roomType = await roomTypeRepository.save(
          roomTypeRepository.create({
            name: demoRoomType.name,
            price: demoRoomType.price,
            hotelId: hotel.id,
          }),
        );
        roomTypesByName.set(roomType.name, roomType);
      } else if (existing.price !== demoRoomType.price) {
        // Room types created before prices moved here start at 0.
        existing.price = demoRoomType.price;
        await roomTypeRepository.save(existing);
      }
    }
    for (const demoRoomType of demoRoomTypes) {
      await seedRoomTypeImages(roomTypesByName.get(demoRoomType.name)!);
    }

    const rooms = await roomRepository.find({
      where: { hotelId: hotel.id },
      order: { roomNumber: "ASC" },
    });
    const newRoomTypes = demoRoomTypes.filter((demoRoomType) => {
      const roomType = roomTypesByName.get(demoRoomType.name)!;
      return !rooms.some((room) => room.roomTypeId === roomType.id);
    });
    const roomTypesToAdd = [...newRoomTypes];
    if (rooms.length === 0) {
      // Add 0-5 extra rooms of random types to vary the hotel's inventory.
      const extraCount = Math.floor(Math.random() * 6);
      roomTypesToAdd.push(
        ...Array.from(
          { length: extraCount },
          () => demoRoomTypes[Math.floor(Math.random() * demoRoomTypes.length)]!,
        ),
      );
    }
    if (roomTypesToAdd.length > 0) {
      const hotelNumber = demoHotels.indexOf(demoHotel) + 1;
      const usedRoomNumbers = new Set(
        rooms.map((room) => room.roomNumber).filter((number) => number !== null),
      );
      let roomNumberIndex = 1;
      const newRooms = roomTypesToAdd.map((demoRoomType) => {
        let roomNumber = `${hotelNumber}${String(roomNumberIndex).padStart(2, "0")}`;
        while (usedRoomNumbers.has(roomNumber)) {
          roomNumberIndex++;
          roomNumber = `${hotelNumber}${String(roomNumberIndex).padStart(2, "0")}`;
        }
        usedRoomNumbers.add(roomNumber);
        roomNumberIndex++;

        return roomRepository.create({
          roomNumber,
          roomTypeId: roomTypesByName.get(demoRoomType.name)!.id,
          hotelId: hotel.id,
        });
      });
      const createdRooms = await roomRepository.save(newRooms);
      console.log(`Created ${createdRooms.length} rooms in ${demoHotel.name}`);
    }
    // Reload with the room type so bookings can be priced from it.
    roomsByHotel.set(
      demoHotel.managerEmail,
      await roomRepository.find({
        where: { hotelId: hotel.id },
        relations: { roomType: true },
        order: { roomNumber: "ASC" },
      }),
    );
  }
  return roomsByHotel;
}

// Creates 3-6 bookings with random guests, rooms and statuses for a hotel.
// Skips hotels that already have bookings so re-running the seeder doesn't create duplicates.
async function seedDemoBookings(hotelName: string, rooms: Room[], guests: User[]): Promise<number> {
  const repository = AppDataSource.getRepository(Booking);
  const roomIds = rooms.map((room) => room.id);
  if (roomIds.length === 0) {
    return 0;
  }
  if ((await repository.count({ where: { roomId: In(roomIds) } })) > 0) {
    console.log(`Skipped bookings for ${hotelName} (already has some)`);
    return 0;
  }

  const count = randomInt(MIN_BOOKINGS_PER_HOTEL, MAX_BOOKINGS_PER_HOTEL);
  for (let index = 0; index < count; index++) {
    const room = randomItem(rooms);
    const status = randomItem(bookingStatuses);
    const lengthDays = randomInt(2, 7);
    const startOffset = 7 + index * BOOKING_SLOT_DAYS;
    await repository.save(
      repository.create({
        guestId: randomItem(guests).id,
        roomId: room.id,
        startDate: futureDate(startOffset),
        endDate: futureDate(startOffset + lengthDays),
        totalCost: lengthDays * room.roomType.price,
        reason: randomItem(bookingReasons),
        status,
        comments: status === "Rejected" ? randomItem(rejectionComments) : null,
      }),
    );
  }
  console.log(`Created ${count} bookings for ${hotelName}`);
  return count;
}

async function seedDemoUsers(): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";
  if (
    isProduction &&
    process.env.ALLOW_DEMO_SEED_IN_PRODUCTION !== "true"
  ) {
    throw new Error(
      "Refusing to create demo users in production. Set ALLOW_DEMO_SEED_IN_PRODUCTION=true to explicitly allow it.",
    );
  }

  const password = process.env.SEED_DEMO_PASSWORD ?? (isProduction ? "" : "Vacation123!");
  if (
    isProduction &&
    (!process.env.SEED_DEMO_PASSWORD ||
      process.env.SEED_DEMO_PASSWORD === "Vacation123!")
  ) {
    throw new Error(
      "Set a unique SEED_DEMO_PASSWORD before seeding production; the documented demo password is not allowed.",
    );
  }
  if (
    password.length < 8 ||
    password.length > 128 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    throw new Error(
      "SEED_DEMO_PASSWORD must be 8-128 characters and include uppercase, lowercase, numeric, and symbol characters",
    );
  }

  await initializeDataSource();
  const repository = AppDataSource.getRepository(User);
  const passwordHash = await hashPassword(password);
  let createdCount = 0;
  let bookingCount = 0;
  const guests: User[] = [];
  const managers = new Map<string, User>();

  for (const demoUser of demoUsers) {
    const existingUser = await repository.findOne({
      where: { email: demoUser.email },
    });
    let user = existingUser;
    if (user) {
      console.log(`Skipped existing demo account: ${demoUser.email}`);
    } else {
      user = await repository.save(
        repository.create({
          ...demoUser,
          password: passwordHash,
        }),
      );
      console.log(`Created ${demoUser.role.toLowerCase()}: ${demoUser.email}`);
      createdCount++;
    }

    if (user.role === "Guest") {
      guests.push(user);
    } else {
      managers.set(user.email, user);
    }
  }

  const roomsByManager = await seedDemoHotels(managers);

  for (const demoHotel of demoHotels) {
    const rooms = roomsByManager.get(demoHotel.managerEmail)!;
    bookingCount += await seedDemoBookings(demoHotel.name, rooms, guests);
  }

  console.log(
    `Demo seeding complete (${createdCount} account(s), ${demoHotels.length} hotel(s) checked, ${bookingCount} booking(s) created).`,
  );
}

seedDemoUsers()
  .catch((error: unknown) => {
    console.error("Failed to seed demo users", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
