import * as ts from "typescript";
import type { FactProvider } from "../core/types";
import type { TryCatchSummary } from "./types";
import {
  getEnclosingFunctionName,
  getExpressionPath,
  getLineNumber,
  isDefaultLiteral,
  isLoggingCall,
  unwrapExpression,
  walk,
} from "./ts-helpers";

const FILE_SYSTEM_ROOTS = new Set(["fs", "fsp", "fsPromises", "promises"]);
const FILE_SYSTEM_METHODS = new Set([
  "access",
  "accessSync",
  "appendFile",
  "appendFileSync",
  "chmod",
  "chmodSync",
  "copyFile",
  "copyFileSync",
  "createReadStream",
  "createWriteStream",
  "existsSync",
  "lstat",
  "lstatSync",
  "mkdir",
  "mkdirSync",
  "mkdtemp",
  "mkdtempSync",
  "open",
  "openSync",
  "readFile",
  "readFileSync",
  "readdir",
  "readdirSync",
  "readlink",
  "readlinkSync",
  "realpath",
  "realpathSync",
  "rename",
  "renameSync",
  "rm",
  "rmSync",
  "stat",
  "statSync",
  "symlink",
  "symlinkSync",
  "unlink",
  "unlinkSync",
  "watch",
  "watchFile",
  "writeFile",
  "writeFileSync",
]);
const FILE_SYSTEM_EXISTENCE_METHODS = new Set([
  "access",
  "accessSync",
  "existsSync",
  "lstat",
  "lstatSync",
  "realpath",
  "realpathSync",
  "stat",
  "statSync",
]);
const PROCESS_METHODS = new Set([
  "exec",
  "execFile",
  "execFileSync",
  "execSync",
  "kill",
  "spawn",
  "spawnSync",
]);
const NETWORK_ROOTS = new Set(["axios", "fetch", "got", "request"]);
const BROWSER_ROOTS = new Set([
  "browser",
  "chrome",
  "context",
  "document",
  "history",
  "localStorage",
  "location",
  "navigator",
  "page",
  "sessionStorage",
  "window",
]);
const BROWSER_METHODS = new Set([
  "click",
  "evaluate",
  "goto",
  "hover",
  "reload",
  "screenshot",
  "type",
]);

function collectBoundarySignals(node: ts.TryStatement): {
  categories: string[];
  operationPaths: string[];
} {
  const categories = new Set<string>();
  const operationPaths = new Set<string>();

  walk(node.tryBlock, (child) => {
    if (ts.isCallExpression(child) || ts.isNewExpression(child)) {
      const path = getExpressionPath(
        ts.isCallExpression(child) ? child.expression : (child.expression ?? child),
      );
      if (path.length === 0) {
        return;
      }

      operationPaths.add(path.join("."));

      const [root] = path;
      const last = path.at(-1) ?? "";

      if (FILE_SYSTEM_ROOTS.has(root) || FILE_SYSTEM_METHODS.has(last)) {
        categories.add("filesystem");
      }

      if (NETWORK_ROOTS.has(root) || last === "fetch") {
        categories.add("network");
      }

      if (root === "Bun" || root === "Deno" || root === "process" || PROCESS_METHODS.has(last)) {
        categories.add("process");
      }

      if (BROWSER_ROOTS.has(root) || BROWSER_METHODS.has(last)) {
        categories.add("browser");
      }

      if (
        (path.length === 2 && path[0] === "JSON" && path[1] === "parse") ||
        (path.length === 2 && path[0] === "process" && path[1] === "env")
      ) {
        categories.add("config");
      }
    }

    if (ts.isPropertyAccessExpression(child)) {
      const path = getExpressionPath(child);
      if (path.length === 2 && path[0] === "process" && path[1] === "env") {
        categories.add("config");
      }
    }
  });

  return {
    categories: [...categories].sort(),
    operationPaths: [...operationPaths].sort(),
  };
}

function extractBlockComments(block: ts.Block, sourceFile: ts.SourceFile): string[] {
  const contentStart = block.getStart(sourceFile) + 1;
  const contentEnd = block.end - 1;
  if (contentEnd <= contentStart) {
    return [];
  }

  const content = sourceFile.text.slice(contentStart, contentEnd);
  const rawComments = content.match(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g) ?? [];

  return rawComments
    .map((raw) => {
      if (raw.startsWith("//")) {
        return raw.slice(2).trim();
      }

      return raw
        .slice(2, -2)
        .replace(/^\s*\*\s?/gm, "")
        .trim();
    })
    .filter(Boolean);
}

function isAssignmentOperator(kind: ts.SyntaxKind): boolean {
  return (
    kind === ts.SyntaxKind.EqualsToken ||
    kind === ts.SyntaxKind.BarBarEqualsToken ||
    kind === ts.SyntaxKind.AmpersandAmpersandEqualsToken ||
    kind === ts.SyntaxKind.QuestionQuestionEqualsToken ||
    kind === ts.SyntaxKind.PlusEqualsToken ||
    kind === ts.SyntaxKind.MinusEqualsToken ||
    kind === ts.SyntaxKind.AsteriskEqualsToken ||
    kind === ts.SyntaxKind.AsteriskAsteriskEqualsToken ||
    kind === ts.SyntaxKind.SlashEqualsToken ||
    kind === ts.SyntaxKind.PercentEqualsToken ||
    kind === ts.SyntaxKind.LessThanLessThanEqualsToken ||
    kind === ts.SyntaxKind.GreaterThanGreaterThanEqualsToken ||
    kind === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken ||
    kind === ts.SyntaxKind.AmpersandEqualsToken ||
    kind === ts.SyntaxKind.BarEqualsToken ||
    kind === ts.SyntaxKind.CaretEqualsToken
  );
}

