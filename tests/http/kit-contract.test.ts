import { createMcpHttpApp, loadConfig } from "@kieksme/mcp-http-kit";
import {
  createAppTestClient,
  createKitContractAssertions,
  readMcpJsonResponse,
} from "@kieksme/mcp-http-kit/test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHashnodeServer, TOOL_COUNT } from "../../src/server.js";

const TOKEN = "test-bearer-token-for-kit-contract";

describe("kit HTTP contract", () => {
  const ENV_KEYS = [
    "MCP_TRANSPORT",
    "MCP_AUTH_MODE",
    "MCP_AUTH_TOKEN",
    "MCP_HTTP_HOST",
    "MCP_ALLOWED_HOSTS",
    "PORT",
    "HASHNODE_TOKEN",
    "HASHNODE_CREDENTIAL_MODE",
  ] as const;
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    for (const k of ENV_KEYS) delete process.env[k];
    process.env.MCP_TRANSPORT = "http";
    process.env.MCP_AUTH_MODE = "bearer";
    process.env.MCP_AUTH_TOKEN = TOKEN;
    process.env.MCP_HTTP_HOST = "127.0.0.1";
    process.env.PORT = "3456";
    process.env.HASHNODE_TOKEN = "hashnode-pat-for-tests";
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  function build() {
    const config = loadConfig(process.env, { realm: "hashnode-mcp" });
    const app = createMcpHttpApp({
      createServer: createHashnodeServer,
      config,
      getHealthInfo: () => ({ version: "test", tools: TOOL_COUNT }),
    });
    const client = createAppTestClient(app, config);
    const assertions = createKitContractAssertions(client, config);
    return { config, app, client, assertions };
  }

  it("passes kit contract: health, 401, Host/Origin, initialize + tools/list", async () => {
    const { assertions, client } = build();
    await assertions.healthUnauthenticated();
    const health = await client.health();
    expect(await health.json()).toEqual({
      version: "test",
      tools: TOOL_COUNT,
      status: "ok",
    });
    await assertions.unauthorizedWithoutToken();
    await assertions.forbiddenOnBadHost();
    await assertions.forbiddenOnBadOrigin();
    const { tools } = await assertions.initializeAndListTools(TOKEN);
    expect(tools.length).toBe(TOOL_COUNT);
  });

  it("accepts per-request X-Hashnode-Token in header credential mode", async () => {
    process.env.HASHNODE_CREDENTIAL_MODE = "header";
    delete process.env.HASHNODE_TOKEN;

    const { client } = build();
    const listResponse = await client.mcp({
      token: TOKEN,
      headers: {
        "mcp-protocol-version": "2025-06-18",
        "x-hashnode-token": "per-request-pat",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }),
    });
    expect(listResponse.ok).toBe(true);
    const payload = (await readMcpJsonResponse(listResponse)) as {
      result?: { tools?: Array<{ name: string }> };
    };
    const names = (payload.result?.tools ?? []).map((t) => t.name);
    expect(names).toContain("hashnode_get_me");
    expect(names.length).toBe(TOOL_COUNT);
  });
});
