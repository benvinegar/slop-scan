import type { RulePlugin } from "../core/types";
import type { DuplicateTestSetupIndex } from "../facts/types";
import { isTestFile } from "../facts/ts-helpers";

function findUniqueDuplicateMockSetupClusters(
  duplication: DuplicateTestSetupIndex | undefined,
  filePath: string,
) {
  const clusters = duplication?.byFile[filePath] ?? [];

  return clusters.filter(
    (cluster, index) =>
      clusters.findIndex((candidate) => candidate.fingerprint === cluster.fingerprint) === index,
  );
}

/**
 * Uses the repo-level duplicate-cluster fingerprint as the stable group key,
 * then combines it with the local file path for this file's occurrence key.
 */
function buildDuplicateMockSetupDeltaKeys(
  duplication: DuplicateTestSetupIndex | undefined,
  filePath: string,
) {
  const uniqueClusters = findUniqueDuplicateMockSetupClusters(duplication, filePath);

  return uniqueClusters.flatMap((cluster) => {
    const primaryOccurrence = cluster.occurrences
      .filter((occurrence) => occurrence.path === filePath)
      .sort((left, right) => left.line - right.line)[0];

    if (!primaryOccurrence) {
      return [];
    }

    return {
      key: `${cluster.fingerprint}:${filePath}`,
      group: cluster.fingerprint,
      path: filePath,
      line: primaryOccurrence.line,
    };
  });
}

/**
 * Flags repeated test setup/mock shapes that appear across multiple test files.
 *
 * The heavy lifting happens in the repo-level duplication fact. This rule simply
 * projects those precomputed clusters back onto each individual test file so the
 * report can point at concrete hotspots.
 */
export const duplicateMockSetupRule: RulePlugin = {
  id: "tests.duplicate-mock-setup",
  family: "tests",
  severity: "medium",
  scope: "file",
  requires: ["repo.testMockDuplication"],
  supports(context) {
    return context.scope === "file" && Boolean(context.file) && isTestFile(context.file!.path);
  },
  evaluate(context) {
    const duplication = context.runtime.store.getRepoFact<DuplicateTestSetupIndex>(
      "repo.testMockDuplication",
    );
    const uniqueClusters = findUniqueDuplicateMockSetupClusters(duplication, context.file!.path);

    if (uniqueClusters.length === 0) {
      return [];
    }

    return [
      {
        ruleId: "tests.duplicate-mock-setup",
        family: "tests",
        severity: "medium",
        scope: "file",
        path: context.file!.path,
        message: `Found ${uniqueClusters.length} duplicated test mock/setup pattern${uniqueClusters.length === 1 ? "" : "s"}`,
        evidence: uniqueClusters.map((cluster) => {
          const peers = [...new Set(cluster.occurrences.map((occurrence) => occurrence.path))]
            .filter((path) => path !== context.file!.path)
            .slice(0, 3)
            .join(", ");
          return `${cluster.label} in ${cluster.fileCount} files${peers ? ` (also: ${peers})` : ""}`;
        }),
        // The second file establishes duplication; each additional file adds a
        // smaller increment instead of linearly exploding the score.
        score: Math.min(
          5,
          uniqueClusters.reduce((total, cluster) => total + 1 + (cluster.fileCount - 2) * 0.5, 0),
        ),
        locations: uniqueClusters.flatMap((cluster) =>
          cluster.occurrences.map((occurrence) => ({
            path: occurrence.path,
            line: occurrence.line,
          })),
        ),
        deltaKeys: buildDuplicateMockSetupDeltaKeys(duplication, context.file!.path),
      },
    ];
  },
};
