export type Mode = "ask" | "explore" | "build" | "fix" | "watch";

export type DataarchyPackage = {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  recommended?: boolean;
};

export type DataarchyRecipe = {
  id: string;
  name: string;
  mode: Mode;
  description: string;
  prompt: string;
  outputs: string[];
};

export const enterpriseProfile = {
  name: "Enterprise Analytics",
  philosophy: "Intent in. Analytics out. Databricks underneath.",
  defaults: {
    compute: "serverless",
    language: "SQL-first",
    catalog: "governed",
    deployment: "review-gated",
    lineage: "required",
    observability: "always-on",
    aiRouting: "automatic",
    productionMutation: "explicit approval",
  },
  agents: [
    ["SCOUT", "Finds authoritative data, metrics, lineage and context"],
    ["ANALYST", "Runs governed analysis and tests hypotheses"],
    ["ENGINEER", "Designs pipelines, contracts and transformations"],
    ["GUARDIAN", "Checks policy, risk, quality and production impact"],
    ["OPERATOR", "Stages deployment, monitoring and repair actions"],
  ],
};

export const recipes: DataarchyRecipe[] = [
  {
    id: "new-source",
    name: "New Data Source",
    mode: "build",
    description: "Profile a source and stage a governed Bronze → Validated → Gold product.",
    prompt: "Build a production data product from this new source. Profile it, infer keys, add quality checks, document lineage, and stage deployment artifacts.",
    outputs: ["pipeline.sql", "quality.yml", "contract.yml", "deployment.yml"],
  },
  {
    id: "root-cause",
    name: "Root Cause Investigation",
    mode: "ask",
    description: "Turn an anomaly into an evidence-backed investigation with competing hypotheses.",
    prompt: "Investigate this anomaly. Find the authoritative metric, segment the change, trace upstream changes, test competing hypotheses, and return an evidence-backed explanation.",
    outputs: ["evidence.md", "queries.sql", "hypotheses.json"],
  },
  {
    id: "repair",
    name: "Pipeline Repair",
    mode: "fix",
    description: "Diagnose failed jobs, identify blast radius, and stage the safest repair.",
    prompt: "Diagnose the failed analytics workload, identify the root cause and downstream impact, then stage the safest repair and verification plan.",
    outputs: ["repair-plan.md", "patch.diff", "verification.yml"],
  },
  {
    id: "watch",
    name: "Intelligent Watch",
    mode: "watch",
    description: "Create anomaly-aware monitoring with explanation and escalation context.",
    prompt: "Create an intelligent watch for this signal. Define baseline behavior, anomaly conditions, evidence to collect, escalation rules, and the explanation payload.",
    outputs: ["monitor.yml", "baseline.sql", "runbook.md"],
  },
  {
    id: "genie-domain",
    name: "Genie Domain",
    mode: "build",
    description: "Curate a governed semantic domain with metrics, instructions and examples.",
    prompt: "Create a production-ready Genie domain for this business area with authoritative datasets, curated metrics, instructions, examples, validation checks, and ownership metadata.",
    outputs: ["domain.yml", "metrics.yml", "examples.json", "validation.sql"],
  },
  {
    id: "data-audit",
    name: "Data Trust Audit",
    mode: "explore",
    description: "Inspect ownership, freshness, quality, lineage and operational usage.",
    prompt: "Audit this governed asset for ownership, freshness, quality, schema risk, lineage, downstream usage, and AI readiness.",
    outputs: ["audit.md", "quality-report.json"],
  },
];

export const packages: DataarchyPackage[] = [
  {
    id: "core",
    name: "dataarchy-core",
    version: "0.2.0",
    description: "Opinionated analytics OS defaults, agents, recipes, governance and operator behaviors.",
    capabilities: ["agents", "recipes", "governance", "operator"],
    recommended: true,
  },
  {
    id: "healthcare",
    name: "healthcare-core",
    version: "0.1.0",
    description: "Healthcare semantic patterns, terminology, quality expectations and common operational investigations.",
    capabilities: ["clinical semantics", "quality", "operations"],
    recommended: true,
  },
  {
    id: "epic",
    name: "epic-analytics",
    version: "0.1.0",
    description: "Epic-oriented domain recipes, common analytic patterns, terminology and governed joins.",
    capabilities: ["Epic", "clinical", "revenue cycle", "patient access"],
  },
  {
    id: "omop",
    name: "omop-cdm",
    version: "0.1.0",
    description: "OMOP CDM mapping, vocabulary validation, cohort recipes and quality contracts.",
    capabilities: ["OMOP", "mapping", "cohorts", "vocabulary"],
  },
  {
    id: "fhir",
    name: "fhir-interoperability",
    version: "0.1.0",
    description: "FHIR ingestion, resource profiling, conformance checks and semantic normalization.",
    capabilities: ["FHIR", "ingestion", "conformance"],
  },
  {
    id: "finops",
    name: "databricks-finops",
    version: "0.1.0",
    description: "Cost observability, workload efficiency, serverless defaults and spend anomaly watches.",
    capabilities: ["cost", "compute", "optimization", "watch"],
  },
];

export const intentStages: Record<Mode, string[]> = {
  ask: ["resolve intent", "find authority", "gather evidence", "test hypotheses", "verify", "brief operator"],
  explore: ["resolve asset", "inspect metadata", "trace lineage", "profile quality", "assess usage", "brief operator"],
  build: ["resolve outcome", "profile inputs", "design contract", "generate artifacts", "validate", "stage promotion"],
  fix: ["detect failure", "collect run context", "trace blast radius", "diagnose cause", "stage repair", "verify"],
  watch: ["resolve signal", "build baseline", "define anomaly", "collect context", "set escalation", "activate watch"],
};

export function suggestedWorkspace(mode: Mode) {
  if (mode === "build") return 3;
  if (mode === "fix" || mode === "watch") return 4;
  if (mode === "explore") return 5;
  return 2;
}
