export type DatabricksMode = "ask" | "explore" | "build" | "fix" | "watch";

export type DatabricksStatus = {
  configured: boolean;
  host?: string;
  warehouseConfigured: boolean;
  genieConfigured: boolean;
};

const host = (process.env.DATABRICKS_HOST || "").replace(/\/$/, "");
const token = process.env.DATABRICKS_TOKEN || "";
const warehouseId = process.env.DATABRICKS_WAREHOUSE_ID || "";
const genieSpaceId = process.env.DATABRICKS_GENIE_SPACE_ID || "";
const catalog = process.env.DATABRICKS_CATALOG || "main";
const schema = process.env.DATABRICKS_SCHEMA || "default";

export function getDatabricksStatus(): DatabricksStatus {
  return {
    configured: Boolean(host && token),
    host: host || undefined,
    warehouseConfigured: Boolean(warehouseId),
    genieConfigured: Boolean(genieSpaceId),
  };
}

async function dbx<T>(path: string, init?: RequestInit): Promise<T> {
  if (!host || !token) throw new Error("Databricks credentials are not configured.");
  const response = await fetch(`${host}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.message || body?.error_code || `${response.status} ${response.statusText}`;
    throw new Error(`Databricks API: ${message}`);
  }
  return body as T;
}

export async function listCatalogs() {
  return dbx<{ catalogs?: Array<{ name: string; catalog_type?: string; owner?: string; comment?: string }> }>(
    "/api/2.1/unity-catalog/catalogs?max_results=50"
  );
}

export async function listJobRuns() {
  return dbx<{ runs?: Array<any> }>(
    "/api/2.2/jobs/runs/list?active_only=false&completed_only=false&limit=20"
  );
}

export async function executeSql(statement: string) {
  if (!warehouseId) throw new Error("DATABRICKS_WAREHOUSE_ID is required for SQL execution.");
  return dbx<any>("/api/2.0/sql/statements", {
    method: "POST",
    body: JSON.stringify({
      warehouse_id: warehouseId,
      statement,
      catalog,
      schema,
      wait_timeout: "20s",
      disposition: "INLINE",
      format: "JSON_ARRAY",
    }),
  });
}

export async function askGenie(content: string) {
  if (!genieSpaceId) throw new Error("DATABRICKS_GENIE_SPACE_ID is required for Genie.");
  return dbx<any>(`/api/2.0/genie/spaces/${genieSpaceId}/start-conversation`, {
    method: "POST",
    body: JSON.stringify({ content, enable_visualization: true }),
  });
}

export async function describeTable(fullName: string) {
  const encoded = encodeURIComponent(fullName);
  return dbx<any>(`/api/2.1/unity-catalog/tables/${encoded}?include_delta_metadata=true&include_browse=true`);
}

export function extractStatementRows(payload: any) {
  const columns = payload?.manifest?.schema?.columns?.map((c: any) => c.name) || [];
  const rows = payload?.result?.data_array || [];
  return rows.map((row: unknown[]) => Object.fromEntries(columns.map((name: string, i: number) => [name, row[i]])));
}
