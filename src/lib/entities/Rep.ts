import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Rep {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column("simple-array", { nullable: true })
  assigned_territories?: number[];
} 