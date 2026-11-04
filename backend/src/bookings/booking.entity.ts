import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { User } from "../users/user.entity.js";
import { Room } from "../room-management/rooms/room.entity.js";

export type BookingStatus = "Pending" | "Approved" | "Rejected";


@Entity({ name: "bookings" })
@Index("idx_bookings_guest_start_date_id", ["guestId", "startDate", "id"])
@Index("idx_bookings_guest_status_dates", ["guestId", "status", "startDate", "endDate"])
@Index("idx_bookings_status_created_id", ["status", "createdAt", "id"])
@Index("idx_bookings_created_id", ["createdAt", "id"])
@Index("idx_bookings_guest_created_id", ["guestId", "createdAt", "id"])
@Index("idx_bookings_room_status_dates", ["roomId", "status", "startDate", "endDate"])

export class Booking {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "guest_id", type: "uuid" })
  guestId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "guest_id" })
  guest!: User;

  @Column({ name: "room_id", type: "uuid" })
  roomId!: string;

  @ManyToOne(() => Room, { onDelete: "CASCADE" })
  @JoinColumn({ name: "room_id" })
  room!: Room;

  @Column({ name: "start_date", type: "date" })
  startDate!: Date;

  @Column({ name: "end_date", type: "date" })
  endDate!: Date;

  @Column({
    name: "total_cost",
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: { to: (value: number | null) => value, from: (value: string | null) => (value === null ? null : Number(value)) },
  })
  totalCost!: number | null;

  @Column({ name: "status", type: "varchar", length: 20 })
  status!: BookingStatus;

  @Column({ type: "text", nullable: true })
  reason!: string | null;

  @Column({ type: "text", nullable: true })
  comments!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
