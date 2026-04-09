---
title: AI Providers
description: Configure multiple AI providers with connections, profiles, and automatic fallback chains
sidebar:
  order: 4
---

Condrix supports multiple AI providers through a flexible **Connections + Profiles** architecture. You can use Claude, OpenAI, local models via Ollama or LM Studio, or any OpenAI-compatible endpoint — and configure automatic fallback between them.

## Supported Providers

| Provider | Auth Method | Use Case |
|----------|-------------|----------|
| **Claude** (OAuth) | Browser sign-in via Claude account | Recommended for Claude plan subscribers |
| **Claude** (API Key) | Anthropic API key (`sk-ant-api03-...`) | Development, pay-per-use billing |
| **OpenAI** | OpenAI API key (`sk-...`) | GPT-4o, GPT-4o-mini, o1, o3, and other OpenAI models |
| **Local** | None (no auth required) | Ollama, LM Studio, or any local OpenAI-compatible server |
| **Custom** | API key (optional) | Azure OpenAI, Together AI, Groq, Fireworks, or any OpenAI-compatible endpoint |

## Connections

A **Connection** represents a single authenticated link to an AI provider. Each connection stores:

- **Name** — A human-readable label (e.g., "My Claude Account", "Office OpenAI Key")
- **Provider** — Which provider type (Claude, OpenAI, Local, Custom)
- **Credentials** — API key, OAuth tokens, or nothing for local providers
- **Base URL** — For Local and Custom providers, the endpoint URL
- **Fallback triggers** — Conditions that cause Condrix to skip this connection and try the next one

### Creating a Connection

1. Open **Settings** (gear icon) in the web client
2. Navigate to the **AI** tab
3. Under **Connections**, click **Add Connection**
4. Select a provider type
5. Fill in the provider-specific fields
6. Click **Save**

### Provider-Specific Setup

#### Claude (OAuth)

The recommended method for Claude. Uses your existing Claude plan allocation.

1. Select **Claude (OAuth)** as the provider
2. Click **Sign In with Claude**
3. Approve the request in your browser
4. Paste the authorization code back into the dialog

The Core handles token refresh automatically. You should rarely need to re-authenticate.

#### Claude (API Key)

For development or API-billed usage.

1. Select **Claude (API Key)** as the provider
2. Paste your Anthropic API key (`sk-ant-api03-...`)

You can also set the key via environment variable:

```bash
export CONDRIX_CORE_CLAUDE_API_KEY=sk-ant-api03-...
```

#### OpenAI

1. Select **OpenAI** as the provider
2. Paste your OpenAI API key (`sk-...`)
3. Available models are auto-discovered from the OpenAI API

#### Local (Ollama / LM Studio)

For free, private, local inference. No API key needed.

1. Start your local model server:
   ```bash
   # Ollama
   ollama serve

   # Or launch LM Studio and enable the local server
   ```
2. Select **Local** as the provider
3. The base URL defaults to `http://localhost:11434/v1` — change it if your server uses a different port
4. Available models are auto-discovered from the server

**Compatible local servers:**

- [Ollama](https://ollama.ai) — Lightweight, CLI-based, supports thousands of models
- [LM Studio](https://lmstudio.ai) — GUI-based with a built-in model browser
- Any server exposing an OpenAI-compatible `/v1/chat/completions` endpoint

#### Custom (OpenAI-Compatible)

For any other provider with an OpenAI-compatible API.

1. Select **Custom** as the provider
2. Enter the **Base URL** (e.g., `https://api.together.xyz/v1`, `https://api.groq.com/openai/v1`)
3. Enter an **API Key** if the endpoint requires authentication
4. Models are auto-discovered from the endpoint's `/models` route

## Profiles

An **AI Profile** is a named preset that defines a **primary connection** and an ordered **fallback chain**. Profiles decouple routing decisions from individual projects and workspaces.

### Creating a Profile

1. Open **Settings** → **AI** tab
2. Under **Profiles**, click **Add Profile**
3. Enter a **name** for the profile (e.g., "Production", "Local Dev")
4. Select a **primary connection** — the default provider
5. Optionally add **fallback connections** in priority order
6. Click **Save**

### Fallback Chains

When the primary connection encounters an error that matches one of its configured fallback triggers, Condrix automatically retries the request with the next connection in the chain.

**Available fallback triggers:**

| Trigger | When It Fires |
|---------|---------------|
| `rate_limit` | Provider returned HTTP 429 |
| `quota_exceeded` | Account usage quota exhausted |
| `auth_error` | Credentials invalid or expired |
| `timeout` | Request timed out |
| `server_error` | Provider returned HTTP 5xx |

**Example: resilient production profile**

```
Primary:    Claude (OAuth)         → triggers: rate_limit, quota_exceeded
Fallback 1: OpenAI (API Key)      → triggers: rate_limit, server_error
Fallback 2: Ollama (local)        → no triggers (last resort)
```

If Claude hits a rate limit, the request automatically retries on OpenAI. If OpenAI also fails, it falls back to local Ollama. The user sees no interruption.

### Example Profiles

| Profile | Primary | Fallback | Use Case |
|---------|---------|----------|----------|
| **Cloud First** | Claude (OAuth) | OpenAI | Best quality, cloud-billed |
| **Local Dev** | Ollama | None | Free, private, offline-capable |
| **Cost-Optimized** | Ollama | Claude (API Key) | Local when possible, cloud when needed |
| **High Availability** | Claude | OpenAI → Ollama | Maximum uptime with three-tier fallback |

## Per-Project Assignment

Each project can have its own AI Profile:

1. Open **Settings** → **Projects** tab
2. Select a project
3. Choose an **AI Profile** from the dropdown
4. All workspaces in that project use the assigned profile by default

This lets you use different providers for different projects — for example, Claude for production work and Ollama for experiments.

## Workspace-Level Model Selection

Within a workspace or chat session, you can select a specific model from the active connection's available models. This is useful when a provider offers multiple tiers:

- Claude: `claude-sonnet-4-20250514`, `claude-haiku-4-20250414`
- OpenAI: `gpt-4o`, `gpt-4o-mini`, `o1`, `o3-mini`
- Ollama: `llama3`, `codellama`, `mistral`, `deepseek-coder`

Model selection is per-workspace and does not change the profile or connection configuration.

## Architecture

Under the hood, the multi-provider system consists of:

- **AI Connection Manager** (`ai-connection-manager.ts`) — Stores and manages connection credentials, handles provider-specific authentication flows
- **OpenAI Provider** (`openai-provider.ts`) — Implements the OpenAI-compatible API client used by OpenAI, Local, and Custom connections
- **Tool Format Adapter** (`tool-format-adapter.ts`) — Translates Condrix's internal tool definitions to each provider's expected format
- **AI Connection Schema** (`ai-connection.ts` in `@condrix/protocol`) — Shared type definitions for connections, profiles, and fallback triggers

The Claude provider continues to use the Claude Code CLI subprocess for OAuth connections, ensuring full compatibility with Claude's extended thinking and beta features.
