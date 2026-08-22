"use client";

import {
  Activity, Bot, Boxes, Braces, CheckCircle2, ChevronRight, CircleAlert,
  Command, Database, Eye, Gauge, GitBranch, Hammer, HeartPulse, Layers3,
  Network, Play, Search, Settings2, ShieldCheck, Sparkles, TerminalSquare,
  TriangleAlert, WandSparkles, Workflow, X, Zap
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Mode = "ask" | "explore" | "build" | "fix" | "watch";
type Workspace = 1 | 2 | 3 | 4;
type Theme = "ember" | "oxide" | "mono";

type SystemData = {
  source: string;
  status?: { configured: boolean; warehouseConfigured: boolean; genieConfigured: boolean };
  warning?: string;
  signals: Array<{ label: string; value: string; tone: string; detail: string }>;
  pipelines: { healthy: number; degraded: number; failed: number };
  catalogs: string[];
  jobs: Array<{ name: string; state: string; runtime: string; owner: string }>;
};

type ActionResult = {
  source?: string;
  title?: string;
  summary?: string;
  confidence?: number;
  evidence?: string[];
  next?: string[];
  artifact?: string;
  warning?: string;
  genie?: any;
  table?: any;
  failedRuns?: any[];
};

const modeMeta: Record<Mode, { label: string; icon: any; hint: string; defaultQuery: string }> = {
  ask: { label: "ASK", icon: Sparkles, hint: "Investigate a business question", defaultQuery: "Why did ED boarding spike today?" },
  explore: { label: "EXPLORE", icon: Eye, hint: "Understand data, lineage and quality", defaultQuery: "enterprise.clinical.encounter" },
  build: { label: "BUILD", icon: Hammer, hint: "Design a production data product", defaultQuery: "Build a claims pipeline from our daily raw feed" },
  fix: { label: "FIX", icon: Zap, hint: "Diagnose broken analytics", defaultQuery: "Why did referral_ingest fail?" },
  watch: { label: "WATCH", icon: Gauge, hint: "Create intelligent monitoring", defaultQuery: "Watch ED boarding and tell me when it gets weird" },
};

const workspaceNames: Record<Workspace, string> = { 1: "OPERATE", 2: "INVESTIGATE", 3: "BUILD", 4: "GOVERN" };

function MiniBars({ values = [36, 44, 39, 52, 48, 64, 62, 72, 68, 79, 91, 86] }: { values?: number[] }) {
  return <div className="mini-bars" aria-label="trend visualization">{values.map((v, i) => <span key={i} style={{ height: `${v}%` }} />)}</div>;
}

function Window({ title, icon: Icon, badge, children, className = "", actions }: any) {
  return (
    <section className={`window ${className}`}>
      <header className="window-titlebar">
        <div className="window-title"><Icon size={14} /><span>{title}</span>{badge && <em>{badge}</em>}</div>
        <div className="window-actions">{actions}<span /><span /><span /></div>
      </header>
      <div className="window-body">{children}</div>
    </section>
  );
}

function StatusDot({ state }: { state: string }) {
  const normalized = state.toLowerCase();
  const tone = normalized.includes("success") || normalized.includes("healthy") ? "good" : normalized.includes("run") ? "info" : normalized.includes("fail") ? "bad" : "warn";
  return <span className={`status-dot ${tone}`} />;
}

export default function DataarchyOS() {
  const [workspace, setWorkspace] = useState<Workspace>(1);
  const [mode, setMode] = useState<Mode>("ask");
  const [query, setQuery] = useState(modeMeta.ask.defaultQuery);
  const [system, setSystem] = useState<SystemData | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("ember");
  const [notice, setNotice] = useState<string | null>(null);
  const [clock, setClock] = useState("");
  const [launcherQuery, setLauncherQuery] = useState("");

  useEffect(() => {
    fetch("/api/system").then(r => r.json()).then(setSystem).catch(() => setSystem(null));
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date()));
    tick(); const id = setInterval(tick, 15000); return () => clearInterval(id);
  }, []);

  const chooseMode = useCallback((next: Mode, openWorkspace = true) => {
    setMode(next); setQuery(modeMeta[next].defaultQuery); setResult(null);
    if (openWorkspace) setWorkspace(next === "build" ? 3 : next === "explore" ? 4 : 2);
    setLauncherOpen(false);
  }, []);

  const run = useCallback(async (override?: string) => {
    const text = (override ?? query).trim();
    if (!text) return;
    setLoading(true); setResult(null);
    try {
      const response = await fetch("/api/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, query: text }) });
      const body = await response.json();
      setResult(body);
      setWorkspace(mode === "build" ? 3 : mode === "explore" ? 4 : 2);
      if (body.warning) setNotice(body.warning);
    } catch {
      setNotice("Action failed. Check the local service and try again.");
    } finally { setLoading(false); }
  }, [mode, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.code === "Space") { e.preventDefault(); setLauncherOpen(v => !v); }
      if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); setHelpOpen(v => !v); }
      if (mod && ["1","2","3","4"].includes(e.key)) { e.preventDefault(); setWorkspace(Number(e.key) as Workspace); }
      if (mod && e.key === "Enter") { e.preventDefault(); run(); }
      if (e.key === "Escape") { setLauncherOpen(false); setHelpOpen(false); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [run]);

  const launcherItems = useMemo(() => [
    ...Object.entries(modeMeta).map(([key, value]) => ({ type: "action", key, label: value.label, detail: value.hint })),
    ...Object.entries(workspaceNames).map(([key, value]) => ({ type: "workspace", key, label: `Workspace ${key}: ${value}`, detail: "Switch workspace" })),
    { type: "theme", key: "oxide", label: "Theme: Oxide", detail: "Warm copper + charcoal" },
    { type: "theme", key: "mono", label: "Theme: Mono", detail: "Quiet monochrome" },
    { type: "theme", key: "ember", label: "Theme: Ember", detail: "Dataarchy default" },
  ].filter(item => `${item.label} ${item.detail}`.toLowerCase().includes(launcherQuery.toLowerCase())), [launcherQuery]);

  function launch(item: any) {
    if (item.type === "action") chooseMode(item.key as Mode);
    if (item.type === "workspace") { setWorkspace(Number(item.key) as Workspace); setLauncherOpen(false); }
    if (item.type === "theme") { setTheme(item.key); setLauncherOpen(false); }
  }

  function submit(e: FormEvent) { e.preventDefault(); run(); }

  return (
    <main className={`os theme-${theme}`}>
      <div className="wallpaper-orb orb-a" /><div className="wallpaper-orb orb-b" />
      <header className="topbar">
        <button className="brand" onClick={() => setLauncherOpen(true)}><span className="brand-mark">D/</span><strong>DATAARCHY</strong></button>
        <div className="top-center"><span>ws:{workspace}</span><b>{workspaceNames[workspace]}</b><i>{system?.source || "booting"}</i></div>
        <div className="top-right">
          <span className={`connection ${system?.status?.configured ? "live" : "demo"}`}><StatusDot state={system?.status?.configured ? "healthy" : "warn"} />{system?.status?.configured ? "DATABRICKS" : "DEMO"}</span>
          <button onClick={() => setHelpOpen(true)}><Command size={14} /> K</button><span>{clock}</span>
        </div>
      </header>

      <div className="workspace-rail">
        {[1,2,3,4].map(n => <button key={n} className={workspace === n ? "active" : ""} onClick={() => setWorkspace(n as Workspace)}><span>{n}</span>{workspaceNames[n as Workspace]}</button>)}
      </div>

      <div className="desktop">
        {workspace === 1 && <Operate system={system} onInvestigate={() => chooseMode("ask")} onFix={() => chooseMode("fix")} />}
        {workspace === 2 && <Investigate mode={mode} setMode={chooseMode} query={query} setQuery={setQuery} submit={submit} loading={loading} result={result} run={run} />}
        {workspace === 3 && <Build query={query} setQuery={setQuery} submit={submit} loading={loading} result={result} chooseMode={chooseMode} />}
        {workspace === 4 && <Govern system={system} query={query} setQuery={setQuery} submit={submit} loading={loading} result={result} chooseMode={chooseMode} />}
      </div>

      <footer className="statusbar">
        <span><HeartPulse size={13} /> platform <b>{system ? "ready" : "starting"}</b></span>
        <span><Database size={13} /> {system?.catalogs?.length || 0} catalogs</span>
        <span><Workflow size={13} /> {system?.pipelines?.healthy ?? "—"} healthy</span>
        <span className="status-spacer" />
        <span>SUPER+SPACE launcher</span><span>SUPER+1..4 workspaces</span>
      </footer>

      {launcherOpen && <div className="overlay" onMouseDown={() => setLauncherOpen(false)}>
        <div className="launcher" onMouseDown={e => e.stopPropagation()}>
          <div className="launcher-search"><Search size={18} /><input autoFocus value={launcherQuery} onChange={e => setLauncherQuery(e.target.value)} placeholder="Run an action, switch workspace, change theme…" /></div>
          <div className="launcher-list">{launcherItems.map((item, i) => <button key={`${item.type}-${item.key}`} onClick={() => launch(item)}><span className="launcher-index">{String(i + 1).padStart(2,"0")}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div><ChevronRight size={16} /></button>)}</div>
          <div className="launcher-foot"><span>Dataarchy menu</span><kbd>esc</kbd></div>
        </div>
      </div>}

      {helpOpen && <div className="overlay" onMouseDown={() => setHelpOpen(false)}>
        <div className="hotkeys" onMouseDown={e => e.stopPropagation()}>
          <header><div><Command size={18} /><strong>KEYBINDINGS</strong></div><button onClick={() => setHelpOpen(false)}><X size={17}/></button></header>
          <div className="key-grid">
            <Key keys="SUPER + SPACE" label="Open Dataarchy launcher" /><Key keys="SUPER + 1…4" label="Switch analytics workspace" /><Key keys="SUPER + ENTER" label="Run current intent" /><Key keys="SUPER + K" label="Show keybindings" />
            <Key keys="ESC" label="Dismiss overlay" /><Key keys="CLICK D/" label="Open launcher" />
          </div>
          <p>Keyboard-first by design. The mouse works; it just isn’t the center of gravity.</p>
        </div>
      </div>}

      {notice && <button className="toast" onClick={() => setNotice(null)}><TriangleAlert size={16}/><span>{notice}</span><X size={14}/></button>}
    </main>
  );
}

