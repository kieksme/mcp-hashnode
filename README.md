# @kieksme/mcp-hashnode

[![npm version](https://img.shields.io/npm/v/%40kieksme%2Fmcp-hashnode)](https://www.npmjs.com/package/@kieksme/mcp-hashnode)
[![Release](https://github.com/kieksme/mcp-hashnode/actions/workflows/release.yml/badge.svg)](https://github.com/kieksme/mcp-hashnode/actions/workflows/release.yml)

MCP server for the [Hashnode](https://hashnode.com) GraphQL API.  
Create drafts, publish posts, manage your blog — all via Claude.

> [!IMPORTANT]
> **Hashnode Pro plan required.**  
> Since May 2026, Hashnode's GraphQL API is only available to publications on a [Pro plan](https://hashnode.com/settings/billing).  
> Free accounts will receive an error. Upgrade at **[hashnode.com/settings/billing](https://hashnode.com/settings/billing)**.

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
npx -y @kieksme/mcp-hashnode
```

**Via global install:**
```bash
pnpm add -g @kieksme/mcp-hashnode
```

**Build from source:**
```bash
git clone https://github.com/kieksme/mcp-hashnode.git
cd mcp-hashnode
pnpm install && pnpm run build
```

### 3. Configure your MCP client

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "hashnode": {
      "command": "npx",
      "args": ["-y", "@kieksme/mcp-hashnode"],
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
  --args "-y @kieksme/mcp-hashnode" \
  --env HASHNODE_TOKEN=your-token-here
```

#### Cursor

Add to `.cursor/mcp.json` in your project root, or to `~/.cursor/mcp.json` globally:

```json
{
  "mcpServers": {
    "hashnode": {
      "command": "npx",
      "args": ["-y", "@kieksme/mcp-hashnode"],
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
      "args": ["-y", "@kieksme/mcp-hashnode"],
      "env": {
        "HASHNODE_TOKEN": "your-token-here"
      }
    }
  }
}
```

#### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "hashnode": {
      "command": "npx",
      "args": ["-y", "@kieksme/mcp-hashnode"],
      "env": {
        "HASHNODE_TOKEN": "your-token-here"
      }
    }
  }
}
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

## Releases

This project uses [release-please](https://github.com/googleapis/release-please) for automated releases.

- Commits to `main` that follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:` etc.) are tracked automatically.
- All supported Conventional Commit categories (`feat`, `fix`, `perf`, `revert`, `docs`, `style`, `chore`, `refactor`, `test`, `build`, `ci`) are included for release-please changelog generation and Release PR updates.
- release-please opens a **Release PR** that bumps the version and updates `CHANGELOG.md`.
- Merging the Release PR creates a **GitHub Release** and triggers an automated **npm publish**.

### Required secret

Add `NPM_TOKEN` to the repository secrets (**Settings → Secrets → Actions**):  
Generate at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens) — choose **Automation** type.

## License

MIT
