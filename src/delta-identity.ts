import type { FindingDeltaIdentity, FindingDeltaOccurrenceIdentity } from "./core/types";
import { stableHash } from "./stable-hash";

export const FINDING_FINGERPRINT_VERSION = 1;

export interface DeltaIdentityDescriptor {
  groupKey?: unknown;
  occurrenceKey?: unknown;
  path?: string;
  line?: number;
  column?: number;
}

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
