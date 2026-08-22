# Dataarchy

**Intent in. Analytics out. Databricks underneath.**

Dataarchy is an opinionated, AI-native analytics operating environment for Databricks. It takes inspiration from Omarchy's approach to Linux: strong defaults, keyboard-first workflows, composable power, a coherent visual system, and a clean escape hatch to the machinery underneath.

The goal is not to make Databricks look simpler. The goal is to make an analytics organization feel like it has a powerful AI operating system.

**Current baseline: v0.4.0**

## What it feels like

Dataarchy is designed as a cinematic command environment rather than another enterprise dashboard. The visual system uses dark glass, fine HUD geometry, restrained emissive color, spatially tiled instruments, active-system motion, and an AI core whose visual state reflects what the operator is actually asking the system to do.

The interface is theatrical in small doses: a short boot sequence, workspace acquisition motion, live topology, radar-style observation, tool-path activity, and a persistent Mission Memory console. Effects communicate state, focus, risk, activity, or hierarchy rather than existing as decoration.

## Five operating workspaces

### 1 // COMMAND
The home cockpit: Operator Intelligence, enterprise signals, governed intelligence topology, and recommended actions.

### 2 // INVESTIGATE
Natural-language ASK / EXPLORE / BUILD / FIX / WATCH workflows with evidence, risk, tool path, and an explicit operator trace. Dataarchy routes intent to the appropriate Databricks capabilities rather than asking the operator to choose products first.

### 3 // FORGE
Recipe-driven intent-to-artifact work. Dataarchy stages pipelines, quality contracts, deployment configurations, Genie domains, watches, repairs, and other generated work behind an explicit production gate.

### 4 // OBSERVE
Intelligent watches, job execution health, repair queue, and system telemetry. The objective is to watch for meaning rather than merely produce alerts.

### 5 // ARSENAL
Capability packages, enterprise defaults, specialist agent roster, governed assets, and policy. Packages can encode domain semantics, recipes, quality expectations, agents, and organization-specific defaults.

## Mission Memory

Every ASK, EXPLORE, BUILD, FIX, and WATCH action can become a durable **Mission**. A mission preserves the original operator intent plus the result snapshot, source, tool path, execution trace, risk metadata, timestamps, artifacts/evidence, current state, and audit events.

Mission states currently include:

- `complete` — read-only/direct work finished
- `staged` — BUILD/FIX/WATCH work is waiting for an operator gate
- `authorized` — an operator explicitly approved the staged mission
- `failed` — reserved for failed mission outcomes

Use `Cmd/Ctrl + Shift + M` to open the cinematic Mission Memory console. Operators can reopen work, inspect evidence and artifacts, review the audit trail, and authorize staged missions.

Inside Databricks Apps, Mission Memory is persisted as one JSON document per mission in a governed Unity Catalog volume:

```text
/Volumes/<catalog>/<schema>/<volume>/dataarchy/missions/<mission-uuid>.json
```

Authorization is attributed from Databricks forwarded user identity headers when available. **Authorization records approval; it does not silently mutate production.**

## Keyboard model

- `Cmd/Ctrl + Space` — neural command surface
- `Cmd/Ctrl + 1..5` — acquire workspace
- `Cmd/Ctrl + Enter` — execute current intent
- `Cmd/Ctrl + F` — focus mode
- `Cmd/Ctrl + K` — operator keybindings
- `Cmd/Ctrl + Shift + M` — Mission Memory
- `Esc` — collapse transient UI / exit focus

The launcher accepts commands and natural language. If nothing matches, the text is routed as intent.

## AI operating states

The visible Operator Intelligence core reflects the system's current behavior:

- `OBSERVING`
- `INVESTIGATING`
- `BUILDING`
- `VERIFYING`
- `WATCHING`
- `READY`

The shell also exposes the actual tool chain returned by the backend, such as Genie, Unity Catalog, Jobs API, Model Serving, or the Dataarchy Guardian.

## Databricks integration

When configured, Dataarchy uses:

- Genie Agents / Conversation API for governed natural-language analytics
- Unity Catalog for governed asset discovery, policy boundaries, and Mission Memory storage
- Jobs API 2.2 for execution health and failure context
- SQL Statement Execution for the governed SQL escape hatch
- Databricks Model Serving for operator planning and staged BUILD / FIX / WATCH work
- Databricks Apps for the native application runtime

Genie requests use a bounded polling flow so Dataarchy can render a progressively completed governed message rather than only the conversation-start payload.

## Databricks-native runtime

The repository includes `app.yaml` and `databricks.yml` for first-class Databricks Apps deployment.

In Databricks Apps, the runtime injects the workspace host plus the app service principal's OAuth client credentials. Dataarchy uses OAuth M2M and caches workspace access tokens before expiry, so a personal access token is not required in the deployed app.

