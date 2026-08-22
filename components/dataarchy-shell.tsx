"use client";

import {
  Activity, Bell, Bot, Boxes, Braces, CheckCircle2, ChevronRight, CircleAlert,
  Command, Cpu, Crosshair, Database, Eye, Gauge, GitBranch, Hammer, HeartPulse,
  Lock, Maximize2, Minimize2, Network, Package, Play, Radar, Radio, Rocket,
  RotateCcw, Search, Settings2, ShieldCheck, Sparkles, TerminalSquare,
  TriangleAlert, WandSparkles, Workflow, X, Zap,
} from "lucide-react";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  enterpriseProfile, intentStages, packages as defaultPackages, recipes as defaultRecipes,
  suggestedWorkspace, type DataarchyPackage, type DataarchyRecipe, type Mode,
} from "@/lib/dataarchy-os";

type Workspace = 1 | 2 | 3 | 4 | 5;
type Theme = "aegis" | "ember" | "ghost";
type CoreState = "OBSERVING" | "INVESTIGATING" | "BUILDING" | "VERIFYING" | "WATCHING" | "READY";

type SystemData = {
  source: string;
  status?: { configured: boolean; warehouseConfigured: boolean; genieConfigured: boolean; modelConfigured?: boolean };
  warning?: string;
  signals: Array<{ label: string; value: string; tone: string; detail: string }>;
  pipelines: { healthy: number; degraded: number; failed: number };
  catalogs: string[];
  jobs: Array<{ name: string; state: string; runtime: string; owner: string }>;
};

type ActionResult = {
  source?: string; mode?: Mode; title?: string; summary?: string; confidence?: number;
  evidence?: string[]; next?: string[]; artifact?: string; warning?: string;
  genie?: any; table?: any; failedRuns?: any[]; tools?: string[]; trace?: string[];
  risk?: { level?: string; productionMutation?: boolean; approvalRequired?: boolean }; execution?: string;
};

type ProfilePayload = { profile: typeof enterpriseProfile; recipes: DataarchyRecipe[]; packages: DataarchyPackage[] };

const WORKSPACES: Workspace[] = [1, 2, 3, 4, 5];
const workspaceNames: Record<Workspace, string> = { 1: "COMMAND", 2: "INVESTIGATE", 3: "FORGE", 4: "OBSERVE", 5: "ARSENAL" };
const workspaceIcons = [Cpu, Crosshair, Hammer, Radar, Package];

const modeMeta: Record<Mode, { label: string; icon: any; hint: string; defaultQuery: string }> = {
  ask: { label: "ASK", icon: Sparkles, hint: "Investigate a business question", defaultQuery: "Why did ED boarding spike today?" },
  explore: { label: "EXPLORE", icon: Eye, hint: "Understand an asset, lineage, quality and usage", defaultQuery: "enterprise.clinical.encounter" },
  build: { label: "BUILD", icon: Hammer, hint: "Turn an outcome into governed production artifacts", defaultQuery: "Build a claims data product from our daily raw feed" },
  fix: { label: "FIX", icon: Zap, hint: "Diagnose failure, blast radius and safest repair", defaultQuery: "Why did referral_ingest fail?" },
  watch: { label: "WATCH", icon: Gauge, hint: "Create intelligent anomaly-aware monitoring", defaultQuery: "Watch ED boarding and explain meaningful anomalies" },
};

const coreByMode: Record<Mode, CoreState> = { ask: "INVESTIGATING", explore: "INVESTIGATING", build: "BUILDING", fix: "VERIFYING", watch: "WATCHING" };

function Pane({ title, icon: Icon, badge, children, className = "", importance = "normal", actions }: {
  title: string; icon: any; badge?: string; children: ReactNode; className?: string;
  importance?: "primary" | "secondary" | "normal"; actions?: ReactNode;
}) {
  return <section className={`pane ${importance} ${className}`}>
    <i className="hud-corner tl" /><i className="hud-corner tr" /><i className="hud-corner bl" /><i className="hud-corner br" />
    <header className="pane-titlebar"><div className="pane-title"><Icon size={14} /><span>{title}</span>{badge && <em>{badge}</em>}</div><div className="pane-actions">{actions}<span /><span /><span /></div></header>
    <div className="pane-body">{children}</div>
  </section>;
}

function StatusDot({ state }: { state: string }) {
  const s = state.toLowerCase();
  const tone = s.includes("success") || s.includes("healthy") || s.includes("ready") ? "good" : s.includes("run") || s.includes("active") || s.includes("progress") ? "info" : s.includes("fail") || s.includes("error") ? "bad" : "warn";
  return <span className={`status-dot ${tone}`} />;
}

