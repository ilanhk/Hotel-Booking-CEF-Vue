import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1762363200000 implements MigrationInterface {
  name = "InitialSchema1762363200000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "email" varchar(255) NOT NULL,
        "password" varchar(255) NOT NULL,
        "role" varchar(20) NOT NULL DEFAULT 'Guest',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "login_attempts" (
        "key" varchar(64) NOT NULL,
        "window_started_at" timestamptz NOT NULL,
        "attempts" integer NOT NULL,
        CONSTRAINT "PK_login_attempts_key" PRIMARY KEY ("key")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hotels" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "description" varchar(500) NOT NULL,
        "city" varchar(255) NOT NULL,
        "property_manager_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hotels_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_hotels_property_manager" FOREIGN KEY ("property_manager_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hotel_images" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "storage_key" varchar(500) NOT NULL,
        "original_filename" varchar(255),
        "alt_text" varchar(500),
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_primary" boolean NOT NULL DEFAULT false,
        "hotel_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hotel_images_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_hotel_images_hotel" FOREIGN KEY ("hotel_id")
          REFERENCES "hotels"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "room_type" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "price" decimal(10,2) NOT NULL DEFAULT 0,
        "hotel_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_room_type_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_room_type_hotel" FOREIGN KEY ("hotel_id")
          REFERENCES "hotels"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rooms" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "room_number" varchar(100),
        "room_type_id" uuid NOT NULL,
        "hotel_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rooms_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_rooms_room_type" FOREIGN KEY ("room_type_id")
          REFERENCES "room_type"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_rooms_hotel" FOREIGN KEY ("hotel_id")
          REFERENCES "hotels"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "room_type_images" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "storage_key" varchar(500) NOT NULL,
        "original_filename" varchar(255),
        "alt_text" varchar(500),
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_primary" boolean NOT NULL DEFAULT false,
        "room_type_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_room_type_images_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_room_type_images_room_type" FOREIGN KEY ("room_type_id")
          REFERENCES "room_type"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bookings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "guest_id" uuid NOT NULL,
        "room_id" uuid NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "total_cost" decimal(12,2),
        "status" varchar(20) NOT NULL,
        "reason" text,
        "comments" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bookings_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bookings_guest" FOREIGN KEY ("guest_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bookings_room" FOREIGN KEY ("room_id")
          REFERENCES "rooms"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_hotels_city" ON "hotels" ("city")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_hotels_property_manager_id" ON "hotels" ("property_manager_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_hotel_images_hotel_sort_order" ON "hotel_images" ("hotel_id", "sort_order")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_hotel_images_primary_per_hotel" ON "hotel_images" ("hotel_id") WHERE "is_primary" = true`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_room_type_hotel_id_name" ON "room_type" ("hotel_id", "name")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_rooms_hotel_id_room_type_id" ON "rooms" ("hotel_id", "room_type_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rooms_hotel_id_room_number" ON "rooms" ("hotel_id", "room_number")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_room_type_images_room_type_sort_order" ON "room_type_images" ("room_type_id", "sort_order")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_room_type_images_primary_per_room_type" ON "room_type_images" ("room_type_id") WHERE "is_primary" = true`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_bookings_guest_start_date_id" ON "bookings" ("guest_id", "start_date", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_bookings_guest_status_dates" ON "bookings" ("guest_id", "status", "start_date", "end_date")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_bookings_status_created_id" ON "bookings" ("status", "created_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_bookings_created_id" ON "bookings" ("created_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_bookings_guest_created_id" ON "bookings" ("guest_id", "created_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_bookings_room_status_dates" ON "bookings" ("room_id", "status", "start_date", "end_date")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TABLE "room_type_images"`);
    await queryRunner.query(`DROP TABLE "rooms"`);
    await queryRunner.query(`DROP TABLE "room_type"`);
    await queryRunner.query(`DROP TABLE "hotel_images"`);
    await queryRunner.query(`DROP TABLE "hotels"`);
    await queryRunner.query(`DROP TABLE "login_attempts"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
