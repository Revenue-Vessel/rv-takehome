import { createOrUpdateTerritory, getAllTerritories, getTerritoryById, deleteTerritory } from '../../lib/persistence/territories';

describe('Territory Persistence', () => {
  let createdId: number;

  it('should create a new territory', async () => {
    const territory = await createOrUpdateTerritory({ name: 'West', region: 'CA', assigned_reps: [1,2], performance_metrics: { total_deals: 10, won_deals: 5, lost_deals: 2, revenue: 10000 } });
    expect(territory.id).toBeDefined();
    createdId = territory.id;
    expect(territory.name).toBe('West');
  });

  it('should get all territories', async () => {
    const territories = await getAllTerritories();
    expect(Array.isArray(territories)).toBe(true);
    expect(territories.length).toBeGreaterThan(0);
  });

  it('should get a territory by id', async () => {
    const territory = await getTerritoryById(createdId);
    expect(territory).toBeDefined();
    expect(territory?.id).toBe(createdId);
  });

  it('should delete a territory', async () => {
    await deleteTerritory(createdId);
    const territory = await getTerritoryById(createdId);
    expect(territory).toBeNull();
  });
}); 