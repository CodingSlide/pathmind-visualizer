import { Chess, type Move, type PieceSymbol } from "chess.js";

export type ChessAlgorithm = "minimax" | "alphabeta";
export const CHESS_ALGORITHMS = [{ id: "minimax", name: "Minimax" }, { id: "alphabeta", name: "Alpha-beta pruning" }] as const;
export const PIECE_VALUES: Record<PieceSymbol, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
export interface ChessSearchResult { move: { from: string; to: string; promotion?: string } | null; score: number; nodes: number; cutoffs: number; ms: number }

function evaluate(game: Chess, ply: number): number {
  if (game.isCheckmate()) return game.turn() === "w" ? -100000 + ply : 100000 - ply;
  if (game.isDraw()) return 0;
  let score = 0;
  game.board().forEach((rank, y) => rank.forEach((piece, x) => {
    if (!piece) return;
    const centrality = 3.5 - (Math.abs(x - 3.5) + Math.abs(y - 3.5)) / 2;
    const advance = piece.color === "w" ? 6 - y : y - 1;
    const bonus = piece.type === "p" ? advance * 8 + centrality * 3 : piece.type === "k" ? 0 : centrality * 12;
    score += (PIECE_VALUES[piece.type!] + bonus) * (piece.color === "w" ? 1 : -1);
  }));
  return score;
}

function orderedMoves(game: Chess): Move[] {
  const priority = (move: Move) => (move.captured ? PIECE_VALUES[move.captured!] * 10 - PIECE_VALUES[move.piece!] : 0) + (move.promotion ? PIECE_VALUES[move.promotion!] : 0);
  const moves = game.moves({ verbose: true });
  moves.sort((a, b) => priority(b) - priority(a));
  // Shuffle moves with equal priority to add variety and prevent repetition
  for (let i = 0; i < moves.length - 1; i++) {
    const moveI = moves[i];
    const moveNext = moves[i + 1];
    if (moveI && moveNext && priority(moveI) === priority(moveNext)) {
      const j = i + 1 + Math.floor(Math.random() * (moves.length - i - 1));
      const moveJ = moves[j];
      if (moveJ) {
        const temp = moves[i]!;
        moves[i] = moves[j]!;
        moves[j] = temp;
      }
    }
  }
  return moves;
}

export function searchChess(fen: string, algorithm: ChessAlgorithm, depth: number): ChessSearchResult {
  const game = new Chess(fen);
  const start = performance.now();
  const limit = Math.max(1, Math.min(3, Math.floor(depth)));
  let nodes = 0, cutoffs = 0;
  const pruning = algorithm === "alphabeta";
  function visit(remaining: number, alpha: number, beta: number, ply: number): number {
    nodes++;
    if (remaining === 0 || game.isGameOver()) return evaluate(game, ply);
    const maximizing = game.turn() === "w";
    let best = maximizing ? -Infinity : Infinity;
    for (const move of orderedMoves(game)) {
      game.move(move);
      const value = visit(remaining - 1, alpha, beta, ply + 1);
      game.undo();
      best = maximizing ? Math.max(best, value) : Math.min(best, value);
      if (maximizing) alpha = Math.max(alpha, best); else beta = Math.min(beta, best);
      if (pruning && alpha >= beta) { cutoffs++; break; }
    }
    return best;
  }
  if (game.isGameOver()) return { move: null, score: evaluate(game, 0), nodes: 1, cutoffs: 0, ms: performance.now() - start };
  const maximizing = game.turn() === "w";
  let best = maximizing ? -Infinity : Infinity;
  let choice: Move | undefined;
  let alpha = -Infinity, beta = Infinity;
  for (const move of orderedMoves(game)) {
    game.move(move);
    const score = visit(limit - 1, alpha, beta, 1);
    game.undo();
    if (!choice || (maximizing ? score > best : score < best)) { best = score; choice = move; }
    if (pruning) { if (maximizing) alpha = Math.max(alpha, best); else beta = Math.min(beta, best); }
  }
  return { move: choice ? { from: choice.from, to: choice.to, ...(choice.promotion ? { promotion: choice.promotion } : {}) } : null, score: best, nodes, cutoffs, ms: performance.now() - start };
}