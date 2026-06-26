import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { gql } from "../services/hashnode.js";
import type { HashnodeMe, HashnodePublication } from "../types.js";

enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}

const ResponseFormatSchema = z
  .nativeEnum(ResponseFormat)
  .default(ResponseFormat.MARKDOWN)
  .describe("Output format: 'markdown' (default) or 'json'");

// ─── Queries ──────────────────────────────────────────────────────────────────

const ME_QUERY = `
  query {
    me {
      id
      name
      username
      profilePicture
      publications(first: 20) {
        edges {
          node {
            id
            title
            displayTitle
            url
          }
        }
      }
    }
  }
`;

const PUBLICATION_QUERY = `
  query ($host: String!) {
    publication(host: $host) {
      id
      title
      displayTitle
      url
      about { text }
      author { name username }
    }
  }
`;

// ─── Register ─────────────────────────────────────────────────────────────────

export function registerPublicationTools(server: McpServer): void {
  // hashnode_get_me ──────────────────────────────────────────────────────────

  server.registerTool(
    "hashnode_get_me",
    {
      title: "Get current Hashnode user and their publications",
      description: `Returns the authenticated user's profile and a list of their publications.
Use this first to discover your publicationId(s) before creating or listing posts.

Returns:
  - id, name, username, profilePicture
  - publications[]: { id, title, url }

Examples:
  - "What is my publication ID?" → call hashnode_get_me
  - "List my Hashnode blogs" → call hashnode_get_me`,
      inputSchema: {
        response_format: ResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ response_format }) => {
      try {
        const data = await gql<{ me: HashnodeMe }>(ME_QUERY);
        const me = data.me;

        const publications = (me.publications?.edges ?? []).map((e) => e.node);

        if (response_format === ResponseFormat.JSON) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ ...me, publications }, null, 2),
              },
            ],
            structuredContent: { ...me, publications },
          };
        }

        const lines = [
          `# Hashnode User: ${me.name} (@${me.username})`,
          `**ID**: ${me.id}`,
          "",
          "## Publications",
        ];
        if (publications.length === 0) {
          lines.push("_No publications found._");
        } else {
          for (const p of publications) {
            lines.push(`- **${p.title}** — ID: \`${p.id}\` — ${p.url}`);
          }
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : String(error),
            },
          ],
        };
      }
    }
  );

  // hashnode_get_publication ─────────────────────────────────────────────────

  server.registerTool(
    "hashnode_get_publication",
    {
      title: "Get Hashnode publication by host",
      description: `Fetch metadata for a Hashnode publication by its host/domain.

Args:
  - host (string): Publication host, e.g. "yourblog.hashnode.dev" or a custom domain
  - response_format: 'markdown' or 'json'

Returns: id, title, url, about, author info

Examples:
  - host: "thinkport.hashnode.dev"`,
      inputSchema: {
        host: z
          .string()
          .min(1)
          .describe(
            "Publication host, e.g. 'yourblog.hashnode.dev' or a custom domain"
          ),
        response_format: ResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ host, response_format }) => {
      try {
        const data = await gql<{ publication: HashnodePublication }>(
          PUBLICATION_QUERY,
          { host }
        );
        const pub = data.publication;

        if (!pub) {
          return {
            content: [
              {
                type: "text",
                text: `Error: No publication found for host '${host}'.`,
              },
            ],
          };
        }

        if (response_format === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(pub, null, 2) }],
            structuredContent: pub,
          };
        }

        const lines = [
          `# ${pub.displayTitle ?? pub.title}`,
          `**ID**: \`${pub.id}\``,
          `**URL**: ${pub.url}`,
        ];
        if (pub.author) {
          lines.push(`**Author**: ${pub.author.name} (@${pub.author.username})`);
        }
        if (pub.about?.text) {
          lines.push("", String(pub.about.text));
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : String(error),
            },
          ],
        };
      }
    }
  );
}
