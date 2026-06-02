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

interface CrmLookupControlsProps {
  template: CrmLookupResponse;
  contactAttributes?: ContactAttribute[];
  onSave: (template: CrmLookupResponse) => Promise<void>;
}

export function CrmLookupControls({
  template,
  contactAttributes = [],
  onSave,
}: CrmLookupControlsProps) {
  const [autoConfirm, setAutoConfirm] = useState(template.autoConfirm);
  const [attributes, setAttributes] = useState<ContactAttribute[]>(
    template.contactAttributes
  );
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function prefillFromConversation() {
    if (contactAttributes.length === 0) {
      setStatus("No CONVERSATION_STARTED attributes available yet.");
      return;
    }

    const existing = new Map(attributes.map((a) => [a.attribute, a.value]));
    for (const attr of contactAttributes) {
      if (!existing.has(attr.attribute)) {
        existing.set(attr.attribute, attr.value);
      }
    }
    setAttributes(
      Array.from(existing.entries()).map(([attribute, value]) => ({
        attribute,
        value,
      }))
    );
    setStatus(`Prefilled ${contactAttributes.length} attributes from CONVERSATION_STARTED.`);
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      await onSave({
        autoConfirm,
        contactAttributes: attributes.filter((a) => a.attribute.trim()),
      });
      setStatus("Lookup response template saved.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">CRM Lookup Response</CardTitle>
        <CardDescription>
          Template returned synchronously when Hootsuite calls the CRM lookup webhook.
          Prefill from CONVERSATION_STARTED contact attributes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} />
          <Label>Auto Confirm</Label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Contact Attributes</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={prefillFromConversation}
            >
              Prefill from CONVERSATION_STARTED
            </Button>
          </div>
          {attributes.map((attr, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="attribute alias"
                value={attr.attribute}
                onChange={(e) => {
                  const next = [...attributes];
                  next[i] = { ...next[i], attribute: e.target.value };
                  setAttributes(next);
                }}
              />
              <Input
                placeholder="value (empty = null)"
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

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Lookup Template"}
        </Button>

        {status && (
          <p className="text-muted-foreground text-xs whitespace-pre-wrap">{status}</p>
        )}
      </CardContent>
    </Card>
  );
}
