"use client";

import { useEffect, useRef, useState } from "react";

const ROWS = 12;
const COLS = 20;
type Pos = [number, number];
type Tool = "wall" | "start" | "goal";
type Algo = "bfs" | "astar";

const key = (r: number, c: number) => r * COLS + c;
const emptyGrid = () =>
  Array.from({ length: ROWS }, () => Array<boolean>(COLS).fill(false));

function search(walls: boolean[][], start: Pos, goal: Pos, algo: Algo) {
  const startK = key(start[0], start[1]);
  const goalK = key(goal[0], goal[1]);
  const h = (k: number) =>
    Math.abs(Math.floor(k / COLS) - goal[0]) + Math.abs((k % COLS) - goal[1]);
  const g = new Map<number, number>([[startK, 0]]);
  const parent = new Map<number, number>();
  const closed = new Set<number>();
  const explored: number[] = [];
  const open: number[] = [startK];
  const score = (k: number) => (g.get(k) ?? 0) + (algo === "astar" ? h(k) : 0);

  while (open.length > 0) {
    let best = 0;
    if (algo === "astar") {
      for (let i = 1; i < open.length; i++) {
        if (score(open[i]) < score(open[best])) best = i;
      }
    }
    const cur = open.splice(best, 1)[0];
    if (closed.has(cur)) continue;
    closed.add(cur);
    explored.push(cur);
    if (cur === goalK) break;

    const r = Math.floor(cur / COLS);
    const c = cur % COLS;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS || walls[nr][nc]) continue;
      const nk = key(nr, nc);
      if (closed.has(nk)) continue;
      const ng = (g.get(cur) ?? 0) + 1;
      if (!g.has(nk) || ng < (g.get(nk) as number)) {
        g.set(nk, ng);
        parent.set(nk, cur);
        open.push(nk);
      }
    }
  }

  const path: number[] = [];
  if (closed.has(goalK)) {
    let k = goalK;
    path.push(k);
    while (k !== startK) {
      k = parent.get(k) as number;
      path.push(k);
    }
    path.reverse();
  }
  return { explored, path };
}

