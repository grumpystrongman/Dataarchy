# Dataarchy

**Intent in. Analytics out. Databricks underneath.**

Dataarchy is an opinionated, AI-native analytics operating environment inspired by Omarchy's approach to Linux: excellent primitives, strong defaults, keyboard-first workflows, beautiful system-level coherence, and a clear escape hatch to the machinery underneath.

This is not a dashboard mockup. The repository contains a runnable Next.js application with:

- Four tiled analytics workspaces: **Operate, Investigate, Build, Govern**
- A global `Super/Cmd/Ctrl + Space` launcher
- `Super/Cmd/Ctrl + 1..4` workspace switching and `Super/Cmd/Ctrl + K` keybinding help
- ASK / EXPLORE / BUILD / FIX / WATCH intent modes
- A Databricks adapter for Genie, Unity Catalog, Jobs API 2.2, SQL Statement Execution, and Model Serving
- A rich demo mode that boots without credentials
- Review-first production mutation philosophy for generated build/watch actions
- Theme switching from the global launcher
- Responsive desktop/mobile layouts
- A governed SQL escape hatch that blocks mutating statements by default

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

If no Databricks environment variables are present, Dataarchy starts in demo mode so the entire shell can be explored immediately.

## Connect Databricks

Set these in `.env.local`:

```bash
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=...
DATABRICKS_WAREHOUSE_ID=...
DATABRICKS_GENIE_SPACE_ID=...
DATABRICKS_MODEL_ENDPOINT=databricks-gpt-5
DATABRICKS_CATALOG=main
DATABRICKS_SCHEMA=default
DATAARCHY_ALLOW_SQL_MUTATIONS=false
```

The current adapter uses:

- `POST /api/2.0/genie/spaces/{space_id}/start-conversation`
- `GET /api/2.1/unity-catalog/catalogs`
- `GET /api/2.1/unity-catalog/tables/{full_name}`
- `GET /api/2.2/jobs/runs/list`
- `POST /api/2.0/sql/statements`
- `POST /serving-endpoints/{name}/invocations`

ASK prefers Genie when a Genie space is configured. BUILD/FIX/WATCH can use the configured Databricks Model Serving endpoint as Dataarchy's governed planning brain. EXPLORE resolves exact three-part table names through Unity Catalog. The shell falls back gracefully when optional capabilities are not configured.

## Product philosophy

Dataarchy exposes **verbs, not Databricks products**.

| Intent | What the user means |
| --- | --- |
| ASK | Investigate a business question |
| EXPLORE | Understand an asset, lineage, quality, or usage |
| BUILD | Turn intent into a production-ready data product |
| FIX | Diagnose and repair broken analytics |
| WATCH | Monitor a metric, pipeline, model, or data condition |

The rule is simple: **never ask the user to make a Databricks decision that the system can safely make for them.** Advanced users can inspect generated artifacts and drop into native Databricks whenever they want.

## Architecture

```text
Dataarchy Shell
  ├─ keyboard launcher + tiled workspaces + themes
  ├─ intent router (ASK / EXPLORE / BUILD / FIX / WATCH)
  ├─ agent-facing API routes
  └─ review / governance boundary
          │
          ▼
Databricks Adapter
  ├─ Genie
  ├─ Unity Catalog
  ├─ Jobs 2.2
  ├─ Model Serving / Foundation Models
  └─ SQL Statement Execution
          │
          ▼
Databricks workspace + governed enterprise data
```

## Governed SQL escape hatch

`POST /api/sql` accepts `{ "statement": "SELECT ..." }` and executes through the configured SQL warehouse. Mutating SQL (`INSERT`, `UPDATE`, `DELETE`, `MERGE`, DDL, grants, maintenance commands, and similar operations) is denied unless `DATAARCHY_ALLOW_SQL_MUTATIONS=true` is explicitly configured.

## What comes next

The shell is deliberately structured so the next increments can add persistent workspaces, Databricks OAuth/service-principal auth, streaming Genie message rendering, artifact promotion, Lakeflow pipeline generation, agent audit history, metric views, native notifications, organization profiles, recipes/packages, and a real Dataarchy package registry without rewriting the desktop experience.

## Safety stance

Dataarchy is designed to be powerful without being reckless. Read and investigation actions can run directly when configured. BUILD and WATCH currently generate auditable plans rather than silently creating or mutating production resources. The promotion boundary should remain explicit even as deeper automation is added.
