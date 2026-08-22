export type DatabricksMode = "ask" | "explore" | "build" | "fix" | "watch";
export type DatabricksAuthMode = "pat" | "oauth-m2m" | "none";
export type DatabricksRuntime = "databricks-app" | "external";

export type DatabricksStatus = {
  configured: boolean;
  host?: string;
  warehouseConfigured: boolean;
  genieConfigured: boolean;
  modelConfigured: boolean;
  authMode: DatabricksAuthMode;
  runtime: DatabricksRuntime;
};

const host = (process.env.DATABRICKS_HOST || "").replace(/\/$/, "");
const token = process.env.DATABRICKS_TOKEN || "";
const clientId = process.env.DATABRICKS_CLIENT_ID || "";
const clientSecret = process.env.DATABRICKS_CLIENT_SECRET || "";
const warehouseId = process.env.DATABRICKS_WAREHOUSE_ID || "";
const genieSpaceId = process.env.DATABRICKS_GENIE_SPACE_ID || "";
const modelEndpoint = process.env.DATABRICKS_MODEL_ENDPOINT || "";
const catalog = process.env.DATABRICKS_CATALOG || "main";
const schema = process.env.DATABRICKS_SCHEMA || "default";

let oauthCache: { accessToken: string; expiresAt: number } | null = null;

function authMode(): DatabricksAuthMode {
  if (token) return "pat";
  if (clientId && clientSecret) return "oauth-m2m";
  return "none";
}

export function getDatabricksStatus(): DatabricksStatus {
  const mode = authMode();
  return {
    configured: Boolean(host && mode !== "none"),
    host: host || undefined,
    warehouseConfigured: Boolean(warehouseId),
    genieConfigured: Boolean(genieSpaceId),
    modelConfigured: Boolean(modelEndpoint),
    authMode: mode,
    runtime: process.env.DATABRICKS_APP_NAME ? "databricks-app" : "external",
  };
}

async function getAccessToken(): Promise<string> {
  if (token) return token;
  if (!host || !clientId || !clientSecret) {
    throw new Error("Databricks authentication is not configured. Use a PAT locally or OAuth M2M credentials / Databricks Apps runtime identity.");
  }

  const now = Date.now();
  if (oauthCache && oauthCache.expiresAt > now + 30_000) return oauthCache.accessToken;

  const response = await fetch(`${host}/oidc/v1/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: "all-apis" }).toString(),
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.access_token) {
    const message = body?.error_description || body?.error || `${response.status} ${response.statusText}`;
    throw new Error(`Databricks OAuth: ${message}`);
  }

  const expiresIn = Number(body.expires_in || 3600);
  oauthCache = {
    accessToken: String(body.access_token),
    expiresAt: now + Math.max(expiresIn - 120, 60) * 1000,
  };
  return oauthCache.accessToken;
}

export async function databricksRaw(path: string, init?: RequestInit): Promise<Response> {
  if (!host) throw new Error("DATABRICKS_HOST is not configured.");
  const accessToken = await getAccessToken();
  return fetch(`${host}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
}

async function dbx<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await databricksRaw(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.message || body?.error_code || `${response.status} ${response.statusText}`;
    throw new Error(`Databricks API: ${message}`);
  }
  return body as T;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const started = await dbx<any>(`/api/2.0/genie/spaces/${genieSpaceId}/start-conversation`, {
    method: "POST",
    body: JSON.stringify({ content, enable_visualization: true }),
  });

  const conversationId = started?.conversation?.id || started?.message?.conversation_id;
  const messageId = started?.message?.id || started?.message?.message_id;
  if (!conversationId || !messageId) return started;

  let latest = started?.message || started;
  const terminal = new Set(["COMPLETED", "FAILED", "CANCELLED", "QUERY_RESULT_EXPIRED"]);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const status = String(latest?.status || "").toUpperCase();
    if (terminal.has(status)) break;
    await sleep(Math.min(900 + attempt * 250, 2200));
    latest = await dbx<any>(
      `/api/2.0/genie/spaces/${genieSpaceId}/conversations/${conversationId}/messages/${messageId}`
    );
  }

  return {
    conversation: started?.conversation,
    message: latest,
    progressive: !terminal.has(String(latest?.status || "").toUpperCase()),
  };
}

export async function invokeModel(system: string, user: string) {
  if (!modelEndpoint) throw new Error("DATABRICKS_MODEL_ENDPOINT is required for model planning.");
  const payload = await dbx<any>(`/serving-endpoints/${encodeURIComponent(modelEndpoint)}/invocations`, {
    method: "POST",
    body: JSON.stringify({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      max_tokens: 1600,
    }),
  });
  return payload?.choices?.[0]?.message?.content || payload?.output_text || payload?.content || JSON.stringify(payload);
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
