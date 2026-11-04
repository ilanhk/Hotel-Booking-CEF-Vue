import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Hotel } from "../hotels/hotel.entity.js";


@Entity({ name: "hotel_images" })
@Index("IDX_hotel_images_hotel_sort_order", ["hotelId", "sortOrder"])
@Index("UQ_hotel_images_primary_per_hotel", ["hotelId"], {
  unique: true,
  where: '"is_primary" = true',
})
export class HotelImage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "storage_key", type: "varchar", length: 500 })
  storageKey!: string;

  @Column({ name: "original_filename", type: "varchar", length: 255, nullable: true })
  originalFilename!: string | null;

  @Column({ name: "alt_text", type: "varchar", length: 500, nullable: true })
  altText!: string | null;

  @Column({ name: "sort_order", type: "integer", default: 0 })
  sortOrder!: number;

  @Column({ name: "is_primary", type: "boolean", default: false })
  isPrimary!: boolean;

  @Column({ name: "hotel_id", type: "uuid" })
  hotelId!: string;
  
  @ManyToOne(() => Hotel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hotel_id" })
  hotel!: Hotel;


  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
