import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Context) {
  const { id } = await context.params;
  const spec = await db.spec.findUnique({
    where: { id },
    include: {
      userStories: { orderBy: { order: "asc" } },
      tasks: { orderBy: { order: "asc" } }
    }
  });

  if (!spec) {
    return NextResponse.json({ error: "Spec not found." }, { status: 404 });
  }

  // Stories are saved as JSON text in DB, so parse before returning.
  return NextResponse.json({
    spec: {
      ...spec,
      userStories: spec.userStories.map((story) => ({
        ...story,
        acceptanceCriteria: JSON.parse(story.acceptanceCriteria) as string[]
      }))
    }
  });
}
