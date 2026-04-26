import { describe, expect, test } from "bun:test";
import path from "node:path";
import {
  createBenchmarkHistoryLatestSummary,
  createBenchmarkHistoryPoints,
  getUtcWeekStartDate,
  mergeHistoryPoint,
  parseHistoryPoints,
  serializeHistoryPoints,
  type BenchmarkedHistoryAnalysis,
} from "../src/benchmarks/history";
import { renderBenchmarkHistoryReport } from "../src/benchmarks/history-report";
import { parseLsRemoteDefaultBranch } from "../src/benchmarks/latest-ref";
import { createBenchmarkSnapshot } from "../src/benchmarks/snapshot";
import type { BenchmarkSet } from "../src/benchmarks/types";
import { analyzeRepository } from "../src/core/engine";
import { DEFAULT_CONFIG } from "../src/config";
import { createDefaultRegistry } from "../src/default-registry";

function fixturePath(name: string): string {
  return path.join(process.cwd(), "tests", "fixtures", "repos", name);
}

function buildFixtureBenchmark(): BenchmarkSet {
  return {
    schemaVersion: 1,
    id: "fixture-benchmark",
    name: "Fixture benchmark",
    description: "Small local benchmark for unit coverage.",
    artifacts: {
      checkoutsDir: "benchmarks/.cache/checkouts/fixture-benchmark",
      snapshotPath: "benchmarks/results/fixture-benchmark.json",
      reportPath: "reports/fixture-benchmark.md",
    },
    repos: [
      {
        id: "slop-heavy",
        repo: "fixtures/slop-heavy",
        url: "https://example.invalid/slop-heavy.git",
        cohort: "explicit-ai",
        ref: "1111111",
        createdAt: "2026-01-01T00:00:00Z",
        stars: 0,
        provenance: "Fixture repo with intentionally slop-heavy code.",
      },
      {
        id: "mixed",
        repo: "fixtures/mixed",
        url: "https://example.invalid/mixed.git",
        cohort: "mature-oss",
        ref: "2222222",
        createdAt: "2020-01-01T00:00:00Z",
        stars: 0,
        provenance: "Fixture repo with localized slop.",
      },
    ],
    pairings: [
      {
        aiRepoId: "slop-heavy",
        solidRepoId: "mixed",
        notes: "Fixture pairing for unit coverage.",
      },
    ],
  };
}

