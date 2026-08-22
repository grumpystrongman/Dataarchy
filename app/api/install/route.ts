import { NextResponse } from "next/server";
import { getDatabricksStatus } from "@/lib/databricks";
import { missionStorageStatus } from "@/lib/missions";
import { themeStorageStatus } from "@/lib/themes/storage";
import { builtInThemes } from "@/lib/themes/builtins";

export const dynamic = "force-dynamic";

const REPOSITORY = "https://github.com/grumpystrongman/Dataarchy";
const BRANCH = "main";

export async function GET() {
  const status = getDatabricksStatus();
  const missionStorage = missionStorageStatus();
  const themeStorage = themeStorageStatus();

  const checks = {
    databricksAppRuntime: status.runtime === "databricks-app",
    managedAppIdentity: status.runtime === "databricks-app" && status.authMode === "oauth-m2m",
    sqlWarehouse: status.warehouseConfigured,
    genieAgent: status.genieConfigured,
    modelServing: status.modelConfigured,
    stateVolume: missionStorage.mode === "unity-volume" && missionStorage.configured,
    themeStorage: themeStorage.mode === "unity-volume" && themeStorage.durable,
  };

  const ready = Object.values(checks).every(Boolean);
  const missing = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  return NextResponse.json({
    product: "Dataarchy",
    version: "0.6.0",
    repository: REPOSITORY,
    branch: BRANCH,
    deploymentModel: "databricks-app-git-native",
    credentialModel: status.runtime === "databricks-app" ? "databricks-managed-app-service-principal" : status.authMode,
    ready,
    checks,
    themeOS: {
      builtInThemes: builtInThemes.length,
      customStorage: themeStorage,
      forge: status.modelConfigured ? "model-serving-with-deterministic-fallback" : "deterministic-fallback",
    },
    missing,
    message: ready
      ? "Dataarchy is wired for Databricks-native operation, including durable Theme OS storage."
      : "Dataarchy is running, but one or more Databricks App resources or managed-identity checks are incomplete.",
    note: "This endpoint intentionally never returns OAuth secrets, access tokens, or personal credentials.",
  });
}
