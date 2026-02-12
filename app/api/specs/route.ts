import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Number(limitParam || 5);

  // Keep limit in a safe range, even if query input is bad.
  const specs = await db.spec.findMany({
    orderBy: { createdAt: "desc" },
    take: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 20) : 5,
    select: {
      id: true,
      title: true,
      templateType: true,
      createdAt: true
    }
  });

  return NextResponse.json({ specs });
}
