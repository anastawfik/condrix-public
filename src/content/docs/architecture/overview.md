---
title: Architecture Overview
description: How Condrix's three-layer architecture works.
sidebar:
  order: 1
---

Condrix is built on a three-layer architecture that separates agent execution, orchestration, and user interaction into independent components.

## The Three Layers

| Layer | Component | Role | Port |
|-------|-----------|------|------|
| Runtime | **Core** | Runs AI agents, manages workspaces, terminals, files, and Git | `9100` |
| Orchestration | **Maestro** | Coordinates multiple Cores, relays connections, bridges messaging | `9200` |
| Interface | **Clients** | Stateless UIs that connect to Cores (Web, Desktop, Mobile, CLI) | `5173` |

## How Data Flows

All communication in Condrix uses **WebSocket connections** with a typed message envelope protocol. There are no REST APIs.

```
                           Direct Mode
                    ┌──────────────────────┐
                    │                      │
┌─────────┐        │    ┌─────────────┐   │    ┌──────────┐
│  Client  │◄───────┘    │   Maestro   │◄──┘    │   Core   │
│ (Web UI) │◄───────────►│   (Relay)   │◄──────►│ (Daemon) │
└─────────┘  Maestro     └─────────────┘        └──────────┘
              Mode          Relay +                   │
                         Registration            AI Providers
                                              (Claude, OpenAI,
                                               Ollama, Custom)
```

In **Direct Mode**, clients connect straight to a Core. In **Maestro Mode**, clients connect to Maestro, which relays messages to the appropriate Core. Cores register with Maestro and maintain a persistent connection.

### Message Envelope

Every message follows a consistent envelope format:

```json
{
  "id": "msg_abc123",
  "namespace": "workspace",
  "action": "create",
  "correlationId": "req_xyz789",
  "payload": { "repoUrl": "https://github.com/..." }
}
```

- **id** — Unique message identifier
- **namespace** — Domain area (e.g., `workspace`, `agent`, `terminal`, `git`)
- **action** — Operation within the namespace
- **correlationId** — Links requests to responses
- **payload** — Action-specific data

The full protocol is defined in the `@condrix/protocol` package.

## Core: The Agent Runtime

A Core is the workhorse of Condrix. It runs as a headless Node.js daemon and manages:

### Workspaces

A workspace is an isolated environment built from a Git repository. When you create a workspace, the Core:

1. Clones the repository to `~/.condrix/workspaces/<id>/`
2. Sets up the workspace state machine: `CREATING` → `IDLE` → `ACTIVE` → `WAITING` → `SUSPENDED` → `DESTROYED`
3. Provides file system access, terminal sessions, and Git operations scoped to that workspace

### Agent Sessions

Each workspace can have an active AI agent session. The agent:

- Communicates with the configured AI provider (Claude, OpenAI, Ollama, or any OpenAI-compatible endpoint)
- Has access to the workspace's files, terminals, and Git
- Streams responses in real-time to all connected clients
- Supports automatic fallback chains — if the primary provider fails, the next one in the profile takes over

### Manager Pattern

The Core is organized into domain-specific managers:

- **WorkspaceManager** — Workspace lifecycle and state transitions
- **AgentManager** — AI session creation, messaging, and tool use
- **TerminalManager** — PTY session management
- **FileManager** — File read/write/search operations
- **GitManager** — Git operations (status, diff, commit, branch)
- **ConnectionManager** — WebSocket client connections and authentication

## Maestro: The Orchestrator

Maestro is optional for single-machine setups but essential for multi-machine deployments.

### Core Registry

Cores register with Maestro on startup. Maestro tracks:

- Which Cores are online and their capabilities
- What workspaces each Core is running
- Network reachability (direct vs. relay required)

### Connection Relay

When a client can't reach a Core directly (different network, behind NAT), Maestro acts as a relay:

1. Client connects to Maestro
2. Client requests connection to a specific Core
3. Maestro proxies WebSocket messages between client and Core
4. Client experience is identical — the relay is transparent

### Messaging Bridge

Maestro can bridge notifications to external messaging platforms:

- **Telegram** — Via the Grammy bot framework
- **WhatsApp** — Via the Baileys library

This enables receiving agent status updates and sending commands from your phone's messaging apps.

## Clients: Stateless Interfaces

Clients hold no state. They are pure rendering layers that:

1. Connect to a Core (directly or via Maestro)
2. Subscribe to real-time updates
3. Display workspace state, chat history, terminal output, and file contents
4. Send user commands back to the Core

Because clients are stateless, you can:

- Close a browser tab and reopen it — the session is still there
- Switch from the web client to the desktop client mid-conversation
- Connect multiple clients to the same Core simultaneously

## Persistence: SQLite

Both Core and Maestro use **better-sqlite3** for persistence. This means:

- Zero external database dependencies
- Data stored in local `.db` files
- No database server to install, configure, or maintain
- Suitable for single-developer and small-team use

For larger team deployments, PostgreSQL support is planned as an alternative backend.

## What's Next?

- [Connection Modes](/architecture/connection-modes/) — Direct, Maestro relay, and Docker networking
- [Security](/architecture/security/) — Authentication, authorization, and transport security
