---
title: Environment Variables
description: Complete reference for Condrix environment variables.
sidebar:
  order: 3
---

All Condrix services are configured through environment variables. Set them directly, in a `.env` file, or in your `docker-compose.yml`.

## Core Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CONDRIX_CORE_PORT` | `9100` | WebSocket port the Core listens on |
| `CONDRIX_CORE_HOST` | `127.0.0.1` | Bind address. Use `0.0.0.0` for network/Docker access |
| `CONDRIX_CORE_NAME` | hostname | Human-readable name shown in client UI |
| `CONDRIX_CORE_DATA_DIR` | `~/.condrix` | Base directory for workspaces, databases, and config |
| `CONDRIX_CORE_CLAUDE_API_KEY` | — | Claude API key (alternative to OAuth) |
| `CONDRIX_CORE_LOG_LEVEL` | `info` | Logging verbosity: `debug`, `info`, `warn`, `error` |

### Maestro Registration

| Variable | Default | Description |
|----------|---------|-------------|
| `CONDRIX_MAESTRO_URL` | — | Maestro WebSocket URL (e.g., `ws://maestro:9200`) |
| `CONDRIX_MAESTRO_SECRET` | — | Shared secret for Core-to-Maestro authentication |

### TLS

| Variable | Default | Description |
|----------|---------|-------------|
| `CONDRIX_CORE_TLS_CERT` | — | Path to TLS certificate (PEM format) |
| `CONDRIX_CORE_TLS_KEY` | — | Path to TLS private key (PEM format) |

### Tunnel

| Variable | Default | Description |
|----------|---------|-------------|
| `CONDRIX_CORE_TUNNEL_MODE` | `disabled` | Tunnel mode: `quick`, `named`, or `disabled` |
| `CONDRIX_CORE_TUNNEL_TOKEN` | — | Cloudflare tunnel token (for named tunnels) |
| `CONDRIX_CORE_TUNNEL_AUTO_START` | `false` | Start tunnel automatically when Core starts |

### Workspace

| Variable | Default | Description |
|----------|---------|-------------|
| `CONDRIX_CORE_WORKSPACE_DIR` | `~/.condrix/workspaces` | Directory where workspaces are cloned |
| `CONDRIX_CORE_CLONE_TIMEOUT` | `300000` | Git clone timeout in milliseconds (default: 5 minutes) |

## Maestro Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CONDRIX_MAESTRO_PORT` | `9200` | WebSocket port Maestro listens on |
| `CONDRIX_MAESTRO_HOST` | `0.0.0.0` | Bind address |
| `CONDRIX_MAESTRO_DATA_DIR` | `~/.condrix/maestro` | Database and config directory |
| `CONDRIX_MAESTRO_CORE_SECRET` | — | Shared secret that Cores must present to register |
| `CONDRIX_MAESTRO_CLIENT_AUTH` | `disabled` | Client authentication: `enabled` or `disabled` |
| `CONDRIX_MAESTRO_LOG_LEVEL` | `info` | Logging verbosity: `debug`, `info`, `warn`, `error` |

### Messaging Bridge

| Variable | Default | Description |
|----------|---------|-------------|
| `CONDRIX_MAESTRO_TELEGRAM_TOKEN` | — | Telegram bot token (from BotFather) |
| `CONDRIX_MAESTRO_TELEGRAM_CHAT_ID` | — | Telegram chat ID for notifications |
| `CONDRIX_MAESTRO_WHATSAPP_ENABLED` | `false` | Enable WhatsApp bridge (requires QR pairing) |

## Docker Variables

These variables are used in `docker-compose.yml` and `.env` files:

| Variable | Description |
|----------|-------------|
| `MAESTRO_CORE_SECRET` | Shared secret substituted into both Maestro and Core services |
| `CLOUDFLARE_TUNNEL_TOKEN` | Token for the `cloudflared` sidecar service |

### Example `.env` File

```bash
# Core
CONDRIX_CORE_PORT=9100
CONDRIX_CORE_HOST=0.0.0.0
CONDRIX_CORE_NAME=My Workstation
CONDRIX_CORE_LOG_LEVEL=info

# Maestro connection
CONDRIX_MAESTRO_URL=ws://maestro:9200
CONDRIX_MAESTRO_SECRET=change-me-to-a-secure-random-string

# Maestro
CONDRIX_MAESTRO_PORT=9200
CONDRIX_MAESTRO_CORE_SECRET=change-me-to-a-secure-random-string

# Telegram notifications
CONDRIX_MAESTRO_TELEGRAM_TOKEN=123456:ABC-DEF...
CONDRIX_MAESTRO_TELEGRAM_CHAT_ID=987654321

# Tunnel
CONDRIX_CORE_TUNNEL_MODE=quick
CONDRIX_CORE_TUNNEL_AUTO_START=true
```

## Precedence

Environment variables take precedence over all other configuration sources:

1. **Environment variables** (highest priority)
2. **`.env` file** in the service's working directory
3. **SQLite settings** stored in the database
4. **Default values** (lowest priority)

When running in Docker, variables set in `docker-compose.yml` under `environment:` take precedence over those in the `.env` file.
