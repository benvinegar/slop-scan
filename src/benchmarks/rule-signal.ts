/**
 * Builds the data model for the per-rule signal benchmark.
 *
 * This benchmark runs each built-in rule in isolation against a smaller pinned
 * AI-vs-OSS cohort so we can answer: "which rules actually separate the two
 * cohorts well on their own?"
 */
import type { AnalysisSummary, NormalizedMetrics, RulePlugin, Scope } from "../core/types";
import { Registry } from "../core/registry";
import { buildMedianMetrics, median } from "./metrics";
import {
  NORMALIZED_METRIC_KEYS,
  type BenchmarkCohort,
  type BenchmarkSet,
  type BenchmarkedAnalysis,
} from "./types";

/**
 * Fact ids that are always available from the engine without discovering a
 * provider. They form the roots of the dependency walk when we build an
 * isolated registry for one rule.
 */
const BASE_FACT_IDS = new Set([
  "file.record",
  "file.text",
  "file.lineCount",
  "file.logicalLineCount",
  "directory.record",
  "repo.files",
  "repo.directories",
]);

/** Single isolated benchmark result for one repo under one rule. */
export interface RuleSignalRepoSnapshot {
  id: string;
  repo: string;
  cohort: BenchmarkCohort;
  ref: string;
  summary: AnalysisSummary;
}

/** Aggregated isolated-rule stats for one cohort. */
export interface RuleSignalCohortSummary {
  repoCount: number;
  hitCount: number;
  hitRate: number;
  repoScoreMedian: number | null;
  findingCountMedian: number | null;
  medians: NormalizedMetrics;
}

/** AUROC scores for each normalized metric when a rule runs alone. */
export interface RuleSignalMetricAucs extends NormalizedMetrics {}

/** Ranked isolated-rule summary used by JSON output, markdown, and rule READMEs. */
export interface RuleSignalRuleSummary {
  rank: number;
  ruleId: string;
  ruleSlug: string;
  family: string;
  severity: RulePlugin["severity"];
  scope: Scope;
  requires: string[];
  signalScore: number | null;
  bestMetric: keyof NormalizedMetrics | null;
  bestMetricAuc: number | null;
  metricAucs: RuleSignalMetricAucs;
  cohorts: Record<BenchmarkCohort, RuleSignalCohortSummary>;
  repos: RuleSignalRepoSnapshot[];
}

/** Paths recorded in the generated summary so downstream docs can link back to them. */
export interface RuleSignalBenchmarkArtifacts {
  manifestPath: string;
  summaryPath: string;
  reportPath: string;
}

/** Top-level JSON payload written by `bun run benchmark:rules`. */
export interface RuleSignalBenchmarkSummary {
  schemaVersion: 1;
  benchmarkSetId: string;
  benchmarkSetName: string;
  generatedAt: string;
  analyzerVersion: string;
  artifacts: RuleSignalBenchmarkArtifacts;
  rules: RuleSignalRuleSummary[];
}

/** One isolated run worth of inputs before we aggregate and rank it. */
export interface RuleSignalBenchmarkRun {
  rule: Pick<RulePlugin, "id" | "family" | "severity" | "scope" | "requires">;
  analyses: BenchmarkedAnalysis[];
}

interface RuleSignalRuleDraft extends Omit<RuleSignalRuleSummary, "rank"> {}

/** Computes a simple arithmetic mean, returning null for empty input. */
function mean(values: number[]): number | null {
  return values.length === 0
    ? null
    : values.reduce((total, value) => total + value, 0) / values.length;
}

/** Keeps only the per-repo fields needed for signal benchmarking outputs. */
function buildRepoSnapshot({ spec, result }: BenchmarkedAnalysis): RuleSignalRepoSnapshot {
  return {
    id: spec.id,
    repo: spec.repo,
    cohort: spec.cohort,
    ref: spec.ref,
    summary: result.summary,
  };
}

/**
 * Builds cohort-level medians and hit rates for one rule.
 *
 * A "hit" means the isolated rule emitted at least one finding for that repo.
 */
