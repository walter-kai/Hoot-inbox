import type { NextRequest } from "next/server";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export function baseUrlFromRedirectUri(): string | null {
  const redirectUri = process.env.HOOTSUITE_REDIRECT_URI?.trim();
  if (!redirectUri) return null;
  try {
    return normalizeBaseUrl(new URL(redirectUri).origin);
  } catch {
    return null;
  }
}

export function isPlaceholderBaseUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0"
    );
  } catch {
    return true;
  }
}

export function resolveBaseUrl(
  storedBaseUrl: string,
  request?: NextRequest,
): string {
  const envUrl = process.env.GATEWAY_BASE_URL?.trim();
  if (envUrl) return normalizeBaseUrl(envUrl);

  const fromRedirect = baseUrlFromRedirectUri();
  if (fromRedirect) return fromRedirect;

  const stored = normalizeBaseUrl(storedBaseUrl);

  if (request && isPlaceholderBaseUrl(stored)) {
    const hostname = request.nextUrl.hostname;
    if (!isPlaceholderBaseUrl(request.nextUrl.origin)) {
      return request.nextUrl.origin;
    }
  }

  if (stored && !isPlaceholderBaseUrl(stored)) return stored;

  return fromRedirect ?? "http://localhost:3000";
}
