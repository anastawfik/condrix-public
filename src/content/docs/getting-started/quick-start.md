---
title: Quick Start
description: Get Condrix running in minutes.
sidebar:
  order: 2
---

## Prerequisites

- **Node.js 22+** — Required for all native services
- **npm 10+** — Comes with Node.js 22
- **Git** — For cloning repositories and workspace management
- **Docker & Docker Compose** (optional) — For containerized deployment

## Option 1: Native Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/anastawfik/condrix.git
cd condrix
npm install
```

Build all packages:

```bash
npm run build
```

Start the Core daemon:

```bash
npm run dev:core
```

In a separate terminal, start the Web Client:

```bash
npm run dev:web
```

Open your browser to `http://localhost:5173`. You should see the Condrix web interface. The Core will be listed in the sidebar — click it to connect.

### Configure an AI Provider

Before you can start an AI agent session, the Core needs at least one AI provider connection. Condrix supports **Claude**, **OpenAI**, **Ollama** (local), and any **OpenAI-compatible endpoint**.

1. Open **Settings** (gear icon) in the web client
2. Navigate to the **AI** tab
3. Click **Add Connection** and choose a provider:
   - **Claude (OAuth)** — Sign in with your Claude account (recommended)
   - **Claude (API Key)** — Paste an Anthropic API key
   - **OpenAI** — Paste an OpenAI API key
   - **Local** — Connect to Ollama or LM Studio (default: `localhost:11434`)
   - **Custom** — Any OpenAI-compatible endpoint with a custom base URL
4. Follow the provider-specific prompts to complete setup
5. The Core is now authenticated and ready to create agent sessions

For advanced configuration — including fallback chains and per-project profiles — see [AI Providers](/getting-started/ai-providers/).

## Option 2: Docker Compose

Create a `docker-compose.yml` file:

```yaml
services:
  maestro:
    image: ghcr.io/anastawfik/condrix-maestro:latest
    ports:
      - "9200:9200"
    volumes:
      - maestro-data:/data
    environment:
      - CONDRIX_MAESTRO_PORT=9200

  core:
    image: ghcr.io/anastawfik/condrix-core:latest
    ports:
      - "9100:9100"
    volumes:
      - core-data:/data
      - claude-data:/root/.claude
    environment:
      - CONDRIX_CORE_PORT=9100
      - CONDRIX_CORE_HOST=0.0.0.0
      - CONDRIX_MAESTRO_URL=ws://maestro:9200

  web:
    image: ghcr.io/anastawfik/condrix-web:latest
    ports:
      - "5173:80"

volumes:
  maestro-data:
  core-data:
  claude-data:
```

Start all services:

```bash
docker compose up -d
```

Open `http://localhost:5173` in your browser.

## Default Ports

| Service | Port | Description |
|---------|------|-------------|
| Core | `9100` | Agent runtime daemon (WebSocket) |
| Maestro | `9200` | Orchestration service (WebSocket) |
| Web Client | `5173` | Browser-based UI (HTTP) |
| Docs | `5174` | Documentation site (HTTP) |

## What's Next?

- [Authentication](/getting-started/authentication/) — AI connections, profiles, and Core auth
- [AI Providers](/getting-started/ai-providers/) — Multi-provider setup with fallback chains
- [Architecture Overview](/architecture/overview/) — Understand how the pieces fit together
- [Environment Variables](/deployment/environment-variables/) — Configure ports, hosts, and features