function isLocalBindingName(name: ts.BindingName): boolean {
  if (ts.isIdentifier(name)) {
    return true;
  }

  if (ts.isObjectBindingPattern(name)) {
    return name.elements.every((element) => isLocalBindingName(element.name));
  }

  return name.elements.every((element) => {
    if (ts.isOmittedExpression(element)) {
      return true;
    }

    return isLocalBindingName(element.name);
  });
}

function isLocalAssignmentTarget(expression: ts.Expression): boolean {
  return ts.isIdentifier(unwrapExpression(expression));
}

function resolvesLocalValuesInStatement(statement: ts.Statement): boolean {
  if (ts.isBlock(statement)) {
    return statement.statements.every(resolvesLocalValuesInStatement);
  }

  if (ts.isIfStatement(statement)) {
    return (
      resolvesLocalValuesInStatement(statement.thenStatement) &&
      (!statement.elseStatement || resolvesLocalValuesInStatement(statement.elseStatement))
    );
  }

  if (ts.isVariableStatement(statement)) {
    return statement.declarationList.declarations.every(
      (declaration) => Boolean(declaration.initializer) && isLocalBindingName(declaration.name),
    );
  }

  if (ts.isExpressionStatement(statement)) {
    const expression = unwrapExpression(statement.expression);
    return (
      ts.isBinaryExpression(expression) &&
      isAssignmentOperator(expression.operatorToken.kind) &&
      isLocalAssignmentTarget(expression.left)
    );
  }

  return false;
}

function resolvesLocalValuesInTryBlock(tryBlock: ts.Block): boolean {
  return (
    tryBlock.statements.length > 0 &&
    tryBlock.statements.length <= 4 &&
    tryBlock.statements.every(resolvesLocalValuesInStatement)
  );
}

function isFilesystemExistenceProbe(
  tryStatementCount: number,
  catchReturnsDefault: boolean,
  catchThrowsGeneric: boolean,
  operationPaths: string[],
): boolean {
  return (
    tryStatementCount <= 2 &&
    (catchReturnsDefault || catchThrowsGeneric) &&
    operationPaths.length > 0 &&
    operationPaths.every((operationPath) =>
      FILE_SYSTEM_EXISTENCE_METHODS.has(operationPath.split(".").at(-1) ?? ""),
    )
  );
}

function summarizeTryStatement(node: ts.TryStatement, sourceFile: ts.SourceFile): TryCatchSummary {
  const catchBlock = node.catchClause?.block;
  const catchStatements = catchBlock?.statements ?? [];
  const catchComments = catchBlock ? extractBlockComments(catchBlock, sourceFile) : [];

  const catchHasLogging = catchStatements.some(
    (statement) => ts.isExpressionStatement(statement) && isLoggingCall(statement.expression),
  );

  const catchHasDefaultReturn = catchStatements.some(
    (statement) => ts.isReturnStatement(statement) && isDefaultLiteral(statement.expression),
  );

  const catchLogsOnly =
    catchStatements.length > 0 &&
    catchStatements.every(
      (statement) => ts.isExpressionStatement(statement) && isLoggingCall(statement.expression),
    );

  const catchReturnsDefault =
    catchStatements.length === 1 &&
    ts.isReturnStatement(catchStatements[0]) &&
    isDefaultLiteral(catchStatements[0].expression);

  const catchThrowsGeneric =
    catchStatements.length === 1 &&
    ts.isThrowStatement(catchStatements[0]) &&
    Boolean(catchStatements[0].expression) &&
    (ts.isNewExpression(catchStatements[0].expression!) ||
      ts.isStringLiteral(catchStatements[0].expression!));
  const boundary = collectBoundarySignals(node);
  const tryStatementCount = node.tryBlock.statements.length;
  const tryResolvesLocalValues = resolvesLocalValuesInTryBlock(node.tryBlock);

  return {
    line: getLineNumber(sourceFile, node.getStart(sourceFile)),
    enclosingSymbol: getEnclosingFunctionName(node, sourceFile),
    hasCatchClause: Boolean(node.catchClause),
    tryStatementCount,
    catchStatementCount: catchStatements.length,
    catchLogsOnly,
    catchReturnsDefault,
    catchHasLogging,
    catchHasDefaultReturn,
    catchIsEmpty: catchStatements.length === 0,
    catchHasComment: catchComments.length > 0,
    catchThrowsGeneric,
    boundaryCategories: boundary.categories,
    boundaryOperationPaths: boundary.operationPaths,
    isFilesystemExistenceProbe: isFilesystemExistenceProbe(
      tryStatementCount,
      catchReturnsDefault,
      catchThrowsGeneric,
      boundary.operationPaths,
    ),
    tryResolvesLocalValues,
    isDocumentedLocalFallback:
      catchComments.length > 0 && tryResolvesLocalValues && boundary.operationPaths.length > 0,
  };
}

export const tryCatchFactProvider: FactProvider = {
  id: "fact.file.tryCatch",
  scope: "file",
  requires: ["file.ast"],
  provides: ["file.tryCatchSummaries"],
  supports(context) {
    return context.scope === "file" && Boolean(context.file);
  },
  run(context) {
    const sourceFile = context.runtime.store.getFileFact<ts.SourceFile>(
      context.file!.path,
      "file.ast",
    );
    if (!sourceFile) {
      return { "file.tryCatchSummaries": [] satisfies TryCatchSummary[] };
    }

    const summaries: TryCatchSummary[] = [];
    walk(sourceFile, (node) => {
      if (ts.isTryStatement(node)) {
        summaries.push(summarizeTryStatement(node, sourceFile));
      }
    });

    return { "file.tryCatchSummaries": summaries };
  },
};
