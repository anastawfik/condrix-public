---
title: Introduction
description: What is Condrix and how does it work?
sidebar:
  order: 1
---

Condrix is a **Distributed AI Agent Orchestration Platform**. It lets you run AI coding agents on any machine and control them from any device — a web browser, a desktop app, a phone, or a terminal.

## The Problem

Modern AI coding assistants are locked to a single machine and a single interface. If you start a long-running task on your desktop, you can't check on it from your phone. If you have a powerful cloud server, you can't easily point your local IDE at it. And if you want multiple agents working on different parts of a project, there's no way to coordinate them.

## The Solution

Condrix introduces a three-layer architecture that separates **where agents run** from **where you interact with them**.

### Core — The Agent Runtime

A Core is a headless daemon that runs on any machine with Node.js. It manages:

- **AI agent sessions** with full chat history and tool use
- **Workspaces** — cloned Git repositories with isolated environments
- **Terminals** — real PTY sessions the agent (or you) can use
- **File operations** — read, write, search, powered by the local filesystem
- **Git operations** — stage, commit, diff, branch, all through the protocol

A Core binds to `127.0.0.1:9100` by default. You can run multiple Cores on different machines, each working on different projects.

### Maestro — The Orchestrator

Maestro is a central coordination service that:

- **Discovers and tracks** all registered Cores
- **Relays connections** when clients can't reach a Core directly (different network, behind NAT)
- **Bridges messaging** — receive notifications and send commands via WhatsApp or Telegram
- **Coordinates multi-agent workflows** across Cores (planned)

Maestro runs on port `9200` and is optional for single-machine setups.

### Clients — The Interfaces

Clients are stateless UI shells. They hold no project data — everything lives in the Core. This means you can:

- Start a chat on the **Web Client**, check progress from the **Mobile App**, and review code on the **Desktop App**
- Disconnect and reconnect without losing state
- Connect multiple clients to the same Core simultaneously

| Client | Technology | Status |
|--------|-----------|--------|
| Web | React + Vite | Active development |
| Desktop | Tauri 2.0 + React | Active development |
| Mobile | React Native (Expo) | Planned |
| CLI | Ink + Commander | Planned |

## Key Features

- **WebSocket-only protocol** — All communication uses a typed message envelope protocol. No REST APIs, no polling.
- **OAuth authentication** — Cores authenticate with Claude via OAuth. No API keys to manage.
- **SQLite persistence** — Zero external dependencies. Everything is stored in local SQLite databases.
- **Cloudflare Tunnel** — Built-in support for secure remote access without port forwarding.
- **Real-time sync** — Terminal output, file changes, Git state, and chat messages stream live to all connected clients.
- **Pluggable architecture** — MCP servers and skills are loaded dynamically from configuration.

## Next Steps

Ready to try it? Head to the [Quick Start](/getting-started/quick-start/) guide to get Condrix running in minutes.
