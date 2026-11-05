import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "login_attempts" })
export class LoginAttempt {
  @PrimaryColumn({ name: "key", type: "varchar", length: 64 })
  key!: string;

  @Column({ name: "window_started_at", type: "timestamptz" })
  windowStartedAt!: Date;

  @Column({ type: "integer" })
  attempts!: number;
}
