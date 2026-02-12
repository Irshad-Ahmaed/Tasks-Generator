import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskUpdateSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = taskUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid task update payload." }, { status: 400 });
  }

  const existing = await db.task.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  // Allow small updates from inline edits.
  const updated = await db.task.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ task: updated });
}
