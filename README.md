# PathMind Visualizer

Build a modern, professional, single-screen web application named PathMind AI — Search Algorithm Visualizer using React, Vite, Tailwind CSS, Lucide React, and Recharts. Use a clean white background, subtle borders, rounded cards, and a compact desktop-first layout. Everything must fit within one 1440 × 900 viewport without scrolling.

Create a three-column layout: a left control panel for selecting A*, BFS, DFS, and Greedy Best-First Search, grid size, heuristic, maze generation, and clearing the grid; a large central interactive maze grid with start/end markers, obstacles, animated exploration, and a highlighted final path; and a right statistics panel showing nodes explored, path length, execution time, and search status.

Below the main workspace, display an algorithm comparison table and Recharts visualizations comparing nodes explored and execution time. Add Play, Pause, Reset, and animation speed controls. Use distinct colors for visited cells, the active search frontier, walls, start/end points, and the final path.

Implement real, working search algorithms in JavaScript. Calculate all statistics from actual executions; do not use hardcoded sample results. Ensure the algorithms work with interactive obstacles and produce correct paths. Keep the interface visually polished, accessible, and responsive. On smaller screens, rearrange the layout rather than allowing horizontal overflow. No separate pages, unnecessary navigation, or decorative elements that reduce the space available for the visualization.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9183a9a0-dd60-4158-a00e-311fd81b45d1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
