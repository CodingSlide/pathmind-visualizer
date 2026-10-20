import type { Algo, Grid, Heuristic, SearchResult } from "@/lib/search";

export interface ComparisonRow { id: Algo; name: string; ms: number; result: SearchResult }

export function comparisonCsv(rows: ComparisonRow[], grid: Grid, heuristic: Heuristic): string {
  const shortest = rows.find((row) => row.id === "bfs")?.result.path.length;
  const escape = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`;
  const records: unknown[][] = [["Algorithm", "Found", "Nodes explored", "Path length (steps)", "Execution time (ms)", "Shortest path", "Grid size", "Heuristic"]];
  for (const row of rows) records.push([row.name, row.result.found, row.result.order.length,
    row.result.found ? row.result.path.length - 1 : "", row.ms.toFixed(6),
    row.result.found && row.result.path.length === shortest, `${grid.size}x${grid.size}`, heuristic]);
  return records.map((record) => record.map(escape).join(",")).join("\r\n") + "\r\n";
}

export function downloadComparison(csv: string) {
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = "pathmind-comparison.csv";
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}