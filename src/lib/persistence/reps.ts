import { initializeDataSource } from "../../data-source";
import { Rep } from "../entities/Rep";

export async function getAllReps() {
  const dataSource = await initializeDataSource();
  const repo = dataSource.getRepository(Rep);
  return repo.find();
}

export async function getRepById(id: number) {
  const dataSource = await initializeDataSource();
  const repo = dataSource.getRepository(Rep);
  return repo.findOneBy({ id });
}

export async function createOrUpdateRep(data: Partial<Rep>) {
  const dataSource = await initializeDataSource();
  const repo = dataSource.getRepository(Rep);
  const rep = repo.create(data);
  return repo.save(rep);
}

export async function deleteRep(id: number) {
  const dataSource = await initializeDataSource();
  const repo = dataSource.getRepository(Rep);
  return repo.delete(id);
} 