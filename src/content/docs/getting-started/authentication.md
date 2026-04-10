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
| **Core ↔ Maestro** | Core to Maestro | 6-char pairing code → permanent access token |

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
| **admin** | Full access: pair/remove/rename Cores, rotate tokens, generate pairing codes, manage AI config, create/delete users |
| **user** | Read-only access to Cores and workspaces they are authorized for |

Only admins can perform destructive or configuration-changing actions.

## Core ↔ Maestro Registration

When a Core connects to Maestro, it must authenticate with a valid access token that Maestro recognizes. Cores connect **inbound** to Maestro — the Core initiates the WebSocket connection using `CONDRIX_MAESTRO_URL` and `CONDRIX_MAESTRO_TOKEN`.

Condrix has a single unified way to attach a Core to Maestro: short, human-friendly **pairing codes**.

### Pairing a Core

1. Sign in to Maestro as an admin
2. Open **Settings** → **Cores**
3. Scroll to the **Pair a Core** section
4. Click **Generate Pairing Code**
5. Maestro returns a **6-character alphanumeric pairing code** (mixed case, e.g., `Ky7R9m`)
6. On the Core machine, set the code as `CONDRIX_MAESTRO_TOKEN` and start the Core:
   ```powershell
   $env:CONDRIX_MAESTRO_URL="wss://maestro.example.com"
   $env:CONDRIX_MAESTRO_TOKEN="Ky7R9m"
   npm run dev:core
   ```
   Or on bash:
   ```bash
   CONDRIX_MAESTRO_URL=wss://maestro.example.com \
   CONDRIX_MAESTRO_TOKEN=Ky7R9m \
   npm run dev:core
   ```
7. On first connect, Maestro swaps the pairing code for a **permanent access token** and stores it in the Core's database (`maestro.token` setting)
8. Subsequent restarts use the permanent token automatically — you can unset `CONDRIX_MAESTRO_TOKEN` or leave it; the DB setting takes priority

Pairing codes are **single-use** by default (consumed after the first successful registration) and **expire after 15 minutes**. Admins can optionally make codes multi-use or change the expiry via the Maestro API, but the default UI flow is single-use / 15-minute.

The previous "Register Core" button has been removed — pairing codes are now the only way to attach a new Core. Existing Cores registered before this change continue to work without any migration.

### CONDRIX_CORE_TOKEN vs CONDRIX_MAESTRO_TOKEN

These are often confused — they represent opposite directions of authentication:

| Env Var | Direction | Purpose |
|---------|-----------|---------|
| **`CONDRIX_MAESTRO_TOKEN`** | Core → Maestro | Core's credential to authenticate **itself to Maestro** (inbound Core→Maestro connection) |
| **`CONDRIX_CORE_TOKEN`** | Client/Maestro → Core | Pre-seeds an auth token in the Core's `auth_tokens` table. Clients (or Maestro via outbound) use this token to authenticate **to the Core** |

When you generate a pairing code from Maestro's UI, you're getting the **Core→Maestro** credential — set it as `CONDRIX_MAESTRO_TOKEN` on the Core.

`CONDRIX_CORE_TOKEN` is only needed in advanced setups where something needs to connect **to** your Core with a known token (e.g., Maestro outbound connections to a Core behind a tunnel).

### Permanent Tokens

After a successful pairing, the Core receives a permanent access token (64-char hex) that replaces the pairing code. This token:

- Is stored in the Core's `maestro.token` DB setting (takes priority over `CONDRIX_MAESTRO_TOKEN` env var)
- Is used for all subsequent Core↔Maestro connections
- Can be rotated by a Maestro admin at any time

### Inbound Connection

Pairing always uses an **inbound** connection: the Core initiates the WebSocket to Maestro using `CONDRIX_MAESTRO_URL` and `CONDRIX_MAESTRO_TOKEN`. This works whenever Maestro is publicly reachable (e.g., hosted on a VPS with Cloudflare Tunnel).

## Core Terminal

Each Core provides a built-in terminal accessible from the web client. This terminal runs on the Core's host machine with the Core's privileges. Use it for:

- Running `condrix-core auth` commands (list tokens, enable TOTP, etc.)
- Viewing Core logs
- Administrative tasks on the Core machine

Access it from the **Terminal** panel in the web client's right sidebar.

## Security Considerations

- **Core tokens** are stored unencrypted in SQLite. Protect `~/.condrix/core.db` with filesystem permissions.
- **Maestro sessions** are stored in browser `localStorage`. Clear them on logout, and avoid using Condrix on shared devices without signing out.
- **Pairing codes** should be treated as secrets. Don't commit them to version control, share them over insecure channels, or log them in plain text.
- **Tunneled connections** (via Cloudflare Tunnel) always require token authentication, even in dev mode.
- **Dev mode** bypasses auth for local (non-tunneled) connections to the Core. Never enable dev mode on production Cores exposed to the network.
- **TLS everywhere** — When connecting over a network, use `wss://` (via Cloudflare Tunnel or reverse proxy with TLS). Never send tokens over unencrypted `ws://` to a remote Core.
- **Rotate regularly** — Even without compromise, rotate tokens periodically. Maestro's UI makes this a one-click operation.
