---
title: Authentication
description: How Condrix authenticates with AI providers and secures Core access.
sidebar:
  order: 3
---

Condrix supports multiple AI providers and uses a layered authentication model: **AI Connections** for provider credentials, **AI Profiles** for routing and fallback, and **Core tokens** for machine-to-machine trust.

## AI Connections

An AI Connection stores credentials for a single AI provider. You can create as many connections as you need — one per provider, or several for the same provider with different keys.

### Creating a Connection

1. Open **Settings** (gear icon) in the web client
2. Navigate to the **AI** tab
3. Under **Connections**, click **Add Connection**
4. Choose a provider and fill in the required fields

Each provider requires different credentials:

| Provider | Auth Method | Required Fields |
|----------|-------------|-----------------|
| **Claude** (OAuth) | Browser sign-in | Claude account |
| **Claude** (API Key) | API key | `sk-ant-api03-...` |
| **OpenAI** | API key | `sk-...` |
| **Local** (Ollama / LM Studio) | None | Base URL (default: `http://localhost:11434/v1`) |
| **Custom** | API key (optional) | Base URL + optional API key |

### Fallback Triggers

Each connection can define conditions under which Condrix should automatically switch to the next connection in a fallback chain:

| Trigger | Description |
|---------|-------------|
| `rate_limit` | Provider returned a 429 rate limit response |
| `quota_exceeded` | Account usage quota has been exhausted |
| `auth_error` | Credentials are invalid or expired |
| `timeout` | Request timed out waiting for a response |
| `server_error` | Provider returned a 5xx server error |

When a trigger fires, Condrix moves to the next connection in the profile's fallback chain without interrupting the user's session.

## AI Profiles

An AI Profile is a named preset that defines a **primary connection** and an optional **fallback chain** of additional connections. Profiles let you configure routing strategies without reconfiguring individual workspaces.

### Creating a Profile

1. Open **Settings** → **AI** tab
2. Under **Profiles**, click **Add Profile**
3. Select a **primary connection** (the default provider for this profile)
4. Optionally add **fallback connections** in priority order
5. Give the profile a descriptive name (e.g., "Production", "Local Dev", "Cost-Optimized")

### Example Profiles

**"Production"** — Claude first, OpenAI as backup:
- Primary: Claude (OAuth)
- Fallback 1: OpenAI (API Key)
- Triggers: `rate_limit`, `quota_exceeded`, `server_error`

**"Local Dev"** — Ollama for free local inference:
- Primary: Ollama (localhost:11434)
- No fallback

**"Cost-Optimized"** — Local first, cloud as fallback:
- Primary: Ollama (local)
- Fallback 1: Claude (API Key)
- Triggers: `timeout`, `server_error`

### Per-Project Assignment

You can assign an AI Profile to each project individually:

1. Open **Settings** → **Projects** tab
2. Select a project
3. Choose an **AI Profile** from the dropdown
4. All workspaces in that project use the assigned profile by default

### Workspace-Level Model Selection

Within a workspace or chat session, you can select a specific model from the active connection's available models. This is useful when a provider offers multiple models (e.g., `gpt-4o` vs `gpt-4o-mini`, or `claude-sonnet-4-20250514` vs `claude-haiku-4-20250414`).

Model selection happens at the workspace/chat level and does not affect the profile or connection configuration.

## Provider Setup

### Claude (OAuth)

OAuth is the recommended method for Claude. It uses your existing Claude account — no API keys to create or manage.

**How it works:**

Condrix authenticates using the same OAuth flow as the Claude Code CLI. Each Core runs a Claude CLI subprocess that handles token acquisition, refresh, and request signing.

**Sign-in flow:**

1. Open the **Web Client** and connect to your Core
2. Go to **Settings** → **AI** → **Connections**
3. Click **Add Connection** and select **Claude (OAuth)**
4. Click **Sign In with Claude**
5. Your browser opens the Claude authorization page
6. Sign in with your Claude account and approve the request
7. Paste the authorization code back into the dialog
8. The Core exchanges the code for access and refresh tokens

**Token lifecycle:**

| Token | Format | Lifetime | Purpose |
|-------|--------|----------|---------|
| Access Token | `sk-ant-oat01-...` | Short-lived | Authenticates API requests |
| Refresh Token | `sk-ant-ort01-...` | Long-lived | Obtains new access tokens |

