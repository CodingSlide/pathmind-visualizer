import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, Clock, Hash } from "lucide-react";
import type { SearchResult, Algo } from "@/lib/search";

interface OptimalityAnalysisProps {
  result: SearchResult;
  algo: Algo;
  bfsResult: SearchResult | null;
  executionTime: number;
}

export function OptimalityAnalysis({ result, algo, bfsResult, executionTime }: OptimalityAnalysisProps) {
  const isOptimal = result.found && bfsResult?.found && result.path.length === bfsResult.path.length;
  const bfsPathLength = bfsResult?.found ? bfsResult.path.length : null;

  return (
    <div className="panel p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <TrendingUp className="h-4 w-4 text-primary" />
        Optimality & Performance
      </h2>

      <div className="mt-3 space-y-3">
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 mb-2">
            {result.found ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <span className="font-medium text-sm">
              {result.found ? "Path Found" : "No Path Found"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Path length:</span>
              <span className="ml-2 font-mono font-semibold">
                {result.found ? `${result.path.length} steps` : "—"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Nodes explored:</span>
              <span className="ml-2 font-mono font-semibold">{result.order.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Execution time:</span>
              <span className="ml-2 font-mono font-semibold">{executionTime.toFixed(3)} ms</span>
            </div>
          </div>
        </div>

        {result.found && bfsPathLength !== null && (
          <div className={`rounded-lg border p-3 ${isOptimal ? "border-success bg-success/5" : "border-warning bg-warning/5"}`}>
            <div className="flex items-center gap-2 mb-2">
              {isOptimal ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning" />
              )}
              <span className="font-medium text-sm">
                {isOptimal ? "Optimal Path" : "Suboptimal Path"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isOptimal
                ? `This path matches the shortest path found by BFS (${bfsPathLength} steps).`
                : `Shortest possible path is ${bfsPathLength} steps (found by BFS). This path is ${result.path.length} steps, which is ${result.path.length - bfsPathLength} steps longer.`}
            </p>
          </div>
        )}

        <div className="rounded-lg bg-muted p-3">
          <h3 className="font-medium text-sm mb-2">Why this result?</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong className="text-foreground">{algo.toUpperCase()}</strong> uses a{" "}
              {algo === "bfs" ? "FIFO queue" : algo === "dfs" ? "LIFO stack" : "priority queue"}{" "}
              to select the next node.
            </p>
            {algo === "bfs" && (
              <p>
                BFS explores level-by-level, guaranteeing the shortest path in unweighted graphs. It may explore many nodes but always finds the optimal route.
              </p>
            )}
            {algo === "dfs" && (
              <p>
                DFS explores deeply before backtracking. It can find a path quickly but does not guarantee optimality. The path depends heavily on the order neighbors are checked.
              </p>
            )}
            {algo === "astar" && (
              <p>
                A* combines actual cost (g) with heuristic estimate (h). With an admissible heuristic (like Manhattan for 4-directional movement), it guarantees optimality while being more efficient than BFS.
              </p>
            )}
            {algo === "greedy" && (
              <p>
                Greedy only considers the heuristic distance to the goal. This makes it fast but myopic—it can miss shorter paths that require temporary detours.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border p-3">
          <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Performance Notes
          </h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              Execution time is measured by running the algorithm multiple times and averaging. This excludes rendering and animation overhead.
            </p>
            <p>
              <strong className="text-foreground">Nodes explored</strong> counts how many cells were expanded from the frontier. This is the primary factor affecting runtime.
            </p>
            <p>
              <strong className="text-foreground">Memory usage</strong> depends on the maximum size of the frontier (queue/stack/priority queue) during execution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
