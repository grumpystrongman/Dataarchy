"use client";

import {
  Check, Download, FileUp, Palette, RotateCcw, Search, ShieldCheck, Sparkles,
  WandSparkles, X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { builtInThemes } from "@/lib/themes/builtins";
import { hexToRgb, type ThemeManifest, type ThemeValidation } from "@/lib/themes/schema";
import styles from "./theme-os.module.css";

const STORAGE_KEY = "dataarchy.theme.os";
const suggestions = [
  "dark synthwave mission control with restrained magenta and cyan",
  "desert-gold sovereign command deck with low motion",
  "clinical future hospital command center, teal and soft green",
  "retro amber CRT terminal for dense engineering work",
  "minimal translucent glass executive analytics room",
];

function applyTheme(theme: ThemeManifest) {
  const root = document.querySelector<HTMLElement>(".os");
  if (!root) return;
  const vars: Record<string, string> = {
    "--bg": theme.colors.background,
    "--bg-2": theme.colors.background2,
    "--panel": theme.colors.panel,
    "--panel-strong": theme.colors.panelStrong,
    "--panel-soft": theme.colors.panel,
    "--text": theme.colors.text,
    "--muted": theme.colors.muted,
    "--dim": theme.colors.dim,
    "--accent": theme.colors.accent,
    "--accent-2": theme.colors.accent2,
    "--accent-rgb": hexToRgb(theme.colors.accent),
    "--good": theme.colors.good,
    "--warn": theme.colors.warn,
    "--bad": theme.colors.bad,
    "--info": theme.colors.info,
    "--line": theme.colors.line,
    "--line-strong": theme.colors.accent,
    "--line-hot": theme.colors.accent2,
    "--theme-bg": theme.colors.background,
    "--theme-bg-2": theme.colors.background2,
    "--theme-panel": theme.colors.panel,
    "--theme-panel-strong": theme.colors.panelStrong,
    "--theme-glow": theme.colors.glow,
    "--theme-radius": `${theme.chrome.radius}px`,
  };
  Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
  root.dataset.themeId = theme.id;
  root.dataset.themePane = theme.chrome.pane;
  root.dataset.themeBorder = theme.chrome.border;
  root.dataset.themeButton = theme.chrome.button;
  root.dataset.themeMotion = theme.effects.motion;
  root.dataset.themeGlow = theme.effects.glow;
  root.dataset.themeGrid = String(theme.effects.grid);
  root.dataset.themeScanlines = String(theme.effects.scanlines);
  root.dataset.themeNoise = String(theme.effects.noise);
  root.dataset.themeVignette = String(theme.effects.vignette);
  root.dataset.themeCore = theme.widgets.aiCore;
  root.dataset.themeGraph = theme.widgets.graph;
  root.dataset.themeAlert = theme.widgets.alert;
  root.dataset.themeDensity = theme.density;
}

function Swatches({ theme }: { theme: ThemeManifest }) {
  return <div className={styles.swatches}>{[theme.colors.background2, theme.colors.panel, theme.colors.accent, theme.colors.accent2, theme.colors.warn, theme.colors.bad].map((color) => <i key={color} style={{ background: color }} />)}</div>;
}

function MiniPreview({ theme }: { theme: ThemeManifest }) {
  const previewStyle = {
    "--p-bg": theme.colors.background,
    "--p-panel": theme.colors.panel,
    "--p-text": theme.colors.text,
    "--p-muted": theme.colors.muted,
    "--p-accent": theme.colors.accent,
    "--p-accent2": theme.colors.accent2,
    "--p-line": theme.colors.line,
    "--p-radius": `${theme.chrome.radius}px`,
  } as React.CSSProperties;
  return <div className={`${styles.preview} ${styles[`pane_${theme.chrome.pane}`]} ${styles[`border_${theme.chrome.border}`]}`} style={previewStyle}>
    <header><span>D/</span><b>{theme.name.toUpperCase()}</b><i /></header>
    <section><div className={styles.previewCore}><i /><i /><b>D/</b></div><div><small>OPERATOR INTELLIGENCE</small><strong>READY</strong><span>governed analytics plane</span></div></section>
    <footer><div><i /><i /><i /><i /></div><span>ASK</span><span>BUILD</span><span>WATCH</span></footer>
  </div>;
}

function ThemeCard({ theme, active, onPreview, onApply }: { theme: ThemeManifest; active: boolean; onPreview: () => void; onApply: () => void }) {
  return <article className={`${styles.card} ${active ? styles.active : ""}`}>
    <button className={styles.cardMain} onClick={onPreview}>
      <MiniPreview theme={theme} />
      <div className={styles.cardCopy}><div><strong>{theme.name}</strong>{theme.builtIn && <em>BUILT-IN</em>}</div><p>{theme.description}</p><Swatches theme={theme} /><small>{theme.category} • {theme.effects.motion} motion • {theme.chrome.pane}</small></div>
    </button>
    <button className={styles.apply} onClick={onApply}>{active ? <><Check size={13} /> ACTIVE</> : "APPLY"}</button>
  </article>;
}

export default function ThemeOS() {
  const [open, setOpen] = useState(false);
  const [themes, setThemes] = useState<ThemeManifest[]>(builtInThemes);
  const [selected, setSelected] = useState<ThemeManifest>(builtInThemes[0]);
  const [activeId, setActiveId] = useState("aegis");
  const [query, setQuery] = useState("");
  const [forgePrompt, setForgePrompt] = useState("");
  const [generated, setGenerated] = useState<ThemeManifest | null>(null);
  const [validation, setValidation] = useState<ThemeValidation | null>(null);
  const [forgeSource, setForgeSource] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || "aegis";
    setActiveId(saved);
    fetch("/api/themes").then((r) => r.json()).then((body) => {
      if (Array.isArray(body?.themes) && body.themes.length) {
        setThemes(body.themes);
        const active = body.themes.find((theme: ThemeManifest) => theme.id === saved) || body.themes[0];
        setSelected(active);
        window.setTimeout(() => applyTheme(active), 0);
      }
    }).catch(() => {
      const active = builtInThemes.find((theme) => theme.id === saved) || builtInThemes[0];
      setSelected(active);
      window.setTimeout(() => applyTheme(active), 0);
    });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "t") {
        event.preventDefault(); setOpen((value) => !value);
      }
      if (event.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const active = themes.find((theme) => theme.id === activeId);
    if (active) applyTheme(active);
  }, [themes, activeId]);

  const filtered = useMemo(() => themes.filter((theme) => `${theme.name} ${theme.description} ${theme.tags.join(" ")} ${theme.category}`.toLowerCase().includes(query.toLowerCase())), [themes, query]);

  function applyPermanent(theme: ThemeManifest) {
    applyTheme(theme);
    setSelected(theme);
    setActiveId(theme.id);
    localStorage.setItem(STORAGE_KEY, theme.id);
    setNotice(`${theme.name} is now the active visual system.`);
  }

  function preview(theme: ThemeManifest) {
    setSelected(theme);
    applyTheme(theme);
  }

  function restoreActive() {
    const active = themes.find((theme) => theme.id === activeId) || builtInThemes[0];
    setSelected(active); applyTheme(active);
  }

  async function forge(event: FormEvent) {
    event.preventDefault();
    const prompt = forgePrompt.trim();
    if (!prompt) return;
    setBusy(true); setNotice(""); setGenerated(null); setValidation(null);
    try {
      const response = await fetch("/api/themes/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Theme Forge failed.");
      setGenerated(body.theme); setValidation(body.validation); setForgeSource(body.source || "forge");
      setSelected(body.theme); applyTheme(body.theme);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Theme Forge failed."); }
    finally { setBusy(false); }
  }

  async function install(theme: ThemeManifest) {
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/themes/install", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Theme installation failed.");
      setThemes((items) => [...items.filter((item) => item.id !== body.theme.id), body.theme]);
      setGenerated(body.theme); setValidation(body.validation); applyPermanent(body.theme);
      setNotice(`${body.theme.name} installed${body.storage?.durable ? " to the governed state volume" : " for this runtime"}.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Theme installation failed."); }
    finally { setBusy(false); }
  }

  function exportTheme(theme: ThemeManifest) {
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `${theme.id}.dataarchy-theme.json`; link.click();
    URL.revokeObjectURL(url);
  }

  async function importTheme(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const theme = JSON.parse(await file.text()) as ThemeManifest;
      await install(theme);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Theme file is not valid JSON."); }
    finally { event.target.value = ""; }
  }

  return <>
    <button className={styles.fab} onClick={() => setOpen(true)} title="Theme OS (Ctrl/Cmd+Shift+T)"><Palette size={17} /><span>THEMES</span></button>
    {open && <div className={styles.overlay} onMouseDown={() => { restoreActive(); setOpen(false); }}>
      <section className={styles.studio} onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.header}><div><Palette size={18} /><span><strong>THEME OS</strong><small>DEPLOYABLE VISUAL SYSTEMS // THEME FORGE</small></span></div><div><button onClick={() => importRef.current?.click()}><FileUp size={14} /> IMPORT</button><input ref={importRef} type="file" accept="application/json,.json" onChange={importTheme} hidden /><button onClick={() => exportTheme(selected)}><Download size={14} /> EXPORT</button><button onClick={() => { restoreActive(); setOpen(false); }}><X size={16} /></button></div></header>
        <div className={styles.body}>
          <aside className={styles.gallery}><div className={styles.search}><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search visual systems…" /></div><div className={styles.cards}>{filtered.map((theme) => <ThemeCard key={theme.id} theme={theme} active={theme.id === activeId} onPreview={() => preview(theme)} onApply={() => applyPermanent(theme)} />)}</div></aside>
          <main className={styles.detail}>
            <div className={styles.hero}><MiniPreview theme={selected} /><div><small>ACTIVE PREVIEW</small><h2>{selected.name}</h2><p>{selected.description}</p><Swatches theme={selected} /><div className={styles.tags}>{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className={styles.heroActions}><button onClick={() => applyPermanent(selected)}><Check size={14} /> SET ACTIVE</button><button onClick={() => exportTheme(selected)}><Download size={14} /> EXPORT PACK</button></div></div></div>
            <div className={styles.specGrid}><div><span>CHROME</span><b>{selected.chrome.pane} / {selected.chrome.border}</b></div><div><span>CONTROL</span><b>{selected.chrome.button}</b></div><div><span>MOTION</span><b>{selected.effects.motion}</b></div><div><span>AI CORE</span><b>{selected.widgets.aiCore}</b></div><div><span>GRAPH</span><b>{selected.widgets.graph}</b></div><div><span>DENSITY</span><b>{selected.density}</b></div></div>
            <form className={styles.forge} onSubmit={forge}><div className={styles.forgeTitle}><WandSparkles size={17} /><div><strong>THEME FORGE</strong><small>Describe a visual world. Dataarchy will build a constrained, installable theme manifest.</small></div></div><textarea value={forgePrompt} onChange={(event) => setForgePrompt(event.target.value)} placeholder="Example: Build a dark noir command deck with violet glass, restrained cyan telemetry, low motion, and executive readability." /><div className={styles.suggestions}>{suggestions.map((text) => <button type="button" key={text} onClick={() => setForgePrompt(text)}>{text}</button>)}</div><button className={styles.forgeButton} disabled={busy}>{busy ? <><RotateCcw size={14} className={styles.spin} /> FORGING…</> : <><Sparkles size={14} /> BUILD THEME</>}</button></form>
            {generated && <div className={styles.generated}><div><ShieldCheck size={17} /><span><strong>{generated.name}</strong><small>{forgeSource} • validation {validation?.score ?? 0}/100</small></span></div><p>{generated.description}</p>{validation?.warnings?.length ? <ul>{validation.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : <p className={styles.clean}>No validation warnings.</p>}<div><button onClick={() => preview(generated)}>PREVIEW</button><button onClick={() => install(generated)} disabled={busy || validation?.valid === false}>INSTALL + APPLY</button></div></div>}
            {notice && <div className={styles.notice}>{notice}</div>}
          </main>
        </div>
        <footer className={styles.footer}><span><ShieldCheck size={12} /> Generated themes are token-only: no arbitrary CSS, scripts, URLs, or assets.</span><kbd>⌘/CTRL + SHIFT + T</kbd></footer>
      </section>
    </div>}
  </>;
}
