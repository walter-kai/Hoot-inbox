import { NextResponse } from "next/server";
import {
  getContactContext,
  getSettings,
  getWebhooks,
} from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    webhooks: getWebhooks(),
    contactContext: getContactContext(),
    settings: getSettings(),
  });
}
