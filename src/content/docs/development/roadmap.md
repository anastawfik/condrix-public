---
title: Roadmap
description: Development milestones and planned features for Condrix.
sidebar:
  order: 3
---

Condrix is under active development. This roadmap outlines the planned milestones and their current status.

## Milestone 1: Core Platform (Current)

Foundation infrastructure — Core daemon, Web Client, and basic Maestro.

- [x] Core daemon with WebSocket server
- [x] Workspace management (create, clone, lifecycle state machine)
- [x] AI agent sessions with Claude integration
- [x] Claude OAuth authentication flow
- [x] Claude Code CLI subprocess for API calls
- [x] Multi-provider AI support (Claude, OpenAI, Ollama, Custom endpoints)
- [x] AI Connections and Profiles with fallback chains
- [x] Registration tokens for secure Core-to-Maestro authentication
- [x] Token rotation from Maestro UI
- [x] Terminal management (PTY sessions via node-pty)
- [x] File operations (read, write, search)
- [x] Git operations (status, diff, stage, commit)
- [x] Web Client with three-panel layout
- [x] Monaco Editor integration
- [x] xterm.js terminal emulator
- [x] Real-time chat interface with markdown rendering
- [x] Multi-Core connection support
- [x] Shared component library (shadcn/ui style)
- [x] NX monorepo with build caching
- [x] Protocol library with typed message envelopes
- [ ] Maestro Core registry and discovery
- [ ] Maestro connection relay
- [ ] Comprehensive test suite
- [ ] Error handling and recovery improvements

## Milestone 2: Desktop & CLI Clients

Native desktop experience and terminal-based interface.

- [x] Tauri 2.0 desktop shell (wraps web client)
- [ ] Native file system integration via Tauri
- [ ] System tray with agent status
- [ ] Desktop notifications
- [ ] CLI client with Ink TUI
- [ ] CLI command interface (Commander)
- [ ] Headless mode for CI/CD pipelines

## Milestone 3: Mobile Client

On-the-go access to AI agents from iOS and Android.

- [ ] React Native (Expo) project setup
- [ ] Mobile-optimized chat interface
- [ ] Push notifications for agent events
- [ ] Workspace browser and file viewer
- [ ] Biometric authentication

## Milestone 4: Advanced Orchestration

Multi-agent coordination and intelligent task distribution.

- [ ] Maestro multi-agent workflow engine
- [ ] Task decomposition and distribution across Cores
- [ ] Agent-to-agent communication protocol
- [ ] Telegram messaging bridge
- [ ] WhatsApp messaging bridge
- [ ] Proactive notifications (agent needs attention, task complete)
- [ ] Workspace templates and presets

## Milestone 5: Security & Enterprise

Production-grade security and team collaboration features.

- [ ] TOTP two-factor authentication
- [ ] Role-based access control
- [ ] Audit logging
- [ ] PostgreSQL backend option (alternative to SQLite)
- [ ] Team workspaces with shared access
- [ ] SSO / SAML integration
- [ ] Rate limiting and abuse prevention
- [ ] End-to-end encryption for relay traffic

## Contributing

Condrix is open source and contributions are welcome. See the [GitHub repository](https://github.com/anastawfik/condrix) for:

- Open issues and feature requests
- Contribution guidelines
- Development setup instructions

The best way to get started is to pick an unchecked item from the current milestone and open a pull request.