function buildCohortSummary(repos: RuleSignalRepoSnapshot[]): RuleSignalCohortSummary {
  const hitRepos = repos.filter((repo) => repo.summary.findingCount > 0);

  return {
    repoCount: repos.length,
    hitCount: hitRepos.length,
    hitRate: repos.length === 0 ? 0 : hitRepos.length / repos.length,
    repoScoreMedian: median(repos.map((repo) => repo.summary.repoScore)),
    findingCountMedian: median(repos.map((repo) => repo.summary.findingCount)),
    medians: buildMedianMetrics(repos),
  };
}

/**
 * Computes AUROC for one metric, treating larger values as "more AI-like".
 *
 * 1.00 means every positive outranks every negative, 0.50 means no separation,
 * and values below 0.50 mean the metric is separating in the wrong direction.
 */
export function computeAuroc(positiveValues: number[], negativeValues: number[]): number | null {
  if (positiveValues.length === 0 || negativeValues.length === 0) {
    return null;
  }

  let wins = 0;

  for (const positive of positiveValues) {
    for (const negative of negativeValues) {
      if (positive > negative) {
        wins += 1;
      } else if (positive === negative) {
        wins += 0.5;
      }
    }
  }

  return wins / (positiveValues.length * negativeValues.length);
}

/**
 * Calculates per-metric AUROC values for one isolated rule run.
 *
 * Null normalized values are treated as zero so repos with degenerate totals
 * still participate in the ordering instead of disappearing from comparison.
 */
function toAucMetricMap(repos: RuleSignalRepoSnapshot[]): RuleSignalMetricAucs {
  const aiRepos = repos.filter((repo) => repo.cohort === "explicit-ai");
  const ossRepos = repos.filter((repo) => repo.cohort === "mature-oss");

  const entries = NORMALIZED_METRIC_KEYS.map((metricKey) => {
    const aiValues = aiRepos.map((repo) => repo.summary.normalized[metricKey] ?? 0);
    const ossValues = ossRepos.map((repo) => repo.summary.normalized[metricKey] ?? 0);
    return [metricKey, computeAuroc(aiValues, ossValues)];
  });

  return Object.fromEntries(entries) as RuleSignalMetricAucs;
}

/**
 * Picks the normalized metric with the strongest separation for a rule.
 *
 * Ties are broken lexicographically so output is deterministic across reruns.
 */
function findBestMetric(metricAucs: RuleSignalMetricAucs): {
  metric: keyof NormalizedMetrics | null;
  auc: number | null;
} {
  let bestMetric: keyof NormalizedMetrics | null = null;
  let bestAuc: number | null = null;

  for (const metricKey of NORMALIZED_METRIC_KEYS) {
    const auc = metricAucs[metricKey];
    if (auc === null) {
      continue;
    }

    if (
      bestAuc === null ||
      auc > bestAuc ||
      (auc === bestAuc && bestMetric !== null && metricKey < bestMetric)
    ) {
      bestMetric = metricKey;
      bestAuc = auc;
    }
  }

  return { metric: bestMetric, auc: bestAuc };
}

/** Sort helper that places larger numeric values first and nulls last. */
function compareNullableDescending(left: number | null, right: number | null): number {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return right - left;
}

/** Converts `family.rule-name` ids into the directory slug used under `src/rules/`. */
export function ruleIdToSlug(ruleId: string): string {
  const parts = ruleId.split(".");
  return parts[parts.length - 1] ?? ruleId;
}

/**
 * Builds a minimal registry for one rule.
 *
 * The goal is isolation: we include only the target rule plus the fact
 * providers it transitively depends on, while keeping the normal language
 * plugins. That keeps unrelated rules/providers from influencing the run.
 */