The bundle binds least-privilege resources:

- `sql-warehouse` → SQL warehouse with `CAN_USE`
- `genie-space` → Genie Agent with `CAN_RUN`
- `serving-endpoint` → Model Serving endpoint with `CAN_QUERY`
- `state-volume` → Unity Catalog volume with `WRITE_VOLUME`

`app.yaml` resolves those resources into runtime environment variables, including `DATAARCHY_STATE_VOLUME` for governed durable Mission Memory.

## Safety and production mutation

Dataarchy is powerful by design, but production mutation remains explicit.

Every operator result exposes:

- tool path
- operator trace
- execution mode
- risk level
- whether approval is required
- whether a production mutation occurred

BUILD, FIX, and WATCH work is staged by default. Mission authorization records the operator decision without pretending that deployment occurred. `DATAARCHY_ALLOW_SQL_MUTATIONS=false` remains the default.

The operating principle is:

> Never ask the user to make a Databricks decision that the system can safely make for them. Never hide a production decision the user should make.

## Packages and recipes

Built-in package catalog:

- `dataarchy-core`
- `healthcare-core`
- `epic-analytics`
- `omop-cdm`
- `fhir-interoperability`
- `databricks-finops`

Built-in recipes:

- New Data Source
- Root Cause Investigation
- Pipeline Repair
- Intelligent Watch
- Genie Domain
- Data Trust Audit

Package enablement is currently persisted in the browser. The package model is shaped to evolve into a signed enterprise registry.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Without Databricks credentials, Dataarchy boots into a rich simulation mode. Without `DATAARCHY_STATE_VOLUME`, Mission Memory falls back to in-process storage for local/demo use.

### Local PAT

```bash
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=...
DATABRICKS_WAREHOUSE_ID=...
DATABRICKS_GENIE_SPACE_ID=...
DATABRICKS_MODEL_ENDPOINT=...
DATAARCHY_STATE_VOLUME=/Volumes/main/dataarchy/state
DATABRICKS_CATALOG=main
DATABRICKS_SCHEMA=default
DATAARCHY_ALLOW_SQL_MUTATIONS=false
```

### Local OAuth M2M

```bash
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_CLIENT_ID=...
DATABRICKS_CLIENT_SECRET=...
DATABRICKS_WAREHOUSE_ID=...
DATABRICKS_GENIE_SPACE_ID=...
DATABRICKS_MODEL_ENDPOINT=...
DATAARCHY_STATE_VOLUME=/Volumes/main/dataarchy/state
```

## Deploy

See **`DEPLOYMENT.md`** for the production runbook.

The repository includes a manual, environment-gated GitHub Actions workflow at `.github/workflows/deploy-databricks.yml`. It uses GitHub OIDC rather than a stored Databricks client secret, validates the bundle, deploys it, starts/restarts the Databricks App, and performs an authenticated `/api/system` smoke test.

Manual CLI flow:

```bash
export DATABRICKS_BUNDLE_VAR_warehouse_id="<warehouse-id>"
export DATABRICKS_BUNDLE_VAR_genie_space_id="<genie-space-id>"
export DATABRICKS_BUNDLE_VAR_model_endpoint_name="<endpoint-name>"
export DATABRICKS_BUNDLE_VAR_state_volume_full_name="main.dataarchy.state"

databricks bundle validate --target prod
databricks bundle deploy --target prod
databricks bundle run dataarchy --target prod
```

## Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                     DATAARCHY SHELL                          │
│ boot • command • workspaces • focus • Mission Memory         │
└────────────────────────────┬─────────────────────────────────┘
                             │ intent
┌────────────────────────────▼─────────────────────────────────┐
│                    OPERATOR RUNTIME                          │
│ SCOUT • ANALYST • ENGINEER • GUARDIAN • OPERATOR             │
│ tool path • risk • trace • review gate                       │
└────────────────────────────┬─────────────────────────────────┘
                             │ mission
┌────────────────────────────▼─────────────────────────────────┐
│                    MISSION MEMORY                            │
│ intent • evidence • artifacts • audit • authorization        │
│ governed Unity Catalog volume                               │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                    DATABRICKS PLANE                          │
│ Genie • Unity Catalog • Jobs • SQL • Model Serving • Apps    │
│ app service principal • OAuth M2M • resource bindings        │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                GOVERNED ENTERPRISE DATA                      │
└──────────────────────────────────────────────────────────────┘
```

## Current product frontier

Persistent missions are now part of the product baseline. The next frontier is the **promotion engine**: resource-specific adapters that can take an authorized Mission, compute an impact/diff, execute a narrowly scoped Databricks change, verify the outcome, and move the mission through deploy/verify/watch states without hiding production decisions.

That layer should remain explicit, testable, reversible where possible, and governed by the same evidence and audit model as the rest of Dataarchy.
