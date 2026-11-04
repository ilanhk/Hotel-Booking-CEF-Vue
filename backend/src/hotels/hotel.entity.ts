import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../users/user.entity.js";


@Entity({ name: "hotels" })
@Index("IDX_hotels_city", ["city"])
@Index("IDX_hotels_property_manager_id", ["propertyManagerId"])
export class Hotel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ type: "varchar", length: 500 })
  description!: string;

  @Column({ type: "varchar", length: 255 })
  city!: string;


  @Column({ name: "property_manager_id", type: "uuid" })
  propertyManagerId!: string;
  
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "property_manager_id" })
  propertyManager!: User;


  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
