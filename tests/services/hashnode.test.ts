import { afterEach, describe, expect, it, vi } from "vitest";
import axios, { AxiosError } from "axios";
import { HashnodeClient, normalizeError } from "../../src/services/hashnode.js";

describe("HashnodeClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects empty tokens", () => {
    expect(() => new HashnodeClient("")).toThrow(/empty/i);
  });

  it("sends Authorization without Bearer prefix", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValue({
      data: { data: { me: { id: "1" } } },
    } as never);

    const client = new HashnodeClient("my-pat");
    const result = await client.gql<{ me: { id: string } }>("query { me { id } }");
    expect(result.me.id).toBe("1");
    expect(post).toHaveBeenCalledWith(
      "https://gql.hashnode.com",
      { query: "query { me { id } }", variables: undefined },
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "my-pat" }),
      })
    );
  });

  it("surfaces GraphQL errors", async () => {
    vi.spyOn(axios, "post").mockResolvedValue({
      data: { errors: [{ message: "boom" }] },
    } as never);
    const client = new HashnodeClient("my-pat");
    await expect(client.gql("query { me { id } }")).rejects.toThrow(/boom/);
  });
});

describe("normalizeError", () => {
  it("maps 401 to actionable message", () => {
    const err = new AxiosError("unauthorized");
    err.response = {
      status: 401,
      data: {},
      statusText: "Unauthorized",
      headers: {},
      config: {} as never,
    };
    expect(normalizeError(err).message).toMatch(/Invalid or missing Hashnode token/);
  });
});
