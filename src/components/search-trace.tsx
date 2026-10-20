import { Activity, MapPin, Network, ArrowRight, Hash } from "lucide-react";
import type { SearchStep, Algo } from "@/lib/search";

interface SearchTraceProps {
  step: SearchStep | null;
  algo: Algo;
  gridSize: number;
}

export function SearchTrace({ step, algo, gridSize }: SearchTraceProps) {
  if (!step) {
    return (
      <div className="panel p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="h-4 w-4 text-primary" />
          Live Search Trace
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">Run the algorithm to see step-by-step execution details.</p>
      </div>
    );
  }

  const nodeCoord = (n: number) => {
    const x = n % gridSize;
    const y = Math.floor(n / gridSize);
    return `(${x}, ${y})`;
  };

  return (
    <div className="panel p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Activity className="h-4 w-4 text-primary" />
        Live Search Trace
      </h2>

      <div className="mt-3 space-y-3">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Step {step.step + 1}</p>
          <p className="text-sm">{step.explanation}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-border p-2">
            <p className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              Current Node
            </p>
            <p className="mt-1 font-mono font-semibold">
              {step.currentNode >= 0 ? `${step.currentNode} ${nodeCoord(step.currentNode)}` : "—"}
            </p>
          </div>

          <div className="rounded-lg border border-border p-2">
            <p className="flex items-center gap-1 text-muted-foreground">
              <Network className="h-3 w-3" />
              Frontier Size
            </p>
            <p className="mt-1 font-mono font-semibold">{step.frontier.length}</p>
          </div>

          <div className="rounded-lg border border-border p-2">
            <p className="flex items-center gap-1 text-muted-foreground">
              <Hash className="h-3 w-3" />
              Visited
            </p>
            <p className="mt-1 font-mono font-semibold">{step.visited.length}</p>
          </div>

          <div className="rounded-lg border border-border p-2">
            <p className="flex items-center gap-1 text-muted-foreground">
              <ArrowRight className="h-3 w-3" />
              Path Length
            </p>
            <p className="mt-1 font-mono font-semibold">{step.path.length}</p>
          </div>
        </div>

        {step.algorithmSpecific.queue && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Queue (BFS)</p>
            <div className="flex flex-wrap gap-1">
              {step.algorithmSpecific.queue.slice(0, 20).map((n, i) => (
                <span key={i} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono">
                  {n}
                </span>
              ))}
              {step.algorithmSpecific.queue.length > 20 && (
                <span className="text-[10px] text-muted-foreground">+{step.algorithmSpecific.queue.length - 20} more</span>
              )}
            </div>
          </div>
        )}

        {step.algorithmSpecific.stack && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Stack (DFS) {step.algorithmSpecific.backtracking && <span className="text-destructive">· Backtracking</span>}
            </p>
            <div className="flex flex-wrap gap-1">
              {step.algorithmSpecific.stack.slice(0, 20).map((n, i) => (
                <span key={i} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono">
                  {n}
                </span>
              ))}
              {step.algorithmSpecific.stack.length > 20 && (
                <span className="text-[10px] text-muted-foreground">+{step.algorithmSpecific.stack.length - 20} more</span>
              )}
            </div>
            {step.algorithmSpecific.depth !== undefined && (
              <p className="mt-1 text-[10px] text-muted-foreground">Current depth: {step.algorithmSpecific.depth}</p>
            )}
          </div>
        )}

        {step.algorithmSpecific.priorityQueue && step.algorithmSpecific.priorityQueue.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Priority Queue ({algo === "astar" ? "A*" : "Greedy"})
            </p>
            <div className="max-h-24 overflow-y-auto">
              <table className="w-full text-[10px]">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="py-1 text-left">Node</th>
                    <th className="py-1 text-right">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {step.algorithmSpecific.priorityQueue.slice(0, 15).map((item, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-1 font-mono">{item.node}</td>
                      <td className="py-1 text-right font-mono">{item.priority.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {step.algorithmSpecific.priorityQueue.length > 15 && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  +{step.algorithmSpecific.priorityQueue.length - 15} more nodes
                </p>
              )}
            </div>
          </div>
        )}

        {step.frontierData.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Frontier Details</p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10px]">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="py-1 text-left">Node</th>
                    {algo === "astar" && (
                      <>
                        <th className="py-1 text-right">g</th>
                        <th className="py-1 text-right">h</th>
                        <th className="py-1 text-right">f</th>
                      </>
                    )}
                    {(algo === "greedy" || algo === "astar") && <th className="py-1 text-right">h</th>}
                  </tr>
                </thead>
                <tbody>
                  {step.frontierData.slice(0, 10).map((item, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-1 font-mono">{item.node}</td>
                      {algo === "astar" && (
                        <>
                          <td className="py-1 text-right font-mono">{item.g?.toFixed(1)}</td>
                          <td className="py-1 text-right font-mono">{item.h?.toFixed(1)}</td>
                          <td className="py-1 text-right font-mono">{item.f?.toFixed(1)}</td>
                        </>
                      )}
                      {algo === "greedy" && (
                        <>
                          <td className="py-1 text-right font-mono">{item.h?.toFixed(1)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {step.frontierData.length > 10 && (
                <p className="mt-1 text-[10px] text-muted-foreground">+{step.frontierData.length - 10} more nodes</p>
              )}
            </div>
          </div>
        )}

        {step.path.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Current Best Path</p>
            <div className="flex flex-wrap gap-1">
              {step.path.slice(0, 15).map((n, i) => (
                <span key={i} className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-mono text-success">
                  {n}
                </span>
              ))}
              {step.path.length > 15 && (
                <span className="text-[10px] text-muted-foreground">... {step.path[step.path.length - 1]}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
