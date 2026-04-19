import * as ts from "typescript";
import type { RulePlugin } from "../../core/types";
import { getLineNumber, unwrapExpression, walk } from "../../facts/ts-helpers";
import { delta } from "../../rule-delta";

const MAX_LOGICAL_LINES = 5000;

type MatchKind =
  | "stringified-unknown-error"
  | "returned-stringified-unknown-error"
  | "property-stringified-unknown-error";

type StringifiedUnknownErrorMatch = {
  line: number;
  kind: MatchKind;
};

function isErrorIdentifier(expression: ts.Expression, allowedNames: Set<string>): boolean {
  const unwrapped = unwrapExpression(expression);
  return ts.isIdentifier(unwrapped) && allowedNames.has(unwrapped.text);
}

function isStringCallOfError(expression: ts.Expression, allowedNames: Set<string>): boolean {
  const unwrapped = unwrapExpression(expression);
  return (
    ts.isCallExpression(unwrapped) &&
    ts.isIdentifier(unwrapped.expression) &&
    unwrapped.expression.text === "String" &&
    unwrapped.arguments.length === 1 &&
    isErrorIdentifier(unwrapped.arguments[0]!, allowedNames)
  );
}

function isErrorMessageAccess(expression: ts.Expression, allowedNames: Set<string>): boolean {
  const unwrapped = unwrapExpression(expression);
  return (
    ts.isPropertyAccessExpression(unwrapped) &&
    unwrapped.name.text === "message" &&
    isErrorIdentifier(unwrapped.expression, allowedNames)
  );
}

function isErrorInstanceofCheck(expression: ts.Expression, allowedNames: Set<string>): boolean {
  const unwrapped = unwrapExpression(expression);
  return (
    ts.isBinaryExpression(unwrapped) &&
    unwrapped.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword &&
    isErrorIdentifier(unwrapped.left, allowedNames) &&
    ts.isIdentifier(unwrapExpression(unwrapped.right)) &&
    unwrapExpression(unwrapped.right).text === "Error"
  );
}

function summarizeConditional(
  node: ts.ConditionalExpression,
  sourceFile: ts.SourceFile,
): StringifiedUnknownErrorMatch | null {
  const allowedNames = new Set<string>();

  const condition = unwrapExpression(node.condition);
  if (
    ts.isBinaryExpression(condition) &&
    condition.operatorToken.kind === ts.SyntaxKind.BarBarToken
  ) {
    for (const side of [condition.left, condition.right]) {
      const unwrapped = unwrapExpression(side);
      if (
        ts.isBinaryExpression(unwrapped) &&
        unwrapped.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword
      ) {
        const left = unwrapExpression(unwrapped.left);
        if (ts.isIdentifier(left)) {
          allowedNames.add(left.text);
        }
      }
    }
  } else if (isErrorInstanceofCheck(condition, new Set(["error", "err", "e", "cause"]))) {
    const left = unwrapExpression((condition as ts.BinaryExpression).left) as ts.Identifier;
    allowedNames.add(left.text);
  }

  if (allowedNames.size === 0) {
    return null;
  }

  const whenTrue = unwrapExpression(node.whenTrue);
  const whenFalse = unwrapExpression(node.whenFalse);
  const isEitherDirection =
    (isErrorMessageAccess(whenTrue, allowedNames) &&
      isStringCallOfError(whenFalse, allowedNames)) ||
    (isErrorMessageAccess(whenFalse, allowedNames) && isStringCallOfError(whenTrue, allowedNames));

  if (!isEitherDirection) {
    return null;
  }

  let kind: MatchKind = "stringified-unknown-error";
  if (ts.isReturnStatement(node.parent)) {
    kind = "returned-stringified-unknown-error";
  } else if (ts.isPropertyAssignment(node.parent)) {
    kind = "property-stringified-unknown-error";
  }

  return {
    line: getLineNumber(sourceFile, node.getStart(sourceFile)),
    kind,
  };
}

function findStringifiedUnknownErrors(sourceFile: ts.SourceFile): StringifiedUnknownErrorMatch[] {
  const matches: StringifiedUnknownErrorMatch[] = [];

  walk(sourceFile, (node) => {
    if (!ts.isConditionalExpression(node)) {
      return;
    }

    const match = summarizeConditional(node, sourceFile);
    if (match) {
      matches.push(match);
    }
  });

  return matches;
}

export const stringifiedUnknownErrorsRule: RulePlugin = {
  id: "defensive.stringified-unknown-errors",
  family: "defensive",
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

    const matches = findStringifiedUnknownErrors(sourceFile);
    if (matches.length === 0) {
      return [];
    }

    return [
      {
        ruleId: "defensive.stringified-unknown-errors",
        family: "defensive",
        severity: "strong",
        scope: "file",
        path: context.file!.path,
        message: `Found ${matches.length} unknown-error normalization${matches.length === 1 ? "" : "s"} that collapse caught values into generic strings`,
        evidence: matches.map((match) => `line ${match.line}: ${match.kind}`),
        score: Math.min(8, matches.length * 2),
        locations: matches.map((match) => ({ path: context.file!.path, line: match.line })),
      },
    ];
  },
};
