// Index signature required by MCP SDK's structuredContent type
export interface HashnodeTag {
  [key: string]: unknown;
  name: string;
  slug: string;
  id?: string;
}

// ─── Post ─────────────────────────────────────────────────────────────────────

export interface HashnodePost {
  [key: string]: unknown;
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  url: string;
  brief?: string;
  publishedAt?: string;
  updatedAt?: string;
  readTimeInMinutes?: number;
  views?: number;
  tags?: HashnodeTag[];
  coverImage?: { url: string; [key: string]: unknown };
  author?: { name: string; username: string; [key: string]: unknown };
  publication?: { id: string; title: string; url: string; [key: string]: unknown };
}

// ─── Draft ────────────────────────────────────────────────────────────────────

export interface HashnodeDraft {
  [key: string]: unknown;
  id: string;
  title?: string;
  subtitle?: string;
  slug?: string;
  contentMarkdown?: string;
  tags?: HashnodeTag[];
  coverImage?: { url: string; [key: string]: unknown };
  updatedAt?: string;
  author?: { name: string; username: string; [key: string]: unknown };
}

// ─── Publication ──────────────────────────────────────────────────────────────

export interface HashnodePublication {
  [key: string]: unknown;
  id: string;
  title: string;
  displayTitle?: string;
  url: string;
  about?: { html?: string; text?: string; [key: string]: unknown };
  author?: { name: string; username: string; [key: string]: unknown };
  favicon?: string;
}

// ─── Me ───────────────────────────────────────────────────────────────────────

export interface HashnodeMe {
  [key: string]: unknown;
  id: string;
  name: string;
  username: string;
  profilePicture?: string;
  publications?: {
    edges: Array<{ node: HashnodePublication; [key: string]: unknown }>;
    [key: string]: unknown;
  };
}
