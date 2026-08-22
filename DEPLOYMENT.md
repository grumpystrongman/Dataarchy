# Deploy Dataarchy in Databricks

Dataarchy v0.5 is designed to be installed directly from GitHub as a first-class Databricks App with **no hard-coded tokens, passwords, or GitHub PATs** for the normal deployment path.

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
```

Genie is an intelligence resource used by Dataarchy after the app is running. Genie is **not** the deployment mechanism.

## Recommended: deploy from Git in the Databricks UI

### Prerequisites

You need four existing workspace resources:

1. A SQL Warehouse that Dataarchy may `CAN_USE`.
2. A Genie Agent that Dataarchy may `CAN_RUN`.
3. A Model Serving endpoint that Dataarchy may `CAN_QUERY`.
4. A Unity Catalog Volume that Dataarchy may `WRITE_VOLUME` for Mission Memory.

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

Do not paste a Databricks PAT or OAuth secret into Dataarchy. Databricks Apps automatically injects the app service principal's `DATABRICKS_CLIENT_ID` and `DATABRICKS_CLIENT_SECRET`, plus the workspace host, into the running app.

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

Open Dataarchy after deployment.

Verify:

1. The top-level system indicator reports Databricks connectivity rather than DEMO mode.
2. ASK can reach the bound Genie Agent.
3. EXPLORE can inspect an authorized `catalog.schema.table`.
4. FIX can read Databricks Jobs context.
5. BUILD and WATCH generate staged work rather than silently changing production.
6. `Cmd/Ctrl + Shift + M` opens Mission Memory.
7. Missions persist after an app restart, confirming the state volume is working.

Mission files are stored under:

```text
/Volumes/<catalog>/<schema>/<volume>/dataarchy/missions/<mission-uuid>.json
```

## Updating Dataarchy from GitHub

For this public repository, redeployment does not require a GitHub credential:

1. Open the Dataarchy app.
2. Click **Deploy**.
3. Choose **From Git**.
4. Deploy branch `main` again.

Databricks reads the current commit from GitHub each time it deploys the branch.

### About automatic deployments

Databricks currently supports automatic Git deployment from GitHub as a beta feature, but the GitHub auto-deploy path requires a private repository. Because Dataarchy is currently public, use manual **Deploy from Git** or the GitHub OIDC workflow below for controlled automation.

## Declarative Automation Bundle deployment

`databricks.yml` defines the Dataarchy app with the GitHub repository itself as the deployment source:

```yaml
git_repository:
  provider: gitHub
  url: https://github.com/grumpystrongman/Dataarchy
git_source:
  branch: main
```

It also declares the same four governed resources used by the UI installation path.

Set the resource variables:

```bash
export DATABRICKS_BUNDLE_VAR_warehouse_id="<warehouse-id>"
export DATABRICKS_BUNDLE_VAR_genie_space_id="<genie-space-id>"
export DATABRICKS_BUNDLE_VAR_model_endpoint_name="<serving-endpoint-name>"
export DATABRICKS_BUNDLE_VAR_state_volume_full_name="main.dataarchy.state"
```

Then deploy:

```bash
databricks bundle validate --target prod
databricks bundle deploy --target prod
databricks bundle run dataarchy --target prod
```

This path uses your authenticated Databricks CLI session for deployment administration. The deployed Dataarchy application itself still uses its Databricks-managed app identity rather than a PAT embedded in source code.

## GitHub OIDC production deployment

The repository also includes:

```text
.github/workflows/deploy-databricks.yml
```

This workflow is manually triggered and uses GitHub workload identity federation instead of a stored Databricks client secret.

Configure these GitHub Environment variables:

| Variable | Purpose |
| --- | --- |
| `DATABRICKS_HOST` | Workspace URL |
| `DATABRICKS_CLIENT_ID` | Deployment service-principal application ID |
| `DATAARCHY_WAREHOUSE_ID` | SQL Warehouse ID |
| `DATAARCHY_GENIE_SPACE_ID` | Genie Agent space ID |
| `DATAARCHY_MODEL_ENDPOINT_NAME` | Model Serving endpoint name |
| `DATAARCHY_STATE_VOLUME_FULL_NAME` | UC volume in `catalog.schema.volume` form |

`DATABRICKS_CLIENT_ID` is an identifier, not a secret. GitHub exchanges its OIDC identity with Databricks according to the workload-federation policy. No Databricks client secret needs to be stored in GitHub.

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
authenticated /api/system smoke test
```

## Local development only

Running Dataarchy outside Databricks Apps is the one case where developers may need credentials.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Use either a local PAT or OAuth M2M credentials in `.env.local`. Never commit them.

If `DATAARCHY_STATE_VOLUME` is omitted locally, Mission Memory falls back to in-process storage.

## Troubleshooting

### Databricks cannot pull GitHub

Confirm the repository URL is exactly:

```text
https://github.com/grumpystrongman/Dataarchy
```

and the branch is `main`.

Because the repo is public, a Git credential should not be necessary. In workspaces with Private Link, restricted egress, or network policies, GitHub may need to be allowed by the workspace network configuration.

### Dataarchy starts in DEMO mode

Check the Databricks App runtime and app logs. A normal Databricks Apps runtime automatically provides:

```text
DATABRICKS_HOST
DATABRICKS_APP_NAME
DATABRICKS_CLIENT_ID
DATABRICKS_CLIENT_SECRET
DATABRICKS_APP_PORT
```

Do not manually insert those values into the repository.

### ASK cannot use Genie

Confirm:

- the app has a Genie Agent resource with key `genie-space`
- the resource has `CAN_RUN`
- the Genie Agent itself is configured and working in the workspace

### SQL or EXPLORE cannot see data

`CAN_USE` on a SQL Warehouse gives compute access, not blanket data access. Grant the Dataarchy app service principal the required Unity Catalog permissions for the catalogs, schemas, and tables it should access.

### Mission Memory is not durable

Confirm the app resource key is `state-volume`, the app has `WRITE_VOLUME`, and `app.yaml` resolves it into `DATAARCHY_STATE_VOLUME`.

## Security posture

The production defaults are intentional:

- no GitHub PAT for this public repo
- no Databricks PAT in application code
- app service-principal identity managed by Databricks
- least-privilege app resources
- durable audit state in Unity Catalog
- production SQL mutations disabled by default
- BUILD/FIX/WATCH staged for operator review

`DATAARCHY_ALLOW_SQL_MUTATIONS=false` should remain the default until resource-specific promotion adapters provide explicit validation, authorization, execution, verification, and audit semantics.
