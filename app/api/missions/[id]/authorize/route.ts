import { NextRequest, NextResponse } from "next/server";
import { authorizeMission } from "@/lib/missions";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const actor = String(body.actor || "operator").slice(0, 120);
  try {
    const mission = await authorizeMission(id, actor);
    if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    if (mission.status !== "authorized") {
      return NextResponse.json({ error: `Mission cannot be authorized from status ${mission.status}`, mission }, { status: 409 });
    }
    return NextResponse.json({ mission });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Mission authorization failed" }, { status: 503 });
  }
}
