import type { RulePlugin } from "../core/types";
import type { FunctionSummary } from "../facts/types";
import { delta } from "../rule-delta";
import { BOUNDARY_WRAPPER_TARGET_PREFIXES } from "./helpers";

type AsyncNoiseMatch = {
  summary: FunctionSummary;
  kind: "return-await" | "async-pass-through";
};

function findAsyncNoiseMatches(functions: FunctionSummary[]): AsyncNoiseMatch[] {
  const redundantReturnAwait = functions.filter((summary) => summary.hasReturnAwaitCall);
  const asyncPassThroughWrappers = functions.filter(
    (summary) =>
      summary.isAsync &&
      !summary.hasAwait &&
      summary.isPassThroughWrapper &&
      !summary.hasReturnAwaitCall &&
      // Edge-facing wrappers often keep async signatures for API consistency.
      !BOUNDARY_WRAPPER_TARGET_PREFIXES.some((prefix) =>
        summary.passThroughTarget?.startsWith(prefix),
      ),
  );

  return [
    ...redundantReturnAwait.map((summary) => ({ summary, kind: "return-await" as const })),
    ...asyncPassThroughWrappers.map((summary) => ({
      summary,
      kind: "async-pass-through" as const,
    })),
  ];
}

/**
 * Flags async-related ceremony that adds little value:
 * - `return await` around a direct call
 * - trivial async pass-through wrappers with no internal awaiting
 *
 * Boundary wrappers are exempted because framework, network, storage, and other
 * edge-facing code often preserves async signatures on purpose.
 */
export const asyncNoiseRule: RulePlugin = {
  id: "defensive.async-noise",
  family: "defensive",
  severity: "medium",
  scope: "file",
  requires: ["file.functionSummaries"],
  // Async-noise sites usually stay on the same lines, so simple path+line
  // matching is easier to maintain than a heavier semantic fingerprint.
  delta: delta.byLocations(),
  supports(context) {
    return context.scope === "file" && Boolean(context.file);
  },
  evaluate(context) {
    const functions =
      context.runtime.store.getFileFact<FunctionSummary[]>(
        context.file!.path,
        "file.functionSummaries",
      ) ?? [];

    // Keep the two sub-signals separate so we can weight redundant `return await`
    // more heavily than a plain pass-through async wrapper.
    const noisy = findAsyncNoiseMatches(functions);

    if (noisy.length === 0) {
      return [];
    }

    const redundantReturnAwaitCount = noisy.filter(({ kind }) => kind === "return-await").length;
    const asyncPassThroughWrapperCount = noisy.length - redundantReturnAwaitCount;

    // Bound the contribution from one file so this stays a hotspot signal rather
    // than dominating the total repo score.
    const score = Math.min(
      4,
      redundantReturnAwaitCount * 1.5 + asyncPassThroughWrapperCount * 0.75,
    );

    return [
      {
        ruleId: "defensive.async-noise",
        family: "defensive",
        severity: "medium",
        scope: "file",
        path: context.file!.path,
        message: `Found ${noisy.length} async-noise pattern${noisy.length === 1 ? "" : "s"}`,
        evidence: noisy.map(
          ({ summary, kind }) => `${summary.name} at line ${summary.line} (${kind})`,
        ),
        score,
        locations: noisy.map(({ summary }) => ({ path: context.file!.path, line: summary.line })),
      },
    ];
  },
};
