import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, test } from "bun:test";
import { DEFAULT_CONFIG, loadConfigFile } from "../src/config";
import { analyzeRepository } from "../src/core/engine";
import { parseCliArgs, run } from "../src/cli";
import { createDefaultRegistry } from "../src/default-registry";
import { jsonReporter } from "../src/reporters/json";
import { buildReportMetadata } from "../src/report-metadata";

const CLEAN_FIXTURE = path.join(process.cwd(), "tests", "fixtures", "repos", "clean");
const SLOP_FIXTURE = path.join(process.cwd(), "tests", "fixtures", "repos", "slop-heavy");
const SAVED_DELTA_FIXTURE = path.join(process.cwd(), "tests", "fixtures", "reports", "saved-delta");

describe("delta CLI", () => {
  test("parseCliArgs extracts delta flags and defaults head to the current directory", () => {
    const args = parseCliArgs(["delta", "../base", "--json", "--fail-on", "added,worsened"]);

    expect(args.command).toBe("delta");
    expect(args.base).toBe("../base");
    expect(args.head).toBe(".");
    expect(args.json).toBe(true);
    expect(args.failOn).toBe("added,worsened");
  });

  test("help text documents delta usage", async () => {
    const { formatHelp } = await import("../src/cli");
    const help = formatHelp();

    expect(help).toContain("slop-scan delta");
    expect(help).toContain("--base-report");
    expect(help).toContain("--fail-on");
  });

  test("delta command exits successfully for path-to-path comparisons", async () => {
    const exitCode = await run(["delta", CLEAN_FIXTURE, SLOP_FIXTURE]);
    expect(exitCode).toBe(0);
  });

  test("delta command can fail on added findings", async () => {
    const exitCode = await run(["delta", CLEAN_FIXTURE, SLOP_FIXTURE, "--fail-on", "added"]);
    expect(exitCode).toBe(1);
  });

  test("delta command reads JSON reports", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "slop-scan-delta-"));

    try {
      const registry = createDefaultRegistry();
      const [baseLoadedConfig, headLoadedConfig] = await Promise.all([
        loadConfigFile(CLEAN_FIXTURE),
        loadConfigFile(SLOP_FIXTURE),
      ]);
      const baseResult = await analyzeRepository(CLEAN_FIXTURE, DEFAULT_CONFIG, registry);
      baseResult.metadata = buildReportMetadata(baseLoadedConfig.config, baseLoadedConfig.plugins);
      const headResult = await analyzeRepository(SLOP_FIXTURE, DEFAULT_CONFIG, registry);
      headResult.metadata = buildReportMetadata(headLoadedConfig.config, headLoadedConfig.plugins);

      const basePath = path.join(tempDir, "base.json");
      const headPath = path.join(tempDir, "head.json");
      const baseJson = jsonReporter.render(baseResult);
      const headJson = jsonReporter.render(headResult);
      expect(JSON.parse(baseJson).metadata).toMatchObject({
        schemaVersion: 2,
        findingFingerprintVersion: 2,
      });
      expect(JSON.parse(headJson).metadata).toMatchObject({
        schemaVersion: 2,
        findingFingerprintVersion: 2,
      });
      await Promise.all([
        writeFile(basePath, baseJson, "utf8"),
        writeFile(headPath, headJson, "utf8"),
      ]);

      const exitCode = await run([
        "delta",
        "--base-report",
        basePath,
        "--head-report",
        headPath,
        "--json",
      ]);
      expect(exitCode).toBe(0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("delta command matches the saved-report JSON snapshot", async () => {
    const basePath = path.join(SAVED_DELTA_FIXTURE, "base.json");
    const headPath = path.join(SAVED_DELTA_FIXTURE, "head.json");
    const expectedPath = path.join(SAVED_DELTA_FIXTURE, "expected-delta.json");
    const expectedJson = JSON.parse(await readFile(expectedPath, "utf8"));

    const output = spawnSync(
      "bun",
      [
        "run",
        "src/cli.ts",
        "delta",
        "--base-report",
        basePath,
        "--head-report",
        headPath,
        "--json",
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output.status).toBe(0);
    expect(JSON.parse(output.stdout)).toEqual(expectedJson);
  });
});
