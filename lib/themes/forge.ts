import { getDatabricksStatus, invokeModel } from "@/lib/databricks";
import { sanitizeTheme, validateTheme, type ThemeManifest } from "./schema";

const safeStyleMap: Array<[RegExp, string, string[]]> = [
  [/matrix/i, "Code Rain Variant", ["terminal", "green", "code-rain"]],
  [/cyberpunk\s*2077|cyberpunk/i, "Neon Grid Variant", ["neon", "angular", "electric"]],
  [/star\s*trek|lcars/i, "Federation Console Variant", ["segmented", "orange", "console"]],
  [/blade\s*runner/i, "Rain City Neon", ["noir", "rain", "neon"]],
  [/dune/i, "Desert Sovereign", ["sand", "gold", "monumental"]],
  [/alien/i, "Deep Industrial", ["industrial", "space", "dark"]],
  [/minority\s*report/i, "Gesture Glass", ["glass", "white", "holographic"]],
];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 42) || `theme-${Date.now()}`;
}

function has(prompt: string, ...words: string[]) {
  const lower = prompt.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function palette(prompt: string) {
  if (has(prompt, "green", "matrix", "terminal", "hacker")) return { background: "#010402", background2: "#031108", panel: "#04110A", panelStrong: "#06180D", text: "#D0FFD8", muted: "#7AB987", dim: "#467351", accent: "#43FF72", accent2: "#C5FFD0", good: "#78F69A", warn: "#D8E56B", bad: "#FF6875", info: "#61DDA1", line: "#1D6332", glow: "#35DF65" };
  if (has(prompt, "purple", "violet", "indigo", "void")) return { background: "#05040A", background2: "#0C0817", panel: "#110E1F", panelStrong: "#17122A", text: "#F4EFFF", muted: "#A99FC2", dim: "#6E6485", accent: "#9F86FF", accent2: "#DDD4FF", good: "#8ED8AF", warn: "#E5BC6D", bad: "#F06F83", info: "#7FAAFF", line: "#473875", glow: "#7659E8" };
  if (has(prompt, "gold", "amber", "orange", "sand", "copper", "dune")) return { background: "#090705", background2: "#171008", panel: "#1A130C", panelStrong: "#22180E", text: "#FFF2D7", muted: "#C5A982", dim: "#806A50", accent: "#E9A44E", accent2: "#FFE0A0", good: "#A7D783", warn: "#F3B85D", bad: "#E97866", info: "#7FB6C9", line: "#6C4C2C", glow: "#D88B3D" };
  if (has(prompt, "pink", "magenta", "neon", "cyberpunk")) return { background: "#07070A", background2: "#12101A", panel: "#15131D", panelStrong: "#1C1725", text: "#FAF6FF", muted: "#B5A8BE", dim: "#766B80", accent: "#F5E75A", accent2: "#67F4FF", good: "#5CF18D", warn: "#FFB44E", bad: "#FF4773", info: "#64DEFF", line: "#5A5133", glow: "#EA54FF" };
  if (has(prompt, "medical", "clinical", "healthcare", "teal")) return { background: "#03100F", background2: "#071918", panel: "#0B211F", panelStrong: "#0E2A28", text: "#EAFCF8", muted: "#93BEB7", dim: "#5D827C", accent: "#59DFC8", accent2: "#CBFFF3", good: "#88E5A8", warn: "#F2C66E", bad: "#F07272", info: "#73BDF2", line: "#28665F", glow: "#3BCAB4" };
  if (has(prompt, "red", "crimson")) return { background: "#090404", background2: "#170808", panel: "#1B0C0D", panelStrong: "#241012", text: "#FFF1F1", muted: "#C39B9D", dim: "#805E61", accent: "#FF5A64", accent2: "#FFD0D4", good: "#94D79C", warn: "#F1BC61", bad: "#FF5A64", info: "#78AFEE", line: "#71383D", glow: "#E84250" };
  return { background: "#03070C", background2: "#07121A", panel: "#0A151D", panelStrong: "#0D1B25", text: "#EDF9FF", muted: "#91AABA", dim: "#5B7484", accent: "#71D9F5", accent2: "#D2F6FF", good: "#91E0B8", warn: "#EFC173", bad: "#F27773", info: "#7DADFF", line: "#2A5369", glow: "#4EB6DF" };
}

function deterministicTheme(prompt: string): ThemeManifest {
  const mapped = safeStyleMap.find(([pattern]) => pattern.test(prompt));
  const descriptive = prompt.replace(/[^a-zA-Z0-9\s-]/g, " ").trim().split(/\s+/).slice(0, 5).join(" ");
  const name = mapped?.[1] || (descriptive ? `${descriptive.replace(/\b\w/g, (x) => x.toUpperCase())} // Forge` : "Forged Theme");
  const terminal = has(prompt, "terminal", "crt", "hacker", "matrix", "console");
  const segmented = has(prompt, "lcars", "star trek", "segmented", "rounded bands");
  const glass = has(prompt, "glass", "holographic", "minority report", "apple", "clean");
  const angular = has(prompt, "cyberpunk", "angular", "industrial", "sharp");
  const highMotion = has(prompt, "animated", "high motion", "electric", "intense");
  const lowMotion = has(prompt, "low motion", "calm", "quiet", "executive", "subtle");
  const colors = palette(prompt);
  return {
    id: slug(`${name}-${Math.random().toString(36).slice(2, 7)}`),
    name,
    description: `A Dataarchy Theme Forge interpretation of: ${prompt}`.slice(0, 260),
    category: has(prompt, "healthcare", "clinical", "medical") ? "healthcare" : has(prompt, "executive", "board", "leadership") ? "executive" : terminal ? "terminal" : "custom",
    version: "1.0.0",
    author: "Dataarchy Theme Forge",
    builtIn: false,
    tags: [...(mapped?.[2] || []), ...(terminal ? ["terminal"] : []), ...(glass ? ["glass"] : []), ...(angular ? ["angular"] : [])].slice(0, 10),
    density: has(prompt, "dense", "compact") ? "compact" : "comfortable",
    colors,
    chrome: {
      border: segmented ? "segmented" : angular ? "sharp" : glass ? "rounded" : "soft",
      pane: terminal ? "terminal" : glass ? "holographic" : "glass",
      button: segmented ? "segmented" : angular ? "angled" : glass ? "glass" : "flat",
      radius: segmented ? 18 : glass ? 12 : angular || terminal ? 0 : 5,
    },
    effects: {
      motion: highMotion ? "high" : lowMotion ? "subtle" : "medium",
      glow: has(prompt, "neon", "glow", "electric") ? "high" : lowMotion ? "low" : "medium",
      grid: !has(prompt, "no grid", "minimal"),
      scanlines: terminal || has(prompt, "scanline", "retro"),
      noise: has(prompt, "industrial", "retro", "gritty", "noise"),
      vignette: !has(prompt, "bright", "white", "minimal"),
    },
    widgets: {
      aiCore: terminal ? "node" : segmented ? "ring" : glass ? "orb" : "reactor",
      graph: terminal ? "terminal" : has(prompt, "clean", "executive", "minimal") ? "clean" : "hud",
      alert: highMotion ? "flash" : lowMotion ? "steady" : "pulse",
    },
  };
}

function extractJson(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced || raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  return JSON.parse(candidate);
}

export async function forgeTheme(prompt: string) {
  const cleanPrompt = String(prompt || "").trim().slice(0, 1200);
  if (!cleanPrompt) throw new Error("Describe the theme you want Dataarchy to build.");

  const status = getDatabricksStatus();
  if (status.modelConfigured) {
    try {
      const system = `You generate safe Dataarchy UI theme manifests. Return JSON only. Never return CSS, HTML, JavaScript, URLs, fonts, assets, scripts, or executable content. Use only six-digit hex colors and these enums: category cinematic|terminal|executive|healthcare|custom; density compact|comfortable; chrome.border sharp|soft|rounded|segmented; chrome.pane glass|terminal|flat|holographic; chrome.button flat|glass|angled|segmented; effects.motion off|subtle|medium|high; effects.glow low|medium|high; widgets.aiCore orb|reactor|ring|node; widgets.graph clean|hud|terminal; widgets.alert pulse|flash|steady. radius must be 0..28. If the user references a movie, game, show, brand, or franchise, create a generic inspired-by interpretation and use an original theme name. Required fields: id,name,description,category,version,author,builtIn,tags,density,colors{background,background2,panel,panelStrong,text,muted,dim,accent,accent2,good,warn,bad,info,line,glow},chrome{border,pane,button,radius},effects{motion,glow,grid,scanlines,noise,vignette},widgets{aiCore,graph,alert}.`;
      const raw = await invokeModel(system, cleanPrompt);
      const parsed = sanitizeTheme(extractJson(String(raw)) as ThemeManifest);
      parsed.builtIn = false;
      parsed.author = "Dataarchy Theme Forge";
      parsed.id = slug(`${parsed.id}-${Math.random().toString(36).slice(2, 6)}`);
      const validation = validateTheme(parsed);
      if (validation.valid) return { theme: parsed, validation, source: "model-serving" as const };
    } catch {
      // Deterministic forge is intentionally the safe fallback when model output is unavailable or invalid.
    }
  }

  const theme = deterministicTheme(cleanPrompt);
  const validation = validateTheme(theme);
  return { theme, validation, source: "deterministic-forge" as const };
}
