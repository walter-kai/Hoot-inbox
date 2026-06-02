import type { NextRequest } from "next/server";
import type { PublicGatewaySettings } from "@/lib/hootsuite/types";
import { resolveBaseUrl } from "@/lib/base-url";
import { getSettings } from "@/lib/store";

export function getPublicSettings(request?: NextRequest): PublicGatewaySettings {
  const { baseUrl, virtualAgentAutoResponses, crmLookupTemplate } =
    getSettings();
  return {
    baseUrl: resolveBaseUrl(baseUrl, request),
    virtualAgentAutoResponses,
    crmLookupTemplate,
  };
}
