# @kieksme/hashnode-mcp

[![npm version](https://img.shields.io/npm/v/%40kieksme%2Fhashnode-mcp)](https://www.npmjs.com/package/@kieksme/hashnode-mcp)
[![CI](https://github.com/kieksme/mcp-hashnode/actions/workflows/ci.yml/badge.svg)](https://github.com/kieksme/mcp-hashnode/actions/workflows/ci.yml)
[![Release](https://github.com/kieksme/mcp-hashnode/actions/workflows/release.yml/badge.svg)](https://github.com/kieksme/mcp-hashnode/actions/workflows/release.yml)
[![AgentAvow](https://agentavow.com/api/v1/public/scan/kieksme/mcp-hashnode/badge)](https://agentavow.com/check/kieksme/mcp-hashnode)
[![MCP Trust Score](https://mcptrustchecker.com/scan/github/kieksme/mcp-hashnode/badge.svg)](https://mcptrustchecker.com/scan/github/kieksme/mcp-hashnode)

MCP server for the [Hashnode](https://hashnode.com) GraphQL API.  
Create drafts, publish posts, and manage your blog from any MCP client.

> [!IMPORTANT]
> **Hashnode Pro plan required.**  
> Since May 2026, Hashnode's GraphQL API is only available to publications on a [Pro plan](https://hashnode.com/settings/billing).  
> Free accounts will receive an error. Upgrade at **[hashnode.com/settings/billing](https://hashnode.com/settings/billing)**.

> [!NOTE]
> Package rename: published as **`@kieksme/hashnode-mcp`** (was `@kieksme/mcp-hashnode`).  
> The `mcp-hashnode` CLI binary remains as a compatibility alias for `hashnode-mcp`.

## Tools

| Tool | Description |
|---|---|
| `hashnode_get_me` | Get your profile and publication IDs |
| `hashnode_get_publication` | Get publication info by host |
| `hashnode_list_posts` | List published posts |
| `hashnode_get_post` | Get a single post by slug |
| `hashnode_create_draft` | Create a draft |
| `hashnode_update_draft` | Update an existing draft |
| `hashnode_list_drafts` | List drafts in a publication |
| `hashnode_publish_draft` | Publish a draft → live post |
| `hashnode_publish_post` | Publish directly (no draft step) |
| `hashnode_update_post` | Update a published post |
| `hashnode_delete_post` | Delete a post ⚠️ |

## Setup

### 1. Get your Personal Access Token

Go to [hashnode.com/settings/developer](https://hashnode.com/settings/developer) and click **Generate new token**.

### 2. Install

**Via npx (no install needed — recommended):**
```bash
npx -y @kieksme/hashnode-mcp
```

**Via global install:**
```bash
pnpm add -g @kieksme/hashnode-mcp
```

**Build from source:**
```bash
git clone https://github.com/kieksme/mcp-hashnode.git
cd mcp-hashnode
pnpm install && pnpm run build
```

### 3. Configure your MCP client

#### Claude Code plugin

```text
/plugin marketplace add kieksme/mcp-hashnode
/plugin install hashnode-mcp@mcp-hashnode
```

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "hashnode": {
      "command": "npx",
      "args": ["-y", "@kieksme/hashnode-mcp"],
      "env": {
        "HASHNODE_TOKEN": "your-token-here"
      }
    }
  }
}
```

#### Claude Code (CLI)

```bash
claude mcp add hashnode \
  --command npx \
  --args "-y @kieksme/hashnode-mcp" \
  --env HASHNODE_TOKEN=your-token-here
```

#### Cursor

Add to `.cursor/mcp.json` in your project root, or to `~/.cursor/mcp.json` globally:

```json
{
  "mcpServers": {
    "hashnode": {
      "command": "npx",
      "args": ["-y", "@kieksme/hashnode-mcp"],
      "env": {
        "HASHNODE_TOKEN": "your-token-here"
      }
    }
  }
}
```

#### VS Code (GitHub Copilot)

Add to `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "hashnode": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@kieksme/hashnode-mcp"],
      "env": {
        "HASHNODE_TOKEN": "your-token-here"
      }
    }
  }
}
```

#### Remote MCP (ChatGPT, Codex, and Copilot Cloud Agent)

Set `MCP_TRANSPORT=http`, `MCP_AUTH_TOKEN`, `MCP_HTTP_HOST=0.0.0.0`, and `MCP_ALLOWED_HOSTS` on the
hosted server (Railway sets `PORT`). The MCP endpoint is `https://<your-host>/mcp`; `/health` is
available for hosting probes (no auth, Host-agnostic). Use the committed `.github/mcp.json` for
Copilot Cloud Agent; it expects `COPILOT_MCP_HASHNODE_URL` and `COPILOT_MCP_HASHNODE_TOKEN`.

Legacy aliases still work (one-line deprecation warning): `MCP_HTTP_AUTH_TOKEN`, `MCP_HTTP_PORT`,
`MCP_HTTP_ALLOWED_HOSTS`, `MCP_HTTP_ALLOWED_ORIGINS`, `HEALTH_ENDPOINT`.

In Codex, register the same endpoint with:

```bash
codex mcp add hashnode --url https://<your-host>/mcp \
  --bearer-token-env-var HASHNODE_MCP_AUTH_TOKEN
```

In ChatGPT, add the public HTTPS endpoint as a custom MCP app/connector and provide
the bearer token during setup. ChatGPT cannot reach `localhost`.

#### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "hashnode": {
      "command": "npx",
      "args": ["-y", "@kieksme/hashnode-mcp"],
      "env": {
        "HASHNODE_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Running the server

Transport is provided by [`@kieksme/mcp-http-kit`](https://github.com/kieksme/mcp-http-kit):

| Mode | How |
|---|---|
| **stdio** (default) | Local MCP clients spawn the process |
| **HTTP** | `MCP_TRANSPORT=http` or `--http` |

```bash
# Local stdio
HASHNODE_TOKEN=… npx -y @kieksme/hashnode-mcp

# Streamable HTTP (containers / Railway)
MCP_TRANSPORT=http \
MCP_HTTP_HOST=0.0.0.0 \
MCP_ALLOWED_HOSTS=your.railway.app \
MCP_AUTH_TOKEN="$(openssl rand -hex 32)" \
HASHNODE_TOKEN=… \
pnpm start
```

### Upstream credentials

| Variable | Notes |
|---|---|
| `HASHNODE_TOKEN` | Default: process env Personal Access Token |
| `HASHNODE_CREDENTIAL_MODE` | `env` (default) or `header` |
| `X-Hashnode-Token` | Per-request PAT when mode is `header` (never logged). Refused when `MCP_AUTH_MODE=none`. |

### HTTP / kit env (summary)

| Variable | Default | Notes |
|---|---|---|
| `MCP_TRANSPORT` | `stdio` | `stdio` \| `http` |
| `PORT` | `3000` | Preferred listen port (Railway). Fallback: `MCP_HTTP_PORT` |
| `MCP_HTTP_HOST` | `127.0.0.1` | Use `0.0.0.0` in containers |
| `MCP_HTTP_PATH` | `/mcp` | MCP endpoint |
| `MCP_HEALTH_PATH` | `/health` | Unauthenticated health |
| `MCP_ALLOWED_HOSTS` | localhost trio | Required when binding beyond localhost |
| `MCP_AUTH_MODE` | `bearer` | `bearer` \| `oauth` \| `none` |
| `MCP_AUTH_TOKEN` | — | Bearer secrets; comma-separated for rotation |

### Tracing (OpenTelemetry, opt-in)

Off by default. Set an OTLP endpoint and one tool call becomes one trace: MCP client → this server → Hashnode GraphQL API. The trace context comes from `params._meta` (`traceparent` / `tracestate`), so it also works over stdio. It is trusted only with `MCP_AUTH_MODE` `bearer` / `oauth`, or on stdio.

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 \
OTEL_SERVICE_NAME=hashnode-mcp \
MCP_TRANSPORT=http MCP_AUTH_TOKEN=… HASHNODE_TOKEN=… \
pnpm start
```

Try it locally with Jaeger (UI on <http://localhost:16686>):

```bash
docker run --rm -p 16686:16686 -p 4318:4318 jaegertracing/all-in-one
```

| Variable | Notes |
|---|---|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Switches tracing on (traces are posted to `<endpoint>/v1/traces`). Use `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` for a full URL. |
| `OTEL_EXPORTER_OTLP_HEADERS` | Auth headers for the collector (never logged) |
| `OTEL_SERVICE_NAME` | Service name, default `hashnode-mcp` |
| `OTEL_SDK_DISABLED=true` | Kill switch |
| `MCP_OTEL_RECORD_PAYLOADS=true` | Also record tool arguments, results and full URLs. **Off by default** because they can contain article text and query strings. |

Privacy by default: no tool arguments or results, no `Authorization` header, query strings and credentials removed from URL attributes, only `traceparent` / `tracestate` sent to Hashnode (never baggage), and only calls made inside a tool call are traced. Details: [`@kieksme/mcp-http-kit` README](https://github.com/kieksme/mcp-http-kit#tracing-opentelemetry-opt-in).

## Docker / Railway / Smithery

- `Dockerfile` — multi-stage, non-root, `HEALTHCHECK` on `/health`
- `railway.json` — healthcheck path `/health`
- `server.json` — official MCP registry (`io.github.kieksme/hashnode-mcp`)
- `smithery.yaml` — container runtime over Streamable HTTP

```bash
docker build -t hashnode-mcp .
docker run --rm -p 3000:3000 \
  -e MCP_AUTH_TOKEN=… \
  -e HASHNODE_TOKEN=… \
  -e MCP_ALLOWED_HOSTS=localhost,127.0.0.1 \
  hashnode-mcp
```

## Usage examples

```
"What's my publication ID?"
→ hashnode_get_me

"Create a draft called 'Cloud Security Best Practices' with this content: ..."
→ hashnode_create_draft

"Publish the draft with ID xyz"
→ hashnode_publish_draft

"List my last 10 posts on thinkport.hashnode.dev"
→ hashnode_list_posts
```

## Authentication

Hashnode requires `Authorization: <token>` (no `Bearer` prefix).  
All mutations need the token; most read queries are public.

MCP clients talking to this server over HTTP must send `Authorization: Bearer <MCP_AUTH_TOKEN>` separately from the Hashnode PAT.

## Rate limits

- Queries: 20,000 req/min  
- Mutations: 500 req/min

## Tags format

Tags must be objects — not plain strings:

```json
[
  { "name": "Cloud Computing", "slug": "cloud-computing" },
  { "name": "DevOps", "slug": "devops" }
]
```

## Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Node **22.14+**, pnpm, ESM.

## Releases

This project uses [release-please](https://github.com/googleapis/release-please) for automated releases.

- Commits to `main` that follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:` etc.) are tracked automatically.
- release-please opens a **Release PR** that bumps the version and updates `CHANGELOG.md`.
- Merging the Release PR creates a **GitHub Release** and triggers an automated **npm publish** of `@kieksme/hashnode-mcp`.

### npm Trusted Publishing

The publish job uses [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC), so no `NPM_TOKEN` secret is needed. One-time setup on npmjs.com, under **@kieksme/hashnode-mcp → Settings → Trusted Publisher**:

- Provider: **GitHub Actions**
- Organization or user: `kieksme`
- Repository: `mcp-hashnode`
- Workflow filename: `release.yml` (must match exactly; leave *Environment* empty)

The workflow runs on a GitHub-hosted runner with Node 24 and publishes with npm 11.5.1 (`npm publish --provenance`).

## License

MIT
