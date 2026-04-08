import * as ts from "typescript";
import type { FactProvider } from "../core/types";
import type { TestMockSetupSummary } from "./types";
import { fingerprintNodeShape, getExpressionPath, getLineNumber, isTestFile } from "./ts-helpers";

const MOCK_PATH_PATTERNS = [
  "vi.mock",
  "jest.mock",
  "vi.spyOn",
  "jest.spyOn",
  "sinon.stub",
  "sinon.spy",
  "mockImplementation",
  "mockImplementationOnce",
  "mockReturnValue",
  "mockReturnValueOnce",
  "mockResolvedValue",
  "mockResolvedValueOnce",
  "mockRejectedValue",
  "mockRejectedValueOnce",
  "mockReset",
  "mockClear",
  "mockRestore",
];

function matchesMockPath(path: string): boolean {
  return MOCK_PATH_PATTERNS.some((pattern) => path === pattern || path.endsWith(`.${pattern}`));
}

interface PendingStatementSummary {
  node: ts.Statement;
  line: number;
  labels: Set<string>;
}

export const testMockSetupsFactProvider: FactProvider = {
  id: "fact.file.test-mock-setups",
  scope: "file",
  requires: ["file.ast"],
  provides: ["file.testMockSetups"],
  supports(context) {
    return context.scope === "file" && Boolean(context.file);
  },
  run(context) {
    const file = context.file!;
    if (!isTestFile(file.path)) {
      return { "file.testMockSetups": [] satisfies TestMockSetupSummary[] };
    }

    const sourceFile = context.runtime.store.getFileFact<ts.SourceFile>(file.path, "file.ast");
    if (!sourceFile) {
      return { "file.testMockSetups": [] satisfies TestMockSetupSummary[] };
    }

    const activeStatements: PendingStatementSummary[] = [];
    const pendingStatements: PendingStatementSummary[] = [];

    function visit(node: ts.Node): void {
      let currentStatement: PendingStatementSummary | null = null;

      if (ts.isStatement(node)) {
        currentStatement = {
          node,
          line: getLineNumber(sourceFile, node.getStart(sourceFile)),
          labels: new Set<string>(),
        };
        activeStatements.push(currentStatement);
        pendingStatements.push(currentStatement);
      }

      if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
        const expression = ts.isCallExpression(node) ? node.expression : node.expression;
        if (expression) {
          const path = getExpressionPath(expression).join(".");
          if (path && matchesMockPath(path)) {
            for (const statement of activeStatements) {
              statement.labels.add(path);
            }
          }
        }
      }

      node.forEachChild(visit);

      if (currentStatement) {
        activeStatements.pop();
      }
    }

    visit(sourceFile);

    const setups: TestMockSetupSummary[] = [];
    for (const statement of pendingStatements) {
      const labels = [...statement.labels].sort();
      if (labels.length === 0) {
        continue;
      }

      setups.push({
        line: statement.line,
        label: labels.join(" | "),
        fingerprint: `${labels.join("|")}::${fingerprintNodeShape(statement.node, 5)}`,
      });
    }

    return { "file.testMockSetups": setups };
  },
};