function Key({ keys, label }: { keys: string; label: string }) { return <div><kbd>{keys}</kbd><span>{label}</span></div>; }

function Operate({ system, onInvestigate, onFix }: any) {
  const s = system;
  return <div className="grid operate-grid">
    <Window title="NOW // ENTERPRISE SIGNALS" icon={Activity} badge="LIVE" className="signals-window">
      <div className="signal-list">{(s?.signals || []).map((item: any) => <button key={item.label} onClick={onInvestigate}>
        <span className={`signal-icon ${item.tone}`}>{item.tone === "good" ? <CheckCircle2 size={17}/> : <TriangleAlert size={17}/>}</span>
        <span className="signal-main"><strong>{item.label}</strong><small>{item.detail}</small></span><b>{item.value}</b><MiniBars values={item.tone === "good" ? [45,42,48,50,58,60,67,70] : undefined}/><ChevronRight size={15}/>
      </button>)}</div>
    </Window>
    <Window title="PLATFORM // HEALTH" icon={HeartPulse} className="health-window">
      <div className="health-hero"><div className="health-number">{s?.pipelines?.healthy ?? "—"}</div><div><strong>pipelines healthy</strong><span>across production domains</span></div></div>
      <div className="health-stats"><div><b>{s?.pipelines?.degraded ?? "—"}</b><span>degraded</span></div><div className="bad"><b>{s?.pipelines?.failed ?? "—"}</b><span>failed</span></div><div><b>{s?.catalogs?.length ?? "—"}</b><span>catalogs</span></div></div>
      <button className="terminal-action" onClick={onFix}><TerminalSquare size={15}/> dataarchy fix --failed <span>↵</span></button>
    </Window>
    <Window title="JOBS // RECENT EXECUTION" icon={Workflow} className="jobs-window">
      <div className="job-table"><div className="job-head"><span>job</span><span>state</span><span>runtime</span><span>owner</span></div>{(s?.jobs || []).map((job: any) => <button key={job.name} onClick={job.state.includes("FAIL") ? onFix : undefined}><span><Workflow size={14}/>{job.name}</span><span><StatusDot state={job.state}/>{job.state}</span><span>{job.runtime}</span><span>{job.owner}</span></button>)}</div>
    </Window>
    <Window title="DAEMON // AI OPERATIONS" icon={Bot} className="daemon-window" badge="ACTIVE">
      <div className="daemon-mark"><WandSparkles size={32}/></div><h2>Good morning.</h2><p>I’m watching the analytics estate. One failed pipeline and three elevated business signals deserve attention.</p>
      <div className="daemon-actions"><button onClick={onInvestigate}>Investigate signals <ChevronRight size={14}/></button><button onClick={onFix}>Repair failed job <ChevronRight size={14}/></button></div>
      <div className="daemon-log"><span>08:59</span> profiled enterprise freshness <b>✓</b><span>09:03</span> detected ED boarding anomaly <b>!</b><span>09:07</span> checked lineage + recent changes <b>✓</b></div>
    </Window>
  </div>;
}

