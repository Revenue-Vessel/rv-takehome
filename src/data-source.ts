import "reflect-metadata";
import { DataSource } from "typeorm";
import { Deal } from "./lib/entities/deals/Deal"; // Adjust the path as necessary
import { Rep } from "./lib/entities/Rep";
import { Territory } from "./lib/entities/Territory";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "./database.sqlite",
  synchronize: true, // Automatically create database schema based on entities
  logging: false,
  entities: [Deal, Rep, Territory],
  migrations: [],
  subscribers: [],
});

// Function to initialize the data source if not already initialized
export async function initializeDataSource() {
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log("Data Source has been initialized!");
    } catch (err) {
      console.error("Error during Data Source initialization:", err);
      throw err;
    }
  }
  return AppDataSource;
}