function MiniBars({ values = [34, 40, 37, 46, 42, 54, 59, 65, 63, 74, 86, 81] }: { values?: number[] }) {
  return <div className="mini-bars">{values.map((v, i) => <span key={i} style={{ height: `${v}%` }} />)}</div>;
}

function BootSequence({ onSkip }: { onSkip: () => void }) {
  const steps = ["acquiring workspace", "connecting intelligence plane", "loading enterprise context", "checking governed domains", "starting operator daemon"];
  return <div className="boot-screen" onClick={onSkip}><div className="boot-grid" /><div className="boot-mark"><span>D/</span><i /></div><div className="boot-copy"><small>DATAARCHY // ANALYTICS INTELLIGENCE SYSTEM</small><h1>Operator environment initializing</h1><div className="boot-steps">{steps.map((step, i) => <div key={step} style={{ animationDelay: `${i * 150}ms` }}><span>{step}</span><b>done</b></div>)}</div><p>SYSTEM READY <em>click to enter</em></p></div></div>;
}

function AICore({ state, tools = [] }: { state: CoreState; tools?: string[] }) {
  return <div className={`ai-core state-${state.toLowerCase()}`}><div className="core-visual"><i className="core-orbit orbit-one" /><i className="core-orbit orbit-two" /><i className="core-orbit orbit-three" /><div className="core-center"><Sparkles size={25} /><span>D/</span></div></div><div className="core-copy"><small>OPERATOR INTELLIGENCE</small><h2>{state}</h2><p>{state === "OBSERVING" ? "Watching the analytics estate and waiting for intent." : state === "READY" ? "Work complete. Evidence and next actions are ready." : "Coordinating governed analytics tools around your intent."}</p><div className="tool-chain">{(tools.length ? tools : ["SCOUT", "ANALYST", "GUARDIAN"]).slice(0, 4).map((tool, i) => <span key={`${tool}-${i}`}>{tool}</span>)}</div></div></div>;
}

function Topology({ active = false }: { active?: boolean }) {
  const nodes = [[15, 50, "SOURCE"], [37, 27, "UNITY"], [37, 72, "JOBS"], [61, 50, "GENIE"], [84, 50, "D/"]] as const;
  return <div className={`topology ${active ? "active" : ""}`}><svg viewBox="0 0 100 100"><path d="M15 50 L37 27 L61 50 L84 50" /><path d="M15 50 L37 72 L61 50" />{nodes.map(([x, y, label]) => <g key={label} className={label === "D/" ? "hot" : ""}><circle cx={x} cy={y} r="4" /><circle className="node-pulse" cx={x} cy={y} r="7" /><text x={x} y={y + 11} textAnchor="middle">{label}</text></g>)}</svg><div className="topology-legend"><span><i /> governed context</span><span><i /> active tool path</span></div></div>;
}

function RiskBadge({ result }: { result: ActionResult | null }) {
  const risk = result?.risk?.level || "read-only";
  return <span className={`risk-badge risk-${risk}`}><Lock size={11} />{risk.toUpperCase()}</span>;
}

function ModeStrip({ mode, onChoose }: { mode: Mode; onChoose: (m: Mode) => void }) {
  return <div className="mode-strip">{(Object.keys(modeMeta) as Mode[]).map((m) => { const Icon = modeMeta[m].icon; return <button key={m} className={mode === m ? "active" : ""} onClick={() => onChoose(m)}><Icon size={13} />{modeMeta[m].label}</button>; })}</div>;
}

function ResultView({ result, run }: { result: ActionResult; run: (q?: string, mode?: Mode) => void }) {
  if (result.genie) {
    const message = result.genie?.message || result.genie;
    const attachments = Array.isArray(message?.attachments) ? message.attachments : [];
    const text = attachments.map((a: any) => a?.text?.content).filter(Boolean).join("\n\n");
    const sql = attachments.map((a: any) => a?.query?.query || a?.query?.sql).filter(Boolean).join("\n\n");
    return <div className="result-card"><div className="result-head"><Sparkles size={16} /><strong>Genie analytic response</strong><em>{message?.status || "received"}</em></div>{text ? <p>{text}</p> : <p>Dataarchy received the current governed Genie response.</p>}{sql && <pre>{sql}</pre>}{!text && !sql && <pre>{JSON.stringify(message, null, 2).slice(0, 2600)}</pre>}<small className="source-tag">source: {result.source}</small></div>;
  }
  if (result.table) return <div className="result-card"><div className="result-head"><Database size={16} /><strong>{result.table.full_name || result.table.name}</strong><em>Unity Catalog</em></div><p>{result.table.comment || "Governed Unity Catalog asset."}</p><div className="facts"><span>owner <b>{result.table.owner || "—"}</b></span><span>format <b>{result.table.data_source_format || "—"}</b></span><span>type <b>{result.table.table_type || "—"}</b></span></div><pre>{JSON.stringify(result.table.columns?.slice(0, 10) || [], null, 2)}</pre><small className="source-tag">source: {result.source}</small></div>;
  if (result.failedRuns) return <div className="result-card"><div className="result-head"><Zap size={16} /><strong>Failed runs acquired</strong><em>Jobs API 2.2</em></div><pre>{JSON.stringify(result.failedRuns, null, 2).slice(0, 2600)}</pre><small className="source-tag">source: {result.source}</small></div>;
  return <div className="result-card"><div className="result-head"><Sparkles size={16} /><strong>{result.title || "Operator brief"}</strong>{typeof result.confidence === "number" && <em>{Math.round(result.confidence * 100)}% confidence</em>}</div><p>{result.summary}</p>{result.evidence?.length ? <div className="evidence-list">{result.evidence.map((x, i) => <div key={`${x}-${i}`}><span>{String(i + 1).padStart(2, "0")}</span><p>{x}</p></div>)}</div> : null}{result.artifact && <pre>{result.artifact}</pre>}{result.next?.length ? <div className="next-actions">{result.next.map((x) => <button key={x} onClick={() => run(x)}>{x}<ChevronRight size={13} /></button>)}</div> : null}<small className="source-tag">source: {result.source || "dataarchy"}</small></div>;
}

