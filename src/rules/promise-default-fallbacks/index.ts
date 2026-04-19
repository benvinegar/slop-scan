/**
 * Flags promise `.catch()` handlers that convert a rejected async path into a
 * cheap fallback value or an implicit `undefined`.
 *
 * This is intentionally narrower than the existing try/catch rules: it focuses
 * on promise-chain catch callbacks that quietly coerce failures into `null`,
 * `undefined`, `false`, `0`, `""`, `[]`, `{}`, or an empty handler body. That
 * pattern keeps control flow moving while hiding the original rejection.
 */
import * as ts from "typescript";
import type { RulePlugin } from "../../core/types";
import {
  getLineNumber,
  isDefaultLiteral,
  isLoggingCall,
  unwrapExpression,
  walk,
} from "../../facts/ts-helpers";
import { delta } from "../../rule-delta";

type PromiseDefaultFallbackMatch = {
  line: number;
  kind: "default-return" | "empty-handler" | "log+default";
};

function isCatchCall(node: ts.CallExpression): boolean {
  return ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "catch";
}

function getCatchHandler(node: ts.CallExpression): ts.ArrowFunction | ts.FunctionExpression | null {
  const [handler] = node.arguments;
  if (!handler) {
    return null;
  }

  return ts.isArrowFunction(handler) || ts.isFunctionExpression(handler) ? handler : null;
}

function statementIsLogging(statement: ts.Statement): boolean {
  return ts.isExpressionStatement(statement) && isLoggingCall(statement.expression);
}

function summarizeCatchHandler(
  handler: ts.ArrowFunction | ts.FunctionExpression,
  sourceFile: ts.SourceFile,
): PromiseDefaultFallbackMatch | null {
  if (ts.isBlock(handler.body)) {
    const statements = handler.body.statements;
    if (statements.length === 0) {
      return {
        line: getLineNumber(sourceFile, handler.getStart(sourceFile)),
        kind: "empty-handler",
      };
    }

    const returnStatements = statements.filter(ts.isReturnStatement);

    if (returnStatements.length !== 1) {
      return null;
    }

    const [returnStatement] = returnStatements;
    if (!returnStatement || !isDefaultLiteral(returnStatement.expression)) {
      return null;
    }

    const hasOnlyLoggingAndReturn = statements.every(
      (statement) => statement === returnStatement || statementIsLogging(statement),
    );
    if (!hasOnlyLoggingAndReturn) {
      return null;
    }

    return {
      line: getLineNumber(sourceFile, handler.getStart(sourceFile)),
      kind: statements.some(statementIsLogging) ? "log+default" : "default-return",
    };
  }

  return isDefaultLiteral(unwrapExpression(handler.body))
    ? {
        line: getLineNumber(sourceFile, handler.getStart(sourceFile)),
        kind: "default-return",
      }
    : null;
}

function findPromiseDefaultFallbacks(sourceFile: ts.SourceFile): PromiseDefaultFallbackMatch[] {
  const matches: PromiseDefaultFallbackMatch[] = [];

  walk(sourceFile, (node) => {
    if (!ts.isCallExpression(node) || !isCatchCall(node)) {
      return;
    }

    const handler = getCatchHandler(node);
    if (!handler) {
      return;
    }

    const match = summarizeCatchHandler(handler, sourceFile);
    if (match) {
      matches.push(match);
    }
  });

  return matches;
}

export const promiseDefaultFallbacksRule: RulePlugin = {
  id: "defensive.promise-default-fallbacks",
  family: "defensive",
  severity: "strong",
  scope: "file",
  requires: ["file.ast"],
  delta: delta.byLocations(),
  supports(context) {
    return context.scope === "file" && Boolean(context.file);
  },
  evaluate(context) {
    const sourceFile = context.runtime.store.getFileFact<ts.SourceFile>(
      context.file!.path,
      "file.ast",
    );
    if (!sourceFile) {
      return [];
    }

    const matches = findPromiseDefaultFallbacks(sourceFile);
    if (matches.length === 0) {
      return [];
    }

    return [
      {
        ruleId: "defensive.promise-default-fallbacks",
        family: "defensive",
        severity: "strong",
        scope: "file",
        path: context.file!.path,
        message: `Found ${matches.length} promise catch handler${matches.length === 1 ? "" : "s"} that suppress rejections with cheap fallbacks`,
        evidence: matches.map((match) => `line ${match.line}: ${match.kind}`),
        score: Math.min(
          8,
          matches.reduce((total, match) => total + (match.kind === "log+default" ? 2.5 : 2), 0),
        ),
        locations: matches.map((match) => ({ path: context.file!.path, line: match.line })),
      },
    ];
  },
};
