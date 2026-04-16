import type { RulePlugin } from "../core/types";
import type { DuplicateFunctionIndex } from "../facts/types";
import { isTestFile } from "../facts/ts-helpers";

function findUniqueDuplicateFunctionClusters(
  duplication: DuplicateFunctionIndex | undefined,
  filePath: string,
) {
  const clusters = duplication?.byFile[filePath] ?? [];

  return clusters.filter(
    (cluster, index) =>
      clusters.findIndex((candidate) => candidate.fingerprint === cluster.fingerprint) === index,
  );
}

/**
 * Uses the repo-level cluster fingerprint as the group key, then adds the local
 * file path to distinguish this file's member occurrence inside that cluster.
 */
function buildDuplicateFunctionSignatureDeltaKeys(
  duplication: DuplicateFunctionIndex | undefined,
  filePath: string,
) {
  const uniqueClusters = findUniqueDuplicateFunctionClusters(duplication, filePath);

  return uniqueClusters.flatMap((cluster) => {
    const primaryOccurrence = cluster.occurrences
      .filter((occurrence) => occurrence.path === filePath)
      .sort((left, right) => left.line - right.line || left.name.localeCompare(right.name))[0];

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
 * Flags non-test files whose function bodies match the same normalized helper
 * shape found in several other source files.
 *
 * The intent is to catch "LLM rewrote a nearby helper instead of reusing it"
 * patterns without firing on tiny wrappers or one-off duplicates.
 */
export const duplicateFunctionSignaturesRule: RulePlugin = {
  id: "structure.duplicate-function-signatures",
  family: "structure",
  severity: "medium",
  scope: "file",
  requires: ["repo.duplicateFunctionSignatures"],
  supports(context) {
    return context.scope === "file" && Boolean(context.file) && !isTestFile(context.file!.path);
  },
  evaluate(context) {
    const duplication = context.runtime.store.getRepoFact<DuplicateFunctionIndex>(
      "repo.duplicateFunctionSignatures",
    );
    const uniqueClusters = findUniqueDuplicateFunctionClusters(duplication, context.file!.path);

    if (uniqueClusters.length === 0) {
      return [];
    }

    return [
      {
        ruleId: "structure.duplicate-function-signatures",
        family: "structure",
        severity: "medium",
        scope: "file",
        path: context.file!.path,
        message: `Found ${uniqueClusters.length} duplicated function signature${uniqueClusters.length === 1 ? "" : "s"}`,
        evidence: uniqueClusters.map((cluster) => {
          const peers = [
            ...new Set(
              cluster.occurrences.map((occurrence) => `${occurrence.path}#${occurrence.name}`),
            ),
          ]
            .filter((entry) => !entry.startsWith(`${context.file!.path}#`))
            .slice(0, 3)
            .join(", ");
          return `${cluster.label} repeated in ${cluster.fileCount} files${peers ? ` (also: ${peers})` : ""}`;
        }),
        score: Math.min(
          6,
          uniqueClusters.reduce(
            (total, cluster) => total + 1.25 + (cluster.fileCount - 3) * 0.5,
            0,
          ),
        ),
        locations: uniqueClusters.flatMap((cluster) =>
          cluster.occurrences.map((occurrence) => ({
            path: occurrence.path,
            line: occurrence.line,
          })),
        ),
        deltaKeys: buildDuplicateFunctionSignatureDeltaKeys(duplication, context.file!.path),
      },
    ];
  },
};
