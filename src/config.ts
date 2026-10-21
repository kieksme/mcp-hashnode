import {
  parseUpstreamCredentialMode,
  resolveUpstreamCredential,
  type AuthMode,
  type RequestContext,
  type UpstreamCredentialMode,
} from "@kieksme/mcp-http-kit";

/**
 * Resolve transport from CLI flags into env before `loadConfig`.
 *
 * Kit default is stdio. `--http` / `--stdio` override `MCP_TRANSPORT`.
 * Prefer env (`MCP_TRANSPORT=http`) for containers; flags are for local CLIs.
 */
export function applyCliTransportOverrides(
  argv: string[] = process.argv,
  env: NodeJS.ProcessEnv = process.env
): NodeJS.ProcessEnv {
  const next: NodeJS.ProcessEnv = { ...env };
  if (argv.includes("--http")) {
    next.MCP_TRANSPORT = "http";
  } else if (argv.includes("--stdio")) {
    next.MCP_TRANSPORT = "stdio";
  }
  return next;
}

export function resolveHashnodeCredentialMode(
  env: NodeJS.ProcessEnv = process.env
): UpstreamCredentialMode {
  return parseUpstreamCredentialMode(env.HASHNODE_CREDENTIAL_MODE, "env");
}

/**
 * Resolve Hashnode PAT from env (default) or per-request `X-Hashnode-Token`.
 * Never logs the token — callers must not dump `ctx.headers` either.
 */
export function resolveHashnodeToken(
  ctx: Pick<RequestContext, "headers" | "auth">,
  env: NodeJS.ProcessEnv = process.env
): string {
  const mode = resolveHashnodeCredentialMode(env);
  const authMode: AuthMode = ctx.auth.mode;

  return resolveUpstreamCredential(ctx.headers, {
    mode,
    envVar: "HASHNODE_TOKEN",
    headerName: "X-Hashnode-Token",
    authMode,
    env,
  }).value;
}

/** Validate HASHNODE_TOKEN early when credential mode is env. */
export function assertEnvCredentialsPresent(env: NodeJS.ProcessEnv = process.env): void {
  if (resolveHashnodeCredentialMode(env) !== "env") return;
  if (!env.HASHNODE_TOKEN?.trim()) {
    throw new Error(
      "HASHNODE_TOKEN environment variable is required when HASHNODE_CREDENTIAL_MODE=env.\n" +
        "Get your Personal Access Token at https://hashnode.com/settings/developer"
    );
  }
}
