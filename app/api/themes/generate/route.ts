import { NextRequest, NextResponse } from "next/server";
import { forgeTheme } from "@/lib/themes/forge";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const prompt = String(body?.prompt || "").trim();
    if (!prompt) return NextResponse.json({ error: "Describe the theme you want Dataarchy to build." }, { status: 400 });
    const result = await forgeTheme(prompt);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Theme generation failed." }, { status: 500 });
  }
}
