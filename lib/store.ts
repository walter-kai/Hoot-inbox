import { randomBytes } from "crypto";
import type {
  AccessTokenCache,
  ContactAttribute,
  ContactContext,
  CrmLookupResponse,
  GatewaySettings,
  VirtualAgentEventType,
  VirtualAgentResponse,
  WebhookEvent,
} from "@/lib/hootsuite/types";
import { baseUrlFromRedirectUri } from "@/lib/base-url";
import { defaultOAuthFromEnv } from "@/lib/env-config";

const MAX_WEBHOOKS = 500;

function defaultVirtualAgentAutoResponses(): GatewaySettings["virtualAgentAutoResponses"] {
  const empty: VirtualAgentResponse = {};
  return {
    CONVERSATION_STARTED: { enabled: false, response: { ...empty } },
    CONVERSATION_DELEGATED: { enabled: false, response: { ...empty } },
    INBOUND_MESSAGE_RECEIVED: { enabled: false, response: { ...empty } },
  };
}

function defaultSettings(): GatewaySettings {
  const envBaseUrl = process.env.GATEWAY_BASE_URL?.trim();
  const fromRedirect = baseUrlFromRedirectUri();
  return {
    baseUrl: envBaseUrl
      ? envBaseUrl.replace(/\/$/, "")
      : (fromRedirect ?? "http://localhost:3000"),
    oauth: defaultOAuthFromEnv(),
    virtualAgentAutoResponses: defaultVirtualAgentAutoResponses(),
    crmLookupTemplate: {
      autoConfirm: true,
      contactAttributes: [],
    },
  };
}

interface Store {
  webhooks: WebhookEvent[];
  contactContext: Map<string, ContactContext>;
  settings: GatewaySettings;
  accessToken?: AccessTokenCache;
}

const globalStore = globalThis as typeof globalThis & { __hootGatewayStore?: Store };

function getStore(): Store {
  if (!globalStore.__hootGatewayStore) {
    globalStore.__hootGatewayStore = {
      webhooks: [],
      contactContext: new Map(),
      settings: defaultSettings(),
    };
  }
  return globalStore.__hootGatewayStore;
}

export function addWebhook(event: Omit<WebhookEvent, "id">): WebhookEvent {
  const store = getStore();
  const record: WebhookEvent = {
    ...event,
    id: randomBytes(8).toString("hex"),
  };
  store.webhooks.unshift(record);
  if (store.webhooks.length > MAX_WEBHOOKS) {
    store.webhooks.length = MAX_WEBHOOKS;
  }
  return record;
}

export function getWebhooks(): WebhookEvent[] {
  return getStore().webhooks;
}

export function getWebhookById(id: string): WebhookEvent | undefined {
  return getStore().webhooks.find((w) => w.id === id);
}

export function indexContactFromVirtualAgent(payload: {
  type: string;
  data?: {
    conversationId?: string;
    contactProfile?: { id: string };
    contactAttributes?: ContactAttribute[];
  };
}): void {
  const type = payload.type;
  if (type !== "CONVERSATION_STARTED" && type !== "CONVERSATION_DELEGATED") {
    return;
  }

  const contactProfileId = payload.data?.contactProfile?.id;
  const conversationId = payload.data?.conversationId;
  if (!contactProfileId || !conversationId) return;

  getStore().contactContext.set(contactProfileId, {
    contactProfileId,
    conversationId,
    contactAttributes: payload.data?.contactAttributes ?? [],
    updatedAt: new Date().toISOString(),
  });
}

export function getContactContext(): ContactContext[] {
  return Array.from(getStore().contactContext.values());
}

export function getContactContextByProfileId(
  contactProfileId: string
): ContactContext | undefined {
  return getStore().contactContext.get(contactProfileId);
}

export function getSettings(): GatewaySettings {
  return getStore().settings;
}

export function updateSettings(partial: Partial<GatewaySettings>): GatewaySettings {
  const store = getStore();
  store.settings = {
    ...store.settings,
    ...partial,
    oauth: { ...store.settings.oauth, ...partial.oauth },
    virtualAgentAutoResponses: {
      ...store.settings.virtualAgentAutoResponses,
      ...partial.virtualAgentAutoResponses,
    },
    crmLookupTemplate: {
      ...store.settings.crmLookupTemplate,
      ...partial.crmLookupTemplate,
    },
  };
  return store.settings;
}

export function updateVirtualAgentAutoResponse(
  eventType: VirtualAgentEventType,
  setting: Partial<{ enabled: boolean; response: VirtualAgentResponse }>
): void {
  const store = getStore();
  store.settings.virtualAgentAutoResponses[eventType] = {
    ...store.settings.virtualAgentAutoResponses[eventType],
    ...setting,
    response: {
      ...store.settings.virtualAgentAutoResponses[eventType].response,
      ...setting.response,
    },
  };
}

export function updateCrmLookupTemplate(template: CrmLookupResponse): void {
  getStore().settings.crmLookupTemplate = template;
}

export function getVirtualAgentAutoResponse(type: string): VirtualAgentResponse | null {
  const settings = getSettings();
  const key = type as VirtualAgentEventType;
  const config = settings.virtualAgentAutoResponses[key];
  if (!config?.enabled) return null;
  return config.response;
}

export function getCrmLookupTemplate(): CrmLookupResponse {
  return getSettings().crmLookupTemplate;
}

export function getAccessToken(): AccessTokenCache | undefined {
  return getStore().accessToken;
}

export function setAccessToken(token: AccessTokenCache): void {
  getStore().accessToken = token;
}

export function clearAccessToken(): void {
  delete getStore().accessToken;
}

export function prefillCrmLookupFromContact(
  contactProfileId?: string
): CrmLookupResponse {
  const template = getCrmLookupTemplate();
  if (!contactProfileId) return template;

  const context = getContactContextByProfileId(contactProfileId);
  if (!context) return template;

  const existing = new Map(
    template.contactAttributes.map((a) => [a.attribute, a.value])
  );
  for (const attr of context.contactAttributes) {
    if (!existing.has(attr.attribute)) {
      existing.set(attr.attribute, attr.value);
    }
  }

  return {
    autoConfirm: template.autoConfirm,
    contactAttributes: Array.from(existing.entries()).map(
      ([attribute, value]) => ({
        attribute,
        value,
      })
    ),
  };
}
