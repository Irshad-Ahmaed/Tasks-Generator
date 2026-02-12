import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { markdownToText } from "@/lib/exporters";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { format?: "markdown" | "text" };

  const spec = await db.spec.findUnique({ where: { id } });
  if (!spec) {
    return NextResponse.json({ error: "Spec not found." }, { status: 404 });
  }

  const format = body.format || "markdown";
  // UI can ask for markdown or plain text from one endpoint.
  const content = format === "text" ? markdownToText(spec.generatedMarkdown) : spec.generatedMarkdown;

  return NextResponse.json({
    content,
    format,
    filename: `${spec.title.replace(/\s+/g, "-").toLowerCase()}.${format === "text" ? "txt" : "md"}`
  });
}
