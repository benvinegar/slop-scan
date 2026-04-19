import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DEFAULT_CONFIG } from "../src/config";
import { analyzeRepository } from "../src/core/engine";
import { Registry } from "../src/core/registry";
import { createDefaultRegistry } from "../src/default-registry";
import { promiseDefaultFallbacksRule } from "../src/rules/promise-default-fallbacks";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function writeRepoFiles(rootDir: string, files: Record<string, string>): Promise<void> {
  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(rootDir, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content);
  }
}

async function createTempRepo(files: Record<string, string>): Promise<string> {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "slop-scan-promise-defaults-"));
  tempDirs.push(rootDir);
  await writeRepoFiles(rootDir, files);
  return rootDir;
}

function createCandidateRegistry(): Registry {
  const baseRegistry = createDefaultRegistry();
  const registry = new Registry();

  for (const language of baseRegistry.getLanguages()) {
    registry.registerLanguage(language);
  }

  for (const provider of baseRegistry.getFactProviders()) {
    registry.registerFactProvider(provider);
  }

  registry.registerRule(promiseDefaultFallbacksRule);
  return registry;
}

describe("promise-default-fallbacks rule", () => {
  test("flags promise catch handlers that return default literals", async () => {
    const rootDir = await createTempRepo({
      "src/slop.ts": [
        "export async function loadConfig() {",
        "  return readConfig().catch(() => null);",
        "}",
        "",
        "export async function copyFromClipboard() {",
        "  return navigator.clipboard.readText().catch(() => {});",
        "}",
        "",
        "export async function loadFeatureFlag() {",
        "  return fetchFlag().catch((error) => {",
        '    console.error("flag load failed", error);',
        "    return false;",
        "  });",
        "}",
        "",
      ].join("\n"),
      "src/legit.ts": [
        "export async function loadRequiredConfig() {",
        "  return readConfig().catch((error) => {",
        "    throw error;",
        "  });",
        "}",
        "",
        "export async function loadShape() {",
        "  return readConfig().catch(() => ({ ok: false, reason: 'missing' }));",
        "}",
        "",
      ].join("\n"),
    });

    const result = await analyzeRepository(rootDir, DEFAULT_CONFIG, createCandidateRegistry());
    const finding = result.findings.find(
      (nextFinding) => nextFinding.ruleId === "defensive.promise-default-fallbacks",
    );

    expect(finding).toBeDefined();
    expect(finding?.path).toBe("src/slop.ts");
    expect(finding?.evidence).toEqual([
      "line 2: default-return",
      "line 6: empty-handler",
      "line 10: log+default",
    ]);
    expect(finding?.locations).toEqual([
      { path: "src/slop.ts", line: 2 },
      { path: "src/slop.ts", line: 6 },
      { path: "src/slop.ts", line: 10 },
    ]);
    expect(result.findings).toHaveLength(1);
  });
});
