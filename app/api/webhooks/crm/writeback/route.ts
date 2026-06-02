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
  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    payload = { raw: rawBody };
  }

  const type =
    typeof payload.type === "string" ? payload.type : "CRM_WRITEBACK";

  const data =
    typeof payload.data === "object" && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : undefined;

  const conversation =
    data?.conversation &&
    typeof data.conversation === "object" &&
    data.conversation !== null
      ? (data.conversation as { id?: string })
      : undefined;

  const contactProfile =
    data?.contactProfile &&
    typeof data.contactProfile === "object" &&
    data.contactProfile !== null
      ? (data.contactProfile as { id?: string })
      : undefined;

  addWebhook({
    receivedAt: new Date().toISOString(),
    category: "crm",
    type,
    idempotencyKey:
      typeof payload.idempotencyKey === "string"
        ? payload.idempotencyKey
        : undefined,
    conversationId: conversation?.id,
    contactProfileId: contactProfile?.id,
    headers: headersToRecord(request.headers),
    payload,
    responseStatus: 200,
    responseBody: {},
  });

  return NextResponse.json({}, { status: 200 });
}
