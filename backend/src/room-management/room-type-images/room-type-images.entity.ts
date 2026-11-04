import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { RoomType } from "../room-type/room-type.entity.js";


@Entity({ name: "room_type_images" })
@Index("IDX_room_type_images_room_type_sort_order", ["roomTypeId", "sortOrder"])
@Index("UQ_room_type_images_primary_per_room_type", ["roomTypeId"], {
  unique: true,
  where: '"is_primary" = true',
})
export class RoomTypeImage {
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

  @Column({ name: "room_type_id", type: "uuid" })
  roomTypeId!: string;
  
  @ManyToOne(() => RoomType, { onDelete: "CASCADE" })
  @JoinColumn({ name: "room_type_id" })
  roomType!: RoomType;


  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
