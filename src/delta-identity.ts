import type { FindingDeltaIdentity, FindingDeltaOccurrenceIdentity } from "./core/types";
import { stableHash } from "./stable-hash";

export const FINDING_FINGERPRINT_VERSION = 2;

/**
 * Describes one stable delta occurrence before it is hashed.
 *
 * - groupKey: optional shared key for a larger cluster (for example one duplicate family)
 * - occurrenceKey: the stable "name tag" for this specific member occurrence
 * - path/line/column: carried through for delta display and path scoping
 */
export interface DeltaIdentityDescriptor {
  groupKey?: unknown;
  occurrenceKey?: unknown;
  path?: string;
  line?: number;
  column?: number;
}

/**
 * Canonicalizes descriptor ordering so equivalent rule output hashes to the same fingerprint set.
 */
function compareDescriptors(left: DeltaIdentityDescriptor, right: DeltaIdentityDescriptor): number {
  return (
    (left.path ?? "").localeCompare(right.path ?? "") ||
    (left.line ?? 1) - (right.line ?? 1) ||
    (left.column ?? 1) - (right.column ?? 1) ||
    stableHash(left.groupKey ?? left.occurrenceKey ?? null).localeCompare(
      stableHash(right.groupKey ?? right.occurrenceKey ?? null),
    )
  );
}

/**
 * Produces a cluster-level fingerprint that can survive message churn when the same group grows or shrinks.
 */
export function createDeltaGroupFingerprint(ruleId: string, groupKey: unknown): string {
  return `${ruleId}:group:${stableHash(
    {
      fingerprintVersion: FINDING_FINGERPRINT_VERSION,
      ruleId,
      groupKey,
    },
    20,
  )}`;
}

/**
 * Produces the concrete occurrence fingerprint consumed by report-to-report diffing.
 */
export function createDeltaOccurrenceFingerprint(ruleId: string, occurrenceKey: unknown): string {
  return `${ruleId}:occ:${stableHash(
    {
      fingerprintVersion: FINDING_FINGERPRINT_VERSION,
      ruleId,
      occurrenceKey,
    },
    20,
  )}`;
}

/**
 * Deduplicates rule-supplied descriptors and emits the stable occurrence payload stored alongside a finding.
 */
export function createFindingDeltaIdentity(
  ruleId: string,
  descriptors: DeltaIdentityDescriptor[],
): FindingDeltaIdentity {
  const seen = new Set<string>();
  const occurrences: FindingDeltaOccurrenceIdentity[] = [];

  for (const descriptor of [...descriptors].sort(compareDescriptors)) {
    const groupFingerprint =
      descriptor.groupKey === undefined
        ? undefined
        : createDeltaGroupFingerprint(ruleId, descriptor.groupKey);
    const fingerprint = createDeltaOccurrenceFingerprint(ruleId, {
      groupFingerprint,
      occurrenceKey: descriptor.occurrenceKey ??
        descriptor.groupKey ?? {
          path: descriptor.path ?? null,
          line: descriptor.line ?? null,
          column: descriptor.column ?? null,
        },
    });

    if (seen.has(fingerprint)) {
      continue;
    }

    seen.add(fingerprint);
    occurrences.push({
      fingerprint,
      groupFingerprint,
      path: descriptor.path,
      line: descriptor.line,
      column: descriptor.column,
    });
  }

  return {
    fingerprintVersion: FINDING_FINGERPRINT_VERSION,
    occurrences,
  };
}

/**
 * Covers the common case where one finding maps to one stable path-local occurrence.
 */
export function createPathDeltaIdentity(
  ruleId: string,
  path: string,
  line = 1,
): FindingDeltaIdentity {
  return createFindingDeltaIdentity(ruleId, [
    {
      path,
      line,
      occurrenceKey: { path },
    },
  ]);
}
