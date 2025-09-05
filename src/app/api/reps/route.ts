import { NextRequest, NextResponse } from "next/server";
import {
  getAllReps,
  getRepById,
  createOrUpdateRep,
  deleteRep,
} from "../../../lib/persistence/reps";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const rep = await getRepById(Number(id));
    if (!rep) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rep);
  }
  const reps = await getAllReps();
  return NextResponse.json(reps);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const rep = await createOrUpdateRep(data);
  return NextResponse.json(rep, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteRep(Number(id));
  return NextResponse.json({ success: true });
} 