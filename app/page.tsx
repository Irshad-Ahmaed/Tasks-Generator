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
    <section className="grid" style={{ gap: 20, paddingTop: 20, paddingBottom: 30 }}>
      <div className="panel hero-panel">
        <h1 className="hero-title">Tasks Generator</h1>
        <p className="muted hero-subtitle">
          Turn rough ideas into implementation-ready plans with grouped tasks, quick edits, and clean exports.
        </p>
        <ol>
          <li>Fill in the feature brief.</li>
          <li>Generate user stories and engineering tasks.</li>
          <li>Edit/group/reorder and export the result.</li>
        </ol>
      </div>

      <div className="grid two">
        <FeatureForm />

        <aside className="panel">
          <h2 className="section-title">Last 5 Specs</h2>
          {dbWarning && <p className="error">{dbWarning}</p>}

          {!dbWarning && specs.length === 0 && <p className="muted">No specs yet. Generate your first one.</p>}

          <div className="grid" style={{ gap: 8 }}>
            {specs.map((spec) => (
              <Link key={spec.id} href={`/specs/${spec.id}`} className="task-row history-link">
                <strong>{spec.title}</strong>
                <p className="muted" style={{ marginBottom: 0 }}>
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
