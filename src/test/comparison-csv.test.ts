import { expect, it } from "vitest";
import { comparisonCsv } from "@/lib/comparison-csv";
import { ALGOS, emptyGrid, runSearch } from "@/lib/search";

it("exports all current algorithm results with actual nodes and path steps", () => {
  const grid = emptyGrid(11);
  const rows = ALGOS.map((a) => ({ ...a, result: runSearch(grid, a.id), ms: 0.123456 }));
  const csv = comparisonCsv(rows, grid, "manhattan");
  expect(csv.trim().split("\r\n")).toHaveLength(5);
  expect(csv).toContain('"Breadth-First Search","true","' + runSearch(grid, "bfs").order.length + '","8","0.123456","true","11x11","manhattan"');
});

it("exports unreachable paths as empty, not a negative length", () => {
  const grid = emptyGrid(11);
  for (let y = 0; y < 11; y++) grid.walls[y * 11 + 5] = 1;
  const rows = ALGOS.map((a) => ({ ...a, result: runSearch(grid, a.id), ms: 1 }));
  expect(comparisonCsv(rows, grid, "euclidean")).toContain('"","1.000000","false","11x11","euclidean"');
});