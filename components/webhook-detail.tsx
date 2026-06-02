"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WebhookEvent } from "@/lib/hootsuite/types";

interface WebhookDetailProps {
  webhook: WebhookEvent | null;
}

function JsonBlock({ label, data }: { label: string; data: unknown }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 font-mono text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export function WebhookDetail({ webhook }: WebhookDetailProps) {
  if (!webhook) {
    return (
      <Card className="h-full">
        <CardContent className="text-muted-foreground flex h-full items-center justify-center p-6 text-sm">
          Select a webhook to view details
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{webhook.type}</CardTitle>
          <Badge variant="outline">{webhook.category}</Badge>
          <Badge variant="secondary">{webhook.responseStatus}</Badge>
        </div>
        <p className="text-muted-foreground text-xs">
          Received {new Date(webhook.receivedAt).toLocaleString()}
          {webhook.idempotencyKey && ` · ${webhook.idempotencyKey}`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <JsonBlock label="Request Payload" data={webhook.payload} />
        <JsonBlock label="Response Sent" data={webhook.responseBody} />
        <JsonBlock label="Request Headers" data={webhook.headers} />
      </CardContent>
    </Card>
  );
}
