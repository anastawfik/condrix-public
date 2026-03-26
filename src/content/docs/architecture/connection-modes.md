---
title: Connection Modes
description: How clients connect to Cores in different network topologies.
sidebar:
  order: 2
---

Condrix supports three connection modes depending on your network topology and deployment style.

## Direct Mode

The simplest configuration. The client connects directly to the Core over the local network.

```
┌────────────────────────────────────────┐
│             Local Network              │
│                                        │
│  ┌──────────┐       ┌──────────────┐   │
│  │  Client   │◄────►│     Core     │   │
│  │ (Browser) │  WS  │ (localhost)  │   │
│  └──────────┘       └──────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

**When to use:**
- Development on a single machine
- Client and Core on the same LAN
- No remote access needed

**Configuration:**

The Core binds to `127.0.0.1:9100` by default. The web client connects directly:

```bash
# Core (default — localhost only)
npm run dev:core

# Web Client
npm run dev:web
# Open http://localhost:5173, add Core at ws://localhost:9100
```

To allow connections from other devices on the LAN:

```bash
CONDRIX_CORE_HOST=0.0.0.0 npm run dev:core
# Connect from other devices at ws://<core-ip>:9100
```

## Maestro Mode

For multi-machine setups or when clients can't reach Cores directly. Maestro acts as a central relay.

```
┌──────────────┐                         ┌──────────────┐
│    Client     │                         │     Core     │
│  (Phone App)  │                         │ (Home Server)│
└──────┬───────┘                         └──────┬───────┘
       │                                        │
       │ WS                                WS   │
       │                                        │
       ▼                                        ▼
┌──────────────────────────────────────────────────────┐
│                      Maestro                         │
│               (Cloud VPS / Docker)                   │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Core Registry│  │ Connection   │  │  Messaging  │  │
│  │             │  │ Relay        │  │  Bridge     │  │
│  └─────────────┘  └──────────────┘  └────────────┘  │
└──────────────────────────────────────────────────────┘
```

**When to use:**
- Cores on different networks (home server + office machine)
- Clients on mobile networks that can't reach Cores directly
- You want centralized Core discovery and management
- You want Telegram/WhatsApp notifications

**Configuration:**

```bash
# Maestro (on a reachable server)
CONDRIX_MAESTRO_PORT=9200 npm run dev:maestro

# Core (registers with Maestro on startup)
CONDRIX_MAESTRO_URL=ws://maestro-host:9200 npm run dev:core

# Client connects to Maestro, selects a Core
# Maestro relays all traffic transparently
```

**How relay works:**

1. Core starts and registers with Maestro via WebSocket
2. Maestro records the Core's ID, capabilities, and workspace list
3. Client connects to Maestro and requests available Cores
4. Client selects a Core — Maestro establishes a relay channel
5. All subsequent messages are proxied through Maestro
6. The client experience is identical to a direct connection

## Docker Mode

When running all services in Docker Compose, containers communicate over a Docker bridge network.

```
┌─────────────────────────────────────────────────────┐
│                 Docker Network                       │
│                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐   │
│  │   Web    │    │  Maestro │    │     Core     │   │
│  │ (nginx)  │    │  :9200   │    │    :9100     │   │
│  └────┬─────┘    └────┬─────┘    └──────┬───────┘   │
│       │               │                 │            │
│       │    Docker DNS resolves service names          │
│       │               │                 │            │
└───────┼───────────────┼─────────────────┼────────────┘
        │               │                 │
   Port 5173       Port 9200         Port 9100
   (mapped)        (mapped)          (mapped)
        │               │                 │
   ┌────▼───────────────▼─────────────────▼────┐
   │              Host Machine                  │
   └───────────────────────────────────────────┘
```

**When to use:**
- Reproducible deployments
- Running multiple Cores on the same machine
- CI/CD and testing environments

**Configuration:**

Services reference each other by Docker service name:

```yaml
services:
  core:
    environment:
      - CONDRIX_CORE_HOST=0.0.0.0        # Accept connections from Docker network
      - CONDRIX_MAESTRO_URL=ws://maestro:9200  # Docker DNS resolves "maestro"
```

The Core must bind to `0.0.0.0` inside the container so other containers can reach it. Port mapping in `docker-compose.yml` handles external access.

## Hybrid Networking

In practice, you'll often mix modes:

- **LAN clients** connect directly to a Core for lowest latency
- **Remote clients** connect through Maestro relay
- **Maestro** handles discovery for both — clients see the same Core list regardless of connection path

The Core advertises both its direct address and its Maestro registration. Clients can choose the best path based on network reachability.

## Cloudflare Tunnel

For secure remote access without Maestro relay overhead, you can expose a Core directly using a Cloudflare Tunnel. See [Cloudflare Tunnel Deployment](/deployment/cloudflare-tunnel/) for details.
