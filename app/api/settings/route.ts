import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/store";
import type { GatewaySettings } from "@/lib/hootsuite/types";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as Partial<GatewaySettings>;
  const updated = updateSettings(body);
  return NextResponse.json(updated);
}
