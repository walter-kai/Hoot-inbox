"use client";

import { useEffect, useMemo, useState } from "react";
import { SetupPanel } from "@/components/setup-panel";
import { WebhookList } from "@/components/webhook-list";
import { WebhookDetail } from "@/components/webhook-detail";
import { VirtualAgentControls } from "@/components/virtual-agent-controls";
import { CrmRestControls } from "@/components/crm-rest-controls";
import { CrmLookupControls } from "@/components/crm-lookup-controls";
import { VirtualAgentAutoResponseSettings } from "@/components/virtual-agent-auto-response-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  ContactContext,
  CrmLookupResponse,
  GatewaySettings,
  WebhookEvent,
} from "@/lib/hootsuite/types";

interface EventsResponse {
  webhooks: WebhookEvent[];
  contactContext: ContactContext[];
  settings: GatewaySettings;
}

function extractMessageId(webhook: WebhookEvent | null): string | undefined {
  if (!webhook || webhook.type !== "INBOUND_MESSAGE_RECEIVED") return undefined;
  const payload = webhook.payload as {
    data?: { message?: { messageId?: string } };
  };
  return payload.data?.message?.messageId;
}

export default function Dashboard() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "virtualAgent" | "crm">("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/events");
      if (res.ok && !cancelled) {
        setData((await res.json()) as EventsResponse);
      }
    }

    void load();
    const interval = setInterval(() => void load(), 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const selectedWebhook = useMemo(
    () => data?.webhooks.find((w) => w.id === selectedId) ?? null,
    [data, selectedId]
  );

  const contextFromSelection = useMemo(() => {
    if (!selectedWebhook?.contactProfileId || !data) return null;
    return (
      data.contactContext.find(
        (c) => c.contactProfileId === selectedWebhook.contactProfileId
      ) ?? null
    );
  }, [selectedWebhook, data]);

  const latestConversationContext = useMemo(() => {
    if (!data?.contactContext.length) return null;
    return data.contactContext[data.contactContext.length - 1];
  }, [data]);

  const activeContext = contextFromSelection ?? latestConversationContext;

  async function saveSettings(partial: Partial<GatewaySettings>) {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    if (!res.ok) throw new Error("Failed to save settings");
    const eventsRes = await fetch("/api/events");
    if (eventsRes.ok) {
      setData((await eventsRes.json()) as EventsResponse);
    }
  }

  async function saveCrmLookupTemplate(template: CrmLookupResponse) {
    await saveSettings({ crmLookupTemplate: template });
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading gateway…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hootsuite Inbox Gateway
        </h1>
        <p className="text-muted-foreground text-sm">
          Diagnostic webhook gateway for Hootsuite Inbox 2.0 Virtual Agent and CRM APIs
        </p>
      </header>

      <SetupPanel settings={data.settings} onSave={saveSettings} />

      <div className="grid min-h-[480px] flex-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Incoming Webhooks</h2>
          <WebhookList
            webhooks={data.webhooks}
            selectedId={selectedId}
            filter={filter}
            onSelect={setSelectedId}
            onFilterChange={setFilter}
          />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Event Detail</h2>
          <WebhookDetail webhook={selectedWebhook} />
        </div>
      </div>

      <Tabs defaultValue="virtualAgent">
        <TabsList>
          <TabsTrigger value="virtualAgent">Virtual Agent REST</TabsTrigger>
          <TabsTrigger value="crm-rest">CRM REST</TabsTrigger>
          <TabsTrigger value="crm-lookup">CRM Lookup</TabsTrigger>
          <TabsTrigger value="auto">Virtual Agent Auto-Response</TabsTrigger>
        </TabsList>

        <TabsContent value="virtualAgent" className="mt-4">
          <VirtualAgentControls
            key={`${selectedWebhook?.conversationId ?? activeContext?.conversationId ?? ""}-${extractMessageId(selectedWebhook) ?? ""}`}
            conversationId={
              selectedWebhook?.conversationId ??
              activeContext?.conversationId ??
              ""
            }
            messageId={extractMessageId(selectedWebhook)}
          />
        </TabsContent>

        <TabsContent value="crm-rest" className="mt-4">
          <CrmRestControls
            key={selectedWebhook?.contactProfileId ?? activeContext?.contactProfileId ?? ""}
            contactProfileId={
              selectedWebhook?.contactProfileId ??
              activeContext?.contactProfileId ??
              ""
            }
            defaultAttributes={activeContext?.contactAttributes}
          />
        </TabsContent>

        <TabsContent value="crm-lookup" className="mt-4">
          <CrmLookupControls
            key={JSON.stringify(data.settings.crmLookupTemplate)}
            template={data.settings.crmLookupTemplate}
            contactAttributes={activeContext?.contactAttributes}
            onSave={saveCrmLookupTemplate}
          />
        </TabsContent>

        <TabsContent value="auto" className="mt-4">
          <VirtualAgentAutoResponseSettings
            settings={data.settings}
            onSave={saveSettings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
