import { describe, expect, test } from "bun:test";
import { FINDING_FINGERPRINT_VERSION, createFindingDeltaIdentity } from "../src/delta-identity";
import {
  buildFindingOccurrences,
  diffReports,
  formatDeltaText,
  parseFailOn,
  shouldFailDelta,
  type DeltaReport,
} from "../src/delta";
import type { AnalysisResult } from "../src/core/types";

/**
 * Provides a hand-built baseline report so delta tests can exercise explicit fingerprints without fixture scans.
 */
function createBaseResult(): AnalysisResult {
  return {
    rootDir: "/tmp/example",
    config: { ignores: [], rules: {}, thresholds: {}, overrides: [] },
    summary: {
      fileCount: 4,
      directoryCount: 1,
      findingCount: 3,
      repoScore: 7,
      physicalLineCount: 40,
      logicalLineCount: 30,
      functionCount: 4,
      normalized: {
        scorePerFile: 1.75,
        scorePerKloc: 233.33,
        scorePerFunction: 1.75,
        findingsPerFile: 0.75,
        findingsPerKloc: 100,
        findingsPerFunction: 0.75,
      },
    },
    files: [],
    directories: [],
    findings: [
      {
        ruleId: "structure.duplicate-function-signatures",
        family: "structure",
        severity: "medium",
        scope: "file",
        message: "Found 2 duplicated function signatures",
        evidence: ["normalizeUser", "normalizeTeam"],
        score: 3,
        path: "src/a.ts",
        locations: [
          { path: "src/a.ts", line: 1, column: 1 },
          { path: "src/b.ts", line: 1, column: 1 },
        ],
        deltaIdentity: createFindingDeltaIdentity("structure.duplicate-function-signatures", [
          {
            groupKey: { clusterFingerprint: "dup-cluster" },
            occurrenceKey: { clusterFingerprint: "dup-cluster", path: "src/a.ts" },
            path: "src/a.ts",
            line: 1,
          },
        ]),
      },
      {
        ruleId: "structure.duplicate-function-signatures",
        family: "structure",
        severity: "medium",
        scope: "file",
        message: "Found 2 duplicated function signatures",
        evidence: ["normalizeUser", "normalizeTeam"],
        score: 3,
        path: "src/b.ts",
        locations: [
          { path: "src/a.ts", line: 1, column: 1 },
          { path: "src/b.ts", line: 1, column: 1 },
        ],
        deltaIdentity: createFindingDeltaIdentity("structure.duplicate-function-signatures", [
          {
            groupKey: { clusterFingerprint: "dup-cluster" },
            occurrenceKey: { clusterFingerprint: "dup-cluster", path: "src/b.ts" },
            path: "src/b.ts",
            line: 1,
          },
        ]),
      },
      {
        ruleId: "defensive.empty-catch",
        family: "defensive",
        severity: "weak",
        scope: "file",
        message: "Found 1 empty catch block",
        evidence: ["line 10"],
        score: 1,
        path: "src/error.ts",
        locations: [{ path: "src/error.ts", line: 10, column: 1 }],
        deltaIdentity: createFindingDeltaIdentity("defensive.empty-catch", [
          {
            path: "src/error.ts",
            line: 10,
            occurrenceKey: {
              path: "src/error.ts",
              enclosingSymbol: "readConfig",
              kind: "empty-catch",
            },
          },
        ]),
      },
    ],
    fileScores: [],
    directoryScores: [],
    repoScore: 7,
    metadata: {
      schemaVersion: 2,
      tool: { name: "slop-scan", version: "0.4.0" },
      configHash: "same-config",
      findingFingerprintVersion: FINDING_FINGERPRINT_VERSION,
      plugins: [],
    },
  };
}

/**
 * Builds the follow-up report where the duplicate cluster grows and a placeholder finding appears.
 */