async function buildFixtureAnalyses(
  benchmark: BenchmarkSet,
): Promise<BenchmarkedHistoryAnalysis[]> {
  const registry = createDefaultRegistry();
  const results = [
    await analyzeRepository(fixturePath("slop-heavy"), DEFAULT_CONFIG, registry),
    await analyzeRepository(fixturePath("mixed"), DEFAULT_CONFIG, registry),
  ];

  return [
    {
      spec: benchmark.repos[0]!,
      resolution: {
        repoId: "slop-heavy",
        defaultBranch: "main",
        ref: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
      result: results[0],
    },
    {
      spec: benchmark.repos[1]!,
      resolution: {
        repoId: "mixed",
        defaultBranch: "main",
        ref: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      },
      result: results[1],
    },
  ];
}

describe("benchmark history support", () => {
  test("parses default-branch refs from git ls-remote output", () => {
    const parsed = parseLsRemoteDefaultBranch(
      ["ref: refs/heads/main\tHEAD", "e6e9fc9e4cbefc482e068d03a19401fb7d9226cc\tHEAD"].join("\n"),
    );

    expect(parsed).toEqual({
      defaultBranch: "main",
      ref: "e6e9fc9e4cbefc482e068d03a19401fb7d9226cc",
    });
  });

  test("creates weekly history points, upserts by week, and renders a report", async () => {
    const benchmark = buildFixtureBenchmark();
    const analyses = await buildFixtureAnalyses(benchmark);
    const baselineSnapshot = createBenchmarkSnapshot(
      benchmark,
      analyses.map(({ spec, result }) => ({ spec, result })),
      "0.1.0",
      "2026-04-06T00:00:00Z",
    );

    const weekOnePoints = createBenchmarkHistoryPoints(
      benchmark,
      analyses,
      baselineSnapshot,
      "benchmarks/results/fixture-benchmark.json",
      "0.2.0",
      "commit-one",
      "2026-04-15T12:00:00Z",
    );
    const weekTwoPoints = createBenchmarkHistoryPoints(
      benchmark,
      analyses,
      baselineSnapshot,
      "benchmarks/results/fixture-benchmark.json",
      "0.2.1",
      "commit-two",
      "2026-04-22T12:00:00Z",
    );

    expect(getUtcWeekStartDate("2026-04-15T12:00:00Z")).toBe("2026-04-13");
    expect(weekOnePoints).toHaveLength(2);
    expect(weekOnePoints[0]?.periodStart).toBe("2026-04-13");
    expect(weekOnePoints[0]?.scanMode).toBe("default-branch-as-of-recorded-at");
    expect(weekOnePoints[0]?.blended.vsPinnedBaseline).not.toBeNull();

    const slopHeavyWeekOne = weekOnePoints.find((point) => point.repoId === "slop-heavy");
    const slopHeavyWeekTwo = weekTwoPoints.find((point) => point.repoId === "slop-heavy");
    const mixedWeekOne = weekOnePoints.find((point) => point.repoId === "mixed");
    const mixedWeekTwo = weekTwoPoints.find((point) => point.repoId === "mixed");

    expect(slopHeavyWeekOne).toBeTruthy();
    expect(slopHeavyWeekTwo).toBeTruthy();
    expect(mixedWeekOne).toBeTruthy();
    expect(mixedWeekTwo).toBeTruthy();

    const adjustedSlopHeavyWeekTwo = {
      ...slopHeavyWeekTwo!,
      blended: {
        ...slopHeavyWeekTwo!.blended,
        vsCurrentCohort: (slopHeavyWeekTwo!.blended.vsCurrentCohort ?? 0) + 0.4,
        vsPinnedBaseline: (slopHeavyWeekTwo!.blended.vsPinnedBaseline ?? 0) + 0.6,
      },
      summary: {
        ...slopHeavyWeekTwo!.summary,
        repoScore: slopHeavyWeekTwo!.summary.repoScore + 2,
      },
    };
    const adjustedMixedWeekTwo = {
      ...mixedWeekTwo!,
      blended: {
        ...mixedWeekTwo!.blended,
        vsCurrentCohort: (mixedWeekTwo!.blended.vsCurrentCohort ?? 0) - 0.2,
        vsPinnedBaseline: (mixedWeekTwo!.blended.vsPinnedBaseline ?? 0) - 0.3,
      },
      summary: {
        ...mixedWeekTwo!.summary,
        repoScore: mixedWeekTwo!.summary.repoScore - 1,
      },
    };

    let slopHeavyHistory = mergeHistoryPoint([], slopHeavyWeekOne!);
    slopHeavyHistory = mergeHistoryPoint(slopHeavyHistory, {
      ...slopHeavyWeekOne!,
      recordedAt: "2026-04-15T18:00:00Z",
    });
    slopHeavyHistory = mergeHistoryPoint(slopHeavyHistory, adjustedSlopHeavyWeekTwo);

    let mixedHistory = mergeHistoryPoint([], mixedWeekOne!);
    mixedHistory = mergeHistoryPoint(mixedHistory, adjustedMixedWeekTwo);

    expect(slopHeavyHistory).toHaveLength(2);
    expect(slopHeavyHistory[0]?.recordedAt).toBe("2026-04-15T18:00:00Z");

    const serialized = serializeHistoryPoints(slopHeavyHistory);
    const reparsed = parseHistoryPoints(serialized);
    expect(reparsed).toHaveLength(2);
    expect(reparsed[1]?.periodStart).toBe("2026-04-20");

    const summary = createBenchmarkHistoryLatestSummary(
      benchmark,
      [...slopHeavyHistory, ...mixedHistory],
      baselineSnapshot,
      "benchmarks/results/fixture-benchmark.json",
    );
    const report = renderBenchmarkHistoryReport(benchmark, summary);

    expect(summary.repos).toHaveLength(2);
    expect(summary.repos.every((repo) => repo.pointCount === 2)).toBe(true);
    expect(summary.repos.every((repo) => repo.series.length === 2)).toBe(true);
    expect(
      summary.repos.find((repo) => repo.id === "slop-heavy")?.deltaFromPrevious?.repoScore,
    ).toBeCloseTo(2, 6);
    expect(
      summary.repos.find((repo) => repo.id === "mixed")?.deltaFromPrevious?.repoScore,
    ).toBeCloseTo(-1, 6);
    expect(
      summary.repos.find((repo) => repo.id === "slop-heavy")?.highest?.blendedVsPinnedBaseline,
    ).toBe(adjustedSlopHeavyWeekTwo.blended.vsPinnedBaseline);
    expect(
      summary.repos.find((repo) => repo.id === "mixed")?.highest?.blendedVsPinnedBaseline,
    ).toBe(mixedWeekOne!.blended.vsPinnedBaseline);
    expect(summary.generatedAt).toBe("2026-04-22T12:00:00Z");
    expect(summary.baseline.snapshotPath).toBe("benchmarks/results/fixture-benchmark.json");
    expect(report).toContain("Rolling benchmark history: Fixture benchmark");
    expect(report).toContain("bun run benchmark:history --recorded-at 2026-04-06T12:00:00Z");
    expect(report).toContain("Trend (pinned)");
    expect(report).toContain("Latest pinned");
    expect(report).toContain("Highest pinned");
    expect(report).toContain("▁█");
    expect(report).toContain("█▁");
    expect(report).toContain("fixtures/slop-heavy");
    expect(report).toContain("fixtures/mixed");
  });
});
