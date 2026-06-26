# hashnode-mcp-server

MCP server for the [Hashnode](https://hashnode.com) GraphQL API.  
Create drafts, publish posts, manage your blog — all via Claude.

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

### 2. Install & build

```bash
git clone https://github.com/vergissberlin/mcp-hashnode.git
cd mcp-hashnode
npm install
npm run build
```

### 3. Configure in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hashnode": {
      "command": "node",
      "args": ["/absolute/path/to/hashnode-mcp-server/dist/index.js"],
      "env": {
        "HASHNODE_TOKEN": "your-token-here"
      }
    }
  }
}
```

### 4. Configure in Claude Code

```bash
claude mcp add hashnode \
  --command node \
  --args /absolute/path/to/hashnode-mcp-server/dist/index.js \
  --env HASHNODE_TOKEN=your-token-here
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

## License

MIT
