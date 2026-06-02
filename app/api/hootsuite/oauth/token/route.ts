import { NextResponse } from "next/server";
import { fetchAccessToken } from "@/lib/hootsuite/client";

export async function POST() {
  try {
    const token = await fetchAccessToken();
    return NextResponse.json({ access_token: token });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
