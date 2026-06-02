"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GatewaySettings } from "@/lib/hootsuite/types";

interface SetupPanelProps {
  settings: GatewaySettings;
  onSave: (settings: Partial<GatewaySettings>) => Promise<void>;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input readOnly value={value} className="font-mono text-xs" />
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

export function SetupPanel({ settings, onSave }: SetupPanelProps) {
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);

  const base = draft.baseUrl.replace(/\/$/, "");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup</CardTitle>
        <CardDescription>
          Copy these webhook URLs into Hootsuite Inbox 2.0. Shared secrets are
          configured in Hootsuite only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-1">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              value={draft.baseUrl}
              onChange={(e) =>
                setDraft({ ...draft, baseUrl: e.target.value })
              }
              placeholder="https://your-ngrok-url.ngrok.io"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CopyField
              label="Virtual Agent Webhook URL"
              value={`${base}/api/webhooks/virtual-agent`}
            />
            <CopyField
              label="CRM Lookup URL"
              value={`${base}/api/webhooks/crm/lookup`}
            />
            <CopyField
              label="CRM Notifications URL"
              value={`${base}/api/webhooks/crm/notifications`}
            />
            <CopyField
              label="CRM Write Back URL"
              value={`${base}/api/webhooks/crm/writeback`}
            />
          </div>

          <div className="space-y-3">
            <Label>OAuth Credentials (for outbound REST API calls)</Label>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                placeholder="Client ID"
                value={draft.oauth.clientId}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    oauth: { ...draft.oauth, clientId: e.target.value },
                  })
                }
              />
              <Input
                type="password"
                placeholder="Client Secret"
                value={draft.oauth.clientSecret}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    oauth: { ...draft.oauth, clientSecret: e.target.value },
                  })
                }
              />
              <Input
                placeholder="Organization ID"
                value={draft.oauth.organizationId}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    oauth: {
                      ...draft.oauth,
                      organizationId: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
