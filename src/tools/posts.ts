import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { gql } from "../services/hashnode.js";
import { CHARACTER_LIMIT } from "../constants.js";
import type { HashnodePost } from "../types.js";

enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}

const ResponseFormatSchema = z
  .nativeEnum(ResponseFormat)
  .default(ResponseFormat.MARKDOWN)
  .describe("Output format: 'markdown' (default) or 'json'");

const TagInputSchema = z.object({
  name: z.string().describe("Tag display name, e.g. 'Cloud Computing'"),
  slug: z
    .string()
    .describe("Tag slug (lowercase, hyphens), e.g. 'cloud-computing'"),
});

// ─── Queries & Mutations ──────────────────────────────────────────────────────

const LIST_POSTS_QUERY = `
  query ($host: String!, $first: Int!, $after: String) {
    publication(host: $host) {
      posts(first: $first, after: $after) {
        edges {
          node {
            id
            title
            subtitle
            slug
            url
            publishedAt
            readTimeInMinutes
            views
            tags { id name slug }
            coverImage { url }
          }
          cursor
        }
        pageInfo { hasNextPage endCursor }
        totalDocuments
      }
    }
  }
`;

const GET_POST_QUERY = `
  query ($host: String!, $slug: String!) {
    publication(host: $host) {
      post(slug: $slug) {
        id
        title
        subtitle
        slug
        url
        brief
        publishedAt
        updatedAt
        readTimeInMinutes
        views
        tags { id name slug }
        coverImage { url }
        author { name username }
      }
    }
  }
`;

const PUBLISH_POST_MUTATION = `
  mutation ($input: PublishPostInput!) {
    publishPost(input: $input) {
      post {
        id
        title
        subtitle
        slug
        url
        publishedAt
        tags { id name slug }
        coverImage { url }
      }
    }
  }
`;

const UPDATE_POST_MUTATION = `
  mutation ($input: UpdatePostInput!) {
    updatePost(input: $input) {
      post {
        id
        title
        subtitle
        slug
        url
        updatedAt
        tags { id name slug }
      }
    }
  }
`;

const REMOVE_POST_MUTATION = `
  mutation ($input: RemovePostInput!) {
    removePost(input: $input) {
      post {
        id
        title
        slug
      }
    }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPost(post: HashnodePost, verbose = false): string {
  const lines = [
    `## ${post.title}`,
    `**ID**: \`${post.id}\``,
    `**URL**: ${post.url}`,
    `**Slug**: ${post.slug}`,
  ];
  if (post.subtitle) lines.push(`**Subtitle**: ${post.subtitle}`);
  if (post.publishedAt)
    lines.push(
      `**Published**: ${new Date(post.publishedAt).toLocaleString()}`
    );
  if (post.readTimeInMinutes !== undefined)
    lines.push(`**Read time**: ${post.readTimeInMinutes} min`);
  if (post.views !== undefined)
    lines.push(`**Views**: ${post.views.toLocaleString()}`);
  if (post.tags?.length)
    lines.push(`**Tags**: ${post.tags.map((t) => t.name).join(", ")}`);
  if (post.coverImage?.url)
    lines.push(`**Cover**: ${post.coverImage.url}`);
  if (verbose && post.brief) {
    lines.push("", "**Brief**:", post.brief);
  }
  return lines.join("\n");
}

// ─── Register ─────────────────────────────────────────────────────────────────

