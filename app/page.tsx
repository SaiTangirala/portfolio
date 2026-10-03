import Link from "next/link";

const projects = [
  {
    href: "/pddl",
    title: "Robot Path Planning",
    blurb: "Watch an AI find the shortest route through a maze, step by step.",
    tag: "AI Planning",
  },
  {
    href: "/conformal",
    title: "Trustworthy Predictions",
    blurb: "See how an AI can say not just a price, but how sure it is.",
    tag: "Machine Learning",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-slate-900">Sai Tangirala</h1>
        <p className="mt-3 text-lg text-slate-600">
          AI projects you can try right now. No sign-up needed.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {projects.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                {p.tag}
              </span>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{p.title}</h2>
              <p className="mt-2 text-slate-600">{p.blurb}</p>
              <span className="mt-4 inline-block font-medium text-indigo-600">Try it →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}