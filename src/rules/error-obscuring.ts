import { createFindingDeltaIdentity } from "../delta-identity";
import type { RulePlugin } from "../core/types";
import type { TryCatchSummary } from "../facts/types";
import { assignStableOrdinals } from "./helpers";
import {
  buildTryCatchIdentityBase,
  formatTryCatchBoundary,
  isValidTryCatchTarget,
  scoreTryCatch,
} from "./try-catch-rule-helpers";

function obscuringKind(summary: TryCatchSummary): string {
  if (summary.catchHasLogging && summary.catchHasDefaultReturn) {
    return "log+default";
  }

  if (summary.catchReturnsDefault) {
    return "default-return";
  }

  return "generic-rethrow";
}

/**
 * Flags catch blocks that convert the original failure into a default value or
 * generic replacement error, making downstream diagnosis harder.
 */
export const errorObscuringRule: RulePlugin = {
  id: "defensive.error-obscuring",
  family: "defensive",
  severity: "strong",
  scope: "file",
  requires: ["file.tryCatchSummaries"],
  supports(context) {
    return context.scope === "file" && Boolean(context.file);
  },
  evaluate(context) {
    const summaries =
      context.runtime.store.getFileFact<TryCatchSummary[]>(
        context.file!.path,
        "file.tryCatchSummaries",
      ) ?? [];

    const flagged = summaries.filter(
      (summary) =>
        isValidTryCatchTarget(summary) &&
        summary.tryStatementCount <= 2 &&
        (summary.catchReturnsDefault ||
          summary.catchThrowsGeneric ||
          (summary.catchHasLogging && summary.catchHasDefaultReturn)),
    );

    if (flagged.length === 0) {
      return [];
    }

    const deltaOccurrences = assignStableOrdinals(
      flagged,
      (summary) =>
        JSON.stringify({
          ...buildTryCatchIdentityBase(summary),
          kind: obscuringKind(summary),
        }),
      (summary) => summary.line,
    ).map(({ value, ordinal }) => ({
      path: context.file!.path,
      line: value.line,
      occurrenceKey: {
        path: context.file!.path,
        kind: obscuringKind(value),
        ...buildTryCatchIdentityBase(value),
        ordinal,
      },
    }));

    return [
      {
        ruleId: "defensive.error-obscuring",
        family: "defensive",
        severity: "strong",
        scope: "file",
        path: context.file!.path,
        message: `Found ${flagged.length} error-obscuring catch block${flagged.length === 1 ? "" : "s"}`,
        evidence: flagged.map(
          (summary) =>
            `line ${summary.line}: ${obscuringKind(summary)}, boundary=${formatTryCatchBoundary(summary)}`,
        ),
        score: Math.min(
          8,
          flagged.reduce((total, summary) => total + scoreTryCatch(summary), 0),
        ),
        locations: flagged.map((summary) => ({ path: context.file!.path, line: summary.line })),
        deltaIdentity: createFindingDeltaIdentity("defensive.error-obscuring", deltaOccurrences),
      },
    ];
  },
};
