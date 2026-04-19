import { describe, expect, test } from "bun:test";
import { DEFAULT_CONFIG } from "../src/config";
import type { AnalysisResult, AnalysisSummary, NormalizedMetrics } from "../src/core/types";
import {
  computeAuroc,
  createRuleSignalBenchmarkSummary,
  type RuleSignalBenchmarkRun,
} from "../src/benchmarks/rule-signal";
import {
  renderRuleSignalReadmeSection,
  upsertRuleSignalReadmeSection,
} from "../src/benchmarks/rule-signal-readme";
import { renderRuleSignalBenchmarkReport } from "../src/benchmarks/rule-signal-report";
import type { BenchmarkSet, BenchmarkedAnalysis } from "../src/benchmarks/types";

function metrics(value: number): NormalizedMetrics {
  return {
    scorePerFile: value,
    scorePerKloc: value,
    scorePerFunction: value,
    findingsPerFile: value,
    findingsPerKloc: value,
    findingsPerFunction: value,
  };
}

function buildSummary(value: number, findingCount: number): AnalysisSummary {
  return {
    fileCount: 10,
    directoryCount: 3,
    findingCount,
    repoScore: value * 10,
    physicalLineCount: 1000,
    logicalLineCount: 1000,
    functionCount: 100,
    normalized: metrics(value),
  };
}

function analysis(resultSummary: AnalysisSummary): AnalysisResult {
  return {
    rootDir: "/tmp/fake",
    config: DEFAULT_CONFIG,
    summary: resultSummary,
    files: [],
    directories: [],
    findings: [],
    fileScores: [],
    directoryScores: [],
    repoScore: resultSummary.repoScore,
  };
}

function bench(
  spec: BenchmarkSet["repos"][number],
  value: number,
  findingCount: number,
): BenchmarkedAnalysis {
  return {
    spec,
    result: analysis(buildSummary(value, findingCount)),
  };
}

function buildBenchmarkSet(): BenchmarkSet {
  return {
    schemaVersion: 1,
    id: "fixture-rule-signal",
    name: "Fixture rule signal benchmark",
    description: "Small benchmark used for rule-signal unit coverage.",
    artifacts: {
      checkoutsDir: "benchmarks/.cache/checkouts/fixture-rule-signal",
      snapshotPath: "benchmarks/results/fixture-rule-signal.json",
      reportPath: "reports/fixture-rule-signal.md",
    },
    repos: [
      {
        id: "ai-one",
        repo: "fixtures/ai-one",
        url: "https://example.invalid/ai-one.git",
        cohort: "explicit-ai",
        ref: "1111111",
        createdAt: "2026-01-01T00:00:00Z",
        stars: 0,
        provenance: "Fixture AI repo.",
      },
      {
        id: "ai-two",
        repo: "fixtures/ai-two",
        url: "https://example.invalid/ai-two.git",
        cohort: "explicit-ai",
        ref: "2222222",
        createdAt: "2026-01-01T00:00:00Z",
        stars: 0,
        provenance: "Fixture AI repo.",
      },
      {
        id: "oss-one",
        repo: "fixtures/oss-one",
        url: "https://example.invalid/oss-one.git",
        cohort: "mature-oss",
        ref: "3333333",
        createdAt: "2020-01-01T00:00:00Z",
        stars: 0,
        provenance: "Fixture OSS repo.",
      },
      {
        id: "oss-two",
        repo: "fixtures/oss-two",
        url: "https://example.invalid/oss-two.git",
        cohort: "mature-oss",
        ref: "4444444",
        createdAt: "2020-01-01T00:00:00Z",
        stars: 0,
        provenance: "Fixture OSS repo.",
      },
    ],
    pairings: [],
  };
}

function buildRuns(set: BenchmarkSet): RuleSignalBenchmarkRun[] {
  const [aiOne, aiTwo, ossOne, ossTwo] = set.repos;

  return [
    {
      rule: {
        id: "defensive.empty-catch",
        family: "defensive",
        severity: "strong",
        scope: "file",
        requires: ["file.tryCatchSummaries"],
      },
      analyses: [
        bench(aiOne!, 3, 3),
        bench(aiTwo!, 2, 2),
        bench(ossOne!, 0, 0),
        bench(ossTwo!, 1, 1),
      ],
    },
    {
      rule: {
        id: "comments.placeholder-comments",
        family: "comments",
        severity: "weak",
        scope: "file",
        requires: ["file.commentSummaries"],
      },
      analyses: [
        bench(aiOne!, 0, 0),
        bench(aiTwo!, 1, 1),
        bench(ossOne!, 0, 0),
        bench(ossTwo!, 1, 1),
      ],
    },
  ];
}

describe("rule signal benchmark support", () => {
  test("computes AUROC with tie handling", () => {
    expect(computeAuroc([3, 2], [0, 1])).toBe(1);
    expect(computeAuroc([1], [1])).toBe(0.5);
    expect(computeAuroc([], [1])).toBeNull();
  });

  test("builds ranked rule summaries, renders report text, and updates rule README sections", () => {
    const set = buildBenchmarkSet();
    const summary = createRuleSignalBenchmarkSummary(
      set,
      buildRuns(set),
      "0.3.0",
      {
        manifestPath: "benchmarks/sets/rule-signal-mini.json",
        summaryPath: "benchmarks/results/rule-signal-mini.json",
        reportPath: "reports/rule-signal-mini.md",
      },
      "2026-04-19T00:00:00Z",
    );

    expect(summary.rules).toHaveLength(2);
    expect(summary.rules[0]?.ruleId).toBe("defensive.empty-catch");
    expect(summary.rules[0]?.rank).toBe(1);
    expect(summary.rules[0]?.signalScore).toBe(1);
    expect(summary.rules[0]?.cohorts["explicit-ai"].hitCount).toBe(2);
    expect(summary.rules[0]?.cohorts["mature-oss"].hitCount).toBe(1);
    expect(summary.rules[1]?.signalScore).toBe(0.5);

    const report = renderRuleSignalBenchmarkReport(set, summary);
    expect(report).toContain("Per-rule signal benchmark: Fixture rule signal benchmark");
    expect(report).toContain("Signal score = average AUROC across the six normalized metrics");
    expect(report).toContain("`defensive.empty-catch`");
    expect(report).toContain("fixtures/ai-one");

    const readmeSection = renderRuleSignalReadmeSection(summary, summary.rules[0]!);
    expect(readmeSection).toContain("Signal rank: **#1 of 2**");
    expect(readmeSection).toContain("Best separating metric: **findings / file (1.00)**");
    expect(readmeSection).toContain("reports/rule-signal-mini.md#defensiveempty-catch");

    const appended = upsertRuleSignalReadmeSection("# defensive.empty-catch\n", readmeSection);
    expect(appended).toContain("## Benchmark signal");

    const replaced = upsertRuleSignalReadmeSection(appended, "## Benchmark signal\n\nUpdated\n");
    expect(replaced).toContain("Updated");
    expect(replaced.match(/## Benchmark signal/g)?.length).toBe(1);
  });
});
