import { NextRequest, NextResponse } from "next/server";
import { manipulateConversation } from "@/lib/hootsuite/client";
import type { VirtualAgentResponse } from "@/lib/hootsuite/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  try {
    const body = (await request.json()) as VirtualAgentResponse;
    const result = await manipulateConversation(conversationId, body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
