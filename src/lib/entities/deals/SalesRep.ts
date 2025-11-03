import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class SalesRep {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  first_name!: string;

  @Column()
  last_name!: string;

  @Column()
  phone_number!: string;

  @Column()
  email!: string;

  @Column()
  amount_of_deals!: number;

  @Column()
  territory!: string;
} 