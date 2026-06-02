"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ContactAttribute, CrmLookupResponse } from "@/lib/hootsuite/types";

interface CrmRestControlsProps {
  contactProfileId: string;
  defaultAttributes?: ContactAttribute[];
}

export function CrmRestControls({
  contactProfileId,
  defaultAttributes = [],
}: CrmRestControlsProps) {
  const [profileId, setProfileId] = useState(contactProfileId);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [attributes, setAttributes] = useState<ContactAttribute[]>(
    defaultAttributes.map((a) => ({ ...a }))
  );
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendViaRest() {
    if (!profileId.trim()) {
      setStatus("Contact Profile ID is required");
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const body: CrmLookupResponse = {
        autoConfirm,
        contactAttributes: attributes.filter((a) => a.attribute.trim()),
      };
      const res = await fetch(
        `/api/hootsuite/crm/contact/${encodeURIComponent(profileId.trim())}/contact-attributes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setStatus(`Success (${data.status})`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">CRM REST API</CardTitle>
        <CardDescription>
          Set contact attributes via PUT /inbox/v2/contact/{"{contactProfileId}"}/contact-attributes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>Contact Profile ID</Label>
          <Input value={profileId} onChange={(e) => setProfileId(e.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} />
          <Label>Auto Confirm</Label>
        </div>

        <div className="space-y-2">
          <Label>Contact Attributes</Label>
          {attributes.length === 0 && (
            <p className="text-muted-foreground text-xs">
              No attributes yet. Receive a CONVERSATION_STARTED event or add rows manually.
            </p>
          )}
          {attributes.map((attr, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="attribute"
                value={attr.attribute}
                onChange={(e) => {
                  const next = [...attributes];
                  next[i] = { ...next[i], attribute: e.target.value };
                  setAttributes(next);
                }}
              />
              <Input
                placeholder="value"
                value={attr.value ?? ""}
                onChange={(e) => {
                  const next = [...attributes];
                  next[i] = { ...next[i], value: e.target.value };
                  setAttributes(next);
                }}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setAttributes([...attributes, { attribute: "", value: "" }])
            }
          >
            Add Attribute
          </Button>
        </div>

        <Button onClick={sendViaRest} disabled={loading}>
          {loading ? "Sending…" : "Set Contact Attributes via REST API"}
        </Button>

        {status && (
          <p className="text-muted-foreground text-xs whitespace-pre-wrap">{status}</p>
        )}
      </CardContent>
    </Card>
  );
}
