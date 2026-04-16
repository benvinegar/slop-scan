import type { RulePlugin } from "../core/types";
import type { TryCatchSummary } from "../facts/types";
import { delta } from "../rule-delta";
import {
  formatTryCatchBoundary,
  isValidTryCatchTarget,
  scoreTryCatch,
} from "./try-catch-rule-helpers";

function findEmptyCatchSummaries(summaries: TryCatchSummary[]): TryCatchSummary[] {
  return summaries.filter(
    (summary) =>
      isValidTryCatchTarget(summary) &&
      summary.tryStatementCount <= 2 &&
      summary.catchIsEmpty &&
      !summary.isDocumentedLocalFallback,
  );
}

/**
 * Flags empty catch clauses, which suppress failures without even leaving a log
 * trail. A narrow exception is allowed for documented local fallback code,
 * where the try block only resolves candidate values and the catch explicitly
 * explains that the code is falling through to another source.
 */
export const emptyCatchRule: RulePlugin = {
  id: "defensive.empty-catch",
  family: "defensive",
  severity: "strong",
  scope: "file",
  requires: ["file.tryCatchSummaries"],
  // Try/catch blocks do not usually move much in normal edits, so line-based
  // matching is a cheaper tradeoff than rebuilding semantic identities.
  delta: delta.byLocations(),
  supports(context) {
    return context.scope === "file" && Boolean(context.file);
  },
  evaluate(context) {
    const summaries =
      context.runtime.store.getFileFact<TryCatchSummary[]>(
        context.file!.path,
        "file.tryCatchSummaries",
      ) ?? [];

    const flagged = findEmptyCatchSummaries(summaries);

    if (flagged.length === 0) {
      return [];
    }

    return [
      {
        ruleId: "defensive.empty-catch",
        family: "defensive",
        severity: "strong",
        scope: "file",
        path: context.file!.path,
        message: `Found ${flagged.length} empty catch block${flagged.length === 1 ? "" : "s"}`,
        evidence: flagged.map(
          (summary) =>
            `line ${summary.line}: empty catch, boundary=${formatTryCatchBoundary(summary)}`,
        ),
        score: Math.min(
          8,
          flagged.reduce((total, summary) => total + scoreTryCatch(summary), 0),
        ),
        locations: flagged.map((summary) => ({ path: context.file!.path, line: summary.line })),
      },
    ];
  },
};
