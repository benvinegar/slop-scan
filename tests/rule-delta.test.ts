import { describe, expect, test } from "bun:test";
import { createFindingDeltaIdentity, createPathDeltaIdentity } from "../src/delta-identity";
import { buildFindingDeltaIdentity, delta } from "../src/rule-delta";

describe("rule delta strategies", () => {
  test("byPath reuses the stable path fingerprint contract", () => {
    const finding = {
      ruleId: "local/contains-word",
      family: "local",
      severity: "weak" as const,
      scope: "file" as const,
      path: "src/example.ts",
      message: "Found danger in file text",
      evidence: ["danger"],
      score: 1,
      locations: [{ path: "src/example.ts", line: 7, column: 1 }],
    };

    expect(buildFindingDeltaIdentity("local/contains-word", finding, delta.byPath())).toEqual(
      createPathDeltaIdentity("local/contains-word", "src/example.ts", 7),
    );
  });

  test("byLocations emits one occurrence per reported location", () => {
    const finding = {
      ruleId: "local/multi-hit",
      family: "local",
      severity: "weak" as const,
      scope: "file" as const,
      path: "src/example.ts",
      message: "Found 2 hits",
      evidence: ["first", "second"],
      score: 1,
      locations: [
        { path: "src/example.ts", line: 3, column: 1 },
        { path: "src/example.ts", line: 9, column: 1 },
      ],
    };

    expect(buildFindingDeltaIdentity("local/multi-hit", finding, delta.byLocations())).toEqual(
      createFindingDeltaIdentity("local/multi-hit", [
        {
          path: "src/example.ts",
          line: 3,
          column: 1,
          occurrenceKey: { path: "src/example.ts", line: 3, column: 1 },
        },
        {
          path: "src/example.ts",
          line: 9,
          column: 1,
          occurrenceKey: { path: "src/example.ts", line: 9, column: 1 },
        },
      ]),
    );
  });

  test("deltaKeys provide a lightweight semantic escape hatch for clustered rules", () => {
    const finding = {
      ruleId: "local/clustered-duplicates",
      family: "local",
      severity: "medium" as const,
      scope: "file" as const,
      path: "src/example.ts",
      message: "Found 1 duplicate cluster",
      evidence: ["normalizeUser repeated elsewhere"],
      score: 2,
      locations: [{ path: "src/example.ts", line: 5, column: 1 }],
      deltaKeys: [
        {
          key: "dup-cluster:src/example.ts",
          group: "dup-cluster",
          path: "src/example.ts",
          line: 5,
        },
      ],
    };

    expect(buildFindingDeltaIdentity("local/clustered-duplicates", finding)).toEqual(
      createFindingDeltaIdentity("local/clustered-duplicates", [
        {
          groupKey: "dup-cluster",
          occurrenceKey: "dup-cluster:src/example.ts",
          path: "src/example.ts",
          line: 5,
        },
      ]),
    );
  });
});
