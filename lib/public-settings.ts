import type { NextRequest } from "next/server";
import type { GatewaySettings } from "@/lib/hootsuite/types";
import { resolveOAuthFromEnv } from "@/lib/env-config";
import { getSettings } from "@/lib/store";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function resolveBaseUrl(storedBaseUrl: string, request?: NextRequest): string {
  const envUrl = process.env.GATEWAY_BASE_URL?.trim();
  if (envUrl) return normalizeBaseUrl(envUrl);

  const stored = normalizeBaseUrl(storedBaseUrl);
  const isLocalDefault =
    stored === "http://localhost:3000" || stored === "http://127.0.0.1:3000";

  if (request && isLocalDefault) {
    const hostname = request.nextUrl.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return request.nextUrl.origin;
    }
  }

  return stored || "http://localhost:3000";
}

export function getPublicSettings(request?: NextRequest): GatewaySettings {
  const settings = getSettings();
  return {
    ...settings,
    baseUrl: resolveBaseUrl(settings.baseUrl, request),
    oauth: resolveOAuthFromEnv(settings.oauth),
  };
}
