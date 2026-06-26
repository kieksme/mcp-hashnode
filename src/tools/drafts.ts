import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { gql } from "../services/hashnode.js";
import type { HashnodeDraft, HashnodePost } from "../types.js";

enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}

const ResponseFormatSchema = z
  .nativeEnum(ResponseFormat)
  .default(ResponseFormat.MARKDOWN)
  .describe("Output format: 'markdown' (default) or 'json'");

// Shared tag schema
const TagInputSchema = z.object({
  name: z.string().describe("Tag display name, e.g. 'Cloud Computing'"),
  slug: z
    .string()
    .describe("Tag slug (lowercase, hyphens), e.g. 'cloud-computing'"),
});

// ─── Queries & Mutations ──────────────────────────────────────────────────────

const LIST_DRAFTS_QUERY = `
  query ($publicationId: ObjectId!, $first: Int!, $after: String) {
    me {
      drafts(first: $first, after: $after, filter: { publicationId: $publicationId }) {
        edges {
          node {
            id
            title
            subtitle
            updatedAt
            tags { id name slug }
            coverImage { url }
          }
          cursor
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

const CREATE_DRAFT_MUTATION = `
  mutation ($input: CreateDraftInput!) {
    createDraft(input: $input) {
      draft {
        id
        title
        subtitle
        slug
        updatedAt
        tags { id name slug }
      }
    }
  }
`;

const UPDATE_DRAFT_MUTATION = `
  mutation ($input: UpdateDraftInput!) {
    updateDraft(input: $input) {
      draft {
        id
        title
        subtitle
        slug
        updatedAt
        tags { id name slug }
      }
    }
  }
