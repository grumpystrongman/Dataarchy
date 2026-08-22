import { NextRequest, NextResponse } from "next/server";
import { listMissions, missionStorageStatus } from "@/lib/missions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requested = Number(request.nextUrl.searchParams.get("limit") || 50);
  const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.floor(requested), 1), 100) : 50;
  try {
    const result = await listMissions(limit);
    return NextResponse.json({ ...result, storageStatus: missionStorageStatus() });
  } catch (error) {
    return NextResponse.json({
      missions: [],
      storage: "unavailable",
      storageStatus: missionStorageStatus(),
      error: error instanceof Error ? error.message : "Mission history unavailable",
    }, { status: 503 });
  }
}
