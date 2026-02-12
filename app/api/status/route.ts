import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pingLLM } from "@/lib/llm";

export async function GET() {
  let database: "ok" | "down" = "ok";

  try {
    // Simple DB query for health check.
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }

  const llm = await pingLLM();

  return NextResponse.json({
    backend: "ok",
    database,
    llm,
    timestamp: new Date().toISOString()
  });
}
