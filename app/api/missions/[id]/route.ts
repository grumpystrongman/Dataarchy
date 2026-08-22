import { NextRequest, NextResponse } from "next/server";
import { getMission } from "@/lib/missions";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const mission = await getMission(id);
    if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    return NextResponse.json({ mission });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Mission unavailable" }, { status: 503 });
  }
}