export default function Pddl() {
  const [walls, setWalls] = useState<boolean[][]>(emptyGrid);
  const [start, setStart] = useState<Pos>([6, 2]);
  const [goal, setGoal] = useState<Pos>([6, 17]);
  const [tool, setTool] = useState<Tool>("wall");
  const [algo, setAlgo] = useState<Algo>("astar");
  const [visited, setVisited] = useState<number[]>([]);
  const [path, setPath] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const painting = useRef<boolean | null>(null);

  const stopTimer = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    []
  );

  const resetResults = () => {
    stopTimer();
    setRunning(false);
    setVisited([]);
    setPath([]);
    setDone(false);
  };

  const isStart = (r: number, c: number) => r === start[0] && c === start[1];
  const isGoal = (r: number, c: number) => r === goal[0] && c === goal[1];

  const setWall = (r: number, c: number, value: boolean) => {
    if (running || isStart(r, c) || isGoal(r, c)) return;
    resetResults();
    setWalls((w) => w.map((row, ri) => row.map((v, ci) => (ri === r && ci === c ? value : v))));
  };

  const handleDown = (r: number, c: number) => {
    if (running) return;
    if (tool === "wall") {
      const value = !walls[r][c];
      painting.current = value;
      setWall(r, c, value);
    } else if (tool === "start" && !isGoal(r, c)) {
      resetResults();
      setWalls((w) => w.map((row, ri) => row.map((v, ci) => (ri === r && ci === c ? false : v))));
      setStart([r, c]);
    } else if (tool === "goal" && !isStart(r, c)) {
      resetResults();
      setWalls((w) => w.map((row, ri) => row.map((v, ci) => (ri === r && ci === c ? false : v))));
      setGoal([r, c]);
    }
  };

  const handleEnter = (r: number, c: number) => {
    if (tool === "wall" && painting.current !== null) setWall(r, c, painting.current);
  };

  const run = () => {
    resetResults();
    const res = search(walls, start, goal, algo);
    setRunning(true);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      setVisited(res.explored.slice(0, i));
      if (i >= res.explored.length) {
        stopTimer();
        setRunning(false);
        setPath(res.path);
        setDone(true);
      }
    }, 15);
  };

  const loadPreset = (name: "open" | "gap" | "maze") => {
    resetResults();
    const w = emptyGrid();
    if (name === "open") {
      setStart([6, 2]);
      setGoal([6, 17]);
    }
    if (name === "gap") {
      for (let r = 0; r < 10; r++) w[r][10] = true;
      setStart([5, 2]);
      setGoal([5, 17]);
    }
    if (name === "maze") {
      for (let r = 0; r <= 8; r++) w[r][5] = true;
      for (let r = 3; r <= 11; r++) w[r][9] = true;
      for (let r = 0; r <= 8; r++) w[r][13] = true;
      for (let r = 3; r <= 11; r++) w[r][16] = true;
      setStart([6, 1]);
      setGoal([6, 18]);
    }
    setWalls(w);
  };

  const visitedSet = new Set(visited);
  const pathSet = new Set(path);
  const wallCount = walls.flat().filter(Boolean).length;
  const pathSteps = path.length > 0 ? path.length - 1 : null;

  const cellClass = (r: number, c: number) => {
    if (isStart(r, c)) return "bg-green-500";
    if (isGoal(r, c)) return "bg-red-500";
    if (walls[r][c]) return "bg-slate-800";
    if (pathSet.has(key(r, c))) return "bg-amber-400";
    if (visitedSet.has(key(r, c))) return "bg-indigo-200";
    return "bg-white";
  };

  const toolBtn = (t: Tool, label: string) => (
    <button
      onClick={() => setTool(t)}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
        tool === t ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );

  const algoBtn = (a: Algo, label: string) => (
    <button
      onClick={() => {
        if (!running) {
          resetResults();
          setAlgo(a);
        }
      }}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
        algo === a ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );

  const domain = `(define (domain grid-navigation)
  (:predicates (at ?c) (adjacent ?a ?b) (wall ?c))
  (:action move
    :parameters (?from ?to)
    :precondition (and (at ?from) (adjacent ?from ?to)
                       (not (wall ?to)))
    :effect (and (not (at ?from)) (at ?to))))`;

  const problem = `(define (problem grid-robot)
  (:domain grid-navigation)
  ;; ${wallCount} blocked cells in the current maze
  (:init (at cell-${start[0]}-${start[1]}))
  (:goal (at cell-${goal[0]}-${goal[1]})))`;

  return (
    <main className="min-h-screen grid-paper px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm text-indigo-600">← Back to projects</a>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Robot Path Planning</h1>

        <div className="mt-4 space-y-1 text-slate-700">
          <p><b>What it is:</b> A robot must find a route from the green square to the red square.</p>
          <p><b>What to try:</b> Click the grid to draw walls, then press Run.</p>
          <p><b>What you&apos;re seeing:</b> Blue squares are places the AI checked. The yellow line is the route it found.</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Click to place:</span>
          {toolBtn("wall", "Walls")}
          {toolBtn("start", "Start")}
          {toolBtn("goal", "Goal")}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Method:</span>
          {algoBtn("bfs", "Search everywhere (BFS)")}
          {algoBtn("astar", "Search smartly (A*)")}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Examples:</span>
          <button onClick={() => loadPreset("open")} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">Open field</button>
          <button onClick={() => loadPreset("gap")} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">Wall with a gap</button>
          <button onClick={() => loadPreset("maze")} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">Maze</button>
        </div>

        <div
          className="mt-5 grid select-none gap-px rounded-lg border border-slate-300 bg-slate-300 p-px"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          onMouseUp={() => (painting.current = null)}
          onMouseLeave={() => (painting.current = null)}
        >
          {walls.map((row, r) =>
            row.map((_, c) => (
              <div
                key={key(r, c)}
                onMouseDown={() => handleDown(r, c)}
                onMouseEnter={() => handleEnter(r, c)}
                className={`aspect-square cursor-pointer ${cellClass(r, c)}`}
              />
            ))
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={run}
            disabled={running}
            className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {running ? "Searching…" : "Run"}
          </button>
          <button
            onClick={() => {
              resetResults();
              setWalls(emptyGrid());
            }}
            className="rounded-lg bg-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-300"
          >
            Reset
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Squares searched</p>
            <p className="text-3xl font-bold text-slate-900">{visited.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Steps in the route</p>
            <p className="text-3xl font-bold text-slate-900">
              {done ? (pathSteps !== null ? pathSteps : "No route") : "—"}
            </p>
          </div>
        </div>

        {done && pathSteps === null && (
          <p className="mt-3 text-sm text-red-600">No route exists. The goal is walled off.</p>
        )}
        <p className="mt-3 text-sm text-slate-600">
          Tip: run the same maze with each method. Both find a shortest route, but the smart
          method usually checks far fewer squares.
        </p>

        <details className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-slate-800">For engineers</summary>
          <p className="mt-3 text-sm text-slate-600">
            The grid is modelled as a PDDL navigation domain. BFS expands states in order of
            distance; A* uses a Manhattan-distance heuristic to prioritise states closer to the
            goal. Both run live in your browser.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{domain}</pre>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{problem}</pre>
        </details>
      </div>
    </main>
  );
}