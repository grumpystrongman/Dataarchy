"use client";

import { Archive, Bot, CheckCircle2, ChevronRight, CircleAlert, Clock3, Database, FileCode2, GitBranch, Lock, Radio, ShieldCheck, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./mission-drawer.module.css";

type MissionStatus = "complete" | "staged" | "authorized" | "failed";

type Mission = {
  id: string;
  mode: string;
  query: string;
  title: string;
  summary: string;
  status: MissionStatus;
  execution: string;
  source: string;
  tools: string[];
  trace: string[];
  risk: { level?: string; productionMutation?: boolean; approvalRequired?: boolean };
  result: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  events: Array<{ at: string; type: string; actor: string; detail: string }>;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function statusLabel(status: MissionStatus) {
  if (status === "staged") return "REVIEW";
  if (status === "authorized") return "AUTHORIZED";
  if (status === "failed") return "FAILED";
  return "COMPLETE";
}

export default function MissionDrawer() {
  const [open, setOpen] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [storage, setStorage] = useState("acquiring");
  const [loading, setLoading] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch("/api/missions?limit=50", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok && !Array.isArray(body.missions)) throw new Error(body.error || "Mission history unavailable");
      const next = Array.isArray(body.missions) ? body.missions : [];
      setMissions(next);
      setStorage(body.storage || body.storageStatus?.mode || "unknown");
      setError(body.error || null);
      if (selectedId && !next.some((mission: Mission) => mission.id === selectedId)) setSelectedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mission history unavailable");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    refresh(true);
    const intervalId = window.setInterval(() => refresh(true), 8000);
    const onMission = () => refresh(true);
    window.addEventListener("dataarchy:mission-created", onMission);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("dataarchy:mission-created", onMission);
    };
  }, [refresh]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.shiftKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const selected = useMemo(() => missions.find((mission) => mission.id === selectedId) || missions[0] || null, [missions, selectedId]);

  async function authorize(mission: Mission) {
    if (mission.status !== "staged" || authorizing) return;
    setAuthorizing(true);
    setError(null);
    try {
      const response = await fetch(`/api/missions/${encodeURIComponent(mission.id)}/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: "local operator" }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Authorization failed");
      await refresh(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authorization failed");
    } finally {
      setAuthorizing(false);
    }
  }

  return <>
    <button className={styles.launcher} onClick={() => setOpen(true)} aria-label="Open mission console">
      <span className={styles.launcherPulse}><Archive size={15} /></span>
      <span><small>MISSION MEMORY</small><b>{missions.length ? `${missions.length} RECENT` : "READY"}</b></span>
      <kbd>⇧⌘M</kbd>
    </button>

    {open && <div className={styles.overlay} onMouseDown={() => setOpen(false)}>
      <aside className={styles.drawer} onMouseDown={(event) => event.stopPropagation()} aria-label="Mission memory console">
        <header className={styles.header}>
          <div><span className={styles.headerIcon}><Archive size={17} /></span><div><small>DATAARCHY // DURABLE OPERATOR MEMORY</small><h2>MISSIONS</h2></div></div>
          <div className={styles.headerActions}><span className={styles.storage}><Database size={11} />{storage.toUpperCase()}</span><button onClick={() => setOpen(false)} aria-label="Close mission console"><X size={16} /></button></div>
        </header>

        <div className={styles.body}>
          <section className={styles.listPane}>
            <div className={styles.listHeader}><span>RECENT OPERATIONS</span><button onClick={() => refresh()} disabled={loading}><Radio size={11} />{loading ? "ACQUIRING" : "REFRESH"}</button></div>
            <div className={styles.list}>
              {!missions.length && <div className={styles.empty}><Sparkles size={25} /><strong>No missions recorded yet.</strong><p>Run an ASK, BUILD, FIX, WATCH, or EXPLORE action. Dataarchy will preserve the operator object here.</p></div>}
              {missions.map((mission, index) => <button key={mission.id} className={`${styles.missionRow} ${(selected?.id === mission.id) ? styles.selected : ""}`} onClick={() => setSelectedId(mission.id)}>
                <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
                <div><span><strong>{mission.title}</strong><em className={`${styles.status} ${styles[mission.status]}`}>{statusLabel(mission.status)}</em></span><p>{mission.query}</p><small>{mission.mode.toUpperCase()} // {formatTime(mission.updatedAt)}</small></div>
                <ChevronRight size={14} />
              </button>)}
            </div>
          </section>

          <section className={styles.detailPane}>
            {selected ? <>
              <div className={styles.detailHero}>
                <div className={styles.detailKicker}><span>{selected.mode.toUpperCase()} MISSION</span><em>{selected.id.slice(0, 8)}</em></div>
                <h3>{selected.title}</h3>
                <p>{selected.summary}</p>
                <div className={styles.meta}><span><Clock3 size={11} />{formatTime(selected.createdAt)}</span><span><Bot size={11} />{selected.source}</span><span><Lock size={11} />{selected.risk?.level || "read-only"}</span></div>
              </div>

              <div className={styles.section}><small>OPERATOR INTENT</small><blockquote>{selected.query}</blockquote></div>
              {!!selected.tools?.length && <div className={styles.section}><small>TOOL PATH</small><div className={styles.chips}>{selected.tools.map((tool) => <span key={tool}>{tool}</span>)}</div></div>}
              {!!selected.trace?.length && <div className={styles.section}><small>EXECUTION TRACE</small><div className={styles.trace}>{selected.trace.map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, "0")}</span><i /><b>{step}</b><CheckCircle2 size={12} /></div>)}</div></div>}
              {!!selected.result?.evidence?.length && <div className={styles.section}><small>EVIDENCE</small><div className={styles.evidence}>{selected.result.evidence.map((item: string, index: number) => <div key={`${item}-${index}`}><span>{index + 1}</span><p>{item}</p></div>)}</div></div>}
              {selected.result?.artifact && <div className={styles.section}><small>STAGED ARTIFACT</small><pre className={styles.artifact}>{String(selected.result.artifact)}</pre></div>}
              <div className={styles.section}><small>AUDIT TRAIL</small><div className={styles.events}>{selected.events.map((event, index) => <div key={`${event.at}-${index}`}><GitBranch size={11} /><span>{formatTime(event.at)}</span><p>{event.detail}</p><b>{event.actor}</b></div>)}</div></div>

              {selected.status === "staged" && <div className={styles.authorization}>
                <div><ShieldCheck size={22} /><span><strong>Operator gate required</strong><small>Authorization records approval. It does not itself mutate production.</small></span></div>
                <button onClick={() => authorize(selected)} disabled={authorizing}>{authorizing ? "AUTHORIZING…" : "AUTHORIZE STAGED MISSION"}</button>
              </div>}

              {selected.status === "authorized" && <div className={`${styles.authorization} ${styles.authorizedBox}`}><div><CheckCircle2 size={22} /><span><strong>Mission authorized</strong><small>The approval event is now part of the governed mission record.</small></span></div></div>}
            </> : <div className={styles.detailEmpty}><FileCode2 size={35} /><h3>Mission detail</h3><p>Select an operator mission to inspect its evidence, tool path, artifacts, and audit events.</p></div>}
          </section>
        </div>
        {error && <div className={styles.error}><CircleAlert size={13} />{error}</div>}
      </aside>
    </div>}
  </>;
}
