#!/usr/bin/env node
/**
 * @kieksme/mcp-hashnode
 *
 * MCP server for the Hashnode GraphQL API.
 * Supports creating drafts, publishing posts, listing/updating/deleting posts,
 * and querying publications.
 *
 * Required env var: HASHNODE_TOKEN  (Personal Access Token from hashnode.com/settings/developer)
 *
 * Usage (stdio):
 *   HASHNODE_TOKEN=<token> node dist/index.js
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setApiToken } from "./services/hashnode.js";
import { registerPublicationTools } from "./tools/publications.js";
import { registerDraftTools } from "./tools/drafts.js";
import { registerPostTools } from "./tools/posts.js";

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const token = process.env.HASHNODE_TOKEN;
if (!token) {
  console.error(
    "ERROR: HASHNODE_TOKEN environment variable is required.\n" +
      "       Get your Personal Access Token at https://hashnode.com/settings/developer"
  );
  process.exit(1);
}

setApiToken(token);

// ─── Server ───────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "@kieksme/mcp-hashnode",
  version: "1.0.0",
});

registerPublicationTools(server);
registerDraftTools(server);
registerPostTools(server);

// ─── Transport ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("@kieksme/mcp-hashnode running via stdio");
}

main().catch((error: unknown) => {
  console.error(
    "Server error:",
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
