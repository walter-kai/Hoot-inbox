"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  GatewaySettings,
  VirtualAgentEventType,
  VirtualAgentResponse,
} from "@/lib/hootsuite/types";

const EVENT_TYPES: VirtualAgentEventType[] = [
  "CONVERSATION_STARTED",
  "CONVERSATION_DELEGATED",
  "INBOUND_MESSAGE_RECEIVED",
];

interface VirtualAgentAutoResponseSettingsProps {
  settings: GatewaySettings;
  onSave: (settings: Partial<GatewaySettings>) => Promise<void>;
}

export function VirtualAgentAutoResponseSettings({
  settings,
  onSave,
}: VirtualAgentAutoResponseSettingsProps) {
  const [draft, setDraft] = useState(settings.virtualAgentAutoResponses);
  const [activeType, setActiveType] =
    useState<VirtualAgentEventType>("CONVERSATION_STARTED");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const active = draft[activeType];
  const response = active.response;

  function updateResponse(patch: Partial<VirtualAgentResponse>) {
    setDraft({
      ...draft,
      [activeType]: {
        ...active,
        response: { ...response, ...patch },
      },
    });
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      await onSave({ virtualAgentAutoResponses: draft });
      setStatus("Auto-response settings saved.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Virtual Agent Auto-Response</CardTitle>
        <CardDescription>
          Optionally respond synchronously on webhook receipt. Default is empty {"{}"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant={activeType === type ? "default" : "outline"}
              onClick={() => setActiveType(type)}
            >
              {type.replace(/_/g, " ")}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={active.enabled}
            onCheckedChange={(enabled) =>
              setDraft({
                ...draft,
                [activeType]: { ...active, enabled },
              })
            }
          />
          <Label>Auto-respond on {activeType}</Label>
        </div>

        <div className="space-y-1">
          <Label>Message Text</Label>
          <Textarea
            value={response.sendMessage?.text ?? ""}
            onChange={(e) =>
              updateResponse({
                sendMessage: {
                  ...response.sendMessage,
                  text: e.target.value,
                },
              })
            }
            rows={2}
          />
        </div>

        <div className="space-y-1">
          <Label>Complete (HANDOVER or RESOLVED)</Label>
          <Input
            value={response.complete ?? ""}
            onChange={(e) =>
              updateResponse({
                complete:
                  e.target.value === "HANDOVER" || e.target.value === "RESOLVED"
                    ? e.target.value
                    : undefined,
              })
            }
            placeholder="Leave empty for none"
          />
        </div>

        <div className="space-y-1">
          <Label>Apply Topics (comma-separated)</Label>
          <Input
            value={response.applyTopics?.join(", ") ?? ""}
            onChange={(e) =>
              updateResponse({
                applyTopics: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Auto-Response Settings"}
        </Button>

        {status && (
          <p className="text-muted-foreground text-xs">{status}</p>
        )}
      </CardContent>
    </Card>
  );
}
