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
import type { PublicGatewaySettings } from "@/lib/hootsuite/types";

interface SetupPanelProps {
  settings: PublicGatewaySettings;
  onSave: (settings: Pick<PublicGatewaySettings, "baseUrl">) => Promise<void>;
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
      await onSave({ baseUrl: draft.baseUrl });
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

          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