export default function DataarchyShell() {
  const [workspace, setWorkspace] = useState<Workspace>(1);
  const [mode, setMode] = useState<Mode>("ask");
  const [query, setQuery] = useState(modeMeta.ask.defaultQuery);
  const [system, setSystem] = useState<SystemData | null>(null);
  const [profileData, setProfileData] = useState<ProfilePayload>({ profile: enterpriseProfile, recipes: defaultRecipes, packages: defaultPackages });
  const [result, setResult] = useState<ActionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("aegis");
  const [focusMode, setFocusMode] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [clock, setClock] = useState("");
  const [launcherQuery, setLauncherQuery] = useState("");
  const [booting, setBooting] = useState(true);
  const [installedPackages, setInstalledPackages] = useState<string[]>(["core"]);
  const [selectedRecipe, setSelectedRecipe] = useState<DataarchyRecipe | null>(defaultRecipes[0]);

  useEffect(() => {
    fetch("/api/system").then((r) => r.json()).then(setSystem).catch(() => setSystem(null));
    fetch("/api/profile").then((r) => r.json()).then(setProfileData).catch(() => undefined);
    try {
      const savedTheme = localStorage.getItem("dataarchy.theme") as Theme | null;
      const savedPackages = JSON.parse(localStorage.getItem("dataarchy.packages") || "[]");
      if (savedTheme && ["aegis", "ember", "ghost"].includes(savedTheme)) setTheme(savedTheme);
      if (Array.isArray(savedPackages) && savedPackages.length) setInstalledPackages(savedPackages);
      if (sessionStorage.getItem("dataarchy.booted")) setBooting(false);
      else window.setTimeout(() => { sessionStorage.setItem("dataarchy.booted", "1"); setBooting(false); }, 1650);
    } catch { setBooting(false); }
  }, []);

  useEffect(() => { const tick = () => setClock(new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date())); tick(); const id = window.setInterval(tick, 1000); return () => window.clearInterval(id); }, []);
  useEffect(() => { try { localStorage.setItem("dataarchy.theme", theme); } catch {} }, [theme]);

  const coreState: CoreState = loading ? coreByMode[mode] : result ? "READY" : "OBSERVING";

  const prepare = useCallback((nextMode: Mode, text?: string, openWorkspace = true) => {
    setMode(nextMode); setQuery(text || modeMeta[nextMode].defaultQuery); setResult(null);
    if (openWorkspace) setWorkspace(suggestedWorkspace(nextMode) as Workspace);
    setLauncherOpen(false);
  }, []);

  const run = useCallback(async (override?: string, overrideMode?: Mode) => {
    const activeMode = overrideMode || mode;
    const text = (override ?? query).trim();
    if (!text) return;
    setMode(activeMode); setQuery(text); setLoading(true); setResult(null); setWorkspace(suggestedWorkspace(activeMode) as Workspace); setLauncherOpen(false);
    try {
      const response = await fetch("/api/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: activeMode, query: text }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Action failed");
      setResult(body); if (body.warning) setNotice(body.warning);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Action failed."); }
    finally { setLoading(false); }
  }, [mode, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.code === "Space") { e.preventDefault(); setLauncherOpen((v) => !v); }
      if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); setHelpOpen((v) => !v); }
      if (mod && e.key.toLowerCase() === "f") { e.preventDefault(); setFocusMode((v) => !v); }
      if (mod && ["1", "2", "3", "4", "5"].includes(e.key)) { e.preventDefault(); setWorkspace(Number(e.key) as Workspace); }
      if (mod && e.key === "Enter") { e.preventDefault(); run(); }
      if (e.key === "Escape") { setLauncherOpen(false); setHelpOpen(false); setFocusMode(false); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [run]);

  const launcherItems = useMemo(() => {
    const base = [
      ...Object.entries(modeMeta).map(([key, value]) => ({ type: "action", key, label: value.label, detail: value.hint })),
      ...WORKSPACES.map((key) => ({ type: "workspace", key: String(key), label: `${key} // ${workspaceNames[key]}`, detail: "Acquire workspace" })),
      { type: "theme", key: "aegis", label: "Visual system: Aegis", detail: "Cyan intelligence plane" },
      { type: "theme", key: "ember", label: "Visual system: Ember", detail: "Amber command environment" },
      { type: "theme", key: "ghost", label: "Visual system: Ghost", detail: "Low-chroma stealth mode" },
      { type: "focus", key: "focus", label: focusMode ? "Exit focus mode" : "Enter focus mode", detail: "Collapse secondary instruments" },
      { type: "boot", key: "boot", label: "Replay boot sequence", detail: "Reinitialize operator theater" },
    ];
    const filtered = base.filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(launcherQuery.toLowerCase()));
    return launcherQuery.trim() && filtered.length === 0 ? [{ type: "intent", key: launcherQuery, label: `Ask Dataarchy: ${launcherQuery}`, detail: "Route natural-language intent" }] : filtered;
  }, [launcherQuery, focusMode]);

  function launch(item: any) {
    if (item.type === "action") prepare(item.key as Mode);
    if (item.type === "workspace") { setWorkspace(Number(item.key) as Workspace); setLauncherOpen(false); }
    if (item.type === "theme") { setTheme(item.key as Theme); setLauncherOpen(false); }
    if (item.type === "focus") { setFocusMode((v) => !v); setLauncherOpen(false); }
    if (item.type === "boot") { setBooting(true); window.setTimeout(() => setBooting(false), 1650); setLauncherOpen(false); }
    if (item.type === "intent") run(item.key, "ask");
  }

  function togglePackage(id: string) {
    const next = installedPackages.includes(id) ? installedPackages.filter((x) => x !== id) : [...installedPackages, id];
    setInstalledPackages(next); try { localStorage.setItem("dataarchy.packages", JSON.stringify(next)); } catch {}
  }
  function selectRecipe(recipe: DataarchyRecipe) { setSelectedRecipe(recipe); setMode(recipe.mode); setQuery(recipe.prompt); setResult(null); setWorkspace(recipe.mode === "build" ? 3 : suggestedWorkspace(recipe.mode) as Workspace); }
  function submit(e: FormEvent) { e.preventDefault(); run(); }

  return <main className={`os theme-${theme} ${focusMode ? "focus-mode" : ""}`}>
    <div className="ambient-grid" /><div className="scanline" /><div className="ambient-glow glow-a" /><div className="ambient-glow glow-b" />
    <header className="topbar"><button className="brand" onClick={() => setLauncherOpen(true)}><span className="brand-mark">D/</span><span><strong>DATAARCHY</strong><small>ANALYTICS INTELLIGENCE SYSTEM</small></span></button><div className="top-center"><span>WS-{workspace}</span><b>{workspaceNames[workspace]}</b><i>{system?.source || "BOOTING"}</i><em>{coreState}</em></div><div className="top-right"><span className="connection"><StatusDot state={system?.status?.configured ? "healthy" : "warn"} />{system?.status?.configured ? "DATABRICKS LIVE" : "SIMULATION"}</span><button className="focus-button" onClick={() => setFocusMode((v) => !v)}>{focusMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}</button><button onClick={() => setLauncherOpen(true)}><Command size={13} /> SPACE</button><span className="clock">{clock}</span></div></header>
    <nav className="workspace-rail">{WORKSPACES.map((n) => { const Icon = workspaceIcons[n - 1]; return <button key={n} className={workspace === n ? "active" : ""} onClick={() => setWorkspace(n)}><Icon size={16} /><span>{n}</span><small>{workspaceNames[n]}</small></button>; })}</nav>
    <section className="desktop">
      {workspace === 1 && <CommandWorkspace system={system} coreState={coreState} result={result} prepare={prepare} run={run} />}
      {workspace === 2 && <InvestigateWorkspace mode={mode} query={query} setQuery={setQuery} prepare={prepare} submit={submit} loading={loading} result={result} run={run} />}
      {workspace === 3 && <ForgeWorkspace query={query} setQuery={setQuery} submit={submit} loading={loading} result={result} run={run} recipes={profileData.recipes} selectedRecipe={selectedRecipe} selectRecipe={selectRecipe} />}
      {workspace === 4 && <ObserveWorkspace system={system} result={result} loading={loading} run={run} prepare={prepare} />}
      {workspace === 5 && <ArsenalWorkspace system={system} profileData={profileData} installed={installedPackages} togglePackage={togglePackage} query={query} setQuery={setQuery} loading={loading} result={result} prepare={prepare} run={run} />}
    </section>
    <footer className="statusbar"><span><HeartPulse size={12} /> SYSTEM <b>{system ? "NOMINAL" : "ACQUIRING"}</b></span><span><Database size={12} /> {system?.catalogs?.length || 0} CATALOGS</span><span><Workflow size={12} /> {system?.pipelines?.healthy ?? "—"} HEALTHY</span><span><Bot size={12} /> {system?.status?.modelConfigured ? "MODEL ONLINE" : "PLANNER READY"}</span><span className="status-spacer" /><span>⌘/CTRL+SPACE LAUNCHER</span><span>⌘/CTRL+1..5 WORKSPACES</span><span>⌘/CTRL+F FOCUS</span></footer>

    {launcherOpen && <div className="overlay command-overlay" onMouseDown={() => setLauncherOpen(false)}><form className="launcher" onSubmit={(e) => { e.preventDefault(); if (launcherItems[0]) launch(launcherItems[0]); }} onMouseDown={(e) => e.stopPropagation()}><div className="launcher-kicker"><Radio size={12} /> NEURAL COMMAND SURFACE <span>ROUTER ONLINE</span></div><div className="launcher-search"><span>❯</span><input autoFocus value={launcherQuery} onChange={(e) => setLauncherQuery(e.target.value)} placeholder="Issue a command, ask a question, acquire a workspace…" /></div><div className="launcher-list">{launcherItems.map((item, i) => <button type="button" key={`${item.type}-${item.key}`} onClick={() => launch(item)}><span className="launcher-index">{String(i + 1).padStart(2, "0")}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div><ChevronRight size={15} /></button>)}</div><div className="launcher-foot"><span>natural language accepted when no command matches</span><kbd>esc</kbd></div></form></div>}
    {helpOpen && <div className="overlay" onMouseDown={() => setHelpOpen(false)}><div className="hotkeys" onMouseDown={(e) => e.stopPropagation()}><header><div><Command size={17} /><strong>OPERATOR KEYBINDINGS</strong></div><button onClick={() => setHelpOpen(false)}><X size={16} /></button></header><div className="key-grid"><Key keys="SUPER + SPACE" label="Neural command surface" /><Key keys="SUPER + 1…5" label="Acquire workspace" /><Key keys="SUPER + ENTER" label="Execute current intent" /><Key keys="SUPER + F" label="Toggle focus mode" /><Key keys="SUPER + K" label="Keybinding matrix" /><Key keys="ESC" label="Collapse transient UI" /></div><p>The mouse is supported. Intent and muscle memory remain the center of gravity.</p></div></div>}
    {notice && <button className="toast" onClick={() => setNotice(null)}><TriangleAlert size={15} /><span>{notice}</span><X size={13} /></button>}
    {booting && <BootSequence onSkip={() => { try { sessionStorage.setItem("dataarchy.booted", "1"); } catch {} setBooting(false); }} />}
  </main>;
}

