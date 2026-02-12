import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reorderSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reorder payload." }, { status: 400 });
  }

  const spec = await db.spec.findUnique({ where: { id }, select: { id: true } });
  if (!spec) {
    return NextResponse.json({ error: "Spec not found." }, { status: 404 });
  }

  // Update all task positions together.
  await db.$transaction(
    parsed.data.items.map((item) =>
      db.task.update({
        where: { id: item.id },
        data: {
          order: item.order,
          group: item.group,
          status: item.status
        }
      })
    )
  );

  return NextResponse.json({ ok: true });
}
