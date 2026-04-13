import type {
  AnalysisResult,
  AnalysisSummary,
  Finding,
  FindingLocation,
  ReportMetadata,
  Scope,
} from "./core/types";
import {
  REPORT_SCHEMA_VERSION,
  TOOL_NAME,
  TOOL_VERSION,
  getReportMetadata,
} from "./report-metadata";

const SCORE_EPSILON = 1e-9;
const MAX_TEXT_PATHS = 10;
const MAX_TEXT_CHANGES_PER_PATH = 3;
const MAX_TEXT_LOCATIONS = 3;

export type DeltaStatus = "added" | "resolved" | "worsened" | "improved";
export type DeltaFailOn = DeltaStatus | "any";

export interface FindingOccurrence {
  fingerprint: string;
  identityKey: string;
  fingerprintVersion: number | null;
  groupFingerprint?: string;
  scope: Scope;
  path: string | null;
  locations: FindingLocation[];
  primaryLocation: FindingLocation | null;
  ruleId: string;
  family: string;
  severity: Finding["severity"];
  message: string;
  evidence: string[];
  score: number;
}

export interface DeltaOccurrenceSnapshot {
  fingerprint: string;
  fingerprintVersion: number | null;
  groupFingerprint?: string;
  scope: Scope;
  path: string | null;
  locations: FindingLocation[];
  primaryLocation: FindingLocation | null;
  ruleId: string;
  family: string;
  severity: Finding["severity"];
  message: string;
  evidence: string[];
  score: number;
}

export interface DeltaChange {
  status: DeltaStatus;
  scope: Scope;
  path: string | null;
  ruleId: string;
  family: string;
  fingerprint: string;
  fingerprintVersion: number | null;
  groupFingerprint?: string;
  base: DeltaOccurrenceSnapshot | null;
  head: DeltaOccurrenceSnapshot | null;
}

export interface DeltaWarning {
  code:
    | "schema-version-mismatch"
    | "tool-version-mismatch"
    | "config-hash-mismatch"
    | "fingerprint-version-mismatch";
  message: string;
}

export interface DeltaPath {
  path: string;
  baseScore: number;
  headScore: number;
  scoreDelta: number;
  addedCount: number;
  resolvedCount: number;
  worsenedCount: number;
  improvedCount: number;
  changes: DeltaChange[];
}

export interface DeltaRuleSummary {
  ruleId: string;
  family: string;
  addedCount: number;
  resolvedCount: number;
  worsenedCount: number;
  improvedCount: number;
}

export interface DeltaEndpoint {
  rootDir: string;
  metadata: ReportMetadata;
  summary: AnalysisSummary;
}

export interface DeltaSummary {
  baseFindingCount: number;
  headFindingCount: number;
  netFindingCount: number;
  baseRepoScore: number;
  headRepoScore: number;
  netRepoScore: number;
  addedCount: number;
  resolvedCount: number;
  worsenedCount: number;
  improvedCount: number;
  unchangedCount: number;
  changedPathCount: number;
  hasChanges: boolean;
}

export interface DeltaReport {
  schemaVersion: number;
  tool: {
    name: string;
    version: string;
  };
  base: DeltaEndpoint;
  head: DeltaEndpoint;
  summary: DeltaSummary;
  warnings: DeltaWarning[];
  paths: DeltaPath[];
  repoChanges: DeltaChange[];
  rules: DeltaRuleSummary[];
}

function severityRank(severity: Finding["severity"]): number {
  switch (severity) {
    case "weak":
      return 1;
    case "medium":
      return 2;
    case "strong":
      return 3;
  }
}

function compareLocations(left: FindingLocation, right: FindingLocation): number {
  return (
    left.path.localeCompare(right.path) ||
    left.line - right.line ||
    (left.column ?? 1) - (right.column ?? 1)
  );
}

function compareOptionalLocations(
  left: FindingLocation | null,
  right: FindingLocation | null,
): number {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return compareLocations(left, right);
}

