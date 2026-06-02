"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { WebhookCategory, WebhookEvent } from "@/lib/hootsuite/types";

type WebhookFilter = "all" | WebhookCategory;

interface WebhookListProps {
  webhooks: WebhookEvent[];
  selectedId: string | null;
  filter: WebhookFilter;
  onSelect: (id: string) => void;
  onFilterChange: (filter: WebhookFilter) => void;
}

const FILTER_OPTIONS: { value: WebhookFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "virtualAgent", label: "Virtual Agent" },
  { value: "crm", label: "CRM" },
];

function categoryColor(category: WebhookCategory) {
  return category === "virtualAgent"
    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
}

function categoryLabel(category: WebhookCategory) {
  return category === "virtualAgent" ? "Virtual Agent" : "CRM";
}

export function WebhookList({
  webhooks,
  selectedId,
  filter,
  onSelect,
  onFilterChange,
}: WebhookListProps) {
  const filtered =
    filter === "all"
      ? webhooks
      : webhooks.filter((w) => w.category === filter);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex gap-2">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onFilterChange(value)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium",
              filter === value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {label}
          </button>
        ))}
        <span className="text-muted-foreground ml-auto self-center text-xs">
          {filtered.length} events
        </span>
      </div>

      <ScrollArea className="flex-1 rounded-md border">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground p-4 text-sm">
            No webhooks received yet. Configure Hootsuite to send events to the
            URLs above.
          </p>
        ) : (
          <ul className="divide-y">
            {filtered.map((webhook) => (
              <li key={webhook.id}>
                <button
                  type="button"
                  onClick={() => onSelect(webhook.id)}
                  className={cn(
                    "hover:bg-muted/50 w-full px-4 py-3 text-left transition-colors",
                    selectedId === webhook.id && "bg-muted"
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", categoryColor(webhook.category))}
                    >
                      {categoryLabel(webhook.category)}
                    </Badge>
                    <span className="truncate text-sm font-medium">
                      {webhook.type}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {new Date(webhook.receivedAt).toLocaleString()}
                  </p>
                  {(webhook.conversationId || webhook.contactProfileId) && (
                    <p className="text-muted-foreground mt-1 truncate font-mono text-xs">
                      {webhook.conversationId && `conv: ${webhook.conversationId.slice(0, 8)}…`}
                      {webhook.conversationId && webhook.contactProfileId && " · "}
                      {webhook.contactProfileId &&
                        `contact: ${webhook.contactProfileId.slice(0, 8)}…`}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
