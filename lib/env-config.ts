import type { GatewaySettings } from "@/lib/hootsuite/types";

export function resolveOAuthFromEnv(
  oauth: GatewaySettings["oauth"]
): GatewaySettings["oauth"] {
  return {
    clientId: process.env.HOOTSUITE_CLIENT_ID?.trim() || oauth.clientId,
    clientSecret:
      process.env.HOOTSUITE_CLIENT_SECRET?.trim() || oauth.clientSecret,
    organizationId:
      process.env.HOOTSUITE_ORGANIZATION_ID?.trim() || oauth.organizationId,
  };
}

export function defaultOAuthFromEnv(): GatewaySettings["oauth"] {
  return resolveOAuthFromEnv({
    clientId: "",
    clientSecret: "",
    organizationId: "",
  });
}
