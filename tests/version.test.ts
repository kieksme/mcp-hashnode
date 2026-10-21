import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadPackageVersion } from "../src/version.js";

describe("loadPackageVersion", () => {
  it("matches package.json", () => {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8")
    ) as { version: string };
    expect(loadPackageVersion()).toBe(pkg.version);
  });
});