export function createRuleBenchmarkRegistry(baseRegistry: Registry, ruleId: string): Registry {
  const targetRule = baseRegistry.getRules().find((rule) => rule.id === ruleId);
  if (!targetRule) {
    throw new Error(`Unknown rule: ${ruleId}`);
  }

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

  /** Walks fact dependencies backward from the rule to the providers we need. */
  const requireFact = (factId: string): void => {
    if (visitedFacts.has(factId) || BASE_FACT_IDS.has(factId)) {
      return;
    }

    visitedFacts.add(factId);
    const provider = providerByFact.get(factId);
    if (!provider) {
      throw new Error(`No fact provider produces required fact ${factId} for rule ${ruleId}`);
    }

    requiredProviderIds.add(provider.id);
    for (const dependency of provider.requires) {
      requireFact(dependency);
    }
  };

  for (const factId of targetRule.requires) {
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

  registry.registerRule(targetRule);
  return registry;
}

/**
 * Aggregates isolated rule runs into a ranked benchmark summary.
 *
 * `signalScore` is the mean AUROC across all six normalized metrics. Rules are
 * then ranked by that score, with deterministic tie-breaks for repeatable docs.
 */
export function createRuleSignalBenchmarkSummary(
  set: BenchmarkSet,
  runs: RuleSignalBenchmarkRun[],
  analyzerVersion: string,
  artifacts: RuleSignalBenchmarkArtifacts,
  generatedAt = new Date().toISOString(),
): RuleSignalBenchmarkSummary {
  const drafts: RuleSignalRuleDraft[] = runs.map(({ rule, analyses }) => {
    const repos = analyses
      .map(buildRepoSnapshot)
      .sort(
        (left, right) =>
          left.cohort.localeCompare(right.cohort) ||
          compareNullableDescending(
            left.summary.normalized.scorePerKloc,
            right.summary.normalized.scorePerKloc,
          ) ||
          left.repo.localeCompare(right.repo),
      );

    const metricAucs = toAucMetricMap(repos);
    const signalScore = mean(
      NORMALIZED_METRIC_KEYS.flatMap((metricKey) => {
        const auc = metricAucs[metricKey];
        return auc === null ? [] : [auc];
      }),
    );
    const { metric: bestMetric, auc: bestMetricAuc } = findBestMetric(metricAucs);
    const aiRepos = repos.filter((repo) => repo.cohort === "explicit-ai");
    const ossRepos = repos.filter((repo) => repo.cohort === "mature-oss");

    return {
      ruleId: rule.id,
      ruleSlug: ruleIdToSlug(rule.id),
      family: rule.family,
      severity: rule.severity,
      scope: rule.scope,
      requires: [...rule.requires],
      signalScore,
      bestMetric,
      bestMetricAuc,
      metricAucs,
      cohorts: {
        "explicit-ai": buildCohortSummary(aiRepos),
        "mature-oss": buildCohortSummary(ossRepos),
      },
      repos,
    };
  });

  const sorted = drafts.sort((left, right) => {
    const signalCompare = compareNullableDescending(left.signalScore, right.signalScore);
    if (signalCompare !== 0) {
      return signalCompare;
    }

    const bestMetricCompare = compareNullableDescending(left.bestMetricAuc, right.bestMetricAuc);
    if (bestMetricCompare !== 0) {
      return bestMetricCompare;
    }

    const aiHitRateCompare =
      right.cohorts["explicit-ai"].hitRate - left.cohorts["explicit-ai"].hitRate;
    if (aiHitRateCompare !== 0) {
      return aiHitRateCompare;
    }

    const ossHitRateCompare =
      left.cohorts["mature-oss"].hitRate - right.cohorts["mature-oss"].hitRate;
    if (ossHitRateCompare !== 0) {
      return ossHitRateCompare;
    }

    return left.ruleId.localeCompare(right.ruleId);
  });

  return {
    schemaVersion: 1,
    benchmarkSetId: set.id,
    benchmarkSetName: set.name,
    generatedAt,
    analyzerVersion,
    artifacts,
    rules: sorted.map((draft, index) => ({
      ...draft,
      rank: index + 1,
    })),
  };
}
