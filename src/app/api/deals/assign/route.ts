import { NextRequest, NextResponse } from "next/server";
import { initializeDataSource } from "../../../../data-source";
import { Deal } from "../../../../lib/entities/deals/Deal";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealIds, assigned_rep_id, territory_id, changed_by } = body;
    if (!Array.isArray(dealIds) || (assigned_rep_id == null && territory_id == null)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const dataSource = await initializeDataSource();
    const dealRepository = dataSource.getRepository(Deal);
    const updatedDeals = [];
    for (const id of dealIds) {
      const deal = await dealRepository.findOneBy({ id });
      if (!deal) continue;
      const oldRep = deal.assigned_rep_id;
      const oldTerritory = deal.territory_id;
      if (assigned_rep_id) deal.assigned_rep_id = assigned_rep_id;
      if (territory_id) deal.territory_id = territory_id;
      // Audit trail
      deal.audit_trail = deal.audit_trail || [];
      if (assigned_rep_id && oldRep !== assigned_rep_id) {
        deal.audit_trail.push({
          changed_by,
          from: `rep:${oldRep}`,
          to: `rep:${assigned_rep_id}`,
          date: new Date().toISOString(),
        });
      }
      if (territory_id && oldTerritory !== territory_id) {
        deal.audit_trail.push({
          changed_by,
          from: `territory:${oldTerritory}`,
          to: `territory:${territory_id}`,
          date: new Date().toISOString(),
        });
      }
      await dealRepository.save(deal);
      updatedDeals.push(deal);
    }
    return NextResponse.json({ updated: updatedDeals.length });
  } catch (error) {
    console.error("Error in POST /api/deals/assign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 