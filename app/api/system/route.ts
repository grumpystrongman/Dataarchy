import { NextResponse } from "next/server";
import { demoSystem } from "@/lib/demo";
import { getDatabricksStatus, listCatalogs, listJobRuns } from "@/lib/databricks";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = getDatabricksStatus();
  if (!status.configured) return NextResponse.json({ source: "demo", status, ...demoSystem });

  try {
    const [catalogResult, jobResult] = await Promise.allSettled([listCatalogs(), listJobRuns()]);
    const catalogs = catalogResult.status === "fulfilled"
      ? (catalogResult.value.catalogs || []).map((c) => c.name)
      : demoSystem.catalogs;
    const jobs = jobResult.status === "fulfilled"
      ? (jobResult.value.runs || []).slice(0, 8).map((run: any) => ({
          name: run.run_name || run.job_id || "Databricks job",
          state: run.state?.result_state || run.state?.life_cycle_state || "UNKNOWN",
          runtime: run.run_duration ? `${Math.round(run.run_duration / 60000)}m` : "—",
          owner: run.creator_user_name || "workspace",
        }))
      : demoSystem.jobs;

    return NextResponse.json({ source: "databricks", status, ...demoSystem, catalogs, jobs });
  } catch (error) {
    return NextResponse.json({
      source: "demo-fallback",
      status,
      warning: error instanceof Error ? error.message : "Databricks status failed",
      ...demoSystem,
    });
  }
}
