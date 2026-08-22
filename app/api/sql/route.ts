import { NextRequest, NextResponse } from "next/server";
import { executeSql, extractStatementRows, getDatabricksStatus } from "@/lib/databricks";

const mutationPattern = /^\s*(insert|update|delete|merge|create|alter|drop|truncate|grant|revoke|optimize|vacuum|restore|copy)\b/i;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const statement = String(body.statement || "").trim();
  if (!statement) return NextResponse.json({ error: "statement is required" }, { status: 400 });

  const status = getDatabricksStatus();
  if (!status.configured || !status.warehouseConfigured) {
    return NextResponse.json({ error: "Databricks host/token/warehouse are not fully configured" }, { status: 503 });
  }

  if (mutationPattern.test(statement) && process.env.DATAARCHY_ALLOW_SQL_MUTATIONS !== "true") {
    return NextResponse.json({
      error: "Mutating SQL is disabled by policy. Set DATAARCHY_ALLOW_SQL_MUTATIONS=true only in an explicitly controlled environment."
    }, { status: 403 });
  }

  try {
    const payload = await executeSql(statement);
    return NextResponse.json({ source: "databricks-sql", statementId: payload?.statement_id, state: payload?.status?.state, rows: extractStatementRows(payload), raw: payload });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "SQL execution failed" }, { status: 500 });
  }
}
