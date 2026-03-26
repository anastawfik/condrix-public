---
title: Commands
description: Development commands and CLI options for Condrix.
sidebar:
  order: 1
---

## npm Scripts

All commands are run from the monorepo root.

### Development

| Command | Description |
|---------|-------------|
| `npm run dev:core` | Start Core daemon with hot-reload (port 9100) |
| `npm run dev:maestro` | Start Maestro service with hot-reload (port 9200) |
| `npm run dev:web` | Start Web Client dev server (port 5173) |
| `npm run dev:cli` | Start CLI client in development mode |

### Build

| Command | Description |
|---------|-------------|
| `npm run build` | Build all packages (respects dependency graph) |
| `npx nx run @condrix/core:build` | Build a specific package |
| `npx nx run-many -t build` | Build all packages (explicit NX form) |
| `npx nx affected -t build` | Build only packages affected by recent changes |

### Test & Quality

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests with Vitest |
| `npm run lint` | Lint all packages with ESLint |
| `npm run typecheck` | Type-check all packages with `tsc --noEmit` |
| `npx nx affected -t test` | Test only affected packages |
| `npx nx affected -t lint` | Lint only affected packages |

### Utilities

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies (npm workspaces) |
| `npx nx graph` | Open interactive dependency graph in browser |
| `npx nx reset` | Clear NX cache |

## NX Task Runner

Condrix uses NX for build orchestration. NX automatically:

- **Respects dependency order** — `@condrix/protocol` builds before packages that depend on it
- **Caches results** — Unchanged packages skip rebuilding
- **Parallelizes** — Independent packages build concurrently

### Running Tasks on Specific Packages

```bash
# Build just the protocol library
npx nx run @condrix/protocol:build

# Test just the core
npx nx run @condrix/core:test

# Lint the web client
npx nx run @condrix/client-web:lint
```

### Running Tasks on Affected Packages

After making changes, run tasks only on packages that could be affected:

```bash
# Test affected packages since last commit
npx nx affected -t test

# Build affected packages against main branch
npx nx affected -t build --base=main
```

## Core CLI Options

The Core daemon accepts command-line options that override environment variables:

```bash
# Specify port
npm run dev:core -- --port 9101

# Specify bind address
npm run dev:core -- --host 0.0.0.0

# Set log level
npm run dev:core -- --log-level debug

# Specify data directory
npm run dev:core -- --data-dir /path/to/data

# Combine options
npm run dev:core -- --port 9101 --host 0.0.0.0 --log-level debug
```

### Option Reference

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--port` | `-p` | `9100` | WebSocket listen port |
| `--host` | `-h` | `127.0.0.1` | Bind address |
| `--log-level` | `-l` | `info` | Log verbosity |
| `--data-dir` | `-d` | `~/.condrix` | Data directory |
| `--maestro-url` | `-m` | — | Maestro WebSocket URL |

## Maestro CLI Options

```bash
# Specify port
npm run dev:maestro -- --port 9201

# Set log level
npm run dev:maestro -- --log-level debug
```

## Development Workflow

A typical development session:

```bash
# 1. Install dependencies (first time or after pulling)
npm install

# 2. Start Core in one terminal
npm run dev:core

# 3. Start Web Client in another terminal
npm run dev:web

# 4. Open http://localhost:5173 in your browser

# 5. Make changes — hot-reload handles the rest

# 6. Run tests before committing
npm test

# 7. Type-check before pushing
npm run typecheck
```
