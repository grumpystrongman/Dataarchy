import { NextRequest, NextResponse } from "next/server";
import { sanitizeTheme, validateTheme, type ThemeManifest } from "@/lib/themes/schema";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  try {
    const theme = sanitizeTheme(body?.theme as ThemeManifest);
    return NextResponse.json({ theme, validation: validateTheme(theme) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Theme validation failed." }, { status: 400 });
  }
}
