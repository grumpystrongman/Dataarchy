import { NextRequest, NextResponse } from "next/server";
import { saveCustomTheme, themeStorageStatus } from "@/lib/themes/storage";
import { sanitizeTheme, validateTheme, type ThemeManifest } from "@/lib/themes/schema";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const theme = sanitizeTheme(body?.theme as ThemeManifest);
    const validation = validateTheme(theme);
    if (!validation.valid) return NextResponse.json({ error: "Theme validation failed.", validation }, { status: 400 });
    const installed = await saveCustomTheme(theme);
    return NextResponse.json({ theme: installed, validation, storage: themeStorageStatus() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Theme installation failed." }, { status: 500 });
  }
}
