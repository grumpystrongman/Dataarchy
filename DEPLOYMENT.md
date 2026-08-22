# Dataarchy deployment runbook

Dataarchy v0.4 is designed to run as a first-class Databricks App using Declarative Automation Bundles, a dedicated app service principal, governed app-resource bindings, and a Unity Catalog volume for durable Mission Memory.

## Required existing Databricks resources

Dataarchy intentionally binds to existing enterprise resources instead of creating opinionated production infrastructure behind the operator's back.

You need:

1. A SQL warehouse Dataarchy may `CAN_USE`.
2. A Genie Agent space Dataarchy may `CAN_RUN`.
3. A Model Serving endpoint Dataarchy may `CAN_QUERY`.
4. A Unity Catalog volume Dataarchy may `WRITE_VOLUME` for mission and audit storage.

The volume is supplied as a three-part name such as `main.dataarchy.state`. Databricks resolves the bound resource to `/Volumes/main/dataarchy/state` inside the app.

The account deploying the bundle must be able to grant the app service principal the requested permissions. For the volume, Databricks also grants the required parent `USE CATALOG` and `USE SCHEMA` privileges when the app resource is configured.

## Local validation

```bash
npm install
npm run typecheck
npm run build
```

To run against a workspace outside Databricks Apps, copy `.env.example` to `.env.local` and configure either a PAT or OAuth M2M service-principal credentials. `DATAARCHY_STATE_VOLUME` is optional locally; when omitted Mission Memory falls back to in-process memory.

## Manual Databricks CLI deployment

Authenticate the Databricks CLI with OAuth, then export the bundle variables:

```bash
export DATABRICKS_HOST="https://your-workspace.cloud.databricks.com"
export DATABRICKS_BUNDLE_VAR_warehouse_id="<warehouse-id>"
export DATABRICKS_BUNDLE_VAR_genie_space_id="<genie-space-id>"
export DATABRICKS_BUNDLE_VAR_model_endpoint_name="<serving-endpoint-name>"
export DATABRICKS_BUNDLE_VAR_state_volume_full_name="main.dataarchy.state"

databricks bundle validate --target prod
databricks bundle deploy --target prod
databricks bundle run dataarchy --target prod
```

`bundle deploy` uploads and configures the app but does not restart the running process. `bundle run dataarchy` is therefore required after every deployment.

## GitHub OIDC deployment

The repository contains `.github/workflows/deploy-databricks.yml`. It is `workflow_dispatch` only and can deploy either the `dev` or `prod` GitHub Environment.

Configure these GitHub Environment variables for each target:

| Variable | Purpose |
| --- | --- |
| `DATABRICKS_HOST` | Workspace URL |
| `DATABRICKS_CLIENT_ID` | Databricks deployment service principal client ID |
| `DATAARCHY_WAREHOUSE_ID` | SQL warehouse resource |
| `DATAARCHY_GENIE_SPACE_ID` | Genie Agent space |
| `DATAARCHY_MODEL_ENDPOINT_NAME` | Model Serving endpoint name |
| `DATAARCHY_STATE_VOLUME_FULL_NAME` | UC volume in `catalog.schema.volume` form |

Configure workload identity federation in Databricks so GitHub Actions for this repository/environment can authenticate as the deployment service principal with `github-oidc`. No Databricks client secret is stored in GitHub.

The workflow performs:

```text
checkout
  ↓
GitHub OIDC → Databricks
  ↓
bundle validate
  ↓
bundle deploy
  ↓
bundle run dataarchy
  ↓
OAuth-authenticated /api/system smoke test
```

The deployment fails if any required environment variable is missing or if the restarted application fails its health check.

## Mission Memory

A successful Databricks Apps deployment injects the bound state volume into:

```text
DATAARCHY_STATE_VOLUME=/Volumes/<catalog>/<schema>/<volume>
```

Dataarchy stores each mission independently under:

```text
<volume>/dataarchy/missions/<mission-uuid>.json
```

Each mission contains the original operator intent, source, execution mode, risk metadata, tool path, trace, evidence/artifact snapshot, timestamps, current mission state, and audit events.

BUILD, FIX, and WATCH actions remain `staged` by default. An operator may authorize the staged mission in Mission Memory, but authorization only records the human approval event. It does not secretly mutate production.

When Dataarchy runs inside Databricks Apps, authorization attribution uses Databricks-provided forwarded identity headers such as the operator email or preferred username. Local development falls back to a local operator label.

## Production guardrail

`DATAARCHY_ALLOW_SQL_MUTATIONS=false` remains the default. Do not change that value simply to make demos more exciting. Production mutation should be introduced through explicit, resource-specific promotion adapters with validation and verification semantics.
