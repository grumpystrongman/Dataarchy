import { NextRequest, NextResponse } from "next/server";
import { askGenie, describeTable, getDatabricksStatus, listJobRuns, type DatabricksMode } from "@/lib/databricks";
import { demoAction } from "@/lib/demo";

const validModes = new Set<DatabricksMode>(["ask", "explore", "build", "fix", "watch"]);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const mode = String(body.mode || "ask") as DatabricksMode;
  const query = String(body.query || "").trim();
  if (!validModes.has(mode) || !query) {
    return NextResponse.json({ error: "mode and query are required" }, { status: 400 });
  }

  const status = getDatabricksStatus();
  if (!status.configured) return NextResponse.json(demoAction(mode, query));

  try {
    if (mode === "ask" && status.genieConfigured) {
      const genie = await askGenie(query);
      return NextResponse.json({ source: "databricks-genie", mode, query, genie });
    }
    if (mode === "explore" && /^[\w-]+\.[\w-]+\.[\w-]+$/.test(query)) {
      const table = await describeTable(query);
      return NextResponse.json({ source: "databricks-unity-catalog", mode, query, table });
    }
    if (mode === "fix") {
      const runs = await listJobRuns();
      const failed = (runs.runs || []).filter((r: any) => r.state?.result_state === "FAILED").slice(0, 6);
      return NextResponse.json({ source: "databricks-jobs", mode, query, failedRuns: failed });
    }

    // Build and Watch deliberately return an auditable plan in v0.1 rather than silently mutating
    // production resources. The generated plan can then be reviewed and promoted by an operator.
    return NextResponse.json({ ...demoAction(mode, query), source: "databricks-context+planner" });
  } catch (error) {
    return NextResponse.json({
      ...demoAction(mode, query),
      source: "demo-fallback",
      warning: error instanceof Error ? error.message : "Databricks action failed",
    });
  }
}
