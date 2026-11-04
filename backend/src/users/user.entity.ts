import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export type UserRole = "Guest" | "Property Manager";

//Nothing to index here. email and id are indexed by default in the database

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255, select: false }) //so queries dont load the hash unless asked
  password!: string;

  @Column({ type: "varchar", length: 20,  default: "Guest" }) //when a user registers, their role defaults to "Guest". This way doesnt allow random users to become Property Managers
  role!: UserRole;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
