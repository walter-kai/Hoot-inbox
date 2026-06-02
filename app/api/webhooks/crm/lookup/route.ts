import { NextRequest, NextResponse } from "next/server";
import { addWebhook, getCrmLookupTemplate } from "@/lib/store";

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

  const responseBody = getCrmLookupTemplate();

  addWebhook({
    receivedAt: new Date().toISOString(),
    category: "crm",
    type: "CRM_LOOKUP",
    headers: headersToRecord(request.headers),
    payload,
    responseStatus: 200,
    responseBody,
  });

  return NextResponse.json(responseBody, { status: 200 });
}
