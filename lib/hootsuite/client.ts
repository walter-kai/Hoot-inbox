import {
  clearAccessToken,
  getAccessToken,
  getSettings,
  setAccessToken,
} from "@/lib/store";
import type { CrmLookupResponse, VirtualAgentResponse } from "@/lib/hootsuite/types";

const HOOTSUITE_BASE = "https://platform.hootsuite.com";

export async function fetchAccessToken(): Promise<string> {
  const cached = getAccessToken();
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const { oauth } = getSettings();
  if (!oauth.clientId || !oauth.clientSecret || !oauth.organizationId) {
    throw new Error(
      "OAuth credentials not configured. Set client_id, client_secret, and organization_id in Settings."
    );
  }

  const credentials = Buffer.from(
    `${oauth.clientId}:${oauth.clientSecret}`
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "organization_app",
    organization_id: oauth.organizationId,
  });

  const res = await fetch(`${HOOTSUITE_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth token request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  setAccessToken({
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });

  return data.access_token;
}

async function authorizedFetch(
  url: string,
  init: RequestInit,
  retry = true
): Promise<Response> {
  const token = await fetchAccessToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 && retry) {
    clearAccessToken();
    return authorizedFetch(url, init, false);
  }

  return res;
}

export async function manipulateConversation(
  conversationId: string,
  body: VirtualAgentResponse
): Promise<{ status: number; data: unknown }> {
  const res = await authorizedFetch(
    `${HOOTSUITE_BASE}/inbox/v1/virtual-agent/conversations/${conversationId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new Error(
      `Manipulate conversation failed (${res.status}): ${JSON.stringify(data)}`
    );
  }

  return { status: res.status, data };
}

export async function uploadAttachment(
  conversationId: string,
  filename: string,
  contentType: string,
  data: ArrayBuffer
): Promise<{ status: number; data: unknown }> {
  const res = await authorizedFetch(
    `${HOOTSUITE_BASE}/inbox/v1/virtual-agent/conversations/${conversationId}/attachments/${filename}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(data.byteLength),
      },
      body: data,
    }
  );

  const text = await res.text();
  let parsed: unknown = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    throw new Error(
      `Upload attachment failed (${res.status}): ${JSON.stringify(parsed)}`
    );
  }

  return { status: res.status, data: parsed };
}

export async function setContactAttributes(
  contactProfileId: string,
  body: CrmLookupResponse
): Promise<{ status: number; data: unknown }> {
  const res = await authorizedFetch(
    `${HOOTSUITE_BASE}/inbox/v2/contact/${contactProfileId}/contact-attributes`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new Error(
      `Set contact attributes failed (${res.status}): ${JSON.stringify(data)}`
    );
  }

  return { status: res.status, data };
}
