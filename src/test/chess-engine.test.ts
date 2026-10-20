import { expect, it } from "vitest";
import { Chess } from "chess.js";
import { searchChess } from "@/lib/chess-engine";

it("both chess algorithms return legal moves for either side", () => {
  const game = new Chess();
  for (const algorithm of ["minimax", "alphabeta"] as const) {
    const result = searchChess(game.fen(), algorithm, 1);
    expect(result.move).not.toBeNull();
    if (!result.move) throw new Error("Expected legal move");
    expect(game.move(result.move)).toBeDefined();
  }
  expect(game.history()).toHaveLength(2);
});

it("alpha-beta agrees with minimax at equal depth while pruning positions", () => {
  const fen = new Chess().fen();
  const plain = searchChess(fen, "minimax", 2);
  const pruned = searchChess(fen, "alphabeta", 2);
  expect(pruned.score).toBe(plain.score);
  expect(pruned.nodes).toBeLessThan(plain.nodes);
  expect(pruned.cutoffs).toBeGreaterThan(0);
});

it("does not move after checkmate", () => {
  const game = new Chess();
  for (const move of ["f3", "e5", "g4", "Qh4#"]) game.move(move);
  expect(game.isCheckmate()).toBe(true);
  expect(searchChess(game.fen(), "alphabeta", 2).move).toBeNull();
});