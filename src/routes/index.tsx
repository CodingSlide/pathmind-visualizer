import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Brain, Settings2, Play, Pause, RotateCcw, StepForward, Box, Trash2, Square, Eraser,
  Flag, MapPin, Network, Route as RouteIcon, Timer, CheckCircle2, XCircle, Activity,
  Table2, BarChart3, Clock, Download, Crown,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Cell, LabelList,
} from "recharts";
import {
  ALGOS, emptyGrid, generateMaze, timeSearch, type Algo, type Grid, type Heuristic,
} from "@/lib/search";
import { Button } from "@/components/ui/button";
import { AlgorithmGuide } from "@/components/algorithm-guide";
import { ChessArena } from "@/components/chess-arena";
import { comparisonCsv, downloadComparison } from "@/lib/comparison-csv";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PathMind AI — Search Algorithm Visualizer" },
      { name: "description", content: "Compare pathfinding algorithms, export measured results, and watch minimax versus alpha-beta AI chess in PathMind AI." },
      { property: "og:title", content: "PathMind AI — Search Algorithm Visualizer" },
      { property: "og:description", content: "Interactive maze grid comparing A*, BFS, DFS and Greedy search with real measured stats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Mode = "wall" | "erase" | "start" | "goal";
const CHART_COLORS = ["var(--primary)", "var(--chart-1)", "var(--path)", "var(--chart-4)"];

function Index() {
  const [gameView, setGameView] = useState<"pathfinding" | "chess">("pathfinding");
  const [size, setSize] = useState(21);
  const [grid, setGrid] = useState<Grid>(() => emptyGrid(21));
  const [algo, setAlgo] = useState<Algo>("astar");
  const [heuristic, setHeuristic] = useState<Heuristic>("manhattan");
  const [speed, setSpeed] = useState(6);
  const [mode, setMode] = useState<Mode>("wall");
  const [step, setStep] = useState(-1); // -1 = idle
  const [playing, setPlaying] = useState(false);
  const drawing = useRef(false);

  // Seed a maze on the client after hydration (random).
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setGrid(generateMaze(21)); setMounted(true); }, []);

  const comparison = useMemo(
    () => ALGOS.map((a) => {
      const t = timeSearch(grid, a.id, heuristic);
      return { ...a, ...t, ms: mounted ? t.ms : 0 };
    }),
    [grid, heuristic, mounted],
  );
  const current = comparison.find((c) => c.id === algo) ?? comparison[0];
  const { result } = current;
  const total = result.order.length + result.path.length;
  const done = step >= total;

  const resetRun = useCallback(() => { setPlaying(false); setStep(-1); }, []);

  useEffect(() => {
    if (!playing) return;
    const perTick = Math.max(1, Math.round(Math.pow(1.6, speed - 5)));
    const delay = Math.max(8, 120 - speed * 12);
    const id = setInterval(() => {
      setStep((s) => {
        const nx = s + perTick;
        if (nx >= total) { setPlaying(false); return total; }
        return nx;
      });
    }, delay);
    return () => clearInterval(id);
  }, [playing, speed, total]);

  const play = () => { if (done || step < 0) setStep(0); setPlaying(true); };
  const stepOnce = () => { setPlaying(false); setStep((s) => Math.min(total, Math.max(0, s + 1))); };

  const edit = (i: number) => {
    setGrid((g) => {
      if (mode === "start" || mode === "goal") {
        if (i === g.start || i === g.goal) return g;
        const walls = g.walls.slice(); walls[i] = 0;
        return { ...g, walls, [mode]: i };
      }
      if (i === g.start || i === g.goal) return g;
      const v = mode === "wall" ? 1 : 0;
      if (g.walls[i] === v) return g;
      const walls = g.walls.slice(); walls[i] = v;
      return { ...g, walls };
    });
    resetRun();
  };

  const changeSize = (n: number) => { setSize(n); setGrid(emptyGrid(n)); resetRun(); };

  const pathSet = useMemo(() => {
    const m = new Map<number, number>();
    result.path.forEach((c, k) => m.set(c, k));
    return m;
  }, [result]);

  const cellClass = (i: number) => {
    if (i === grid.start) return "bg-start";
    if (i === grid.goal) return "bg-goal";
    if (grid.walls[i]) return "bg-wall";
    if (step < 0) return "bg-cell";
    const pk = pathSet.get(i);
    const vs = step - result.order.length;
    if (pk !== undefined && pk < vs) return "bg-path cell-pop";
    const v = result.visitedAt[i];
    if (v !== -1 && v < step) return "bg-visited";
    const a = result.addedAt[i];
    if (a !== -1 && a <= step && (v === -1 || v >= step)) return "bg-frontier";
    return "bg-cell";
  };

  const explored = step < 0 ? 0 : Math.min(step, result.order.length);
  const status =
    step < 0 ? "Ready" : !done ? (playing ? "Searching…" : "Paused") : result.found ? "Path found" : "No path";

  const n = grid.size;
  const algoMeta = ALGOS.find((a) => a.id === algo) ?? ALGOS[0];
  const minLen = comparison.find((c) => c.id === "bfs")?.result.path.length;

  return (
    <main className="flex min-h-screen flex-col gap-3 bg-background p-3 text-foreground lg:h-screen lg:overflow-hidden">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Brain className="h-8 w-8 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight">
              PathMind AI <span className="font-medium text-muted-foreground">· {gameView === "chess" ? "AI Chess Arena" : "Search Algorithm Visualizer"}</span>
            </h1>
            <p className="truncate text-xs text-muted-foreground">Explore how AI search algorithms find a path</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-md border border-border p-1" role="tablist" aria-label="Game">
          <Button size="sm" variant={gameView === "pathfinding" ? "default" : "ghost"} role="tab" aria-selected={gameView === "pathfinding"} onClick={() => { setGameView("pathfinding"); setPlaying(false); }}><Network />Pathfinding</Button>
          <Button size="sm" variant={gameView === "chess" ? "default" : "ghost"} role="tab" aria-selected={gameView === "chess"} onClick={() => { setGameView("chess"); setPlaying(false); }}><Crown />Chess</Button>
        </div>
        <div className={gameView === "pathfinding" ? "flex gap-2" : "hidden"}>
          <Btn onClick={() => { setGrid(generateMaze(size)); resetRun(); }}><Box className="h-4 w-4" />Random Maze</Btn>
          <Btn onClick={() => { setGrid(emptyGrid(size)); resetRun(); }}><Trash2 className="h-4 w-4" />Clear Grid</Btn>
        </div>
      </header>

      <div className={gameView === "chess" ? "flex min-h-0 flex-1 flex-col" : "hidden"}><ChessArena active={gameView === "chess"} /></div>
      <div className={gameView === "pathfinding" ? "flex min-h-0 flex-1 flex-col gap-3" : "hidden"}>

      {/* Workspace */}
      <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
        {/* Controls */}
        <aside className="panel flex flex-col gap-3 p-4 lg:overflow-y-auto" aria-label="Controls">
          <PanelTitle icon={Settings2}>Algorithm & Settings</PanelTitle>
          <AlgorithmGuide rows={comparison} heuristic={heuristic} />
          <Field label="Algorithm">
            <select className="input" value={algo} onChange={(e) => { setAlgo(e.target.value as Algo); resetRun(); }}>
              {ALGOS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Grid size" value={`${size} × ${size}`}>
            <input type="range" min={11} max={41} step={2} value={size} onChange={(e) => changeSize(+e.target.value)} className="w-full accent-primary" aria-label="Grid size" />
          </Field>
          <Field label="Heuristic (A*, Greedy)">
            <select className="input" value={heuristic} onChange={(e) => { setHeuristic(e.target.value as Heuristic); resetRun(); }}>
              <option value="manhattan">Manhattan distance</option>
              <option value="euclidean">Euclidean distance</option>
              <option value="chebyshev">Chebyshev distance</option>
            </select>
          </Field>
          <Field label="Animation speed" value={`${speed}/10`}>
            <input type="range" min={1} max={10} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-full accent-primary" aria-label="Animation speed" />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            {playing ? (
              <Btn primary onClick={() => setPlaying(false)}><Pause className="h-4 w-4" />Pause</Btn>
            ) : (
              <Btn primary onClick={play}><Play className="h-4 w-4" />{step > 0 && !done ? "Resume" : "Play"}</Btn>
            )}
            <Btn onClick={stepOnce}><StepForward className="h-4 w-4" />Step</Btn>
            <Btn onClick={resetRun}><RotateCcw className="h-4 w-4" />Reset</Btn>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold">Maze tools <span className="font-normal text-muted-foreground">(click / drag)</span></p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Edit mode">
              {([
                ["wall", "Add wall", Square], ["erase", "Erase", Eraser],
                ["start", "Set start", MapPin], ["goal", "Set goal", Flag],
              ] as const).map(([m, label, I]) => (
                <Button variant="outline" size="sm" key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${mode === m ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>
                  <I className="h-4 w-4" />{label}
                </Button>
              ))}
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="panel flex min-h-0 items-center justify-center p-3">
          <div
            className="grid aspect-square w-full select-none gap-px overflow-hidden rounded-md border border-border bg-border lg:h-full lg:w-auto lg:max-w-full"
            style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, touchAction: "none" }}
            onPointerUp={() => (drawing.current = false)}
            onPointerLeave={() => (drawing.current = false)}
            role="grid"
            aria-label={`Maze grid ${n} by ${n}`}
          >
            {Array.from({ length: n * n }, (_, i) => (
              <div
                key={i}
                data-i={i}
                className={`flex items-center justify-center text-[10px] font-bold text-primary-foreground transition-colors duration-150 ${cellClass(i)}`}
                onPointerDown={(e) => { (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); drawing.current = true; edit(i); }}
                onPointerEnter={() => { if (drawing.current && (mode === "wall" || mode === "erase")) edit(i); }}
              >
                {n <= 31 && (i === grid.start ? "S" : i === grid.goal ? "G" : "")}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <aside className="flex min-h-0 flex-col gap-3" aria-label="Results">
          <div className="panel p-4">
            <PanelTitle icon={BarChart3}>{algoMeta.name}</PanelTitle>
            <div className="mt-3 grid grid-cols-2 gap-2" aria-live="polite">
              <Stat icon={Network} label="Nodes explored" value={explored} />
              <Stat icon={RouteIcon} label="Path length" value={done && result.found ? result.path.length - 1 : "—"} unit={done && result.found ? "steps" : ""} />
              <Stat icon={Timer} label="Exec. time" value={current.ms.toFixed(3)} unit="ms" />
              <Stat icon={Activity} label="Status" value={status} small
                tone={done ? (result.found ? "text-success" : "text-destructive") : "text-foreground"} />
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${step < 0 ? 0 : (Math.min(step, total) / Math.max(1, total)) * 100}%` }} />
            </div>
          </div>
          <div className="panel flex-1 p-4">
            <h2 className="mb-2 text-sm font-semibold">Legend</h2>
            <ul className="grid grid-cols-2 gap-2 text-xs lg:grid-cols-1">
              {[["bg-start", "Start (S)"], ["bg-goal", "Goal (G)"], ["bg-wall", "Wall"], ["bg-visited", "Visited"], ["bg-frontier", "Frontier"], ["bg-path", "Final path"]].map(([c, l]) => (
                <li key={l} className="flex items-center gap-2"><span className={`h-4 w-4 rounded ${c}`} />{l}</li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      {/* Comparison */}
      <section className="grid gap-3 lg:h-[230px] lg:shrink-0 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="panel overflow-x-auto p-4">
           <div className="flex flex-wrap items-center justify-between gap-1"><PanelTitle icon={Table2}>Algorithm Comparison</PanelTitle><Button size="sm" variant="ghost" aria-label="Export comparison CSV" title="Export current results as CSV" onClick={() => downloadComparison(comparisonCsv(comparison, grid, heuristic))}><Download />CSV</Button></div>
          <table className="mt-2 w-full text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                {["Algorithm", "Found", "Nodes", "Path", "Time (ms)", "Optimal"].map((h, k) => (
                  <th key={h} className={`py-1.5 font-semibold ${k ? "text-center" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map((c) => {
                const opt = c.result.found && c.result.path.length === minLen;
                return (
                  <tr key={c.id} className={`border-b border-border last:border-0 ${c.id === algo ? "bg-primary/10 font-semibold text-primary" : ""}`}>
                    <td className="py-1.5 pl-1">{c.name}</td>
                    <td className="text-center"><YesNo ok={c.result.found} /></td>
                    <td className="text-center font-mono">{c.result.order.length}</td>
                    <td className="text-center font-mono">{c.result.found ? c.result.path.length - 1 : "—"}</td>
                    <td className="text-center font-mono">{c.ms.toFixed(3)}</td>
                    <td className="text-center"><YesNo ok={opt} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ChartCard icon={BarChart3} title="Nodes Explored">
          <BarChart data={comparison.map((c) => ({ name: c.short, v: c.result.order.length }))} margin={{ top: 16, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <Tooltip cursor={{ fill: "var(--muted)" }} />
            <Bar dataKey="v" name="Nodes" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {comparison.map((c, k) => <Cell key={c.id} fill={CHART_COLORS[k]} />)}
              <LabelList dataKey="v" position="top" fontSize={11} />
            </Bar>
          </BarChart>
        </ChartCard>
        <ChartCard icon={Clock} title="Execution Time (ms)">
          <LineChart data={comparison.map((c) => ({ name: c.short, v: +c.ms.toFixed(3) }))} margin={{ top: 16, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <Tooltip />
            <Line dataKey="v" name="ms" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false}>
              <LabelList dataKey="v" position="top" fontSize={11} />
            </Line>
          </LineChart>
        </ChartCard>
      </section>
      </div>
    </main>
  );
}

function Btn({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <Button onClick={onClick} size="sm" variant={primary ? "default" : "outline"} className="gap-1.5">
      {children}
    </Button>
  );
}

function PanelTitle({ icon: I, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return <h2 className="flex items-center gap-2 text-sm font-semibold"><I className="h-4 w-4 text-primary" />{children}</h2>;
}

function Field({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-xs font-medium">
        {label}{value && <span className="rounded bg-muted px-1.5 font-mono text-[11px]">{value}</span>}
      </span>
      {children}
    </label>
  );
}

function Stat({ icon: I, label, value, unit, small, tone = "text-foreground" }: {
  icon: React.ElementType; label: string; value: React.ReactNode; unit?: string; small?: boolean; tone?: string;
}) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><I className="h-3.5 w-3.5 text-primary" />{label}</p>
      <p className={`mt-1 font-bold ${small ? "text-sm" : "text-xl"} ${tone}`}>
        {value}{unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}

function YesNo({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle2 className="mx-auto h-4 w-4 text-success" aria-label="Yes" />
    : <XCircle className="mx-auto h-4 w-4 text-destructive" aria-label="No" />;
}

function ChartCard({ icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactElement }) {
  return (
    <div className="panel flex h-[230px] flex-col p-4 lg:h-auto">
      <PanelTitle icon={icon}>{title}</PanelTitle>
      <div className="min-h-0 flex-1"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>
    </div>
  );
}
