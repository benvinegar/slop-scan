import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DEFAULT_CONFIG } from "../src/config";
import { analyzeRepository } from "../src/core/engine";
import { Registry } from "../src/core/registry";
import { createDefaultRegistry } from "../src/default-registry";
import { stringifiedUnknownErrorsRule } from "../src/rules/stringified-unknown-errors";

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
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "slop-scan-stringified-errors-"));
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

  registry.registerRule(stringifiedUnknownErrorsRule);
  return registry;
}

describe("stringified-unknown-errors rule", () => {
  test("flags unknown errors collapsed into generic strings", async () => {
    const rootDir = await createTempRepo({
      "src/slop.ts": [
        "export function getMessage(error: unknown) {",
        "  return error instanceof Error ? error.message : String(error);",
        "}",
        "",
        "export function toResult(err: unknown) {",
        "  return { ok: false, error: err instanceof Error ? err.message : String(err) };",
        "}",
        "",
        "export function updateState(error: unknown) {",
        "  const next = error instanceof Error ? error.message : String(error);",
        "  return { message: next };",
        "}",
      ].join("\n"),
      "src/legit.ts": [
        "export function rethrow(error: unknown) {",
        "  throw error;",
        "}",
        "",
        "export function preserve(error: unknown) {",
        "  return { error };",
        "}",
      ].join("\n"),
    });

    const result = await analyzeRepository(rootDir, DEFAULT_CONFIG, createCandidateRegistry());
    const finding = result.findings.find(
      (nextFinding) => nextFinding.ruleId === "defensive.stringified-unknown-errors",
    );

    expect(finding).toBeDefined();
    expect(finding?.path).toBe("src/slop.ts");
    expect(finding?.evidence).toEqual([
      "line 2: returned-stringified-unknown-error",
      "line 6: property-stringified-unknown-error",
      "line 10: stringified-unknown-error",
    ]);
    expect(result.findings).toHaveLength(1);
  });

  test("ignores giant bundled files that would otherwise create vendor noise", async () => {
    const hugeFile = [
      ...Array.from({ length: 5001 }, (_, index) => `export const filler${index} = ${index};`),
      "export const message = error instanceof Error ? error.message : String(error);",
      "",
    ].join("\n");

    const rootDir = await createTempRepo({
      "src/bundle.ts": hugeFile,
    });

    const result = await analyzeRepository(rootDir, DEFAULT_CONFIG, createCandidateRegistry());

    expect(result.findings).toHaveLength(0);
  });
});
