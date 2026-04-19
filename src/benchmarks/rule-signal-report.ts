/**
 * Renders the markdown report for the per-rule signal benchmark.
 *
 * The JSON summary is the machine-readable artifact; this file turns the same
 * data into a maintainer-facing leaderboard and per-rule drilldown.
 */
import type { NormalizedMetrics } from "../core/types";
import type { BenchmarkSet } from "./types";
import type { RuleSignalBenchmarkSummary, RuleSignalRuleSummary } from "./rule-signal";

/** Formats numeric benchmark values consistently for markdown output. */
function formatMetric(value: number | null, digits = 2): string {
  return value === null ? "n/a" : value.toFixed(digits);
}

/** Formats hit-rate percentages for compact tables. */
function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

/** Maps normalized-metric keys to the human labels used in reports. */
function formatMetricName(metricKey: keyof NormalizedMetrics): string {
  return {
    scorePerFile: "score / file",
    scorePerKloc: "score / KLOC",
    scorePerFunction: "score / function",
    findingsPerFile: "findings / file",
    findingsPerKloc: "findings / KLOC",
    findingsPerFunction: "findings / function",
  }[metricKey];
}

/** Shortens full SHAs for table display. */
function shortRef(ref: string): string {
  return ref.slice(0, 7);
}

/** Renders the top-level ranking table across every isolated rule run. */
function renderLeaderboard(summary: RuleSignalBenchmarkSummary): string[] {
  return [
    "| Rank | Rule | Signal score | AI hit rate | OSS hit rate | Best metric | Best AUROC |",
    "|---:|---|---:|---:|---:|---|---:|",
    ...summary.rules.map((rule) => {
      const ai = rule.cohorts["explicit-ai"];
      const oss = rule.cohorts["mature-oss"];
      return `| ${rule.rank} | \`${rule.ruleId}\` | **${formatMetric(rule.signalScore)}** | ${ai.hitCount}/${ai.repoCount} (${formatPercent(ai.hitRate)}) | ${oss.hitCount}/${oss.repoCount} (${formatPercent(oss.hitRate)}) | ${rule.bestMetric ? formatMetricName(rule.bestMetric) : "n/a"} | ${formatMetric(rule.bestMetricAuc)} |`;
    }),
  ];
}

/** Renders side-by-side cohort medians for one isolated rule. */
function renderCohortTable(rule: RuleSignalRuleSummary): string[] {
  const ai = rule.cohorts["explicit-ai"];
  const oss = rule.cohorts["mature-oss"];

  return [
    "| Cohort | Hit rate | Median findings | Median repo score | Median score / file | Median score / KLOC | Median findings / KLOC |",
    "|---|---:|---:|---:|---:|---:|---:|",
    `| explicit-ai | ${ai.hitCount}/${ai.repoCount} (${formatPercent(ai.hitRate)}) | ${formatMetric(ai.findingCountMedian)} | ${formatMetric(ai.repoScoreMedian)} | ${formatMetric(ai.medians.scorePerFile)} | ${formatMetric(ai.medians.scorePerKloc)} | ${formatMetric(ai.medians.findingsPerKloc)} |`,
    `| mature-oss | ${oss.hitCount}/${oss.repoCount} (${formatPercent(oss.hitRate)}) | ${formatMetric(oss.findingCountMedian)} | ${formatMetric(oss.repoScoreMedian)} | ${formatMetric(oss.medians.scorePerFile)} | ${formatMetric(oss.medians.scorePerKloc)} | ${formatMetric(oss.medians.findingsPerKloc)} |`,
  ];
}

/** Renders the per-repo isolated results for a single rule. */
function renderRepoTable(rule: RuleSignalRuleSummary): string[] {
  return [
    "| Repo | Cohort | Ref | Findings | Repo score | Score / file | Score / KLOC | Findings / KLOC |",
    "|---|---|---|---:|---:|---:|---:|---:|",
    ...rule.repos.map(
      (repo) =>
        `| [${repo.repo}](https://github.com/${repo.repo}) | ${repo.cohort} | \`${shortRef(repo.ref)}\` | ${repo.summary.findingCount} | ${formatMetric(repo.summary.repoScore)} | ${formatMetric(repo.summary.normalized.scorePerFile)} | ${formatMetric(repo.summary.normalized.scorePerKloc)} | ${formatMetric(repo.summary.normalized.findingsPerKloc)} |`,
    ),
  ];
}

/**
 * Renders the full drilldown section for one rule, including cohort medians,
 * per-metric AUROC values, and the repo-by-repo table.
 */
function renderRuleSection(rule: RuleSignalRuleSummary, totalRules: number): string[] {
  const metricAucs = Object.entries(rule.metricAucs)
    .map(
      ([metricKey, auc]) =>
        `- ${formatMetricName(metricKey as keyof NormalizedMetrics)}: ${formatMetric(auc)}`,
    )
    .join("\n");

  return [
    `## ${rule.ruleId}`,
    "",
    `- Rank: **#${rule.rank}** of ${totalRules}`,
    `- Signal score: **${formatMetric(rule.signalScore)} / 1.00**`,
    `- Family / severity / scope: \`${rule.family}\` / \`${rule.severity}\` / \`${rule.scope}\``,
    `- Best metric: ${rule.bestMetric ? `${formatMetricName(rule.bestMetric)} (${formatMetric(rule.bestMetricAuc)})` : "n/a"}`,
    "",
    "### Cohort summary",
    "",
    ...renderCohortTable(rule),
    "",
    "### AUROC by normalized metric",
    "",
    metricAucs,
    "",
    "### Repo results",
    "",
    ...renderRepoTable(rule),
  ];
}

/**
 * Builds the human-readable markdown report for the per-rule signal benchmark.
 */
export function renderRuleSignalBenchmarkReport(
  set: BenchmarkSet,
  summary: RuleSignalBenchmarkSummary,
): string {
  const lines = [
    `# Per-rule signal benchmark: ${set.name}`,
    "",
    `Date: ${summary.generatedAt.slice(0, 10)}`,
    `Analyzer version: ${summary.analyzerVersion}`,
    `Manifest: \`${summary.artifacts.manifestPath}\``,
    `Summary: \`${summary.artifacts.summaryPath}\``,
    `Report: \`${summary.artifacts.reportPath}\``,
    "",
    "## Goal",
    "",
    set.description,
    "",
    "Signal score = average AUROC across the six normalized metrics when each rule runs in isolation against this pinned mini cohort. 1.00 means perfect AI-over-OSS separation, while 0.50 means no better than random ordering.",
    "",
    "## Leaderboard",
    "",
    ...renderLeaderboard(summary),
    "",
    ...summary.rules.flatMap((rule) => ["", ...renderRuleSection(rule, summary.rules.length)]),
  ];

  return lines.join("\n").trim();
}
