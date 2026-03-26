---
title: Monorepo Structure
description: How the Condrix codebase is organized.
sidebar:
  order: 2
---

Condrix is an NX monorepo using npm workspaces. All packages are TypeScript with ES modules.

## Directory Tree

```
condrix/
├── apps/                          # Deployable applications
│   ├── core/                      # Core agent runtime daemon
│   │   └── src/
│   │       ├── managers/          # Domain managers (workspace, agent, terminal, etc.)
│   │       ├── providers/         # AI provider implementations (Claude)
│   │       ├── services/          # Infrastructure services (tunnel, auth)
│   │       └── runtime.ts         # Main entry point
│   ├── maestro/                   # Orchestration service
│   │   └── src/
│   │       ├── managers/          # Core registry, relay, messaging
│   │       └── index.ts           # Main entry point
│   ├── client-web/                # Web client (Vite + React)
│   │   └── src/
│   │       ├── components/        # React components
│   │       ├── stores/            # State management
│   │       └── App.tsx            # Root component
│   ├── client-desktop/            # Desktop client (Tauri 2.0 wrapper)
│   │   ├── src/                   # React frontend (shared with web)
│   │   └── src-tauri/             # Rust Tauri backend
│   ├── client-mobile/             # Mobile client (React Native / Expo)
│   ├── client-cli/                # Terminal client (Ink + Commander)
│   └── docs/                      # Documentation site (VitePress)
├── libs/                          # Shared libraries
│   ├── protocol/                  # Message types, schemas, interfaces
│   │   └── src/
│   │       ├── messages/          # Message envelope definitions
│   │       ├── schemas/           # Validation schemas
│   │       └── index.ts           # Public API
│   ├── client-shared/             # Shared React hooks and stores
│   │   └── src/
│   │       ├── hooks/             # useCore, useWorkspace, useAgent, etc.
│   │       └── stores/            # Multi-Core connection store
│   ├── client-components/         # Shared UI components (shadcn/ui style)
│   │   └── src/
│   │       ├── ui/                # Base components (Button, Dialog, etc.)
│   │       └── app-layout.tsx     # Shared layout shell
│   ├── skills/                    # Built-in agent skill definitions
│   └── mcp-configs/               # Pre-configured MCP server definitions
├── nx.json                        # NX workspace configuration
├── tsconfig.base.json             # Base TypeScript config
├── package.json                   # Root package.json (workspaces + scripts)
└── docker-compose.yml             # Docker deployment configuration
```

## Applications

### `apps/core` — Core Daemon

The headless agent runtime. Manages workspaces, AI sessions, terminals, files, and Git operations. Runs as a Node.js process exposing a WebSocket server.

**Key files:**
- `runtime.ts` — Service initialization and WebSocket server setup
- `managers/` — Domain-specific managers (WorkspaceManager, AgentManager, etc.)
- `providers/claude-provider.ts` — Claude AI integration via CLI subprocess

### `apps/maestro` — Orchestration Service

Central coordinator for multi-Core deployments. Handles Core registry, connection relay, and messaging bridges (Telegram, WhatsApp).

### `apps/client-web` — Web Client

Browser-based UI built with React and Vite. Three-panel layout: Core tree sidebar, center chat/editor area, and right-side explorer/terminal panel.

**Key technologies:** React, Vite, Monaco Editor, xterm.js, Tailwind CSS v4, shadcn/ui components

### `apps/client-desktop` — Desktop Client

Tauri 2.0 application that wraps the web client in a native window. Provides native OS integration (file system access, system tray, notifications) with a ~10MB binary size.

### `apps/client-mobile` — Mobile Client

React Native (Expo) application for iOS and Android. Uses React 18 due to React Native peer dependency constraints.

### `apps/client-cli` — CLI Client

Terminal-based client using Ink (React for terminals) and Commander for argument parsing. Provides a TUI experience for headless environments.

### `apps/docs` — Documentation

VitePress-powered documentation site for architecture docs and guides.

## Libraries

### `libs/protocol` — Foundation Layer

The most critical package. Defines all message types, schemas, and interfaces used for WebSocket communication. Every other package depends on this.

**Rule:** This is the only library that other packages may import for shared types. Apps never import from each other — they communicate via the WebSocket protocol.

### `libs/client-shared` — Shared Client Logic

React hooks and state stores shared across all client applications (web, desktop, mobile). Includes the multi-Core connection store that manages simultaneous WebSocket connections.

### `libs/client-components` — Shared UI Components

shadcn/ui-style components built with Radix UI, class-variance-authority (cva), and tailwind-merge. Provides the consistent design system across web and desktop clients.

### `libs/skills` — Skill Definitions

Built-in agent skills (file operations, search, terminal commands, etc.) defined as pluggable modules.

### `libs/mcp-configs` — MCP Server Configs

Pre-configured Model Context Protocol server definitions that agents can use for extended tool access.

## Dependency Graph

```
libs/protocol                    ◄── Foundation (no dependencies)
  │
  ├── libs/skills                ◄── Depends on: protocol
  ├── libs/mcp-configs           ◄── Depends on: protocol
  ├── libs/client-shared         ◄── Depends on: protocol
  │     │
  │     ├── libs/client-components  ◄── Depends on: protocol, client-shared
  │     │     │
  │     │     ├── apps/client-web      ◄── Depends on: protocol, client-shared, client-components
  │     │     ├── apps/client-desktop  ◄── Depends on: protocol, client-shared, client-components
  │     │     └── apps/client-mobile   ◄── Depends on: protocol, client-shared, client-components
  │     │
  │     └── apps/client-cli        ◄── Depends on: protocol, client-shared
  │
  ├── apps/core                  ◄── Depends on: protocol
  └── apps/maestro               ◄── Depends on: protocol
```

**Key principle:** Data flows through the protocol, not through direct imports. A client never imports from `apps/core` — it sends a WebSocket message defined in `libs/protocol` and the Core responds with another protocol message.

## TypeScript Configuration

All packages extend `tsconfig.base.json`:

- **Strict mode** enabled (`strict: true`)
- **ES modules** throughout (`"type": "module"` in all package.json files)
- **Node packages** use `NodeNext` module resolution and target `ES2023`
- **Client packages** use `Bundler` module resolution (Vite handles the bundling)
- **No path aliases** — npm workspaces handles cross-package resolution
