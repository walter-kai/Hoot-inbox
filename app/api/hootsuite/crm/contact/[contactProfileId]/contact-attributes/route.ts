import { NextRequest, NextResponse } from "next/server";
import { setContactAttributes } from "@/lib/hootsuite/client";
import type { CrmLookupResponse } from "@/lib/hootsuite/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contactProfileId: string }> }
) {
  const { contactProfileId } = await params;

  try {
    const body = (await request.json()) as CrmLookupResponse;
    const result = await setContactAttributes(contactProfileId, body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
