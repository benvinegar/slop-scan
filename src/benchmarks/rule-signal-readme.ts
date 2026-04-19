/**
 * Builds the small benchmark snippet inserted into each rule README.
 *
 * The full per-rule report is useful for maintainers, but rule docs need a
 * compact summary that explains whether a rule has real benchmark signal.
 */
import type { RuleSignalBenchmarkSummary, RuleSignalRuleSummary } from "./rule-signal";

/** Formats numeric values consistently for README snippets. */
function formatMetric(value: number | null, digits = 2): string {
  return value === null ? "n/a" : value.toFixed(digits);
}

/** Formats hit counts as `x/y` for compact bullet points. */
function formatHitRate(hitCount: number, repoCount: number): string {
  return `${hitCount}/${repoCount}`;
}

/** Builds the relative anchor link from a rule README to the shared report section. */
function renderReportLink(
  summary: RuleSignalBenchmarkSummary,
  rule: RuleSignalRuleSummary,
): string {
  return `../../../${summary.artifacts.reportPath}#${rule.ruleId.replaceAll(".", "")}`;
}

/** Maps normalized-metric keys to the labels used in the docs. */
function formatMetricName(metricKey: NonNullable<RuleSignalRuleSummary["bestMetric"]>): string {
  return {
    scorePerFile: "score / file",
    scorePerKloc: "score / KLOC",
    scorePerFunction: "score / function",
    findingsPerFile: "findings / file",
    findingsPerKloc: "findings / KLOC",
    findingsPerFunction: "findings / function",
  }[metricKey];
}

/**
 * Renders the markdown snippet embedded into one rule README.
 */
export function renderRuleSignalReadmeSection(
  summary: RuleSignalBenchmarkSummary,
  rule: RuleSignalRuleSummary,
): string {
  const ai = rule.cohorts["explicit-ai"];
  const oss = rule.cohorts["mature-oss"];
  const bestMetric =
    rule.bestMetric === null
      ? "n/a"
      : `${formatMetricName(rule.bestMetric)} (${formatMetric(rule.bestMetricAuc)})`;

  return [
    "## Benchmark signal",
    "",
    `Small pinned rule benchmark ([manifest](../../../${summary.artifacts.manifestPath})):`,
    "",
    `- Signal rank: **#${rule.rank} of ${summary.rules.length}**`,
    `- Signal score: **${formatMetric(rule.signalScore)} / 1.00**`,
    `- Best separating metric: **${bestMetric}**`,
    `- Hit rate: **${formatHitRate(ai.hitCount, ai.repoCount)} AI repos** vs **${formatHitRate(oss.hitCount, oss.repoCount)} mature OSS repos**`,
    `- Full results: [rule signal report](${renderReportLink(summary, rule)})`,
  ].join("\n");
}

/**
 * Inserts or replaces the generated benchmark section in a rule README.
 *
 * Re-running the benchmark should refresh one deterministic section instead of
 * appending duplicates at the end of the file.
 */
export function upsertRuleSignalReadmeSection(readme: string, section: string): string {
  const trimmedSection = section.trim();
  const marker = "\n## Benchmark signal\n";
  const normalizedReadme = readme.trimEnd();
  const markerIndex = normalizedReadme.indexOf(marker);

  if (markerIndex >= 0) {
    return `${normalizedReadme.slice(0, markerIndex)}\n\n${trimmedSection}\n`;
  }

  return `${normalizedReadme}\n\n${trimmedSection}\n`;
}