function Key({ keys, label }: { keys: string; label: string }) { return <div><kbd>{keys}</kbd><span>{label}</span></div>; }

function CommandWorkspace({ system, coreState, result, prepare, run }: any) {
  return <div className="grid command-grid workspace-acquire"><Pane title="CORE // OPERATOR INTELLIGENCE" icon={Bot} badge={coreState} className="core-pane" importance="primary"><AICore state={coreState} tools={result?.tools} /></Pane><Pane title="NOW // ENTERPRISE SIGNALS" icon={Activity} badge="LIVE" className="signals-pane" importance="secondary"><div className="signal-list">{(system?.signals || []).map((item: any) => <button key={item.label} onClick={() => prepare("ask", `Investigate ${item.label}. ${item.detail}`)}><span className={`signal-icon ${item.tone}`}>{item.tone === "good" ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}</span><span className="signal-main"><strong>{item.label}</strong><small>{item.detail}</small></span><b>{item.value}</b><MiniBars /><ChevronRight size={14} /></button>)}</div></Pane><Pane title="MESH // INTELLIGENCE TOPOLOGY" icon={Network} className="topology-pane" importance="secondary"><Topology active={coreState !== "OBSERVING"} /></Pane><Pane title="QUEUE // RECOMMENDED ACTION" icon={Bell} className="queue-pane" importance="secondary"><div className="queue-list"><button onClick={() => run("Investigate the highest-priority elevated enterprise signal and explain what changed.", "ask")}><span>01</span><div><strong>Investigate elevated signal</strong><small>Gather evidence before escalation</small></div><Sparkles size={14} /></button><button onClick={() => run("Diagnose all currently failed analytics workloads and stage the safest repairs.", "fix")}><span>02</span><div><strong>Repair failed analytics</strong><small>{system?.pipelines?.failed || 0} failed pipeline(s) detected</small></div><Zap size={14} /></button><button onClick={() => prepare("watch", "Create an intelligent watch for our most volatile operational metric.")}><span>03</span><div><strong>Create intelligent watch</strong><small>Baseline → anomaly → evidence → escalation</small></div><Radar size={14} /></button></div><div className="command-hero"><small>ISSUE INTENT</small><button onClick={() => prepare("ask")}><span>What are we trying to accomplish?</span><kbd>⌘ SPACE</kbd></button></div></Pane></div>;
}

