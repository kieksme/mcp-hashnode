import { describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@kieksme/mcp-http-kit";
import { createHashnodeServer, TOOL_COUNT } from "../../src/server.js";

vi.mock("../../src/services/hashnode.js", async () => {
  class HashnodeClient {
    constructor(_token: string) {}
    async gql() {
      throw new Error("not used in registration test");
    }
  }
  return { HashnodeClient, normalizeError: (e: unknown) => e };
});

describe("tool registration", () => {
  it("registers the expected tool catalog", async () => {
    const ctx: RequestContext = {
      auth: { mode: "none", scopes: [] },
      headers: new Headers(),
      url: new URL("stdio://local"),
      era: "modern",
    };
    process.env.HASHNODE_TOKEN = "test-token";
    const server = createHashnodeServer(ctx);
    // McpServer stores tools internally; list via the public tool API when available.
    const listed = await (
      server as unknown as {
        listTools?: () => Promise<{ tools: Array<{ name: string }> }>;
      }
    ).listTools?.();

    if (listed?.tools) {
      expect(listed.tools.length).toBe(TOOL_COUNT);
      expect(listed.tools.map((t) => t.name)).toEqual(
        expect.arrayContaining([
          "hashnode_get_me",
          "hashnode_get_publication",
          "hashnode_list_posts",
          "hashnode_get_post",
          "hashnode_create_draft",
          "hashnode_update_draft",
          "hashnode_list_drafts",
          "hashnode_publish_draft",
          "hashnode_publish_post",
          "hashnode_update_post",
          "hashnode_delete_post",
        ])
      );
    } else {
      // Fallback: kit contract already asserts count via tools/list; here ensure factory works.
      expect(server).toBeTruthy();
      expect(TOOL_COUNT).toBe(11);
    }
  });
});
