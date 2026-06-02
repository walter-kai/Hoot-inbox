# Hootsuite Inbox Gateway

A diagnostic webhook gateway for [Hootsuite Inbox 2.0](https://apidocs.hootsuite.com/docs/api/inbox/index.html). Receives Virtual Agent and CRM webhooks, logs them in a live dashboard, and provides manual controls for outbound REST API calls.

## Features

- **Virtual Agent webhooks** — receives `CONVERSATION_STARTED`, `CONVERSATION_DELEGATED`, and `INBOUND_MESSAGE_RECEIVED`; responds with `200 OK` within 10 seconds
- **CRM webhooks** — lookup, error notifications (`204`), and write-back endpoints
- **Live webhook list** — polls every 2 seconds, filter by Virtual Agent/CRM
- **Setup panel** — copy-paste URLs and shared secrets for Hootsuite configuration
- **Virtual Agent REST controls** — manipulate conversation, upload attachments
- **CRM REST controls** — set contact attributes asynchronously
- **CRM lookup template** — configure synchronous lookup response, prefill from `CONVERSATION_STARTED` attributes
- **Virtual Agent auto-response** — optional per-event-type synchronous responses

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### HTTPS for local development

Hootsuite requires HTTPS webhook URLs. Use [ngrok](https://ngrok.com) or similar:

```bash
ngrok http 3000
```

Copy the ngrok HTTPS URL into the **Base URL** field in the Setup panel.

## Configure Hootsuite

### Virtual Agent

1. In Hootsuite Inbox 2.0, go to **Admin settings → Virtual agents → Edit custom virtual agent**
2. Set **Webhook URL** to `{baseUrl}/api/webhooks/virtual-agent`
3. Copy the **shared secret** from Hootsuite into the gateway Setup panel (or copy the gateway secret into Hootsuite)

### CRM Integration

1. Go to **Admin settings → Integration and APIs → CRM**
2. Set URLs:
   - **Lookup URL**: `{baseUrl}/api/webhooks/crm/lookup`
   - **Notification URL**: `{baseUrl}/api/webhooks/crm/notifications`
   - **Write Back URL**: `{baseUrl}/api/webhooks/crm/writeback`
3. Copy the CRM shared secret into the gateway Setup panel

### OAuth (outbound REST API)

For Virtual Agent and CRM REST API controls, enter your Hootsuite developer app credentials in the Setup panel:

- Client ID
- Client Secret
- Organization ID

See the [REST API authentication docs](https://apidocs.hootsuite.com/docs/api/inbox/index.html#section/REST-API-authentication).

## API Routes

| Route | Purpose |
|---|---|
| `POST /api/webhooks/virtual-agent` | Virtual Agent webhook receiver |
| `POST /api/webhooks/crm/lookup` | CRM attribute lookup |
| `POST /api/webhooks/crm/notifications` | CRM error notifications |
| `POST /api/webhooks/crm/writeback` | CRM write-back events |
| `GET /api/events` | Webhook log + settings (for dashboard) |
| `PUT /api/settings` | Update gateway settings |
| `POST /api/hootsuite/oauth/token` | Fetch OAuth access token |
| `POST /api/hootsuite/virtual-agent/conversations/[id]` | Manipulate conversation |
| `PUT /api/hootsuite/virtual-agent/conversations/[id]/attachments/[filename]` | Upload attachment |
| `PUT /api/hootsuite/crm/contact/[id]/contact-attributes` | Set contact attributes |

## Notes

- All webhook and settings data is stored **in memory** and clears on server restart
- Webhook signature verification is not enforced; secrets are shown for configuration reference
- Unknown future Virtual Agent event types are logged and acknowledged with `200 {}`

## License

Private — diagnostic tool for Hootsuite Inbox 2.0 integration testing.
