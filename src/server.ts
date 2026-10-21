import type { RequestContext } from "@kieksme/mcp-http-kit";
import { McpServer } from "@modelcontextprotocol/server";
import { resolveHashnodeToken } from "./config.js";
import { HashnodeClient } from "./services/hashnode.js";
import { registerDraftTools } from "./tools/drafts.js";
import { registerPostTools } from "./tools/posts.js";
import { registerPublicationTools } from "./tools/publications.js";
import { loadPackageVersion } from "./version.js";

export const SERVER_NAME = "hashnode-mcp-server";

/** Number of tools registered by {@link createHashnodeServer}. */
export const TOOL_COUNT = 11;

/**
 * Build one MCP server instance for the current request (HTTP) or process (stdio).
 *
 * Per-request: optional `X-Hashnode-Token` when `HASHNODE_CREDENTIAL_MODE=header`.
 */
export function createHashnodeServer(ctx: RequestContext): McpServer {
  const token = resolveHashnodeToken(ctx);
  const client = new HashnodeClient(token);

  const server = new McpServer(
    { name: SERVER_NAME, version: loadPackageVersion() },
    { capabilities: { tools: {} } }
  );

  registerPublicationTools(server, client);
  registerDraftTools(server, client);
  registerPostTools(server, client);
  return server;
}
