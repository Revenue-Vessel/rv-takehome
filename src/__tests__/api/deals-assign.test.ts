import { initializeDataSource } from '../../data-source';
import { Deal } from '../../lib/entities/deals/Deal';

describe('Deal Assignment API', () => {
  let dealId: number;

  beforeAll(async () => {
    const dataSource = await initializeDataSource();
    const repo = dataSource.getRepository(Deal);
    const deal = repo.create({
      deal_id: 'D-100',
      company_name: 'TestCo',
      contact_name: 'Bob',
      transportation_mode: 'trucking',
      stage: 'prospect',
      value: 1000,
      probability: 50,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      expected_close_date: new Date().toISOString(),
      sales_rep: 'Alice',
      origin_city: 'LA',
      destination_city: 'SF',
    });
    const saved = await repo.save(deal);
    dealId = saved.id;
  });

  it('should assign a deal to a rep and territory with audit trail', async () => {
    const res = await fetch('http://localhost:3000/api/deals/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealIds: [dealId], assigned_rep_id: 1, territory_id: 1, changed_by: 'admin' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.updated).toBe(1);

    // Fetch deal and check audit trail
    const dataSource = await initializeDataSource();
    const repo = dataSource.getRepository(Deal);
    const deal = await repo.findOneBy({ id: dealId });
    expect(deal?.assigned_rep_id).toBe(1);
    expect(deal?.territory_id).toBe(1);
    expect(deal?.audit_trail?.length).toBeGreaterThan(0);
  });
}); 