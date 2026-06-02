import { NextRequest, NextResponse } from "next/server";
import { updateSettings } from "@/lib/store";
import { getPublicSettings } from "@/lib/public-settings";
import type { GatewaySettings } from "@/lib/hootsuite/types";

export async function GET(request: NextRequest) {
  return NextResponse.json(getPublicSettings(request));
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as Partial<GatewaySettings>;
  const updated = updateSettings(body);
  return NextResponse.json(updated);
}
