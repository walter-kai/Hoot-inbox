import { NextRequest, NextResponse } from "next/server";
import { addWebhook } from "@/lib/store";

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    payload = rawBody;
  }

  const eventType =
    typeof payload === "object" &&
    payload !== null &&
    "eventType" in payload &&
    typeof (payload as { eventType: unknown }).eventType === "string"
      ? (payload as { eventType: string }).eventType
      : "CRM_NOTIFICATION";

  addWebhook({
    receivedAt: new Date().toISOString(),
    category: "crm",
    type: eventType,
    headers: headersToRecord(request.headers),
    payload,
    responseStatus: 204,
    responseBody: null,
  });

  return new NextResponse(null, { status: 204 });
}
