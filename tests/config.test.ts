import { afterEach, describe, expect, it } from "vitest";
import {
  applyCliTransportOverrides,
  assertEnvCredentialsPresent,
  resolveHashnodeCredentialMode,
  resolveHashnodeToken,
} from "../src/config.js";

describe("config", () => {
  const keys = ["HASHNODE_TOKEN", "HASHNODE_CREDENTIAL_MODE", "MCP_TRANSPORT"] as const;
  const saved: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
      delete saved[k];
    }
  });

  function stash(env: NodeJS.ProcessEnv = process.env): void {
    for (const k of keys) {
      if (!(k in saved)) saved[k] = env[k];
      delete env[k];
    }
  }

  it("applyCliTransportOverrides maps --http / --stdio", () => {
    expect(applyCliTransportOverrides(["node", "x", "--http"], {}).MCP_TRANSPORT).toBe(
      "http"
    );
    expect(applyCliTransportOverrides(["node", "x", "--stdio"], {}).MCP_TRANSPORT).toBe(
      "stdio"
    );
  });

  it("defaults credential mode to env", () => {
    stash();
    expect(resolveHashnodeCredentialMode({})).toBe("env");
  });

  it("assertEnvCredentialsPresent requires HASHNODE_TOKEN in env mode", () => {
    stash();
    expect(() => assertEnvCredentialsPresent({})).toThrow(/HASHNODE_TOKEN/);
    expect(() =>
      assertEnvCredentialsPresent({ HASHNODE_CREDENTIAL_MODE: "header" })
    ).not.toThrow();
  });

  it("resolveHashnodeToken reads env or header without exposing values in errors", () => {
    stash();
    const secret = "super-secret-pat-value";
    const token = resolveHashnodeToken(
      {
        auth: { mode: "bearer", scopes: [] },
        headers: new Headers(),
      },
      { HASHNODE_TOKEN: secret }
    );
    expect(token).toBe(secret);

    const headerToken = resolveHashnodeToken(
      {
        auth: { mode: "bearer", scopes: [] },
        headers: new Headers({ "X-Hashnode-Token": "header-pat" }),
      },
      { HASHNODE_CREDENTIAL_MODE: "header" }
    );
    expect(headerToken).toBe("header-pat");
  });
});
