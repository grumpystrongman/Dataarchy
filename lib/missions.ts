import { databricksRaw, getDatabricksStatus, type DatabricksMode } from "@/lib/databricks";

export type MissionStatus = "complete" | "staged" | "authorized" | "failed";

export type MissionEvent = {
  at: string;
  type: "created" | "authorized" | "status";
  actor: string;
  detail: string;
};

export type Mission = {
  id: string;
  mode: DatabricksMode;
  query: string;
  title: string;
  summary: string;
  status: MissionStatus;
  execution: string;
  source: string;
  tools: string[];
  trace: string[];
  risk: {
    level?: string;
    productionMutation?: boolean;
    approvalRequired?: boolean;
  };
  result: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  events: MissionEvent[];
};

const volumeRoot = (process.env.DATAARCHY_STATE_VOLUME || "").replace(/\/$/, "");
const missionDirectory = volumeRoot ? `${volumeRoot}/dataarchy/missions` : "";
const memory = new Map<string, Mission>();

function storageMode() {
  return volumeRoot && getDatabricksStatus().configured ? "unity-volume" : "memory";
}

function encodePath(path: string) {
  return path.split("/").map((part, index) => index === 0 ? "" : encodeURIComponent(part)).join("/");
}

function missionPath(id: string) {
  return `${missionDirectory}/${id}.json`;
}

async function ensureMissionDirectory() {
  if (storageMode() !== "unity-volume") return;
  const response = await databricksRaw(`/api/2.0/fs/directories${encodePath(missionDirectory)}`, { method: "PUT" });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`Mission storage directory failed: ${response.status} ${message}`.trim());
  }
}

async function writeMissionFile(mission: Mission) {
  await ensureMissionDirectory();
  const response = await databricksRaw(`/api/2.0/fs/files${encodePath(missionPath(mission.id))}?overwrite=true`, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: JSON.stringify(mission, null, 2),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`Mission write failed: ${response.status} ${message}`.trim());
  }
}

async function readMissionFile(path: string): Promise<Mission | null> {
  const response = await databricksRaw(`/api/2.0/fs/files${encodePath(path)}`, { method: "GET" });
  if (response.status === 404) return null;
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`Mission read failed: ${response.status} ${message}`.trim());
  }
  const raw = await response.text();
  try {
    return JSON.parse(raw) as Mission;
  } catch {
    return null;
  }
}

export async function saveMission(mission: Mission): Promise<Mission> {
  if (storageMode() === "unity-volume") await writeMissionFile(mission);
  else memory.set(mission.id, mission);
  return mission;
}

export async function createMission(mode: DatabricksMode, query: string, result: Record<string, any>): Promise<Mission> {
  const now = new Date().toISOString();
  const staged = result?.risk?.approvalRequired === true || result?.execution === "staged";
  const mission: Mission = {
    id: crypto.randomUUID(),
    mode,
    query,
    title: String(result?.title || `${mode.toUpperCase()} mission`),
    summary: String(result?.summary || (result?.genie ? "Governed Genie analysis" : result?.table ? "Governed asset inspection" : "Dataarchy operator mission")),
    status: staged ? "staged" : "complete",
    execution: String(result?.execution || (staged ? "staged" : "direct")),
    source: String(result?.source || "dataarchy"),
    tools: Array.isArray(result?.tools) ? result.tools.map(String) : [],
    trace: Array.isArray(result?.trace) ? result.trace.map(String) : [],
    risk: result?.risk || {},
    result,
    createdAt: now,
    updatedAt: now,
    events: [{ at: now, type: "created", actor: "dataarchy", detail: staged ? "Mission staged for operator review." : "Mission completed." }],
  };
  return saveMission(mission);
}

export async function getMission(id: string): Promise<Mission | null> {
  if (!/^[a-zA-Z0-9-]{10,80}$/.test(id)) return null;
  if (storageMode() === "unity-volume") return readMissionFile(missionPath(id));
  return memory.get(id) || null;
}

export async function listMissions(limit = 50): Promise<{ missions: Mission[]; storage: string }> {
  if (storageMode() !== "unity-volume") {
    return {
      missions: [...memory.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit),
      storage: "memory",
    };
  }

  await ensureMissionDirectory();
  const response = await databricksRaw(`/api/2.0/fs/directories${encodePath(missionDirectory)}?page_size=${Math.min(Math.max(limit * 2, 50), 1000)}`, { method: "GET" });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`Mission list failed: ${response.status} ${message}`.trim());
  }
  const body = await response.json().catch(() => ({ contents: [] }));
  const files = (body?.contents || [])
    .filter((entry: any) => !entry.is_directory && String(entry.name || "").endsWith(".json"))
    .sort((a: any, b: any) => Number(b.last_modified || 0) - Number(a.last_modified || 0))
    .slice(0, limit);

  const missions = (await Promise.all(files.map((entry: any) => readMissionFile(String(entry.path))))).filter(Boolean) as Mission[];
  missions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { missions, storage: "unity-volume" };
}

export async function authorizeMission(id: string, actor = "operator"): Promise<Mission | null> {
  const mission = await getMission(id);
  if (!mission || mission.status !== "staged") return mission;
  const now = new Date().toISOString();
  const updated: Mission = {
    ...mission,
    status: "authorized",
    updatedAt: now,
    events: [...mission.events, { at: now, type: "authorized", actor, detail: "Operator authorized the staged mission. No production mutation was performed by authorization itself." }],
  };
  return saveMission(updated);
}

export function missionStorageStatus() {
  return {
    mode: storageMode(),
    configured: Boolean(volumeRoot),
    path: volumeRoot || undefined,
  };
}
