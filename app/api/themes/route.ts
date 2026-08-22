import { NextResponse } from "next/server";
import { builtInThemes } from "@/lib/themes/builtins";
import { listCustomThemes, themeStorageStatus } from "@/lib/themes/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const custom = await listCustomThemes().catch(() => []);
  return NextResponse.json({
    themes: [...builtInThemes, ...custom],
    builtIn: builtInThemes.length,
    custom: custom.length,
    storage: themeStorageStatus(),
  });
}
