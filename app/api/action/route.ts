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
import { intentStages } from "@/lib/dataarchy-os";

const validModes = new Set<DatabricksMode>(["ask", "explore", "build", "fix", "watch"]);

const operatorPrompt = `You are the planning brain inside Dataarchy, an opinionated analytics operating environment on top of Databricks. Translate user intent into safe, inspectable analytics work. Prefer strong defaults over asking the user to choose Databricks products. Never claim that a production mutation happened unless the caller explicitly says it did. For build/watch/fix work, stage a reviewable plan. Return JSON only with this shape: {"title":"...","summary":"...","confidence":0.0,"evidence":["..."],"artifact":"optional code/config","next":["..."]}. Keep evidence concrete and next actions short.`;

function executionMeta(mode: DatabricksMode, tools: string[]) {
  const mutating = mode === "build" || mode === "fix" || mode === "watch";
  return {
    mode,
    tools,
    trace: intentStages[mode],
    risk: {
      level: mutating ? "review" : "read-only",
      productionMutation: false,
      approvalRequired: mutating,
    },
    execution: mutating ? "staged" : "direct",
  };
}

function parseModelResult(raw: string, source: string, mode: DatabricksMode, tools: string[]) {
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  const meta = executionMeta(mode, tools);
  if (first >= 0 && last > first) {
    try {
      return { source, ...meta, ...JSON.parse(cleaned.slice(first, last + 1)) };
    } catch {
      // Fall through to a readable response rather than failing the operator session.
    }
  }
  return {
    source,
    ...meta,
    title: "Dataarchy response",
    summary: cleaned,
    confidence: 0.75,
    evidence: [],
    next: [],
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const mode = String(body.mode || "ask") as DatabricksMode;
  const query = String(body.query || "").trim();
  if (!validModes.has(mode) || !query) {
    return NextResponse.json({ error: "mode and query are required" }, { status: 400 });
  }

  const status = getDatabricksStatus();
  if (!status.configured) {
    return NextResponse.json({
      ...demoAction(mode, query),
      ...executionMeta(mode, ["demo intelligence"]),
    });
  }

  try {
    if (mode === "ask" && status.genieConfigured) {
      const genie = await askGenie(query);
      return NextResponse.json({
        source: "databricks-genie",
        query,
        genie,
        ...executionMeta(mode, ["Genie", "Unity Catalog governance"]),
      });
    }

    if (mode === "explore" && /^[\w-]+\.[\w-]+\.[\w-]+$/.test(query)) {
      const table = await describeTable(query);
      return NextResponse.json({
        source: "databricks-unity-catalog",
        query,
        table,
        ...executionMeta(mode, ["Unity Catalog", "lineage context"]),
      });
    }

    if (mode === "fix") {
      const runs = await listJobRuns();
      const failed = (runs.runs || []).filter((r: any) => r.state?.result_state === "FAILED").slice(0, 6);
      if (status.modelConfigured) {
        const raw = await invokeModel(
          operatorPrompt,
          `Mode: FIX\nUser intent: ${query}\nFailed Databricks runs:\n${JSON.stringify(failed, null, 2)}`
        );
        return NextResponse.json(
          parseModelResult(raw, "databricks-jobs+model-serving", mode, ["Jobs API 2.2", "Model Serving", "Guardian"])
        );
      }
      return NextResponse.json({
        source: "databricks-jobs",
        query,
        failedRuns: failed,
        ...executionMeta(mode, ["Jobs API 2.2", "Guardian"]),
      });
    }

    if (status.modelConfigured) {
      const raw = await invokeModel(
        operatorPrompt,
        `Mode: ${mode.toUpperCase()}\nUser intent: ${query}\nDatabricks is connected. Produce a reviewable, organization-friendly response. Do not perform hidden production mutations.`
      );
      return NextResponse.json(
        parseModelResult(raw, "databricks-model-serving", mode, ["Model Serving", "Unity Catalog context", "Guardian"])
      );
    }

    return NextResponse.json({
      ...demoAction(mode, query),
      source: "databricks-context+planner",
      ...executionMeta(mode, ["Databricks context", "Dataarchy planner"]),
    });
  } catch (error) {
    return NextResponse.json({
      ...demoAction(mode, query),
      source: "demo-fallback",
      warning: error instanceof Error ? error.message : "Databricks action failed",
      ...executionMeta(mode, ["fallback intelligence"]),
    });
  }
}
