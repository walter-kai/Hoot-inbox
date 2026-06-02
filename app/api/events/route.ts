import { NextRequest, NextResponse } from "next/server";
import { getContactContext, getWebhooks } from "@/lib/store";
import { getPublicSettings } from "@/lib/public-settings";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    webhooks: getWebhooks(),
    contactContext: getContactContext(),
    settings: getPublicSettings(request),
  });
}
