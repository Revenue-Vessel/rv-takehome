import { AppDataSource } from "../../data-source";
import { Territory } from "../entities/Territory";
import { Deal } from "../entities/deals/Deal";

export async function getAllTerritories() {
  const repo = (await AppDataSource).getRepository(Territory);
  return repo.find();
}

export async function getAllTerritoriesWithMetrics() {
  const dataSource = await AppDataSource;
  const territoryRepo = dataSource.getRepository(Territory);
  const dealRepo = dataSource.getRepository(Deal);
  const territories = await territoryRepo.find();
  const deals = await dealRepo.find();

  // Aggregate deals by territory
  const metricsByTerritory: Record<number, { total_deals: number; won_deals: number; lost_deals: number; revenue: number }> = {};
  for (const t of territories) {
    metricsByTerritory[t.id] = { total_deals: 0, won_deals: 0, lost_deals: 0, revenue: 0 };
  }
  for (const deal of deals) {
    if (deal.territory_id && metricsByTerritory[deal.territory_id]) {
      metricsByTerritory[deal.territory_id].total_deals++;
      if (deal.stage === "closed_won") {
        metricsByTerritory[deal.territory_id].won_deals++;
        metricsByTerritory[deal.territory_id].revenue += Number(deal.value);
      } else if (deal.stage === "closed_lost") {
        metricsByTerritory[deal.territory_id].lost_deals++;
      }
    }
  }
  return territories.map(t => ({ ...t, performance_metrics: metricsByTerritory[t.id] }));
}

export async function getTerritoryById(id: number) {
  const repo = (await AppDataSource).getRepository(Territory);
  return repo.findOneBy({ id });
}

export async function createOrUpdateTerritory(data: Partial<Territory>) {
  const repo = (await AppDataSource).getRepository(Territory);
  const territory = repo.create(data);
  return repo.save(territory);
}

export async function deleteTerritory(id: number) {
  const repo = (await AppDataSource).getRepository(Territory);
  return repo.delete(id);
} 