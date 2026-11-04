import { 
  Column, 
  CreateDateColumn, 
  Entity, 
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { Hotel } from "../../hotels/hotel.entity.js";
import { RoomType } from "../room-type/room-type.entity.js";



@Entity({ name: "rooms" })
@Index("IDX_rooms_hotel_id_room_type_id", ["hotelId", "roomTypeId"])
@Index("IDX_rooms_hotel_id_room_number", ["hotelId", "roomNumber"], { unique: true })
export class Room {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "room_number", type: "varchar", length: 100, nullable: true })
  roomNumber!: string | null;

  @Column({ name: "room_type_id", type: "uuid" })
  roomTypeId!: string;
  
  @ManyToOne(() => RoomType, { onDelete: "CASCADE" })
  @JoinColumn({ name: "room_type_id" })
  roomType!: RoomType;

  @Column({ name: "hotel_id", type: "uuid" })
  hotelId!: string;
  
  @ManyToOne(() => Hotel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hotel_id" })
  hotel!: Hotel;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
