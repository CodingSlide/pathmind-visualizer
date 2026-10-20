import { BookOpen, Info, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Algo, Heuristic } from "@/lib/search";

const ALGORITHM_EXPLANATIONS: Record<Algo, {
  name: string;
  what: string;
  how: string[];
  formula: string;
  formulaExplanation: string;
  selection: string;
  optimal: boolean;
  timeComplexity: string;
  spaceComplexity: string;
  advantages: string[];
  disadvantages: string[];
  applications: string[];
}> = {
  astar: {
    name: "A* Search",
    what: "A* is a complete and optimal search algorithm that combines the actual cost from the start (g) with an estimated cost to the goal (h) to guide the search efficiently.",
    how: [
      "Initialize the open set (priority queue) with the start node",
      "Calculate f(n) = g(n) + h(n) for each node",
      "Select the node with the lowest f(n) from the open set",
      "Expand the node and add its neighbors to the open set",
      "Update g(n) if a better path is found",
      "Repeat until the goal is reached or the open set is empty",
      "Reconstruct the path by following parent pointers from the goal",
    ],
    formula: "f(n) = g(n) + h(n)",
    formulaExplanation: "f(n) is the total estimated cost, g(n) is the actual cost from start to node n, and h(n) is the heuristic estimate from node n to the goal. A* always expands the node with the lowest total estimated cost.",
    selection: "Selects the node with the lowest f(n) value from the priority queue. When f(n) ties, it prefers nodes with lower h(n) (closer to goal).",
    optimal: true,
    timeComplexity: "O(b^d) worst case, O(E) with a good heuristic",
    spaceComplexity: "O(b^d)",
    advantages: [
      "Guarantees the shortest path when the heuristic is admissible",
      "More efficient than uninformed search with a good heuristic",
      "Complete (will find a solution if one exists)",
    ],
    disadvantages: [
      "Memory intensive - stores all nodes in the frontier",
      "Heuristic quality greatly affects performance",
      "Can be slower than BFS on simple mazes with poor heuristics",
    ],
    applications: [
      "GPS navigation systems",
      "Robot path planning",
      "Video game AI pathfinding",
      "Network routing protocols",
    ],
  },
  bfs: {
    name: "Breadth-First Search",
    what: "BFS is an uninformed search algorithm that explores all nodes at the present depth before moving to nodes at the next depth level.",
    how: [
      "Initialize a FIFO queue with the start node",
      "Dequeue the front node and mark it as visited",
      "Enqueue all unvisited neighbors of the current node",
      "Record the parent of each neighbor for path reconstruction",
      "Repeat until the goal is found or the queue is empty",
      "The first time the goal is reached, the path is guaranteed to be shortest",
    ],
    formula: "First-In-First-Out (FIFO) Queue",
    formulaExplanation: "BFS uses a simple queue where nodes are explored in the order they were discovered. No heuristic or cost function is used.",
    selection: "Selects the oldest node in the queue (FIFO). This ensures level-by-level exploration.",
    optimal: true,
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    advantages: [
      "Guarantees shortest path in unweighted graphs",
      "Simple to implement",
      "Complete (will find a solution if one exists)",
    ],
    disadvantages: [
      "Explores many unnecessary nodes",
      "High memory usage for large graphs",
      "No guidance toward the goal - blind search",
    ],
    applications: [
      "Finding shortest paths in unweighted graphs",
      "Web crawling",
      "Social network analysis",
      "Garbage collection algorithms",
    ],
  },
  dfs: {
    name: "Depth-First Search",
    what: "DFS is an uninformed search algorithm that explores as far as possible along each branch before backtracking.",
    how: [
      "Initialize a stack (or use recursion) with the start node",
      "Pop the top node from the stack and mark it as visited",
      "Push all unvisited neighbors onto the stack",
      "Continue until the stack is empty",
      "Backtrack when a dead end is reached",
      "The first path found may not be the shortest",
    ],
    formula: "Last-In-First-Out (LIFO) Stack",
    formulaExplanation: "DFS uses a stack where the most recently discovered node is explored next. This creates deep exploration before backtracking.",
    selection: "Selects the most recently added node (LIFO). This creates deep, narrow exploration.",
    optimal: false,
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V) worst case, O(d) for depth-limited",
    advantages: [
      "Low memory usage for depth-limited search",
      "Can find a path quickly if the goal is deep in the first branch",
      "Simple to implement recursively",
    ],
    disadvantages: [
      "Does not guarantee shortest path",
      "Can get stuck in infinite paths without cycle detection",
      "May explore very long paths before finding the goal",
    ],
    applications: [
      "Maze solving",
      "Topological sorting",
      "Detecting cycles in graphs",
      "Puzzle solving (e.g., Sudoku)",
    ],
  },
  greedy: {
    name: "Greedy Best-First Search",
    what: "Greedy Best-First Search uses only the heuristic estimate h(n) to select the next node, always choosing the node estimated to be closest to the goal.",
    how: [
      "Initialize a priority queue with the start node",
      "Calculate h(n) for each node (distance to goal)",
      "Select the node with the lowest h(n) from the queue",
      "Expand the node and add its neighbors to the queue",
      "Repeat until the goal is reached or the queue is empty",
      "Ignores the distance already traveled (g(n))",
    ],
    formula: "f(n) = h(n)",
    formulaExplanation: "Greedy only considers the heuristic estimate to the goal, ignoring the actual cost from the start. This can lead to fast but suboptimal paths.",
    selection: "Selects the node with the lowest h(n) (estimated distance to goal). This creates goal-directed but potentially myopic search.",
    optimal: false,
    timeComplexity: "O(b^m) worst case",
    spaceComplexity: "O(b^m)",
    advantages: [
      "Often very fast with a good heuristic",
      "Low memory usage compared to A*",
      "Goal-directed search",
    ],
    disadvantages: [
      "No guarantee of shortest path",
      "Can get stuck in local minima",
      "Performance depends heavily on heuristic quality",
    ],
    applications: [
      "Approximate pathfinding",
      "Real-time systems where speed matters more than optimality",
      "Game AI with simple pathfinding needs",
      "Constraint satisfaction problems",
    ],
  },
};

