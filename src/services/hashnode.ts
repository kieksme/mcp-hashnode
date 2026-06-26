import axios, { AxiosError } from "axios";
import { HASHNODE_GQL_ENDPOINT } from "../constants.js";

let apiToken: string | undefined;

export function setApiToken(token: string): void {
  apiToken = token;
}

/**
 * Execute a GraphQL query or mutation against the Hashnode API.
 * Auth header format: `Authorization: <token>` (NOT Bearer).
 */
export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  if (!apiToken) {
    throw new Error(
      "HASHNODE_TOKEN environment variable is not set. " +
        "Get your Personal Access Token at https://hashnode.com/settings/developer"
    );
  }

  try {
    const response = await axios.post(
      HASHNODE_GQL_ENDPOINT,
      { query, variables },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: apiToken,
        },
        timeout: 30_000,
      }
    );

    if (response.data.errors?.length) {
      const msgs = response.data.errors
        .map((e: { message: string }) => e.message)
        .join("; ");
      throw new Error(`GraphQL error: ${msgs}`);
    }

    return response.data.data as T;
  } catch (error) {
    throw normalizeError(error);
  }
}

/** Convert axios / GraphQL errors into actionable messages. */
export function normalizeError(error: unknown): Error {
  if (error instanceof AxiosError) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          return new Error(
            "Error: Invalid or missing Hashnode token. " +
              "Generate one at https://hashnode.com/settings/developer"
          );
        case 403:
          return new Error(
            "Error: Permission denied. Make sure your token has write access."
          );
        case 429:
          return new Error(
            "Error: Rate limit exceeded (500 mutations/min). Please wait and retry."
          );
        default:
          return new Error(
            `Error: Hashnode API returned HTTP ${error.response.status}`
          );
      }
    }
    if (error.code === "ECONNABORTED") {
      return new Error("Error: Request timed out. Please try again.");
    }
  }
  if (error instanceof Error) return error;
  return new Error(`Error: ${String(error)}`);
}
