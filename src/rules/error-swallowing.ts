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

/**
 * Flags catch blocks that only log and then continue without changing control
 * flow. This is the clearest "we noticed the error but effectively ignored it"
 * pattern in generated defensive code.
 */
export const errorSwallowingRule: RulePlugin = {
  id: "defensive.error-swallowing",
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
        isValidTryCatchTarget(summary) && summary.tryStatementCount <= 2 && summary.catchLogsOnly,
    );

    if (flagged.length === 0) {
      return [];
    }

    const deltaOccurrences = assignStableOrdinals(
      flagged,
      (summary) =>
        JSON.stringify({
          ...buildTryCatchIdentityBase(summary),
          kind: "log-only",
        }),
      (summary) => summary.line,
    ).map(({ value, ordinal }) => ({
      path: context.file!.path,
      line: value.line,
      occurrenceKey: {
        path: context.file!.path,
        kind: "log-only",
        ...buildTryCatchIdentityBase(value),
        ordinal,
      },
    }));

    return [
      {
        ruleId: "defensive.error-swallowing",
        family: "defensive",
        severity: "strong",
        scope: "file",
        path: context.file!.path,
        message: `Found ${flagged.length} log-and-continue catch block${flagged.length === 1 ? "" : "s"}`,
        evidence: flagged.map(
          (summary) =>
            `line ${summary.line}: catch logs only, boundary=${formatTryCatchBoundary(summary)}`,
        ),
        score: Math.min(
          8,
          flagged.reduce((total, summary) => total + scoreTryCatch(summary), 0),
        ),
        locations: flagged.map((summary) => ({ path: context.file!.path, line: summary.line })),
        deltaIdentity: createFindingDeltaIdentity("defensive.error-swallowing", deltaOccurrences),
      },
    ];
  },
};
