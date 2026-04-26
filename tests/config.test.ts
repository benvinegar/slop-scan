import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { analyzeRepository } from "../src/core/engine";
import type { AnalyzerConfig } from "../src/config";
import { DEFAULT_CONFIG, loadConfig } from "../src/config";
import { createDefaultRegistry } from "../src/default-registry";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempRepo(): Promise<string> {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "slop-scan-config-"));
  tempDirs.push(rootDir);
  await mkdir(path.join(rootDir, "src"), { recursive: true });
  await writeFile(
    path.join(rootDir, "src", "comments.ts"),
    "function loadValue(input: string) {\n  return Promise.resolve(input);\n}\n\nexport async function fetchData(id: string) {\n  return await loadValue(id);\n}\n",
  );
  return rootDir;
}

function withRuleConfig(
  ruleId: string,
  config: { enabled?: boolean; weight?: number },
): AnalyzerConfig {
  return {
    ...DEFAULT_CONFIG,
    rules: {
      ...DEFAULT_CONFIG.rules,
      [ruleId]: config,
    },
  };
}

function withPathOverride(
  files: string[],
  rules: Record<string, { enabled?: boolean; weight?: number }>,
): AnalyzerConfig {
  return {
    ...DEFAULT_CONFIG,
    overrides: [{ files, rules }],
  };
}

describe("rule config support", () => {
  test("can disable a rule via config", async () => {
    const rootDir = await createTempRepo();
    const result = await analyzeRepository(
      rootDir,
      withRuleConfig("defensive.async-noise", { enabled: false }),
      createDefaultRegistry(),
    );

    expect(
      result.findings.filter((finding) => finding.ruleId === "defensive.async-noise"),
    ).toHaveLength(0);
  });

  test("can weight a rule via config", async () => {
    const rootDir = await createTempRepo();
    const baseline = await analyzeRepository(rootDir, DEFAULT_CONFIG, createDefaultRegistry());
    const weighted = await analyzeRepository(
      rootDir,
      withRuleConfig("defensive.async-noise", { weight: 2 }),
      createDefaultRegistry(),
    );

    const baselineAsyncNoise = baseline.findings.find(
      (finding) => finding.ruleId === "defensive.async-noise",
    );
    const weightedAsyncNoise = weighted.findings.find(
      (finding) => finding.ruleId === "defensive.async-noise",
    );

    expect(baselineAsyncNoise).toBeDefined();
    expect(weightedAsyncNoise).toBeDefined();
    expect(weightedAsyncNoise?.score).toBeCloseTo((baselineAsyncNoise?.score ?? 0) * 2, 6);
  });

  test("loadConfig reads slop-scan.config.json", async () => {
    const rootDir = await createTempRepo();
    await writeFile(
      path.join(rootDir, "slop-scan.config.json"),
      JSON.stringify({ ignores: ["src/comments.ts"] }),
    );

    const config = await loadConfig(rootDir);

    expect(config.ignores).toEqual(["src/comments.ts"]);
  });

  test("loadConfig invalidates cached module configs when the file changes", async () => {
    const rootDir = await createTempRepo();
    const configPath = path.join(rootDir, "slop-scan.config.ts");
    await writeFile(configPath, 'export default { ignores: ["src/comments.ts"] };\n');

    const first = await loadConfig(rootDir);
    expect(first.ignores).toEqual(["src/comments.ts"]);

    await Bun.sleep(5);
    await writeFile(configPath, 'export default { ignores: ["src/nested.ts"] };\n');

    const second = await loadConfig(rootDir);
    expect(second.ignores).toEqual(["src/nested.ts"]);
  });

  test("can apply a path-scoped file override", async () => {
    const rootDir = await createTempRepo();
    await writeFile(
      path.join(rootDir, "src", "nested.ts"),
      "function fetchRemote(input: string) {\n  return Promise.resolve(input);\n}\n\nexport async function loadValue(id: string) {\n  return await fetchRemote(id);\n}\n",
    );

    const result = await analyzeRepository(
      rootDir,
      withPathOverride(["src/comments.ts"], {
        "defensive.async-noise": { enabled: false },
      }),
      createDefaultRegistry(),
    );

    const asyncNoiseFindings = result.findings.filter(
      (finding) => finding.ruleId === "defensive.async-noise",
    );

    expect(asyncNoiseFindings).toHaveLength(1);
    expect(asyncNoiseFindings[0]?.path).toBe("src/nested.ts");
  });

  test("can apply a path-scoped directory override", async () => {
    const rootDir = await createTempRepo();

    await mkdir(path.join(rootDir, "src/rules/defensive"), { recursive: true });
    await writeFile(
      path.join(rootDir, "src/rules/defensive/service.ts"),
      "function fetchRule(input: string) {\n  return Promise.resolve(input);\n}\n\nexport async function loadRule(id: string) {\n  return await fetchRule(id);\n}\n",
    );

    await mkdir(path.join(rootDir, "src/other/defensive"), { recursive: true });
    await writeFile(
      path.join(rootDir, "src/other/defensive/service.ts"),
      "function fetchOther(input: string) {\n  return Promise.resolve(input);\n}\n\nexport async function loadOther(id: string) {\n  return await fetchOther(id);\n}\n",
    );

    const result = await analyzeRepository(
      rootDir,
      withPathOverride(["src/rules/**"], {
        "defensive.async-noise": { enabled: false },
      }),
      createDefaultRegistry(),
    );

    const asyncNoiseFindings = result.findings.filter(
      (finding) => finding.ruleId === "defensive.async-noise",
    );

    expect(asyncNoiseFindings.map((finding) => finding.path).sort()).toEqual([
      "src/comments.ts",
      "src/other/defensive/service.ts",
    ]);
  });

  test("loadConfig reads path-scoped overrides", async () => {
    const rootDir = await createTempRepo();
    await writeFile(
      path.join(rootDir, "slop-scan.config.json"),
      JSON.stringify({
        overrides: [
          {
            files: ["src/comments.ts"],
            rules: {
              "defensive.async-noise": { enabled: false },
            },
          },
        ],
      }),
    );

    const config = await loadConfig(rootDir);

    expect(config.overrides).toEqual([
      {
        files: ["src/comments.ts"],
        rules: {
          "defensive.async-noise": { enabled: false },
        },
      },
    ]);
  });

  test("loadConfig falls back to repo-slop.config.json", async () => {
    const rootDir = await createTempRepo();
    await writeFile(
      path.join(rootDir, "repo-slop.config.json"),
      JSON.stringify({ ignores: ["src/comments.ts"] }),
    );

    const config = await loadConfig(rootDir);

    expect(config.ignores).toEqual(["src/comments.ts"]);
  });
});
