import Link from "next/link";
import { FeatureForm } from "@/components/FeatureForm";
import { db } from "@/lib/db";

export default async function HomePage() {
  let specs: Array<{ id: string; title: string; templateType: string; createdAt: Date }> = [];
  let dbWarning: string | null = null;

  try {
    specs = await db.spec.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        templateType: true,
        createdAt: true
      }
    });
  } catch {
    // This warns clearly when Prisma isn't initialized yet.
    dbWarning = "Database is not ready yet. Run prisma setup, then refresh this page.";
  }

  return (
    <section className="grid gap-5 pb-8 pt-5">
      <div className="rounded-2xl border border-zinc-300 bg-[linear-gradient(120deg,rgba(231,234,239,0.92),rgba(255,255,255,0.98))] p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)]">
        <h1 className="m-0 text-[clamp(1.8rem,3vw,2.4rem)] font-bold leading-[1.15]">Tasks Generator</h1>
        <p className="mt-2.5 max-w-[700px] text-zinc-500">
          Turn rough ideas into implementation-ready plans with grouped tasks, quick edits, and clean exports.
        </p>
        <ol>
          <li>Fill in the feature brief.</li>
          <li>Generate user stories and engineering tasks.</li>
          <li>Edit/group/reorder and export the result.</li>
        </ol>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <FeatureForm />

        <aside className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)]">
          <h2 className="mb-2.5 text-xl font-semibold">Last 5 Specs</h2>
          {dbWarning && <p className="mt-2 text-red-700">{dbWarning}</p>}

          {!dbWarning && specs.length === 0 && <p className="text-zinc-500">No specs yet. Generate your first one.</p>}

          <div className="grid gap-2">
            {specs.map((spec) => (
              <Link
                key={spec.id}
                href={`/specs/${spec.id}`}
                className="block rounded-xl border border-zinc-300 bg-white p-3 no-underline transition hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-[0_10px_18px_rgba(17,17,17,0.08)]"
              >
                <strong>{spec.title}</strong>
                <p className="mb-0 text-zinc-500">
                  {spec.templateType} - {new Date(spec.createdAt).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
