import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Hotel } from "../../hotels/hotel.entity.js";


@Entity({ name: "room_type" })
@Index("IDX_room_type_hotel_id_name", ["hotelId", "name"])
export class RoomType {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "name", type: "varchar", length: 255 })
  name!: string;

  // Price per night; Postgres returns decimals as strings, so convert to a number on read.
  @Column({
    name: "price",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: { to: (value: number) => value, from: (value: string | number) => Number(value) },
  })
  price!: number;

  @Column({ name: "hotel_id", type: "uuid" })
  hotelId!: string;
  
  @ManyToOne(() => Hotel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hotel_id" })
  hotel!: Hotel;


  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
