---
title: Authentication
description: How Condrix authenticates clients, Cores, and Maestro connections.
sidebar:
  order: 3
---

This page covers authentication **between Condrix components** — how clients connect to Cores, how Cores register with Maestro, and how users log in to Maestro.

For authenticating with **AI providers** (Claude, OpenAI, Ollama, etc.), see [AI Providers](/getting-started/ai-providers/).

## Authentication Layers

Condrix has three independent authentication layers:

| Layer | Who Authenticates | Mechanism |
|-------|-------------------|-----------|
| **Client ↔ Core** | Client to Core WebSocket | Core access token (per-machine) |
| **Client ↔ Maestro** | User to Maestro | Username + password + optional TOTP |
| **Core ↔ Maestro** | Core to Maestro | Registration token → permanent access token |

Each layer is independent. Revoking access at one layer does not affect the others.

## Core Access Tokens

Every Core requires a valid **access token** to accept WebSocket connections. The token authorizes the holder to interact with that specific Core — run agents, read files, execute terminal commands, etc.

### Token Storage

Access tokens are stored in the Core's SQLite database (`~/.condrix/core.db`, table `auth_tokens`). Each token has:

- A unique value (64-character hex string by default)
- A name (e.g., `default-admin`, `core-access`)
- A set of scopes (permissions)
- Optional expiry timestamp
- Optional TOTP 2FA

### Generating Tokens

Tokens are created automatically on Core startup:

- **Dev mode** — No token required for local (non-tunneled) connections. This is the default when running via `npm run dev:core`.
- **Production mode** — The Core generates a `default-admin` token on first startup and prints it to stdout. Save this token — you'll need it to connect from a client.
- **CONDRIX_CORE_TOKEN env var** — Pre-seed a known token at startup (see below).

### CONDRIX_CORE_TOKEN

The `CONDRIX_CORE_TOKEN` environment variable pre-seeds an auth token when the Core starts. This is useful for:

- **Automated deployments** where you need a known token value before the Core boots
- **Maestro outbound connections** where Maestro needs a token to authenticate to the Core
- **Docker/systemd setups** where injecting secrets via env vars is the standard pattern

```bash
# PowerShell
$env:CONDRIX_CORE_TOKEN="my-pre-seeded-token"; npm run dev:core

# Bash
CONDRIX_CORE_TOKEN=my-pre-seeded-token npm run dev:core
```

If the token already exists in `auth_tokens`, nothing happens (idempotent). Otherwise it's inserted with all scopes.

### Token Rotation

Tokens can be rotated at any time:

- **Via Core API** — The `auth.rotateToken` route replaces an existing token with a new value, preserving metadata (name, scopes, TOTP).
- **Via Maestro UI** — Maestro admins can rotate a Core's access token from the Cores settings panel. If the Core is connected via an outbound tunnel, the rotation is pushed automatically. Otherwise, the new token is displayed for manual update.

### TOTP 2FA

Each Core access token can optionally require a TOTP code for authentication. Setup:

1. Open the Core Terminal in the web client
2. Run `condrix-core auth totp setup <token-name>`
3. Scan the QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
4. Run `condrix-core auth totp enable <token-name> <6-digit-code>` to confirm

Once enabled, clients must provide a valid TOTP code along with the access token to authenticate.

## Maestro User Authentication

Maestro has its own user database, separate from Core auth tokens. Users log in with username and password (plus optional TOTP) and receive a session token that authorizes subsequent requests.

### Default Admin

On first startup, Maestro creates a `default-admin` user and prints the generated password to stdout. Save this — it's your initial login credential.

### Sign In

1. Open the web client
2. Click **Sign In to Condrix** (or **Connect to Maestro** in the Cores settings)
3. Enter the Maestro URL (e.g., `wss://maestro.condrix.dev`)
4. Enter username and password
5. If TOTP is enabled on your account, enter the 6-digit code when prompted
6. On success, a session token is stored in `localStorage` and the web client stays authenticated across page reloads

### Sessions

Maestro sessions expire after **7 days** by default. When a session expires or the user clicks **Sign Out**, the token is invalidated and the user must re-authenticate.

### Changing Your Password

1. Sign in to Maestro
2. Open **Settings** → **Account** tab
3. Enter current password and new password
4. Click **Update Password**

### Enabling TOTP

1. Open **Settings** → **Account** tab
2. Under **Two-Factor Authentication**, click **Setup TOTP**
3. Scan the QR code with an authenticator app
4. Enter a test code to confirm
5. TOTP is now required at every sign-in

