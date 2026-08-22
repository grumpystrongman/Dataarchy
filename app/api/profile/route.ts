import { NextResponse } from "next/server";
import { enterpriseProfile, packages, recipes } from "@/lib/dataarchy-os";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    profile: enterpriseProfile,
    recipes,
    packages,
    generatedAt: new Date().toISOString(),
  });
}