`;

const PUBLISH_DRAFT_MUTATION = `
  mutation ($input: PublishDraftInput!) {
    publishDraft(input: $input) {
      post {
        id
        title
        slug
        url
        publishedAt
        tags { id name slug }
      }
    }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDraft(draft: HashnodeDraft): string {
  const lines = [
    `## ${draft.title ?? "(Untitled)"}`,
    `**Draft ID**: \`${draft.id}\``,
  ];
  if (draft.subtitle) lines.push(`**Subtitle**: ${draft.subtitle}`);
  if (draft.updatedAt)
    lines.push(`**Updated**: ${new Date(draft.updatedAt).toLocaleString()}`);
  if (draft.tags?.length) {
    lines.push(`**Tags**: ${draft.tags.map((t) => t.name).join(", ")}`);
  }
  if (draft.coverImage?.url)
    lines.push(`**Cover**: ${draft.coverImage.url}`);
  return lines.join("\n");
}

function formatPost(post: HashnodePost): string {
  const lines = [
    `## ${post.title}`,
    `**Post ID**: \`${post.id}\``,
    `**URL**: ${post.url}`,
  ];
  if (post.publishedAt)
    lines.push(
      `**Published**: ${new Date(post.publishedAt).toLocaleString()}`
    );
  if (post.tags?.length) {
    lines.push(`**Tags**: ${post.tags.map((t) => t.name).join(", ")}`);
  }
  return lines.join("\n");
}

// ─── Register ─────────────────────────────────────────────────────────────────

export function registerDraftTools(server: McpServer): void {
  // hashnode_list_drafts ─────────────────────────────────────────────────────

  server.registerTool(
    "hashnode_list_drafts",
    {
      title: "List Hashnode drafts",
      description: `List drafts in a Hashnode publication.

Args:
  - publication_id (string): The publication ID (from hashnode_get_me)
  - limit (number): Number of drafts to return (default 20, max 50)
  - after (string): Pagination cursor from a previous call
  - response_format: 'markdown' or 'json'

Returns: list of drafts with id, title, subtitle, tags, updated date`,
      inputSchema: {
        publication_id: z
          .string()
          .min(1)
          .describe("Publication ID (from hashnode_get_me)"),
        limit: z.number().int().min(1).max(50).default(20).describe(
          "Number of drafts to return"
        ),
        after: z
          .string()
          .optional()
          .describe("Pagination cursor from previous response"),
        response_format: ResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ publication_id, limit, after, response_format }) => {
      try {
        const data = await gql<{
          me: {
            drafts: {
              edges: Array<{ node: HashnodeDraft; cursor: string }>;
              pageInfo: { hasNextPage: boolean; endCursor: string };
            };
          };
        }>(LIST_DRAFTS_QUERY, {
          publicationId: publication_id,
          first: limit,
          after: after ?? null,
        });

        const edges = data.me?.drafts?.edges ?? [];
        const pageInfo = data.me?.drafts?.pageInfo;
        const drafts = edges.map((e) => e.node);

        if (response_format === ResponseFormat.JSON) {
          const output = {
            count: drafts.length,
            drafts,
            has_more: pageInfo?.hasNextPage ?? false,
            next_cursor: pageInfo?.endCursor,
          };
          return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
            structuredContent: output,
          };
        }

        if (drafts.length === 0) {
          return {
            content: [{ type: "text", text: "No drafts found." }],
          };
        }

        const lines = [
          `# Drafts (${drafts.length})`,
          "",
          ...drafts.map(formatDraft),
          "",
        ];
        if (pageInfo?.hasNextPage) {
          lines.push(`_More drafts available. Use cursor: \`${pageInfo.endCursor}\`_`);
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

  // hashnode_create_draft ────────────────────────────────────────────────────

  server.registerTool(
    "hashnode_create_draft",
    {
      title: "Create a Hashnode draft",
      description: `Create a new draft in a Hashnode publication. Does NOT publish — use hashnode_publish_draft afterwards.

Args:
  - publication_id (string, required): Publication ID
  - title (string, required): Post title
  - content_markdown (string, required): Post content in Markdown
  - subtitle (string, optional): Short subtitle
  - tags (array, optional): Tags as [{ name, slug }] — slug must be lowercase with hyphens
  - cover_image_url (string, optional): URL of cover image
  - slug (string, optional): Custom URL slug (auto-generated from title if omitted)
  - original_article_url (string, optional): Canonical URL for cross-posted articles
  - meta_title (string, optional): SEO meta title
  - meta_description (string, optional): SEO meta description
  - response_format: 'markdown' or 'json'

Returns: draft id, title, slug, tags, updatedAt`,
      inputSchema: {
        publication_id: z.string().min(1).describe("Publication ID"),
        title: z.string().min(1).max(1000).describe("Post title"),
        content_markdown: z
          .string()
          .min(1)
          .describe("Post content in Markdown"),
        subtitle: z.string().max(300).optional().describe("Short subtitle"),
        tags: z
          .array(TagInputSchema)
          .max(5)
          .optional()
          .describe(
            "Tags as [{ name: 'Cloud Computing', slug: 'cloud-computing' }]"
          ),
        cover_image_url: z
          .string()
          .url()
          .optional()
          .describe("URL of cover image"),
        slug: z
          .string()
          .optional()
          .describe("Custom URL slug (auto-generated if omitted)"),
        original_article_url: z
          .string()
          .url()
          .optional()
          .describe("Canonical URL for cross-posted content"),
        meta_title: z.string().max(250).optional().describe("SEO meta title"),
        meta_description: z
          .string()
          .max(500)
          .optional()
          .describe("SEO meta description"),
        response_format: ResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({
      publication_id,
      title,
      content_markdown,
      subtitle,
      tags,
      cover_image_url,
      slug,
      original_article_url,
      meta_title,
      meta_description,
      response_format,
    }) => {
      try {
        const input: Record<string, unknown> = {
          publicationId: publication_id,
          title,
          contentMarkdown: content_markdown,
        };
        if (subtitle) input.subtitle = subtitle;
        if (tags?.length) input.tags = tags;
        if (cover_image_url)
          input.coverImageOptions = { coverImageURL: cover_image_url };
        if (slug) input.slug = slug;
        if (original_article_url)
          input.originalArticleURL = original_article_url;
        if (meta_title || meta_description) {
          input.metaTags = {
            ...(meta_title ? { title: meta_title } : {}),
            ...(meta_description ? { description: meta_description } : {}),
          };
        }

        const data = await gql<{ createDraft: { draft: HashnodeDraft } }>(
          CREATE_DRAFT_MUTATION,
          { input }
        );
        const draft = data.createDraft.draft;

        if (response_format === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(draft, null, 2) }],
            structuredContent: draft,
          };
        }

        const lines = [
          "# ✅ Draft created",
          "",
          formatDraft(draft),
          "",
          `To publish: call **hashnode_publish_draft** with draftId \`${draft.id}\``,
        ];

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

  // hashnode_update_draft ────────────────────────────────────────────────────

  server.registerTool(
    "hashnode_update_draft",
    {
      title: "Update an existing Hashnode draft",
      description: `Update fields of an existing draft. Only provided fields are changed.

Args:
  - draft_id (string, required): Draft ID to update
  - title (string, optional): New title
  - content_markdown (string, optional): New content in Markdown
  - subtitle (string, optional): New subtitle
  - tags (array, optional): New tags as [{ name, slug }]
  - cover_image_url (string, optional): New cover image URL
  - response_format: 'markdown' or 'json'`,
      inputSchema: {
        draft_id: z.string().min(1).describe("Draft ID to update"),
        title: z.string().min(1).max(1000).optional().describe("New title"),
        content_markdown: z
          .string()
          .optional()
          .describe("New content in Markdown"),
        subtitle: z
          .string()
          .max(300)
          .optional()
          .describe("New subtitle"),
        tags: z
          .array(TagInputSchema)
          .max(5)
          .optional()
          .describe("New tags as [{ name, slug }]"),
        cover_image_url: z
          .string()
          .url()
          .optional()
          .describe("New cover image URL"),
        response_format: ResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({
      draft_id,
      title,
      content_markdown,
      subtitle,
      tags,
      cover_image_url,
      response_format,
    }) => {
      try {
        const input: Record<string, unknown> = { id: draft_id };
        if (title !== undefined) input.title = title;
        if (content_markdown !== undefined)
          input.contentMarkdown = content_markdown;
        if (subtitle !== undefined) input.subtitle = subtitle;
        if (tags !== undefined) input.tags = tags;
        if (cover_image_url !== undefined)
          input.coverImageOptions = { coverImageURL: cover_image_url };

        const data = await gql<{ updateDraft: { draft: HashnodeDraft } }>(
          UPDATE_DRAFT_MUTATION,
          { input }
        );
        const draft = data.updateDraft.draft;

        if (response_format === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(draft, null, 2) }],
            structuredContent: draft,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: ["# ✅ Draft updated", "", formatDraft(draft)].join("\n"),
            },
          ],
        };
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

  // hashnode_publish_draft ───────────────────────────────────────────────────

  server.registerTool(
    "hashnode_publish_draft",
    {
      title: "Publish a Hashnode draft",
      description: `Publish an existing draft, making it a live blog post.

Args:
  - draft_id (string, required): Draft ID to publish (from hashnode_create_draft or hashnode_list_drafts)
  - response_format: 'markdown' or 'json'

Returns: post id, title, slug, url, publishedAt, tags

Examples:
  - Create draft → publish: hashnode_create_draft → hashnode_publish_draft`,
      inputSchema: {
        draft_id: z
          .string()
          .min(1)
          .describe("Draft ID to publish"),
        response_format: ResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ draft_id, response_format }) => {
      try {
        const data = await gql<{ publishDraft: { post: HashnodePost } }>(
          PUBLISH_DRAFT_MUTATION,
          { input: { draftId: draft_id } }
        );
        const post = data.publishDraft.post;

        if (response_format === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(post, null, 2) }],
            structuredContent: post,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: [
                "# 🚀 Post published!",
                "",
                formatPost(post),
              ].join("\n"),
            },
          ],
        };
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
