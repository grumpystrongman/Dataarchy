# Deploy Dataarchy in Databricks

Dataarchy v0.6 is designed to be installed directly from GitHub as a first-class Databricks App with **no hard-coded tokens, passwords, or GitHub PATs** for the normal deployment path.

The recommended model is:

```text
Public GitHub repository
        ↓
Databricks Apps pulls branch main
        ↓
Databricks-managed app service principal
        ↓
Bound Databricks resources
  ├─ Genie Agent
  ├─ SQL Warehouse
  ├─ Model Serving endpoint
  └─ Unity Catalog state volume
        ├─ Mission Memory
        └─ Custom Theme OS packs
```

Genie is an intelligence resource used by Dataarchy after the app is running. Genie is **not** the deployment mechanism.

## Recommended: deploy from Git in the Databricks UI

### Prerequisites

You need four existing workspace resources:

1. A SQL Warehouse that Dataarchy may `CAN_USE`.
2. A Genie Agent that Dataarchy may `CAN_RUN`.
3. A Model Serving endpoint that Dataarchy may `CAN_QUERY`.
4. A Unity Catalog Volume that Dataarchy may `WRITE_VOLUME` for Mission Memory and custom themes.

Suggested volume:

```text
main.dataarchy.state
```

The Genie Agent should already contain the business context, data sources, instructions, sample questions, and semantic definitions you want operators to use.

### Step 1 — Create a custom Databricks App

In the Databricks workspace:

1. Open the app switcher.
2. Select **Databricks Apps**.
3. Click **Create app**.
4. Choose **Create a custom app**.
5. In **Configure Git**, enter:

```text
Provider: GitHub
Repository: https://github.com/grumpystrongman/Dataarchy
Reference type: Branch
Branch: main
Source code path: <blank>
```

Dataarchy's GitHub repository is public. Databricks therefore does **not** require a Git credential or GitHub personal access token to pull it.

### Step 2 — Bind the required app resources

Add the following resources in **App resources**. The resource keys must match exactly because `app.yaml` resolves these names at runtime.

| Type | Resource key | Permission |
| --- | --- | --- |
| SQL Warehouse | `sql-warehouse` | `CAN_USE` |
| Genie Agent | `genie-space` | `CAN_RUN` |
| Model Serving endpoint | `serving-endpoint` | `CAN_QUERY` |
| Unity Catalog Volume | `state-volume` | `WRITE_VOLUME` |

Databricks provisions a dedicated service principal for the app and grants the configured app-resource permissions to that identity.

Do not paste a Databricks PAT or OAuth secret into Dataarchy. Databricks Apps automatically injects the app service principal's OAuth credentials plus the workspace host into the running app.

### Step 3 — Grant governed data access where required

The four app resources provide access to the bound services, but they do not automatically grant Dataarchy broad table access.

For direct Dataarchy Unity Catalog exploration or SQL queries, grant the Dataarchy app service principal only the catalog/schema/table permissions required for your use case.

Examples may include:

```text
USE CATALOG
USE SCHEMA
SELECT
```

Keep this least-privilege. The Genie Agent should also be configured and governed according to your organization's Databricks model.

### Step 4 — Deploy

On the Dataarchy app overview page:

1. Click **Deploy**.
2. Select **From Git**.
3. Set the Git reference to branch `main`.
4. Leave source code path blank.
5. Click **Deploy**.

Databricks pulls the repository root, detects `package.json`, installs Node dependencies, runs the Next.js `build` script, then starts the command defined in `app.yaml`.

### Step 5 — Verify the app

Open Dataarchy after deployment, then visit:

```text
https://<your-dataarchy-app>/api/install
```

A correctly wired Databricks deployment returns:

```json
{
  "ready": true,
  "deploymentModel": "databricks-app-git-native",
  "themeOS": {
    "builtInThemes": 11
  }
}
```

The readiness endpoint checks configuration state only. It never returns OAuth secrets, access tokens, or personal credentials.

Then verify the operator workflow:

1. The top-level system indicator reports Databricks connectivity rather than DEMO mode.
2. ASK can reach the bound Genie Agent.
3. EXPLORE can inspect an authorized `catalog.schema.table`.
4. FIX can read Databricks Jobs context.
5. BUILD and WATCH generate staged work rather than silently changing production.
6. `Cmd/Ctrl + Shift + M` opens Mission Memory.
7. Missions persist after an app restart.
8. `Cmd/Ctrl + Shift + T` opens Theme OS.
9. Apply several built-in themes and verify the shell changes immediately.
10. Use Theme Forge to generate a theme, install it, restart the app, and confirm the custom theme remains in the catalog.

Mission files are stored under:

```text
/Volumes/<catalog>/<schema>/<volume>/dataarchy/missions/<mission-uuid>.json
```

