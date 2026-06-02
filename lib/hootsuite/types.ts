export type VirtualAgentEventType =
  | "CONVERSATION_STARTED"
  | "CONVERSATION_DELEGATED"
  | "INBOUND_MESSAGE_RECEIVED";

export type WebhookCategory = "virtualAgent" | "crm";

export interface VirtualAgentResponse {
  indicateTyping?: "START" | "STOP";
  sendMessage?: { text?: string; attachment?: string };
  sendMessages?: Array<{ text?: string; attachment?: string }>;
  applyTopics?: string[];
  applyTags?: string[] | Array<{ messageId: string; tag: string }>;
  applyConversationNotes?: Array<{ text: string }>;
  setContactAttributes?: Record<string, string>;
  complete?: "HANDOVER" | "RESOLVED";
}

export interface ContactAttribute {
  attribute: string;
  value: string | null;
  source?: string;
}

export interface ContactContext {
  contactProfileId: string;
  conversationId: string;
  contactAttributes: ContactAttribute[];
  updatedAt: string;
}

export interface CrmLookupResponse {
  autoConfirm: boolean;
  contactAttributes: ContactAttribute[];
}

export interface VirtualAgentAutoResponseSetting {
  enabled: boolean;
  response: VirtualAgentResponse;
}

export interface GatewaySettings {
  baseUrl: string;
  oauth: {
    clientId: string;
    clientSecret: string;
    organizationId: string;
  };
  virtualAgentAutoResponses: Record<
    VirtualAgentEventType,
    VirtualAgentAutoResponseSetting
  >;
  crmLookupTemplate: CrmLookupResponse;
}

export interface WebhookEvent {
  id: string;
  receivedAt: string;
  category: WebhookCategory;
  type: string;
  idempotencyKey?: string;
  conversationId?: string;
  contactProfileId?: string;
  headers: Record<string, string>;
  payload: unknown;
  responseStatus: number;
  responseBody: unknown;
}

export interface AccessTokenCache {
  token: string;
  expiresAt: number;
}

export interface VirtualAgentWebhookPayload {
  timestamp: string;
  idempotencyKey: string;
  version: number;
  type: string;
  data: {
    conversationId?: string;
    contactProfile?: { id: string };
    message?: { messageId: string; text?: string };
    contactAttributes?: ContactAttribute[];
    [key: string]: unknown;
  };
}
