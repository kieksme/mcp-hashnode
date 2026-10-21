#!/usr/bin/env node
/**
 * @kieksme/hashnode-mcp
 *
 * MCP server for the Hashnode GraphQL API.
 * Supports creating drafts, publishing posts, listing/updating/deleting posts,
 * and querying publications.
 *
 * Required env (when HASHNODE_CREDENTIAL_MODE=env, the default):
 *   HASHNODE_TOKEN — Personal Access Token from hashnode.com/settings/developer
 *
 * Usage:
 *   HASHNODE_TOKEN=<token> node dist/index.js
 *   HASHNODE_TOKEN=<token> MCP_TRANSPORT=http MCP_AUTH_TOKEN=<token> \
 *     MCP_HTTP_HOST=0.0.0.0 MCP_ALLOWED_HOSTS=<host> node dist/index.js
 */
import {
  loadConfig,
  startMcpServer,
  type RequestContext,
} from "@kieksme/mcp-http-kit";
import { applyCliTransportOverrides, assertEnvCredentialsPresent } from "./config.js";
import { createHashnodeServer, SERVER_NAME, TOOL_COUNT } from "./server.js";
import { loadPackageVersion } from "./version.js";

const env = applyCliTransportOverrides(process.argv, process.env);
assertEnvCredentialsPresent(env);

const config = loadConfig(env, { realm: "hashnode-mcp" });
const version = loadPackageVersion();

function createServer(ctx: RequestContext) {
  return createHashnodeServer(ctx);
}

async function main(): Promise<void> {
  const started = await startMcpServer({
    createServer,
    config,
    env,
    getHealthInfo: () => ({ version, tools: TOOL_COUNT }),
    onListening: ({ host, port, url }) => {
      console.error(
        `${SERVER_NAME} v${version} listening on ${host}:${port} ` +
          `(POST ${config.http.path}, GET ${config.http.healthPath}; auth=${config.auth.mode}; ${TOOL_COUNT} tools)`
      );
      console.error(`MCP URL: ${url}`);
    },
  });

  if (config.transport === "stdio") {
    console.error(`${SERVER_NAME} v${version} running on stdio (${TOOL_COUNT} tools)`);
  }

  void started;
}

main().catch((error: unknown) => {
  console.error(
    "Server error:",
    error instanceof Error ? error.message : String(error)
  );
  process.exitCode = 1;
});
