---
title: Security
description: Authentication, authorization, and transport security in Condrix.
sidebar:
  order: 3
---

Condrix uses a layered security model covering authentication, authorization, and transport encryption.

## OAuth Authentication

Condrix's primary authentication method is OAuth, using the same flow as the Claude Code CLI.

### Flow Overview

```
┌────────┐     1. Sign In      ┌────────────┐
│ Client │ ──────────────────► │  Core      │
└────────┘                     └─────┬──────┘
                                     │
                         2. Open browser
                                     ▼
                               ┌────────────┐
                               │ claude.ai  │
                               │  /oauth/   │
                               │ authorize  │
                               └─────┬──────┘
                                     │
                         3. User approves
                                     ▼
                               ┌────────────┐
                               │ Callback   │
                               │ localhost   │
                               │ :PORT/     │
                               │ callback   │
                               └─────┬──────┘
                                     │
                         4. Exchange code for tokens
                                     ▼
                               ┌────────────────────┐
                               │ platform.claude.com │
                               │ /v1/oauth/token    │
                               └────────────────────┘
```

1. The client sends a sign-in request to the Core
2. The Core starts a temporary HTTP server and opens the Claude authorization page in a browser
3. The user approves the request; Claude redirects to `http://localhost:PORT/callback` with an authorization code
4. The Core exchanges the code for access and refresh tokens using PKCE

### Bearer Tokens

All API requests include:

- `Authorization: Bearer sk-ant-oat01-...` — The OAuth access token
- `anthropic-beta: oauth-2025-04-20` — Required beta header for OAuth support

Without the beta header, the API returns `401 OAuth authentication is currently not supported`.

### Token Storage

Credentials are stored in `~/.claude/.credentials.json` on the Core's host:

```json
{
  "claudeAiOauth": {
    "accessToken": "sk-ant-oat01-...",
    "refreshToken": "sk-ant-ort01-...",
    "expiresAt": 1735689600000
  }
}
```

The `expiresAt` field is a Unix timestamp in milliseconds. The Core monitors token expiry and refreshes automatically before it lapses.

## TOTP Two-Factor Authentication

For additional client-to-Core security, Condrix supports Time-based One-Time Password (TOTP) authentication.

### How It Works

1. Enable 2FA in the Core's settings
2. The Core generates a TOTP secret and displays a QR code
3. Scan the QR code with any authenticator app (Google Authenticator, Authy, etc.)
4. Clients must provide a valid TOTP code when connecting to the Core

This protects against unauthorized access if someone discovers your Core's address, especially when using Cloudflare Tunnel or binding to `0.0.0.0`.

## Maestro Authentication

Maestro uses separate authentication for its two communication channels.

### Core to Maestro

When a Core registers with Maestro, it authenticates using a shared secret:

```bash
# Core
CONDRIX_MAESTRO_URL=ws://maestro:9200
CONDRIX_MAESTRO_SECRET=your-shared-secret

# Maestro
CONDRIX_MAESTRO_CORE_SECRET=your-shared-secret
```

The Core includes this secret in its registration message. Maestro rejects connections with invalid or missing secrets.

### Client to Maestro

Clients authenticate with Maestro using user credentials:

```bash
# Maestro
CONDRIX_MAESTRO_CLIENT_AUTH=enabled
```

When enabled, clients must provide valid credentials to:

- List available Cores
- Request relay connections
- Access the messaging bridge

## Rate Limiting

Both Core and Maestro implement rate limiting to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| WebSocket connections | 10 per IP | 1 minute |
| Authentication attempts | 5 per IP | 5 minutes |
| Message throughput | 100 messages | 1 second |

Failed authentication attempts trigger exponential backoff. After 5 failures, the IP is blocked for 5 minutes.

## Transport Security

### Local Development

In local development, WebSocket connections use unencrypted `ws://`. This is acceptable because:

- The Core binds to `127.0.0.1` by default — only local connections are accepted
- No data leaves the machine

### Remote Access

For remote access, Condrix provides two encrypted transport options:

**Cloudflare Tunnel (Recommended)**

Cloudflare Tunnel automatically provides TLS encryption:

- Client connects via `wss://your-tunnel.trycloudflare.com`
- Traffic is encrypted end-to-end between the client and Cloudflare's edge
- The tunnel connects to the Core over a secure channel
- No certificate management required

**Direct TLS**

For environments where Cloudflare Tunnel is not available:

```bash
CONDRIX_CORE_TLS_CERT=/path/to/cert.pem
CONDRIX_CORE_TLS_KEY=/path/to/key.pem
```

The Core will serve `wss://` instead of `ws://` when TLS certificates are configured.

## Security Best Practices

1. **Never expose a Core to the internet without authentication** — Always use TOTP or Cloudflare Tunnel
2. **Use OAuth over API keys** — OAuth tokens are short-lived and automatically refreshed
3. **Rotate Maestro secrets regularly** — Treat them like any shared credential
4. **Keep Node.js updated** — Condrix requires Node.js 22+ which receives active security patches
5. **Review connected clients** — The Core tracks all active WebSocket connections; disconnect unknown clients
6. **Use Cloudflare Tunnel for remote access** — Avoid port forwarding, which bypasses firewall protections
