/**
 * Benchmarks the current experimental candidate rule against the full pinned
 * AI-vs-OSS cohort and emits structured `METRIC` lines for autoresearch.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import packageJson from "../package.json";
import { getOption } from "./lib/get-option";
import { ensurePinnedCheckouts, readHeadRef } from "../src/benchmarks/checkouts";
import {
  createRuleSignalBenchmarkSummary,
  type RuleSignalBenchmarkRun,
} from "../src/benchmarks/rule-signal";
import { renderRuleSignalBenchmarkReport } from "../src/benchmarks/rule-signal-report";
import { loadBenchmarkSet, resolveProjectPath } from "../src/benchmarks/manifest";
import type { BenchmarkSet } from "../src/benchmarks/types";
import { DEFAULT_CONFIG } from "../src/config";
import { analyzeRepository } from "../src/core/engine";
import { Registry } from "../src/core/registry";
import type { AnalysisResult, RulePlugin } from "../src/core/types";
import type { FunctionSummary } from "../src/facts/types";
import { createDefaultRegistry } from "../src/default-registry";
import { promiseDefaultFallbacksRule } from "../src/rules/promise-default-fallbacks";

const DEFAULT_MANIFEST_PATH = path.resolve(
  process.cwd(),
  "benchmarks/sets/known-ai-vs-solid-oss.json",
);
const DEFAULT_SUMMARY_PATH = "benchmarks/results/autoresearch-candidate-rule.json";
const DEFAULT_REPORT_PATH = "reports/autoresearch-candidate-rule.md";
const BENCHMARK_FUNCTION_COUNT_FACT = "file.functionSummaries";
const BASE_FACT_IDS = new Set([
  "file.record",
  "file.text",
  "file.lineCount",
  "file.logicalLineCount",
  "directory.record",
  "repo.files",
  "repo.directories",
]);

function createStandaloneRuleBenchmarkRegistry(baseRegistry: Registry, rule: RulePlugin): Registry {
  const providerByFact = new Map<string, ReturnType<Registry["getFactProviders"]>[number]>();
  for (const provider of baseRegistry.getFactProviders()) {
    for (const factId of provider.provides) {
      if (!providerByFact.has(factId)) {
        providerByFact.set(factId, provider);
      }
    }
  }

  const requiredProviderIds = new Set<string>();
  const visitedFacts = new Set<string>();

  const requireFact = (factId: string): void => {
    if (visitedFacts.has(factId) || BASE_FACT_IDS.has(factId)) {
      return;
    }

    visitedFacts.add(factId);
    const provider = providerByFact.get(factId);
    if (!provider) {
      throw new Error(`No fact provider produces required fact ${factId} for rule ${rule.id}`);
    }

    requiredProviderIds.add(provider.id);
    for (const dependency of provider.requires) {
      requireFact(dependency);
    }
  };

  for (const factId of [...rule.requires, BENCHMARK_FUNCTION_COUNT_FACT]) {
    requireFact(factId);
  }

  const registry = new Registry();
  for (const language of baseRegistry.getLanguages()) {
    registry.registerLanguage(language);
  }

  for (const provider of baseRegistry.getFactProviders()) {
    if (requiredProviderIds.has(provider.id)) {
      registry.registerFactProvider(provider);
    }
  }

  registry.registerRule(rule);
  return registry;
}

function divideOrNull(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

async function analyzeRepositoryWithFunctionCount(
  rootDir: string,
  registry: Registry,
): Promise<AnalysisResult> {
  let functionCount = 0;

  const result = await analyzeRepository(rootDir, DEFAULT_CONFIG, registry, {
    hooks: {
      onFileAnalyzed(file, store) {
        functionCount +=
          store.getFileFact<FunctionSummary[]>(file.path, BENCHMARK_FUNCTION_COUNT_FACT)?.length ??
          0;
      },
    },
  });

  return {
    ...result,
    summary: {
      ...result.summary,
      functionCount,
      normalized: {
        ...result.summary.normalized,
        scorePerFunction: divideOrNull(result.summary.repoScore, functionCount),
        findingsPerFunction: divideOrNull(result.summary.findingCount, functionCount),
      },
    },
  };
}

async function analyzeRuleAcrossSet(
  rule: RulePlugin,
  checkoutsDir: string,
  benchmarkSet: BenchmarkSet,
): Promise<RuleSignalBenchmarkRun> {
  const baseRegistry = createDefaultRegistry();
  const registry = createStandaloneRuleBenchmarkRegistry(baseRegistry, rule);
  const analyses = [];

  for (const repo of benchmarkSet.repos) {
    const checkoutPath = path.join(checkoutsDir, repo.id);
    const actualRef = readHeadRef(checkoutPath);
    if (actualRef !== repo.ref) {
      throw new Error(`Pinned ref mismatch for ${repo.id}: expected ${repo.ref}, got ${actualRef}`);
    }

    console.log(`scanning ${repo.id} @ ${actualRef.slice(0, 7)}`);
    const result = await analyzeRepositoryWithFunctionCount(checkoutPath, registry);
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

function printMetric(name: string, value: number | null): void {
  console.log(`METRIC ${name}=${value ?? 0}`);
}

async function main(): Promise<void> {
  const manifestPath = getOption(process.argv.slice(2), "--manifest", DEFAULT_MANIFEST_PATH);
  const summaryPathRelative = getOption(process.argv.slice(2), "--summary", DEFAULT_SUMMARY_PATH);
  const reportPathRelative = getOption(process.argv.slice(2), "--report", DEFAULT_REPORT_PATH);
  const benchmarkSet = await loadBenchmarkSet(manifestPath);
  const checkoutsDir = resolveProjectPath(benchmarkSet.artifacts.checkoutsDir);
  const summaryPath = resolveProjectPath(summaryPathRelative);
  const reportPath = resolveProjectPath(reportPathRelative);

  await ensurePinnedCheckouts(checkoutsDir, benchmarkSet.repos);

  const run = await analyzeRuleAcrossSet(promiseDefaultFallbacksRule, checkoutsDir, benchmarkSet);
  const summary = createRuleSignalBenchmarkSummary(benchmarkSet, [run], packageJson.version, {
    manifestPath: path.relative(process.cwd(), manifestPath),
    summaryPath: summaryPathRelative,
    reportPath: reportPathRelative,
  });
  const report = renderRuleSignalBenchmarkReport(benchmarkSet, summary);
  const rule = summary.rules[0];
  if (!rule) {
    throw new Error("Expected experimental benchmark summary to contain one rule.");
  }

  await mkdir(path.dirname(summaryPath), { recursive: true });
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${report}\n`);

  console.log(`Wrote experimental summary to ${summaryPath}`);
  console.log(`Wrote experimental report to ${reportPath}`);
  printMetric("signal_score", rule.signalScore);
  printMetric("best_metric_auc", rule.bestMetricAuc);
  printMetric("ai_hit_rate", rule.cohorts["explicit-ai"].hitRate);
  printMetric("oss_hit_rate", rule.cohorts["mature-oss"].hitRate);
}

await main();