function ModeStrip({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return <div className="mode-strip">{(Object.keys(modeMeta) as Mode[]).map(m => { const Icon = modeMeta[m].icon; return <button key={m} className={mode === m ? "active" : ""} onClick={() => setMode(m)}><Icon size={14}/>{modeMeta[m].label}</button>; })}</div>;
}

function Investigate({ mode, setMode, query, setQuery, submit, loading, result, run }: any) {
  return <div className="grid investigate-grid">
    <Window title="INTENT // ANALYTICS AGENT" icon={Bot} badge={modeMeta[mode as Mode].label} className="agent-window">
      <ModeStrip mode={mode} setMode={setMode}/>
      <div className="conversation">
        <div className="system-line"><span>D/</span><p>Give me the outcome you want. I’ll choose the Databricks machinery.</p></div>
        {result && <Result result={result} run={run}/>} {!result && !loading && <div className="empty-state"><Network size={38}/><h2>Intent in. Analytics out.</h2><p>{modeMeta[mode as Mode].hint}. Dataarchy will gather context, choose tools, validate evidence, and keep the underlying work inspectable.</p></div>}
        {loading && <div className="thinking"><span/><span/><span/><b>routing intent across analytics tools…</b></div>}
      </div>
      <form className="prompt" onSubmit={submit}><span className="prompt-prefix">❯</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="What are we trying to accomplish?"/><button disabled={loading}><Play size={15}/></button></form>
    </Window>
    <Window title="EVIDENCE // ANALYTIC CONTEXT" icon={Braces} className="evidence-window">
      <div className="metric-big"><span>ED BOARDING INDEX</span><strong>114.2</strong><em>+14.2%</em></div><MiniBars values={[33,38,40,36,43,46,48,52,58,65,72,82,91,88]}/>
      <div className="dimension-list"><div><span>North campus</span><b>+18.7%</b></div><div><span>15:00–22:00</span><b>+22.1%</b></div><div><span>Medicine</span><b>+11.4%</b></div><div><span>Arrival volume</span><b>+1.8%</b></div></div>
      <div className="evidence-foot"><ShieldCheck size={15}/> governed metrics • freshness 4m • lineage current</div>
    </Window>
    <Window title="TRACE // REASONING PLAN" icon={GitBranch} className="trace-window">
      {["Find authoritative metric", "Compare recent baseline", "Segment anomaly", "Trace upstream changes", "Test competing hypotheses", "Produce evidence-backed answer"].map((x,i) => <div className="trace-row" key={x}><span>{String(i+1).padStart(2,"0")}</span><i className={result ? "done" : i < 2 ? "running" : ""}/><b>{x}</b><small>{result ? "complete" : i < 2 ? "working" : "queued"}</small></div>)}
    </Window>
  </div>;
}

function Result({ result, run }: { result: ActionResult; run: (q?: string) => void }) {
  if (result.genie) return <div className="result-card"><div className="result-head"><Sparkles size={17}/><strong>Genie response received</strong><em>Databricks</em></div><p>Dataarchy has handed the question to your configured Genie space. The raw response is available for the shell to render into richer cards as your space conventions are defined.</p><pre>{JSON.stringify(result.genie, null, 2).slice(0,2200)}</pre></div>;
  if (result.table) return <div className="result-card"><div className="result-head"><Database size={17}/><strong>{result.table.full_name || result.table.name}</strong><em>Unity Catalog</em></div><p>{result.table.comment || "Governed Unity Catalog table."}</p><div className="facts"><span>owner <b>{result.table.owner || "—"}</b></span><span>format <b>{result.table.data_source_format || "—"}</b></span><span>type <b>{result.table.table_type || "—"}</b></span></div><pre>{JSON.stringify(result.table.columns?.slice(0,8) || [], null, 2)}</pre></div>;
  if (result.failedRuns) return <div className="result-card"><div className="result-head"><Zap size={17}/><strong>Failed runs discovered</strong><em>Jobs API</em></div><pre>{JSON.stringify(result.failedRuns, null, 2).slice(0,2400)}</pre></div>;
  return <div className="result-card"><div className="result-head"><Sparkles size={17}/><strong>{result.title || "Analysis"}</strong>{typeof result.confidence === "number" && <em>{Math.round(result.confidence*100)}% confidence</em>}</div><p>{result.summary}</p>{result.evidence && <div className="evidence-list">{result.evidence.map((x,i)=><div key={x}><span>{i+1}</span><p>{x}</p></div>)}</div>}{result.artifact && <pre>{result.artifact}</pre>}{result.next && <div className="next-actions">{result.next.map(x=><button key={x} onClick={() => run(x)}>{x}<ChevronRight size={13}/></button>)}</div>}<small className="source-tag">source: {result.source || "dataarchy"}</small></div>;
}

function Build({ query, setQuery, submit, loading, result, chooseMode }: any) {
  const recipes = [
    ["New data source","Bronze → Validated → Gold","01"],["Data product","Contract + quality + semantic","02"],["Predictive model","Features → train → serve → monitor","03"],["Genie domain","Curate metrics + instructions + examples","04"],["Executive dashboard","Metrics → narrative → publish","05"],["Streaming monitor","Signal → anomaly → route → explain","06"],
  ];
  return <div className="grid build-grid">
    <Window title="RECIPES // OPINIONATED DEFAULTS" icon={Boxes} className="recipes-window"><div className="recipe-list">{recipes.map(([name,detail,num])=><button key={name} onClick={()=>{chooseMode("build",false);setQuery(`${name}: ${detail}`)}}><span>{num}</span><div><strong>{name}</strong><small>{detail}</small></div><ChevronRight size={15}/></button>)}</div></Window>
    <Window title="BUILDER // INTENT TO ARTIFACT" icon={Hammer} badge="REVIEW-FIRST" className="builder-window">
      <div className="builder-header"><div><span>ACTIVE RECIPE</span><h2>Production Data Product</h2></div><div className="step-pips"><i className="active"/><i className="active"/><i/><i/><i/></div></div>
      <form onSubmit={submit} className="build-prompt"><label>describe the outcome</label><textarea value={query} onChange={e=>setQuery(e.target.value)} /><button disabled={loading}>{loading ? "planning…" : "Generate build plan"}<WandSparkles size={15}/></button></form>
      <div className="build-contract"><div><span>INGEST</span><b>incremental</b></div><ChevronRight/><div><span>VALIDATE</span><b>expectations</b></div><ChevronRight/><div><span>MODEL</span><b>gold</b></div><ChevronRight/><div><span>SHIP</span><b>review gate</b></div></div>
      {result && <Result result={result} run={()=>{}}/>}
    </Window>
    <Window title="ARTIFACTS // GENERATED WORK" icon={Braces} className="artifact-window">
      {["pipeline.sql","quality.yml","data_contract.yml","deployment.yml","README.md"].map((f,i)=><div className="file-row" key={f}><Braces size={14}/><span>{f}</span><small>{i < 2 && result ? "generated" : result ? "staged" : "pending"}</small></div>)}
      <div className="artifact-note"><ShieldCheck size={16}/><p>Nothing mutates production until the operator reviews and promotes the generated artifacts.</p></div>
    </Window>
  </div>;
}

function Govern({ system, query, setQuery, submit, loading, result, chooseMode }: any) {
  return <div className="grid govern-grid">
    <Window title="UNITY // CATALOGS" icon={Database} className="catalog-window"><div className="catalog-tree">{(system?.catalogs || []).map((c:string,i:number)=><button key={c} onClick={()=>{chooseMode("explore",false);setQuery(`${c}.default.sample_table`)}}><span>{i===0?"◆":"◇"}</span><strong>{c}</strong><small>{i===0?"production":"catalog"}</small><ChevronRight size={14}/></button>)}</div></Window>
    <Window title="EXPLORER // ASSET INTELLIGENCE" icon={Search} className="explorer-window">
      <form className="asset-search" onSubmit={submit}><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="catalog.schema.table"/><button disabled={loading}>inspect</button></form>
      {result ? <Result result={result} run={()=>{}}/> : <div className="asset-empty"><Layers3 size={42}/><h2>Inspect any governed asset.</h2><p>Profile schema, ownership, freshness, quality, usage and lineage without hunting through product menus.</p></div>}
    </Window>
    <Window title="GUARDIAN // POLICY" icon={ShieldCheck} badge="ENFORCED" className="policy-window">
      <Policy name="PII / PHI classification" detail="required on governed domains" ok/><Policy name="Production mutation gate" detail="human approval required" ok/><Policy name="Lineage capture" detail="automatic for managed assets" ok/><Policy name="Data contract" detail="warning: 3 legacy assets" warn/><Policy name="AI action audit" detail="prompt, tool, evidence, outcome" ok/>
      <button className="policy-edit"><Settings2 size={14}/> open enterprise defaults</button>
    </Window>
  </div>;
}

function Policy({name,detail,ok,warn}:{name:string;detail:string;ok?:boolean;warn?:boolean}) { return <div className="policy-row"><span className={warn?"warn":"good"}>{ok?<CheckCircle2 size={15}/>:<CircleAlert size={15}/>}</span><div><strong>{name}</strong><small>{detail}</small></div><b>{warn?"REVIEW":"ON"}</b></div> }
