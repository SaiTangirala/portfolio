"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Row = { x: number; y: number };

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeData(seed: number) {
  const rand = mulberry32(seed);
  const normal = () => {
    const u = Math.max(rand(), 1e-9);
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const rows: Row[] = Array.from({ length: 600 }, () => {
    const x = 40 + rand() * 210; // house size in m²
    const sd = 8 + 0.12 * x;
    const spike = rand() < 0.05 ? 5 : 1; // occasional outliers
    return { x, y: 50 + 2.2 * x + sd * normal() * spike }; // price in £ thousands
  });
  return {
    train: rows.slice(0, 200),
    calib: rows.slice(200, 400),
    test: rows.slice(400),
  };
}

// z-score for a two-sided confidence level (bell-curve assumption)
function zFor(C: number) {
  const p = (1 - C) / 2;
  const t = Math.sqrt(-2 * Math.log(p));
  return (
    t -
    (2.515517 + 0.802853 * t + 0.010328 * t * t) /
      (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t)
  );
}

type Method = "conformal" | "naive";

export default function Conformal() {
  const [seed, setSeed] = useState(7);
  const [conf, setConf] = useState(90);
  const [method, setMethod] = useState<Method>("conformal");
  const [size, setSize] = useState(120);

  const d = useMemo(() => {
    const { train, calib, test } = makeData(seed);
    const n = train.length;
    const mx = train.reduce((s, r) => s + r.x, 0) / n;
    const my = train.reduce((s, r) => s + r.y, 0) / n;
    let sxx = 0;
    let sxy = 0;
    for (const r of train) {
      sxx += (r.x - mx) ** 2;
      sxy += (r.x - mx) * (r.y - my);
    }
    const b = sxy / sxx;
    const a = my - b * mx;
    const predict = (x: number) => a + b * x;
    const scores = calib.map((r) => Math.abs(r.y - predict(r.x))).sort((p, q) => p - q);
    const sd = Math.sqrt(
      train.reduce((s, r) => s + (r.y - predict(r.x)) ** 2, 0) / (n - 2)
    );
    return { test, predict, scores, sd };
  }, [seed]);

  const C = conf / 100;
  const k = Math.min(d.scores.length, Math.ceil((d.scores.length + 1) * C));
  const qConf = d.scores[k - 1];
  const qNaive = zFor(C) * d.sd;
  const half = method === "conformal" ? qConf : qNaive;

  const inside = (r: Row) => Math.abs(r.y - d.predict(r.x)) <= half;
  const coverage = (d.test.filter(inside).length / d.test.length) * 100;
  const diff = coverage - conf;
  const hitTarget = diff >= -2;

  // chart geometry
  const W = 640;
  const H = 340;
  const pad = { l: 55, r: 15, t: 15, b: 40 };
  const xMin = 40;
  const xMax = 250;
  const ys = d.test.map((r) => r.y);
  const yMin = Math.floor((Math.min(...ys) - 20) / 50) * 50;
  const yMax = Math.ceil((Math.max(...ys) + 20) / 50) * 50;
  const sx = (x: number) => pad.l + ((x - xMin) / (xMax - xMin)) * (W - pad.l - pad.r);
  const sy = (y: number) => H - pad.b - ((y - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);

  const bandPoints = [
    [xMin, d.predict(xMin) + half],
    [xMax, d.predict(xMax) + half],
    [xMax, d.predict(xMax) - half],
    [xMin, d.predict(xMin) - half],
  ]
    .map(([x, y]) => `${sx(x)},${sy(y)}`)
    .join(" ");

  const xTicks = [50, 100, 150, 200, 250];
  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) / 4) * i);
  const pred = d.predict(size);

  const methodBtn = (m: Method, label: string) => (
    <button
      onClick={() => setMethod(m)}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
        method === m ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-indigo-600">← Back to projects</Link>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Trustworthy Predictions</h1>

        <div className="mt-4 space-y-1 text-slate-700">
          <p><b>What it is:</b> A model predicts house prices and also says how sure it is.</p>
          <p><b>What to try:</b> Drag the confidence slider and watch the shaded band grow and shrink.</p>
          <p><b>What you&apos;re seeing:</b> Each dot is a house the model has never seen. Blue dots fall inside the band, red dots fall outside.</p>
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-slate-700">
            How sure should it be? <span className="text-indigo-600">{conf}%</span>
          </label>
          <input
            type="range"
            min={80}
            max={99}
            value={conf}
            onChange={(e) => setConf(Number(e.target.value))}
            className="mt-1 w-full"
          />
          <p className="text-xs text-slate-500">Higher confidence means a wider, safer range.</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Method:</span>
          {methodBtn("conformal", "Conformal (with a guarantee)")}
          {methodBtn("naive", "Bell-curve guess")}
          <button
            onClick={() => setSeed((s) => s + 1)}
            className="ml-auto rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300"
          >
            New random houses
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <defs>
              <clipPath id="plot">
                <rect x={pad.l} y={pad.t} width={W - pad.l - pad.r} height={H - pad.t - pad.b} />
              </clipPath>
            </defs>
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} stroke="#e2e8f0" />
                <text x={pad.l - 6} y={sy(t) + 4} textAnchor="end" fontSize="11" fill="#64748b">
                  £{Math.round(t)}k
                </text>
              </g>
            ))}
            {xTicks.map((t) => (
              <text key={t} x={sx(t)} y={H - pad.b + 16} textAnchor="middle" fontSize="11" fill="#64748b">
                {t} m²
              </text>
            ))}
            <text x={(pad.l + W - pad.r) / 2} y={H - 6} textAnchor="middle" fontSize="12" fill="#475569">
              House size
            </text>

            <g clipPath="url(#plot)">
              <polygon points={bandPoints} fill="#c7d2fe" opacity="0.6" />
              <line
                x1={sx(xMin)} y1={sy(d.predict(xMin))}
                x2={sx(xMax)} y2={sy(d.predict(xMax))}
                stroke="#334155" strokeWidth="2"
              />
              {d.test.map((r, i) => (
                <circle
                  key={i}
                  cx={sx(r.x)}
                  cy={sy(r.y)}
                  r="3"
                  fill={inside(r) ? "#6366f1" : "#ef4444"}
                  opacity="0.85"
                />
              ))}
              <line x1={sx(size)} x2={sx(size)} y1={pad.t} y2={H - pad.b} stroke="#f59e0b" strokeDasharray="4 3" />
              <circle cx={sx(size)} cy={sy(pred)} r="5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
            </g>
          </svg>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Promised</p>
            <p className="text-2xl font-bold text-slate-900">{conf}%</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Actually inside</p>
            <p className={`text-2xl font-bold ${hitTarget ? "text-green-600" : "text-red-600"}`}>
              {coverage.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Typical range</p>
            <p className="text-2xl font-bold text-slate-900">± £{Math.round(half)}k</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {hitTarget
            ? "The model kept its promise: about as many houses fell inside the band as it said."
            : "The model fell short of its promise: fewer houses fell inside the band than it claimed."}{" "}
          Switch methods and try 99% to compare. New random houses will change the exact numbers.
        </p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <label className="text-sm font-medium text-slate-700">
            Try a house size: <span className="text-amber-600">{size} m²</span>
          </label>
          <input
            type="range"
            min={40}
            max={250}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="mt-1 w-full"
          />
          <p className="mt-2 text-slate-800">
            Predicted price: <b>£{Math.round(pred)}k</b>. Likely between{" "}
            <b>£{Math.round(pred - half)}k</b> and <b>£{Math.round(pred + half)}k</b>.
          </p>
        </div>

        <details className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-slate-800">For engineers</summary>
          <p className="mt-3 text-sm text-slate-600">
            Split conformal prediction. A linear model is fitted on 200 training houses. On 200
            separate calibration houses the absolute residuals are sorted, and the
            ⌈(n+1)·confidence⌉-th smallest becomes the interval half-width (currently ±
            {qConf.toFixed(1)}). Coverage is then measured on 200 unseen test houses. The
            &quot;bell-curve guess&quot; instead uses z × residual standard deviation (± {qNaive.toFixed(1)}),
            which assumes normally distributed errors. This data is synthetic and includes
            occasional outliers. Everything runs live in your browser.
          </p>
        </details>
      </div>
    </main>
  );
}