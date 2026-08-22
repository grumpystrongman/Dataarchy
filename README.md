# Dataarchy

**Intent in. Analytics out. Databricks underneath.**

Dataarchy is an opinionated, AI-native analytics operating environment for Databricks. It combines a cinematic operator shell with Genie, Unity Catalog, SQL Warehouses, Model Serving, Databricks Jobs, governed Mission Memory, and Databricks Apps.

**Current baseline: v0.5.0 — Git-native, no-secret Databricks install**

## Fastest way to run Dataarchy in Databricks

You do **not** need to clone this repo locally, paste a Databricks token into code, create a GitHub PAT, or type a password into Dataarchy.

Dataarchy is designed to be deployed directly from this public GitHub repository as a **Databricks App**:

```text
GitHub: grumpystrongman/Dataarchy
           │
           │ Databricks pulls main directly
           ▼
     Databricks App
           │
           ├─ Genie Agent
           ├─ SQL Warehouse
           ├─ Model Serving endpoint
           └─ Unity Catalog state volume
```

Databricks Apps gives the running app its own managed service-principal identity. App resources handle resource IDs, permissions, and credentials so Dataarchy does not need hard-coded Databricks tokens.

### 1. Create the app

In your Databricks workspace:

1. Open **Databricks Apps**.
2. Click **Create app** → **Create a custom app**.
3. In **Configure Git**, use:

   - Provider: **GitHub**
   - Repository: `https://github.com/grumpystrongman/Dataarchy`
   - Reference type: **Branch**
   - Branch: `main`
   - Source code path: leave blank / repository root

This repository is public, so Databricks does **not** require a Git credential or GitHub personal access token to read it.

### 2. Add the four Dataarchy resources

In **App resources**, add these existing Databricks resources using these exact resource keys:

| Resource | Resource key | Permission | Purpose |
| --- | --- | --- | --- |
| SQL Warehouse | `sql-warehouse` | `CAN_USE` | SQL execution and governed analytics |
| Genie Agent | `genie-space` | `CAN_RUN` | Natural-language analytics |
| Model Serving endpoint | `serving-endpoint` | `CAN_QUERY` | Dataarchy planning/reasoning |
| Unity Catalog Volume | `state-volume` | `WRITE_VOLUME` | Durable Mission Memory and audit state |

Use a volume dedicated to Dataarchy, for example:

```text
main.dataarchy.state
```

The Genie Agent should already be configured with the business data, instructions, sample questions, and semantic context you want Dataarchy to reason over.

If you want Dataarchy's direct Unity Catalog Explore tools to inspect additional catalogs/schemas/tables, grant the Dataarchy app service principal the corresponding Unity Catalog permissions as well. Do not solve that by adding tokens to the application.

### 3. Deploy from Git

On the app overview page:

1. Click **Deploy**.
2. Choose **From Git**.
3. Select branch `main`.
4. Leave source path blank.
5. Click **Deploy**.

Databricks pulls the current code from GitHub, installs the Node dependencies, runs the Next.js build, resolves the app resources in `app.yaml`, and starts Dataarchy.

When deployment completes, open the app URL. Dataarchy should report a Databricks-connected runtime rather than DEMO mode.

### 4. Test it

Start with:

```text
ASK      Why did this metric change?
EXPLORE  catalog.schema.table
FIX      Why did the latest pipeline fail?
BUILD    Build a governed data product for ...
WATCH    Watch this metric and explain meaningful anomalies
```

Open **Mission Memory** with `Cmd/Ctrl + Shift + M` to verify that missions are being persisted to the bound Unity Catalog volume.

## What you should not have to configure

For the Databricks Apps deployment path, Dataarchy should not require:

- a GitHub PAT for this public repository
- a Databricks PAT
- a username/password embedded in code
- a manually copied OAuth token
- a hard-coded warehouse ID, Genie ID, model endpoint, or volume path in source code

Those concerns are handled by Databricks Git deployment, the app's managed service principal, and Databricks App resources.

Local development is different: `.env.example` still supports PAT or OAuth M2M credentials for developers running Dataarchy outside Databricks Apps.

## Why Genie does not deploy the application

Genie is part of the intelligence plane, not the application deployment plane. The intended relationship is:

```text
Databricks Apps  → pulls/runs Dataarchy from GitHub
Dataarchy        → orchestrates operator intent
Genie Agent      → answers governed business/data questions
```

That separation keeps deployment, authentication, analytics, and governance in the parts of Databricks designed to own them.

## Five operating workspaces

### 1 // COMMAND
The home cockpit: Operator Intelligence, enterprise signals, governed intelligence topology, and recommended actions.

### 2 // INVESTIGATE
Natural-language ASK / EXPLORE / BUILD / FIX / WATCH workflows with evidence, risk, tool path, and an explicit operator trace.

### 3 // FORGE
Recipe-driven intent-to-artifact work. Dataarchy stages pipelines, quality contracts, deployment configurations, Genie domains, watches, and repairs behind an explicit production gate.

### 4 // OBSERVE
Intelligent watches, job execution health, repair queue, and system telemetry.

### 5 // ARSENAL
Capability packages, enterprise defaults, specialist agents, governed assets, and policy.

## Mission Memory

Every ASK, EXPLORE, BUILD, FIX, and WATCH action can become a durable Mission containing operator intent, result snapshot, tool path, trace, risk metadata, evidence/artifacts, timestamps, state, and audit events.

Mission states include `complete`, `staged`, `authorized`, and `failed`.

Inside Databricks Apps, missions are persisted under the bound `state-volume` resource:

```text
/Volumes/<catalog>/<schema>/<volume>/dataarchy/missions/<mission-uuid>.json
```

Authorization records an operator approval event. It does **not** silently mutate production.

## Databricks-native runtime

The repository contains:

- `app.yaml` — runtime command and resource-to-environment mapping
- `databricks.yml` — Databricks bundle definition, GitHub source, and governed resources
- `.github/workflows/deploy-databricks.yml` — optional GitHub OIDC deployment pipeline
- `DEPLOYMENT.md` — detailed deployment and troubleshooting runbook

`databricks.yml` points the Databricks App directly at:

```text
https://github.com/grumpystrongman/Dataarchy
branch: main
```

The bundle binds:

- `sql-warehouse` → `CAN_USE`
- `genie-space` → `CAN_RUN`
- `serving-endpoint` → `CAN_QUERY`
- `state-volume` → `WRITE_VOLUME`

`app.yaml` resolves those keys into Dataarchy runtime configuration.

## Updating Dataarchy

Because this repository is public, redeployment from Git does not require a GitHub credential:

1. Open the Dataarchy app in Databricks.
2. Click **Deploy**.
3. Choose **From Git** and branch `main`.
4. Deploy the newest commit.

Databricks also supports automatic Git deployments, but its current GitHub auto-deployment beta requires a private repository. For controlled production automation, use the included GitHub OIDC workflow instead.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without Databricks credentials, Dataarchy boots in simulation mode. Without `DATAARCHY_STATE_VOLUME`, Mission Memory uses in-process storage.

## Safety

Dataarchy is designed to choose safe Databricks machinery for the operator while keeping production decisions visible.

BUILD, FIX, and WATCH work is staged by default. `DATAARCHY_ALLOW_SQL_MUTATIONS=false` remains the default.

> Never ask the user to make a Databricks decision the system can safely make for them. Never hide a production decision the user should make.

## Detailed deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for UI deployment, Declarative Automation Bundle deployment, GitHub OIDC CI/CD, permissions, Mission Memory storage, verification, and troubleshooting.
