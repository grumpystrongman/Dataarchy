# Dataarchy

**Intent in. Analytics out. Databricks underneath.**

Dataarchy is an opinionated, AI-native analytics operating environment inspired by Omarchy's approach to Linux: strong defaults, keyboard-first workflows, composable power, a coherent visual system, and a clean escape hatch to the machinery underneath.

The goal is not to make Databricks look simpler. The goal is to make an analytics organization feel like it has a powerful AI operating system.

## What it feels like

Dataarchy is designed as a cinematic command environment rather than another enterprise dashboard. The visual system uses dark glass, fine HUD geometry, restrained emissive color, spatially tiled instruments, active-system motion, and an AI core whose visual state reflects what the operator is actually asking the system to do.

The interface is intentionally theatrical in small doses: a short boot sequence, workspace acquisition motion, live topology, radar-style observation, and tool-path activity. Every effect has a job: communicate state, focus, risk, activity, or hierarchy.

## Five operating workspaces

### 1 // COMMAND

The home cockpit. It combines the Operator Intelligence core, enterprise signals, governed intelligence topology, and recommended actions. This is where an operator sees what changed and issues intent.

### 2 // INVESTIGATE

Natural-language ASK / EXPLORE / BUILD / FIX / WATCH workflows with evidence, risk, tool path, and an explicit operator trace. Dataarchy routes the intent to the right Databricks capabilities rather than asking the user to choose products first.

### 3 // FORGE

Recipe-driven intent-to-artifact work. Dataarchy stages pipelines, quality contracts, deployment configurations, Genie domains, watches, repairs, and other generated work behind an explicit production gate.

### 4 // OBSERVE

Intelligent watches, job execution health, repair queue, and system telemetry. The design goal is to watch for meaning rather than simply producing alerts.

### 5 // ARSENAL

Capability packages, enterprise defaults, specialist agent roster, governed assets, and policy. Packages can encode domain semantics, recipes, quality expectations, agents, and organization-specific defaults.

## Keyboard model

- `Cmd/Ctrl + Space` — neural command surface
- `Cmd/Ctrl + 1..5` — acquire workspace
- `Cmd/Ctrl + Enter` — execute current intent
- `Cmd/Ctrl + F` — focus mode; collapse secondary instruments
- `Cmd/Ctrl + K` — operator keybindings
- `Esc` — collapse transient UI / exit focus

The launcher accepts both commands and natural language. If nothing matches, the text is routed as intent.

## AI operating states

The visible Operator Intelligence core reflects the system's current behavior:

- `OBSERVING`
- `INVESTIGATING`
- `BUILDING`
- `VERIFYING`
- `WATCHING`
- `READY`

The shell also displays the actual tool chain returned by the backend, such as Genie, Unity Catalog, Jobs API, Model Serving, or the Dataarchy Guardian.

## Databricks integration

When configured, Dataarchy uses:

- Genie Agents / Conversation API for governed natural-language analytics
- Unity Catalog for governed asset discovery and inspection
- Jobs API 2.2 for execution health and failure context
- SQL Statement Execution for the governed SQL escape hatch
- Databricks Model Serving for operator planning and staged BUILD / FIX / WATCH work

Genie requests use a bounded polling flow so Dataarchy can render the progressively completed governed message rather than only the initial conversation-start payload.

## Databricks-native runtime

Dataarchy can run directly as a **Databricks App**. The repository includes both `app.yaml` and `databricks.yml`.

In Databricks Apps, the runtime automatically injects the workspace host plus the app service principal's OAuth client credentials. Dataarchy detects those credentials and exchanges them for a cached workspace OAuth token using the M2M client-credentials flow. A personal access token is therefore not required in the deployed app.

The app bundle binds three least-privilege resources:

- `sql-warehouse` → SQL warehouse with `CAN_USE`
- `genie-space` → Genie Agent with `CAN_RUN`
- `serving-endpoint` → model serving endpoint with `CAN_QUERY`

`app.yaml` resolves those resource keys into `DATABRICKS_WAREHOUSE_ID`, `DATABRICKS_GENIE_SPACE_ID`, and `DATABRICKS_MODEL_ENDPOINT` at runtime.

