---
title: Cloudflare Tunnel
description: Secure remote access to Condrix Cores using Cloudflare Tunnel.
sidebar:
  order: 2
---

Cloudflare Tunnel provides encrypted remote access to your Condrix Cores without exposing ports, configuring firewalls, or managing TLS certificates.

## Overview

A Cloudflare Tunnel creates a secure outbound connection from your machine to Cloudflare's edge network. Clients connect to a Cloudflare URL, and traffic is routed through the tunnel to your Core.

```
┌──────────┐     wss://       ┌─────────────┐     tunnel      ┌──────────┐
│  Client   │◄───────────────►│  Cloudflare  │◄──────────────►│   Core   │
│ (Remote)  │  encrypted      │    Edge      │  encrypted     │ (Local)  │
└──────────┘                  └─────────────┘                 └──────────┘
```

Benefits:
- **No port forwarding** — The tunnel connects outbound; no inbound rules needed
- **Automatic TLS** — Clients connect via `wss://` with valid certificates
- **DDoS protection** — Cloudflare's edge absorbs malicious traffic
- **Access control** — Combine with Cloudflare Access for additional authentication

## Quick Tunnel (No Account Required)

The fastest way to expose a Core remotely. Creates a temporary URL that lasts as long as the process runs.

### Built-in Integration

Condrix can manage `cloudflared` automatically:

1. Open the **Web Client** and connect to your Core
2. Go to **Settings** → **Network** tab
3. Click **Start Tunnel**
4. The Core downloads `cloudflared` (if needed) and starts a quick tunnel
5. A `trycloudflare.com` URL appears — share it with clients

### Manual Setup

```bash
# Install cloudflared
# macOS
brew install cloudflared

# Linux
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# Windows
winget install Cloudflare.cloudflared
```

Start a quick tunnel pointing to your Core:

```bash
cloudflared tunnel --url http://localhost:9100
```

The output will include a URL like `https://random-words.trycloudflare.com`. Clients connect using:

```
wss://random-words.trycloudflare.com
```

## Named Tunnel (Persistent URL)

For a stable URL that persists across restarts, create a named tunnel with a Cloudflare account.

### Step 1: Authenticate

```bash
cloudflared tunnel login
```

This opens a browser to authenticate with your Cloudflare account.

### Step 2: Create the Tunnel

```bash
cloudflared tunnel create condrix-core
```

This creates a tunnel and generates a credentials file at `~/.cloudflared/<tunnel-id>.json`.

### Step 3: Add DNS Route

```bash
cloudflared tunnel route dns condrix-core core.yourdomain.com
```

This creates a CNAME record pointing `core.yourdomain.com` to your tunnel.

### Step 4: Configure

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: condrix-core
credentials-file: /home/user/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: core.yourdomain.com
    service: http://localhost:9100
  - service: http_status:404
```

### Step 5: Start the Tunnel

```bash
cloudflared tunnel run condrix-core
```

Clients connect using:

```
wss://core.yourdomain.com
```

## Environment Variables

Configure the Core's tunnel integration via environment variables:

```env
# Tunnel mode: "quick" | "named" | "disabled"
CONDRIX_CORE_TUNNEL_MODE=quick

# For named tunnels: Cloudflare tunnel token
CONDRIX_CORE_TUNNEL_TOKEN=your-tunnel-token

# Auto-start tunnel when Core starts
CONDRIX_CORE_TUNNEL_AUTO_START=true
```

## Docker with Cloudflare Tunnel

Add a `cloudflared` service to your `docker-compose.yml`:

```yaml
services:
  core:
    image: ghcr.io/anastawfik/condrix-core:latest
    ports:
      - "9100:9100"
    environment:
      - CONDRIX_CORE_HOST=0.0.0.0

  tunnel:
    image: cloudflare/cloudflared:latest
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    depends_on:
      - core
```

The tunnel service connects to Cloudflare and routes traffic to the Core container.

## Remote Cores Connecting via Maestro

For multiple remote Cores, each can have its own tunnel, or they can all register with a single Maestro instance that has a tunnel:

```
Core A (Home)     ──► Maestro (Cloud VPS with tunnel) ◄── Client (Phone)
Core B (Office)   ──►                                  ◄── Client (Laptop)
Core C (Raspberry Pi) ──►
```

This way, only Maestro needs a public URL. Cores connect to Maestro outbound, and clients connect to Maestro through the tunnel.

## Security Considerations

- Tunneled connections are detected by the Core via the `Cf-Connecting-Ip` header
- When a tunnel is active, the Core requires token authentication even in development mode
- Quick tunnel URLs are unguessable but public — always enable TOTP for production use
- Named tunnels can be combined with [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) for enterprise-grade access control
- The `cloudflared` binary is auto-downloaded to `~/.condrix/bin/` from GitHub releases when using the built-in integration
