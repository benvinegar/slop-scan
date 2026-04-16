import type { RulePlugin } from "../core/types";
import type { TryCatchSummary } from "../facts/types";
import { delta } from "../rule-delta";
import {
  formatTryCatchBoundary,
  isValidTryCatchTarget,
  scoreTryCatch,
} from "./try-catch-rule-helpers";

/**
 * Keeps evidence strings aligned on the same catch-transformation categories the rule reports.
 */
function obscuringKind(summary: TryCatchSummary): string {
  if (summary.catchHasLogging && summary.catchHasDefaultReturn) {
    return "log+default";
  }

  if (summary.catchReturnsDefault) {
    return "default-return";
  }

  return "generic-rethrow";
}

function findErrorObscuringSummaries(summaries: TryCatchSummary[]): TryCatchSummary[] {
  return summaries.filter(
    (summary) =>
      isValidTryCatchTarget(summary) &&
      summary.tryStatementCount <= 2 &&
      (summary.catchReturnsDefault ||
        summary.catchThrowsGeneric ||
        (summary.catchHasLogging && summary.catchHasDefaultReturn)),
  );
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
  // These catches are stable enough in practice that path+line matching keeps
  // delta code far simpler than a second semantic reconstruction pass.
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

    const flagged = findErrorObscuringSummaries(summaries);

    if (flagged.length === 0) {
      return [];
    }

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
      },
    ];
  },
};