function InvestigateWorkspace({ mode, query, setQuery, prepare, submit, loading, result, run }: any) {
  const stages = result?.trace || intentStages[mode as Mode];
  return <div className="grid investigate-grid workspace-acquire"><Pane title="INTENT // ANALYTICS AGENT" icon={Bot} badge={modeMeta[mode as Mode].label} className="agent-pane" importance="primary" actions={<RiskBadge result={result} />}><ModeStrip mode={mode} onChoose={(m) => prepare(m, undefined, false)} /><div className="conversation"><div className="system-line"><span>D/</span><div><small>OPERATOR</small><p>Give me the outcome. I’ll choose the Databricks machinery, show the tool path, and keep production changes behind a gate.</p></div></div>{!result && !loading && <div className="empty-state"><Crosshair size={40} /><h2>Acquire the question.</h2><p>{modeMeta[mode as Mode].hint}. Dataarchy will resolve context, gather evidence, validate the answer and keep the work inspectable.</p></div>}{loading && <div className="thinking"><div className="thinking-core"><i /><i /><i /></div><div><strong>{coreByMode[mode as Mode]}</strong><span>routing intent across governed tools…</span></div></div>}{result && <ResultView result={result} run={run} />}</div><form className="prompt" onSubmit={submit}><span className="prompt-prefix">❯</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What are we trying to accomplish?" /><button disabled={loading}><Play size={14} /></button></form></Pane><Pane title="EVIDENCE // ANALYTIC CONTEXT" icon={Braces} className="evidence-pane" importance="secondary"><div className="metric-big"><span>ACTIVE SIGNAL // ED BOARDING INDEX</span><strong>114.2</strong><em>+14.2%</em></div><MiniBars values={[31, 35, 39, 36, 44, 49, 47, 56, 62, 70, 79, 91, 87]} /><div className="dimension-list">{(result?.evidence?.length ? result.evidence.slice(0, 4).map((x: string, i: number) => [`Evidence ${i + 1}`, x]) : [["North campus", "+18.7%"], ["15:00–22:00", "+22.1%"], ["Medicine", "+11.4%"], ["Arrival volume", "+1.8%"]]).map(([a, b]: string[]) => <div key={a}><span>{a}</span><b>{b}</b></div>)}</div><div className="evidence-foot"><ShieldCheck size={14} /> governed context • lineage current • freshness 4m</div></Pane><Pane title="TRACE // OPERATOR PLAN" icon={GitBranch} className="trace-pane" importance="secondary">{stages.map((stage: string, i: number) => <div className="trace-row" key={stage}><span>{String(i + 1).padStart(2, "0")}</span><i className={result ? "done" : loading && i < 2 ? "running" : ""} /><b>{stage}</b><small>{result ? "complete" : loading && i < 2 ? "working" : "queued"}</small></div>)}{result?.tools?.length ? <div className="trace-tools"><small>TOOL PATH</small>{result.tools.map((tool: string) => <span key={tool}>{tool}</span>)}</div> : null}</Pane><Pane title="MESH // CONTEXT GRAPH" icon={Network} className="investigate-topology" importance="secondary"><Topology active={loading || !!result} /></Pane></div>;
}

