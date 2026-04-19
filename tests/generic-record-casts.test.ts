import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DEFAULT_CONFIG } from "../src/config";
import { analyzeRepository } from "../src/core/engine";
import { Registry } from "../src/core/registry";
import { createDefaultRegistry } from "../src/default-registry";
import { genericRecordCastsRule } from "../src/rules/generic-record-casts";

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
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "slop-scan-generic-record-casts-"));
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

  registry.registerRule(genericRecordCastsRule);
  return registry;
}

describe("generic-record-casts rule", () => {
  test("flags generic Record<string, unknown> casts on vague bag variables", async () => {
    const rootDir = await createTempRepo({
      "src/slop.ts": [
        "export function parseData(raw: string, response: unknown, value: unknown) {",
        "  const parsed = JSON.parse(raw) as Record<string, unknown>;",
        "  const payload = response as Record<string, unknown>;",
        "  const data = value as Record<string, unknown>;",
        "  return { parsed, payload, data };",
        "}",
      ].join("\n"),
      "src/legit.ts": [
        "type UserConfig = { token: string };",
        "",
        "export function parseConfig(raw: string) {",
        "  return JSON.parse(raw) as UserConfig;",
        "}",
      ].join("\n"),
    });

    const result = await analyzeRepository(rootDir, DEFAULT_CONFIG, createCandidateRegistry());
    const finding = result.findings.find(
      (nextFinding) => nextFinding.ruleId === "types.generic-record-casts",
    );

    expect(finding).toBeDefined();
    expect(finding?.path).toBe("src/slop.ts");
    expect(finding?.evidence).toEqual([
      "line 2: json-parse-record-cast",
      "line 3: record-string-unknown-cast",
      "line 4: record-string-unknown-cast",
    ]);
    expect(finding?.locations).toEqual([
      { path: "src/slop.ts", line: 2 },
      { path: "src/slop.ts", line: 3 },
      { path: "src/slop.ts", line: 4 },
    ]);
    expect(result.findings).toHaveLength(1);
  });

  test("ignores giant bundled files that would otherwise create vendor noise", async () => {
    const hugeFile = [
      ...Array.from({ length: 5001 }, (_, index) => `export const filler${index} = ${index};`),
      "const parsed = JSON.parse(raw) as Record<string, unknown>;",
      "",
    ].join("\n");

    const rootDir = await createTempRepo({
      "src/bundle.ts": hugeFile,
    });

    const result = await analyzeRepository(rootDir, DEFAULT_CONFIG, createCandidateRegistry());

    expect(result.findings).toHaveLength(0);
  });
});
