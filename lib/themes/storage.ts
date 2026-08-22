import { databricksRaw, getDatabricksStatus } from "@/lib/databricks";
import { builtInThemes } from "./builtins";
import { sanitizeTheme, validateTheme, type ThemeManifest } from "./schema";

const volumeRoot = (process.env.DATAARCHY_STATE_VOLUME || "").replace(/\/$/, "");
const themeDirectory = volumeRoot ? `${volumeRoot}/dataarchy/themes` : "";
const memory = new Map<string, ThemeManifest>();

function storageMode() {
  return volumeRoot && getDatabricksStatus().configured ? "unity-volume" : "memory";
}

function encodePath(path: string) {
  return path.split("/").map((part, index) => index === 0 ? "" : encodeURIComponent(part)).join("/");
}

function themePath(id: string) {
  return `${themeDirectory}/${id}.json`;
}

async function ensureDirectory() {
  if (storageMode() !== "unity-volume") return;
  const response = await databricksRaw(`/api/2.0/fs/directories${encodePath(themeDirectory)}`, { method: "PUT" });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Theme storage directory failed: ${response.status} ${detail}`.trim());
  }
}

async function writeTheme(theme: ThemeManifest) {
  await ensureDirectory();
  const response = await databricksRaw(`/api/2.0/fs/files${encodePath(themePath(theme.id))}?overwrite=true`, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: JSON.stringify(theme, null, 2),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Theme write failed: ${response.status} ${detail}`.trim());
  }
}

async function readTheme(path: string): Promise<ThemeManifest | null> {
  const response = await databricksRaw(`/api/2.0/fs/files${encodePath(path)}`, { method: "GET" });
  if (response.status === 404) return null;
  if (!response.ok) return null;
  try {
    const theme = JSON.parse(await response.text()) as ThemeManifest;
    return validateTheme(theme).valid ? theme : null;
  } catch {
    return null;
  }
}

export async function saveCustomTheme(input: ThemeManifest) {
  const theme = sanitizeTheme({ ...input, builtIn: false, author: input.author || "Dataarchy Theme Forge" });
  const validation = validateTheme(theme);
  if (!validation.valid) throw new Error(validation.errors.join(" "));
  if (builtInThemes.some((item) => item.id === theme.id)) throw new Error("Built-in theme ids cannot be overwritten.");
  if (storageMode() === "unity-volume") await writeTheme(theme);
  else memory.set(theme.id, theme);
  return theme;
}

export async function listCustomThemes(limit = 100): Promise<ThemeManifest[]> {
  if (storageMode() !== "unity-volume") return [...memory.values()].slice(0, limit);
  await ensureDirectory();
  const response = await databricksRaw(`/api/2.0/fs/directories${encodePath(themeDirectory)}?page_size=${Math.min(Math.max(limit, 25), 1000)}`, { method: "GET" });
  if (!response.ok) return [];
  const body = await response.json().catch(() => ({ contents: [] }));
  const files = (body?.contents || [])
    .filter((entry: any) => !entry.is_directory && String(entry.name || "").endsWith(".json"))
    .slice(0, limit);
  const themes = await Promise.all(files.map((entry: any) => readTheme(String(entry.path))));
  return themes.filter(Boolean) as ThemeManifest[];
}

export function themeStorageStatus() {
  return { mode: storageMode(), durable: storageMode() === "unity-volume", path: volumeRoot || undefined };
}
