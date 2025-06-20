import { NextRequest, NextResponse } from "next/server";
import { initializeDataSource } from "../../../data-source";
import { Rep } from "../../../lib/entities/Rep";
import { Territory } from "../../../lib/entities/Territory";
import { Deal } from "../../../lib/entities/deals/Deal";

export async function POST() {
  const dataSource = await initializeDataSource();
  const repRepo = dataSource.getRepository(Rep);
  const territoryRepo = dataSource.getRepository(Territory);
  const dealRepo = dataSource.getRepository(Deal);

  // Seed reps
  const reps = await repRepo.save([
    { name: "Alice" },
    { name: "Bob" },
    { name: "Charlie" },
  ]);

  // Seed territories
  const territories = await territoryRepo.save([
    { name: "West", region: "CA", assigned_reps: [reps[0].id, reps[1].id], performance_metrics: { total_deals: 0, won_deals: 0, lost_deals: 0, revenue: 0 } },
    { name: "East", region: "NY", assigned_reps: [reps[2].id], performance_metrics: { total_deals: 0, won_deals: 0, lost_deals: 0, revenue: 0 } },
  ]);

  // Seed deals
  await dealRepo.save([
    {
      deal_id: "D-001",
      company_name: "Acme Corp",
      contact_name: "John Doe",
      transportation_mode: "trucking",
      stage: "prospect",
      value: 10000,
      probability: 60,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      expected_close_date: new Date().toISOString(),
      sales_rep: reps[0].name,
      origin_city: "Los Angeles",
      destination_city: "San Francisco",
      assigned_rep_id: reps[0].id,
      territory_id: territories[0].id,
    },
    {
      deal_id: "D-002",
      company_name: "Beta Inc",
      contact_name: "Jane Smith",
      transportation_mode: "rail",
      stage: "qualified",
      value: 20000,
      probability: 40,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      expected_close_date: new Date().toISOString(),
      sales_rep: reps[1].name,
      origin_city: "San Diego",
      destination_city: "Sacramento",
      assigned_rep_id: reps[1].id,
      territory_id: territories[0].id,
    },
    {
      deal_id: "D-003",
      company_name: "Gamma LLC",
      contact_name: "Alice Johnson",
      transportation_mode: "ocean",
      stage: "closed_won",
      value: 50000,
      probability: 100,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      expected_close_date: new Date().toISOString(),
      sales_rep: reps[2].name,
      origin_city: "New York",
      destination_city: "Boston",
      assigned_rep_id: reps[2].id,
      territory_id: territories[1].id,
    },
  ]);

  return NextResponse.json({ success: true });
}