### Deploy with Declarative Automation Bundles

Set the required bundle variables through your normal Databricks CLI profile / target workflow, then validate and deploy:

```bash
databricks bundle validate \
  --var="warehouse_id=<warehouse-id>,genie_space_id=<genie-space-id>,model_endpoint_name=<endpoint-name>"

databricks bundle deploy -t dev \
  --var="warehouse_id=<warehouse-id>,genie_space_id=<genie-space-id>,model_endpoint_name=<endpoint-name>"
```

For production, use the `prod` target rather than `dev`.

You can also create the Databricks App through the Apps UI or Git deployment flow and add resources using the same keys expected by `app.yaml`.

### Authentication modes

Dataarchy supports three runtime states:

1. **Databricks App OAuth M2M** — preferred for deployed apps. `DATABRICKS_HOST`, `DATABRICKS_CLIENT_ID`, and `DATABRICKS_CLIENT_SECRET` are supplied by the app runtime.
2. **External OAuth M2M** — provide the same host/client credentials locally or in another hosting environment.
3. **PAT local development** — set `DATABRICKS_TOKEN` while developing locally.

OAuth access tokens are cached in-process and refreshed before expiry.

> Route-optimized Model Serving endpoints require endpoint-scoped OAuth authorization details and a route-optimized endpoint URL. The current Dataarchy model adapter targets standard workspace Model Serving endpoints. Add endpoint-scoped OAuth before switching the planner to a route-optimized endpoint.

## Safety and production mutation

Dataarchy is powerful by design, but production mutation is explicit.

Every action response includes:

- tool path
- operator trace
- execution mode
- risk level
- whether approval is required
- whether a production mutation occurred

BUILD, FIX, and WATCH work is staged by default. Generated artifacts can be inspected and validated before a deployment adapter is authorized to apply them.

The default principle is:

> Never ask the user to make a Databricks decision that the system can safely make for them. Never hide a production decision the user should make.

## Packages and recipes

The first built-in package catalog includes:

- `dataarchy-core`
- `healthcare-core`
- `epic-analytics`
- `omop-cdm`
- `fhir-interoperability`
- `databricks-finops`

The first recipe catalog includes:

- New Data Source
- Root Cause Investigation
- Pipeline Repair
- Intelligent Watch
- Genie Domain
- Data Trust Audit

The package state is persisted in the browser for the current implementation. The package model is intentionally shaped so it can evolve into a signed enterprise registry.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Without Databricks credentials, Dataarchy boots into a rich simulation mode so the full operator environment remains explorable.

### Local PAT example

```bash
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=...
DATABRICKS_WAREHOUSE_ID=...
DATABRICKS_GENIE_SPACE_ID=...
DATABRICKS_MODEL_ENDPOINT=...
DATABRICKS_CATALOG=main
DATABRICKS_SCHEMA=default
DATAARCHY_ALLOW_SQL_MUTATIONS=false
```

### Local OAuth M2M example

```bash
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_CLIENT_ID=...
DATABRICKS_CLIENT_SECRET=...
DATABRICKS_WAREHOUSE_ID=...
DATABRICKS_GENIE_SPACE_ID=...
DATABRICKS_MODEL_ENDPOINT=...
```

## Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                     DATAARCHY SHELL                          │
│ boot • command surface • workspaces • focus • themes         │
└────────────────────────────┬─────────────────────────────────┘
                             │ intent
┌────────────────────────────▼─────────────────────────────────┐
│                    OPERATOR RUNTIME                          │
│ SCOUT • ANALYST • ENGINEER • GUARDIAN • OPERATOR             │
│ tool path • risk • trace • review gate                       │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                    DATABRICKS PLANE                          │
│ Genie • Unity Catalog • Jobs • SQL • Model Serving           │
│ app service principal • OAuth M2M • resource bindings        │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                GOVERNED ENTERPRISE DATA                      │
└──────────────────────────────────────────────────────────────┘
```

## Product direction

The next deep product layer is a promotion engine and persistent mission model: investigations and builds should become durable workspace objects with evidence, artifacts, history, collaborators, watches, approvals, and deploy/verify state. That is the path from a cinematic AI interface to a true analytics operating system.