function createHeadResult(): AnalysisResult {
  return {
    rootDir: "/tmp/example",
    config: { ignores: [], rules: {}, thresholds: {}, overrides: [] },
    summary: {
      fileCount: 5,
      directoryCount: 1,
      findingCount: 4,
      repoScore: 14,
      physicalLineCount: 55,
      logicalLineCount: 42,
      functionCount: 5,
      normalized: {
        scorePerFile: 2.8,
        scorePerKloc: 333.33,
        scorePerFunction: 2.8,
        findingsPerFile: 0.8,
        findingsPerKloc: 95.24,
        findingsPerFunction: 0.8,
      },
    },
    files: [],
    directories: [],
    findings: [
      {
        ruleId: "structure.duplicate-function-signatures",
        family: "structure",
        severity: "medium",
        scope: "file",
        message: "Found 3 duplicated function signatures",
        evidence: ["normalizeUser", "normalizeTeam", "normalizeAccount"],
        score: 4.5,
        path: "src/a.ts",
        locations: [
          { path: "src/a.ts", line: 1, column: 1 },
          { path: "src/b.ts", line: 1, column: 1 },
          { path: "src/c.ts", line: 1, column: 1 },
        ],
        deltaIdentity: createFindingDeltaIdentity("structure.duplicate-function-signatures", [
          {
            groupKey: { clusterFingerprint: "dup-cluster" },
            occurrenceKey: { clusterFingerprint: "dup-cluster", path: "src/a.ts" },
            path: "src/a.ts",
            line: 1,
          },
        ]),
      },
      {
        ruleId: "structure.duplicate-function-signatures",
        family: "structure",
        severity: "medium",
        scope: "file",
        message: "Found 3 duplicated function signatures",
        evidence: ["normalizeUser", "normalizeTeam", "normalizeAccount"],
        score: 4.5,
        path: "src/b.ts",
        locations: [
          { path: "src/a.ts", line: 1, column: 1 },
          { path: "src/b.ts", line: 1, column: 1 },
          { path: "src/c.ts", line: 1, column: 1 },
        ],
        deltaIdentity: createFindingDeltaIdentity("structure.duplicate-function-signatures", [
          {
            groupKey: { clusterFingerprint: "dup-cluster" },
            occurrenceKey: { clusterFingerprint: "dup-cluster", path: "src/b.ts" },
            path: "src/b.ts",
            line: 1,
          },
        ]),
      },
      {
        ruleId: "structure.duplicate-function-signatures",
        family: "structure",
        severity: "medium",
        scope: "file",
        message: "Found 3 duplicated function signatures",
        evidence: ["normalizeUser", "normalizeTeam", "normalizeAccount"],
        score: 4.5,
        path: "src/c.ts",
        locations: [
          { path: "src/a.ts", line: 1, column: 1 },
          { path: "src/b.ts", line: 1, column: 1 },
          { path: "src/c.ts", line: 1, column: 1 },
        ],
        deltaIdentity: createFindingDeltaIdentity("structure.duplicate-function-signatures", [
          {
            groupKey: { clusterFingerprint: "dup-cluster" },
            occurrenceKey: { clusterFingerprint: "dup-cluster", path: "src/c.ts" },
            path: "src/c.ts",
            line: 1,
          },
        ]),
      },
      {
        ruleId: "comments.placeholder-comments",
        family: "comments",
        severity: "weak",
        scope: "file",
        message: "Found 1 placeholder comment",
        evidence: ["TODO"],
        score: 0.5,
        path: "src/todo.ts",
        locations: [{ path: "src/todo.ts", line: 5, column: 1 }],
        deltaIdentity: createFindingDeltaIdentity("comments.placeholder-comments", [
          {
            path: "src/todo.ts",
            line: 5,
            occurrenceKey: {
              path: "src/todo.ts",
              normalizedText: "todo",
              ordinal: 1,
            },
          },
        ]),
      },
    ],
    fileScores: [],
    directoryScores: [],
    repoScore: 14,
    metadata: {
      schemaVersion: 2,
      tool: { name: "slop-scan", version: "0.4.0" },
      configHash: "same-config",
      findingFingerprintVersion: FINDING_FINGERPRINT_VERSION,
      plugins: [],
    },
  };
}

