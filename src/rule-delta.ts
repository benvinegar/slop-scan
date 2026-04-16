import type { FindingDeltaIdentity, FindingLocation, RuleFinding } from "./core/types";
import { createFindingDeltaIdentity, createPathDeltaIdentity } from "./delta-identity";

export type DeltaStrategy = { mode: "path" } | { mode: "locations" };

/**
 * Keeps the public delta API intentionally small: either match one problem per path,
 * or match one problem per reported location.
 */
export const delta = {
  byPath(): DeltaStrategy {
    return { mode: "path" };
  },

  byLocations(): DeltaStrategy {
    return { mode: "locations" };
  },
};

function compareLocations(left: FindingLocation, right: FindingLocation): number {
  return (
    left.path.localeCompare(right.path) ||
    left.line - right.line ||
    (left.column ?? 1) - (right.column ?? 1)
  );
}

/**
 * Normalizes and deduplicates reported locations so path/line-based fingerprints do not depend on traversal order.
 */
function uniqueSortedLocations(finding: RuleFinding): FindingLocation[] {
  const fallbackLocations = finding.path
    ? [
        {
          path: finding.path,
          line: 1,
          column: 1,
        },
      ]
    : [];
  const locations = finding.locations.length > 0 ? finding.locations : fallbackLocations;
  const seen = new Set<string>();

  return [...locations].sort(compareLocations).filter((location) => {
    const key = `${location.path}:${location.line}:${location.column ?? 1}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

/**
 * Gives pathless findings a weak but explicit identity so delta JSON can still stay on the fingerprinted code path.
 */
function createFallbackDeltaIdentity(ruleId: string, finding: RuleFinding): FindingDeltaIdentity {
  return createFindingDeltaIdentity(ruleId, [
    {
      occurrenceKey: {
        scope: finding.scope,
        path: finding.path ?? null,
        message: finding.message,
      },
    },
  ]);
}

/**
 * Uses the finding path as the stable identity and keeps the best available line only for display.
 */
function buildPathDeltaIdentity(ruleId: string, finding: RuleFinding): FindingDeltaIdentity {
  const primaryLocation = uniqueSortedLocations(finding)[0];
  const path = finding.path ?? primaryLocation?.path;

  if (!path) {
    return createFallbackDeltaIdentity(ruleId, finding);
  }

  return createPathDeltaIdentity(ruleId, path, primaryLocation?.line ?? 1);
}

/**
 * Treats every reported location as a separate occurrence. This is the cheap, easy-to-reason-about option for most file rules.
 */
function buildLocationsDeltaIdentity(ruleId: string, finding: RuleFinding): FindingDeltaIdentity {
  const locations = uniqueSortedLocations(finding);

  if (locations.length === 0) {
    return buildPathDeltaIdentity(ruleId, finding);
  }

  return createFindingDeltaIdentity(
    ruleId,
    locations.map((location) => ({
      path: location.path,
      line: location.line,
      column: location.column,
      occurrenceKey: {
        path: location.path,
        line: location.line,
        column: location.column ?? 1,
      },
    })),
  );
}

/**
 * Semantic delta keys are the minimal custom escape hatch: rules attach the stable string key while they already have the match in hand,
 * and the engine turns those keys into the standard hashed delta identity payload.
 */
function buildSemanticKeysDeltaIdentity(
  ruleId: string,
  finding: RuleFinding,
): FindingDeltaIdentity | null {
  if (!finding.deltaKeys || finding.deltaKeys.length === 0) {
    return null;
  }

  return createFindingDeltaIdentity(
    ruleId,
    finding.deltaKeys.map((deltaKey) => ({
      groupKey: deltaKey.group,
      occurrenceKey: deltaKey.key,
      path: deltaKey.path ?? finding.path,
      line: deltaKey.line,
      column: deltaKey.column,
    })),
  );
}

/**
 * Defaults to location-based matching when the rule already reported concrete locations, otherwise falls back to one occurrence per path.
 */
function defaultDeltaStrategy(finding: RuleFinding): DeltaStrategy {
  return uniqueSortedLocations(finding).length > 0 ? delta.byLocations() : delta.byPath();
}

/**
 * Builds the explicit delta payload attached to emitted findings.
 *
 * Order of precedence:
 * 1. a rule can still set deltaIdentity directly
 * 2. a rule can attach semantic deltaKeys for hard clustered cases
 * 3. otherwise we use a simple declared strategy (or a cheap default)
 */
export function buildFindingDeltaIdentity(
  ruleId: string,
  finding: RuleFinding,
  strategy?: DeltaStrategy,
): FindingDeltaIdentity {
  const semanticIdentity = buildSemanticKeysDeltaIdentity(ruleId, finding);
  if (semanticIdentity) {
    return semanticIdentity;
  }

  const effectiveStrategy = strategy ?? defaultDeltaStrategy(finding);
  switch (effectiveStrategy.mode) {
    case "path":
      return buildPathDeltaIdentity(ruleId, finding);
    case "locations":
      return buildLocationsDeltaIdentity(ruleId, finding);
  }
}
