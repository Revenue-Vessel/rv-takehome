import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Territory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  region!: string;

  @Column("simple-array", { nullable: true })
  assigned_reps?: number[];

  @Column("simple-json", { nullable: true })
  performance_metrics?: {
    total_deals: number;
    won_deals: number;
    lost_deals: number;
    revenue: number;
  };
} 