import { NextResponse } from "next/server";
import { DatabaseUnavailableError } from "@/lib/neo4j";
import { searchGraph } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const hits = await searchGraph(q);
    return NextResponse.json({ hits });
  } catch (err) {
    const status = err instanceof DatabaseUnavailableError ? 503 : 500;
    const error = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error, hits: [] }, { status });
  }
}
