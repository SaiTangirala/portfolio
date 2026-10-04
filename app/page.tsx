import Link from "next/link";

const projects = [
  {
    href: "/pddl",
    tag: "AI Planning",
    title: "Robot Path Planning",
    blurb: "Draw a maze and watch an AI find the shortest route, step by step.",
    used: "Warehouse robots, delivery routes, game characters.",
    skills: "Search algorithms, planning, interactive visualisation",
    time: "Takes 10 seconds",
  },
  {
    href: "/conformal",
    tag: "Machine Learning",
    title: "Trustworthy Predictions",
    blurb:
      "An AI predicts a house price and tells you honestly how sure it is. Drag a slider to see the margin change.",
    used: "Pricing, medical risk estimates, demand forecasting.",
    skills: "Uncertainty estimation, model evaluation, data visualisation",
    time: "Takes 10 seconds",
  },
];

function Hero() {
  const route = "30,170 230,170 230,30 370,30 370,110";
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <svg viewBox="0 0 400 200" className="w-full" role="img" aria-label="A route being found through a maze, surrounded by an uncertainty band">
        <defs>
          <pattern id="cells" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="200" fill="url(#cells)" />
        <polyline
          points={route}
          fill="none"
          stroke="#6366f1"
          strokeOpacity="0.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="pulse-band"
        />
        <rect x="160" y="0" width="20" height="140" fill="#1e293b" />
        <rect x="260" y="60" width="20" height="140" fill="#1e293b" />
        <polyline
          points={route}
          pathLength={1}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="draw-path"
        />
        <circle cx="30" cy="170" r="8" fill="#22c55e" />
        <circle cx="370" cy="110" r="8" fill="#ef4444" />
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen grid-paper px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          AI / Machine Learning Engineer
        </p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Sai Tangirala</h1>
        <p className="mt-3 text-xl font-medium text-slate-800">Plan the route. Quantify the doubt.</p>
        <p className="mt-4 text-lg text-slate-600">
          I build AI systems and explain them clearly. Instead of reading about my
          projects, try them below. No sign-up and nothing to install.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          MSc in AI &amp; Machine Learning, Royal Holloway, University of London
        </p>
        <Hero />

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {projects.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                {p.tag}
              </span>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{p.title}</h2>
              <p className="mt-2 text-slate-600">{p.blurb}</p>
              <p className="mt-3 text-sm text-slate-500">
                <b className="text-slate-700">Used in:</b> {p.used}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                <b className="text-slate-700">Skills shown:</b> {p.skills}
              </p>
              <span className="mt-4 inline-block font-medium text-indigo-600">
                Try it → <span className="text-sm font-normal text-slate-400">{p.time}</span>
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-400">
          These demos use simplified or synthetic data and run entirely in your browser.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="https://www.linkedin.com/in/sai-tarun-tangirala-8a9119293/?isSelfProfile=true"
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            LinkedIn
          </a>
          <a
            href="https://github.com/SaiTangirala"
            className="rounded-lg bg-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-300"
          >
            GitHub
          </a>
        </div>
      </div>
    </main>
  );
}