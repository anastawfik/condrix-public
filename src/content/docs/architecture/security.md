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

## Multi-Provider Authentication

Condrix supports multiple AI providers, each with its own authentication pattern.

### Provider Credentials

| Provider | Credential Type | Storage |
|----------|----------------|---------|
| Claude (OAuth) | Access + refresh tokens | `~/.claude/.credentials.json` |
| Claude (API Key) | Anthropic API key | Core SQLite database |
| OpenAI | OpenAI API key | Core SQLite database |
| Local (Ollama) | None | N/A |
| Custom | Optional API key | Core SQLite database |

All credentials are stored on the Core and never sent to clients. The Core proxies all AI requests, so clients never interact with provider APIs directly.

### Connection Isolation

Each AI Connection is isolated — credentials for one connection cannot be accessed by another. When a fallback chain triggers, the Core authenticates with the next provider using that connection's own credentials.

## Registration Tokens

Condrix uses **registration tokens** (invite codes) for secure Core-to-Maestro authentication. This replaces the previous shared-secret approach.

### Flow

```
┌───────────────┐   1. Generate token   ┌──────────────┐
│ Maestro Admin │ ─────────────────────► │   Maestro    │
└───────────────┘                        └──────┬───────┘
                                                │
                                    2. Token: "inv_abc123"
                                                │
┌───────────────┐   3. Set env var       ┌──────▼───────┐
│  Core Admin   │ ─────────────────────► │     Core     │
│               │  CONDRIX_MAESTRO_TOKEN  │              │
└───────────────┘  =inv_abc123           └──────┬───────┘
                                                │
                                    4. Register with token
                                                ▼
                                         ┌──────────────┐
                                         │   Maestro    │
                                         │ validates &  │
                                         │ issues perm  │
                                         │ token        │
                                         └──────────────┘
```

1. A Maestro admin generates a registration token in the Maestro UI
2. The Core admin sets it as `CONDRIX_MAESTRO_TOKEN` in the Core's environment
3. The Core presents the token when connecting to Maestro
4. Maestro validates the token and issues a **permanent access token**
5. The Core stores the permanent token and uses it for all future connections

Registration tokens are single-use. Once a Core receives its permanent token, the registration token is consumed and cannot be reused.

## CONDRIX_CORE_TOKEN

The `CONDRIX_CORE_TOKEN` environment variable pre-seeds an authentication token on Core startup. This is used for:

- **Maestro outbound connections** — When a Maestro needs to initiate a connection to a Core
- **Automated deployments** — Where browser-based authentication is not available
- **CI/CD environments** — Headless Core instances that need a pre-configured identity

```bash
export CONDRIX_CORE_TOKEN=your-pre-seeded-token
npm run dev:core
```

The token is stored in the Core's database on first startup and used for subsequent authentication handshakes.

## Token Rotation

Maestro admins can rotate a Core's permanent access token from the Maestro UI. Use token rotation when:

- A Core's token may have been compromised
- You want to enforce periodic credential rotation as a security policy
- A Core is being decommissioned and its token should be invalidated

After rotation, the affected Core automatically receives its new token on the next connection to Maestro. No manual intervention is required on the Core side.

## Maestro Authentication

Maestro uses separate authentication for its two communication channels.

### Core to Maestro

When a Core registers with Maestro, it authenticates using a **registration token** (see above). For legacy deployments, shared secrets are still supported:

```bash
# Core
CONDRIX_MAESTRO_URL=ws://maestro:9200
CONDRIX_MAESTRO_TOKEN=your-registration-token

# Maestro
CONDRIX_MAESTRO_CORE_SECRET=your-shared-secret
```

The Core includes this token in its registration message. Maestro rejects connections with invalid or missing tokens.

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
2. **Use OAuth over API keys when possible** — OAuth tokens are short-lived and automatically refreshed
3. **Use registration tokens for Core-to-Maestro auth** — Single-use invite codes are more secure than shared secrets
4. **Rotate Core tokens periodically** — Use the Maestro UI to rotate access tokens on a regular schedule
5. **Keep Node.js updated** — Condrix requires Node.js 22+ which receives active security patches
6. **Review connected clients** — The Core tracks all active WebSocket connections; disconnect unknown clients
7. **Use Cloudflare Tunnel for remote access** — Avoid port forwarding, which bypasses firewall protections
8. **Store API keys securely** — AI provider API keys are stored in the Core's database; protect the data directory
