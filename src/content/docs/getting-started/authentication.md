---
title: Authentication
description: How Condrix authenticates with Claude and secures access.
sidebar:
  order: 3
---

Condrix supports two methods for authenticating a Core with the Claude AI service: **OAuth** (recommended) and **API Key**.

## Method 1: OAuth (Claude Plan)

OAuth is the recommended authentication method. It uses your existing Claude account — no API keys to create or manage.

### How It Works

Condrix authenticates using the same OAuth flow as the Claude Code CLI. Under the hood, each Core runs a Claude CLI subprocess that handles:

- OAuth token acquisition and refresh
- Request signing with the correct beta headers
- Secure credential storage in `~/.claude/.credentials.json`

This means your Core authenticates as a Claude Code session, using your Claude plan's usage allocation.

### Sign-In Flow

1. Open the **Web Client** and connect to your Core
2. Go to **Settings** → **Cores** tab
3. Click **Sign In with Claude** next to your Core
4. Your browser opens the Claude authorization page
5. Sign in with your Claude account and approve the request
6. You receive an authorization code — paste it back into the dialog
7. The Core exchanges the code for access and refresh tokens

### Token Lifecycle

| Token | Format | Lifetime | Purpose |
|-------|--------|----------|---------|
| Access Token | `sk-ant-oat01-...` | Short-lived | Authenticates API requests |
| Refresh Token | `sk-ant-ort01-...` | Long-lived | Obtains new access tokens |

The Core automatically refreshes expired access tokens using the refresh token. You should rarely need to re-authenticate manually.

### Required OAuth Scopes

The OAuth flow requests these scopes:

- `user:inference` — Send messages to Claude
- `user:profile` — Read account information
- `user:sessions:claude_code` — Create Claude Code sessions
- `user:mcp_servers` — Access MCP server configurations

### Claude Code Subprocess

Rather than making direct API calls, each Core spawns a Claude Code CLI subprocess to handle AI interactions. This provides:

- **Automatic OAuth handling** — The subprocess manages tokens transparently
- **Correct request format** — Requests match the exact shape Claude's API expects
- **Beta header injection** — The `anthropic-beta: oauth-2025-04-20` header is included automatically
- **Extended thinking support** — Works with Claude's extended thinking features

## Method 2: API Key

For development or when OAuth is not available, you can provide a Claude API key directly.

### Configuration

Set the API key as an environment variable before starting the Core:

```bash
export CONDRIX_CORE_CLAUDE_API_KEY=sk-ant-api03-...
npm run dev:core
```

Or add it to a `.env` file in the Core's directory:

```bash
CONDRIX_CORE_CLAUDE_API_KEY=sk-ant-api03-...
```

### Trade-offs

| | OAuth | API Key |
|---|---|---|
| Setup | Browser sign-in | Copy-paste key |
| Token refresh | Automatic | N/A (key doesn't expire) |
| Usage billing | Claude plan | API billing |
| Security | Short-lived tokens | Long-lived key |
| Recommended | Yes | Development only |

## Core Terminal

Each Core provides a built-in terminal accessible from the web client. This terminal runs on the Core's host machine and can be used for administrative tasks:

- Checking authentication status
- Viewing Core logs
- Running Git commands in workspaces
- Installing system dependencies

Access it from the **Terminal** panel in the web client's right sidebar.

## Security Considerations

- OAuth tokens are stored in `~/.claude/.credentials.json` on the Core's host machine
- Tokens are never sent to clients — the Core proxies all AI requests
- Each Core authenticates independently — revoking access to one Core doesn't affect others
- For remote Cores, always use [Cloudflare Tunnel](/deployment/cloudflare-tunnel/) or another encrypted transport
