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

When configured, Dataarchy currently uses:

- Genie Agents / Conversation API for governed natural-language analytics
- Unity Catalog for governed asset discovery and inspection
- Jobs API 2.2 for execution health and failure context
- SQL Statement Execution for the governed SQL escape hatch
- Databricks Model Serving for operator planning and staged BUILD / FIX / WATCH work

Genie requests use a bounded polling flow so Dataarchy can render the progressively completed governed message rather than only the initial conversation-start payload.

## Safety and production mutation

Dataarchy is powerful by design, but production mutation is explicit.

Every action response includes:

- tool path
- operator trace
- execution mode
- risk level
- whether approval is required
- whether a production mutation occurred

BUILD, FIX, and WATCH work is staged by default. Generated artifacts can be inspected and validated before a future deployment adapter is authorized to apply them.

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

The package state is persisted in the browser for the current prototype. The package model is intentionally shaped so it can evolve into a signed enterprise registry.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Without Databricks credentials, Dataarchy boots into a rich simulation mode so the full operator environment remains explorable.

## Connect Databricks

```bash
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=...
DATABRICKS_WAREHOUSE_ID=...
DATABRICKS_GENIE_SPACE_ID=...
DATABRICKS_MODEL_ENDPOINT=...
DATABRICKS_CATALOG=main
DATABRICKS_SCHEMA=default

# Keep false unless you deliberately wire an explicit mutation flow.
DATAARCHY_ALLOW_SQL_MUTATIONS=false
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
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                GOVERNED ENTERPRISE DATA                      │
└──────────────────────────────────────────────────────────────┘
```

## Product direction

The next deep product layer is a promotion engine and persistent mission model: investigations and builds should become durable workspace objects with evidence, artifacts, history, collaborators, watches, approvals, and deploy/verify state. That is the path from a cinematic AI interface to a true analytics operating system.
