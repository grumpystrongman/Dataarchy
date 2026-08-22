export type ThemeCategory = "cinematic" | "terminal" | "executive" | "healthcare" | "custom";
export type ThemeMotion = "off" | "subtle" | "medium" | "high";
export type ThemeDensity = "compact" | "comfortable";
export type ThemeBorder = "sharp" | "soft" | "rounded" | "segmented";
export type ThemePane = "glass" | "terminal" | "flat" | "holographic";
export type ThemeButton = "flat" | "glass" | "angled" | "segmented";
export type ThemeCore = "orb" | "reactor" | "ring" | "node";
export type ThemeGraph = "clean" | "hud" | "terminal";

export type ThemeColors = {
  background: string;
  background2: string;
  panel: string;
  panelStrong: string;
  text: string;
  muted: string;
  dim: string;
  accent: string;
  accent2: string;
  good: string;
  warn: string;
  bad: string;
  info: string;
  line: string;
  glow: string;
};

export type ThemeManifest = {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  version: string;
  author: string;
  builtIn?: boolean;
  tags: string[];
  density: ThemeDensity;
  colors: ThemeColors;
  chrome: {
    border: ThemeBorder;
    pane: ThemePane;
    button: ThemeButton;
    radius: number;
  };
  effects: {
    motion: ThemeMotion;
    glow: "low" | "medium" | "high";
    grid: boolean;
    scanlines: boolean;
    noise: boolean;
    vignette: boolean;
  };
  widgets: {
    aiCore: ThemeCore;
    graph: ThemeGraph;
    alert: "pulse" | "flash" | "steady";
  };
};

export type ThemeValidation = {
  valid: boolean;
  score: number;
  warnings: string[];
  errors: string[];
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const ID = /^[a-z0-9][a-z0-9-]{1,48}$/;
const allowed = {
  category: new Set<ThemeCategory>(["cinematic", "terminal", "executive", "healthcare", "custom"]),
  density: new Set<ThemeDensity>(["compact", "comfortable"]),
  border: new Set<ThemeBorder>(["sharp", "soft", "rounded", "segmented"]),
  pane: new Set<ThemePane>(["glass", "terminal", "flat", "holographic"]),
  button: new Set<ThemeButton>(["flat", "glass", "angled", "segmented"]),
  motion: new Set<ThemeMotion>(["off", "subtle", "medium", "high"]),
  glow: new Set(["low", "medium", "high"]),
  core: new Set<ThemeCore>(["orb", "reactor", "ring", "node"]),
  graph: new Set<ThemeGraph>(["clean", "hud", "terminal"]),
  alert: new Set(["pulse", "flash", "steady"]),
};

function luminance(hex: string) {
  const values = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((v) => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function validateTheme(value: unknown): ThemeValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const t = value as ThemeManifest | undefined;
  if (!t || typeof t !== "object") return { valid: false, score: 0, errors: ["Theme must be an object."], warnings };
  if (!ID.test(String(t.id || ""))) errors.push("Theme id must be a lowercase slug between 2 and 49 characters.");
  if (!String(t.name || "").trim() || String(t.name).length > 64) errors.push("Theme name is required and must be at most 64 characters.");
  if (!String(t.description || "").trim() || String(t.description).length > 260) errors.push("Theme description is required and must be at most 260 characters.");
  if (!allowed.category.has(t.category)) errors.push("Unknown theme category.");
  if (!allowed.density.has(t.density)) errors.push("Unknown density.");
  if (!allowed.border.has(t.chrome?.border)) errors.push("Unknown border style.");
  if (!allowed.pane.has(t.chrome?.pane)) errors.push("Unknown pane style.");
  if (!allowed.button.has(t.chrome?.button)) errors.push("Unknown button style.");
  if (!Number.isFinite(t.chrome?.radius) || t.chrome.radius < 0 || t.chrome.radius > 28) errors.push("Radius must be between 0 and 28 pixels.");
  if (!allowed.motion.has(t.effects?.motion)) errors.push("Unknown motion level.");
  if (!allowed.glow.has(t.effects?.glow)) errors.push("Unknown glow level.");
  if (!allowed.core.has(t.widgets?.aiCore)) errors.push("Unknown AI core style.");
  if (!allowed.graph.has(t.widgets?.graph)) errors.push("Unknown graph style.");
  if (!allowed.alert.has(t.widgets?.alert)) errors.push("Unknown alert style.");

  const colorEntries = Object.entries(t.colors || {});
  const requiredColorKeys: Array<keyof ThemeColors> = ["background", "background2", "panel", "panelStrong", "text", "muted", "dim", "accent", "accent2", "good", "warn", "bad", "info", "line", "glow"];
  for (const key of requiredColorKeys) {
    const color = t.colors?.[key];
    if (!color || !HEX.test(color)) errors.push(`Color ${key} must be a six-digit hex value.`);
  }

  if (!errors.length) {
    const textContrast = contrast(t.colors.text, t.colors.background);
    const mutedContrast = contrast(t.colors.muted, t.colors.background);
    const accentContrast = contrast(t.colors.accent, t.colors.background);
    if (textContrast < 4.5) warnings.push(`Primary text contrast is ${textContrast.toFixed(1)}:1; 4.5:1 or higher is recommended.`);
    if (mutedContrast < 3) warnings.push(`Muted text contrast is ${mutedContrast.toFixed(1)}:1; 3:1 or higher is recommended.`);
    if (accentContrast < 3) warnings.push(`Accent contrast is ${accentContrast.toFixed(1)}:1; active controls may be hard to distinguish.`);
  }

  if (!Array.isArray(t.tags) || t.tags.length > 12) errors.push("Theme tags must be an array of at most 12 values.");
  if (Array.isArray(t.tags) && t.tags.some((tag) => typeof tag !== "string" || tag.length > 30)) errors.push("Theme tags must be short strings.");

  const score = Math.max(0, 100 - errors.length * 30 - warnings.length * 8);
  return { valid: errors.length === 0, score, errors, warnings };
}

export function sanitizeTheme(theme: ThemeManifest): ThemeManifest {
  return {
    ...theme,
    id: theme.id.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 49),
    name: theme.name.trim().slice(0, 64),
    description: theme.description.trim().slice(0, 260),
    version: String(theme.version || "1.0.0").slice(0, 20),
    author: String(theme.author || "Dataarchy Theme Forge").slice(0, 64),
    builtIn: Boolean(theme.builtIn),
    tags: (theme.tags || []).map(String).map((x) => x.slice(0, 30)).slice(0, 12),
    chrome: { ...theme.chrome, radius: Math.max(0, Math.min(28, Number(theme.chrome?.radius) || 0)) },
  };
}

export function hexToRgb(hex: string) {
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
}
