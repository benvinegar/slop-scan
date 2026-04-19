/**
 * End-to-end entrypoint for the per-rule signal benchmark.
 *
 * The job:
 * 1. ensures the pinned mini cohort exists locally,
 * 2. runs each built-in rule in isolation against that cohort,
 * 3. writes JSON + markdown artifacts, and
 * 4. refreshes the short benchmark snippet inside every built-in rule README.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import packageJson from "../package.json";
import { getOption } from "./lib/get-option";
import { ensurePinnedCheckouts, readHeadRef } from "../src/benchmarks/checkouts";
import {
  createRuleBenchmarkRegistry,
  createRuleSignalBenchmarkSummary,
  ruleIdToSlug,
  type RuleSignalBenchmarkRun,
  type RuleSignalBenchmarkSummary,
} from "../src/benchmarks/rule-signal";
import {
  renderRuleSignalReadmeSection,
  upsertRuleSignalReadmeSection,
} from "../src/benchmarks/rule-signal-readme";
import { renderRuleSignalBenchmarkReport } from "../src/benchmarks/rule-signal-report";
import { loadBenchmarkSet, resolveProjectPath } from "../src/benchmarks/manifest";
import type { BenchmarkSet } from "../src/benchmarks/types";
import { DEFAULT_CONFIG } from "../src/config";
import { analyzeRepository } from "../src/core/engine";
import type { RulePlugin } from "../src/core/types";
import { createDefaultRegistry } from "../src/default-registry";

const DEFAULT_RULE_SIGNAL_SET_PATH = path.resolve(
  process.cwd(),
  "benchmarks/sets/rule-signal-mini.json",
);

/**
 * Runs one rule in isolation across the full pinned mini cohort.
 */
async function analyzeRuleAcrossSet(
  rule: RulePlugin,
  checkoutsDir: string,
  benchmarkSet: BenchmarkSet,
  baseRegistry: ReturnType<typeof createDefaultRegistry>,
): Promise<RuleSignalBenchmarkRun> {
  console.log(`\n## ${rule.id}`);

  const registry = createRuleBenchmarkRegistry(baseRegistry, rule.id);
  const analyses = [];

  for (const repo of benchmarkSet.repos) {
    const checkoutPath = path.join(checkoutsDir, repo.id);
    const actualRef = readHeadRef(checkoutPath);
    if (actualRef !== repo.ref) {
      throw new Error(`Pinned ref mismatch for ${repo.id}: expected ${repo.ref}, got ${actualRef}`);
    }

    console.log(`scanning ${repo.id} @ ${actualRef.slice(0, 7)}`);
    const result = await analyzeRepository(checkoutPath, DEFAULT_CONFIG, registry);
    analyses.push({ spec: repo, result });
  }

  return {
    rule: {
      id: rule.id,
      family: rule.family,
      severity: rule.severity,
      scope: rule.scope,
      requires: [...rule.requires],
    },
    analyses,
  };
}

/**
 * Runs the isolated benchmark for every built-in rule in registry order.
 */
async function collectRuleSignalRuns(
  checkoutsDir: string,
  benchmarkSet: BenchmarkSet,
): Promise<RuleSignalBenchmarkRun[]> {
  const baseRegistry = createDefaultRegistry();
  const rules = baseRegistry.getRules();
  const runs: RuleSignalBenchmarkRun[] = [];

  for (const rule of rules) {
    runs.push(await analyzeRuleAcrossSet(rule, checkoutsDir, benchmarkSet, baseRegistry));
  }

  return runs;
}

/** Writes the generated JSON summary and markdown report to disk. */
async function writeRuleSignalArtifacts(
  summaryPath: string,
  reportPath: string,
  summary: RuleSignalBenchmarkSummary,
  report: string,
): Promise<void> {
  await mkdir(path.dirname(summaryPath), { recursive: true });
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${report}\n`);
}

/**
 * Refreshes the generated benchmark section in every built-in rule README.
 */
async function updateRuleReadmes(summary: RuleSignalBenchmarkSummary): Promise<void> {
  for (const rule of summary.rules) {
    const readmePath = resolveProjectPath(`src/rules/${ruleIdToSlug(rule.ruleId)}/README.md`);
    const current = await readFile(readmePath, "utf8");
    const next = upsertRuleSignalReadmeSection(
      current,
      renderRuleSignalReadmeSection(summary, rule),
    );

    if (next !== current) {
      await writeFile(readmePath, next);
    }
  }
}

/** Coordinates the full rule-signal benchmark refresh. */
async function main(): Promise<void> {
  const manifestPath = getOption(process.argv.slice(2), "--manifest", DEFAULT_RULE_SIGNAL_SET_PATH);
  const benchmarkSet = await loadBenchmarkSet(manifestPath);
  const checkoutsDir = resolveProjectPath(benchmarkSet.artifacts.checkoutsDir);
  const summaryPath = resolveProjectPath(benchmarkSet.artifacts.snapshotPath);
  const reportPath = resolveProjectPath(benchmarkSet.artifacts.reportPath);
  const manifestProjectPath = path.relative(process.cwd(), manifestPath);

  await ensurePinnedCheckouts(checkoutsDir, benchmarkSet.repos);

  const runs = await collectRuleSignalRuns(checkoutsDir, benchmarkSet);
  const summary = createRuleSignalBenchmarkSummary(benchmarkSet, runs, packageJson.version, {
    manifestPath: manifestProjectPath,
    summaryPath: benchmarkSet.artifacts.snapshotPath,
    reportPath: benchmarkSet.artifacts.reportPath,
  });
  const report = renderRuleSignalBenchmarkReport(benchmarkSet, summary);

  await writeRuleSignalArtifacts(summaryPath, reportPath, summary, report);
  await updateRuleReadmes(summary);

  console.log(`\nWrote rule signal summary to ${summaryPath}`);
  console.log(`Wrote rule signal report to ${reportPath}`);
  console.log("Updated rule README benchmark sections.");
}

await main();
