import { NextRequest, NextResponse } from "next/server";
import {
  askGenie,
  describeTable,
  getDatabricksStatus,
  invokeModel,
  listJobRuns,
  type DatabricksMode,
} from "@/lib/databricks";
import { demoAction } from "@/lib/demo";

const validModes = new Set<DatabricksMode>(["ask", "explore", "build", "fix", "watch"]);

const operatorPrompt = `You are the planning brain inside Dataarchy, an opinionated analytics operating environment on top of Databricks. Translate user intent into safe, inspectable analytics work. Prefer strong defaults over asking the user to choose Databricks products. Never claim that a production mutation happened unless the caller explicitly says it did. For build/watch/fix work, stage a reviewable plan. Return JSON only with this shape: {"title":"...","summary":"...","confidence":0.0,"evidence":["..."],"artifact":"optional code/config","next":["..."]}. Keep evidence concrete and next actions short.`;

function parseModelResult(raw: string, source: string) {
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try {
      return { source, ...JSON.parse(cleaned.slice(first, last + 1)) };
    } catch {
      // fall through to a readable text response
    }
  }
  return { source, title: "Dataarchy response", summary: cleaned, confidence: 0.75, evidence: [], next: [] };
}

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
      if (status.modelConfigured) {
        const raw = await invokeModel(operatorPrompt, `Mode: FIX\nUser intent: ${query}\nFailed Databricks runs:\n${JSON.stringify(failed, null, 2)}`);
        return NextResponse.json(parseModelResult(raw, "databricks-jobs+model-serving"));
      }
      return NextResponse.json({ source: "databricks-jobs", mode, query, failedRuns: failed });
    }

    if (status.modelConfigured) {
      const raw = await invokeModel(operatorPrompt, `Mode: ${mode.toUpperCase()}\nUser intent: ${query}\nDatabricks is connected. Produce a reviewable, organization-friendly response. Do not perform hidden production mutations.`);
      return NextResponse.json(parseModelResult(raw, "databricks-model-serving"));
    }

    return NextResponse.json({ ...demoAction(mode, query), source: "databricks-context+planner" });
  } catch (error) {
    return NextResponse.json({
      ...demoAction(mode, query),
      source: "demo-fallback",
      warning: error instanceof Error ? error.message : "Databricks action failed",
    });
  }
}
