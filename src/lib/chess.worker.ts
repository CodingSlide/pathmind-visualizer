import { searchChess, type ChessAlgorithm } from "./chess-engine";

self.onmessage = (event: MessageEvent<{ fen: string; algorithm: ChessAlgorithm; depth: number }>) => {
  try { self.postMessage({ result: searchChess(event.data.fen, event.data.algorithm, event.data.depth) }); }
  catch { self.postMessage({ error: "The move could not be calculated. Reset the match to try again." }); }
};