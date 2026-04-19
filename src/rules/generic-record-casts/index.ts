import * as ts from "typescript";
import type { RulePlugin } from "../../core/types";
import { getLineNumber, unwrapExpression, walk } from "../../facts/ts-helpers";
import { delta } from "../../rule-delta";

const MAX_LOGICAL_LINES = 5000;

const GENERIC_RECORD_KEYS = new Set([
  "data",
  "payload",
  "body",
  "parsed",
  "obj",
  "result",
  "record",
  "config",
  "json",
  "value",
]);

type MatchKind = "record-string-unknown-cast" | "json-parse-record-cast";

type RecordCastMatch = {
  line: number;
  kind: MatchKind;
};

function isRecordStringUnknownType(node: ts.TypeNode): boolean {
  return (
    ts.isTypeReferenceNode(node) &&
    ts.isIdentifier(node.typeName) &&
    node.typeName.text === "Record" &&
    node.typeArguments?.length === 2 &&
    node.typeArguments[0]?.kind === ts.SyntaxKind.StringKeyword &&
    node.typeArguments[1]?.kind === ts.SyntaxKind.UnknownKeyword
  );
}

function isInterestingInitializer(expression: ts.Expression): MatchKind | null {
  const unwrapped = unwrapExpression(expression);

  if (
    ts.isCallExpression(unwrapped) &&
    ts.isPropertyAccessExpression(unwrapped.expression) &&
    ts.isIdentifier(unwrapped.expression.expression) &&
    unwrapped.expression.expression.text === "JSON" &&
    unwrapped.expression.name.text === "parse"
  ) {
    return "json-parse-record-cast";
  }

  return "record-string-unknown-cast";
}

function summarizeAsExpression(
  node: ts.AsExpression,
  sourceFile: ts.SourceFile,
): RecordCastMatch | null {
  if (!isRecordStringUnknownType(node.type)) {
    return null;
  }

  const parent = node.parent;
  if (!ts.isVariableDeclaration(parent) || !ts.isIdentifier(parent.name)) {
    return null;
  }

  if (!GENERIC_RECORD_KEYS.has(parent.name.text)) {
    return null;
  }

  return {
    line: getLineNumber(sourceFile, node.getStart(sourceFile)),
    kind: isInterestingInitializer(node.expression),
  };
}

function findRecordCasts(sourceFile: ts.SourceFile): RecordCastMatch[] {
  const matches: RecordCastMatch[] = [];

  walk(sourceFile, (node) => {
    if (!ts.isAsExpression(node)) {
      return;
    }

    const match = summarizeAsExpression(node, sourceFile);
    if (match) {
      matches.push(match);
    }
  });

  return matches;
}

export const genericRecordCastsRule: RulePlugin = {
  id: "types.generic-record-casts",
  family: "types",
  severity: "strong",
  scope: "file",
  requires: ["file.ast"],
  delta: delta.byLocations(),
  supports(context) {
    return context.scope === "file" && Boolean(context.file);
  },
  evaluate(context) {
    if (context.file!.logicalLineCount > MAX_LOGICAL_LINES) {
      return [];
    }

    const sourceFile = context.runtime.store.getFileFact<ts.SourceFile>(
      context.file!.path,
      "file.ast",
    );
    if (!sourceFile) {
      return [];
    }

    const matches = findRecordCasts(sourceFile);
    if (matches.length === 0) {
      return [];
    }

    return [
      {
        ruleId: "types.generic-record-casts",
        family: "types",
        severity: "strong",
        scope: "file",
        path: context.file!.path,
        message: `Found ${matches.length} generic Record<string, unknown> cast${matches.length === 1 ? "" : "s"} on vague parsed/payload variables`,
        evidence: matches.map((match) => `line ${match.line}: ${match.kind}`),
        score: Math.min(8, matches.length * 2),
        locations: matches.map((match) => ({ path: context.file!.path, line: match.line })),
      },
    ];
  },
};