function uniqueSortedLocations(finding: Finding): FindingLocation[] {
  const fallbackPath = finding.path ?? null;
  const fallbackLocations = fallbackPath
    ? [
        {
          path: fallbackPath,
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

function compareOccurrences(left: FindingOccurrence, right: FindingOccurrence): number {
  return (
    compareOptionalLocations(left.primaryLocation, right.primaryLocation) ||
    right.score - left.score ||
    severityRank(right.severity) - severityRank(left.severity) ||
    left.message.localeCompare(right.message) ||
    left.family.localeCompare(right.family)
  );
}

function occurrenceFingerprint(occurrence: FindingOccurrence, index: number): string {
  return JSON.stringify({
    scope: occurrence.scope,
    ruleId: occurrence.ruleId,
    path: occurrence.path,
    occurrence: index + 1,
  });
}

function toOccurrenceSnapshot(occurrence: FindingOccurrence): DeltaOccurrenceSnapshot {
  return {
    fingerprint: occurrence.fingerprint,
    fingerprintVersion: occurrence.fingerprintVersion,
    groupFingerprint: occurrence.groupFingerprint,
    scope: occurrence.scope,
    path: occurrence.path,
    locations: occurrence.locations,
    primaryLocation: occurrence.primaryLocation,
    ruleId: occurrence.ruleId,
    family: occurrence.family,
    severity: occurrence.severity,
    message: occurrence.message,
    evidence: occurrence.evidence,
    score: occurrence.score,
  };
}

function buildExplicitFindingOccurrences(finding: Finding): FindingOccurrence[] {
  if (!finding.deltaIdentity || finding.deltaIdentity.occurrences.length === 0) {
    return [];
  }

  const fallbackLocations = uniqueSortedLocations(finding);

  return finding.deltaIdentity.occurrences.map((occurrence) => {
    const path = occurrence.path ?? finding.path ?? null;
    const primaryLocation =
      path && occurrence.line !== undefined
        ? {
            path,
            line: occurrence.line,
            column: occurrence.column ?? 1,
          }
        : null;
    const locations = primaryLocation
      ? [primaryLocation]
      : path
        ? fallbackLocations.filter((location) => location.path === path)
        : [];

    return {
      fingerprint: occurrence.fingerprint,
      identityKey: occurrence.fingerprint,
      fingerprintVersion: finding.deltaIdentity!.fingerprintVersion,
      groupFingerprint: occurrence.groupFingerprint,
      scope: finding.scope,
      path,
      locations,
      primaryLocation: primaryLocation ?? locations[0] ?? null,
      ruleId: finding.ruleId,
      family: finding.family,
      severity: finding.severity,
      message: finding.message,
      evidence: finding.evidence,
      score: finding.score,
    };
  });
}

export function buildFindingOccurrences(
  report: AnalysisResult | null | undefined,
): FindingOccurrence[] {
  const occurrences: FindingOccurrence[] = [];

  for (const finding of report?.findings ?? []) {
    const explicitOccurrences = buildExplicitFindingOccurrences(finding);
    if (explicitOccurrences.length > 0) {
      occurrences.push(...explicitOccurrences);
      continue;
    }

    const locations = uniqueSortedLocations(finding);
    const locationsByPath = new Map<string | null, FindingLocation[]>();

    if (locations.length === 0) {
      locationsByPath.set(finding.path ?? null, []);
    } else {
      for (const location of locations) {
        const existing = locationsByPath.get(location.path) ?? [];
        existing.push(location);
        locationsByPath.set(location.path, existing);
      }
    }

    for (const [path, scopedLocations] of locationsByPath.entries()) {
      occurrences.push({
        fingerprint: "",
        identityKey: JSON.stringify({ scope: finding.scope, ruleId: finding.ruleId, path }),
        fingerprintVersion: null,
        scope: finding.scope,
        path,
        locations: scopedLocations,
        primaryLocation: scopedLocations[0] ?? null,
        ruleId: finding.ruleId,
        family: finding.family,
        severity: finding.severity,
        message: finding.message,
        evidence: finding.evidence,
        score: finding.score,
      });
    }
  }

  const occurrencesByKey = new Map<string, FindingOccurrence[]>();
  for (const occurrence of occurrences) {
    const existing = occurrencesByKey.get(occurrence.identityKey) ?? [];
    existing.push(occurrence);
    occurrencesByKey.set(occurrence.identityKey, existing);
  }

  const ordered = [...occurrencesByKey.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([, groupedOccurrences]) => {
      const sorted = [...groupedOccurrences].sort(compareOccurrences);
      return sorted.map((occurrence, index) => ({
        ...occurrence,
        fingerprint:
          occurrence.fingerprint.length > 0
            ? occurrence.fingerprint
            : occurrenceFingerprint(occurrence, index),
      }));
    });

  return ordered;
}

function groupOccurrencesByIdentity(report: AnalysisResult) {
  const grouped = new Map<string, FindingOccurrence[]>();

  for (const occurrence of buildFindingOccurrences(report)) {
    const existing = grouped.get(occurrence.identityKey) ?? [];
    existing.push(occurrence);
    grouped.set(occurrence.identityKey, existing);
  }

  return grouped;
}

function classifyPairedOccurrence(
  baseOccurrence: FindingOccurrence,
  headOccurrence: FindingOccurrence,
): DeltaStatus | null {
  const scoreDelta = headOccurrence.score - baseOccurrence.score;
  if (Math.abs(scoreDelta) > SCORE_EPSILON) {
    return scoreDelta > 0 ? "worsened" : "improved";
  }

  const severityDelta =
    severityRank(headOccurrence.severity) - severityRank(baseOccurrence.severity);
  if (severityDelta !== 0) {
    return severityDelta > 0 ? "worsened" : "improved";
  }

  const locationDelta = headOccurrence.locations.length - baseOccurrence.locations.length;
  if (locationDelta !== 0) {
    return locationDelta > 0 ? "worsened" : "improved";
  }

  return null;
}

function compareChanges(left: DeltaChange, right: DeltaChange): number {
  const statusOrder: Record<DeltaStatus, number> = {
    added: 0,
    worsened: 1,
    resolved: 2,
    improved: 3,
  };
  const leftSnapshot = left.head ?? left.base;
  const rightSnapshot = right.head ?? right.base;

  return (
    statusOrder[left.status] - statusOrder[right.status] ||
    severityRank((rightSnapshot ?? leftSnapshot)!.severity) -
      severityRank((leftSnapshot ?? rightSnapshot)!.severity) ||
    left.ruleId.localeCompare(right.ruleId) ||
    compareOptionalLocations(
      leftSnapshot?.primaryLocation ?? null,
      rightSnapshot?.primaryLocation ?? null,
    )
  );
}

function buildWarnings(baseMetadata: ReportMetadata, headMetadata: ReportMetadata): DeltaWarning[] {
  const warnings: DeltaWarning[] = [];

  if (baseMetadata.schemaVersion !== headMetadata.schemaVersion) {
    warnings.push({
      code: "schema-version-mismatch",
      message: `Base/head report schema versions differ (${baseMetadata.schemaVersion} vs ${headMetadata.schemaVersion}).`,
    });
  }

  if (baseMetadata.tool.version !== headMetadata.tool.version) {
    warnings.push({
      code: "tool-version-mismatch",
      message: `Base/head slop-scan versions differ (${baseMetadata.tool.version} vs ${headMetadata.tool.version}).`,
    });
  }

  if (baseMetadata.configHash !== headMetadata.configHash) {
    warnings.push({
      code: "config-hash-mismatch",
      message: "Base/head config hashes differ; delta may include config or plugin changes.",
    });
  }

  if (baseMetadata.findingFingerprintVersion !== headMetadata.findingFingerprintVersion) {
    warnings.push({
      code: "fingerprint-version-mismatch",
      message: `Base/head finding fingerprint versions differ (${baseMetadata.findingFingerprintVersion} vs ${headMetadata.findingFingerprintVersion}).`,
    });
  }

  return warnings;
}

function buildPathScoreMap(report: AnalysisResult): Map<string, number> {
  const scores = new Map<string, number>();

  for (const finding of report.findings) {
    if (!finding.path) {
      continue;
    }

    scores.set(finding.path, (scores.get(finding.path) ?? 0) + finding.score);
  }

  return scores;
}

function buildRuleSummaries(changes: DeltaChange[]): DeltaRuleSummary[] {
  const grouped = new Map<string, DeltaRuleSummary>();

  for (const change of changes) {
    const current = grouped.get(change.ruleId) ?? {
      ruleId: change.ruleId,
      family: change.family,
      addedCount: 0,
      resolvedCount: 0,
      worsenedCount: 0,
      improvedCount: 0,
    };

    switch (change.status) {
      case "added":
        current.addedCount += 1;
        break;
      case "resolved":
        current.resolvedCount += 1;
        break;
      case "worsened":
        current.worsenedCount += 1;
        break;
      case "improved":
        current.improvedCount += 1;
        break;
    }

    grouped.set(change.ruleId, current);
  }

  return [...grouped.values()].sort(
    (left, right) =>
      right.addedCount + right.worsenedCount - (left.addedCount + left.worsenedCount) ||
      right.resolvedCount + right.improvedCount - (left.resolvedCount + left.improvedCount) ||
      left.ruleId.localeCompare(right.ruleId),
  );
}

export function diffReports(baseReport: AnalysisResult, headReport: AnalysisResult): DeltaReport {
  const baseMetadata = getReportMetadata(baseReport);
  const headMetadata = getReportMetadata(headReport);
  const baseOccurrences = groupOccurrencesByIdentity(baseReport);
  const headOccurrences = groupOccurrencesByIdentity(headReport);
  const identityKeys = new Set([...baseOccurrences.keys(), ...headOccurrences.keys()]);
  const changes: DeltaChange[] = [];
  let unchangedCount = 0;

  for (const identityKey of [...identityKeys].sort((left, right) => left.localeCompare(right))) {
    const baseGroup = baseOccurrences.get(identityKey) ?? [];
    const headGroup = headOccurrences.get(identityKey) ?? [];
    const comparisonCount = Math.max(baseGroup.length, headGroup.length);

    for (let index = 0; index < comparisonCount; index += 1) {
      const baseOccurrence = baseGroup[index] ?? null;
      const headOccurrence = headGroup[index] ?? null;

      if (baseOccurrence && headOccurrence) {
        const status = classifyPairedOccurrence(baseOccurrence, headOccurrence);
        if (!status) {
          unchangedCount += 1;
          continue;
        }

        changes.push({
          status,
          scope: headOccurrence.scope,
          path: headOccurrence.path,
          ruleId: headOccurrence.ruleId,
          family: headOccurrence.family,
          fingerprint: headOccurrence.fingerprint,
          fingerprintVersion: headOccurrence.fingerprintVersion,
          groupFingerprint: headOccurrence.groupFingerprint,
          base: toOccurrenceSnapshot(baseOccurrence),
          head: toOccurrenceSnapshot(headOccurrence),
        });
        continue;
      }

      if (headOccurrence) {
        changes.push({
          status: "added",
          scope: headOccurrence.scope,
          path: headOccurrence.path,
          ruleId: headOccurrence.ruleId,
          family: headOccurrence.family,
          fingerprint: headOccurrence.fingerprint,
          fingerprintVersion: headOccurrence.fingerprintVersion,
          groupFingerprint: headOccurrence.groupFingerprint,
          base: null,
          head: toOccurrenceSnapshot(headOccurrence),
        });
        continue;
      }

      if (baseOccurrence) {
        changes.push({
          status: "resolved",
          scope: baseOccurrence.scope,
          path: baseOccurrence.path,
          ruleId: baseOccurrence.ruleId,
          family: baseOccurrence.family,
          fingerprint: baseOccurrence.fingerprint,
          fingerprintVersion: baseOccurrence.fingerprintVersion,
          groupFingerprint: baseOccurrence.groupFingerprint,
          base: toOccurrenceSnapshot(baseOccurrence),
          head: null,
        });
      }
    }
  }

  const changesByPath = new Map<string, DeltaChange[]>();
  const repoChanges: DeltaChange[] = [];
  for (const change of changes) {
    if (!change.path) {
      repoChanges.push(change);
      continue;
    }

    const existing = changesByPath.get(change.path) ?? [];
    existing.push(change);
    changesByPath.set(change.path, existing);
  }

  const baseScores = buildPathScoreMap(baseReport);
  const headScores = buildPathScoreMap(headReport);
  const paths = [...changesByPath.entries()]
    .map(([path, pathChanges]) => ({
      path,
      baseScore: baseScores.get(path) ?? 0,
      headScore: headScores.get(path) ?? 0,
      scoreDelta: (headScores.get(path) ?? 0) - (baseScores.get(path) ?? 0),
      addedCount: pathChanges.filter((change) => change.status === "added").length,
      resolvedCount: pathChanges.filter((change) => change.status === "resolved").length,
      worsenedCount: pathChanges.filter((change) => change.status === "worsened").length,
      improvedCount: pathChanges.filter((change) => change.status === "improved").length,
      changes: [...pathChanges].sort(compareChanges),
    }))
    .sort(
      (left, right) =>
        Math.abs(right.scoreDelta) - Math.abs(left.scoreDelta) ||
        right.changes.length - left.changes.length ||
        left.path.localeCompare(right.path),
    );

  const sortedRepoChanges = [...repoChanges].sort(compareChanges);
  const summary: DeltaSummary = {
    baseFindingCount: baseReport.summary.findingCount,
    headFindingCount: headReport.summary.findingCount,
    netFindingCount: headReport.summary.findingCount - baseReport.summary.findingCount,
    baseRepoScore: baseReport.summary.repoScore,
    headRepoScore: headReport.summary.repoScore,
    netRepoScore: headReport.summary.repoScore - baseReport.summary.repoScore,
    addedCount: changes.filter((change) => change.status === "added").length,
    resolvedCount: changes.filter((change) => change.status === "resolved").length,
    worsenedCount: changes.filter((change) => change.status === "worsened").length,
    improvedCount: changes.filter((change) => change.status === "improved").length,
    unchangedCount,
    changedPathCount: paths.length,
    hasChanges: changes.length > 0,
  };

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    tool: {
      name: TOOL_NAME,
      version: TOOL_VERSION,
    },
    base: {
      rootDir: baseReport.rootDir,
      metadata: baseMetadata,
      summary: baseReport.summary,
    },
    head: {
      rootDir: headReport.rootDir,
      metadata: headMetadata,
      summary: headReport.summary,
    },
    summary,
    warnings: buildWarnings(baseMetadata, headMetadata),
    paths,
    repoChanges: sortedRepoChanges,
    rules: buildRuleSummaries(changes),
  };
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatSignedInteger(value: number): string {
  return `${value > 0 ? "+" : ""}${value}`;
}

function formatSignedScore(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}

function formatLocation(location: FindingLocation): string {
  return `${location.line}:${location.column ?? 1}`;
}

function formatLocationsInline(snapshot: DeltaOccurrenceSnapshot | null): string {
  if (!snapshot || snapshot.locations.length === 0) {
    return "";
  }

  const preview = snapshot.locations.slice(0, MAX_TEXT_LOCATIONS).map(formatLocation);
  const hiddenCount = snapshot.locations.length - preview.length;

  return hiddenCount > 0
    ? ` @ ${preview.join(", ")}, ... (+${hiddenCount} more)`
    : ` @ ${preview.join(", ")}`;
}

function formatChangeLine(change: DeltaChange): string {
  const snapshot = change.head ?? change.base;
  const scoreSuffix =
    change.base && change.head
      ? ` (score ${change.base.score.toFixed(2)} -> ${change.head.score.toFixed(2)})`
      : ` (score ${(snapshot?.score ?? 0).toFixed(2)})`;

  return `  - ${change.status}  ${snapshot?.severity ?? "medium"}  ${snapshot?.message ?? change.ruleId}  ${change.ruleId}${formatLocationsInline(snapshot)}${scoreSuffix}`;
}

export function formatDeltaText(delta: DeltaReport): string {
  const lines = [
    "slop-scan delta",
    `findings: ${delta.summary.baseFindingCount} -> ${delta.summary.headFindingCount} (${formatSignedInteger(delta.summary.netFindingCount)})`,
    `repo score: ${delta.summary.baseRepoScore.toFixed(2)} -> ${delta.summary.headRepoScore.toFixed(2)} (${formatSignedScore(delta.summary.netRepoScore)})`,
    "",
    "Occurrence changes:",
    `- added: ${delta.summary.addedCount}`,
    `- resolved: ${delta.summary.resolvedCount}`,
    `- worsened: ${delta.summary.worsenedCount}`,
    `- improved: ${delta.summary.improvedCount}`,
  ];

  if (delta.warnings.length > 0) {
    lines.push("", "Warnings:");
    for (const warning of delta.warnings) {
      lines.push(`- ${warning.message}`);
    }
  }

  if (!delta.summary.hasChanges) {
    lines.push("", "No occurrence-level changes.");
    return lines.join("\n");
  }

  if (delta.paths.length > 0) {
    lines.push("", `Changed paths (${pluralize(delta.paths.length, "path")}):`);

    for (const pathDelta of delta.paths.slice(0, MAX_TEXT_PATHS)) {
      lines.push(
        `- ${pathDelta.path}  Δscore ${formatSignedScore(pathDelta.scoreDelta)}  added ${pathDelta.addedCount}, worsened ${pathDelta.worsenedCount}, resolved ${pathDelta.resolvedCount}, improved ${pathDelta.improvedCount}`,
      );

      for (const change of pathDelta.changes.slice(0, MAX_TEXT_CHANGES_PER_PATH)) {
        lines.push(formatChangeLine(change));
      }

      const hiddenCount = pathDelta.changes.length - MAX_TEXT_CHANGES_PER_PATH;
      if (hiddenCount > 0) {
        lines.push(`  ... ${hiddenCount} more change${hiddenCount === 1 ? "" : "s"}`);
      }
    }

    const hiddenPathCount = delta.paths.length - MAX_TEXT_PATHS;
    if (hiddenPathCount > 0) {
      lines.push(`... ${hiddenPathCount} more path${hiddenPathCount === 1 ? "" : "s"}`);
    }
  }

  if (delta.repoChanges.length > 0) {
    lines.push("", `Repo-scoped changes (${pluralize(delta.repoChanges.length, "change")}):`);
    for (const change of delta.repoChanges) {
      lines.push(formatChangeLine(change));
    }
  }

  return lines.join("\n");
}

export function parseFailOn(value: string): DeltaFailOn[] {
  const rawValues = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (rawValues.length === 0) {
    throw new Error("Pass at least one status to --fail-on.");
  }

  const allowed = new Set<DeltaFailOn>(["added", "resolved", "worsened", "improved", "any"]);
  const failOn: DeltaFailOn[] = [];

  for (const rawValue of rawValues) {
    if (!allowed.has(rawValue as DeltaFailOn)) {
      throw new Error(
        `Unknown --fail-on status: ${rawValue}. Use added,resolved,worsened,improved,any.`,
      );
    }

    const normalized = rawValue as DeltaFailOn;
    if (!failOn.includes(normalized)) {
      failOn.push(normalized);
    }
  }

  return failOn;
}

export function shouldFailDelta(delta: DeltaReport, failOn: DeltaFailOn[]): boolean {
  if (failOn.length === 0) {
    return false;
  }

  if (failOn.includes("any")) {
    return delta.summary.hasChanges;
  }

  return failOn.some((status) => {
    switch (status) {
      case "added":
        return delta.summary.addedCount > 0;
      case "resolved":
        return delta.summary.resolvedCount > 0;
      case "worsened":
        return delta.summary.worsenedCount > 0;
      case "improved":
        return delta.summary.improvedCount > 0;
      case "any":
        return delta.summary.hasChanges;
    }
  });
}