export function registerPostTools(server: McpServer): void {
  // hashnode_list_posts ──────────────────────────────────────────────────────

  server.registerTool(
    "hashnode_list_posts",
    {
      title: "List published posts in a Hashnode publication",
      description: `List published blog posts in a publication, ordered by publish date (newest first).

Args:
  - host (string, required): Publication host, e.g. "yourblog.hashnode.dev"
  - limit (number): Posts per page (default 20, max 50)
  - after (string): Cursor for pagination
  - response_format: 'markdown' or 'json'

Returns: posts with id, title, slug, url, publishedAt, views, readTime, tags`,
      inputSchema: {
        host: z
          .string()
          .min(1)
          .describe("Publication host, e.g. 'yourblog.hashnode.dev'"),
        limit: z.number().int().min(1).max(50).default(20).describe(
          "Posts per page"
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
    async ({ host, limit, after, response_format }) => {
      try {
        const data = await gql<{
          publication: {
            posts: {
              edges: Array<{ node: HashnodePost; cursor: string }>;
              pageInfo: { hasNextPage: boolean; endCursor: string };
              totalDocuments: number;
            };
          };
        }>(LIST_POSTS_QUERY, { host, first: limit, after: after ?? null });

        const posts = data.publication?.posts;
        if (!posts) {
          return {
            content: [
              {
                type: "text",
                text: `Error: No publication found for host '${host}'.`,
              },
            ],
          };
        }

        const items = posts.edges.map((e) => e.node);

        if (response_format === ResponseFormat.JSON) {
          const output = {
            total: posts.totalDocuments,
            count: items.length,
            posts: items,
            has_more: posts.pageInfo.hasNextPage,
            next_cursor: posts.pageInfo.endCursor,
          };

          let text = JSON.stringify(output, null, 2);
          if (text.length > CHARACTER_LIMIT) {
            const trimmed = { ...output, posts: items.slice(0, 5), truncated: true };
            text = JSON.stringify(trimmed, null, 2);
          }

          return {
            content: [{ type: "text", text }],
            structuredContent: output,
          };
        }

        if (items.length === 0) {
          return { content: [{ type: "text", text: "No published posts found." }] };
        }

        const lines = [
          `# Posts in ${host} (${posts.totalDocuments} total)`,
          "",
          ...items.map((p) => formatPost(p)),
          "",
        ];
        if (posts.pageInfo.hasNextPage) {
          lines.push(
            `_More posts available. Use cursor: \`${posts.pageInfo.endCursor}\`_`
          );
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

  // hashnode_get_post ────────────────────────────────────────────────────────

  server.registerTool(
    "hashnode_get_post",
    {
      title: "Get a single Hashnode post by slug",
      description: `Fetch full details of a published post by its slug.

Args:
  - host (string, required): Publication host
  - slug (string, required): Post slug from the URL, e.g. "my-first-post"
  - response_format: 'markdown' or 'json'

Returns: full post data including content brief, views, tags, cover image, author`,
      inputSchema: {
        host: z.string().min(1).describe("Publication host"),
        slug: z.string().min(1).describe("Post slug from URL"),
        response_format: ResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ host, slug, response_format }) => {
      try {
        const data = await gql<{
          publication: { post: HashnodePost | null };
        }>(GET_POST_QUERY, { host, slug });

        const post = data.publication?.post;
        if (!post) {
          return {
            content: [
              {
                type: "text",
                text: `Error: No post found with slug '${slug}' in '${host}'.`,
              },
            ],
          };
        }

        if (response_format === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(post, null, 2) }],
            structuredContent: post,
          };
        }

        return {
          content: [
            { type: "text", text: formatPost(post, true) },
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

  // hashnode_publish_post ────────────────────────────────────────────────────

  server.registerTool(
    "hashnode_publish_post",
    {
      title: "Publish a post directly to Hashnode (no draft step)",
      description: `Publish a new blog post directly without creating a draft first.
Prefer hashnode_create_draft + hashnode_publish_draft for a safer workflow.

Args:
  - publication_id (string, required): Publication ID (from hashnode_get_me)
  - title (string, required): Post title
  - content_markdown (string, required): Post content in Markdown
  - subtitle (string, optional): Short subtitle
  - tags (array, optional): [{ name, slug }] — max 5 tags
  - cover_image_url (string, optional): URL of cover image
  - slug (string, optional): Custom URL slug
  - original_article_url (string, optional): Canonical URL for cross-posts
  - meta_title (string, optional): SEO title
  - meta_description (string, optional): SEO description
  - scheduled_at (string, optional): ISO 8601 datetime for scheduled publishing
  - response_format: 'markdown' or 'json'

Returns: post id, title, slug, url, publishedAt, tags`,
      inputSchema: {
        publication_id: z.string().min(1).describe("Publication ID"),
        title: z.string().min(1).max(1000).describe("Post title"),
        content_markdown: z
          .string()
          .min(1)
          .describe("Post content in Markdown"),
        subtitle: z
          .string()
          .max(300)
          .optional()
          .describe("Short subtitle"),
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
        slug: z.string().optional().describe("Custom URL slug"),
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
        scheduled_at: z
          .string()
          .optional()
          .describe(
            "ISO 8601 datetime for scheduled publishing, e.g. '2025-12-31T10:00:00Z'"
          ),
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
      scheduled_at,
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
        if (scheduled_at) input.publishedAt = scheduled_at;

        const data = await gql<{ publishPost: { post: HashnodePost } }>(
          PUBLISH_POST_MUTATION,
          { input }
        );
        const post = data.publishPost.post;

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
              text: ["# 🚀 Post published!", "", formatPost(post)].join("\n"),
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

  // hashnode_update_post ─────────────────────────────────────────────────────

  server.registerTool(
    "hashnode_update_post",
    {
      title: "Update a published Hashnode post",
      description: `Update fields of an already-published post. Only provided fields are changed.

Args:
  - post_id (string, required): Post ID (from hashnode_list_posts or hashnode_get_post)
  - title (string, optional): New title
  - content_markdown (string, optional): New content in Markdown
  - subtitle (string, optional): New subtitle
  - tags (array, optional): New tags [{ name, slug }]
  - cover_image_url (string, optional): New cover image URL
  - response_format: 'markdown' or 'json'`,
      inputSchema: {
        post_id: z.string().min(1).describe("Post ID to update"),
        title: z.string().min(1).max(1000).optional().describe("New title"),
        content_markdown: z
          .string()
          .optional()
          .describe("New content in Markdown"),
        subtitle: z.string().max(300).optional().describe("New subtitle"),
        tags: z
          .array(TagInputSchema)
          .max(5)
          .optional()
          .describe("New tags [{ name, slug }]"),
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
      post_id,
      title,
      content_markdown,
      subtitle,
      tags,
      cover_image_url,
      response_format,
    }) => {
      try {
        const input: Record<string, unknown> = { id: post_id };
        if (title !== undefined) input.title = title;
        if (content_markdown !== undefined)
          input.contentMarkdown = content_markdown;
        if (subtitle !== undefined) input.subtitle = subtitle;
        if (tags !== undefined) input.tags = tags;
        if (cover_image_url !== undefined)
          input.coverImageOptions = { coverImageURL: cover_image_url };

        const data = await gql<{ updatePost: { post: HashnodePost } }>(
          UPDATE_POST_MUTATION,
          { input }
        );
        const post = data.updatePost.post;

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
              text: ["# ✅ Post updated", "", formatPost(post)].join("\n"),
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

  // hashnode_delete_post ─────────────────────────────────────────────────────

  server.registerTool(
    "hashnode_delete_post",
    {
      title: "Delete a published Hashnode post",
      description: `Permanently delete a published post. This action cannot be undone.

Args:
  - post_id (string, required): Post ID to delete
  - response_format: 'markdown' or 'json'

⚠️ WARNING: This permanently deletes the post.`,
      inputSchema: {
        post_id: z
          .string()
          .min(1)
          .describe("Post ID to permanently delete"),
        response_format: ResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ post_id, response_format }) => {
      try {
        const data = await gql<{
          removePost: { post: Pick<HashnodePost, "id" | "title" | "slug"> };
        }>(REMOVE_POST_MUTATION, { input: { id: post_id } });

        const post = data.removePost.post;

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
              text: `# 🗑️ Post deleted\n\n**"${post.title}"** (ID: \`${post.id}\`) has been permanently deleted.`,
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