describe("delta helpers", () => {
  test("buildFindingOccurrences prefers explicit fingerprints over grouped raw locations", () => {
    const report = createBaseResult();
    report.findings = [report.findings[0]!];

    const occurrences = buildFindingOccurrences(report);

    expect(occurrences).toHaveLength(1);
    expect(occurrences[0]?.path).toBe("src/a.ts");
    expect(occurrences[0]?.fingerprintVersion).toBe(FINDING_FINGERPRINT_VERSION);
  });

  test("buildFindingOccurrences keeps one explicit occurrence per affected file", () => {
    const occurrences = buildFindingOccurrences(createHeadResult());

    expect(
      occurrences
        .filter((occurrence) => occurrence.ruleId === "structure.duplicate-function-signatures")
        .map((occurrence) => occurrence.path)
        .sort(),
    ).toEqual(["src/a.ts", "src/b.ts", "src/c.ts"]);
  });

  test("diffReports classifies added, resolved, and worsened occurrences", () => {
    const delta = diffReports(createBaseResult(), createHeadResult());

    expect(delta.summary).toMatchObject({
      baseFindingCount: 3,
      headFindingCount: 4,
      netFindingCount: 1,
      addedCount: 2,
      resolvedCount: 1,
      worsenedCount: 2,
      improvedCount: 0,
      changedPathCount: 5,
      hasChanges: true,
    });
    expect(delta.paths.map((pathDelta) => pathDelta.path)).toEqual([
      "src/c.ts",
      "src/a.ts",
      "src/b.ts",
      "src/error.ts",
      "src/todo.ts",
    ]);
    expect(delta.rules).toEqual([
      {
        ruleId: "structure.duplicate-function-signatures",
        family: "structure",
        addedCount: 1,
        resolvedCount: 0,
        worsenedCount: 2,
        improvedCount: 0,
      },
      {
        ruleId: "comments.placeholder-comments",
        family: "comments",
        addedCount: 1,
        resolvedCount: 0,
        worsenedCount: 0,
        improvedCount: 0,
      },
      {
        ruleId: "defensive.empty-catch",
        family: "defensive",
        addedCount: 0,
        resolvedCount: 1,
        worsenedCount: 0,
        improvedCount: 0,
      },
    ]);
    expect(delta.paths[0]?.changes[0]?.groupFingerprint).toContain(
      "structure.duplicate-function-signatures:group:",
    );
  });

  test("formatDeltaText renders a compact human-readable summary", () => {
    const text = formatDeltaText(diffReports(createBaseResult(), createHeadResult()));

    expect(text).toContain("slop-scan delta");
    expect(text).toContain("Occurrence changes:");
    expect(text).toContain("- src/c.ts  Δscore +4.50");
    expect(text).toContain("added  medium  Found 3 duplicated function signatures");
    expect(text).toContain("resolved  weak  Found 1 empty catch block");
  });

  test("diffReports warns when metadata changes between reports", () => {
    const head = createHeadResult();
    head.metadata = {
      ...head.metadata!,
      configHash: "different-config",
      tool: { ...head.metadata!.tool, version: "0.2.1" },
      findingFingerprintVersion: 3,
    };

    const delta = diffReports(createBaseResult(), head);

    expect(delta.warnings.map((warning) => warning.code)).toEqual([
      "tool-version-mismatch",
      "config-hash-mismatch",
      "fingerprint-version-mismatch",
    ]);
  });

  test("parseFailOn and shouldFailDelta support regression-oriented policies", () => {
    const delta: DeltaReport = diffReports(createBaseResult(), createHeadResult());

    expect(parseFailOn("added,worsened")).toEqual(["added", "worsened"]);
    expect(shouldFailDelta(delta, parseFailOn("worsened"))).toBe(true);
    expect(shouldFailDelta(delta, parseFailOn("improved"))).toBe(false);
    expect(shouldFailDelta(delta, parseFailOn("any"))).toBe(true);
  });
});