### User Roles

Maestro supports two roles:

| Role | Permissions |
|------|-------------|
| **admin** | Full access: register/remove/rename Cores, rotate tokens, manage registration tokens, manage AI config, create/delete users |
| **user** | Read-only access to Cores and workspaces they are authorized for |

Only admins can perform destructive or configuration-changing actions.

## Core ↔ Maestro Registration

When a Core connects to Maestro, it must authenticate with a valid access token stored on the Maestro side. There are **two ways** to establish this trust:

### Method 1: Maestro Registers the Core (Admin-Initiated)

An admin registers a Core from the Maestro UI:

1. Sign in to Maestro as an admin
2. Open **Settings** → **Cores** (Maestro mode)
3. Click **Register Core**
4. Enter the Core's tunnel URL and a display name
5. Maestro generates an access token — copy it
6. On the Core machine, set `CONDRIX_CORE_TOKEN=<copied-token>` and start the Core
7. Maestro connects outbound to the Core using the token

Use this method when you control both machines and want to pair them manually.

### Method 2: Core Self-Registers (Invite-Token Flow)

A Maestro admin generates a **registration token** (invite code), and the Core uses it to self-register:

1. Admin signs in to Maestro and opens **Settings** → **Cores**
2. Scrolls to **Registration Tokens** section
3. Clicks **Generate Token**, gives it a name (e.g., `dev-machine`)
4. Copies the generated token
5. Core admin sets `CONDRIX_MAESTRO_URL` and `CONDRIX_MAESTRO_TOKEN=<registration-token>` on the Core
6. On first connect, Maestro recognizes the invite code, registers the Core, and issues a **permanent access token**
7. The Core stores the permanent token in its database (`maestro.token` setting)
8. Subsequent restarts use the permanent token automatically — the invite code is no longer needed

This is the recommended approach for self-service Core onboarding.

### Registration Tokens

Registration tokens are one-time or multi-use invite codes that let Cores join a Maestro without a pre-shared secret. Each token has:

- A name (for admin reference)
- Optional `max_uses` limit (null = unlimited)
- Optional expiration timestamp
- Usage counter

Once used, the token remains in the database for audit purposes but can be revoked by the admin at any time. Revoking a registration token does not invalidate already-issued permanent tokens.

### Permanent Tokens

After a successful registration, the Core receives a permanent access token (64-char hex) that replaces the invite code. This token:

- Is stored in the Core's `maestro.token` DB setting (takes priority over `CONDRIX_MAESTRO_TOKEN` env var)
- Is used for all subsequent Core↔Maestro connections
- Can be rotated by a Maestro admin at any time

### Inbound vs Outbound Connections

The registration flow supports both connection directions:

- **Inbound** (Core → Maestro) — Core opens a WebSocket to Maestro. Used when Maestro is publicly reachable (e.g., hosted on a VPS with Cloudflare Tunnel).
- **Outbound** (Maestro → Core) — Maestro opens a WebSocket to the Core's tunnel URL. Used when the Core is behind a Cloudflare Tunnel with a persistent URL.

Both directions use the same token mechanism. The choice is determined by `connection_mode` on the Core's Maestro record.

## Core Terminal

Each Core provides a built-in terminal accessible from the web client. This terminal runs on the Core's host machine with the Core's privileges. Use it for:

- Running `condrix-core auth` commands (list tokens, enable TOTP, etc.)
- Viewing Core logs
- Administrative tasks on the Core machine

Access it from the **Terminal** panel in the web client's right sidebar.

## Security Considerations

- **Core tokens** are stored unencrypted in SQLite. Protect `~/.condrix/core.db` with filesystem permissions.
- **Maestro sessions** are stored in browser `localStorage`. Clear them on logout, and avoid using Condrix on shared devices without signing out.
- **Registration tokens** should be treated as secrets. Don't commit them to version control.
- **Tunneled connections** (via Cloudflare Tunnel) always require token authentication, even in dev mode.
- **Dev mode** bypasses auth for local (non-tunneled) connections to the Core. Never enable dev mode on production Cores exposed to the network.
- **TLS everywhere** — When connecting over a network, use `wss://` (via Cloudflare Tunnel or reverse proxy with TLS). Never send tokens over unencrypted `ws://` to a remote Core.
- **Rotate regularly** — Even without compromise, rotate tokens periodically. Maestro's UI makes this a one-click operation.