function ForgeWorkspace({ query, setQuery, submit, loading, result, run, recipes, selectedRecipe, selectRecipe }: any) {
  const outputs = selectedRecipe?.outputs || ["pipeline.sql", "quality.yml", "contract.yml", "deployment.yml"];
  return <div className="grid forge-grid workspace-acquire"><Pane title="RECIPES // OPINIONATED DEFAULTS" icon={Boxes} className="recipe-pane" importance="secondary"><div className="recipe-list">{recipes.map((recipe: DataarchyRecipe, i: number) => <button key={recipe.id} className={selectedRecipe?.id === recipe.id ? "active" : ""} onClick={() => selectRecipe(recipe)}><span>{String(i + 1).padStart(2, "0")}</span><div><strong>{recipe.name}</strong><small>{recipe.description}</small></div><ChevronRight size={14} /></button>)}</div></Pane><Pane title="FORGE // INTENT TO ARTIFACT" icon={Hammer} badge="REVIEW-GATED" className="forge-pane" importance="primary" actions={<RiskBadge result={result} />}><div className="forge-header"><div><small>ACTIVE RECIPE</small><h2>{selectedRecipe?.name || "Production Data Product"}</h2><p>{selectedRecipe?.description}</p></div><div className="forge-pips">{[0, 1, 2, 3, 4, 5].map((x) => <i key={x} className={result ? "done" : loading && x < 3 ? "active" : x === 0 ? "active" : ""} />)}</div></div><form onSubmit={submit} className="forge-prompt"><label>DESCRIBE THE OUTCOME</label><textarea value={query} onChange={(e) => setQuery(e.target.value)} /><button disabled={loading}>{loading ? "COORDINATING AGENTS…" : "GENERATE BUILD PLAN"}<WandSparkles size={14} /></button></form><div className="forge-flow"><div><span>01</span><b>PROFILE</b><small>inputs + keys</small></div><ChevronRight /><div><span>02</span><b>CONTRACT</b><small>quality + schema</small></div><ChevronRight /><div><span>03</span><b>GENERATE</b><small>artifacts</small></div><ChevronRight /><div><span>04</span><b>VERIFY</b><small>tests + impact</small></div><ChevronRight /><div><span>05</span><b>STAGE</b><small>promotion gate</small></div></div>{result && <ResultView result={result} run={run} />}</Pane><Pane title="ARTIFACTS // GENERATED WORK" icon={Braces} className="artifact-pane" importance="secondary"><div className="file-list">{outputs.map((file: string, i: number) => <div className="file-row" key={file}><Braces size={13} /><span>{file}</span><small>{result ? i < 2 ? "generated" : "staged" : "pending"}</small></div>)}</div><div className="artifact-preview"><small>OPERATOR CONTRACT</small><pre>{result?.artifact || "# Generated work appears here\n# Every production mutation remains inspectable\n# Promotion requires explicit authorization"}</pre></div></Pane><Pane title="PROMOTION // PRODUCTION GATE" icon={Rocket} badge="LOCKED" className="promotion-pane" importance="secondary"><div className="gate-state"><Lock size={28} /><div><strong>Production remains untouched.</strong><p>Dataarchy can prepare, validate and diff the work. An operator must explicitly authorize promotion.</p></div></div><button className="gate-button" disabled={!result}><ShieldCheck size={14} /> REVIEW STAGED CHANGE</button></Pane></div>;
}

