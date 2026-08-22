import type { DatabricksMode } from "./databricks";

export const demoSystem = {
  signals: [
    { label: "ED boarding", value: "+14.2%", tone: "bad", detail: "95th percentile, 48h baseline" },
    { label: "MRI utilization", value: "-6.8%", tone: "warn", detail: "North campus driving change" },
    { label: "Claim denials", value: "+3.9%", tone: "warn", detail: "Auth-related denials elevated" },
    { label: "Discharge before noon", value: "+5.1%", tone: "good", detail: "Sustained for 7 days" },
  ],
  pipelines: { healthy: 184, degraded: 3, failed: 1 },
  catalogs: ["enterprise", "clinical", "finance", "operations", "sandbox"],
  jobs: [
    { name: "epic_encounter_incremental", state: "SUCCESS", runtime: "06:42", owner: "data-engineering" },
    { name: "claims_gold_refresh", state: "SUCCESS", runtime: "03:18", owner: "revenue-cycle" },
    { name: "referral_ingest", state: "FAILED", runtime: "00:41", owner: "patient-access" },
    { name: "ed_census_forecast", state: "RUNNING", runtime: "04:03", owner: "advanced-analytics" },
  ],
};

const answers: Record<DatabricksMode, (q: string) => any> = {
  ask: (q) => ({
    title: "Investigation complete",
    summary: "ED boarding is being driven primarily by a late-day discharge bottleneck and a step-change in admit-to-bed time at the North campus.",
    confidence: 0.89,
    evidence: [
      "Boarded hours rose 14.2% versus the trailing 48-hour baseline.",
      "72% of the increase is concentrated between 15:00 and 22:00.",
      "North campus admit-to-bed time increased by 31 minutes after Wednesday's interface change.",
      "Arrival volume is only 1.8% above baseline, making demand an unlikely primary cause.",
    ],
    query: q,
    next: ["Break this down by service line", "Trace the North campus interface change", "Create a watch for boarding > 10%"],
  }),
  explore: (q) => ({
    title: "Asset profile",
    summary: "This looks like a governed Delta fact table with stable daily volume, one recent schema addition, and high downstream reuse.",
    confidence: 0.96,
    evidence: [
      "2.4M rows/day median over 30 days.",
      "Freshness SLO: 06:15 local; current arrival: 05:48.",
      "24 downstream dashboards, 7 jobs, and 2 Genie spaces depend on this asset.",
      "One nullable column, authorization_source, was added 3 days ago.",
    ],
    query: q,
    next: ["Show lineage", "Generate data quality tests", "Open the recent schema change"],
  }),
  build: (q) => ({
    title: "Production plan ready",
    summary: "I designed an incremental Bronze → Validated → Gold pattern with quarantine, expectations, lineage, and deployment gates.",
    confidence: 0.93,
    evidence: [
      "Incremental ingestion keyed on claim_id + service_line_number.",
      "Quarantine invalid member IDs and impossible service dates.",
      "Gold model is partitioned by service_month and clustered by payer + facility.",
      "Deployment includes dev/test/prod promotion and a 06:30 freshness watch.",
    ],
    artifact: `-- Dataarchy generated SQL skeleton\nCREATE OR REFRESH STREAMING TABLE validated_claims\nTBLPROPERTIES ('quality' = 'validated')\nAS SELECT * FROM STREAM(raw_claims)\nWHERE claim_id IS NOT NULL;`,
    query: q,
    next: ["Generate the full pipeline", "Add HIPAA quality policy", "Prepare deployment bundle"],
  }),
  fix: (q) => ({
    title: "Likely root cause found",
    summary: "The referral ingestion failure is consistent with a source schema drift: referral_priority changed from STRING to STRUCT in today's payload.",
    confidence: 0.94,
    evidence: [
      "Last successful run: 05:02.",
      "First failed batch: 05:17.",
      "No compute or permission errors detected.",
      "Downstream silver table has not been updated since 05:11.",
    ],
    query: q,
    next: ["Generate a compatibility patch", "Quarantine malformed records", "Replay failed batches"],
  }),
  watch: (q) => ({
    title: "Watch drafted",
    summary: "I prepared a metric watch that fires only when the change is sustained and materially outside the recent baseline.",
    confidence: 0.91,
    evidence: [
      "Condition: ED boarding > 10% over 48h baseline.",
      "Persistence: 3 consecutive 15-minute windows.",
      "Suppress repeat alerts for 90 minutes.",
      "Attach top contributing facility, service line, and hour-of-day segments.",
    ],
    query: q,
    next: ["Activate watch", "Change sensitivity", "Route to operations workspace"],
  }),
};

export function demoAction(mode: DatabricksMode, query: string) {
  return { source: "demo", mode, ...answers[mode](query) };
}
