export type Algo = "astar" | "bfs" | "dfs" | "greedy";
export type Heuristic = "manhattan" | "euclidean" | "chebyshev";

export const ALGOS: { id: Algo; name: string; short: string; optimal: boolean }[] = [
  { id: "astar", name: "A* Search", short: "A*", optimal: true },
  { id: "bfs", name: "Breadth-First Search", short: "BFS", optimal: true },
  { id: "dfs", name: "Depth-First Search", short: "DFS", optimal: false },
  { id: "greedy", name: "Greedy Best-First", short: "Greedy", optimal: false },
];

export interface Grid {
  size: number;
  walls: Uint8Array;
  start: number;
  goal: number;
}

export interface SearchResult {
  order: number[]; // expansion order
  visitedAt: Int32Array; // step at which cell expanded (-1 none)
  addedAt: Int32Array; // step at which cell entered frontier (-1 none)
  path: number[];
  found: boolean;
}

function h(a: number, b: number, n: number, kind: Heuristic) {
  const dx = Math.abs((a % n) - (b % n));
  const dy = Math.abs(Math.floor(a / n) - Math.floor(b / n));
  if (kind === "euclidean") return Math.sqrt(dx * dx + dy * dy);
  if (kind === "chebyshev") return Math.max(dx, dy);
  return dx + dy;
}

function neighbors(i: number, n: number, walls: Uint8Array): number[] {
  const x = i % n, y = (i / n) | 0, out: number[] = [];
  if (y > 0 && !walls[i - n]) out.push(i - n);
  if (x < n - 1 && !walls[i + 1]) out.push(i + 1);
  if (y < n - 1 && !walls[i + n]) out.push(i + n);
  if (x > 0 && !walls[i - 1]) out.push(i - 1);
  return out;
}

class MinHeap {
  private a: [number, number, number][] = []; // [priority, tie, node]
  get size() { return this.a.length; }
  push(v: [number, number, number]) {
    const a = this.a; a.push(v);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.lt(a[i], a[p])) { [a[i], a[p]] = [a[p], a[i]]; i = p; } else break;
    }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop()!;
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && this.lt(a[l], a[m])) m = l;
        if (r < a.length && this.lt(a[r], a[m])) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]]; i = m;
      }
    }
    return top;
  }
  private lt(x: [number, number, number], y: [number, number, number]) {
    return x[0] < y[0] || (x[0] === y[0] && x[1] < y[1]);
  }
}

export function runSearch(grid: Grid, algo: Algo, heuristic: Heuristic = "manhattan"): SearchResult {
  const { size: n, walls, start, goal } = grid;
  const N = n * n;
  const visitedAt = new Int32Array(N).fill(-1);
  const addedAt = new Int32Array(N).fill(-1);
  const parent = new Int32Array(N).fill(-1);
  const order: number[] = [];
  let found = false;
  let step = 0;
  const expand = (c: number) => { visitedAt[c] = step; order.push(c); step++; };

  if (algo === "bfs") {
    const q = [start]; let head = 0; addedAt[start] = 0;
    while (head < q.length) {
      const c = q[head++]; expand(c);
      if (c === goal) { found = true; break; }
      for (const nb of neighbors(c, n, walls)) {
        if (addedAt[nb] === -1) { addedAt[nb] = step; parent[nb] = c; q.push(nb); }
      }
    }
  } else if (algo === "dfs") {
    const st = [start]; addedAt[start] = 0;
    while (st.length) {
      const c = st.pop()!;
      if (visitedAt[c] !== -1) continue;
      expand(c);
      if (c === goal) { found = true; break; }
      const nbs = neighbors(c, n, walls);
      for (let k = nbs.length - 1; k >= 0; k--) {
        const nb = nbs[k];
        if (visitedAt[nb] === -1) { parent[nb] = c; addedAt[nb] = addedAt[nb] === -1 ? step : addedAt[nb]; st.push(nb); }
      }
    }
  } else {
    const g = new Float64Array(N).fill(Infinity);
    g[start] = 0;
    const heap = new MinHeap(); let tie = 0;
    heap.push([h(start, goal, n, heuristic), 0, start]); addedAt[start] = 0;
    while (heap.size) {
      const [, , c] = heap.pop();
      if (visitedAt[c] !== -1) continue;
      expand(c);
      if (c === goal) { found = true; break; }
      for (const nb of neighbors(c, n, walls)) {
        if (visitedAt[nb] !== -1) continue;
        const ng = g[c] + 1;
        if (algo === "astar") {
          if (ng < g[nb]) {
            g[nb] = ng; parent[nb] = c;
            if (addedAt[nb] === -1) addedAt[nb] = step;
            const hv = h(nb, goal, n, heuristic);
            heap.push([ng + hv, ++tie + hv * 1e6, nb]);
          }
        } else if (addedAt[nb] === -1) {
          addedAt[nb] = step; parent[nb] = c;
          heap.push([h(nb, goal, n, heuristic), ++tie, nb]);
        }
      }
    }
  }

  const path: number[] = [];
  if (found) {
    for (let c = goal; c !== -1; c = parent[c]) path.push(c);
    path.reverse();
  }
  return { order, visitedAt, addedAt, path, found };
}

/** Times an algorithm by averaging repeated runs for sub-millisecond precision. */
export function timeSearch(grid: Grid, algo: Algo, heuristic: Heuristic) {
  const reps = 15;
  runSearch(grid, algo, heuristic);
  const t0 = performance.now();
  let res!: SearchResult;
  for (let i = 0; i < reps; i++) res = runSearch(grid, algo, heuristic);
  return { result: res, ms: (performance.now() - t0) / reps };
}

export function emptyGrid(size: number): Grid {
  const mid = Math.floor(size / 2);
  return {
    size,
    walls: new Uint8Array(size * size),
    start: mid * size + 1,
    goal: mid * size + size - 2,
  };
}

/** Recursive-backtracker maze with extra openings so multiple routes exist. */
export function generateMaze(size: number, rand = Math.random): Grid {
  const walls = new Uint8Array(size * size).fill(1);
  const stack: [number, number][] = [[1, 1]];
  walls[size + 1] = 0;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const dirs = ([[2, 0], [-2, 0], [0, 2], [0, -2]] as const).filter(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx > 0 && ny > 0 && nx < size - 1 && ny < size - 1 && walls[ny * size + nx];
    });
    if (!dirs.length) { stack.pop(); continue; }
    const [dx, dy] = dirs[Math.floor(rand() * dirs.length)];
    walls[(y + dy / 2) * size + x + dx / 2] = 0;
    walls[(y + dy) * size + x + dx] = 0;
    stack.push([x + dx, y + dy]);
  }
  for (let i = 0; i < size * size * 0.08; i++) {
    const x = 1 + Math.floor(rand() * (size - 2)), y = 1 + Math.floor(rand() * (size - 2));
    walls[y * size + x] = 0;
  }
  const start = size + 1;
  const last = size % 2 === 0 ? size - 3 : size - 2;
  const goal = last * size + last;
  walls[start] = 0; walls[goal] = 0;
  return { size, walls, start, goal };
}