function ObserveWorkspace({ system, result, loading, run, prepare }: any) {
  return <div className="grid observe-grid workspace-acquire"><Pane title="RADAR // INTELLIGENT WATCHES" icon={Radar} badge="ACTIVE" className="radar-pane" importance="primary"><div className="radar-hero"><div className="radar-scope"><i /><i /><i /><span><Crosshair size={22} /></span></div><div><small>OBSERVABILITY DAEMON</small><h2>Watching for meaning, not noise.</h2><p>Baseline behavior, detect anomalies, acquire evidence, then escalate with context.</p></div></div><div className="watch-grid"><button onClick={() => prepare("watch", "Watch ED boarding for meaningful anomalies and gather explanatory context.")}><StatusDot state="active" /><div><strong>ED boarding</strong><small>adaptive baseline • 4m freshness</small></div><b>ARMED</b></button><button onClick={() => prepare("watch", "Watch claim denial rate and explain significant shifts by payer, facility and service line.")}><StatusDot state="active" /><div><strong>Claim denials</strong><small>payer + facility segmentation</small></div><b>ARMED</b></button><button onClick={() => prepare("watch", "Watch production data freshness across governed domains.")}><StatusDot state="healthy" /><div><strong>Data freshness</strong><small>enterprise governed domains</small></div><b>QUIET</b></button></div><button className="radar-action" onClick={() => run("Create an intelligent watch for the highest-value volatile enterprise metric.", "watch")}><Radar size={14} /> CREATE WATCH</button></Pane><Pane title="JOBS // EXECUTION PLANE" icon={Workflow} className="jobs-pane" importance="secondary"><div className="job-table"><div className="job-head"><span>job</span><span>state</span><span>runtime</span><span>owner</span></div>{(system?.jobs || []).map((job: any) => <button key={job.name} onClick={() => job.state.includes("FAIL") && run(`Diagnose ${job.name} and stage the safest repair.`, "fix")}><span><Workflow size={13} />{job.name}</span><span><StatusDot state={job.state} />{job.state}</span><span>{job.runtime}</span><span>{job.owner}</span></button>)}</div></Pane><Pane title="REPAIR // OPERATOR QUEUE" icon={Zap} badge={(system?.pipelines?.failed || 0) ? "ATTENTION" : "CLEAR"} className="repair-pane" importance="secondary"><div className="health-stats"><div><b>{system?.pipelines?.healthy ?? "—"}</b><span>healthy</span></div><div><b>{system?.pipelines?.degraded ?? "—"}</b><span>degraded</span></div><div className="bad"><b>{system?.pipelines?.failed ?? "—"}</b><span>failed</span></div></div><button className="terminal-action" onClick={() => run("Diagnose every currently failed analytics workload, determine blast radius, and stage repairs.", "fix")}><TerminalSquare size={14} /> dataarchy fix --failed --stage <span>↵</span></button>{loading && <div className="repair-working"><RotateCcw size={16} /> acquiring failure context…</div>}{result?.mode === "fix" && <ResultView result={result} run={run} />}</Pane><Pane title="EVENTS // SYSTEM TELEMETRY" icon={Radio} className="telemetry-pane" importance="secondary"><div className="event-stream"><div><span>10:02:14</span><i className="good" />lineage graph refreshed<b>UNITY</b></div><div><span>10:03:41</span><i className="warn" />ED boarding crossed adaptive band<b>WATCH</b></div><div><span>10:04:08</span><i className="good" />evidence acquisition complete<b>SCOUT</b></div><div><span>10:05:22</span><i className="bad" />referral_ingest run failed<b>JOBS</b></div><div><span>10:05:27</span><i className="info" />repair context staged<b>OPERATOR</b></div></div></Pane></div>;
}

