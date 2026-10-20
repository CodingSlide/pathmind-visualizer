import { useEffect, useRef, useState } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { Play, Pause, RotateCcw, StepForward, Crown, Cpu, ArrowDownUp, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CHESS_ALGORITHMS, type ChessAlgorithm, type ChessSearchResult } from "@/lib/chess-engine";

const GLYPHS: Record<PieceSymbol, string> = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
interface TurnRecord { san: string; side: "w" | "b"; algorithm: ChessAlgorithm; depth: number; result: ChessSearchResult }
const nameOf = (id: ChessAlgorithm) => CHESS_ALGORITHMS.find((a) => a.id === id)?.name ?? "Minimax";

export function ChessArena({ active }: { active: boolean }) {
  const game = useRef(new Chess());
  const worker = useRef<Worker | null>(null);
  const [fen, setFen] = useState(game.current.fen());
  const [white, setWhite] = useState<ChessAlgorithm>("minimax");
  const [black, setBlack] = useState<ChessAlgorithm>("alphabeta");
  const [depth, setDepth] = useState(2);
  const [delay, setDelay] = useState(650);
  const [playing, setPlaying] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [single, setSingle] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [history, setHistory] = useState<TurnRecord[]>([]);
  const [error, setError] = useState("");
  const board = game.current.board();
  const turn = game.current.turn();
  const over = game.current.isGameOver();
  const last = game.current.history({ verbose: true }).at(-1);
  const files = flipped ? "hgfedcba" : "abcdefgh";
  const ranks = flipped ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];
  const cancel = () => { worker.current?.terminate(); worker.current = null; setThinking(false); setPlaying(false); setSingle(0); };
  const reset = () => { cancel(); game.current = new Chess(); setFen(game.current.fen()); setHistory([]); setError(""); };

  useEffect(() => {
    if (!active) { setPlaying(false); setSingle(0); }
    if (!active || (!playing && single === 0) || over) { setThinking(false); return; }
    let disposed = false;
    const id = setTimeout(() => {
      const side = game.current.turn();
      const algorithm = side === "w" ? white : black;
      const engine = new Worker(new URL("../lib/chess.worker.ts", import.meta.url), { type: "module" });
      worker.current = engine; setThinking(true); setError("");
      engine.onmessage = (event: MessageEvent<{ result?: ChessSearchResult; error?: string }>) => {
        if (disposed) return;
        engine.terminate(); worker.current = null; setThinking(false); setSingle(0);
        const result = event.data.result;
        if (!result?.move || event.data.error) { setError(event.data.error ?? "No legal move available."); setPlaying(false); return; }
        try {
          const move = game.current.move(result.move);
          setHistory((h) => [...h, { san: move.san, side, algorithm, depth, result }]);
          setFen(game.current.fen());
          if (game.current.isGameOver()) setPlaying(false);
        } catch { setError("The move could not be applied. Reset the match to try again."); setPlaying(false); }
      };
      engine.onerror = () => { if (disposed) return; engine.terminate(); worker.current = null; setThinking(false); setPlaying(false); setSingle(0); setError("Chess search stopped unexpectedly. Try resetting the match."); };
      engine.postMessage({ fen: game.current.fen(), algorithm, depth });
    }, single ? 0 : delay);
    return () => { disposed = true; clearTimeout(id); worker.current?.terminate(); worker.current = null; };
  }, [active, playing, single, fen, white, black, depth, delay, over]);

  let status = thinking ? `${turn === "w" ? "White" : "Black"} is thinking…` : `${turn === "w" ? "White" : "Black"} to move`;
  if (game.current.isCheckmate()) status = `${turn === "w" ? "Black" : "White"} wins by checkmate`;
  else if (game.current.isStalemate()) status = "Draw · stalemate";
  else if (game.current.isThreefoldRepetition()) status = "Draw · threefold repetition";
  else if (game.current.isInsufficientMaterial()) status = "Draw · insufficient material";
  else if (game.current.isDraw()) status = "Draw · 50-move rule";
  else if (game.current.isCheck()) status += " · check";

  return <section className="chess-workspace grid min-h-0 flex-1 gap-3 lg:grid-cols-[260px_minmax(0,1fr)_280px]" aria-label="Chess arena">
    <aside className="panel flex flex-col gap-4 p-4 lg:overflow-y-auto">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><Cpu className="h-4 w-4 text-primary" />AI match settings</h2>
      {([["w", "White algorithm", white], ["b", "Black algorithm", black]] as const).map(([side, label, value]) => <label key={side} className="text-xs font-medium">{label}<select aria-label={label} className="input mt-1" value={value} onChange={(e) => { cancel(); (side === "w" ? setWhite : setBlack)(e.target.value as ChessAlgorithm); }}>{CHESS_ALGORITHMS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>)}
      <label className="text-xs font-medium">Search depth <span className="float-right font-mono">{depth} {depth === 1 ? "ply" : "plies"}</span><input className="mt-2 w-full accent-primary" type="range" aria-label="Chess search depth" min="1" max="3" value={depth} onChange={(e) => { cancel(); setDepth(+e.target.value); }} /></label>
      <label className="text-xs font-medium">Move interval <span className="float-right font-mono">{(delay / 1000).toFixed(1)} s</span><input className="mt-2 w-full accent-primary" type="range" aria-label="Move interval" min="100" max="2000" step="100" value={delay} onChange={(e) => setDelay(+e.target.value)} /></label>
      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" disabled={over} onClick={() => { if (playing || thinking) cancel(); else setPlaying(true); }}>{playing || thinking ? <Pause /> : <Play />}{playing || thinking ? "Pause" : "Play"}</Button>
        <Button variant="outline" size="sm" disabled={over || thinking} onClick={() => { setPlaying(false); setSingle((v) => v + 1); }}><StepForward />Step</Button>
        <Button variant="outline" size="sm" onClick={reset} title="Reset chess match"><RotateCcw /><span className="sr-only">Reset chess</span></Button>
      </div>
      <ChessGuide />
      <div className="mt-auto border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground"><h3 className="mb-2 font-semibold text-foreground">Search matchup</h3><p>Both engines use the same material and piece-position evaluation. Alpha-beta skips branches that cannot improve the decision; minimax evaluates every branch to the selected depth.</p></div>
    </aside>
    <div className="panel flex min-h-0 flex-col items-center justify-center gap-2 p-3">
      <div className="flex w-full items-center justify-between text-xs"><span className="flex items-center gap-2"><Crown className="h-4 w-4" />{flipped ? "White" : "Black"} · {nameOf(flipped ? white : black)}</span><Button size="icon" variant="ghost" title="Flip board" aria-label="Flip board" onClick={() => setFlipped((f) => !f)}><ArrowDownUp /></Button></div>
      <div className="chess-board grid w-full shrink-0 grid-cols-8 overflow-hidden rounded-md border border-border" role="img" aria-label="Chess board">
        {ranks.flatMap((rank, y) => [...files].map((file, x) => {
          const square = `${file}${rank}`;
          const piece = board[8 - rank]?.[file.charCodeAt(0) - 97];
          const light = ((file.charCodeAt(0) - 97) + 8 - rank) % 2 === 0;
          const moved = last?.from === square || last?.to === square;
          const check = piece?.type === "k" && piece.color === turn && game.current.isCheck();
          return <div key={square} data-square={square} title={`${square}${piece ? ` · ${piece.color === "w" ? "White" : "Black"} ${piece.type}` : ""}`} className={`chess-square relative flex aspect-square items-center justify-center ${light ? "bg-chess-light" : "bg-chess-dark"} ${moved ? "chess-last-move" : ""} ${check ? "chess-check" : ""}`}>
            {x === 0 && <span className="absolute left-1 top-0.5 text-[10px] font-semibold text-chess-coordinate">{rank}</span>}
            {y === 7 && <span className="absolute bottom-0.5 right-1 text-[10px] font-semibold text-chess-coordinate">{file}</span>}
            {piece && <span aria-hidden className={`chess-piece ${piece.color === "w" ? "chess-piece-white" : "chess-piece-black"}`}>{GLYPHS[piece.type]}</span>}
          </div>;
        }))}
      </div>
      <div className="flex w-full items-center justify-between gap-2 text-xs"><span className="flex items-center gap-2"><Crown className="h-4 w-4" />{flipped ? "Black" : "White"} · {nameOf(flipped ? black : white)}</span><span className="font-mono text-muted-foreground">Move {Math.floor(history.length / 2) + 1}</span></div>
    </div>
    <aside className="flex min-h-0 flex-col gap-3">
      <div className="panel p-4"><h2 className="text-sm font-semibold">Match status</h2><p className="mt-2 text-sm font-semibold text-primary" aria-live="polite">{status}</p>{error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}</div>
      <div className="panel p-4"><h2 className="text-sm font-semibold">Latest search by side</h2>{(["w", "b"] as const).map((side) => { const record = history.filter((h) => h.side === side).at(-1); return <div key={side} className="mt-3 border-t border-border pt-3"><h3 className="text-xs font-semibold">{side === "w" ? "White" : "Black"} · {record ? nameOf(record.algorithm) : nameOf(side === "w" ? white : black)}</h3><dl className="mt-2 grid grid-cols-2 gap-y-2 text-xs"><dt className="text-muted-foreground">Positions</dt><dd className="text-right font-mono">{record?.result.nodes.toLocaleString() ?? "—"}</dd><dt className="text-muted-foreground">Search time</dt><dd className="text-right font-mono">{record ? `${record.result.ms.toFixed(1)} ms` : "—"}</dd><dt className="text-muted-foreground">Pruned branches</dt><dd className="text-right font-mono">{record?.result.cutoffs ?? "—"}</dd><dt className="text-muted-foreground">Depth</dt><dd className="text-right font-mono">{record?.depth ?? "—"}</dd></dl></div>; })}</div>
      <div className="panel flex min-h-[160px] flex-1 flex-col p-4 lg:min-h-0"><h2 className="mb-2 text-sm font-semibold">Move history <span className="font-normal text-muted-foreground">· {history.length} plies</span></h2><div className="max-h-64 overflow-y-auto lg:max-h-none lg:flex-1" aria-label="Move history">{history.length === 0 ? <p className="text-xs text-muted-foreground">No moves yet</p> : <table className="w-full text-xs"><thead><tr className="text-left text-muted-foreground"><th className="py-1">#</th><th>White</th><th>Black</th></tr></thead><tbody>{Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => <tr key={i} className="border-t border-border"><td className="py-2 text-muted-foreground">{i + 1}.</td><td className="font-mono">{history[i * 2]?.san}</td><td className="font-mono">{history[i * 2 + 1]?.san ?? "—"}</td></tr>)}</tbody></table>}</div></div>
    </aside>
  </section>;
}

function ChessGuide() {
  return <Dialog><DialogTrigger asChild><Button size="sm" variant="outline"><BookOpen />Chess algorithm guide</Button></DialogTrigger><DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto"><DialogTitle>How the chess engines decide</DialogTitle><DialogDescription>Minimax versus alpha-beta pruning · both sides play automatically</DialogDescription>
    <section className="text-sm leading-relaxed"><h3 className="mb-2 font-semibold">Minimax</h3><p>White maximizes the position score and Black minimizes it. The engine tries every legal move, then every opponent response, continuing to the chosen depth. It assumes the opponent chooses their best reply and backs those scores up to select a move. With b legal moves per position and depth d, work grows roughly as O(b^d).</p></section>
    <section className="text-sm leading-relaxed"><h3 className="mb-2 font-semibold">Alpha-beta pruning</h3><p>This is minimax with bounds: alpha is the best score White can already secure; beta is the best score Black can already secure. When alpha meets or exceeds beta, the rest of that branch cannot change the choice and is skipped. Both engines order captures and promotions first, but only alpha-beta prunes. It gives the same score at equal depth; tied moves may differ. Best-case work approaches O(b^(d/2)); worst case remains O(b^d).</p></section>
    <section className="text-sm leading-relaxed"><h3 className="mb-2 font-semibold">Evaluation, depth and time</h3><p>Scores favor White when positive and Black when negative. Pawns are worth 100, knights 320, bishops 330, rooks 500 and queens 900; small bonuses reward central pieces and pawn advancement. Checkmate dominates the score, and detected draws score zero. One ply is one side's move, not a full turn.</p><p className="mt-2 text-muted-foreground">Search time is measured inside the chess worker for one move, excluding the move interval and board rendering. Positions counts evaluated search nodes; pruned branches counts cutoffs, not all skipped positions. Greater depth is much slower. Branching, move ordering and captures influence pruning, so different sides' times are not a controlled benchmark. This is a teaching engine, not tournament-strength chess: it has no opening book, quiescence search or transposition table. The live match tracks repetition; each search starts from the current position, without earlier match repetition history.</p></section>
  </DialogContent></Dialog>;
}