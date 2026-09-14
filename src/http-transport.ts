import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const MAX_BODY_BYTES = 10 * 1024 * 1024;

export interface HttpTransportOptions {
  port: number;
  endpoint: string;
  healthEndpoint: string;
  authToken: string | undefined;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function isAuthorized(req: IncomingMessage, token: string): boolean {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return false;
  const provided = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(token);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export async function startHttpTransport(
  buildServer: () => McpServer,
  options: HttpTransportOptions,
): Promise<Server> {
  const { port, endpoint, healthEndpoint, authToken } = options;
  if (!authToken) throw new Error("MCP_HTTP_AUTH_TOKEN is required when MCP_TRANSPORT=http");

  const handleRequest = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");
    if (req.method === "GET" && pathname === healthEndpoint) {
      sendJson(res, 200, { status: "ok" });
      return;
    }
    if (pathname !== endpoint) {
      sendJson(res, 404, { error: "Not Found" });
      return;
    }
    if (!isAuthorized(req, authToken)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    try {
      const body = req.method === "POST" ? await readJsonBody(req) : undefined;
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      const server = buildServer();
      res.on("close", () => void transport.close());
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (error) {
      if (res.headersSent) return;
      sendJson(res, 500, {
        jsonrpc: "2.0",
        error: { code: -32603, message: error instanceof Error ? error.message : "Internal server error" },
        id: null,
      });
    }
  };

  const httpServer = createServer((req, res) => void handleRequest(req, res));
  await new Promise<void>((resolve) => httpServer.listen(port, "0.0.0.0", resolve));
  return httpServer;
}
