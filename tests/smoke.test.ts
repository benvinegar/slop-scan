import { describe, expect, test } from "bun:test";
import { DEFAULT_CONFIG, loadConfig } from "../src/config";
import { formatHelp, run } from "../src/cli";

describe("project scaffold", () => {
  test("help text mentions scan command", () => {
    expect(formatHelp()).toContain("scan");
    expect(formatHelp()).toContain("repo-slop-analyzer");
  });

  test("loadConfig returns defaults when config file is absent", async () => {
    const config = await loadConfig(process.cwd());
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  test("scan command exits successfully in scaffold mode", async () => {
    const exitCode = await run(["scan", ".", "--json"]);
    expect(exitCode).toBe(0);
  });
});
