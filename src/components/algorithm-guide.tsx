import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ComparisonRow } from "@/lib/comparison-csv";
import type { Algo, Heuristic } from "@/lib/search";

const GUIDE: Record<Algo, { rule: string; works: string; cost: string; tradeoff: string }> = {
  astar: { rule: "f(n) = g(n) + h(n)", works: "A* chooses the frontier cell with the lowest total estimated cost: g is the distance already travelled and h estimates the remaining distance. A min-heap prioritizes candidates; this implementation favors lower h when total scores tie. It updates a cell's parent when a shorter route is discovered.", cost: "A useful heuristic usually reduces expansions, but calculating distances and maintaining the heap adds work per cell. On a small grid, this overhead can outweigh the saved expansions. Its worst-case grid cost is O(V log V), with O(V) memory.", tradeoff: "Finds a shortest path here: all moves cost one, and each available heuristic is admissible and consistent for this four-direction grid." },
  bfs: { rule: "First in, first out", works: "Breadth-First Search uses a queue to expand every cell one step away, then two steps away, and so on. Each newly discovered cell records its parent. The first arrival at the goal gives a shortest route in this equal-cost grid.", cost: "Queue operations are inexpensive and each reachable cell is discovered once. It may still inspect a large area because it has no sense of the goal's direction. Time is O(V + E), with O(V) memory.", tradeoff: "Guaranteed shortest path for equal-cost moves; not a shortest-cost guarantee if different terrain costs are introduced." },
  dfs: { rule: "Last in, first out", works: "Depth-First Search uses a stack to follow one branch as deeply as possible before returning to alternatives. In this implementation neighbors are considered up, right, down, left; the maze shape and this order strongly affect the route it discovers.", cost: "Stack operations are cheap and there is no heuristic or heap, but a poor first branch can make it explore almost the whole reachable region. Time is O(V + E), with O(V) memory on this grid.", tradeoff: "Finds a route if one exists, but does not guarantee the shortest route. A low runtime alone does not mean a better path." },
  greedy: { rule: "f(n) = h(n)", works: "Greedy Best-First Search takes the frontier cell estimated closest to the goal. A min-heap ranks cells only by the heuristic; it ignores the distance already travelled and records a parent when a cell is first discovered.", cost: "Often expands fewer cells when the goal direction is useful. Walls and dead ends can mislead it into long detours. Heuristic evaluation and heap operations add overhead; worst-case time is O(V log V), with O(V) memory.", tradeoff: "Can be fast, but has no shortest-path guarantee. It may happen to match BFS on a particular maze." },
};

export function AlgorithmGuide({ rows, heuristic }: { rows: ComparisonRow[]; heuristic: Heuristic }) {
  return <Dialog><DialogTrigger asChild><Button variant="outline" size="sm"><BookOpen />Algorithm guide</Button></DialogTrigger>
    <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto">
      <DialogTitle>How the search algorithms work</DialogTitle>
      <DialogDescription>Measured on your current grid · {heuristic} heuristic</DialogDescription>
      <div className="border-b border-border pb-4 text-sm leading-relaxed">
        <h3 className="mb-2 font-semibold">Why these times differ</h3>
        <p>Execution time is the average of 15 full runs after one warm-up, measured with the browser clock. It includes searching and reconstructing the path, but excludes animation, drawing and chart updates. Nodes explored is the number of cells expanded, not every internal operation.</p>
        <p className="mt-2 text-muted-foreground">Grid layout, heuristic, queue or heap overhead, browser scheduling, device speed and timer precision all influence these tiny measurements. Close sub-millisecond results are noisy, not a reliable ranking. We cannot attribute an exact fraction of the time to each operation without profiling. V means cells and E means neighboring connections; each cell has at most four.</p>
      </div>
      {rows.map((row) => { const guide = GUIDE[row.id]; return <section key={row.id} className="border-b border-border pb-4 last:border-0">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{row.name}</h3><span className="font-mono text-xs text-primary">{row.ms.toFixed(3)} ms · {row.result.order.length} expanded</span></div>
        <p className="my-2 font-mono text-xs text-muted-foreground">{guide.rule}</p>
        <p className="text-sm leading-relaxed">{guide.works}</p>
        <h4 className="mt-3 text-sm font-semibold">Why it takes this time</h4><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{guide.cost}</p>
        <p className="mt-2 text-sm leading-relaxed">{guide.tradeoff}</p>
      </section>; })}
    </DialogContent></Dialog>;
}