import { NextRequest, NextResponse } from "next/server";
import {
  addWebhook,
  getVirtualAgentAutoResponse,
  indexContactFromVirtualAgent,
} from "@/lib/store";
import type { VirtualAgentWebhookPayload } from "@/lib/hootsuite/types";

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function extractIds(payload: VirtualAgentWebhookPayload): {
  conversationId?: string;
  contactProfileId?: string;
} {
  return {
    conversationId: payload.data?.conversationId,
    contactProfileId: payload.data?.contactProfile?.id,
  };
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let payload: VirtualAgentWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as VirtualAgentWebhookPayload;
  } catch {
    payload = { timestamp: "", idempotencyKey: "", version: 0, type: "UNKNOWN", data: {} };
  }

  indexContactFromVirtualAgent(payload);

  const autoResponse = getVirtualAgentAutoResponse(payload.type);
  const responseBody = autoResponse ?? {};

  const { conversationId, contactProfileId } = extractIds(payload);

  addWebhook({
    receivedAt: new Date().toISOString(),
    category: "virtualAgent",
    type: payload.type ?? "UNKNOWN",
    idempotencyKey: payload.idempotencyKey,
    conversationId,
    contactProfileId,
    headers: headersToRecord(request.headers),
    payload,
    responseStatus: 200,
    responseBody,
  });

  return NextResponse.json(responseBody, { status: 200 });
}