The Core automatically refreshes expired access tokens. You should rarely need to re-authenticate manually.

**Required OAuth scopes:**

- `user:inference` — Send messages to Claude
- `user:profile` — Read account information
- `user:sessions:claude_code` — Create Claude Code sessions
- `user:mcp_servers` — Access MCP server configurations

### Claude (API Key)

For development or when OAuth is not available, you can provide a Claude API key directly.

1. Go to **Settings** → **AI** → **Connections**
2. Click **Add Connection** and select **Claude (API Key)**
3. Paste your API key (`sk-ant-api03-...`)

Alternatively, set the key as an environment variable:

```bash
export CONDRIX_CORE_CLAUDE_API_KEY=sk-ant-api03-...
```

### OpenAI

1. Go to **Settings** → **AI** → **Connections**
2. Click **Add Connection** and select **OpenAI**
3. Paste your OpenAI API key (`sk-...`)
4. The connection auto-discovers available models from the OpenAI API

### Local (Ollama / LM Studio)

For free, private, local inference using any OpenAI-compatible server.

1. Start your local model server (e.g., `ollama serve` or launch LM Studio)
2. Go to **Settings** → **AI** → **Connections**
3. Click **Add Connection** and select **Local**
4. The base URL defaults to `http://localhost:11434/v1` — adjust if your server uses a different port
5. No API key is required for local servers

**Supported local servers:**

- [Ollama](https://ollama.ai) — Default, runs models locally with minimal setup
- [LM Studio](https://lmstudio.ai) — GUI-based local model server
- Any server exposing an OpenAI-compatible `/v1/chat/completions` endpoint

### Custom (OpenAI-Compatible)

For any other provider that exposes an OpenAI-compatible API (e.g., Azure OpenAI, Together AI, Groq, Fireworks).

1. Go to **Settings** → **AI** → **Connections**
2. Click **Add Connection** and select **Custom**
3. Enter the **Base URL** (e.g., `https://api.together.xyz/v1`)
4. Enter your **API Key** if the endpoint requires one
5. The connection queries the endpoint's `/models` route to discover available models

## Core Authentication

### CONDRIX_CORE_TOKEN

The `CONDRIX_CORE_TOKEN` environment variable pre-seeds an authentication token on Core startup. This is used for Maestro outbound connections and automated deployments where browser-based auth is not possible.

```bash
export CONDRIX_CORE_TOKEN=your-pre-seeded-token
npm run dev:core
```

See [Environment Variables](/deployment/environment-variables/) for the complete reference.

### Registration Tokens

When a Core connects to Maestro, it authenticates using a **registration token** (invite code). This replaces the previous shared-secret approach with a more secure invite-based flow:

1. A Maestro admin generates a registration token in the Maestro UI
2. The Core admin sets the token as `CONDRIX_MAESTRO_TOKEN`
3. The Core presents the token during registration
4. Maestro validates the token and issues a **permanent access token** to the Core
5. The Core stores the permanent token and uses it for all subsequent connections

The registration token is single-use. Once the Core receives its permanent token, the registration token is no longer needed.

### Token Rotation

Maestro admins can rotate a Core's access token from the Maestro UI at any time. This is useful when:

- A Core's token may have been compromised
- An admin wants to enforce periodic credential rotation
- A Core is being decommissioned and its token should be invalidated

After rotation, the Core automatically receives the new token on its next connection.

## Core Terminal

Each Core provides a built-in terminal accessible from the web client. This terminal runs on the Core's host machine and can be used for administrative tasks:

- Checking authentication status
- Viewing Core logs
- Running Git commands in workspaces
- Installing system dependencies

Access it from the **Terminal** panel in the web client's right sidebar.

## Security Considerations

- OAuth tokens are stored in `~/.claude/.credentials.json` on the Core's host machine
- API keys and connection credentials are stored in the Core's SQLite database
- Tokens and keys are never sent to clients — the Core proxies all AI requests
- Each Core authenticates independently — revoking access to one Core does not affect others
- For remote Cores, always use [Cloudflare Tunnel](/deployment/cloudflare-tunnel/) or another encrypted transport
- Local provider connections (Ollama, LM Studio) never leave your machine
