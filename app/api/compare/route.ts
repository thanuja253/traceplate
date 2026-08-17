import { NextResponse } from "next/server";
import { DatabaseUnavailableError } from "@/lib/neo4j";
import { getSharedSources } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const a = params.get("a") ?? "";
  const b = params.get("b") ?? "";

  if (!a || !b) {
    return NextResponse.json({ error: "Pick two kitchens." }, { status: 400 });
  }
  if (a === b) {
    return NextResponse.json(
      { error: "Pick two different kitchens — a node is always an ancestor of itself." },
      { status: 400 },
    );
  }

  try {
    const sources = await getSharedSources(a, b);
    return NextResponse.json({ sources });
  } catch (err) {
    const status = err instanceof DatabaseUnavailableError ? 503 : 500;
    const error = err instanceof Error ? err.message : "Compare failed";
    return NextResponse.json({ error, sources: [] }, { status });
  }
}
