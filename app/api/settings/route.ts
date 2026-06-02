import { NextRequest, NextResponse } from "next/server";
import { updateSettings } from "@/lib/store";
import { getPublicSettings } from "@/lib/public-settings";
import type { GatewaySettings } from "@/lib/hootsuite/types";

export async function GET(request: NextRequest) {
  return NextResponse.json(getPublicSettings(request));
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as Partial<GatewaySettings>;
  const { baseUrl, virtualAgentAutoResponses, crmLookupTemplate } = body;
  updateSettings({
    ...(baseUrl !== undefined ? { baseUrl } : {}),
    ...(virtualAgentAutoResponses !== undefined
      ? { virtualAgentAutoResponses }
      : {}),
    ...(crmLookupTemplate !== undefined ? { crmLookupTemplate } : {}),
  });
  return NextResponse.json(getPublicSettings(request));
}