function ArsenalWorkspace({ system, profileData, installed, togglePackage, query, setQuery, loading, result, prepare, run }: any) {
  function inspect(e: FormEvent) { e.preventDefault(); run(query, "explore"); }
  return <div className="grid arsenal-grid workspace-acquire"><Pane title="ARSENAL // CAPABILITY PACKAGES" icon={Package} badge={`${installed.length} ACTIVE`} className="packages-pane" importance="primary"><div className="package-list">{profileData.packages.map((pkg: DataarchyPackage) => { const active = installed.includes(pkg.id); return <button key={pkg.id} className={active ? "installed" : ""} onClick={() => togglePackage(pkg.id)}><div className="package-icon"><Package size={16} /></div><div><span><strong>{pkg.name}</strong><em>v{pkg.version}</em></span><p>{pkg.description}</p><small>{pkg.capabilities.join(" • ")}</small></div><b>{active ? "INSTALLED" : "INSTALL"}</b></button>; })}</div></Pane><Pane title="PROFILE // ENTERPRISE DEFAULTS" icon={Settings2} className="profile-pane" importance="secondary"><div className="profile-head"><small>{profileData.profile.name}</small><h2>{profileData.profile.philosophy}</h2></div><div className="defaults-grid">{Object.entries(profileData.profile.defaults).map(([key, value]) => <div key={key}><span>{key.replace(/([A-Z])/g, " $1")}</span><b>{value}</b></div>)}</div></Pane><Pane title="AGENTS // SPECIALIST ROSTER" icon={Bot} className="agents-pane" importance="secondary"><div className="agent-roster">{profileData.profile.agents.map(([name, description]: string[]) => <div key={name}><span><Bot size={13} /></span><div><strong>{name}</strong><small>{description}</small></div><b>READY</b></div>)}</div></Pane><Pane title="UNITY // GOVERNED ASSETS" icon={Database} className="catalog-pane" importance="secondary"><form className="asset-search" onSubmit={inspect}><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="catalog.schema.table" /><button disabled={loading}>INSPECT</button></form>{result?.table ? <ResultView result={result} run={run} /> : <div className="catalog-tree">{(system?.catalogs || []).map((catalog: string, i: number) => <button key={catalog} onClick={() => { prepare("explore", `${catalog}.default.sample_table`, false); }}><span>{i === 0 ? "◆" : "◇"}</span><strong>{catalog}</strong><small>{i === 0 ? "production" : "catalog"}</small><ChevronRight size={13} /></button>)}</div>}</Pane><Pane title="GUARDIAN // POLICY MATRIX" icon={ShieldCheck} badge="ENFORCED" className="guardian-pane" importance="secondary"><Policy name="PII / PHI classification" detail="required on governed domains" /><Policy name="Production mutation gate" detail="explicit operator approval" /><Policy name="Lineage capture" detail="required for managed assets" /><Policy name="AI action audit" detail="prompt, tools, evidence, outcome" /><Policy name="Package trust" detail="signed enterprise capabilities" warn /></Pane></div>;
}

function Policy({ name, detail, warn = false }: { name: string; detail: string; warn?: boolean }) {
  return <div className="policy-row"><span className={warn ? "warn" : "good"}>{warn ? <CircleAlert size={14} /> : <CheckCircle2 size={14} />}</span><div><strong>{name}</strong><small>{detail}</small></div><b>{warn ? "REVIEW" : "ON"}</b></div>;
}
