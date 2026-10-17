import { describe, it, expect } from "vitest";
import { emptyGrid, runSearch, generateMaze, type Algo } from "@/lib/search";

const algos: Algo[] = ["astar", "bfs", "dfs", "greedy"];

function validPath(g: ReturnType<typeof emptyGrid>, p: number[]) {
  if (p[0] !== g.start || p[p.length - 1] !== g.goal) return false;
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1], b = p[i], d = Math.abs(a - b);
    if (g.walls[b] || !(d === 1 || d === g.size)) return false;
  }
  return true;
}

describe("search", () => {
  it("A* and BFS find the shortest path around a wall", () => {
    const g = emptyGrid(10); // start (1,5) goal (8,5)
    for (let y = 2; y < 9; y++) g.walls[y * 10 + 5] = 1;
    const a = runSearch(g, "astar"), b = runSearch(g, "bfs");
    expect(a.path.length).toBe(b.path.length);
    expect(a.path.length - 1).toBe(13);
  });
  it("all algorithms return valid paths in a maze", () => {
    const g = generateMaze(21);
    for (const al of algos) {
      const r = runSearch(g, al);
      expect(r.found).toBe(true);
      expect(validPath(g, r.path)).toBe(true);
    }
  });
  it("reports no path when goal is walled off", () => {
    const g = emptyGrid(10);
    for (let y = 0; y < 10; y++) g.walls[y * 10 + 5] = 1;
    for (const al of algos) expect(runSearch(g, al).found).toBe(false);
  });
});
