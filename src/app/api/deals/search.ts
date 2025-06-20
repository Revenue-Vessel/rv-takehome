import { NextRequest, NextResponse } from "next/server";
import { initializeDataSource } from "../../../data-source";
import { Deal } from "../../../lib/entities/deals/Deal";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { territory_id, assigned_rep_id, stage, start_date, end_date } = body;
    const dataSource = await initializeDataSource();
    const dealRepository = dataSource.getRepository(Deal);
    let qb = dealRepository.createQueryBuilder("deal");
    if (territory_id) qb = qb.andWhere("deal.territory_id = :territory_id", { territory_id });
    if (assigned_rep_id) qb = qb.andWhere("deal.assigned_rep_id = :assigned_rep_id", { assigned_rep_id });
    if (stage) qb = qb.andWhere("deal.stage = :stage", { stage });
    if (start_date) qb = qb.andWhere("deal.created_date >= :start_date", { start_date });
    if (end_date) qb = qb.andWhere("deal.created_date <= :end_date", { end_date });
    const results = await qb.getMany();
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in POST /api/deals/search:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 