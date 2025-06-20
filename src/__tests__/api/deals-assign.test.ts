import { POST } from "../../app/api/deals/assign/route";
import { initializeDataSource } from "../../data-source";
import { Deal } from "../../lib/entities/deals/Deal";

describe("Deal Assignment API", () => {
  let dealId: number;

  beforeAll(async () => {
    // Seed a deal to be updated
    const dataSource = await initializeDataSource();
    const repo = dataSource.getRepository(Deal);
    const saved = await repo.save({
      deal_id: "test-deal-for-assignment",
      company_name: "Test Co",
      contact_name: "Test Contact",
      transportation_mode: "air",
      stage: "qualified",
      value: 12000,
      probability: 50,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      expected_close_date: new Date().toISOString(),
      sales_rep: "Initial Rep",
      origin_city: "Test Origin",
      destination_city: "Test Destination",
    });
    dealId = saved.id;
  });

  it("should assign a deal to a rep and territory with audit trail", async () => {
    const req = {
      json: async () => ({
        dealIds: [dealId],
        assigned_rep_id: 1,
        territory_id: 1,
        changed_by: "admin",
      }),
    } as any;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
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