"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { VirtualAgentResponse } from "@/lib/hootsuite/types";

interface VirtualAgentControlsProps {
  conversationId: string;
  messageId?: string;
}

function buildVirtualAgentResponse(form: {
  indicateTyping: string;
  messageText: string;
  attachment: string;
  topics: string;
  tags: string;
  messageId: string;
  attributes: Array<{ key: string; value: string }>;
  complete: string;
}): VirtualAgentResponse {
  const body: VirtualAgentResponse = {};

  if (form.indicateTyping && form.indicateTyping !== "none") {
    body.indicateTyping = form.indicateTyping as "START" | "STOP";
  }

  if (form.messageText || form.attachment) {
    body.sendMessage = {};
    if (form.messageText) body.sendMessage.text = form.messageText;
    if (form.attachment) body.sendMessage.attachment = form.attachment;
  }

  if (form.topics.trim()) {
    body.applyTopics = form.topics.split(",").map((t) => t.trim()).filter(Boolean);
  }

  if (form.tags.trim()) {
    if (form.messageId.trim()) {
      body.applyTags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((tag) => ({ messageId: form.messageId.trim(), tag }));
    } else {
      body.applyTags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }

  const attrs = Object.fromEntries(
    form.attributes
      .filter((a) => a.key.trim())
      .map((a) => [a.key.trim(), a.value])
  );
  if (Object.keys(attrs).length > 0) {
    body.setContactAttributes = attrs;
  }

  if (form.complete && form.complete !== "none") {
    body.complete = form.complete as "HANDOVER" | "RESOLVED";
  }

  return body;
}

export function VirtualAgentControls({
  conversationId,
  messageId,
}: VirtualAgentControlsProps) {
  const [convId, setConvId] = useState(conversationId);
  const [form, setForm] = useState({
    indicateTyping: "none",
    messageText: "",
    attachment: "",
    topics: "",
    tags: "",
    messageId: messageId ?? "",
    complete: "none",
  });

  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  async function sendViaRest() {
    if (!convId.trim()) {
      setStatus("Conversation ID is required");
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const body = buildVirtualAgentResponse({ ...form, attributes });
      const res = await fetch(
        `/api/hootsuite/virtual-agent/conversations/${encodeURIComponent(convId.trim())}`,
        {
          method: "POST",
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

  async function uploadAttachmentFile() {
    if (!convId.trim() || !uploadFile) {
      setStatus("Conversation ID and file are required");
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(
        `/api/hootsuite/virtual-agent/conversations/${encodeURIComponent(convId.trim())}/attachments/${encodeURIComponent(uploadFile.name)}`,
        {
          method: "PUT",
          headers: { "Content-Type": uploadFile.type || "application/octet-stream" },
          body: uploadFile,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setForm((f) => ({ ...f, attachment: uploadFile.name }));
      setStatus(`Attachment uploaded: ${uploadFile.name}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Virtual Agent REST API</CardTitle>
        <CardDescription>
          Manipulate conversation via POST /inbox/v1/virtual-agent/conversations/{"{id}"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>Conversation ID</Label>
          <Input value={convId} onChange={(e) => setConvId(e.target.value)} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Indicate Typing</Label>
            <Select
              value={form.indicateTyping}
              onValueChange={(v) =>
                setForm({ ...form, indicateTyping: v ?? "none" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="START">START</SelectItem>
                <SelectItem value="STOP">STOP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Complete</Label>
            <Select
              value={form.complete}
              onValueChange={(v) =>
                setForm({ ...form, complete: v ?? "none" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="HANDOVER">HANDOVER</SelectItem>
                <SelectItem value="RESOLVED">RESOLVED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label>Message Text</Label>
          <Textarea
            value={form.messageText}
            onChange={(e) => setForm({ ...form, messageText: e.target.value })}
            rows={2}
            placeholder="Hi! How can I help you?"
          />
        </div>

        <div className="space-y-1">
          <Label>Attachment Filename</Label>
          <Input
            value={form.attachment}
            onChange={(e) => setForm({ ...form, attachment: e.target.value })}
            placeholder="cat.jpg"
          />
        </div>

        <div className="space-y-1">
          <Label>Upload Attachment</Label>
          <div className="flex gap-2">
            <Input
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={uploadAttachmentFile}
              disabled={loading}
            >
              Upload
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <Label>Apply Topics (comma-separated)</Label>
          <Input
            value={form.topics}
            onChange={(e) => setForm({ ...form, topics: e.target.value })}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Apply Tags (comma-separated)</Label>
            <Input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Message ID (for tag targeting)</Label>
            <Input
              value={form.messageId}
              onChange={(e) => setForm({ ...form, messageId: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Contact Attributes</Label>
          {attributes.map((attr, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="alias"
                value={attr.key}
                onChange={(e) => {
                  const next = [...attributes];
                  next[i] = { ...next[i], key: e.target.value };
                  setAttributes(next);
                }}
              />
              <Input
                placeholder="value"
                value={attr.value}
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
            onClick={() => setAttributes([...attributes, { key: "", value: "" }])}
          >
            Add Attribute
          </Button>
        </div>

        <Button onClick={sendViaRest} disabled={loading}>
          {loading ? "Sending…" : "Send via REST API"}
        </Button>

        {status && (
          <p className="text-muted-foreground text-xs whitespace-pre-wrap">{status}</p>
        )}
      </CardContent>
    </Card>
  );
}
