---
title: Docker Deployment
description: Run Condrix services with Docker Compose.
sidebar:
  order: 1
---

Docker Compose is the recommended way to deploy Condrix for multi-service setups.

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  maestro:
    image: ghcr.io/anastawfik/condrix-maestro:latest
    container_name: condrix-maestro
    restart: unless-stopped
    ports:
      - "9200:9200"
    volumes:
      - maestro-data:/data
    environment:
      - CONDRIX_MAESTRO_PORT=9200
      - CONDRIX_MAESTRO_CORE_SECRET=${MAESTRO_CORE_SECRET}
    healthcheck:
      test: ["CMD", "node", "-e", "require('net').createConnection(9200, 'localhost').on('connect', () => process.exit(0)).on('error', () => process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3

  core:
    image: ghcr.io/anastawfik/condrix-core:latest
    container_name: condrix-core
    restart: unless-stopped
    ports:
      - "9100:9100"
    volumes:
      - core-data:/data
      - claude-data:/root/.claude
    environment:
      - CONDRIX_CORE_PORT=9100
      - CONDRIX_CORE_HOST=0.0.0.0
      - CONDRIX_MAESTRO_URL=ws://maestro:9200
      - CONDRIX_MAESTRO_SECRET=${MAESTRO_CORE_SECRET}
    depends_on:
      maestro:
        condition: service_healthy

  web:
    image: ghcr.io/anastawfik/condrix-web:latest
    container_name: condrix-web
    restart: unless-stopped
    ports:
      - "5173:80"

volumes:
  maestro-data:
    driver: local
  core-data:
    driver: local
  claude-data:
    driver: local
```

## Persistent Volumes

| Volume | Purpose | Contains |
|--------|---------|----------|
| `maestro-data` | Maestro state | SQLite database, Core registry, messaging config |
| `core-data` | Core state | SQLite database, workspace data, settings |
| `claude-data` | Claude credentials | OAuth tokens in `.credentials.json` |

The `claude-data` volume persists your Claude OAuth credentials across container restarts. Without it, you would need to re-authenticate after every restart.

## Starting Services

Start all services:

```bash
docker compose up -d
```

Start only specific services:

```bash
# Just the Core and Web Client (no Maestro)
docker compose up -d core web

# Just Maestro (for relay-only setups)
docker compose up -d maestro
```

View logs:

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f core
```

## Running Multiple Cores

To run multiple Cores on the same machine, add additional core services:

```yaml
services:
  core-project-a:
    image: ghcr.io/anastawfik/condrix-core:latest
    container_name: condrix-core-project-a
    ports:
      - "9101:9100"
    volumes:
      - core-a-data:/data
      - claude-data:/root/.claude
    environment:
      - CONDRIX_CORE_PORT=9100
      - CONDRIX_CORE_HOST=0.0.0.0
      - CONDRIX_CORE_NAME=Project A
      - CONDRIX_MAESTRO_URL=ws://maestro:9200

  core-project-b:
    image: ghcr.io/anastawfik/condrix-core:latest
    container_name: condrix-core-project-b
    ports:
      - "9102:9100"
    volumes:
      - core-b-data:/data
      - claude-data:/root/.claude
    environment:
      - CONDRIX_CORE_PORT=9100
      - CONDRIX_CORE_HOST=0.0.0.0
      - CONDRIX_CORE_NAME=Project B
      - CONDRIX_MAESTRO_URL=ws://maestro:9200
```

Each Core gets its own data volume but shares the Claude credentials volume.

## Production vs Development

### Development

```bash
# Uses local source code with hot-reload
npm run dev:core
npm run dev:web
```

### Production

```bash
# Uses pre-built Docker images
docker compose up -d

# Or build from source
docker compose build
docker compose up -d
```

For production deployments:

1. **Set a strong Maestro secret** — Use a randomly generated string
2. **Enable TOTP** — Protect Core access with two-factor authentication
3. **Use Cloudflare Tunnel** — Encrypted remote access without port exposure
4. **Configure restart policies** — `unless-stopped` ensures services recover from crashes
5. **Monitor logs** — Use `docker compose logs -f` or forward to a log aggregator

## Updating

Pull the latest images and restart:

```bash
docker compose pull
docker compose up -d
```

Volumes are preserved across updates. Your workspaces, chat history, and credentials remain intact.

## Environment File

Create a `.env` file alongside `docker-compose.yml` for secrets:

```bash
MAESTRO_CORE_SECRET=your-secure-random-secret-here
```

Docker Compose automatically reads `.env` files and substitutes `${VARIABLE}` references.
