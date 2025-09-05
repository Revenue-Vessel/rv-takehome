import { NextRequest, NextResponse } from "next/server";
import {
  getAllTerritories,
  getTerritoryById,
  createOrUpdateTerritory,
  deleteTerritory,
  getAllTerritoriesWithMetrics,
} from "../../../lib/persistence/territories";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const territory = await getTerritoryById(Number(id));
      if (!territory) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(territory);
    }
    const region = searchParams.get("region");
    const rep = searchParams.get("rep");
    let territories = await getAllTerritoriesWithMetrics();
    if (region) {
      territories = territories.filter((t: any) => t.region === region);
    }
    if (rep) {
      const repId = String(rep);
      territories = territories.filter((t: any) =>
        Array.isArray(t.assigned_reps) &&
        t.assigned_reps.map(String).includes(repId)
      );
    }
    return NextResponse.json(territories);
  } catch (error) {
    console.error("Error in GET /api/territories:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const territory = await createOrUpdateTerritory(data);
  return NextResponse.json(territory, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteTerritory(Number(id));
  return NextResponse.json({ success: true });
} 