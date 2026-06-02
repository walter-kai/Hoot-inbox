import { NextRequest, NextResponse } from "next/server";
import { uploadAttachment } from "@/lib/hootsuite/client";

export async function PUT(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ conversationId: string; filename: string }> }
) {
  const { conversationId, filename } = await params;

  try {
    const contentType =
      request.headers.get("content-type") ?? "application/octet-stream";
    const buffer = await request.arrayBuffer();
    const result = await uploadAttachment(
      conversationId,
      filename,
      contentType,
      buffer
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
