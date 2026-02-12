import { notFound } from "next/navigation";
import { SpecWorkspace } from "@/components/SpecWorkspace";
import { db } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SpecPage({ params }: Props) {
  const { id } = await params;

  const spec = await db.spec.findUnique({
    where: { id },
    include: {
      userStories: { orderBy: { order: "asc" } },
      tasks: { orderBy: { order: "asc" } }
    }
  });

  if (!spec) {
    notFound();
  }

  const normalizedSpec = {
    ...spec,
    createdAt: spec.createdAt.toISOString(),
    updatedAt: spec.updatedAt.toISOString(),
    userStories: spec.userStories.map((story) => ({
      ...story,
      acceptanceCriteria: JSON.parse(story.acceptanceCriteria) as string[],
      priority: story.priority as "high" | "medium" | "low"
    })),
    tasks: spec.tasks.map((task) => ({
      ...task,
      group: task.group as "frontend" | "backend" | "qa" | "devops" | "product" | "unknown",
      status: task.status as "todo" | "in_progress" | "done",
      priority: task.priority as "high" | "medium" | "low"
    }))
  };

  return <SpecWorkspace initialSpec={normalizedSpec} />;
}