Custom themes are stored under:

```text
/Volumes/<catalog>/<schema>/<volume>/dataarchy/themes/<theme-id>.json
```

Theme Forge uses the configured Model Serving endpoint when available. If model generation fails or is unavailable, Dataarchy deliberately falls back to a deterministic theme generator so the feature remains usable.

## Updating Dataarchy from GitHub

For this public repository, redeployment does not require a GitHub credential:

1. Open the Dataarchy app.
2. Click **Deploy**.
3. Choose **From Git**.
4. Deploy branch `main` again.

Databricks reads the current commit from GitHub each time it deploys the branch.

## Declarative Automation Bundle deployment

`databricks.yml` defines the Dataarchy app with the GitHub repository itself as the deployment source and the same four governed resources used by the UI installation path.

Set the resource variables using the current Declarative Automation Bundles environment-variable prefix:

```bash
export BUNDLE_VAR_warehouse_id="<warehouse-id>"
export BUNDLE_VAR_genie_space_id="<genie-space-id>"
export BUNDLE_VAR_model_endpoint_name="<serving-endpoint-name>"
export BUNDLE_VAR_state_volume_full_name="main.dataarchy.state"
```

Then deploy:

```bash
databricks bundle validate --target prod
databricks bundle deploy --target prod
databricks bundle run dataarchy --target prod
```

This path uses your authenticated Databricks CLI session for deployment administration. The deployed Dataarchy application itself still uses its Databricks-managed app identity rather than a PAT embedded in source code.

## GitHub OIDC production deployment

The repository also includes `.github/workflows/deploy-databricks.yml`. It is manually triggered and uses GitHub workload identity federation instead of a stored Databricks client secret.

Configure these GitHub Environment variables:

| Variable | Purpose |
| --- | --- |
| `DATABRICKS_HOST` | Workspace URL |
| `DATABRICKS_CLIENT_ID` | Deployment service-principal application ID |
| `DATAARCHY_WAREHOUSE_ID` | SQL Warehouse ID |
| `DATAARCHY_GENIE_SPACE_ID` | Genie Agent space ID |
| `DATAARCHY_MODEL_ENDPOINT_NAME` | Model Serving endpoint name |
| `DATAARCHY_STATE_VOLUME_FULL_NAME` | UC volume in `catalog.schema.volume` form |

The workflow maps those variables to `BUNDLE_VAR_*`, validates the bundle, deploys, starts/restarts Dataarchy, waits for the app to become healthy, then verifies `/api/system` and `/api/install`.

## Local development only

Running Dataarchy outside Databricks Apps is the one case where developers may need credentials.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Use either a local PAT or OAuth M2M credentials in `.env.local`. Never commit them.

If `DATAARCHY_STATE_VOLUME` is omitted locally, Mission Memory and custom Theme OS packs fall back to in-process storage.

## Troubleshooting

### Dataarchy starts in DEMO mode

Check the Databricks App runtime and app logs. Do not manually insert Databricks runtime credentials into the repository.

### `/api/install` returns `ready: false`

Review the `missing` array. Expected checks include:

```text
databricksAppRuntime
managedAppIdentity
sqlWarehouse
genieAgent
modelServing
stateVolume
themeStorage
```

### ASK cannot use Genie

Confirm the app has the `genie-space` resource with `CAN_RUN` and the Genie Agent itself is configured and working.

### SQL or EXPLORE cannot see data

`CAN_USE` on a SQL Warehouse gives compute access, not blanket data access. Grant the app service principal the Unity Catalog permissions it actually needs.

### Mission Memory is not durable

Confirm `state-volume` exists, has `WRITE_VOLUME`, and resolves into `DATAARCHY_STATE_VOLUME`.

### Custom themes disappear after restart

The same `state-volume` resource backs durable Theme OS storage. Verify `/api/install` reports `themeStorage: true` and that the app can write under `/Volumes/.../dataarchy/themes`.

### Theme Forge does not use AI

Theme Forge requires the `serving-endpoint` resource to use Databricks Model Serving. If it is unavailable, Theme Forge intentionally uses the deterministic fallback and remains functional.

## Security posture

The production defaults are intentional:

- no GitHub PAT for this public repo;
- no Databricks PAT in application code;
- app service-principal identity managed by Databricks;
- least-privilege app resources;
- durable audit and custom-theme state in Unity Catalog;
- generated themes are manifest tokens only—no arbitrary CSS, scripts, URLs, fonts, or assets;
- production SQL mutations disabled by default;
- BUILD/FIX/WATCH staged for operator review.

`DATAARCHY_ALLOW_SQL_MUTATIONS=false` should remain the default until resource-specific promotion adapters provide explicit validation, authorization, execution, verification, and audit semantics.
