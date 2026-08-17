import { NextResponse } from "next/server";
import { healthcheck } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await healthcheck();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
