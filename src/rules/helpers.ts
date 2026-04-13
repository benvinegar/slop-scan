// These segments are intentionally conservative. The goal is to recognize common
// asset buckets like icon packs without teaching the analyzer that arbitrary
// directories full of tiny files are always harmless.
const ASSET_LIKE_DIRECTORY_SEGMENTS = new Set(["icon", "icons", "svg", "svgs", "asset", "assets"]);

// Thin wrappers around these targets are often boundary/framework adapters, so
// rules such as async-noise and pass-through-wrappers treat them more leniently.
export const BOUNDARY_WRAPPER_TARGET_PREFIXES = [
  "prisma.",
  "redis.",
  "jwt.",
  "bcrypt.",
  "response.",
  "Response.",
  "fetch",
  "axios.",
  "crypto.",
  "storage.",
];

export function ratio(count: number, total: number): number {
  return total === 0 ? 0 : count / total;
}

export function countMatching<T>(values: T[], predicate: (value: T) => boolean): number {
  return values.reduce((total, value) => total + (predicate(value) ? 1 : 0), 0);
}

export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function normalizeWhitespace(value: string): string {
  const trimmed = value.trim();
  const collapsed = trimmed.replace(/\s+/g, " ");
  return collapsed.toLowerCase();
}

export function assignStableOrdinals<T>(
  values: T[],
  keyOf: (value: T) => string,
  lineOf: (value: T) => number,
): Array<{ value: T; ordinal: number }> {
  const counts = new Map<string, number>();

  return [...values]
    .sort((left, right) => lineOf(left) - lineOf(right) || keyOf(left).localeCompare(keyOf(right)))
    .map((value) => {
      const key = keyOf(value);
      const ordinal = (counts.get(key) ?? 0) + 1;
      counts.set(key, ordinal);
      return { value, ordinal };
    });
}

export function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle] ?? 0;
  }

  const left = sorted[middle - 1] ?? 0;
  const right = sorted[middle] ?? 0;
  return (left + right) / 2;
}

/**
 * Treat icon/svg/asset folders specially so structural rules do not confuse a
 * generated asset pack with a suspiciously fragmented code directory.
 */
export function isAssetLikeDirectoryPath(directoryPath: string): boolean {
  return directoryPath
    .split("/")
    .map((segment) => segment.toLowerCase())
    .some((segment) => ASSET_LIKE_DIRECTORY_SEGMENTS.has(segment));
}