const HEURISTIC_EXPLANATIONS: Record<Heuristic, {
  name: string;
  formula: string;
  explanation: string;
  whenToUse: string;
}> = {
  manhattan: {
    name: "Manhattan Distance",
    formula: "h(n) = |x - x_goal| + |y - y_goal|",
    explanation: "The sum of absolute differences in row and column coordinates. Assumes movement only in four directions (up, down, left, right) with equal cost.",
    whenToUse: "Best for 4-directional movement grids with uniform cost. Admissible and consistent for this movement type.",
  },
  euclidean: {
    name: "Euclidean Distance",
    formula: "h(n) = √((x - x_goal)² + (y - y_goal)²)",
    explanation: "The straight-line distance between two points. Assumes movement can be in any direction.",
    whenToUse: "Best when movement can be in any direction (8-directional or continuous). Admissible but may overestimate for 4-directional grids.",
  },
  chebyshev: {
    name: "Chebyshev Distance",
    formula: "h(n) = max(|x - x_goal|, |y - y_goal|)",
    explanation: "The maximum of absolute differences in coordinates. Assumes diagonal movement costs the same as cardinal movement.",
    whenToUse: "Best for 8-directional movement where diagonals cost the same as cardinal moves. Admissible for this movement type.",
  },
};

interface AlgorithmExplanationProps {
  algo: Algo;
  heuristic: Heuristic;
}

export function AlgorithmExplanation({ algo, heuristic }: AlgorithmExplanationProps) {
  const info = ALGORITHM_EXPLANATIONS[algo];
  const heurInfo = HEURISTIC_EXPLANATIONS[heuristic];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen className="h-4 w-4 mr-2" />
          How It Works
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto">
        <DialogTitle>{info.name} — How It Works</DialogTitle>
        <DialogDescription>Understanding the algorithm step by step</DialogDescription>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="steps">Steps</TabsTrigger>
            <TabsTrigger value="formula">Formula</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">What is it?</h3>
                  <p className="text-sm text-muted-foreground mt-1">{info.what}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Optimality</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {info.optimal
                      ? "This algorithm guarantees the shortest path when a path exists."
                      : "This algorithm does NOT guarantee the shortest path. It may find a suboptimal route."}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How it selects the next node</h3>
                <p className="text-sm text-muted-foreground">{info.selection}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="steps" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Step-by-step process</h3>
              <ol className="space-y-2">
                {info.how.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="formula" className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-semibold mb-2">Core Formula</h3>
              <code className="text-lg font-mono">{info.formula}</code>
              <p className="text-sm text-muted-foreground mt-3">{info.formulaExplanation}</p>
            </div>

            {(algo === "astar" || algo === "greedy") && (
              <div className="rounded-lg border border-border p-4">
                <h3 className="font-semibold mb-2">Heuristic: {heurInfo.name}</h3>
                <code className="font-mono text-sm">{heurInfo.formula}</code>
                <p className="text-sm text-muted-foreground mt-2">{heurInfo.explanation}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>When to use:</strong> {heurInfo.whenToUse}
                </p>
              </div>
            )}

            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold mb-2">Complexity</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <span className="ml-2 font-mono">{info.timeComplexity}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Space:</span>
                  <span className="ml-2 font-mono">{info.spaceComplexity}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                V = vertices (cells), E = edges (connections), b = branching factor, d = depth, m = maximum depth
              </p>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-success" />
                  Advantages
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {info.advantages.map((adv, i) => (
                    <li key={i}>• {adv}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-border p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Disadvantages
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {info.disadvantages.map((dis, i) => (
                    <li key={i}>• {dis}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-semibold mb-2">Practical Applications</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {info.applications.map((app, i) => (
                  <li key={i}>• {app}</li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
