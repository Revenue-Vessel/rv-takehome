import { NextRequest, NextResponse } from "next/server";
import { initializeDataSource } from "../../../../data-source";
import { Deal } from "../../../../lib/entities/deals/Deal";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const dataSource = await initializeDataSource();
  const dealRepository = dataSource.getRepository(Deal);
  const deal = await dealRepository.findOneBy({ id: Number(id) });
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  return NextResponse.json({ audit_trail: deal.audit_trail || [] });
} 